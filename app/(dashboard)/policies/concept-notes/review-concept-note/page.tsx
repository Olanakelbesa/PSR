"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
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
import { useAuth } from "@/hooks/useAuth";
import { useMyReviews } from "@/lib/queries/concept-notes";
import type { ConceptNoteItem } from "@/lib/queries/concept-notes";
import { cn } from "@/lib/utils";

const PSR_DECIDED_STATUSES = [
  "policy_draft_ready",
  "revision_required",
  "not_accepted",
];
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type ReviewQueueFilter = "all" | "under_review" | "resubmitted" | "approved";

const QUEUE_FILTER_COPY: Record<
  Exclude<ReviewQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  under_review: {
    banner: "Showing concept notes currently under your active review.",
    emptyTitle: "No concept notes under review",
    emptyDescription:
      "There are no assigned concept notes currently under review.",
    searchPlaceholder: "Search under-review notes...",
  },
  resubmitted: {
    banner:
      "Showing concept notes that were revised and resubmitted for your review.",
    emptyTitle: "No resubmitted concept notes",
    emptyDescription:
      "There are no resubmitted concept notes assigned to you right now.",
    searchPlaceholder: "Search resubmitted notes...",
  },
  approved: {
    banner: "Showing assigned concept notes where your review is complete.",
    emptyTitle: "No completed reviews",
    emptyDescription:
      "There are no concept notes marked as review done in your assignments.",
    searchPlaceholder: "Search completed reviews...",
  },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  under_review: { label: "Under Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700 border-green-200" },
  partially_accepted: { label: "Partially Accepted", className: "bg-orange-100 text-orange-700 border-orange-200" },
  not_accepted: { label: "Not Accepted", className: "bg-red-100 text-red-700 border-red-200" },
  revision_required: { label: "Revision Required", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  resubmitted: { label: "Resubmitted", className: "bg-purple-100 text-purple-700 border-purple-200" },
  policy_draft_ready: { label: "Policy Draft Ready", className: "bg-teal-100 text-teal-700 border-teal-200" },
};

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
        Title
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const note = row.original;
      return (
        <div className="flex flex-col gap-1 py-2 min-w-[100px]">
          <Link
            href={`/policies/concept-notes/review-concept-note/${note.id}`}
            className="font-bold text-[15px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {note.title}
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-sm">
            {note.executiveSummary || "No summary provided."}
          </p>
        </div>
      );
    },
  },
  {
    id: "doc_type",
    accessorFn: (row) => row.docType?.name ?? "",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Type
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const docType = row.original.docType;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shadow-sm ring-1 ring-border/50">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-medium text-foreground">
            {docType?.name || "Concept Note"}
          </span>
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return (row.original.docType?.name ?? "") === value;
    },
  },
  {
    id: "organization",
    accessorKey: "organization.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Organization
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const organization = row.original.organization;
      return (
        <div className="flex items-center">
          <span className="text-[13px] font-medium text-foreground">
            {organization?.name || "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "unit",
    accessorKey: "unit.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Unit
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const unit = row.original.unit;
      return (
        <div className="flex items-center">
          <span className="text-[13px] font-medium text-foreground">
            {unit?.name || "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Status
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.currentStatus;
      const cfg = STATUS_CONFIG[status || ""] ?? {
        label: status,
        className: "bg-muted text-muted-foreground border-border",
      };
      return (
        <div className="flex items-center">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 ${cfg.className}`}
          >
            {cfg.label}
          </Badge>
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      if (!value) return true;
      return row.original.currentStatus === value;
    },
  },
  {
    id: "version",
    accessorKey: "versionNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Version
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const version = row.original.versionNumber;
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20"
        >
          {version || "v1.0.0"}
        </Badge>
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "submissionDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Created
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.submissionDate;
      return (
        <div className="flex items-center gap-2 text-muted-foreground/80">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-[13px] font-medium">
            {date
              ? new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>
      );
    },
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
                  href={`/policies/concept-notes/review-concept-note/${note.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  View details
                </Link>
              </DropdownMenuItem>
              {!PSR_DECIDED_STATUSES.includes(note.currentStatus || "") && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/policies/concept-notes/review-concept-note/${note.id}/review`}
                    className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                  >
                    Review
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function ConceptNotesPage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const [queueFilter, setQueueFilter] = useState<ReviewQueueFilter>("all");

  const { data, isLoading } = useMyReviews(
    {
      ...(queueFilter !== "all" ? { queue: queueFilter } : {}),
    },
    backendToken,
  );

  const notes = useMemo(() => data?.data || [], [data]);
  const statistics = (data?.meta as any)?.statistics ?? {};

  const stats = {
    total: statistics.totalConceptNote ?? notes.length,
    review:
      statistics.underReview ??
      notes.filter((n) => n.currentStatus === "under_review").length,
    resubmitted:
      statistics.resubmitted ??
      notes.filter((n) => n.currentStatus === "resubmitted").length,
    approved:
      statistics.approved ??
      notes.filter((n) =>
        ["accepted", "partially_accepted", "policy_draft_ready"].includes(
          n.currentStatus || "",
        ),
      ).length,
  };

  const applyQueueFilter = (filter: ReviewQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

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
      label: "Total Assigned",
      value: stats.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "In your evaluation pool",
    },
    {
      key: "under_review",
      label: "Under Review",
      value: stats.review,
      icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Active evaluation",
    },
    {
      key: "resubmitted",
      label: "Resubmitted CN",
      value: stats.resubmitted,
      icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      border: "border-purple-200/70 bg-purple-50/20",
      activeRing: "ring-purple-500/60 border-purple-300",
      sub: "Revised and sent back for review",
    },
    {
      key: "approved",
      label: "Review Done",
      value: stats.approved,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "Completed assessments",
    },
  ];

  return (
    <PageContainer
      title="My Reviews"
      description="Access and evaluate policy concept notes assigned to you for technical review."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            onClick={() => setQueueFilter("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

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
                `/policies/concept-notes/review-concept-note/${note.id}`,
              )
            }
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "doc_type",
                      label: "Type",
                      options: Array.from(
                        new Set(
                          notes
                            .map((n) => n.docType?.name)
                            .filter(Boolean),
                        ),
                      ).map((name) => ({
                        value: name as string,
                        label: name as string,
                      })),
                    },
                    {
                      key: "status",
                      label: "Status",
                      options: Object.entries(STATUS_CONFIG).map(
                        ([value, { label }]) => ({
                          value,
                          label,
                        }),
                      ),
                    },
                  ]
                : [
                    {
                      key: "doc_type",
                      label: "Type",
                      options: Array.from(
                        new Set(
                          notes
                            .map((n) => n.docType?.name)
                            .filter(Boolean),
                        ),
                      ).map((name) => ({
                        value: name as string,
                        label: name as string,
                      })),
                    },
                  ]
            }
          />
        ) : (
          <Empty className="py-24 border-dashed">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No assigned reviews"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "You do not currently have any policy concept notes assigned to you for technical review."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all assigned reviews
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
