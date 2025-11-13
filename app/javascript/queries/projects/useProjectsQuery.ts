import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../types/generated/services.gen';
import type { Project } from '../../types/api';

export const projectKeys = {
  all: ['projects'] as const,
  filtered: (status?: Project['status']) => ['projects', { status }] as const,
};

type ProjectsQueryData = Project[];

interface UseProjectsQueryOptions {
  status?: Project['status'];
  enabled?: boolean;
}

export const useProjectsQuery = ({
  status,
  enabled = true,
}: UseProjectsQueryOptions = {}) => {
  return useQuery<ProjectsQueryData, Error>({
    queryKey: status ? projectKeys.filtered(status) : projectKeys.all,
    queryFn: async () => {
      const projects = await ApiService.getProjects();
      if (status) {
        return projects.filter((project) => project.status === status);
      }
      return projects;
    },
    enabled,
  });
};


