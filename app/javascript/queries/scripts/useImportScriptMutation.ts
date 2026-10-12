import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import { sceneKeys } from "../scenes/useScenesQuery";

export interface ImportScriptData {
  scriptVersionId: number;
  file: File;
}

export interface ImportScriptResult {
  message: string;
  format: "fdx" | "fountain";
  scenes_count: number;
  elements_count: number;
}

/** Replace a version's scenes with a Final Draft, Fountain or plain-text file. */
export const useImportScriptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ImportScriptResult, Error, ImportScriptData>({
    mutationFn: async ({ scriptVersionId, file }) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await request<ImportScriptResult>(OpenAPI, {
        method: "POST",
        url: `/v1/script_versions/${scriptVersionId}/import`,
        mediaType: "multipart/form-data",
        body: formData as any,
      });
      return response as unknown as ImportScriptResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
    },
  });
};
