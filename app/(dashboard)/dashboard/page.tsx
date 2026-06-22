"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FilePlus,
  FileText,
  FlaskConical,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/api/services/dashboard.service";
import type { ApiError } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type {
  DashboardActivity,
  DashboardAnalytics,
  DashboardChangeDirection,
  DashboardDeadline,
  DashboardOverviewCard,
  DashboardStage,
  DashboardStatusItem,
  DashboardThematicArea,
} from "@/types/dashboard-analytics";

type IconType = ComponentType<{ className?: string }>;

const CHART_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#334155",
];

const POLICY_CARD_KEYS = new Set([
  "total_policy_documents",
  "submitted_concept_notes",
  "total_draft_notes",
]);

const RESEARCH_CARD_KEYS = new Set([
  "registered_research",
  "submitted_proposals",
  "funded_proposals",
]);

const overviewIcons: Record<string, IconType> = {
  total_policy_documents: BookOpen,
  submitted_concept_notes: FilePlus,
  total_draft_notes: FileText,
  registered_research: FlaskConical,
  submitted_proposals: FileText,
  funded_proposals: CheckCircle2,
};

const cardStyles: Record<
  string,
  {
    bgGradient: string;
    borderHover: string;
    iconBg: string;
    iconColor: string;
    glowColor: string;
  }
> = {
  total_policy_documents: {
    bgGradient: "from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10",
    borderHover: "hover:border-blue-500/30",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-500 dark:text-blue-400",
    glowColor: "shadow-blue-500/5 hover:shadow-blue-500/10",
  },
  submitted_concept_notes: {
    bgGradient: "from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10",
    borderHover: "hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    glowColor: "shadow-emerald-500/5 hover:shadow-emerald-500/10",
  },
  total_draft_notes: {
    bgGradient: "from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10",
    borderHover: "hover:border-amber-500/30",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-500 dark:text-amber-400",
    glowColor: "shadow-amber-500/5 hover:shadow-amber-500/10",
  },
  registered_research: {
    bgGradient: "from-violet-500/5 to-fuchsia-500/5 dark:from-violet-500/10 dark:to-fuchsia-500/10",
    borderHover: "hover:border-violet-500/30",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-500 dark:text-violet-400",
    glowColor: "shadow-violet-500/5 hover:shadow-violet-500/10",
  },
  submitted_proposals: {
    bgGradient: "from-sky-500/5 to-cyan-500/5 dark:from-sky-500/10 dark:to-cyan-500/10",
    borderHover: "hover:border-sky-500/30",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
    iconColor: "text-sky-500 dark:text-sky-400",
    glowColor: "shadow-sky-500/5 hover:shadow-sky-500/10",
  },
  funded_proposals: {
    bgGradient: "from-teal-500/5 to-emerald-500/5 dark:from-teal-500/10 dark:to-emerald-500/10",
    borderHover: "hover:border-teal-500/30",
    iconBg: "bg-teal-500/10 dark:bg-teal-500/20",
    iconColor: "text-teal-500 dark:text-teal-400",
    glowColor: "shadow-teal-500/5 hover:shadow-teal-500/10",
  },
};

function formatDateTime(value?: string) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getChangeClass(direction: DashboardChangeDirection) {
  if (direction === "down") return "text-red-500";
  if (direction === "flat") return "text-slate-500";
  return "text-emerald-500";
}

function getDeadlineClass(deadline: DashboardDeadline) {
  if (deadline.status === "overdue" || deadline.daysLeft < 0) {
    return "text-red-600";
  }

  if (deadline.daysLeft <= 7) return "text-amber-600";
  return "text-emerald-600";
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <FileText className="mb-2 h-6 w-6 text-muted-foreground/40" />
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">
        The backend returned no records for this section.
      </p>
    </div>
  );
}

