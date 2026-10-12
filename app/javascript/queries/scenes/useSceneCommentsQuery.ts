import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";

export interface SceneComment {
  id: number;
  scene_id: number;
  parent_id: number | null;
  element_id: string | null;
  body: string;
  resolved_at: string | null;
  created_at: string;
  author: { id: string; name: string };
  replies?: SceneComment[];
}

export const commentKeys = {
  forScene: (sceneId: number) => ["scene-comments", sceneId] as const,
};

export const useSceneCommentsQuery = (sceneId: number | null) =>
  useQuery<SceneComment[]>({
    queryKey: commentKeys.forScene(sceneId ?? 0),
    queryFn: async () => {
      const response = await request<SceneComment[]>(OpenAPI, { method: "GET", url: `/v1/scenes/${sceneId}/comments` });
      return response as unknown as SceneComment[];
    },
    enabled: !!sceneId,
  });

export const useAddCommentMutation = (sceneId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation<SceneComment, Error, { body: string; parent_id?: number; element_id?: string }>({
    mutationFn: async (body) => {
      const response = await request<SceneComment>(OpenAPI, {
        method: "POST",
        url: `/v1/scenes/${sceneId}/comments`,
        body,
        mediaType: "application/json",
      });
      return response as unknown as SceneComment;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.forScene(sceneId ?? 0) }),
  });
};

export const useResolveCommentMutation = (sceneId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation<SceneComment, Error, { id: number; resolved: boolean }>({
    mutationFn: async ({ id, resolved }) => {
      const response = await request<SceneComment>(OpenAPI, {
        method: "PUT",
        url: `/v1/scenes/${sceneId}/comments/${id}/resolve`,
        body: { resolved },
        mediaType: "application/json",
      });
      return response as unknown as SceneComment;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.forScene(sceneId ?? 0) }),
  });
};

export const useDeleteCommentMutation = (sceneId: number | null) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await request<void>(OpenAPI, { method: "DELETE", url: `/v1/scenes/${sceneId}/comments/${id}` });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.forScene(sceneId ?? 0) }),
  });
};
