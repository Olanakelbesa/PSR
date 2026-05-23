import { useQuery } from "@tanstack/react-query";
import { getApprovedPendingFundingScreening } from "@/api/services/screenings.service";

export const screeningQueryKeys = {
  all: ["screenings"] as const,
  approvedPendingFunding: (id: string | number) =>
    [...screeningQueryKeys.all, "approved-pending-funding", id] as const,
};

export function useApprovedPendingFundingScreening(
  id: string | number,
  enabled = true,
) {
  return useQuery({
    queryKey: screeningQueryKeys.approvedPendingFunding(id),
    queryFn: () => getApprovedPendingFundingScreening(id),
    enabled: !!id && enabled,
  });
}