function AnalyticsCardRow({
  title,
  description,
  icon: Icon,
  cards,
}: {
  title: string;
  description: string;
  icon: IconType;
  cards: DashboardOverviewCard[];
}) {
  const gridClass =
    cards.length <= 1
      ? "grid-cols-1 sm:max-w-sm"
      : cards.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : cards.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className={cn("grid auto-rows-fr gap-4", gridClass)}>
        {cards.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardOverviewCard }) {
  const Icon = overviewIcons[stat.key] || FileText;
  const style = cardStyles[stat.key] || {
    bgGradient: "from-slate-500/5 to-gray-500/5",
    borderHover: "hover:border-slate-500/50",
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-500",
    glowColor: "shadow-slate-500/5",
  };
  const isDown = stat.changeDirection === "down";
  const TrendIcon = isDown ? TrendingDown : TrendingUp;

  return (
    <Card className={cn(
      "group relative overflow-hidden h-full border border-primary/10 bg-gradient-to-br bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
      style.bgGradient,
      style.borderHover,
      style.glowColor
    )}>
      {/* Corner color glow overlay */}
      <div className={cn(
        "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-40 dark:opacity-20 transition-opacity group-hover:opacity-60",
        stat.key === "total_policy_documents" && "bg-blue-500",
        stat.key === "submitted_concept_notes" && "bg-emerald-500",
        stat.key === "total_draft_notes" && "bg-amber-500",
        stat.key === "registered_research" && "bg-violet-500",
        stat.key === "submitted_proposals" && "bg-sky-500",
        stat.key === "funded_proposals" && "bg-teal-500"
      )} />

      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {stat.label}
          </p>
          <div className={cn("rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110", style.iconBg)}>
            <Icon className={cn("h-5 w-5", style.iconColor)} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-black tracking-tight text-foreground">
            {stat.value.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              isDown ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>
                {isDown ? "-" : "+"}
                {Math.abs(stat.changePercent)}%
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {stat.changeLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovalPipeline({
  stages,
  totalDocuments,
}: {
  stages: DashboardStage[];
  totalDocuments: number;
}) {
  const maxValue = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] border-b bg-muted/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Policy Lifecycle
        </CardTitle>
        <CardDescription>
          {totalDocuments.toLocaleString()} document(s) across workflow stages
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-6">
        {stages.length === 0 ? (
          <EmptyState label="No lifecycle stage data" />
        ) : (
          <div className="space-y-3.5">
            {stages.map((item, index) => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {index + 1}
                </div>
                <span className="w-36 truncate text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max((item.count / maxValue) * 100, item.count ? 6 : 0)}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-black">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkflowOverview({ items }: { items: DashboardStatusItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const chartData = items.map((item, index) => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] border-b bg-muted/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Activity className="h-4 w-4 text-primary" />
          Operational Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-4 pt-6">
        {chartData.length === 0 ? (
          <EmptyState label="No operational status data" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{total}</span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Total Active
                </span>
              </div>
            </div>
            <div className="mt-6 w-full space-y-2">
              {chartData.map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-3 w-3 shrink-0 rounded-sm shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex-1 font-medium text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="font-bold">{item.count}</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CriticalDeadlines({ deadlines }: { deadlines: DashboardDeadline[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleDeadlines = showAll ? deadlines : deadlines.slice(0, 5);
  const canToggle = deadlines.length > 5;

  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] border-b bg-muted/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <AlertCircle className="h-4 w-4 text-primary" />
          Critical Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-6">
        {deadlines.length === 0 ? (
          <EmptyState label="No critical deadlines" />
        ) : (
          <>
            <div className="flex-1 space-y-5">
              {visibleDeadlines.map((deadline) => (
                <div
                  key={`${deadline.source}-${deadline.title}-${deadline.dueDate}`}
                  className="group flex items-start justify-between gap-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-muted p-2 transition-colors group-hover:bg-primary/5">
                      <Calendar className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold leading-snug">
                        {deadline.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {deadline.label} · {formatDate(deadline.dueDate)}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] font-bold uppercase",
                          getDeadlineClass(deadline),
                        )}
                      >
                        {deadline.status.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-2xl font-black">
                      {Math.abs(deadline.daysLeft)}
                    </span>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      {deadline.daysLeft < 0 ? "Days Overdue" : "Days Left"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {canToggle && (
              <Button
                variant="ghost"
                className="mt-6 h-9 w-full text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? "Show Less" : `Show All (${deadlines.length})`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivities({ activities }: { activities: DashboardActivity[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleActivities = showAll ? activities : activities.slice(0, 6);
  const canToggle = activities.length > 6;

  const sourceColors: Record<string, string> = {
    domain: "bg-emerald-500",
    audit: "bg-blue-500",
  };

  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] flex-row items-center justify-between border-b bg-muted/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Activity className="h-4 w-4 text-primary" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-6">
        {activities.length === 0 ? (
          <EmptyState label="No recent activity" />
        ) : (
          <>
            <div className="relative flex-1 space-y-4">
              <div className="absolute bottom-2 left-1 top-2 w-0.5 bg-muted" />
              {visibleActivities.map((activity, index) => (
                <div
                  key={`${activity.timestamp}-${index}`}
                  className="relative z-10 flex items-start gap-4"
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full shadow-sm",
                      sourceColors[activity.source] || "bg-slate-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed">
                      <span className="font-black text-foreground">
                        {activity.actor || "System"}{" "}
                      </span>
                      <span className="font-medium text-muted-foreground">
                        {activity.title}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {activity.relativeTime || formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {canToggle && (
              <Button
                variant="ghost"
                className="mt-6 h-9 w-full text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? "Show Less" : `Show All (${activities.length})`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ThematicAreaChart({
  items,
  totalPolicies,
}: {
  items: DashboardThematicArea[];
  totalPolicies: number;
}) {
  const chartData = items.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] border-b bg-muted/30 pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Policies by Thematic Area
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-4 pt-6">
        {chartData.length === 0 ? (
          <EmptyState label="No thematic area data" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative h-36 w-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Registry
                </span>
                <span className="text-2xl font-black">{totalPolicies}</span>
              </div>
            </div>
            <div className="mt-6 grid w-full grid-cols-1 gap-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[10px]">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex-1 truncate font-bold uppercase tracking-tight text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="font-black">{item.count}</span>
                  <span className="text-muted-foreground/60">
                    ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResearchTrendChart({
  trends,
}: {
  trends: DashboardAnalytics["researchProposalTrends"]["items"];
}) {
  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] flex-row items-center justify-between border-b bg-muted/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <FlaskConical className="h-4 w-4 text-primary" />
          Research Proposal Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-6">
        {trends.length === 0 ? (
          <EmptyState label="No research trend data" />
        ) : (
          <div className="min-h-[280px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trends}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Submissions"
                  stroke="#2563eb"
                  strokeWidth={4}
                  dot={{
                    fill: "white",
                    stroke: "#2563eb",
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsRowSkeleton({ count }: { count: number }) {
  const gridClass =
    count <= 1
      ? "grid-cols-1 sm:max-w-sm"
      : count === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : count === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className={cn("grid auto-rows-fr gap-4", gridClass)}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <AnalyticsRowSkeleton count={3} />
      <AnalyticsRowSkeleton count={3} />
      <div className="grid auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-xl lg:col-span-5" />
        <Skeleton className="h-96 rounded-xl lg:col-span-3" />
        <Skeleton className="h-96 rounded-xl lg:col-span-4" />
      </div>
      <div className="grid auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-xl lg:col-span-4" />
        <Skeleton className="h-96 rounded-xl lg:col-span-3" />
        <Skeleton className="h-96 rounded-xl lg:col-span-5" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      const apiError = err as ApiError;
      const message =
        apiError?.status === 502
          ? "Unable to reach the backend. Ensure Docker is running (backend-web on port 8000), then refresh."
          : apiError?.message || "Unable to load dashboard analytics.";

      console.error("Failed to load dashboard analytics:", apiError);
      setAnalytics(null);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const { policyCards, researchCards } = useMemo(() => {
    const cards = analytics?.generalOverview.cards ?? [];

    return {
      policyCards: cards.filter((card) => POLICY_CARD_KEYS.has(card.key)),
      researchCards: cards.filter((card) => RESEARCH_CARD_KEYS.has(card.key)),
    };
  }, [analytics]);

  const lastUpdated = useMemo(
    () =>
      formatDateTime(
        analytics?.generalOverview.asOf || analytics?.generatedAt || undefined,
      ),
    [analytics],
  );

  if (!user) return null;

  return (
    <div className="flex-1 space-y-6 bg-background p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {greeting}, {user.firstName}
          </h1>
          <p className="mt-1 font-medium text-muted-foreground">
            Policy & Research Dashboard. Last updated {lastUpdated}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadAnalytics}
          disabled={!isHydrated || isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error || !analytics ? (
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {error || "Dashboard analytics unavailable"}
              </p>
              <p className="text-sm text-muted-foreground">
                Check the backend connection and try again.
              </p>
            </div>
            <Button onClick={loadAnalytics}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-8">
            <AnalyticsCardRow
              title="Policy Analytics"
              description="Registered policy documents, submitted concept notes, and policy drafts."
              icon={BookOpen}
              cards={policyCards}
            />
            <AnalyticsCardRow
              title="Research Analytics"
              description="Registered research outputs, submitted proposals, and funded projects."
              icon={FlaskConical}
              cards={researchCards}
            />
          </div>

          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ApprovalPipeline
                stages={analytics.stagePolicyLifecycle.stages}
                totalDocuments={analytics.stagePolicyLifecycle.totalDocuments}
              />
            </div>
            <div className="lg:col-span-3">
              <WorkflowOverview items={analytics.operationalStatus.items} />
            </div>
            <div className="lg:col-span-4">
              <CriticalDeadlines
                deadlines={analytics.criticalDeadlines.items}
              />
            </div>
          </div>

          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 pb-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <RecentActivities
                activities={analytics.liveActivityFeed.items}
              />
            </div>
            <div className="lg:col-span-3">
              <ThematicAreaChart
                items={analytics.policiesByThematicArea.items}
                totalPolicies={analytics.policiesByThematicArea.totalPolicies}
              />
            </div>
            <div className="lg:col-span-5">
              <ResearchTrendChart
                trends={analytics.researchProposalTrends.items}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
