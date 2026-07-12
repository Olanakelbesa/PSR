"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Inbox,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import {
  useManageConceptNotes,
  type ConceptNoteItem,
} from "@/lib/queries/concept-notes";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type ManageQueueFilter =
  | "all"
  | "new_submissions"
  | "draft"
  | "under_review"
  | "resubmitted"
  | "approved";

const QUEUE_FILTER_COPY: Record<
  Exclude<ManageQueueFilter, "all">,
  { banner: string; emptyTitle: string; emptyDescription: string; searchPlaceholder: string }
> = {
  new_submissions: {
    banner:
      "Showing newly submitted concept notes that need PSR review and expert assignment.",
    emptyTitle: "No new submissions",
    emptyDescription:
      "There are no newly submitted concept notes waiting for expert assignment right now.",
    searchPlaceholder: "Search new submissions...",
  },
  draft: {
    banner: "Showing concept notes still in draft and not yet submitted.",
    emptyTitle: "No draft concept notes",
    emptyDescription: "There are no draft concept notes in the manage queue.",
    searchPlaceholder: "Search draft concept notes...",
  },
  under_review: {
    banner: "Showing concept notes currently under expert review.",
    emptyTitle: "No concept notes under review",
    emptyDescription: "There are no concept notes assigned to experts right now.",
    searchPlaceholder: "Search under-review notes...",
  },
  resubmitted: {
    banner:
      "Showing concept notes that were revised and resubmitted for review.",
    emptyTitle: "No resubmitted concept notes",
    emptyDescription:
      "There are no resubmitted concept notes waiting in the queue.",
    searchPlaceholder: "Search resubmitted notes...",
  },
  approved: {
    banner:
      "Showing accepted concept notes that are ready for the next workflow stage.",
    emptyTitle: "No approved concept notes",
    emptyDescription: "There are no approved concept notes in this queue.",
    searchPlaceholder: "Search approved notes...",
  },
};

