import { useQuery } from "@tanstack/react-query";
import { getProposalSubTypes } from "@/api/services/reference.service";

export type ProposalOption = {
  id: string | number;
  name: string;
  options?: ProposalOption[];
};
export type OfficeOption = { id: string | number; name: string };

export function useProposalOptions(
  _grantCallId?: string,
  proposalTypeId?: string,
) {
  const { data: subTypes, isLoading, isError } = useQuery({
    queryKey: ["proposal-sub-types", proposalTypeId],
    queryFn: () => getProposalSubTypes({ proposaltype: proposalTypeId }),
    enabled: !!proposalTypeId,
    staleTime: 1_000 * 60 * 30,
  });

  return {
    data: {
      proposal_type: { id: proposalTypeId ?? "", name: "", options: [] },
      subcall: { options: subTypes?.data ?? [] },
      submission_levels: [],
    },
    isLoading,
    isError,
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
