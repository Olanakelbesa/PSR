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

export function useOpenGrantCallsForSelect() {
  return useQuery({
    queryKey: ["grant-calls", "open-select"],
    queryFn: async () => {
      const response = await getGrantCalls({ limit: 1000 });
      return {
        data: (response.data ?? []).filter(isGrantCallOpen),
        meta: response.meta,
      };
    },
  });
}

export function useGrantCall(id: string) {
  return useQuery({
    queryKey: ["grant-call", id],
    enabled: Boolean(id),
    queryFn: () => getGrantCallById(id),
  });
}
