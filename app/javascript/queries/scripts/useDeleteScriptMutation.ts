import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import { scriptKeys } from "./useScriptsQuery";

interface DeleteScriptResponse {
  message: string;
}

export const useDeleteScriptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteScriptResponse, Error, number>({
    mutationFn: async (scriptId: number) => {
      const response = await request<DeleteScriptResponse>(OpenAPI, {
        method: "DELETE",
        url: `/v1/scripts/${scriptId}`,
        mediaType: "application/json",
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate scripts list to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.all });
    },
  });
};


