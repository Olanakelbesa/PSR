"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardCheck,
  FileText,
  AlertCircle,
  Inbox,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import {
  getManagedProposals,
  type ProposalStatus,
  type ManagedProposalQueueItem,
} from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// ── Queue filter types ────────────────────────────────────────────────────────
type ScreeningQueueFilter =
  | "all"
  | "submitted"
  | "resubmitted"
  | "screening_under_review"
  | "screening_approved"
  | "screening_rejected";

const QUEUE_FILTER_COPY: Record<
  Exclude<ScreeningQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  submitted: {
    banner:
      "Showing proposals awaiting initial administrative screening and compliance checks.",
    emptyTitle: "No proposals awaiting screening",
    emptyDescription:
      "There are no proposals waiting for screening right now.",
    searchPlaceholder: "Search awaiting screening...",
  },
  resubmitted: {
    banner:
      "Showing proposals that were revised and resubmitted for screening review.",
    emptyTitle: "No resubmitted proposals",
    emptyDescription:
      "There are no resubmitted proposals waiting in the queue.",
    searchPlaceholder: "Search resubmitted proposals...",
  },
  screening_under_review: {
    banner: "Showing proposals currently being evaluated during screening.",
    emptyTitle: "No proposals under review",
    emptyDescription:
      "There are no proposals currently under screening review.",
    searchPlaceholder: "Search under-review proposals...",
  },
  screening_approved: {
    banner:
      "Showing proposals that have passed initial screening and are ready for the next stage.",
    emptyTitle: "No approved proposals",
    emptyDescription:
      "There are no proposals that have passed screening yet.",
    searchPlaceholder: "Search approved proposals...",
  },
  screening_rejected: {
    banner:
      "Showing proposals that did not pass the initial screening process.",
    emptyTitle: "No rejected proposals",
    emptyDescription: "There are no proposals that failed screening.",
    searchPlaceholder: "Search rejected proposals...",
  },
};

const VALID_QUEUE_KEYS = Object.keys(QUEUE_FILTER_COPY);

// ── Status display helpers ─────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof FileText;
  }
