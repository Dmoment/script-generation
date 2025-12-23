import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import { scriptKeys } from "./useScriptsQuery";

interface DeleteScriptVersionResponse {
  message: string;
}

export const useDeleteScriptVersionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteScriptVersionResponse, Error, number>({
    mutationFn: async (versionId: number) => {
      const response = await request<DeleteScriptVersionResponse>(OpenAPI, {
        method: "DELETE",
        url: `/v1/script_versions/${versionId}`,
        mediaType: "application/json",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scriptKeys.all });
    },
  });
};

