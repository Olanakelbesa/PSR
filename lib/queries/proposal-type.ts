import { useQuery } from "@tanstack/react-query";

import { getProposalTypes } from "@/api/services/reference.service";
import type { LookupItem } from "@/api/services/reference.service";

export function useProposalTypes() {
  return useQuery<LookupItem[]>({
    queryKey: ["proposal-types"],
    queryFn: getProposalTypes,
    staleTime: 1_000 * 60 * 30,
  });
}

export function useProposalType(id: string) {
  const query = useProposalTypes();

  return {
    ...query,
    data: query.data?.find((item) => item.id === id),
  };
}
