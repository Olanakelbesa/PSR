// ============================================================================
// RPDMS — TanStack Query Hooks: Organizations Mutations
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.7
// All CRUD mutations are handled through these hooks.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  patchOrganization,
  deleteOrganization,
  getOrganizationTypes,
  getOrganizationType,
  createOrganizationType,
  updateOrganizationType,
  patchOrganizationType,
  deleteOrganizationType,
  type Organization,
  type OrganizationType,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type CreateOrganizationTypeInput,
  type UpdateOrganizationTypeInput,
} from "@/api/services/organizations.service";

// Long stale time: reference data rarely changes
const REFERENCE_STALE_TIME = 1_000 * 60 * 30; // 30 minutes

export const organizationKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationKeys.all, "list"] as const,
  list: (params?: any) => [...organizationKeys.lists(), params ?? {}] as const,
  details: () => [...organizationKeys.all, "detail"] as const,
  detail: (id: string | number) =>
    [...organizationKeys.details(), id] as const,
};

export const organizationTypeKeys = {
  all: ["organizationTypes"] as const,
  lists: () => [...organizationTypeKeys.all, "list"] as const,
  list: (params?: any) =>
    [...organizationTypeKeys.lists(), params ?? {}] as const,
  details: () => [...organizationTypeKeys.all, "detail"] as const,
  detail: (id: string | number) =>
    [...organizationTypeKeys.details(), id] as const,
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ORGANIZATIONS: QUERIES ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function useOrganizationsList(params?: {
  search?: string;
  limit?: number;
  page?: number;
  org_type?: string | number;
}) {
  return useQuery({
    queryKey: organizationKeys.list(params ?? {}),
    queryFn: () => getOrganizations(params),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useOrganization(id: string | number | undefined) {
  return useQuery({
    queryKey: organizationKeys.detail(id || ""),
    queryFn: () => getOrganization(id!),
    enabled: !!id,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ORGANIZATIONS: MUTATIONS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) =>
      createOrganization(input),
    onSuccess: (newOrg) => {
      // Invalidate the organizations list to refetch
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(),
      });
      // Add the new organization to the cache if possible
      queryClient.setQueryData(
        organizationKeys.detail(newOrg.id),
        newOrg,
      );
    },
  });
}

export function useUpdateOrganization(id: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) =>
      updateOrganization(id, input),
    onSuccess: (updatedOrg) => {
      // Update the detail query
      queryClient.setQueryData(
        organizationKeys.detail(id),
        updatedOrg,
      );
      // Invalidate the list to refetch
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(),
      });
    },
  });
}

export function usePatchOrganization(id: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<UpdateOrganizationInput>) =>
      patchOrganization(id, input),
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(
        organizationKeys.detail(id),
        updatedOrg,
      );
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(),
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(),
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ORGANIZATION TYPES: QUERIES ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function useOrganizationTypesList(params?: {
  search?: string;
  limit?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: organizationTypeKeys.list(params ?? {}),
    queryFn: () => getOrganizationTypes(params),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useOrganizationType(id: string | number | undefined) {
  return useQuery({
    queryKey: organizationTypeKeys.detail(id || ""),
    queryFn: () => getOrganizationType(id!),
    enabled: !!id,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ORGANIZATION TYPES: MUTATIONS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function useCreateOrganizationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationTypeInput) =>
      createOrganizationType(input),
    onSuccess: (newType) => {
      queryClient.invalidateQueries({
        queryKey: organizationTypeKeys.lists(),
      });
      queryClient.setQueryData(
        organizationTypeKeys.detail(newType.id),
        newType,
      );
    },
  });
}

export function useUpdateOrganizationType(id: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationTypeInput) =>
      updateOrganizationType(id, input),
    onSuccess: (updatedType) => {
      queryClient.setQueryData(
        organizationTypeKeys.detail(id),
        updatedType,
      );
      queryClient.invalidateQueries({
        queryKey: organizationTypeKeys.lists(),
      });
    },
  });
}

export function usePatchOrganizationType(id: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<UpdateOrganizationTypeInput>) =>
      patchOrganizationType(id, input),
    onSuccess: (updatedType) => {
      queryClient.setQueryData(
        organizationTypeKeys.detail(id),
        updatedType,
      );
      queryClient.invalidateQueries({
        queryKey: organizationTypeKeys.lists(),
      });
    },
  });
}

export function useDeleteOrganizationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteOrganizationType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationTypeKeys.lists(),
      });
    },
  });
}