// ── Status display helpers ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  under_review: {
    label: "Under Review",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  partially_accepted: {
    label: "Partially Accepted",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  not_accepted: {
    label: "Not Accepted",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  revision_required: {
    label: "Revision Required",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  policy_draft_ready: {
    label: "Policy Draft Ready",
    className: "bg-teal-100 text-teal-700 border-teal-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
}

// ── Column definitions — mapped to real API field names ────────────────────────
const columns: ColumnDef<ConceptNoteItem>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Title <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const note = row.original;
      return (
        <div className="flex flex-col gap-1 py-2 min-w-[130px]">
          <Link
            href={`/policies/concept-notes/manage-concept-notes/${note.id}`}
            className="font-bold text-[15px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {note.title}
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed whitespace-pre-wrap break-words">
            {note.executiveSummary}
          </p>
        </div>
      );
    },
  },
  {
    id: "docType",
    accessorKey: "docType",
    header: () => <span className="font-semibold text-sm">Type</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 shadow-sm ring-1 ring-border/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-[13px] font-medium text-foreground">
          {row.original.docType?.name ?? "—"}
        </span>
      </div>
    ),
  },
  {
    id: "organization",
    accessorKey: "organization",
    header: () => <span className="font-semibold text-sm">Organization</span>,
    cell: ({ row }) => (
      <span className="text-[13px] font-medium text-foreground">
        {row.original.organization?.name ?? "—"}
      </span>
    ),
  },
  {
    id: "unit",
    accessorKey: "unit",
    header: () => <span className="font-semibold text-sm">Unit</span>,
    cell: ({ row }) => (
      <span className="text-[13px] font-medium text-foreground">
        {row.original.unit?.name ?? "—"}
      </span>
    ),
  },
  {
    id: "currentStatus",
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Status <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.currentStatus} />,
  },
  {
    id: "versionNumber",
    accessorKey: "versionNumber",
    header: () => <span className="font-semibold text-sm">Version</span>,
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20"
      >
        {row.original.versionNumber ?? "—"}
      </Badge>
    ),
  },
  {
    id: "submittedBy",
    accessorKey: "submittedBy",
    header: () => (
      <span className="ml-1 font-semibold text-sm">Submitted By</span>
    ),
    cell: ({ row }) => {
      const author = row.original.submittedBy;
      const initials = author.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border/50">
            <AvatarImage
              src={resolveFileUrl(author.photoUrl) ?? undefined}
              alt={author.fullName}
            />
            <AvatarFallback className="text-[11px] font-bold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">
              {author.fullName}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {author.email}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "submissionDate",
    accessorKey: "submissionDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Submitted <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground/80">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-[13px] font-medium">
          {new Date(row.original.submissionDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const note = row.original;
      return (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted/80 rounded-full"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[180px] p-1 shadow-xl border-muted-foreground/20"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5 font-normal uppercase tracking-wider">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted/50" />
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/concept-notes/manage-concept-notes/${note.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/concept-notes/manage-concept-notes/${note.id}/assign`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  Assign Expert
                </Link>
              </DropdownMenuItem>
              {(note.currentStatus === "submitted" ||
                note.currentStatus === "under_review") && (
                  <>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/policies/concept-notes/manage-concept-notes/${note.id}/approve`}
                        className="cursor-pointer flex items-center px-2 py-2 text-sm font-semibold rounded-md focus:bg-primary/10 focus:text-primary"
                      >
                        Approve
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
function BackendErrorMessage({
  errorPayload,
  className,
}: {
  errorPayload: any;
  className?: string;
}) {
  if (!errorPayload) return null;

  // Try several shapes: raw envelope, axios error with response.data, or plain message
  const envelope =
    errorPayload?.response?.data ??
    (errorPayload?.data && typeof errorPayload?.data === "object"
      ? errorPayload.data
      : null) ??
    (errorPayload?.error ? errorPayload : null);

  const message =
    envelope?.error?.message ??
    envelope?.message ??
    errorPayload?.message ??
    null;
  const detail =
    envelope?.error?.details?.detail ?? envelope?.error?.details ?? null;

  if (!message && !detail) return null;

  return (
    <div className={className}>
      {message && (
        <p className="text-sm font-medium text-destructive/90">{message}</p>
      )}
      {detail && <p className="text-sm text-muted-foreground mt-1">{detail}</p>}
    </div>
  );
}

export default function ManageConceptNotesPage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const [page, setPage] = useState(1);
  const [queueFilter, setQueueFilter] = useState<ManageQueueFilter>("all");

  const { data, isLoading, isError, error, refetch, isFetching } =
    useManageConceptNotes(
      {
        limit: 100,
        page,
        ...(queueFilter !== "all" ? { queue: queueFilter } : {}),
      },
      backendToken,
    );

  const notes = data?.data ?? [];
  const meta = data?.meta as any;
  const statistics = meta?.statistics ?? {};

  const stats = {
    total: statistics.totalConceptNote ?? notes.length,
    draft:
      statistics.inDraft ??
      notes.filter((n) => n.currentStatus === "draft").length,
    newSubmissions:
      statistics.newSubmissions ??
      notes.filter((n) => n.currentStatus === "submitted").length,
    review:
      statistics.underReview ??
      notes.filter((n) => n.currentStatus === "under_review").length,
    resubmitted:
      statistics.resubmitted ??
      notes.filter((n) => n.currentStatus === "resubmitted").length,
    approved:
      statistics.approved ??
      notes.filter((n) =>
        ["accepted", "policy_draft_ready", "partially_accepted"].includes(
          n.currentStatus,
        ),
      ).length,
  };

  const applyQueueFilter = (filter: ManageQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
    setPage(1);
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

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
      label: "Total Concept Notes",
      value: stats.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "Across all categories",
    },
    {
      key: "new_submissions",
      label: "New Concept Note Submitted",
      value: stats.newSubmissions,
      icon: <Inbox className="h-4 w-4 text-violet-600" />,
      iconBg: "bg-violet-100",
      border: "border-violet-200/70 bg-violet-50/20",
      activeRing: "ring-violet-500/60 border-violet-300",
      sub: "Awaiting review & expert assignment",
    },
    {
      key: "draft",
      label: "In Draft",
      value: stats.draft,
      icon: <Clock className="h-4 w-4 text-orange-500" />,
      iconBg: "bg-orange-100",
      border: "border-orange-100/50 bg-orange-50/10",
      activeRing: "ring-orange-500/60 border-orange-300",
      sub: "Pending submission",
    },
    {
      key: "under_review",
      label: "Under Review",
      value: stats.review,
      icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Assigned to experts",
    },
    {
      key: "resubmitted",
      label: "Resubmitted Concept Note",
      value: stats.resubmitted,
      icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      border: "border-purple-200/70 bg-purple-50/20",
      activeRing: "ring-purple-500/60 border-purple-300",
      sub: "Revised and sent back for review",
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

  return (
    <PageContainer
      title="Manage Concept Notes"
      description="Review, assign, and approve all submitted concept notes across the platform."
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
        </div>
      }
    >
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map(
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
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
                  >
                    {icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : value}
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

      {activeFilterCopy && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">{activeFilterCopy.banner}</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-background"
            onClick={() => {
              setQueueFilter("all");
              setPage(1);
            }}
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
              Failed to load concept notes
            </p>
            <BackendErrorMessage
              className="mt-2"
              errorPayload={error ?? data}
            />
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : notes.length > 0 ? (
          <DataTable
            columns={columns}
            data={notes}
            searchKey="title"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ?? "Search concept notes..."
            }
            onRowClick={(note) =>
              router.push(
                `/policies/concept-notes/manage-concept-notes/${note.id}`,
              )
            }
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "currentStatus",
                      label: "Status",
                      options: Object.entries(STATUS_CONFIG).map(
                        ([value, { label }]) => ({ value, label }),
                      ),
                    },
                  ]
                : []
            }
          />
        ) : (
          <Empty className="border-dashed py-24">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No concept notes found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "No concept notes have been submitted to the platform yet."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQueueFilter("all");
                    setPage(1);
                  }}
                >
                  Show all concept notes
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
