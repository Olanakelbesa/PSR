// ============================================================================
// RPDMS — TanStack Query Hooks: Proposals
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.6, §3.7

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  submitProposal,
  assignReviewers,
  submitReview,
  type ProposalFilters,
  type Proposal,
} from "@/api/services/proposals.service";

export const proposalKeys = {
  all: ["proposals"] as const,
  list: (filters: ProposalFilters) => ["proposals", "list", filters] as const,
  detail: (id: string) => ["proposals", "detail", id] as const,
};

export function useProposals(filters: ProposalFilters = {}) {
  return useQuery({
    queryKey: proposalKeys.list(filters),
    queryFn: () => getProposals(filters),
    staleTime: 1_000 * 60 * 2,
  });
}

export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: proposalKeys.detail(id ?? ""),
    queryFn: () => getProposalById(id!),
    enabled: !!id,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Proposal>) => createProposal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proposal> }) =>
      updateProposal(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
    },
  });
}

export function useSubmitProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitProposal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
    },
  });
}

export function useAssignReviewers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewerIds }: { id: string; reviewerIds: string[] }) =>
      assignReviewers(id, reviewerIds),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reviewData,
    }: {
      id: string;
      reviewData: Record<string, unknown>;
    }) => submitReview(id, reviewData),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
    },
  });
}
