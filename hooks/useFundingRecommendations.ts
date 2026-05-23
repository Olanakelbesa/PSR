import { useQuery } from "@tanstack/react-query";
import {
  fundingRecommendationsService,
  type FundingRecommendationFilters,
  type FundingRecommendationCandidateFilters,
} from "@/api/services/funding-recommendations.service";

export const fundingRecommendationKeys = {
  all: ["funding-recommendations"] as const,
  list: (filters: FundingRecommendationFilters) =>
    ["funding-recommendations", "list", filters] as const,
  candidates: (filters: FundingRecommendationCandidateFilters) =>
    ["funding-recommendations", "candidates", filters] as const,
};

export function useFundingRecommendations(
  filters: FundingRecommendationFilters = {},
) {
  return useQuery({
    queryKey: fundingRecommendationKeys.list(filters),
    queryFn: () => fundingRecommendationsService.list(filters),
  });
}

export function useFundingRecommendationCandidates(
  filters: FundingRecommendationCandidateFilters = {},
) {
  return useQuery({
    queryKey: fundingRecommendationKeys.candidates(filters),
    queryFn: () => fundingRecommendationsService.listCandidates(filters),
  });
}
