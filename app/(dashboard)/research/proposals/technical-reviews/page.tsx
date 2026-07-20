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
  ClipboardList,
  FileText,
  AlertCircle,
  Microscope,
  Inbox,
  RefreshCw,
  Calendar,
  ShieldCheck,
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
import { getIndividualReviews, type IndividualReview } from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// ── Queue filter types ────────────────────────────────────────────────────────
type ReviewQueueFilter =
  | "all"
  | "pending_review"
  | "reviewed"
  | "screening_approved"
  | "screening_rejected";

const QUEUE_FILTER_COPY: Record<
  Exclude<ReviewQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  pending_review: {
    banner:
      "Showing reviews that are pending evaluation by assigned reviewers.",
    emptyTitle: "No pending reviews",
    emptyDescription:
      "All assigned reviews have been completed. Great work!",
    searchPlaceholder: "Search pending reviews...",
  },
  reviewed: {
    banner:
      "Showing reviews that have been completed and scored by reviewers.",
    emptyTitle: "No completed reviews",
    emptyDescription: "No reviews have been submitted yet.",
    searchPlaceholder: "Search completed reviews...",
  },
  screening_approved: {
    banner:
      "Showing reviews for proposals that passed initial screening.",
    emptyTitle: "No approved screening reviews",
    emptyDescription:
      "There are no reviews for screening-approved proposals yet.",
    searchPlaceholder: "Search approved reviews...",
  },
  screening_rejected: {
    banner:
      "Showing reviews for proposals that did not pass screening.",
    emptyTitle: "No rejected screening reviews",
    emptyDescription:
      "There are no reviews for screening-rejected proposals.",
    searchPlaceholder: "Search rejected reviews...",
  },
};

const VALID_QUEUE_KEYS = Object.keys(QUEUE_FILTER_COPY);

// ── Status display helpers ─────────────────────────────────────────────────────
const reviewStatusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof FileText;
  }
> = {
  pending_review: { label: "Pending Review", variant: "outline", icon: Clock },
  reviewed: { label: "Reviewed", variant: "secondary", icon: CheckCircle2 },
};

const proposalStatusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof FileText;
  }
