import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { protocolService } from "@/api/services/protocol.service";
import type {
  ProtocolCreateInput,
  ProtocolFilters,
  ProtocolReviewInput,
} from "@/types/protocol";

export function useProtocols(filters: ProtocolFilters = {}) {
  return useQuery({
    queryKey: ["protocols", filters],
    queryFn: () => protocolService.list(filters),
  });
}

export function useProtocol(id?: number) {
  return useQuery({
    queryKey: ["protocol", id],
    enabled: Number.isFinite(id ?? NaN) && Boolean(id),
    queryFn: () => protocolService.getById(id as number),
  });
}

export function useCreateProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProtocolCreateInput) => protocolService.create(input),
    onSuccess: () => {
      toast.success("Protocol submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit protocol.");
    },
  });
}

export function useReviewProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProtocolReviewInput }) =>
      protocolService.review(id, payload),
    onSuccess: (data) => {
      const msg =
        data.status === "approved"
          ? "Protocol approved successfully."
          : "Protocol rejected.";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      queryClient.invalidateQueries({ queryKey: ["protocol", data.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit review decision.");
    },
  });
}

export function useDeleteProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => protocolService.delete(id),
    onSuccess: () => {
      toast.success("Protocol deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete protocol.");
    },
  });
}