> = {
  submitted: { label: "Awaiting Screening", variant: "default", icon: Clock },
  resubmitted: { label: "Resubmitted", variant: "default", icon: RefreshCw },
  screening_under_review: {
    label: "Screening Under Review",
    variant: "outline",
    icon: ClipboardCheck,
  },
  screening_approved: {
    label: "Screening Approved",
    variant: "secondary",
    icon: CheckCircle2,
  },
  screening_rejected: {
    label: "Screening Rejected",
    variant: "destructive",
    icon: XCircle,
  },
  under_review: {
    label: "In Review",
    variant: "outline",
    icon: ClipboardCheck,
  },
  approved: { label: "Approved", variant: "secondary", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  revision_requested: {
    label: "Revision Requested",
    variant: "outline",
    icon: AlertCircle,
  },
};

// ── Proposal row type ──────────────────────────────────────────────────────────
type ProposalRow = Omit<ManagedProposalQueueItem, "status"> & {
  status: ProposalStatus;
  organizationName: string;
  unitName: string;
  officeName: string;
  createdByName: string;
  thematicAreaLabel: string;
  shortAbstractText: string;
};

// ── Columns ────────────────────────────────────────────────────────────────────
const columns: ColumnDef<ProposalRow>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
    cell: ({ row }) => (
      <Link
        href={`/research/proposals/screening-reviews/${row.original.id}`}
        className="font-bold text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.referenceNumber}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Proposal Title",
    cell: ({ row }) => (
      <div className="max-w-[250px] min-w-[130px]">
        <p className="font-semibold text-sm line-clamp-1 whitespace-normal break-words">
          {row.original.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground whitespace-pre-line break-word line-clamp-2">
            <HtmlContentRenderer content={row.original.shortAbstract} />
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Submitted By",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {row.original.createdByName}
      </span>
    ),
  },
  {
    accessorKey: "receivingOffice",
    header: "Submitting Office",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-pre-line break-word">
        {row.original.officeName}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config =
        statusConfig[row.original.status] || statusConfig.submitted;
      const Icon = config.icon;
      return (
        <Badge
          variant={config.variant}
          className="gap-1.5 px-2 py-0.5 text-[10px] font-medium"
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted Date",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground/80">
        <Calendar className="h-3 w-3" />
        <span className="text-xs font-medium">
          {row.original.submittedAt
            ? new Date(row.original.submittedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Pending"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted/80 rounded-full"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[180px] p-1 shadow-xl border-muted-foreground/20"
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/research/proposals/screening-reviews/${row.original.id}`}
                className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Proposal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-muted/50" />
            <DropdownMenuItem asChild className="text-emerald-600 font-medium">
              <Link
                href={`/research/proposals/screening-reviews/${row.original.id}/review`}
                className="cursor-pointer flex items-center px-2 py-2 text-sm font-semibold rounded-md focus:bg-emerald-50 focus:text-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Review
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ScreeningReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQueue = ((): ScreeningQueueFilter => {
    const param = searchParams.get("queue");
    if (param && VALID_QUEUE_KEYS.includes(param)) {
      return param as ScreeningQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] =
    useState<ScreeningQueueFilter>(initialQueue);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const mapToProposalRow = (
    proposal: ManagedProposalQueueItem,
  ): ProposalRow => ({
    ...proposal,
    organizationName: proposal.Organization?.name || "—",
    unitName: proposal.Unit?.name || "—",
    officeName: proposal.receivingOffice?.name || "—",
    createdByName: proposal.createdBy
      ? [proposal.createdBy.firstName, proposal.createdBy.lastName]
          .filter(Boolean)
          .join(" ") ||
        proposal.createdBy.email ||
        "—"
      : "—",
    thematicAreaLabel: proposal.thematicAreas?.[0]?.name || "—",
    shortAbstractText: proposal.shortAbstract
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  });

  const loadProposals = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    try {
      const response = await getManagedProposals({
        page: 1,
        limit: 100,
      });
      setProposals(response.data.map(mapToProposalRow));
    } catch (error) {
      console.error("Failed to load proposals for screening:", error);
      setProposals([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // ── Statistics derived from proposals ──────────────────────────────────────
  const statistics = useMemo(() => {
    const total = proposals.length;
    const submitted = proposals.filter(
      (p) => p.status === "submitted",
    ).length;
    const resubmitted = proposals.filter(
      (p) => p.status === "resubmitted",
    ).length;
    const underReview = proposals.filter(
      (p) => p.status === "screening_under_review",
    ).length;
    const approved = proposals.filter(
      (p) => p.status === "screening_approved",
    ).length;
    const rejected = proposals.filter(
      (p) => p.status === "screening_rejected",
    ).length;
    return { total, submitted, resubmitted, underReview, approved, rejected };
  }, [proposals]);

  const applyQueueFilter = (filter: ScreeningQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards: Array<{
    key: ScreeningQueueFilter;
    label: string;
    value: number;
    icon: React.ReactNode;
    iconBg: string;
    border: string;
    activeRing: string;
    sub: string;
  }> = [
    {
      key: "all",
      label: "Total Proposals",
      value: statistics.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "Across all categories",
    },
    {
      key: "submitted",
      label: "Awaiting Screening",
      value: statistics.submitted,
      icon: <Inbox className="h-4 w-4 text-violet-600" />,
      iconBg: "bg-violet-100",
      border: "border-violet-200/70 bg-violet-50/20",
      activeRing: "ring-violet-500/60 border-violet-300",
      sub: "Pending review & compliance",
    },
    {
      key: "resubmitted",
      label: "Resubmitted",
      value: statistics.resubmitted,
      icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      border: "border-purple-200/70 bg-purple-50/20",
      activeRing: "ring-purple-500/60 border-purple-300",
      sub: "Revised and resent",
    },
    {
      key: "screening_under_review",
      label: "Under Review",
      value: statistics.underReview,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Currently being evaluated",
    },
    {
      key: "screening_approved",
      label: "Screening Approved",
      value: statistics.approved,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "Passed initial screening",
    },
    {
      key: "screening_rejected",
      label: "Screening Rejected",
      value: statistics.rejected,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      iconBg: "bg-red-100",
      border: "border-red-100/50 bg-red-50/10",
      activeRing: "ring-red-500/60 border-red-300",
      sub: "Did not pass screening",
    },
  ];

  // ── Filtered proposals for table ──────────────────────────────────────────
  const filteredProposals = useMemo(() => {
    if (queueFilter === "all") return proposals;
    return proposals.filter((p) => p.status === queueFilter);
  }, [proposals, queueFilter]);

  return (
    <PageContainer
      title="Screening Reviews"
      description="Perform initial administrative screening and compliance checks on the manager queue."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadProposals(true)}
            disabled={isFetching || isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden border-none shadow-md"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : statCards.map(
              ({ key, label, value, icon, iconBg, border, activeRing, sub }) => {
                const isActive = queueFilter === key;

                return (
                  <Card
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => applyQueueFilter(key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applyQueueFilter(key);
                      }
                    }}
                    className={cn(
                      border,
                      "cursor-pointer transition-all hover:shadow-md",
                      isActive && cn("ring-2 shadow-md", activeRing),
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {label}
                      </CardTitle>
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          iconBg,
                        )}
                      >
                        {icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{value}</div>
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {sub}
                      </p>
                    </CardContent>
                  </Card>
                );
              },
            )}
      </div>

      {/* ── Filter banner ──────────────────────────────────────────────────── */}
      {activeFilterCopy && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">{activeFilterCopy.banner}</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-background"
            onClick={() => setQueueFilter("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="mt-8 w-full max-w-full overflow-hidden">
        {isLoading ? (
          <div className="rounded-xl border p-6 space-y-6 bg-card">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-[300px]" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-[100px]" />
                <Skeleton className="h-9 w-[100px]" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
            <p className="font-semibold text-destructive">
              Failed to load screening proposals
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Something went wrong while fetching the data.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => loadProposals()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filteredProposals.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredProposals}
            searchKey="title"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ??
              "Search by proposal title, office, or organization..."
            }
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        { value: "submitted", label: "Awaiting Screening" },
                        { value: "resubmitted", label: "Resubmitted" },
                        {
                          value: "screening_under_review",
                          label: "Screening Under Review",
                        },
                        {
                          value: "screening_approved",
                          label: "Screening Approved",
                        },
                        {
                          value: "screening_rejected",
                          label: "Screening Rejected",
                        },
                      ],
                    },
                  ]
                : []
            }
            onRowClick={(row) =>
              router.push(`/research/proposals/screening-reviews/${row.id}`)
            }
            emptyMessage="No proposals found for screening"
            emptyDescription="All submitted proposals have been processed."
          />
        ) : (
          <Empty className="border-dashed py-24">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No proposals found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "No proposals have been submitted for screening yet."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all proposals
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
