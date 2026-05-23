import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  finalSubmissionsService,
  type FinalSubmissionFilters,
} from "@/api/services/final-submissions.service";
import type { FinalSubmissionCreateInput } from "@/types/final-submission";

export const finalSubmissionKeys = {
  all: ["final-submissions"] as const,
  list: (filters: FinalSubmissionFilters) =>
    ["final-submissions", "list", filters] as const,
  detail: (id: string | number) =>
    ["final-submissions", "detail", String(id)] as const,
  readyForFinalSubmission: (filters: Record<string, unknown>) =>
    ["final-submissions", "ready-for-final-submission", filters] as const,
  outputTypes: (filters: Record<string, unknown>) =>
    ["final-submissions", "output-types", filters] as const,
  dataCenters: (filters: Record<string, unknown>) =>
    ["final-submissions", "data-centers", filters] as const,
};

export function useFinalSubmissions(filters: FinalSubmissionFilters = {}) {
  return useQuery({
    queryKey: finalSubmissionKeys.list(filters),
    queryFn: () => finalSubmissionsService.list(filters),
  });
}

export function useFinalSubmission(id: string | number | undefined) {
  return useQuery({
    queryKey: finalSubmissionKeys.detail(id ?? ""),
    queryFn: () => finalSubmissionsService.retrieve(id as string | number),
    enabled: !!id,
  });
}

export function useCreateFinalSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: FinalSubmissionCreateInput) =>
      finalSubmissionsService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: finalSubmissionKeys.all });
    },
  });
}

export function useReadyForFinalSubmissionFundingRecommendations(
  filters: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: finalSubmissionKeys.readyForFinalSubmission(filters),
    queryFn: () => finalSubmissionsService.listReadyForFinalSubmission(filters),
  });
}

export function useOutputTypes(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: finalSubmissionKeys.outputTypes(filters),
    queryFn: () => finalSubmissionsService.listOutputTypes(filters),
  });
}

export function useDataCenters(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: finalSubmissionKeys.dataCenters(filters),
    queryFn: () => finalSubmissionsService.listDataCenters(filters),
  });
}
