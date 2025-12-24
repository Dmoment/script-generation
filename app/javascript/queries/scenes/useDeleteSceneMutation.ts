import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { sceneKeys } from "./useScenesQuery";

export const useDeleteSceneMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (sceneId: number) => {
      await request<void>(OpenAPI, {
        method: "DELETE",
        url: `/v1/scenes/${sceneId}`,
        mediaType: "application/json",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
    },
  });
};


