// ============================================================================
// RPDMS — TanStack Query Hooks: Roles & Permissions
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissionCatalog,
  type RoleFilters,
  type CreateRolePayload,
  type UpdateRolePayload,
} from "@/api/services/roles.service";

export const roleKeys = {
  all: ["roles"] as const,
  list: (filters: RoleFilters) => ["roles", "list", filters] as const,
  detail: (id: string | number) => ["roles", "detail", id] as const,
  catalog: ["permissions", "catalog"] as const,
};

export function useRoles(filters: RoleFilters = {}) {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: () => getRoles(filters),
    staleTime: 1_000 * 60 * 5,
  });
}

export function useRole(id: string | number | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? ""),
    queryFn: () => getRoleById(id!),
    enabled: id !== undefined && id !== "",
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: roleKeys.catalog,
    queryFn: getPermissionCatalog,
    staleTime: 1_000 * 60 * 30,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateRolePayload }) =>
      updateRole(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
