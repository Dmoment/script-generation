import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import { projectTypeKeys } from "./useProjectTypesQuery";
import type { ProjectType } from "./useProjectTypesQuery";

interface CreateProjectTypeData {
  name: string;
}

interface CreateProjectTypeResponse extends ProjectType {}

export const useCreateProjectTypeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateProjectTypeResponse, Error, CreateProjectTypeData>({
    mutationFn: async (data: CreateProjectTypeData) => {
      const response = await request<CreateProjectTypeResponse>(OpenAPI, {
        method: "POST",
        url: "/v1/project_types",
        body: data,
        mediaType: "application/json",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTypeKeys.all });
    },
  });
};
