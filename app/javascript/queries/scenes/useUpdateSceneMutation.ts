import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import type { Scene } from "../../types/api";
import { sceneKeys } from "./useScenesQuery";

export interface UpdateSceneData {
  id: number;
  scene_number?: number;
  slugline?: string;
  content?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export const useUpdateSceneMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Scene, Error, UpdateSceneData>({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      const response = await request<Scene>(OpenAPI, {
        method: "PUT",
        url: `/v1/scenes/${id}`,
        body: updateData,
        mediaType: "application/json",
      });
      return response as unknown as Scene;
    },
    onSuccess: (updatedScene) => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
      queryClient.setQueryData(sceneKeys.detail(updatedScene.id), updatedScene);
    },
  });
};
