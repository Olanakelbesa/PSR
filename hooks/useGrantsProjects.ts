// ============================================================================
// RPDMS — TanStack Query Hooks: Grants & Projects
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.6, §3.7

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGrants,
  getGrantById,
  createGrant,
  updateGrant,
  getProjects,
  getProjectById,
  submitProgressReport,
  approveProgressReport,
  type Grant,
} from "@/api/services/grants-projects.service";

// ─── Grants ───────────────────────────────────────────────────────────────────
export const grantKeys = {
  all: ["grants"] as const,
  list: (params: Record<string, unknown>) => ["grants", "list", params] as const,
  detail: (id: string) => ["grants", "detail", id] as const,
};

export function useGrants(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: grantKeys.list(params),
    queryFn: () => getGrants(params),
    staleTime: 1_000 * 60 * 5,
  });
}

export function useGrant(id: string | undefined) {
  return useQuery({
    queryKey: grantKeys.detail(id ?? ""),
    queryFn: () => getGrantById(id!),
    enabled: !!id,
  });
}

export function useCreateGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Grant>) => createGrant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grantKeys.all });
    },
  });
}

export function useUpdateGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Grant> }) =>
      updateGrant(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: grantKeys.all });
      queryClient.invalidateQueries({ queryKey: grantKeys.detail(id) });
    },
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectKeys = {
  all: ["projects"] as const,
  list: (params: Record<string, unknown>) => ["projects", "list", params] as const,
  detail: (id: string) => ["projects", "detail", id] as const,
};

export function useProjects(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => getProjects(params),
    staleTime: 1_000 * 60 * 5,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: () => getProjectById(id!),
    enabled: !!id,
  });
}

export function useSubmitProgressReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Record<string, unknown>;
    }) => submitProgressReport(projectId, data),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useApproveProgressReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      reportId,
    }: {
      projectId: string;
      reportId: string;
    }) => approveProgressReport(projectId, reportId),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
