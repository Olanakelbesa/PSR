"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import {
  DataTable,
  type FilterOptionConfig,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import { fundingRecommendationRoutes } from "@/lib/routes/funding-recommendations";
import {
  useFundingRecommendationCandidates,
  useFundingRecommendations,
  useProposalTypes,
} from "@/hooks";
import { useFundingRecommendationDocumentDownload } from "@/hooks/useFundingRecommendationDocumentDownload";
import { useOpenGrantCallsForSelect } from "@/lib/queries/grant-calls";
import type {
  FundingRecommendation,
  FundingRecommendationCandidate,
  FundingRecommendationPi,
} from "@/types/funding-recommendation";

const ALL_FILTER_VALUE = "all";

type RankedFundingRecommendationCandidate = FundingRecommendationCandidate & {
  rank: number;
};

type PipelineStage = "pending" | "funded";

type PipelineRow = {
  id: string;
  stage: PipelineStage;
  rank: number | null;
  reference: string;
  proposalTitle: string;
  callTitle: string;
  proposalTypeName: string;
  organizationName: string;
  principalInvestigator: FundingRecommendationPi | string | null;
  principalInvestigatorEmail: string;
  requestedAmount: string | number | null;
  awardedAmount: string | number | null;
  amount: string | number | null;
  amountLabel: "Requested" | "Awarded";
  averageScorePercentage: number | null;
  needIrbEthicalClearance: boolean;
  ethicalClearanceStatus: string | null;
  recommendedAt: string | null;
  recommendationId: string | null;
  navigationId: string;
};

function extractId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const nested = candidate.id;
    if (typeof nested === "string" || typeof nested === "number") {
      const normalized = String(nested).trim();
      return normalized.length > 0 ? normalized : null;
    }
  }

  return null;
}

function normalizeAmount(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" || typeof value === "number" ? value : null;
}

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

