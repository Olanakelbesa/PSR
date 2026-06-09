import { useQuery } from "@tanstack/react-query";
import {
  getGrantCallById,
  getGrantCalls,
  type GrantCallListParams,
} from "@/api/services";
import type { GrantCall } from "@/types/grant-call";

function isGrantCallOpen(call: GrantCall) {
  const status = (call.status ?? "").toLowerCase();
  if (status && status !== "published" && status !== "open") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (call.openDate) {
    const openDate = new Date(call.openDate);
    openDate.setHours(0, 0, 0, 0);
    if (today < openDate) return false;
  }

  if (call.closeDate) {
    const closeDate = new Date(call.closeDate);
    closeDate.setHours(23, 59, 59, 999);
    if (today > closeDate) return false;
  }

  return true;
}

export function useGrantCalls(params: GrantCallListParams = {}) {
  return useQuery({
    queryKey: ["grant-calls", params],
    queryFn: () => getGrantCalls(params),
  });
}

export function useOpenGrantCallsForSelect(params: GrantCallListParams = {}) {
  const queryParams = {
    status: "open",
    limit: params.limit ?? 50,
    search: params.search,
    ordering: params.ordering,
  };
  return useQuery({
    queryKey: ["grant-calls", "open-select", queryParams],
    // Use server-side status filter to avoid fetching all records.
    // Capped at requested limit or 50 by default.
    queryFn: async () => {
      const response = await getGrantCalls(queryParams);
      // Apply client-side date boundary check as a secondary guard
      return {
        data: (response.data ?? []).filter(isGrantCallOpen),
        meta: response.meta,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min — open calls don't change frequently
  });
}

export function useGrantCall(id: string) {
  return useQuery({
    queryKey: ["grant-call", id],
    enabled: Boolean(id),
    queryFn: () => getGrantCallById(id),
  });
}
