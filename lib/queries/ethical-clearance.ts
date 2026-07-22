import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createEthicalClearanceReview,
  updateEthicalClearanceReview,
  submitIRBClearance,
  resubmitIRBClearance,
  updateDraftIRBClearance,
  reviewIRBClearance,
  getIRBClearanceTypes,
  EthicalClearanceFilters,
  getEthicalClearance,
  getEthicalClearances,
} from "@/api/services/ethical-clearance.service";
import type {
  EthicalClearanceCreateInput,
  IRBClearanceSubmitInput,
  IRBClearanceReviewInput,
} from "@/types/ethical-clearance";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "An unexpected error occurred.";
}

export function useCreateEthicalClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EthicalClearanceCreateInput) =>
      createEthicalClearanceReview(payload),
    onSuccess: () => {
      toast.success("IRB clearance created successfully.");
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({ queryKey: ["ethical-clearance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateEthicalClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EthicalClearanceCreateInput> }) =>
      updateEthicalClearanceReview(id, payload),
    onSuccess: () => {
      toast.success("IRB clearance updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({ queryKey: ["ethical-clearance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSubmitIRBClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IRBClearanceSubmitInput }) =>
      submitIRBClearance(id, payload),
    onSuccess: () => {
      toast.success("IRB clearance submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({ queryKey: ["ethical-clearance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResubmitIRBClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IRBClearanceSubmitInput }) =>
      resubmitIRBClearance(id, payload),
    onSuccess: () => {
      toast.success("IRB clearance resubmitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({ queryKey: ["ethical-clearance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateDraftIRBClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IRBClearanceSubmitInput }) =>
      updateDraftIRBClearance(id, payload),
    onSuccess: () => {
      toast.success("Draft saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({ queryKey: ["ethical-clearance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useReviewIRBClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IRBClearanceReviewInput }) =>
      reviewIRBClearance(id, payload),
    onSuccess: (data) => {
      const msg = data.status === "approved"
        ? "IRB clearance approved successfully."
        : "IRB clearance rejected.";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({ queryKey: ["ethical-clearance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useEthicalClearance(id?: number) {
  return useQuery({
    queryKey: ["ethical-clearance", id],
    enabled: Number.isFinite(id ?? NaN) && Boolean(id),
    queryFn: () => getEthicalClearance(id as number),
  });
}

export function useEthicalClearances(filters: EthicalClearanceFilters = {}) {
  return useQuery({
    queryKey: ["ethical-clearances", filters],
    queryFn: () => getEthicalClearances(filters),
  });
}

export function useIRBClearanceTypes() {
  return useQuery({
    queryKey: ["irb-clearance-types"],
    queryFn: () => getIRBClearanceTypes(),
  });
}
