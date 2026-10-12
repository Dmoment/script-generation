import { useQuery } from "@tanstack/react-query";
import { request } from "../../types/generated/core/request";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import type { Script } from "../../types/api";

export const scriptKeys = {
  all: ["scripts"] as const,
  detail: (id: number) => [...scriptKeys.all, "detail", id] as const,
};

export const useScriptQuery = ({ scriptId, enabled = true }: { scriptId: number; enabled?: boolean }) => {
  return useQuery<Script>({
    queryKey: scriptKeys.detail(scriptId),
    queryFn: async () => {
      const response = await request<Script>(OpenAPI, {
        method: "GET",
        url: `/v1/scripts/${scriptId}`,
        mediaType: "application/json",
      });
      return response as unknown as Script;
    },
    enabled: enabled && !!scriptId,
  });
};
