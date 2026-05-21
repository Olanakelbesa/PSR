import { useQuery } from "@tanstack/react-query";

import { getProposalTypes } from "@/api/services/reference.service";
import type { LookupItem } from "@/api/services/reference.service";

export function useProposalTypes() {
  return useQuery<LookupItem[]>({
    queryKey: ["proposal-types"],
    queryFn: async () => {
      const res = await getProposalTypes();
      return res.data;
    },
    staleTime: 1_000 * 60 * 30,
  });
}

export function useProposalTypesForSelect(params?: {
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["proposal-types", "select", params],
    queryFn: () => getProposalTypes(params),
  });
}

export function useProposalType(id: string) {
  const query = useProposalTypes();

  return {
    ...query,
    data: query.data?.find((item) => item.id === id),
  };
}
