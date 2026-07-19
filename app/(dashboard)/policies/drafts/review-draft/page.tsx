"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Calendar,
  Eye,
  ClipboardCheck,
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
import { Badge } from "@/components/ui/badge";
import { usePolicyDraftsMyReviews } from "@/lib/queries/policy-drafts";
import { cn } from "@/lib/utils";

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
    banner: "Showing drafts currently under your active review.",
    emptyTitle: "No drafts under review",
    emptyDescription:
      "There are no assigned drafts currently under review.",
    searchPlaceholder: "Search under-review drafts...",
  },
  resubmitted: {
    banner:
      "Showing drafts that were revised and resubmitted for your review.",
    emptyTitle: "No resubmitted drafts",
    emptyDescription:
      "There are no resubmitted drafts assigned to you right now.",
    searchPlaceholder: "Search resubmitted drafts...",
  },
  approved: {
    banner: "Showing assigned drafts where your review is complete.",
    emptyTitle: "No completed reviews",
    emptyDescription:
      "There are no drafts marked as review done in your assignments.",
    searchPlaceholder: "Search completed reviews...",
  },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  under_review: { label: "Under Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  review_completed: { label: "Review Completed", className: "bg-purple-100 text-purple-700 border-purple-200" },
  psr_approved: { label: "PSR Approved", className: "bg-green-100 text-green-700 border-green-200" },
  repository_registered: { label: "Registered", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  resubmission_required: { label: "Revision Requested", className: "bg-orange-100 text-orange-700 border-orange-200" },
  resubmitted: { label: "Resubmitted", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent px-0 text-foreground"
      >
        Draft Document
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const policy = row.original;
      return (
        <div className="flex flex-col gap-1 py-1.5 min-w-[280px] max-w-[400px]">
          <Link
            href={`/policies/drafts/review-draft/${policy.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-2"
            onClick={(e) => e.stopPropagation()}
          >
            {policy.title}
          </Link>
          <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
            {policy.organization?.name || "Institution Partner"}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "versionNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Version
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const version = row.getValue("versionNumber") as string;
      return (
        <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20 font-bold">
          {version || "PD-0001-V1"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "docType",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const docType = row.original.docType;
      return (
        <Badge
          variant="outline"
          className="text-[11px] font-semibold bg-primary/5 text-primary border-primary/10"
        >
          {docType?.name || "Policy"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const docTypeName = row.original.docType?.name;
      return docTypeName === value;
    },
  },

  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string;
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium font-sans">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/85" />
          <span>
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("currentStatus") as string;
      const display = row.original.currentStatusDisplay || status;
      
      let badgeStyle = "bg-muted text-muted-foreground border-muted-foreground/10";
      if (["submitted", "resubmitted"].includes(status)) {
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400";
      } else if (["under_review", "review_completed"].includes(status)) {
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400";
      } else if (status === "psr_approved") {
        badgeStyle = "bg-green-50 text-green-700 border-green-200/60 dark:bg-green-950/30 dark:text-green-400";
      } else if (status === "repository_registered") {
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400";
      } else if (status === "resubmission_required") {
        badgeStyle = "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-400";
      }
      
      return (
        <Badge variant="outline" className={cn("font-semibold text-[11px] px-2.5 py-0.5 rounded-full capitalize shadow-sm", badgeStyle)}>
          {display.replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      return value === row.getValue(id);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const policy = row.original;

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
                Review Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted/50" />
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/drafts/review-draft/${policy.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/drafts/review-draft/${policy.id}/review`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Evaluate Checklist
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted/50" />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

const statusOptions = [
  { value: "under_review", label: "Under Review" },
  { value: "review_completed", label: "Review Completed" },
  { value: "psr_approved", label: "Approved" },
  { value: "repository_registered", label: "Registered in Repository" },
  { value: "resubmission_required", label: "Revision Requested" },
  { value: "resubmitted", label: "Resubmitted" },
];

export default function PolicyDraftsMyReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQueue = ((): ReviewQueueFilter => {
    const param = searchParams.get("status");
    if (param && ["under_review", "resubmitted", "approved"].includes(param)) {
      return param as ReviewQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] = useState<ReviewQueueFilter>(initialQueue);

  const { data: myReviewsResponse, isLoading } = usePolicyDraftsMyReviews({
    limit: 100,
    ...(queueFilter !== "all" ? { queue: queueFilter } : {}),
  });
  const policies = myReviewsResponse?.data || [];
  const draftStatistics = myReviewsResponse?.meta?.statistics;

  const typeOptions = useMemo(() => {
    const uniqueTypes = new Set<string>();
    policies.forEach((p: any) => {
      if (p.docType?.name) {
        uniqueTypes.add(p.docType.name);
      }
    });
    return Array.from(uniqueTypes).map((t) => ({
      value: t,
      label: t,
    }));
  }, [policies]);

  const stats = useMemo(() => {
    if (draftStatistics) {
      return {
        total: draftStatistics.total_drafts ?? policies.length,
        underReview: draftStatistics.under_review ?? 0,
        resubmitted: draftStatistics.resubmitted ?? 0,
        approved: draftStatistics.approved ?? 0,
      };
    }
    return {
      total: policies.length,
      underReview: policies.filter((p) => p.currentStatus === "under_review").length,
      resubmitted: policies.filter((p) => p.currentStatus === "resubmitted").length,
      approved: policies.filter((p) =>
        ["psr_approved", "repository_registered"].includes(p.currentStatus)
      ).length,
    };
  }, [draftStatistics, policies]);

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
      value: stats.underReview,
      icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Active evaluation",
    },
    {
      key: "resubmitted",
      label: "Resubmitted Drafts",
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
      title="Assigned Draft Reviews"
      description="Evaluate assigned institutional policy drafts, score quality checklists, and submit official feedback."
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

      <div className="mt-8">
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
        ) : policies.length > 0 ? (
          <DataTable
            columns={columns}
            data={policies}
            searchKey="title"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ?? "Search draft documents..."
            }
            onRowClick={(policy) => router.push(`/policies/drafts/review-draft/${policy.id}`)}
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "docType",
                      label: "Type",
                      options: typeOptions,
                    },
                    {
                      key: "currentStatus",
                      label: "Status",
                      options: statusOptions,
                    },
                  ]
                : [
                    {
                      key: "docType",
                      label: "Type",
                      options: typeOptions,
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
                {activeFilterCopy?.emptyTitle ?? "No draft reviews found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "You have not been assigned to review any policy drafts at this moment."}
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
