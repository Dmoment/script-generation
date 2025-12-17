import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '../../types/generated/core/OpenAPI';
import { request } from '../../types/generated/core/request';
import { projectKeys } from './useProjectsQuery';
import type { Project } from '../../types/api';

export interface CreateProjectData {
  title: string;
  project_type: string;
}

interface CreateProjectResponse extends Project {}

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateProjectResponse, Error, CreateProjectData>({
    mutationFn: async (data: CreateProjectData) => {
      const response = await request<CreateProjectResponse>(OpenAPI, {
        method: 'POST',
        url: '/v1/projects',
        body: data,
        mediaType: 'application/json',
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

