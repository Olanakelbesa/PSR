import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  DashboardAnalytics,
  DashboardAnalyticsResponse,
  DashboardResearchGrant,
} from "@/types/dashboard-analytics";

function unwrapAnalytics(payload: unknown): DashboardAnalytics {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as DashboardAnalyticsResponse).data;

    if (data && typeof data === "object" && "data" in data) {
      return normalizeAnalytics(
        (data as unknown as DashboardAnalyticsResponse).data,
      );
    }

    return normalizeAnalytics(data);
  }

  return normalizeAnalytics(payload as DashboardAnalytics);
}

function isUpcomingGrantCall(grant: DashboardResearchGrant) {
  const status = grant.status.toLowerCase();
  return status === "published" || status === "open";
}

function normalizeGrantItem(
  item: Record<string, unknown>,
  index: number,
): DashboardResearchGrant | null {
  const status = String(item.status ?? "").toLowerCase();
  if (status && status !== "published" && status !== "open") {
    return null;
  }

  const daysLeft = Number(item.daysLeft ?? item.days_left ?? 0);
  if (daysLeft < 0) {
    return null;
  }

  const openDate = String(item.openDate ?? item.open_date ?? "");
  const dueDate = String(item.dueDate ?? item.due_date ?? "");
  const isOpen = Boolean(item.isOpen ?? item.is_open ?? false);
  const daysUntilOpenRaw = item.daysUntilOpen ?? item.days_until_open;

  return {
    id: typeof item.id === "number" ? item.id : index,
    title: String(item.title ?? ""),
    label: String(item.label ?? "Research Grant Call"),
    status: String(item.status ?? "open"),
    urgency: String(item.urgency ?? item.status ?? "incoming"),
    daysLeft,
    daysUntilOpen:
      daysUntilOpenRaw === null || daysUntilOpenRaw === undefined
        ? null
        : Number(daysUntilOpenRaw),
    isOpen,
    dueDate,
    openDate,
    budget: (item.budget as number | string | null) ?? null,
  };
}

function normalizeUpcomingResearchGrants(
  data: Record<string, unknown>,
): { items: DashboardResearchGrant[] } {
  const section =
    data.upcomingResearchGrants ??
    data.upcoming_research_grants;

  if (
    section &&
    typeof section === "object" &&
    "items" in section &&
    Array.isArray(section.items)
  ) {
    const items = (section.items as Array<Record<string, unknown>>)
      .map((item, index) => normalizeGrantItem(item, index))
      .filter((item): item is DashboardResearchGrant => item !== null)
      .filter(isUpcomingGrantCall);

    return { items };
  }

  const legacy = data.criticalDeadlines ?? data.critical_deadlines;
  if (
    legacy &&
    typeof legacy === "object" &&
    "items" in legacy &&
    Array.isArray(legacy.items)
  ) {
    const items = (legacy.items as Array<Record<string, unknown>>)
      .filter((item) => item.source === "grant_call")
      .map((item, index) => normalizeGrantItem(item, index))
      .filter((item): item is DashboardResearchGrant => item !== null)
      .filter(isUpcomingGrantCall);

    return { items };
  }

  return { items: [] };
}

function normalizeAnalytics(data: DashboardAnalytics): DashboardAnalytics {
  return {
    ...data,
    upcomingResearchGrants: normalizeUpcomingResearchGrants(
      data as unknown as Record<string, unknown>,
    ),
  };
}

export const dashboardService = {
  async getAnalytics(): Promise<DashboardAnalytics> {
    const { data } = await apiClient.get(API_ENDPOINTS.DASHBOARD.ANALYTICS);

    return unwrapAnalytics(data);
  },
};
