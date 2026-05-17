import { proposalsApi } from "@/lib/api/client";
import { mockProposals } from "@/lib/api/mock-data";
import type { ProposalDetail } from "@/types";

export function useCreateProposal() {
  return {
    isPending: false,
    mutateAsync: (data: any) => proposalsApi.createProposal(data),
  };
}

export function useUpdateProposal() {
  return {
    isPending: false,
    mutateAsync: ({ id, data }: { id: string; data: any }) =>
      proposalsApi.updateProposal(id, data),
  };
}

export function useProposal(id: string): {
  data: ProposalDetail | undefined;
  isLoading: boolean;
  error: null;
} {
  return {
    data: mockProposals.find((proposal) => proposal.id === id) as
      | ProposalDetail
      | undefined,
    isLoading: false,
    error: null,
  };
}

export function useProposalResponse(id: string) {
  return useProposal(id);
}
