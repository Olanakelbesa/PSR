import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fundingRecommendationsService,
  type FundingRecommendationFilters,
  type FundingRecommendationCandidateFilters,
} from "@/api/services/funding-recommendations.service";
import type { FundingRecommendationCreateInput } from "@/types/funding-recommendation";

export const fundingRecommendationKeys = {
  all: ["funding-recommendations"] as const,
  list: (filters: FundingRecommendationFilters) =>
    ["funding-recommendations", "list", filters] as const,
  candidates: (filters: FundingRecommendationCandidateFilters) =>
    ["funding-recommendations", "candidates", filters] as const,
  detail: (id: string | number) =>
    ["funding-recommendations", "detail", id] as const,
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

export function useFundingRecommendation(id: string | number | undefined) {
  return useQuery({
    queryKey: fundingRecommendationKeys.detail(id ?? ""),
    queryFn: () => fundingRecommendationsService.retrieve(id!),
    enabled: !!id,
  });
}

export function useCreateFundingRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FundingRecommendationCreateInput) =>
      fundingRecommendationsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundingRecommendationKeys.all });
    },
  });
}

