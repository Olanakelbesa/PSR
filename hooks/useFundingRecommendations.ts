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
  readyForFinalSubmission: (filters: FundingRecommendationCandidateFilters) =>
    ["funding-recommendations", "ready-for-final-submission", filters] as const,
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

export function useFundingRecommendationsReadyForFinalSubmission(
  filters: FundingRecommendationCandidateFilters = {},
) {
  return useQuery({
    queryKey: fundingRecommendationKeys.readyForFinalSubmission(filters),
    queryFn: () =>
      fundingRecommendationsService.listReadyForFinalSubmission(filters),
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

export function useReplaceFundingRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: FundingRecommendationCreateInput;
    }) => fundingRecommendationsService.replace(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundingRecommendationKeys.all });
      queryClient.invalidateQueries({
        queryKey: fundingRecommendationKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateFundingRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: Partial<FundingRecommendationCreateInput>;
    }) => fundingRecommendationsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundingRecommendationKeys.all });
      queryClient.invalidateQueries({
        queryKey: fundingRecommendationKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteFundingRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => fundingRecommendationsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundingRecommendationKeys.all });
    },
  });
}

