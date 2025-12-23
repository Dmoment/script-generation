import { useQuery } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import type { Script } from "../../types/api";

export const scriptKeys = {
  all: ["scripts"] as const,
  byProject: (projectId: number | string) =>
    ["scripts", "project", projectId] as const,
  filtered: (projectId?: number | string, q?: Record<string, any>) =>
    ["scripts", projectId, { q }] as const,
};

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ScriptsResponse {
  data: Script[];
  pagination: PaginationMeta;
}

interface UseScriptsQueryOptions {
  projectId?: number | string;
  q?: Record<string, any>;
  page?: number;
  per_page?: number;
  enabled?: boolean;
}

export const useScriptsQuery = ({
  projectId,
  q,
  page = 1,
  per_page = 20,
  enabled = true,
}: UseScriptsQueryOptions = {}) => {
  return useQuery<ScriptsResponse, Error>({
    queryKey: [
      ...scriptKeys.filtered(projectId, q),
      "page",
      page,
      "per_page",
      per_page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) {
        params.append("project_id", String(projectId));
      }
      if (q) {
        // Convert Ransack query object to URL params
        Object.entries(q).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            if (typeof value === "object") {
              Object.entries(value).forEach(([subKey, subValue]) => {
                params.append(`q[${key}][${subKey}]`, String(subValue));
              });
            } else {
              params.append(`q[${key}]`, String(value));
            }
          }
        });
      }
      if (page) params.append("page", String(page));
      if (per_page) params.append("per_page", String(per_page));

      const response = await request<ScriptsResponse>(OpenAPI, {
        method: "GET",
        url: `/v1/scripts?${params.toString()}`,
        mediaType: "application/json",
      });
      return response;
    },
    enabled,
  });
};
