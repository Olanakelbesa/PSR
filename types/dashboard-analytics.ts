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

export interface DashboardDeadline {
  title: string;
  label: string;
  status: string;
  daysLeft: number;
  dueDate: string;
  source: string;
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
  criticalDeadlines: {
    items: DashboardDeadline[];
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
