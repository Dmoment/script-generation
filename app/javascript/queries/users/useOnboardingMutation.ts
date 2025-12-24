import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "../../types/generated/core/OpenAPI";
import { request } from "../../types/generated/core/request";
import { userKeys, type CurrentUser } from "./useCurrentUserQuery";

export interface OnboardingData {
  account_type: "company" | "individual";
  full_name: string;
  gender: "male" | "female" | "other";
  company_name?: string;
}

interface OnboardingResponse extends CurrentUser {}

export const useOnboardingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OnboardingResponse, Error, OnboardingData>({
    mutationFn: async (data: OnboardingData) => {
      const response = await request<OnboardingResponse>(OpenAPI, {
        method: "POST",
        url: "/v1/onboarding/complete",
        body: data,
        mediaType: "application/json",
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.current, data);
      queryClient.invalidateQueries({ queryKey: userKeys.current });
    },
  });
};


