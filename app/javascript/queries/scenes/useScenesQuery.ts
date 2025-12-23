import { useQuery } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import type { Scene } from "../../types/api";

export interface UseScenesQueryOptions {
  scriptVersionId: number;
  enabled?: boolean;
}

export const sceneKeys = {
  all: ["scenes"] as const,
  byVersion: (versionId: number) =>
    [...sceneKeys.all, "version", versionId] as const,
  detail: (id: number) => [...sceneKeys.all, "detail", id] as const,
};

export const useScenesQuery = (options: UseScenesQueryOptions) => {
  const { scriptVersionId, enabled = true } = options;

  return useQuery<Scene[]>({
    queryKey: sceneKeys.byVersion(scriptVersionId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("script_version_id", String(scriptVersionId));

      const response = await request<{ data: Scene[]; pagination: any }>(
        OpenAPI,
        {
          method: "GET",
          url: `/v1/scenes?${params.toString()}`,
          mediaType: "application/json",
        }
      );

      return response.data || [];
    },
    enabled: enabled && !!scriptVersionId,
  });
};
