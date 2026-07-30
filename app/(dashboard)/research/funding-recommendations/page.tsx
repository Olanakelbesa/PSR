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
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import {
  DataTable,
  type FilterOptionConfig,
} from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
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
  isEthicsCleared: boolean;
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

function ReferenceCell({ refNum }: { refNum: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!refNum || refNum === "-") return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!refNum || refNum === "-") {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 transition-colors max-w-fit">
      <span className="font-mono text-xs font-bold text-primary truncate">
        {refNum}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleCopy}
        title="Copy reference number"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function PICell({ pi }: { pi: FundingRecommendationPi | string | null }) {
  if (!pi) return <span className="text-xs text-muted-foreground">-</span>;
  const name = typeof pi === "string" ? pi : pi.full_name || pi.fullName || pi.email || "-";
  const email = typeof pi === "object" ? pi.email : null;
  const rawPhoto = typeof pi === "object" ? (pi.photo || pi.photo_url || pi.photoUrl) : null;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "PI";

  return (
    <div className="flex items-center gap-2.5 min-w-[170px]">
      <Avatar className="h-8 w-8 border border-border/60 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-foreground truncate">{name}</span>
        {email && <span className="text-[10px] text-muted-foreground truncate">{email}</span>}
      </div>
    </div>
  );
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
      only_irb_approved: true,
      ordering: "-average_score_percentage",
    }),
    [selectedCall, selectedProposalType],
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
      (candidateData?.data ?? []).filter((item) => {
        if (!item.fundingDecisionId) return false;

        const raw = item as unknown as Record<string, unknown>;
        const needIrb = Boolean(
          raw.needIrbEthicalClearance ?? raw.need_irb_ethical_clearance,
        );
        const rawEthicalStatus = String(
          raw.ethicalClearanceStatus ?? raw.ethical_clearance_status ?? "",
        );

        const rawFundingRecs = (
          raw.funding_recommendations ?? raw.fundingRecommendations ?? []
        ) as Array<Record<string, unknown>>;
        const recsCount = Number(
          raw.fundingRecommendationsCount ??
          raw.funding_recommendations_count ??
          rawFundingRecs.length,
        );
        const isFunded = recsCount > 0;

        // Pending candidates that require IRB must be IRB approved to appear
        if (needIrb && !isFunded && rawEthicalStatus !== "approved") {
          return false;
        }

        return true;
      }),
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

  const allPipelineRows = useMemo(() => {
    return rankedCandidates.map((item) => {
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

      const needIrbEthicalClearance = Boolean(
        raw.needIrbEthicalClearance ?? raw.need_irb_ethical_clearance,
      );

      const allowPostFundingIrb = Boolean(
        raw.allowPostFundingIrb ??
        raw.allow_post_funding_irb ??
        raw.ethicalClearanceRequirement === "required_post_funding"
      );

      const rawEthicalStatus = String(
        raw.ethicalClearanceStatus ?? raw.ethical_clearance_status ?? "",
      ) || null;

      const hasRecommendationEthicsApproval = Boolean(
        recommendation?.hasEthicalClearanceApproval ??
        recommendation?.has_ethical_clearance_approval,
      );

      const isEthicsCleared =
        !needIrbEthicalClearance ||
        allowPostFundingIrb ||
        hasRecommendationEthicsApproval ||
        rawEthicalStatus === "approved";

      const ethicalClearanceStatus = !needIrbEthicalClearance
        ? "not_required"
        : allowPostFundingIrb && rawEthicalStatus !== "approved"
          ? "pending_post_funding"
          : isEthicsCleared
            ? "approved"
            : rawEthicalStatus || "pending_submission";

      return {
        id: `pipeline-${String(raw.screeningId ?? raw.screening_id ?? item.rank)}`,
        stage: isFunded ? ("funded" as const) : ("pending" as const),
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
        amountLabel: isFunded ? ("Awarded" as const) : ("Requested" as const),
        averageScorePercentage: normalizedScore,
        needIrbEthicalClearance,
        isEthicsCleared,
        ethicalClearanceStatus,
        recommendedAt:
          (recommendation?.recommendedAt as string | null) ??
          (recommendation?.recommended_at as string | null) ??
          (recommendedAtFallback as string | null) ??
          null,
        recommendationId,
        navigationId,
      };
    });
  }, [rankedCandidates, recommendationByDecisionId]);

  const pipelineRows = useMemo(() => {
    let rows = allPipelineRows;

    if (selectedPipelineStage !== ALL_FILTER_VALUE) {
      rows = rows.filter((row) => row.stage === selectedPipelineStage);
    }

    if (selectedEthicalClearance !== ALL_FILTER_VALUE) {
      if (selectedEthicalClearance === "approved") {
        rows = rows.filter((row) => row.isEthicsCleared);
      } else if (selectedEthicalClearance === "not_approved") {
        rows = rows.filter((row) => !row.isEthicsCleared);
      }
    }

    if (selectedIrbFilter !== ALL_FILTER_VALUE) {
      if (selectedIrbFilter === "required") {
        rows = rows.filter((row) => row.needIrbEthicalClearance);
      } else if (selectedIrbFilter === "not_required") {
        rows = rows.filter((row) => !row.needIrbEthicalClearance);
      }
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
    allPipelineRows,
    selectedPipelineStage,
    selectedEthicalClearance,
    selectedIrbFilter,
    selectedScoreBand,
  ]);

  const pendingCount = useMemo(
    () => allPipelineRows.filter((row) => row.stage === "pending").length,
    [allPipelineRows],
  );

  const ethicsClearedCount = useMemo(
    () => allPipelineRows.filter((row) => row.isEthicsCleared).length,
    [allPipelineRows],
  );

  const totalAwarded = useMemo(
    () =>
      recommendationData?.meta?.statistics?.totalAwarded ??
      recommendations.reduce(
        (sum, item) =>
          sum + Number(item.totalAwardAmount || item.total_award_amount || 0),
        0,
      ),
    [recommendations, recommendationData?.meta?.statistics],
  );

  const totalRequested = useMemo(
    () =>
      allPipelineRows.reduce(
        (sum, row) => sum + Number(row.requestedAmount || 0),
        0,
      ) || Number(recommendationData?.meta?.statistics?.totalRequested ?? 0),
    [allPipelineRows, recommendationData?.meta?.statistics],
  );

  const totalRecommendationsCount = useMemo(
    () => allPipelineRows.length,
    [allPipelineRows],
  );

  const clearAllFilters = useCallback(() => {
    setSelectedCall(ALL_FILTER_VALUE);
    setSelectedProposalType(ALL_FILTER_VALUE);
    setSelectedPipelineStage(ALL_FILTER_VALUE);
    setSelectedIrbFilter(ALL_FILTER_VALUE);
    setSelectedScoreBand(ALL_FILTER_VALUE);
    setSelectedEthicalClearance(ALL_FILTER_VALUE);
  }, []);

  const stats = [
    {
      title: "Total Recommendations",
      value: totalRecommendationsCount,
      caption: "Proposals in funding pipeline",
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
        selectedEthicalClearance !== ALL_FILTER_VALUE,
    },
    {
      title: "Pending Recommendations",
      value: pendingCount,
      caption: "Awaiting funding recommendation",
      icon: Clock,
      accent: {
        iconBg: "bg-amber-50",
        iconColor: "text-amber-700",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
      },
      onClick: () => {
        clearAllFilters();
        setSelectedPipelineStage("pending");
      },
      isActive: selectedPipelineStage === "pending",
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
        setSelectedPipelineStage("funded");
      },
      isActive: selectedPipelineStage === "funded",
    },
    {
      title: "Ethics Cleared",
      value: ethicsClearedCount,
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
        key: "pipeline-stage",
        label: "Pipeline stage",
        value: selectedPipelineStage,
        onValueChange: setSelectedPipelineStage,
        placeholder: "Filter by pipeline stage",
        allValue: ALL_FILTER_VALUE,
        allLabel: "All Stages",
        options: [
          { value: "pending", label: "Pending Recommendation" },
          { value: "funded", label: "Funded / Recommended" },
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
      selectedPipelineStage,
      selectedProposalType,
    ],
  );

  const pipelineColumns: ColumnDef<PipelineRow>[] = [
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <ReferenceCell refNum={row.original.reference} />,
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="min-w-[240px] max-w-[340px] space-y-0.5">
          <p className="line-clamp-2 text-sm font-bold leading-snug">
            {row.original.proposalTitle || "Untitled proposal"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground truncate">
            {row.original.callTitle} · {row.original.proposalTypeName}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {row.original.organizationName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "principalInvestigator",
      header: "Principal Investigator",
      cell: ({ row }) => <PICell pi={row.original.principalInvestigator} />,
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            initialColumnVisibility={{ reference: false }}
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
