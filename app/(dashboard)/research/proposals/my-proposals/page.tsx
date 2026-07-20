"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { useProposals } from "@/hooks/useProposals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Queue filter types ────────────────────────────────────────────────────────
type ManageQueueFilter =
  | "all"
  | "drafts"
  | "submitted"
  | "under_review"
  | "resubmitted"
  | "revision_requested"
  | "approved";

const QUEUE_FILTER_COPY: Record<
  Exclude<ManageQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  drafts: {
    banner: "Showing draft proposals that haven't been submitted yet.",
    emptyTitle: "No draft proposals",
    emptyDescription: "You don't have any draft proposals. Start a new one!",
    searchPlaceholder: "Search draft proposals...",
  },
  submitted: {
    banner: "Showing newly submitted proposals awaiting PSR review.",
    emptyTitle: "No submitted proposals",
    emptyDescription:
      "You don't have any submitted proposals waiting for review.",
    searchPlaceholder: "Search submitted proposals...",
  },
  under_review: {
    banner: "Showing proposals currently under review or screening.",
    emptyTitle: "No proposals under review",
    emptyDescription: "You don't have any proposals under review right now.",
    searchPlaceholder: "Search under-review proposals...",
  },
  resubmitted: {
    banner:
      "Showing proposals that were revised and resubmitted for review.",
    emptyTitle: "No resubmitted proposals",
    emptyDescription: "You don't have any resubmitted proposals in the queue.",
    searchPlaceholder: "Search resubmitted proposals...",
  },
  revision_requested: {
    banner:
      "Showing proposals where PSR has requested revisions. Please revise and resubmit.",
    emptyTitle: "No revision requests",
    emptyDescription:
      "There are no proposals awaiting revision right now.",
    searchPlaceholder: "Search revision requests...",
  },
  approved: {
    banner: "Showing your approved proposals ready for the next stage.",
    emptyTitle: "No approved proposals",
    emptyDescription: "You don't have any approved proposals yet.",
    searchPlaceholder: "Search approved proposals...",
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
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  submitted: { label: "Submitted", variant: "default", icon: Clock },
  resubmitted: { label: "Resubmitted", variant: "default", icon: RefreshCw },
  under_review: { label: "Under Review", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  contracted: { label: "Contracted", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "outline", icon: Clock },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  terminated: { label: "Terminated", variant: "destructive", icon: XCircle },
  protocol_stage: {
    label: "Protocol Stage",
    variant: "outline",
    icon: FileText,
  },
  funding_recommendation: {
    label: "Funding Recommendation",
    variant: "default",
    icon: CheckCircle2,
  },
  revision_requested: {
    label: "Revision Requested",
    variant: "outline",
    icon: Edit,
  },
  screening_under_review: {
    label: "Screening",
    variant: "outline",
    icon: Clock,
  },
  screening_approved: {
    label: "Screening Approved",
    variant: "default",
    icon: CheckCircle2,
  },
  screening_rejected: {
    label: "Screening Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

// ── Proposal row type for the table ────────────────────────────────────────────
type ProposalRow = {
  id: string;
  referenceNumber: string;
  title: string;
  thematicAreas: string;
  status: string;
  statusLabel: string;
  submittedAt?: string;
  organization?: string;
  unit?: string;
};

// ── Columns ────────────────────────────────────────────────────────────────────
const columns: ColumnDef<ProposalRow>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
    cell: ({ row }) => (
      <Link
        href={`/research/proposals/my-proposals/${row.original.id}`}
        className="font-medium text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.referenceNumber}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-xs w-[250px]">
        <p className="font-medium whitespace-normal break-words">
          {row.original.title}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "thematicAreas",
    header: "Thematic Area",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.thematicAreas || "N/A"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config =
        statusConfig[row.original.status] || statusConfig.draft;
      const Icon = config.icon;
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {row.original.statusLabel || config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.submittedAt
          ? new Date(row.original.submittedAt).toLocaleDateString()
          : "-"}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/research/proposals/my-proposals/${row.original.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          {row.original.status === "draft" && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/research/proposals/my-proposals/${row.original.id}/edit`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// ── Page Component ─────────────────────────────────────────────────────────────
export default function ProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQueue = ((): ManageQueueFilter => {
    const param = searchParams.get("queue");
    if (
      param &&
      VALID_QUEUE_KEYS.includes(param)
    ) {
      return param as ManageQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] =
    useState<ManageQueueFilter>(initialQueue);

  const { data, isLoading, isError, refetch, isFetching } = useProposals({
    limit: 100,
    ...(queueFilter !== "all" ? { queue: queueFilter } : {}),
  });

  const proposals = data?.data ?? [];
  const meta = data?.meta as any;
  const statistics = meta?.statistics ?? {};

  // ── Stats (prefer API stats, fallback to client-side) ──────────────────────
  const stats = {
    total: statistics.totalProposals ?? proposals.length,
    drafts:
      statistics.drafts ??
      proposals.filter((p) => p.status === "draft").length,
    submitted:
      statistics.submitted ??
      proposals.filter((p) => p.status === "submitted").length,
    underReview:
      statistics.underReview ??
      proposals.filter(
        (p) => p.status === "screening_under_review",
      ).length,
    resubmitted:
      statistics.resubmitted ??
      proposals.filter((p) => p.status === "resubmitted").length,
    revisionRequested:
      statistics.revisionRequested ??
      proposals.filter(
        (p) =>
          p.status === "screening_rejected" ||
          p.status === "revision_required",
      ).length,
    approved:
      statistics.approved ??
      proposals.filter(
        (p) => p.status === "screening_approved",
      ).length,
  };

  const applyQueueFilter = (filter: ManageQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards: Array<{
    key: ManageQueueFilter;
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
      value: stats.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "Across all categories",
    },
    {
      key: "drafts",
      label: "Drafts",
      value: stats.drafts,
      icon: <Edit className="h-4 w-4 text-slate-600" />,
      iconBg: "bg-slate-100",
      border: "border-slate-200/70 bg-slate-50/20",
      activeRing: "ring-slate-500/60 border-slate-300",
      sub: "Not yet submitted",
    },
    {
      key: "submitted",
      label: "Submitted",
      value: stats.submitted,
      icon: <Inbox className="h-4 w-4 text-violet-600" />,
      iconBg: "bg-violet-100",
      border: "border-violet-200/70 bg-violet-50/20",
      activeRing: "ring-violet-500/60 border-violet-300",
      sub: "Awaiting PSR review",
    },
    {
      key: "under_review",
      label: "Under Review",
      value: stats.underReview,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Being evaluated",
    },
    {
      key: "resubmitted",
      label: "Resubmitted",
      value: stats.resubmitted,
      icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      border: "border-purple-200/70 bg-purple-50/20",
      activeRing: "ring-purple-500/60 border-purple-300",
      sub: "Revised and resent",
    },
    {
      key: "revision_requested",
      label: "Revision Required",
      value: stats.revisionRequested,
      icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
      iconBg: "bg-amber-100",
      border: "border-amber-100/50 bg-amber-50/10",
      activeRing: "ring-amber-500/60 border-amber-300",
      sub: "Needs your updates",
    },
    {
      key: "approved",
      label: "Approved",
      value: stats.approved,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "Ready for next stage",
    },
  ];

  // ── Table row data mapping ─────────────────────────────────────────────────
  const tableData: ProposalRow[] = useMemo(() => {
    return proposals.map((p: any) => ({
      id: String(p.id),
      referenceNumber: p.referenceNumber || p.reference_number || `PRP-${p.id}`,
      title: p.title || "Untitled Proposal",
      thematicAreas:
        p.thematicAreas && p.thematicAreas.length > 0
          ? p.thematicAreas.map((ta: any) => ta.name).join(", ")
          : "N/A",
      status: p.status || "draft",
      statusLabel: p.statusDisplay || p.status_display || "",
      submittedAt: p.submittedAt || p.lastSubmittedAt || undefined,
      organization: p.Organization?.name || p.organization?.name || "",
      unit: p.Unit?.name || p.unit?.name || "",
    }));
  }, [proposals]);

  const statusOptions = Object.entries(statusConfig).map(
    ([value, { label }]) => ({
      value,
      label,
    }),
  );

  return (
    <PageContainer
      title="My Proposals"
      description="Manage your research proposals and submissions"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/research/proposals/my-proposals/new">
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Link>
          </Button>
        </div>
      }
    >
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
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
              ({
                key,
                label,
                value,
                icon,
                iconBg,
                border,
                activeRing,
                sub,
              }) => {
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
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
                      >
                        {icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {isLoading ? (
                          <Skeleton className="h-8 w-12" />
                        ) : (
                          value
                        )}
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {sub}
                      </p>
                    </CardContent>
                  </Card>
                );
              },
            )}
      </div>

      {/* ── Filter banner ─────────────────────────────────────────────────── */}
      {activeFilterCopy && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">
            {activeFilterCopy.banner}
          </p>
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
              Failed to load proposals
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please try again later.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData}
            searchKey="title"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ??
              "Search proposals by title..."
            }
            onRowClick={(row) => {
              router.push(`/research/proposals/my-proposals/${row.id}`);
            }}
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "status",
                      label: "Status",
                      options: statusOptions,
                    },
                  ]
                : []
            }
            emptyMessage="No proposals found"
            emptyDescription="Try adjusting your filters or create a new proposal"
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
                  "No proposals have been created yet. Start by creating a new proposal."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all proposals
                </Button>
              </EmptyContent>
            ) : (
              <EmptyContent>
                <Button asChild size="sm">
                  <Link href="/research/proposals/my-proposals/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Proposal
                  </Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
