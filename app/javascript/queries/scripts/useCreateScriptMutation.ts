import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import type { Script } from "../../types/api";

export interface CreateScriptData {
  project_id: number | string;
  title: string;
  script_type: string;
  description?: string;
  content?: string;
}

export const useCreateScriptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Script, Error, CreateScriptData>({
    mutationFn: async (data) => {
      const response = await request<Script>(OpenAPI, {
        method: "POST",
        url: "/v1/scripts",
        mediaType: "application/json",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate scripts queries to refetch
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
};

