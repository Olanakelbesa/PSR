export function useProposalType(id: string) {
  return {
    data: id ? { id, name: "Proposal Type" } : undefined,
    isLoading: false,
    isError: false,
  };
}
