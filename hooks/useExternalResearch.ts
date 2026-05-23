import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { externalResearchService } from "@/api/services/external-research.service";

export const externalResearchKeys = {
  all: ["external-research"] as const,
  list: (filters: Record<string, unknown>) =>
    ["external-research", "list", filters] as const,
  detail: (id: string | number) =>
    ["external-research", "detail", String(id)] as const,
};

export function useExternalResearchList(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: externalResearchKeys.list(filters),
    queryFn: () => externalResearchService.list(filters),
  });
}

export function useExternalResearch(id: string | number | undefined) {
  return useQuery({
    queryKey: externalResearchKeys.detail(id ?? ""),
    queryFn: () => externalResearchService.retrieve(id as string | number),
    enabled: !!id,
  });
}

export function useCreateExternalResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      externalResearchService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
    },
  });
}

export function useUpdateExternalResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string | number;
      values: Record<string, unknown>;
    }) => externalResearchService.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });
    },
  });
}
