import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import type { ScreenplayElement, ScriptVersion } from "../../types/api";
import { sceneKeys } from "../scenes/useScenesQuery";

export const versionKeys = {
  all: ["versions"] as const,
  revisions: (versionId: number) => [...versionKeys.all, "revisions", versionId] as const,
  compare: (versionId: number, withId: number) => [...versionKeys.all, "compare", versionId, withId] as const,
  breakdown: (versionId: number) => [...versionKeys.all, "breakdown", versionId] as const,
};

/** Create the next draft of a script (copies the latest or given version). */
export const useCreateVersionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ScriptVersion, Error, { scriptId: number; notes?: string; sourceVersionId?: number }>({
    mutationFn: async ({ scriptId, notes, sourceVersionId }) => {
      const response = await request<ScriptVersion>(OpenAPI, {
        method: "POST",
        url: `/v1/scripts/${scriptId}/versions`,
        body: { notes, source_version_id: sourceVersionId },
        mediaType: "application/json",
      });
      return response as unknown as ScriptVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      queryClient.invalidateQueries({ queryKey: versionKeys.all });
    },
  });
};

export interface RevisionsResult {
  previous_version: { id: number; version_number: number } | null;
  changed_scene_ids: number[];
}

/** Scenes revised since the previous draft (drives revision marks). */
export const useRevisionsQuery = (versionId: number, enabled = true) =>
  useQuery<RevisionsResult>({
    queryKey: versionKeys.revisions(versionId),
    queryFn: async () => {
      const response = await request<RevisionsResult>(OpenAPI, {
        method: "GET",
        url: `/v1/script_versions/${versionId}/revisions`,
      });
      return response as unknown as RevisionsResult;
    },
    enabled: enabled && !!versionId,
  });

export interface DiffChange {
  op: "same" | "add" | "del";
  element: ScreenplayElement;
}
export interface DiffScene {
  status: "changed" | "unchanged" | "added" | "removed";
  scene_number: number;
  slugline: string | null;
  base_scene_id: number | null;
  target_scene_id: number | null;
  changes: DiffChange[];
}
export interface CompareResult {
  base: { id: number; version_number: number; notes?: string };
  target: { id: number; version_number: number; notes?: string };
  summary: Partial<Record<DiffScene["status"], number>>;
  scenes: DiffScene[];
}

export const useCompareQuery = (versionId: number, withId: number | null) =>
  useQuery<CompareResult>({
    queryKey: versionKeys.compare(versionId, withId ?? 0),
    queryFn: async () => {
      const response = await request<CompareResult>(OpenAPI, {
        method: "GET",
        url: `/v1/script_versions/${versionId}/compare?with=${withId}`,
      });
      return response as unknown as CompareResult;
    },
    enabled: !!versionId && !!withId,
  });

export interface BreakdownItem {
  name: string;
  scene_numbers: number[];
}
export interface BreakdownCategory {
  key: string;
  label: string;
  items: BreakdownItem[];
}
export interface BreakdownResult {
  version_id: number;
  categories: BreakdownCategory[];
  scenes: Array<{ scene_id: number; scene_number: number; slugline: string | null; items: Record<string, string[]> }>;
}

export const useBreakdownQuery = (versionId: number, enabled = true) =>
  useQuery<BreakdownResult>({
    queryKey: versionKeys.breakdown(versionId),
    queryFn: async () => {
      const response = await request<BreakdownResult>(OpenAPI, {
        method: "GET",
        url: `/v1/script_versions/${versionId}/breakdown`,
      });
      return response as unknown as BreakdownResult;
    },
    enabled: enabled && !!versionId,
  });

/** Invalidate everything derived from scenes after a metadata edit. */
export const invalidateSceneDerived = (queryClient: ReturnType<typeof useQueryClient>, versionId: number) => {
  queryClient.invalidateQueries({ queryKey: sceneKeys.all });
  queryClient.invalidateQueries({ queryKey: versionKeys.breakdown(versionId) });
  queryClient.invalidateQueries({ queryKey: versionKeys.revisions(versionId) });
};
