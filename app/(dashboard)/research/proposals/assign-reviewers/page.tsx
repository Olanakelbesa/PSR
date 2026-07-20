"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  UserPlus,
  Inbox,
  Clock,
  AlertCircle,
  FileText,
  Users,
  UserCheck,
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
  getScreenings,
  type Screening,
} from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// ── Queue filter types ────────────────────────────────────────────────────────
type AssignQueueFilter =
  | "all"
  | "awaiting_assignment"
  | "partially_assigned"
  | "fully_assigned"
  | "not_reviewed"
  | "partially_reviewed"
  | "all_reviewed";

const QUEUE_FILTER_COPY: Record<
  Exclude<AssignQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  awaiting_assignment: {
    banner:
      "Showing screenings that have no reviewers assigned yet and need attention.",
    emptyTitle: "No screenings awaiting assignment",
    emptyDescription:
      "All screenings currently have at least one reviewer assigned.",
    searchPlaceholder: "Search awaiting assignment...",
  },
  partially_assigned: {
    banner:
      "Showing screenings with some reviewers assigned but not yet fully staffed.",
    emptyTitle: "No partially assigned screenings",
    emptyDescription:
      "All screenings either have no reviewers or are fully staffed.",
    searchPlaceholder: "Search partially assigned...",
  },
  fully_assigned: {
    banner:
      "Showing screenings that have been fully staffed with 2 or more reviewers.",
    emptyTitle: "No fully assigned screenings",
    emptyDescription: "No screenings have been fully staffed yet.",
    searchPlaceholder: "Search fully assigned...",
  },
  not_reviewed: {
    banner:
      "Showing screenings where no assigned reviewers have submitted their review yet.",
    emptyTitle: "No unreviewed screenings",
    emptyDescription: "All assigned reviewers have submitted their reviews.",
    searchPlaceholder: "Search unreviewed...",
  },
  partially_reviewed: {
    banner:
      "Showing screenings where some but not all assigned reviewers have submitted.",
    emptyTitle: "No partially reviewed screenings",
    emptyDescription:
      "All screenings either have no reviews or all reviews are complete.",
    searchPlaceholder: "Search partially reviewed...",
  },
  all_reviewed: {
    banner:
      "Showing screenings where all assigned reviewers have submitted their reviews.",
    emptyTitle: "No fully reviewed screenings",
    emptyDescription: "No screenings have all reviews completed yet.",
    searchPlaceholder: "Search fully reviewed...",
  },
};

const VALID_QUEUE_KEYS = Object.keys(QUEUE_FILTER_COPY);

// ── Score helpers ────────────────────────────────────────────────────────────
function getScoreColor(pct: number): string {
  if (pct >= 70) return "bg-green-100 text-green-700 border-green-200";
  if (pct >= 50) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-rose-50 text-rose-600 border-rose-200";
}

// ── Screening row type ────────────────────────────────────────────────────────
type ScreeningRow = Screening & {
  proposalId: string;
  referenceNumber: string;
  proposalTitle: string;
  organizationName: string;
  unitName: string;
  officeName: string;
  createdByName: string;
  thematicAreaLabel: string;
  shortAbstractText: string;
  submittedAt?: string;
};

