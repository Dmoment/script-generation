import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { sceneKeys } from "../scenes/useScenesQuery";

export interface FormatChange {
  scene_id: number;
  element_index: number;
  type: string;
  original: { type: string; text: string };
  formatted: { type: string; text: string };
}

export interface FormatPreviewResponse {
  total_changes: number;
  changes: FormatChange[];
  formatted_scenes: Array<{
    id: number;
    scene_number: number;
    slugline: string;
    original_slugline: string;
    elements: Array<{ type: string; text: string }>;
    original_elements: Array<{ type: string; text: string }>;
  }>;
}

export interface ApplyFormatResponse {
  message: string;
  total_changes: number;
  scenes_updated: number;
}

// Preview formatting changes
export const useFormatPreviewQuery = () => {
  return useMutation<FormatPreviewResponse, Error, number>({
    mutationFn: async (scriptVersionId: number) => {
      const response = await request<FormatPreviewResponse>(OpenAPI, {
        method: "GET",
        url: `/v1/script_versions/${scriptVersionId}/format_preview`,
      });
      return response as unknown as FormatPreviewResponse;
    },
  });
};

// Apply formatting
export const useApplyFormatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ApplyFormatResponse, Error, number>({
    mutationFn: async (scriptVersionId: number) => {
      const response = await request<ApplyFormatResponse>(OpenAPI, {
        method: "POST",
        url: `/v1/script_versions/${scriptVersionId}/apply_formatting`,
      });
      return response as unknown as ApplyFormatResponse;
    },
    onSuccess: () => {
      // Invalidate scenes to refetch with new formatting
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
    },
  });
};

