import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '../../types/generated/core/OpenAPI';
import { request } from '../../types/generated/core/request';

export interface ProjectType {
  id: number;
  name: string;
}

interface ProjectTypesResponse extends Array<ProjectType> {}

export const projectTypeKeys = {
  all: ['projectTypes'] as const,
  search: (query: string) => [...projectTypeKeys.all, 'search', query] as const,
};

export const useProjectTypesQuery = (searchQuery?: string) => {
  return useQuery<ProjectTypesResponse, Error>({
    queryKey: projectTypeKeys.search(searchQuery || ''),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      params.append('limit', '20');

      const response = await request<ProjectTypesResponse>(OpenAPI, {
        method: 'GET',
        url: `/v1/project_types?${params.toString()}`,
        mediaType: 'application/json',
      });
      return response;
    },
    staleTime: 30000, // 30 seconds
  });
};