type StatAccent = {
  iconBg: string;
  iconColor: string;
  border: string;
  activeRing: string;
};

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  accent,
  onClick,
  isActive,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: typeof FileText;
  accent: StatAccent;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <Card
      className={cn(
        "cursor-pointer border shadow-sm transition-all hover:shadow-md",
        accent.border,
        isActive && cn("ring-2 shadow-md", accent.activeRing),
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("shrink-0 rounded-xl p-3", accent.iconBg)}>
          <Icon className={cn("h-5 w-5", accent.iconColor)} />
        </div>
        <div>
          <div className="text-2xl font-black">{displayValue}</div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/80">
            {caption}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FundingRecommendationsPage() {
  const router = useRouter();
  const { download: downloadDocument, active: documentDownloadActive } =
    useFundingRecommendationDocumentDownload();
  const [selectedCall, setSelectedCall] = useState(ALL_FILTER_VALUE);
  const [selectedProposalType, setSelectedProposalType] =
    useState(ALL_FILTER_VALUE);
  const [selectedPipelineStage, setSelectedPipelineStage] =
    useState(ALL_FILTER_VALUE);
  const [selectedIrbFilter, setSelectedIrbFilter] = useState(ALL_FILTER_VALUE);
  const [selectedScoreBand, setSelectedScoreBand] = useState(ALL_FILTER_VALUE);
  const [selectedFundingDecisionStatus, setSelectedFundingDecisionStatus] =
    useState(ALL_FILTER_VALUE);
  const [selectedEthicalClearance, setSelectedEthicalClearance] =
    useState(ALL_FILTER_VALUE);

  const { data: openGrantCallsData } = useOpenGrantCallsForSelect();
  const { data: proposalTypes } = useProposalTypes();

  const candidateFilters = useMemo(
    () => ({
      page: 1,
      limit: 100,
      call: selectedCall !== ALL_FILTER_VALUE ? selectedCall : undefined,
      proposal_type:
        selectedProposalType !== ALL_FILTER_VALUE
          ? selectedProposalType
          : undefined,
      has_funding_decision: true,
      funding_decision_status: "approved" as const,
      ordering: "-average_score_percentage",
    }),
    [selectedCall, selectedProposalType],
  );

  const recommendationFilters = useMemo(
    () => ({
      page: 1,
      limit: 100,
      funding_decision_status:
        selectedFundingDecisionStatus !== ALL_FILTER_VALUE
          ? selectedFundingDecisionStatus
          : undefined,
      has_ethical_clearance_approval:
        selectedEthicalClearance === "approved"
          ? true
          : selectedEthicalClearance === "not_approved"
            ? false
            : undefined,
      ordering: "-recommended_at",
    }),
    [selectedFundingDecisionStatus, selectedEthicalClearance],
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
      (candidateData?.data ?? []).filter((item) => item.fundingDecisionId),
    [candidateData?.data],
  );

  const rankedCandidates = useMemo<RankedFundingRecommendationCandidate[]>(
    () => candidates.map((candidate, index) => ({ ...candidate, rank: index + 1 })),
    [candidates],
  );

  const openGrantCalls = openGrantCallsData?.data ?? [];
  const proposalTypeOptions = proposalTypes?.data ?? [];

  const recommendations = recommendationData?.data ?? [];

  const recommendationByDecisionId = useMemo(() => {
    const map = new Map<string, FundingRecommendation>();
    for (const item of recommendations) {
      const key =
        extractId(item.readyForFundingId) ?? extractId(item.ready_for_funding_id) ?? extractId(item.proposal) ?? "";
      if (key) map.set(key, item);
    }
    return map;
  }, [recommendations]);

  const pipelineRows = useMemo(() => {
    let rows: PipelineRow[] = rankedCandidates.map((item) => {
      const raw = item as unknown as Record<string, unknown>;
      const pi =
        (raw.principalInvestigator as FundingRecommendationPi | string | null) ??
        (raw.principal_investigator as FundingRecommendationPi | string | null) ??
        (raw.pi as FundingRecommendationPi | string | null) ??
        null;

      const piEmail =
        typeof pi === "object" && pi && "email" in pi
          ? String(pi.email ?? "-")
          : "-";

      const callTitle =
        (raw.call as { title?: string } | undefined)?.title ?? "No grant call";
      const proposalTypeName =
        (raw.proposalType as { name?: string } | undefined)?.name ??
        (raw.proposal_type as { name?: string } | undefined)?.name ??
        "No proposal type";
      const organizationName =
        (raw.organization as { name?: string } | undefined)?.name ??
        "Organization not provided";

      const scoreRaw =
        raw.averageScorePercentage ?? raw.average_score_percentage ?? null;
      const scoreValue =
        scoreRaw === null || scoreRaw === undefined || scoreRaw === ""
          ? null
          : Number(scoreRaw);
      const normalizedScore =
        scoreValue !== null && Number.isFinite(scoreValue) ? scoreValue : null;

      const navigationId =
        extractId(raw.fundingDecisionId) ??
        extractId(raw.funding_decision_id) ??
        extractId(raw.screeningId) ??
        extractId(raw.screening_id) ??
        "";

      const recommendation = recommendationByDecisionId.get(navigationId);
      const recommendationCount = Number(
        raw.fundingRecommendationsCount ??
        raw.funding_recommendations_count ??
        (recommendation ? 1 : 0),
      );
      const isFunded = Boolean(recommendation) || recommendationCount > 0;
      const recommendationId = recommendation ? String(recommendation.id) : null;
      const rawFundingRecommendations = (
        raw.funding_recommendations ?? raw.fundingRecommendations ?? []
      ) as Array<Record<string, unknown>>;
      const latestRawRecommendation = rawFundingRecommendations[0] ?? null;
      const recommendedAtFallback = extractId(
        latestRawRecommendation?.recommended_at ??
        latestRawRecommendation?.recommendedAt,
      );
      const requestedAmount =
        normalizeAmount(raw.budgetRequested ?? raw.budget_requested) ??
        normalizeAmount(recommendation?.budgetRequested);
      const awardedAmount = normalizeAmount(recommendation?.totalAwardAmount ?? recommendation?.total_award_amount);

      return {
        id: `pipeline-${String(raw.screeningId ?? raw.screening_id ?? item.rank)}`,
        stage: isFunded ? "funded" : "pending",
        rank: item.rank,
        reference:
          String(raw.referenceNumber ?? raw.reference_number ?? "") ||
          `SCR-${String(raw.screeningId ?? raw.screening_id ?? item.rank)}`,
        proposalTitle:
          String(raw.proposalTitle ?? raw.proposal_title ?? "") ||
          "Untitled proposal",
        callTitle,
        proposalTypeName,
        organizationName,
        principalInvestigator: pi,
        principalInvestigatorEmail: piEmail,
        requestedAmount,
        awardedAmount,
        amount: isFunded
          ? awardedAmount ?? requestedAmount
          : requestedAmount,
        amountLabel: isFunded ? "Awarded" : "Requested",
        averageScorePercentage: normalizedScore,
        needIrbEthicalClearance: Boolean(
          raw.needIrbEthicalClearance ?? raw.need_irb_ethical_clearance,
        ),
        ethicalClearanceStatus: isFunded
          ? (recommendation?.hasEthicalClearanceApproval ?? recommendation?.has_ethical_clearance_approval)
            ? "approved"
            : String(
              raw.ethicalClearanceStatus ??
              raw.ethical_clearance_status ??
              "pending",
            )
          : String(
            raw.ethicalClearanceStatus ?? raw.ethical_clearance_status ?? "",
          ) || null,
        recommendedAt:
          (recommendation?.recommendedAt as string | null) ??
          (recommendation?.recommended_at as string | null) ??
          (recommendedAtFallback as string | null) ??
          null,
        recommendationId,
        navigationId,
      };
    });

    if (selectedPipelineStage !== ALL_FILTER_VALUE) {
      rows = rows.filter((row) => row.stage === selectedPipelineStage);
    }

    if (selectedIrbFilter !== ALL_FILTER_VALUE) {
      rows = rows.filter((row) => {
        if (selectedIrbFilter === "required") return row.needIrbEthicalClearance;
        if (selectedIrbFilter === "not_required") {
          return !row.needIrbEthicalClearance;
        }
        return true;
      });
    }

    if (selectedScoreBand !== ALL_FILTER_VALUE) {
      const threshold = Number(selectedScoreBand);
      if (Number.isFinite(threshold)) {
        rows = rows.filter(
          (row) =>
            typeof row.averageScorePercentage === "number" &&
            row.averageScorePercentage >= threshold,
        );
      }
    }

    return rows;
  }, [
    rankedCandidates,
    recommendationByDecisionId,
    selectedIrbFilter,
    selectedPipelineStage,
    selectedScoreBand,
  ]);

  const totalAwarded = useMemo(
    () =>
      Number(
        recommendationData?.meta?.statistics?.totalAwarded ??
        recommendations.reduce(
          (sum, item) => sum + Number(item.totalAwardAmount || item.total_award_amount || 0),
          0,
        ),
      ),
    [recommendations, recommendationData?.meta?.statistics],
  );

  const totalRequested = useMemo(
    () =>
      Number(
        recommendationData?.meta?.statistics?.totalRequested ??
        recommendations.reduce(
          (sum, item) =>
            sum + Number(item.budgetRequested ?? item.budget_requested ?? 0),
          0,
        ),
      ),
    [recommendations, recommendationData?.meta?.statistics],
  );

  const clearAllFilters = useCallback(() => {
    setSelectedCall(ALL_FILTER_VALUE);
    setSelectedProposalType(ALL_FILTER_VALUE);
    setSelectedPipelineStage(ALL_FILTER_VALUE);
    setSelectedIrbFilter(ALL_FILTER_VALUE);
    setSelectedScoreBand(ALL_FILTER_VALUE);
    setSelectedFundingDecisionStatus(ALL_FILTER_VALUE);
    setSelectedEthicalClearance(ALL_FILTER_VALUE);
  }, []);

  const stats = [
    {
      title: "Total Recommendations",
      value:
        recommendationData?.meta?.statistics?.recommendationsCount ??
        recommendations.length,
      caption: "Submitted funding records",
      icon: BadgeCheck,
      accent: {
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
      },
      onClick: clearAllFilters,
      isActive:
        selectedCall !== ALL_FILTER_VALUE ||
        selectedProposalType !== ALL_FILTER_VALUE ||
        selectedPipelineStage !== ALL_FILTER_VALUE ||
        selectedIrbFilter !== ALL_FILTER_VALUE ||
        selectedScoreBand !== ALL_FILTER_VALUE ||
        selectedFundingDecisionStatus !== ALL_FILTER_VALUE ||
        selectedEthicalClearance !== ALL_FILTER_VALUE,
    },
    {
      title: "Total Requested",
      value: formatCurrency(totalRequested),
      caption: "Budget requested across recommendations",
      icon: FileText,
      accent: {
        iconBg: "bg-slate-100",
        iconColor: "text-slate-700",
        border: "border-slate-200",
        activeRing: "ring-slate-500/50 border-slate-300",
      },
    },
    {
      title: "Total Awarded",
      value: formatCurrency(totalAwarded),
      caption: "Across submitted recommendations",
      icon: Banknote,
      accent: {
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-700",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
      },
      onClick: () => {
        clearAllFilters();
        setSelectedFundingDecisionStatus("approved");
      },
      isActive: selectedFundingDecisionStatus === "approved",
    },
    {
      title: "Ethics Cleared",
      value:
        recommendationData?.meta?.statistics?.ethicalClearanceApprovedCount ??
        recommendations.filter((item) => item.hasEthicalClearanceApproval || item.has_ethical_clearance_approval).length,
      caption: "Marked with clearance approval",
      icon: ShieldCheck,
      accent: {
        iconBg: "bg-blue-50",
        iconColor: "text-blue-700",
        border: "border-blue-200",
        activeRing: "ring-blue-500/60 border-blue-300",
      },
      onClick: () => {
        clearAllFilters();
        setSelectedEthicalClearance("approved");
      },
      isActive: selectedEthicalClearance === "approved",
    },
  ];

  const filterOptions = useMemo<FilterOptionConfig[]>(
    () => [
      {
        key: "grant-call",
        label: "Grant call",
        value: selectedCall,
        onValueChange: setSelectedCall,
        placeholder: "Filter by grant call",
        allValue: ALL_FILTER_VALUE,
        allLabel: "All Grant Calls",
        options: openGrantCalls.map((call) => ({
          value: String(call.id),
          label: call.title,
        })),
      },
      {
        key: "proposal-type",
        label: "Proposal type",
        value: selectedProposalType,
        onValueChange: setSelectedProposalType,
        placeholder: "Filter by proposal type",
        allValue: ALL_FILTER_VALUE,
        allLabel: "All Proposal Types",
        options: proposalTypeOptions.map((type) => ({
          value: String(type.id),
          label: type.name,
        })),
      },
      {
        key: "funding-status",
        label: "Funding status",
        value: selectedFundingDecisionStatus,
        onValueChange: setSelectedFundingDecisionStatus,
        placeholder: "Filter by funding status",
        allValue: ALL_FILTER_VALUE,
        allLabel: "All Status",
        options: [
          { value: "approved", label: "Approved" },
          { value: "pending", label: "Pending" },
          { value: "rejected", label: "Rejected" },
          { value: "deferred", label: "Deferred" },
        ],
      },
      {
        key: "ethics-clearance",
        label: "Ethics clearance",
        value: selectedEthicalClearance,
        onValueChange: setSelectedEthicalClearance,
        placeholder: "Filter by ethics clearance",
        allValue: ALL_FILTER_VALUE,
        allLabel: "All",
        options: [
          { value: "approved", label: "Cleared" },
          { value: "not_approved", label: "Not Cleared" },
        ],
      },
    ],
    [
      openGrantCalls,
      proposalTypeOptions,
      selectedCall,
      selectedEthicalClearance,
      selectedFundingDecisionStatus,
      selectedProposalType,
    ],
  );

  const pipelineColumns: ColumnDef<PipelineRow>[] = [
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "border shadow-none",
            row.original.stage === "pending"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {row.original.stage === "pending" ? "Pending" : "Funded"}
        </Badge>
      ),
    },
    {
      accessorKey: "rank",
      header: "Rank",
      cell: ({ row }) => (
        row.original.rank ? (
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 shadow-none">
            #{row.original.rank}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">{row.original.reference}</span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-105">
          <p className="line-clamp-2 text-sm font-bold">
            {row.original.proposalTitle || "Untitled proposal"}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {row.original.callTitle} · {row.original.proposalTypeName}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {row.original.organizationName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "principalInvestigator",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">{piName(row.original.principalInvestigator)}</span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.principalInvestigatorEmail}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "requestedAmount",
      header: "Budget Requested",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">
            {formatCurrency(row.original.requestedAmount)}
          </span>
          <span className="text-[10px] text-muted-foreground">Requested</span>
        </div>
      ),
    },
    {
      accessorKey: "awardedAmount",
      header: "Total Awarded",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className={`font-bold ${row.original.awardedAmount ? "text-emerald-700" : "text-muted-foreground"}`}>
            {row.original.awardedAmount ? formatCurrency(row.original.awardedAmount) : "-"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.awardedAmount ? "Awarded" : "Pending"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "averageScorePercentage",
      header: "Score",
      cell: ({ row }) => (
        row.original.averageScorePercentage !== null ? (
          <Badge className="border-blue-200 bg-blue-50 text-blue-700 shadow-none">
            {Number(row.original.averageScorePercentage || 0).toFixed(1)}%
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      id: "irb",
      header: "IRB",
      cell: ({ row }) => (
        <StatusBadge
          needsIrb={row.original.needIrbEthicalClearance}
          status={row.original.ethicalClearanceStatus}
        />
      ),
    },
    {
      accessorKey: "recommendedAt",
      header: "Recommended",
      cell: ({ row }) => formatDate(row.original.recommendedAt),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const recommendationId = row.original.recommendationId;
        const routes = recommendationId
          ? fundingRecommendationRoutes(recommendationId)
          : null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open actions"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem
                onClick={() => {
                  if (recommendationId) {
                    router.push(routes!.detail);
                    return;
                  }

                  router.push(
                    `/research/funding-recommendations/new?proposal=${encodeURIComponent(row.original.navigationId)}`,
                  );
                }}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                {recommendationId ? "Open Details" : "Create Recommendation"}
              </DropdownMenuItem>
              {recommendationId && routes ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={documentDownloadActive !== null}
                    onClick={() =>
                      void downloadDocument("award", { recommendationId })
                    }
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Award Generation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={documentDownloadActive !== null}
                    onClick={() =>
                      void downloadDocument("agreement", { recommendationId })
                    }
                  >
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Agreement
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Funding Recommendations"
      description="Prepare award recommendations for approved funding decisions and review submitted records."
      actions={
        <Button
          onClick={() => router.push("/research/funding-recommendations/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Recommendation
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[7.5rem] rounded-xl" />
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
          <DataTable
            columns={pipelineColumns}
            data={pipelineRows}
            searchKey="proposalTitle"
            searchPlaceholder="Search proposals..."
            filterOptions={filterOptions}
            onRowClick={(row) => {
              if (row.recommendationId) {
                router.push(
                  `/research/funding-recommendations/${row.recommendationId}`,
                );
                return;
              }

              router.push(
                `/research/funding-recommendations/new?proposal=${encodeURIComponent(row.navigationId)}`,
              );
            }}
            emptyMessage="No proposals found"
            emptyDescription="No records match the selected filters."
          />
        )}
      </div>
    </PageContainer>
  );
}
