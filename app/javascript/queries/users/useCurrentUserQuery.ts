import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CurrentService } from "../../types/generated/services.gen";

export interface Company {
  id: number;
  name: string;
  account_type: "company" | "individual";
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  gender?: "male" | "female" | "other";
  phone_number?: string;
  role?: "admin" | "member";
  onboarding_completed: boolean;
  company?: Company;
  created_at: string;
  updated_at: string;
}

export const userKeys = {
  current: ["user", "current"] as const,
};

interface UseCurrentUserQueryOptions {
  enabled?: boolean;
}

export const useCurrentUserQuery = ({
  enabled = true,
}: UseCurrentUserQueryOptions = {}) => {
  return useQuery<CurrentUser, Error>({
    queryKey: userKeys.current,
    queryFn: async () => {
      const user = await CurrentService.getCurrent();
      return user as unknown as CurrentUser;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInvalidateCurrentUser = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: userKeys.current });
  };
};
