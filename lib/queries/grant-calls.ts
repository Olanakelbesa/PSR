import { mockCalls } from "@/lib/api/mock-data";

export function useOpenGrantCallsForSelect() {
  return {
    data: mockCalls,
    isLoading: false,
    isError: false,
  };
}

export function useGrantCall(id: string) {
  return {
    data: mockCalls.find((call) => String(call.id) === String(id)),
    isLoading: false,
    isError: false,
  };
}
