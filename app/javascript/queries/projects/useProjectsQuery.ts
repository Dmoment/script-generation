import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '../../types/generated/core/OpenAPI';
import { request } from '../../types/generated/core/request';
import type { Project } from '../../types/api';

export const projectKeys = {
  all: ['projects'] as const,
  filtered: (q?: Record<string, any>) => ['projects', { q }] as const,
};

type ProjectsQueryData = Project[];

interface UseProjectsQueryOptions {
  q?: Record<string, any>; // Ransack query parameters
  page?: number;
  per_page?: number;
  enabled?: boolean;
}

export const useProjectsQuery = ({
  q,
  page = 1,
  per_page = 20,
  enabled = true,
}: UseProjectsQueryOptions = {}) => {
  return useQuery<ProjectsQueryData, Error>({
    queryKey: projectKeys.filtered(q),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) {
        // Convert Ransack query object to URL params
        Object.entries(q).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'object') {
              Object.entries(value).forEach(([subKey, subValue]) => {
                params.append(`q[${key}][${subKey}]`, String(subValue));
              });
            } else {
              params.append(`q[${key}]`, String(value));
            }
          }
        });
      }
      if (page) params.append('page', String(page));
      if (per_page) params.append('per_page', String(per_page));

      const response = await request<ProjectsQueryData>(OpenAPI, {
        method: 'GET',
        url: `/v1/projects?${params.toString()}`,
        mediaType: 'application/json',
      });
      return response;
    },
    enabled,
  });
};


