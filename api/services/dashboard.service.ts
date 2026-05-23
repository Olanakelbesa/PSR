import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  DashboardAnalytics,
  DashboardAnalyticsResponse,
} from "@/types/dashboard-analytics";

function unwrapAnalytics(payload: unknown): DashboardAnalytics {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as DashboardAnalyticsResponse).data;

    if (data && typeof data === "object" && "data" in data) {
      return (data as unknown as DashboardAnalyticsResponse).data;
    }

    return data;
  }

  return payload as DashboardAnalytics;
}

export const dashboardService = {
  async getAnalytics(): Promise<DashboardAnalytics> {
    const { data } = await apiClient.get(API_ENDPOINTS.DASHBOARD.ANALYTICS);

    return unwrapAnalytics(data);
  },
};
