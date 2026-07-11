import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  type CurrentUser,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
} from "@/api/services/profile.service";
import { currentUserKeys } from "@/hooks/useCurrentUser";

export const profileKeys = {
  me: currentUserKeys.all,
};

function toSessionUserPatch(user: CurrentUser) {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    avatar: user.photoUrl ?? undefined,
    institution: user.organization?.name ?? undefined,
    department: user.unit?.name ?? undefined,
    position: user.title?.name ?? undefined,
  };
}

export function useProfile() {
  return useQuery({
    queryKey: currentUserKeys.all,
    queryFn: getCurrentUser,
    staleTime: 1_000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateCurrentUser(payload),
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(currentUserKeys.all, updatedUser);
      await updateSession({ user: toSessionUserPatch(updatedUser) });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  });
}
