import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '../../types/generated/core/OpenAPI';
import { request } from '../../types/generated/core/request';
import type { Script } from '../../types/api';

export interface UploadScriptData {
  project_id: number | string;
  title: string;
  script_type: string;
  description?: string;
  file: File;
  notes?: string;
}

export const useUploadScriptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Script, Error, UploadScriptData>({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('project_id', String(data.project_id));
      formData.append('title', data.title);
      formData.append('script_type', data.script_type);
      if (data.description) formData.append('description', data.description);
      formData.append('file', data.file);
      if (data.notes) formData.append('notes', data.notes);

      const response = await request<Script>(OpenAPI, {
        method: 'POST',
        url: '/v1/scripts/upload',
        mediaType: 'multipart/form-data',
        body: formData as any,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });
};

