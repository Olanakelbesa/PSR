"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useFundingRecommendationCandidates,
  useFundingRecommendations,
} from "@/hooks";
import type {
  FundingRecommendation,
  FundingRecommendationCandidate,
  FundingRecommendationPi,
} from "@/types/funding-recommendation";

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);

  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function piName(pi?: FundingRecommendationPi | string | null) {
  if (!pi) return "-";
  if (typeof pi === "string") return pi;

  return pi.full_name || pi.fullName || pi.email || "-";
}

function StatusBadge({
  status,
  needsIrb,
}: {
  status?: string | null;
  needsIrb?: boolean;
}) {
  const label = status ? status.replace(/_/g, " ") : "pending";
  const approved = status === "approved" || !needsIrb;

  return (
    <Badge
      className={cn(
        "border text-[10px] font-bold uppercase shadow-none",
        approved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {approved ? (
        <CheckCircle2 className="mr-1 h-3 w-3" />
      ) : (
        <Clock className="mr-1 h-3 w-3" />
      )}
      {needsIrb ? label : "not required"}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: typeof FileText;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm tracking-[0.2em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-black">{value}</div>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
        <div className={cn("rounded-full p-3 text-white", accent)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function FundingRecommendationsPage() {
  const router = useRouter();

  const candidateFilters = useMemo(
    () => ({
      page: 1,
      limit: 100,
      has_funding_decision: true,
      funding_decision_status: "approved" as const,
      has_funding_recommendation: false,
      ordering: "-average_score_percentage",
    }),
    [],
  );

  const recommendationFilters = useMemo(
    () => ({
      page: 1,
      limit: 100,
      ordering: "-recommended_at",
    }),
    [],
  );

  const {
    data: candidateData,
    isLoading: isCandidatesLoading,
    isError: isCandidatesError,
    refetch: refetchCandidates,
  } = useFundingRecommendationCandidates(candidateFilters);

  const {
    data: recommendationData,
    isLoading: isRecommendationsLoading,
    isError: isRecommendationsError,
    refetch: refetchRecommendations,
  } = useFundingRecommendations(recommendationFilters);

  const isLoading = isCandidatesLoading || isRecommendationsLoading;
  const error =
    isCandidatesError || isRecommendationsError
      ? "Unable to load funding recommendations."
      : null;

  const candidates = useMemo(
    () =>
      (candidateData?.data ?? []).filter((item) => item.funding_decision_id),
    [candidateData?.data],
  );

  const recommendations = recommendationData?.data ?? [];

  const totalAwarded = useMemo(
    () =>
      recommendations.reduce(
        (sum, item) => sum + Number(item.total_award_amount || 0),
        0,
      ),
    [recommendations],
  );

  const stats = [
    {
      title: "Awaiting Recommendation",
      value: candidates.length,
      caption: "Approved funding decisions",
      icon: Clock,
      accent: "bg-amber-600",
    },
    {
      title: "Recommendations",
      value: recommendations.length,
      caption: "Submitted funding records",
      icon: BadgeCheck,
      accent: "bg-primary",
    },
    {
      title: "Total Awarded",
      value: formatCurrency(totalAwarded),
      caption: "Across submitted recommendations",
      icon: Banknote,
      accent: "bg-emerald-600",
    },
    {
      title: "Ethics Cleared",
      value: recommendations.filter(
        (item) => item.has_ethical_clearance_approval,
      ).length,
      caption: "Marked with clearance approval",
      icon: ShieldCheck,
      accent: "bg-blue-600",
    },
  ];

  const candidateColumns: ColumnDef<FundingRecommendationCandidate>[] = [
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.reference_number || `SCR-${row.original.screening_id}`}
        </span>
      ),
    },
    {
      accessorKey: "proposal_title",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-105">
          <p className="line-clamp-2 text-sm font-bold">
            {row.original.proposal_title || "Untitled proposal"}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {row.original.organization?.name || "Organization not provided"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "principal_investigator",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">
            {piName(row.original.principal_investigator)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.principal_investigator?.email || "-"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "budget_requested",
      header: "Requested Budget",
      cell: ({ row }) => (
        <span className="font-bold">
          {formatCurrency(row.original.budget_requested)}
        </span>
      ),
    },
    {
      accessorKey: "average_score_percentage",
      header: "Score",
      cell: ({ row }) => (
        <Badge className="border-blue-200 bg-blue-50 text-blue-700 shadow-none">
          {Number(row.original.average_score_percentage || 0).toFixed(1)}%
        </Badge>
      ),
    },
    {
      id: "irb",
      header: "IRB",
      cell: ({ row }) => (
        <StatusBadge
          needsIrb={row.original.need_irb_ethical_clearance}
          status={row.original.ethical_clearance_status}
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/research/funding-recommendations/${row.original.funding_decision_id}`,
                )
              }
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Open Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const recommendationColumns: ColumnDef<FundingRecommendation>[] = [
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.reference_number || `FR-${row.original.id}`}
        </span>
      ),
    },
    {
      accessorKey: "proposal_title",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-105">
          <p className="line-clamp-2 text-sm font-bold">
            {row.original.proposal_title || "Untitled proposal"}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Ready for Funding ID{" "}
            {row.original.ready_for_funding_id || row.original.proposal}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "pi",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">{piName(row.original.pi)}</span>
          <span className="text-[10px] text-muted-foreground">
            {typeof row.original.pi === "object" && row.original.pi?.email
              ? row.original.pi.email
              : "-"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "total_award_amount",
      header: "Award Amount",
      cell: ({ row }) => (
        <span className="font-bold">
          {formatCurrency(row.original.total_award_amount)}
        </span>
      ),
    },
    {
      accessorKey: "has_ethical_clearance_approval",
      header: "Ethics",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "border text-[10px] font-bold uppercase shadow-none",
            row.original.has_ethical_clearance_approval
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-700",
          )}
        >
          {row.original.has_ethical_clearance_approval
            ? "Approved"
            : "Not marked"}
        </Badge>
      ),
    },
    {
      accessorKey: "recommended_at",
      header: "Recommended",
      cell: ({ row }) => formatDate(row.original.recommended_at),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(
              `/research/funding-recommendations/${row.original.ready_for_funding_id || row.original.proposal}`,
            )
          }
        >
          View
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Funding Recommendations"
      description="Prepare award recommendations for approved funding decisions and review submitted records."
      actions={
        <Button
          variant="outline"
          onClick={() => {
            void refetchCandidates();
            void refetchRecommendations();
          }}
          disabled={isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))
            : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
        </div>

        {error ? (
          <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <div className="rounded-full bg-rose-100 p-4 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Check the backend connection and try again.
                </p>
              </div>
              <Button
                onClick={() => {
                  void refetchCandidates();
                  void refetchRecommendations();
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-10 w-full max-w-md" />
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending Queue
                <Badge variant="secondary" className="ml-2">
                  {candidates.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="submitted">
                Submitted
                <Badge variant="secondary" className="ml-2">
                  {recommendations.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <DataTable
                columns={candidateColumns}
                data={candidates}
                searchKey="proposal_title"
                searchPlaceholder="Search pending recommendations..."
                onRowClick={(row) =>
                  router.push(
                    `/research/funding-recommendations/${row.funding_decision_id}`,
                  )
                }
                emptyMessage="No proposals awaiting funding recommendation"
                emptyDescription="Approved funding decisions without recommendations will appear here."
              />
            </TabsContent>

            <TabsContent value="submitted" className="space-y-4">
              <DataTable
                columns={recommendationColumns}
                data={recommendations}
                searchKey="proposal_title"
                searchPlaceholder="Search submitted recommendations..."
                onRowClick={(row) =>
                  router.push(
                    `/research/funding-recommendations/${row.ready_for_funding_id || row.proposal}`,
                  )
                }
                emptyMessage="No funding recommendations submitted"
                emptyDescription="Submitted funding recommendation records will appear here."
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageContainer>
  );
}
