export type ProposalOption = {
  id: string | number;
  name: string;
  options?: ProposalOption[];
};
export type OfficeOption = { id: string | number; name: string };

export function useProposalOptions(
  _grantCallId?: string,
  _proposalTypeId?: string,
) {
  return {
    data: {
      proposal_type: { id: "1", name: "Default Proposal Type", options: [] },
      subcall: { options: [] },
      submission_levels: [],
    },
    isLoading: false,
    isError: false,
  };
}

export function useOfficeOptions(
  _grantCallId?: string,
  _submissionLevel?: string,
) {
  return {
    data: { offices: [] },
    isLoading: false,
    isError: false,
  };
}