// ── Columns ────────────────────────────────────────────────────────────────────
const columns: ColumnDef<ScreeningRow>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
    cell: ({ row }) => (
      <Link
        href={`/research/proposals/assign-reviewers/${row.original.id}`}
        className="font-bold text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.referenceNumber}
      </Link>
    ),
  },
  {
    accessorKey: "proposalTitle",
    header: "Proposal Title",
    cell: ({ row }) => (
      <div className="max-w-[250px] min-w-[130px]">
        <p className="font-semibold text-sm line-clamp-1 whitespace-normal break-words">
          {row.original.proposalTitle}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
          {row.original.shortAbstractText || row.original.thematicAreaLabel}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Submitted By",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
          {row.original.createdByName
            .split(" ")
            .filter(Boolean)
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U"}
        </div>
        <span className="text-sm font-medium">{row.original.createdByName}</span>
      </div>
    ),
  },
  {
    accessorKey: "organizationName",
    header: "Organization",
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="font-medium">{row.original.organizationName}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.unitName}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "assignedReviewersCount",
    header: "Review Progress",
    cell: ({ row }) => {
      const assigned = row.original.assignedReviewersCount || 0;
      const completed = row.original.reviewsCompletedCount || 0;
      const pct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      return (
        <div className="space-y-1.5 min-w-[120px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {completed}/{assigned}
            </span>
            <span className="text-[10px] font-bold">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct === 100
                  ? "bg-green-500"
                  : pct > 0
                    ? "bg-amber-400"
                    : "bg-muted-foreground/30",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {assigned === 0
              ? "No reviewers"
              : pct === 100
                ? "All reviewed"
                : `${completed} of ${assigned} reviewed`}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "averageScorePercentage",
    header: "Avg Score",
    cell: ({ row }) => {
      const pct = row.original.averageScorePercentage;
      const maxPts = row.original.maxPossiblePoints;
      if (pct == null) {
        return (
          <span className="text-xs text-muted-foreground italic">No scores</span>
        );
      }
      return (
        <Badge
          variant="outline"
          className={cn("text-[10px] font-bold px-2 py-0.5", getScoreColor(pct))}
        >
          {pct.toFixed(0)}%
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
                href={`/research/proposals/assign-reviewers/${row.original.id}`}
                className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-muted/50" />
            <DropdownMenuItem asChild className="text-blue-600 font-medium">
              <Link
                href={`/research/proposals/assign-reviewers/${row.original.id}/assign`}
                className="cursor-pointer flex items-center px-2 py-2 text-sm font-semibold rounded-md focus:bg-blue-50 focus:text-blue-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Reviewers
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AssignReviewersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useCurrentUser();

  const initialQueue = ((): AssignQueueFilter => {
    const param = searchParams.get("queue");
    if (param && VALID_QUEUE_KEYS.includes(param)) {
      return param as AssignQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] =
    useState<AssignQueueFilter>(initialQueue);
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const formatProposalReference = (id: string | number) =>
    String(id)
      .replace(/^prop-/i, "PRP-")
      .toUpperCase();

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const getCreatedByName = (proposal: any) => {
    const createdBy = proposal.createdBy;
    if (!createdBy) return "—";
    return (
      [createdBy.firstName, createdBy.lastName].filter(Boolean).join(" ") ||
      createdBy.email ||
      "—"
    );
  };

  const mapToScreeningRow = (screening: Screening): ScreeningRow => {
    const proposal = screening.proposal as any;
    return {
      ...screening,
      proposalId: String(proposal?.id ?? screening.id),
      referenceNumber:
        proposal?.referenceNumber ||
        formatProposalReference(proposal?.id ?? screening.id),
      proposalTitle: proposal?.title || "Untitled Proposal",
      organizationName: proposal?.Organization?.name || "—",
      unitName: proposal?.Unit?.name || "—",
      officeName: proposal?.receivingOffice?.name || "—",
      createdByName: getCreatedByName(proposal),
      thematicAreaLabel: proposal?.thematicAreas?.[0]?.name || "—",
      shortAbstractText: stripHtml(proposal?.shortAbstract || ""),
      submittedAt:
        proposal?.submittedAt || screening.createdAt || undefined,
    } satisfies ScreeningRow;
  };

  const loadScreenings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    try {
      const response = await getScreenings({
        status: "screening_approved",
        limit: 100,
      });

      const readyForAssignment = response.data
        .filter((screening) => screening.status === "screening_approved")
        .map(mapToScreeningRow);

      setScreenings(readyForAssignment);
    } catch (error) {
      console.error("Failed to load screenings:", error);
      setScreenings([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  // ── Statistics derived from screenings ──────────────────────────────────────
  const statistics = useMemo(() => {
    const total = screenings.length;
    const awaiting = screenings.filter(
      (s) => s.assignedReviewersCount === 0,
    ).length;
    const partial = screenings.filter(
      (s) => s.assignedReviewersCount > 0 && s.assignedReviewersCount < 2,
    ).length;
    const full = screenings.filter(
      (s) => s.assignedReviewersCount >= 2,
    ).length;
    // Review completion stats
    const notReviewed = screenings.filter(
      (s) =>
        (s.assignedReviewersCount || 0) > 0 &&
        (s.reviewsCompletedCount || 0) === 0,
    ).length;
    const partiallyReviewed = screenings.filter(
      (s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed > 0 && completed < assigned;
      },
    ).length;
    const allReviewed = screenings.filter(
      (s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed >= assigned;
      },
    ).length;
    return { total, awaiting, partial, full, notReviewed, partiallyReviewed, allReviewed };
  }, [screenings]);

  const applyQueueFilter = (filter: AssignQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards: Array<{
    key: AssignQueueFilter;
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
      label: "Total Ready",
      value: statistics.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "All approved screenings",
    },
    {
      key: "awaiting_assignment",
      label: "Awaiting Assignment",
      value: statistics.awaiting,
      icon: <Inbox className="h-4 w-4 text-violet-600" />,
      iconBg: "bg-violet-100",
      border: "border-violet-200/70 bg-violet-50/20",
      activeRing: "ring-violet-500/60 border-violet-300",
      sub: "No reviewers assigned",
    },
    {
      key: "not_reviewed",
      label: "Not Yet Reviewed",
      value: statistics.notReviewed,
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      iconBg: "bg-amber-100",
      border: "border-amber-100/50 bg-amber-50/10",
      activeRing: "ring-amber-500/60 border-amber-300",
      sub: "Assigned but no reviews",
    },
    {
      key: "partially_reviewed",
      label: "Partially Reviewed",
      value: statistics.partiallyReviewed,
      icon: <Users className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Some reviews pending",
    },
    {
      key: "all_reviewed",
      label: "All Reviewed",
      value: statistics.allReviewed,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "All reviewers submitted",
    },
    {
      key: "fully_assigned",
      label: "Fully Assigned",
      value: statistics.full,
      icon: <UserCheck className="h-4 w-4 text-emerald-500" />,
      iconBg: "bg-emerald-100",
      border: "border-emerald-100/50 bg-emerald-50/10",
      activeRing: "ring-emerald-500/60 border-emerald-300",
      sub: "2+ reviewers assigned",
    },
  ];

  // ── Filtered screenings for table ──────────────────────────────────────────
  const filteredScreenings = useMemo(() => {
    if (queueFilter === "all") return screenings;
    if (queueFilter === "awaiting_assignment")
      return screenings.filter((s) => s.assignedReviewersCount === 0);
    if (queueFilter === "partially_assigned")
      return screenings.filter(
        (s) => s.assignedReviewersCount > 0 && s.assignedReviewersCount < 2,
      );
    if (queueFilter === "fully_assigned")
      return screenings.filter((s) => s.assignedReviewersCount >= 2);
    if (queueFilter === "not_reviewed")
      return screenings.filter(
        (s) =>
          (s.assignedReviewersCount || 0) > 0 &&
          (s.reviewsCompletedCount || 0) === 0,
      );
    if (queueFilter === "partially_reviewed")
      return screenings.filter((s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed > 0 && completed < assigned;
      });
    if (queueFilter === "all_reviewed")
      return screenings.filter((s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed >= assigned;
      });
    return screenings;
  }, [screenings, queueFilter]);

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description="Select and assign subject matter experts to evaluate research proposals."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadScreenings(true)}
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
              Failed to load screenings
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Something went wrong while fetching the data.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => loadScreenings()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filteredScreenings.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredScreenings}
            searchKey="proposalTitle"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ??
              "Search by proposal title, organization, or submitter..."
            }
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        {
                          value: "screening_approved",
                          label: "Screening Approved",
                        },
                      ],
                    },
                  ]
                : []
            }
            onRowClick={(row) =>
              router.push(
                `/research/proposals/assign-reviewers/${String(row.id)}`,
              )
            }
            emptyMessage="No screenings found"
            emptyDescription="All screenings have been processed."
          />
        ) : (
          <Empty className="border-dashed py-24">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No screenings found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "There are no approved screenings ready for reviewer assignment."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all screenings
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
