import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import type { Scene } from "../../types/api";
import { sceneKeys } from "./useScenesQuery";

export interface CreateSceneData {
  script_version_id: number;
  scene_number: number;
  slugline?: string;
  content?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export const useCreateSceneMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Scene, Error, CreateSceneData>({
    mutationFn: async (data) => {
      const response = await request<Scene>(OpenAPI, {
        method: "POST",
        url: "/v1/scenes",
        body: data,
        mediaType: "application/json",
      });
      return response as unknown as Scene;
    },
    onSuccess: (newScene) => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
      queryClient.setQueryData(sceneKeys.detail(newScene.id), newScene);
    },
  });
};
