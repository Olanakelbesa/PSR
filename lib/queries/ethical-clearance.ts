import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createEthicalClearanceReview,
  EthicalClearanceFilters,
  getEthicalClearance,
  getEthicalClearances,
} from "@/api/services/ethical-clearance.service";
import { EthicalClearanceCreateInput } from "@/types/ethical-clearance";

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

  return "Failed to save ethical clearance decision.";
}

export function useCreateEthicalClearance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EthicalClearanceCreateInput) =>
      createEthicalClearanceReview(payload),
    onSuccess: () => {
      toast.success("Ethical clearance saved successfully.");
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
