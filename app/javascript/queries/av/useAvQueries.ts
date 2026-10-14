import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { getAuthToken } from "../../lib/authTokenProvider";
import type { AvRow, ReviewComment, ReviewLink, ReviewSummary } from "../../types/api";
import { versionKeys } from "../versions/useVersionQueries";

export const avKeys = {
  rows: (versionId: number) => ["av-rows", versionId] as const,
  links: (versionId: number) => ["review-links", versionId] as const,
  comments: (versionId: number) => ["review-comments", versionId] as const,
};

export type AvRowFields = Partial<Pick<AvRow, "shot" | "video" | "audio" | "super_text" | "duration_seconds" | "notes">>;

export const useAvRowsQuery = (versionId: number, enabled = true) =>
  useQuery<AvRow[]>({
    queryKey: avKeys.rows(versionId),
    queryFn: async () => {
      const response = await request<AvRow[]>(OpenAPI, { method: "GET", url: `/v1/script_versions/${versionId}/av_rows` });
      return response as unknown as AvRow[];
    },
    enabled: enabled && !!versionId,
  });

const invalidateRound = (queryClient: ReturnType<typeof useQueryClient>, versionId: number) => {
  queryClient.invalidateQueries({ queryKey: avKeys.rows(versionId) });
  queryClient.invalidateQueries({ queryKey: versionKeys.revisions(versionId) });
};

export const useAddAvRowMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<AvRow, Error, AvRowFields & { after_row_id?: number }>({
    mutationFn: async (body) => {
      const response = await request<AvRow>(OpenAPI, { method: "POST", url: `/v1/script_versions/${versionId}/av_rows`, body, mediaType: "application/json" });
      return response as unknown as AvRow;
    },
    onSuccess: () => invalidateRound(queryClient, versionId),
  });
};

/** Field edits are applied to the cache immediately; the server answer replaces them. */
export const useUpdateAvRowMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<AvRow, Error, { id: number } & AvRowFields, { previous?: AvRow[] }>({
    mutationFn: async ({ id, ...body }) => {
      const response = await request<AvRow>(OpenAPI, { method: "PUT", url: `/v1/av_rows/${id}`, body, mediaType: "application/json" });
      return response as unknown as AvRow;
    },
    onMutate: async ({ id, ...fields }) => {
      await queryClient.cancelQueries({ queryKey: avKeys.rows(versionId) });
      const previous = queryClient.getQueryData<AvRow[]>(avKeys.rows(versionId));
      if (previous) {
        queryClient.setQueryData<AvRow[]>(avKeys.rows(versionId), previous.map((r) => (r.id === id ? { ...r, ...fields } : r)));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(avKeys.rows(versionId), ctx.previous);
    },
    onSuccess: (row) => {
      queryClient.setQueryData<AvRow[]>(avKeys.rows(versionId), (rows) => (rows || []).map((r) => (r.id === row.id ? row : r)));
      queryClient.invalidateQueries({ queryKey: versionKeys.revisions(versionId) });
    },
  });
};

export const useDeleteAvRowMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await request<void>(OpenAPI, { method: "DELETE", url: `/v1/av_rows/${id}` });
    },
    onSuccess: () => invalidateRound(queryClient, versionId),
  });
};

export const useReorderAvRowsMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<AvRow[], Error, number[]>({
    mutationFn: async (row_ids) => {
      const response = await request<AvRow[]>(OpenAPI, { method: "PUT", url: `/v1/script_versions/${versionId}/av_rows/reorder`, body: { row_ids }, mediaType: "application/json" });
      return response as unknown as AvRow[];
    },
    onMutate: async (rowIds) => {
      await queryClient.cancelQueries({ queryKey: avKeys.rows(versionId) });
      const previous = queryClient.getQueryData<AvRow[]>(avKeys.rows(versionId));
      if (previous) {
        const byId = new Map(previous.map((r) => [r.id, r]));
        queryClient.setQueryData<AvRow[]>(avKeys.rows(versionId), rowIds.map((id, i) => ({ ...byId.get(id)!, position: i + 1 })));
      }
    },
    onSuccess: (rows) => queryClient.setQueryData(avKeys.rows(versionId), rows),
    onError: () => invalidateRound(queryClient, versionId),
  });
};

