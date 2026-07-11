export type DashboardChangeDirection = "up" | "down" | "flat";

export interface DashboardOverviewCard {
  key: string;
  label: string;
  value: number;
  changePercent: number;
  changeDirection: DashboardChangeDirection;
  changeLabel: string;
}

export interface DashboardStage {
  key: string;
  label: string;
  count: number;
}

export interface DashboardStatusItem {
  key: string;
  label: string;
  count: number;
}

export interface DashboardResearchGrant {
  id: number;
  title: string;
  label: string;
  status: string;
  urgency: string;
  daysLeft: number;
  daysUntilOpen: number | null;
  isOpen: boolean;
  dueDate: string;
  openDate: string;
  budget: number | string | null;
}

export interface DashboardActivity {
  source: string;
  title: string;
  actor: string;
  timestamp: string;
  relativeTime: string;
  metadata?: Record<string, unknown>;
  documentType?: string | null;
}

export interface DashboardThematicArea {
  name: string;
  count: number;
  percent: number;
}

export interface DashboardResearchTrend {
  month: string;
  monthKey: string;
  count: number;
}

export interface DashboardAnalytics {
  generalOverview: {
    cards: DashboardOverviewCard[];
    asOf: string;
  };
  stagePolicyLifecycle: {
    stages: DashboardStage[];
    totalDocuments: number;
  };
  operationalStatus: {
    items: DashboardStatusItem[];
  };
  upcomingResearchGrants: {
    items: DashboardResearchGrant[];
  };
  liveActivityFeed: {
    items: DashboardActivity[];
  };
  policiesByThematicArea: {
    items: DashboardThematicArea[];
    totalPolicies: number;
  };
  researchProposalTrends: {
    items: DashboardResearchTrend[];
  };
  generatedAt: string;
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  data: DashboardAnalytics;
}
