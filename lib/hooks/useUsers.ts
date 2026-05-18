// ============================================================================
// PSR Platform — TanStack Query Hooks: Users
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/user.service";
import type { User, FilterOptions } from "@/lib/types";
import type { ApiError } from "@/lib/axios";

// ─── Query Keys (centralized, prevents stale cache mismatches) ────────────────
export const userKeys = {
  all: ["users"] as const,
  list: (filters: FilterOptions, page: number, pageSize: number) =>
    ["users", "list", filters, page, pageSize] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

// ─── GET /users ───────────────────────────────────────────────────────────────
export function useUsers(
  filters: FilterOptions = {},
  page = 1,
  pageSize = 10,
) {
  return useQuery({
    queryKey: userKeys.list(filters, page, pageSize),
    queryFn: () => getUsers(filters, page, pageSize),
  });
}

// ─── GET /users/:id ───────────────────────────────────────────────────────────
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

// ─── POST /users ──────────────────────────────────────────────────────────────
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User created successfully.");
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to create user.");
    },
  });
}

// ─── PATCH /users/:id ────────────────────────────────────────────────────────
export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User updated successfully.");
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to update user.");
    },
  });
}

// ─── DELETE /users/:id ───────────────────────────────────────────────────────
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User removed successfully.");
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to delete user.");
    },
  });
}
