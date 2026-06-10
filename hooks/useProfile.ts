import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  updateCurrentUser,
  type UpdateProfilePayload,
} from "@/api/services/profile.service";
import { currentUserKeys } from "@/hooks/useCurrentUser";

export const profileKeys = {
  me: currentUserKeys.all,
};

export function useProfile() {
  return useQuery({
    queryKey: currentUserKeys.all,
    queryFn: getCurrentUser,
    staleTime: 1_000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateCurrentUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentUserKeys.all });
    },
  });
}
