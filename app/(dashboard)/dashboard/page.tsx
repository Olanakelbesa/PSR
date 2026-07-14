"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
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
import type { ApiError } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDashboardAnalytics } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import type {
  DashboardActivity,
  DashboardAnalytics,
  DashboardChangeDirection,
  DashboardResearchGrant,
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
  "new_concept_note_submitted",
  "concept_note_under_review",
  "concept_note_approved",
  "new_draft_submitted",
  "draft_under_review",
  "draft_approved",
  "policy_repository_registered",
  "resubmitted_concept_notes",
  "resubmitted_drafts",
]);

const RESEARCH_CARD_KEYS = new Set([
  "new_proposal_submitted",
  "under_psr_screening",
  "under_expert_review",
  "ready_for_funding",
  "funded_proposal",
  "research_repository_registered",
]);

const overviewIcons: Record<string, IconType> = {
  new_concept_note_submitted: FilePlus,
  concept_note_under_review: Clock,
  concept_note_approved: CheckCircle2,
  new_draft_submitted: FileText,
  draft_under_review: Clock,
  draft_approved: CheckCircle2,
  policy_repository_registered: BookOpen,
  resubmitted_concept_notes: RefreshCcw,
  resubmitted_drafts: RefreshCcw,
  new_proposal_submitted: FileText,
  under_psr_screening: ClipboardCheck,
  under_expert_review: Clock,
  ready_for_funding: AlertCircle,
  funded_proposal: CheckCircle2,
  research_repository_registered: FlaskConical,
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
  new_concept_note_submitted: {
    bgGradient: "from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10",
    borderHover: "hover:border-blue-500/30",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-500 dark:text-blue-400",
    glowColor: "shadow-blue-500/5 hover:shadow-blue-500/10",
  },
  concept_note_under_review: {
    bgGradient: "from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10",
    borderHover: "hover:border-amber-500/30",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-500 dark:text-amber-400",
    glowColor: "shadow-amber-500/5 hover:shadow-amber-500/10",
  },
  concept_note_approved: {
    bgGradient: "from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10",
    borderHover: "hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    glowColor: "shadow-emerald-500/5 hover:shadow-emerald-500/10",
  },
  new_draft_submitted: {
    bgGradient: "from-violet-500/5 to-fuchsia-500/5 dark:from-violet-500/10 dark:to-fuchsia-500/10",
    borderHover: "hover:border-violet-500/30",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-500 dark:text-violet-400",
    glowColor: "shadow-violet-500/5 hover:shadow-violet-500/10",
  },
  draft_under_review: {
    bgGradient: "from-sky-500/5 to-cyan-500/5 dark:from-sky-500/10 dark:to-cyan-500/10",
    borderHover: "hover:border-sky-500/30",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
    iconColor: "text-sky-500 dark:text-sky-400",
    glowColor: "shadow-sky-500/5 hover:shadow-sky-500/10",
  },
  draft_approved: {
    bgGradient: "from-teal-500/5 to-emerald-500/5 dark:from-teal-500/10 dark:to-emerald-500/10",
    borderHover: "hover:border-teal-500/30",
    iconBg: "bg-teal-500/10 dark:bg-teal-500/20",
    iconColor: "text-teal-500 dark:text-teal-400",
    glowColor: "shadow-teal-500/5 hover:shadow-teal-500/10",
  },
  policy_repository_registered: {
    bgGradient: "from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10",
    borderHover: "hover:border-indigo-500/30",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconColor: "text-indigo-500 dark:text-indigo-400",
    glowColor: "shadow-indigo-500/5 hover:shadow-indigo-500/10",
  },
  resubmitted_concept_notes: {
    bgGradient: "from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10",
    borderHover: "hover:border-rose-500/30",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-500 dark:text-rose-400",
    glowColor: "shadow-rose-500/5 hover:shadow-rose-500/10",
  },
  resubmitted_drafts: {
    bgGradient: "from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10",
    borderHover: "hover:border-orange-500/30",
    iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
    iconColor: "text-orange-500 dark:text-orange-400",
    glowColor: "shadow-orange-500/5 hover:shadow-orange-500/10",
  },
  new_proposal_submitted: {
    bgGradient: "from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10",
    borderHover: "hover:border-blue-500/30",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-500 dark:text-blue-400",
    glowColor: "shadow-blue-500/5 hover:shadow-blue-500/10",
  },
  under_psr_screening: {
    bgGradient: "from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10",
    borderHover: "hover:border-amber-500/30",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-500 dark:text-amber-400",
    glowColor: "shadow-amber-500/5 hover:shadow-amber-500/10",
  },
  under_expert_review: {
    bgGradient: "from-violet-500/5 to-fuchsia-500/5 dark:from-violet-500/10 dark:to-fuchsia-500/10",
    borderHover: "hover:border-violet-500/30",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-500 dark:text-violet-400",
    glowColor: "shadow-violet-500/5 hover:shadow-violet-500/10",
  },
  ready_for_funding: {
    bgGradient: "from-sky-500/5 to-cyan-500/5 dark:from-sky-500/10 dark:to-cyan-500/10",
    borderHover: "hover:border-sky-500/30",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
    iconColor: "text-sky-500 dark:text-sky-400",
    glowColor: "shadow-sky-500/5 hover:shadow-sky-500/10",
  },
  funded_proposal: {
    bgGradient: "from-teal-500/5 to-emerald-500/5 dark:from-teal-500/10 dark:to-emerald-500/10",
    borderHover: "hover:border-teal-500/30",
    iconBg: "bg-teal-500/10 dark:bg-teal-500/20",
    iconColor: "text-teal-500 dark:text-teal-400",
    glowColor: "shadow-teal-500/5 hover:shadow-teal-500/10",
  },
  research_repository_registered: {
    bgGradient: "from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10",
    borderHover: "hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    glowColor: "shadow-emerald-500/5 hover:shadow-emerald-500/10",
  },
};

