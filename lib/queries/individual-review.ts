import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getIndividualReviewById, getReviewQuestions, getIndividualReviews, createIndividualReview, updateIndividualReview } from "@/api/services/individual-reviews.service";

export function useReviewQuestions(params?: any) {
  return useQuery({
    queryKey: ["review-questions", params],
    queryFn: () => getReviewQuestions(params),
  });
}


export function useIndividualReviewList(filters?: any) {
  return useQuery({
    queryKey: ["individual-reviews", filters],
    queryFn: () => getIndividualReviews(filters),
  });
}


export function useIndividualReview(id: string | number) {
  return useQuery({
    queryKey: ["individual-review", id],
    queryFn: () => getIndividualReviewById(id),
    enabled: !!id,
  });
}


export function useCreateIndividualReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createIndividualReview,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["individual-reviews"],
      });
    },
  });
}


export function useUpdateIndividualReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: any;
    }) => updateIndividualReview(id, payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["individual-reviews"],
      });
    },
  });
}