export async function downloadShotList(versionId: number): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/v1/script_versions/${versionId}/shot_list`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`Shot list export failed (${response.status})`);
  const blob = await response.blob();
  const match = (response.headers.get("Content-Disposition") || "").match(/filename="?([^";]+)"?/);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = match?.[1] || "shot-list.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// --- Client review (writer side) ------------------------------------------

export const useReviewLinksQuery = (versionId: number, enabled = true) =>
  useQuery<ReviewLink[]>({
    queryKey: avKeys.links(versionId),
    queryFn: async () => {
      const response = await request<ReviewLink[]>(OpenAPI, { method: "GET", url: `/v1/script_versions/${versionId}/review_links` });
      return response as unknown as ReviewLink[];
    },
    enabled: enabled && !!versionId,
    refetchInterval: 30_000,
  });

export const useCreateReviewLinkMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<ReviewLink, Error, { client_name?: string; expires_in_days?: number }>({
    mutationFn: async (body) => {
      const response = await request<ReviewLink>(OpenAPI, { method: "POST", url: `/v1/script_versions/${versionId}/review_links`, body, mediaType: "application/json" });
      return response as unknown as ReviewLink;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: avKeys.links(versionId) }),
  });
};

export const useRevokeReviewLinkMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<ReviewLink, Error, number>({
    mutationFn: async (id) => {
      const response = await request<ReviewLink>(OpenAPI, { method: "DELETE", url: `/v1/review_links/${id}` });
      return response as unknown as ReviewLink;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: avKeys.links(versionId) }),
  });
};

export const useReviewCommentsQuery = (versionId: number, enabled = true) =>
  useQuery<ReviewComment[]>({
    queryKey: avKeys.comments(versionId),
    queryFn: async () => {
      const response = await request<ReviewComment[]>(OpenAPI, { method: "GET", url: `/v1/script_versions/${versionId}/review_comments` });
      return response as unknown as ReviewComment[];
    },
    enabled: enabled && !!versionId,
    refetchInterval: 30_000,
  });

export interface CarriedNote extends ReviewComment {
  previous_position: number | null;
  row_id: number | null;
  position: number | null;
  scene_id_now: number | null;
}

export interface CarriedNotes {
  previous_round: { id: number; version_number: number; review: ReviewSummary } | null;
  notes: CarriedNote[];
}

/** Open client notes from the previous round, mapped onto this round's rows. */
export const useCarriedNotesQuery = (versionId: number, enabled = true) =>
  useQuery<CarriedNotes>({
    queryKey: [...avKeys.comments(versionId), "carried"],
    queryFn: async () => {
      const response = await request<CarriedNotes>(OpenAPI, { method: "GET", url: `/v1/script_versions/${versionId}/carried_notes` });
      return response as unknown as CarriedNotes;
    },
    enabled: enabled && !!versionId,
  });

export const useResolveReviewCommentMutation = (versionId: number) => {
  const queryClient = useQueryClient();
  return useMutation<ReviewComment, Error, { id: number; resolved: boolean }>({
    mutationFn: async ({ id, resolved }) => {
      const response = await request<ReviewComment>(OpenAPI, { method: "PUT", url: `/v1/review_comments/${id}/resolve`, body: { resolved }, mediaType: "application/json" });
      return response as unknown as ReviewComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-comments"] });
      queryClient.invalidateQueries({ queryKey: ["review-links"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
};

export const formatSeconds = (total: number | null | undefined): string => {
  const s = Math.max(0, Math.round(total || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