const CARD_ROUTES: Record<string, string> = {
  new_concept_note_submitted: "/policies/concept-notes/manage-concept-notes?queue=new_submissions",
  concept_note_under_review: "/policies/concept-notes/manage-concept-notes?queue=under_review",
  concept_note_approved: "/policies/concept-notes/manage-concept-notes?queue=approved",
  new_draft_submitted: "/policies/drafts/manage-drafts?status=submitted",
  draft_under_review: "/policies/drafts/review-draft?status=under_review",
  draft_approved: "/policies/drafts/manage-drafts?status=psr_approved",
  policy_repository_registered: "/policies/repository",
  resubmitted_concept_notes: "/policies/concept-notes/review-concept-note?queue=resubmitted",
  resubmitted_drafts: "/policies/drafts/review-draft?status=resubmitted",
  new_proposal_submitted: "/research/proposals/my-proposals",
  under_psr_screening: "/research/proposals/screening-reviews",
  under_expert_review: "/research/proposals/technical-reviews",
  ready_for_funding: "/research/ready-for-funding",
  funded_proposal: "/research/funding-recommendations",
  research_repository_registered: "/research/repository",
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

function getGrantUrgencyClass(grant: DashboardResearchGrant) {
  if (grant.urgency === "urgent" || grant.daysLeft <= 3) {
    return "text-red-600";
  }

  if (grant.urgency === "scheduled" || grant.daysLeft <= 7) {
    return "text-amber-600";
  }

  return "text-emerald-600";
}

function formatGrantStatus(status: string) {
  return status.replace(/_/g, " ");
}

function isUpcomingGrantCall(grant: DashboardResearchGrant) {
  const status = grant.status.toLowerCase();
  return status === "published" || status === "open";
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
  extraCard,
}: {
  title: string;
  description: string;
  icon: IconType;
  cards: DashboardOverviewCard[];
  extraCard?: React.ReactNode;
}) {
  const totalItems = cards.length + (extraCard ? 1 : 0);
  const gridClass =
    totalItems <= 1
      ? "grid-cols-1 sm:max-w-sm"
      : totalItems === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : totalItems === 3
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
        {extraCard}
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
  const href = CARD_ROUTES[stat.key];

  const card = (
    <Card className={cn(
      "group relative overflow-hidden h-full border border-primary/10 bg-gradient-to-br bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
      href && "cursor-pointer",
      style.bgGradient,
      style.borderHover,
      style.glowColor
    )}>
      {/* Corner color glow overlay */}
      <div className={cn(
        "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-40 dark:opacity-20 transition-opacity group-hover:opacity-60",
        stat.key === "new_concept_note_submitted" && "bg-blue-500",
        stat.key === "concept_note_under_review" && "bg-amber-500",
        stat.key === "concept_note_approved" && "bg-emerald-500",
        stat.key === "new_draft_submitted" && "bg-violet-500",
        stat.key === "draft_under_review" && "bg-sky-500",
        stat.key === "draft_approved" && "bg-teal-500",
        stat.key === "policy_repository_registered" && "bg-indigo-500",
        stat.key === "new_proposal_submitted" && "bg-blue-500",
        stat.key === "under_psr_screening" && "bg-amber-500",
        stat.key === "under_expert_review" && "bg-violet-500",
        stat.key === "ready_for_funding" && "bg-sky-500",
        stat.key === "funded_proposal" && "bg-teal-500",
        stat.key === "research_repository_registered" && "bg-emerald-500"
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

  if (!href) return card;

  return (
    <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl">
      {card}
    </Link>
  );
}

const RESUBMITTED_KEYS = new Set(["resubmitted_concept_notes", "resubmitted_drafts"]);

function ResubmittedSplitCard({
  conceptNoteCard,
  draftCard,
}: {
  conceptNoteCard: DashboardOverviewCard;
  draftCard: DashboardOverviewCard;
}) {
  const cnIsDown = conceptNoteCard.changeDirection === "down";
  const drIsDown = draftCard.changeDirection === "down";
  const CNTrendIcon = cnIsDown ? TrendingDown : TrendingUp;
  const DRTrendIcon = drIsDown ? TrendingDown : TrendingUp;

  return (
    <Card className="h-full border border-primary/10 shadow-sm">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="px-4 pt-3.5 pb-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resubmitted
          </p>
        </div>
        <div className="h-px bg-border/60" />
        <div className="flex-1 flex flex-col sm:flex-row">
          <Link
            href={CARD_ROUTES.resubmitted_concept_notes}
            className="flex-1 flex items-center justify-between gap-3 p-4 min-w-0 transition-colors hover:bg-rose-500/5 dark:hover:bg-rose-500/10 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                Concept Notes
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                {conceptNoteCard.value.toLocaleString()}
              </p>
              <div className="mt-2.5">
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                  cnIsDown ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}>
                  <CNTrendIcon className="h-3 w-3" />
                  <span>{cnIsDown ? "-" : "+"}{Math.abs(conceptNoteCard.changePercent)}%</span>
                </span>
              </div>
            </div>
            <div className="rounded-xl p-2.5 bg-rose-500/10 dark:bg-rose-500/20 shrink-0">
              <FilePlus className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            </div>
          </Link>

          <div className="hidden sm:block w-px self-stretch bg-border/60" />
          <div className="block sm:hidden h-px mx-4 bg-border/60" />

          <Link
            href={CARD_ROUTES.resubmitted_drafts}
            className="flex-1 flex items-center justify-between gap-3 p-4 min-w-0 transition-colors hover:bg-orange-500/5 dark:hover:bg-orange-500/10 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                Drafts
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                {draftCard.value.toLocaleString()}
              </p>
              <div className="mt-2.5">
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                  drIsDown ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}>
                  <DRTrendIcon className="h-3 w-3" />
                  <span>{drIsDown ? "-" : "+"}{Math.abs(draftCard.changePercent)}%</span>
                </span>
              </div>
            </div>
            <div className="rounded-xl p-2.5 bg-orange-500/10 dark:bg-orange-500/20 shrink-0">
              <FileText className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </div>
          </Link>
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

function UpcomingResearchGrants({
  grants,
}: {
  grants: DashboardResearchGrant[];
}) {
  const [showAll, setShowAll] = useState(false);
  const upcomingCalls = useMemo(
    () => grants.filter(isUpcomingGrantCall),
    [grants],
  );
  const visibleGrants = showAll ? upcomingCalls : upcomingCalls.slice(0, 5);
  const canToggle = upcomingCalls.length > 5;

  return (
    <Card className="flex h-full flex-col border-primary/10 shadow-sm">
      <CardHeader className="min-h-[76px] border-b bg-muted/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <FlaskConical className="h-4 w-4 text-primary" />
          Upcoming Research Grant Calls
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-6">
        {upcomingCalls.length === 0 ? (
          <EmptyState label="No upcoming research grant calls" />
        ) : (
          <>
            <div className="flex-1 space-y-5">
              {visibleGrants.map((grant) => {
                const countdown =
                  !grant.isOpen &&
                  grant.daysUntilOpen !== null &&
                  grant.daysUntilOpen >= 0
                    ? grant.daysUntilOpen
                    : Math.max(grant.daysLeft, 0);
                const countdownLabel =
                  !grant.isOpen &&
                  grant.daysUntilOpen !== null &&
                  grant.daysUntilOpen >= 0
                    ? "Days Until Open"
                    : "Days Left";

                return (
                  <Link
                    key={grant.id}
                    href={`/research/grant-calls/${grant.id}`}
                    className="group flex items-start justify-between gap-4 rounded-lg transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-muted p-2 transition-colors group-hover:bg-primary/5">
                        <Calendar className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-bold leading-snug">
                          {grant.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {grant.label}
                          {grant.isOpen
                            ? ` · Closes ${formatDate(grant.dueDate)}`
                            : ` · Opens ${formatDate(grant.openDate)}`}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-[10px] font-bold uppercase",
                            getGrantUrgencyClass(grant),
                          )}
                        >
                          {formatGrantStatus(grant.status)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-2xl font-black">{countdown}</span>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        {countdownLabel}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {canToggle && (
              <Button
                variant="ghost"
                className="mt-6 h-9 w-full text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? "Show Less" : `Show All (${upcomingCalls.length})`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivities({ activities }: { activities: DashboardActivity[] }) {
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
      <CardContent className="flex min-h-0 flex-1 flex-col pt-6">
        {activities.length === 0 ? (
          <EmptyState label="No recent activity" />
        ) : (
          <div className="relative max-h-[23.5rem] space-y-4 overflow-y-auto pr-1">
            <div className="absolute bottom-2 left-1 top-2 w-0.5 bg-muted" />
            {activities.map((activity, index) => (
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
  const { user: sessionUser } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardAnalytics();
  const [greeting, setGreeting] = useState("Good morning");

  const displayFirstName =
    currentUser?.firstName?.trim() ||
    sessionUser?.firstName ||
    "there";

  const errorMessage = isError
    ? (() => {
        const apiError = error as unknown as ApiError;
        return apiError?.status === 502
          ? "Unable to reach the backend. Ensure Docker is running (backend-web on port 8000), then refresh."
          : apiError?.message || "Unable to load dashboard analytics.";
      })()
    : null;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const { policyCards, researchCards, resubmittedCN, resubmittedDraft } = useMemo(() => {
    const cards = analytics?.generalOverview.cards ?? [];

    return {
      policyCards: cards.filter((card) => POLICY_CARD_KEYS.has(card.key) && !RESUBMITTED_KEYS.has(card.key)),
      researchCards: cards.filter((card) => RESEARCH_CARD_KEYS.has(card.key)),
      resubmittedCN: cards.find((card) => card.key === "resubmitted_concept_notes"),
      resubmittedDraft: cards.find((card) => card.key === "resubmitted_drafts"),
    };
  }, [analytics]);

  const lastUpdated = useMemo(
    () =>
      formatDateTime(
        analytics?.generalOverview.asOf || analytics?.generatedAt || undefined,
      ),
    [analytics],
  );

  if (!sessionUser) return null;

  return (
    <div className="flex-1 space-y-6 bg-background p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {greeting}, {displayFirstName}
          </h1>
          <p className="mt-1 font-medium text-muted-foreground">
            {/* Policy & Research. Last updated {lastUpdated}. */}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : errorMessage || !analytics ? (
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {errorMessage || "Dashboard analytics unavailable"}
              </p>
              <p className="text-sm text-muted-foreground">
                Check the backend connection and try again.
              </p>
            </div>
            <Button onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-8">
            <AnalyticsCardRow
              title="Policy Documents"
              description="Your submitted concept notes, policy drafts, and repository records."
              icon={BookOpen}
              cards={policyCards}
              extraCard={
                resubmittedCN && resubmittedDraft ? (
                  <ResubmittedSplitCard
                    conceptNoteCard={resubmittedCN}
                    draftCard={resubmittedDraft}
                  />
                ) : undefined
              }
            />
            <AnalyticsCardRow
              title="Research Analytics"
              description="Proposals submitted, under screening, expert review, ready for funding, and registered outputs."
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
              <UpcomingResearchGrants
                grants={analytics.upcomingResearchGrants?.items ?? []}
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
