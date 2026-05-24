// ============================================================================
// PSR Platform — TanStack Query Hooks: Users
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.6, §3.7

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  type UserFilters,
  type User,
  type AdminCreateUserPayload,
  type AdminUpdateUserPayload,
} from "@/api/services/users.service";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const userKeys = {
  all: ["users"] as const,
  list: (filters: UserFilters) => ["users", "list", filters] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

// ─── useUsers ─────────────────────────────────────────────────────────────────
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters),
    staleTime: 1_000 * 60 * 5,
  });
}

// ─── useUser ──────────────────────────────────────────────────────────────────
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => getUserById(id!),
    enabled: !!id,
  });
}

// ─── useCreateUser ────────────────────────────────────────────────────────────
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateUserPayload) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// ─── useUpdateUser ────────────────────────────────────────────────────────────
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateUserPayload }) =>
      updateUser(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

// ─── useDeleteUser ────────────────────────────────────────────────────────────
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
