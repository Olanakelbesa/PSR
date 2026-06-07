import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  listTaxonomyItems,
  updateTaxonomyItem,
  type TaxonomyKind,
  type TaxonomyListParams,
  type TaxonomyWritePayload,
} from "@/api/services/taxonomy.service";

export const taxonomyKeys = {
  all: ["taxonomy"] as const,
  list: (kind: TaxonomyKind, params: TaxonomyListParams) =>
    ["taxonomy", kind, "list", params] as const,
};

export function useTaxonomyItems(kind: TaxonomyKind, params: TaxonomyListParams = {}) {
  return useQuery({
    queryKey: taxonomyKeys.list(kind, params),
    queryFn: () => listTaxonomyItems(kind, params),
    staleTime: 60_000,
  });
}

export function useCreateTaxonomyItem(kind: TaxonomyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaxonomyWritePayload) => createTaxonomyItem(kind, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
      queryClient.invalidateQueries({ queryKey: ["reference"] });
    },
  });
}

export function useUpdateTaxonomyItem(kind: TaxonomyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaxonomyWritePayload }) =>
      updateTaxonomyItem(kind, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
      queryClient.invalidateQueries({ queryKey: ["reference"] });
    },
  });
}

export function useDeleteTaxonomyItem(kind: TaxonomyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTaxonomyItem(kind, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
      queryClient.invalidateQueries({ queryKey: ["reference"] });
    },
  });
}
