import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import type { Scene } from "../../types/api";
import { sceneKeys } from "./useScenesQuery";

export interface ReorderScenesData {
  scriptVersionId: number;
  sceneIds: number[];
}

/**
 * Reorders every scene of a version in one request. The server renumbers
 * scene_number and order to follow the id sequence, so the corkboard, the
 * scene list and the editor all reflow together.
 */
export const useReorderScenesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Scene[], Error, ReorderScenesData>({
    mutationFn: async ({ scriptVersionId, sceneIds }) => {
      const response = await request<Scene[]>(OpenAPI, {
        method: "PUT",
        url: `/v1/script_versions/${scriptVersionId}/reorder_scenes`,
        body: { scene_ids: sceneIds },
        mediaType: "application/json",
      });
      return response as unknown as Scene[];
    },
    onMutate: async ({ scriptVersionId, sceneIds }) => {
      // Optimistic reflow so cards do not snap back while the request is in flight.
      await queryClient.cancelQueries({ queryKey: sceneKeys.byVersion(scriptVersionId) });
      const previous = queryClient.getQueryData<Scene[]>(sceneKeys.byVersion(scriptVersionId));
      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]));
        const reordered = sceneIds
          .map((id, index) => {
            const scene = byId.get(id);
            return scene ? { ...scene, order: index + 1, scene_number: index + 1 } : null;
          })
          .filter((s): s is Scene => s !== null);
        queryClient.setQueryData(sceneKeys.byVersion(scriptVersionId), reordered);
      }
      return { previous };
    },
    onError: (_error, { scriptVersionId }, context) => {
      const ctx = context as { previous?: Scene[] } | undefined;
      if (ctx?.previous) queryClient.setQueryData(sceneKeys.byVersion(scriptVersionId), ctx.previous);
    },
    onSuccess: (scenes, { scriptVersionId }) => {
      queryClient.setQueryData(sceneKeys.byVersion(scriptVersionId), scenes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
    },
  });
};
