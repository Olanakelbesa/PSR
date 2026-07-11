import { useQuery, type QueryClient } from "@tanstack/react-query";
import { dashboardService } from "@/api/services/dashboard.service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  analytics: () => [...dashboardKeys.all, "analytics"] as const,
};

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: dashboardKeys.analytics(),
    queryFn: () => dashboardService.getAnalytics(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function invalidateDashboardAnalytics(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}