> = {
  screening_approved: {
    label: "Screening Approved",
    variant: "secondary",
    icon: CheckCircle2,
  },
  screening_under_review: {
    label: "Screening In Progress",
    variant: "outline",
    icon: Microscope,
  },
  screening_rejected: {
    label: "Screening Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

// ── Review row type ────────────────────────────────────────────────────────────
type ReviewRow = IndividualReview & {
  organizationName: string;
  unitName: string;
  scoreLabel: string;
};

// ── Columns ────────────────────────────────────────────────────────────────────
const columns: ColumnDef<ReviewRow>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
    cell: ({ row }) => (
      <Link
        href={`/research/proposals/technical-reviews/${row.original.id}`}
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
      <div className="max-w-[280px] min-w-[130px]">
        <p className="font-semibold text-sm line-clamp-1 whitespace-normal break-words">
          {row.original.proposalTitle}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
          {row.original.principalInvestigator || "No PI assigned"}
        </p>
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
    accessorKey: "proposalStatus",
    header: "Proposal Status",
    cell: ({ row }) => {
      const config = proposalStatusConfig[row.original.proposalStatus] ?? {
        label: row.original.proposalStatus || "Unknown",
        variant: "outline" as const,
        icon: AlertCircle,
      };
      const Icon = config.icon;
      return (
        <Badge
          variant={config.variant}
          className="gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase"
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "reviewStatus",
    header: "Review Status",
    cell: ({ row }) => {
      const config = reviewStatusConfig[row.original.reviewStatus] ?? {
        label: row.original.reviewStatus || "Unknown",
        variant: "outline" as const,
        icon: AlertCircle,
      };
      const Icon = config.icon;
      return (
        <Badge
          variant={config.variant}
          className={cn(
            "gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase",
            row.original.reviewStatus === "reviewed" &&
              "bg-green-100 text-green-700 border-green-200",
            row.original.reviewStatus === "pending_review" &&
              "bg-amber-50 text-amber-600 border-amber-200",
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalScore",
    header: "Score",
    cell: ({ row }) => {
      const score = row.original.totalScore;
      return (
        <span
          className={cn(
            "text-sm font-bold",
            score > 0 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {score > 0 ? score : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "submittedDate",
    header: "Submitted Date",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground/80">
        <Calendar className="h-3 w-3" />
        <span className="text-xs font-medium">
          {row.original.submittedDate
            ? new Date(row.original.submittedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
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
                href={`/research/proposals/technical-reviews/${row.original.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Review
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/research/proposals/technical-reviews/${row.original.id}/review`}
                className="text-primary font-medium"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Technical Review
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TechnicalReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQueue = (() => {
    const param = searchParams.get("queue");
    if (param && VALID_QUEUE_KEYS.includes(param)) {
      return param as ReviewQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] =
    useState<ReviewQueueFilter>(initialQueue);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const mapToReviewRow = (review: IndividualReview): ReviewRow => ({
    ...review,
    organizationName: review.organization?.name || "—",
    unitName: review.unit?.name || "—",
    scoreLabel:
      typeof review.totalScore === "number" ? `${review.totalScore}` : "0",
  });

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    try {
      const response = await getIndividualReviews({
        page: 1,
        limit: 100,
        ordering: "-id",
        all: "true",
      });
      setReviews((response.data || []).map(mapToReviewRow));
    } catch (error) {
      console.error("Failed to load individual reviews:", error);
      setReviews([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // ── Statistics derived from reviews ──────────────────────────────────────────
  const statistics = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(
      (r) => r.reviewStatus === "pending_review",
    ).length;
    const completed = reviews.filter(
      (r) => r.reviewStatus === "reviewed",
    ).length;
    const screeningApproved = reviews.filter(
      (r) => r.proposalStatus === "screening_approved",
    ).length;
    const screeningRejected = reviews.filter(
      (r) => r.proposalStatus === "screening_rejected",
    ).length;
    return { total, pending, completed, screeningApproved, screeningRejected };
  }, [reviews]);

  const applyQueueFilter = (filter: ReviewQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards: Array<{
    key: ReviewQueueFilter;
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
      label: "Total Reviews",
      value: statistics.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "All assigned reviews",
    },
    {
      key: "pending_review",
      label: "Pending Review",
      value: statistics.pending,
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      iconBg: "bg-amber-100",
      border: "border-amber-100/50 bg-amber-50/10",
      activeRing: "ring-amber-500/60 border-amber-300",
      sub: "Awaiting evaluation",
    },
    {
      key: "reviewed",
      label: "Reviewed",
      value: statistics.completed,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "Completed & scored",
    },
    {
      key: "screening_approved",
      label: "Screening Approved",
      value: statistics.screeningApproved,
      icon: <Microscope className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Passed initial screening",
    },
    {
      key: "screening_rejected",
      label: "Screening Rejected",
      value: statistics.screeningRejected,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      iconBg: "bg-red-100",
      border: "border-red-100/50 bg-red-50/10",
      activeRing: "ring-red-500/60 border-red-300",
      sub: "Did not pass screening",
    },
  ];

  // ── Filtered reviews for table ──────────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    if (queueFilter === "all") return reviews;
    if (queueFilter === "pending_review" || queueFilter === "reviewed")
      return reviews.filter((r) => r.reviewStatus === queueFilter);
    if (
      queueFilter === "screening_approved" ||
      queueFilter === "screening_rejected"
    )
      return reviews.filter((r) => r.proposalStatus === queueFilter);
    return reviews;
  }, [reviews, queueFilter]);

  return (
    <PageContainer
      title="Technical Reviews"
      description="Review individual screening-assigned technical evaluations from the backend review register."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadReviews(true)}
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
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
              Failed to load technical reviews
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Something went wrong while fetching the data.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => loadReviews()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filteredReviews.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredReviews}
            searchKey="proposalTitle"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ??
              "Search by title, PI, or reference..."
            }
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "reviewStatus",
                      label: "Review Status",
                      options: [
                        { value: "pending_review", label: "Pending Review" },
                        { value: "reviewed", label: "Reviewed" },
                      ],
                    },
                    {
                      key: "proposalStatus",
                      label: "Proposal Status",
                      options: [
                        {
                          value: "screening_approved",
                          label: "Screening Approved",
                        },
                        {
                          value: "screening_under_review",
                          label: "Screening In Progress",
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
              router.push(`/research/proposals/technical-reviews/${row.id}`)
            }
            emptyMessage="No technical reviews found"
            emptyDescription="No individual reviews were returned from the backend yet."
          />
        ) : (
          <Empty className="border-dashed py-24">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No technical reviews found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "No individual reviews were returned from the backend yet."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all reviews
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
