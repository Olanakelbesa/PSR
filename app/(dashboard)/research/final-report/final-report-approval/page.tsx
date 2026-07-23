"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTerminalReports } from "@/hooks/useProgressReports";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const ALL_STATUS_VALUE = "all";

type StatFilter = "all" | "pending" | "approved" | "rejected";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  on_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: TrendingUp,
  },
};

function StatusBadge({ value }: { value: string }) {
  const cfg = statusConfig[value] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[11px] font-semibold", cfg.className)}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TerminalReportApprovalListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_STATUS_VALUE);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
    setSearch(debouncedSearch.trim());
  }, [debouncedSearch]);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_STATUS_VALUE : filter));
  }, []);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(statusFilter !== ALL_STATUS_VALUE ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }),
    [page, statusFilter, search],
  );

  const { data, isLoading, isFetching, refetch } = useTerminalReports(params);

  const reports = data?.data ?? [];
  const statistics = (data?.meta as Record<string, unknown>)?.statistics as
    | { total: number; pending: number; approved: number; rejected: number }
    | undefined;

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total",
        value: statistics?.total ?? 0,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "All terminal reports",
      },
      {
        key: "pending" as StatFilter,
        label: "Pending",
        value: statistics?.pending ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Awaiting review",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved",
        value: statistics?.approved ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Cleared for closeout",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected",
        value: statistics?.rejected ?? 0,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Rejected reports",
      },
    ],
    [statistics],
  );

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-[11px] font-bold tracking-widest text-primary/70">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "report_name",
      header: "Report",
      cell: ({ row }: any) => (
        <div className="flex flex-col gap-0.5 max-w-[240px]">
          <span className="truncate text-sm font-semibold text-foreground">
            {row.original.report_name ?? "Untitled Report"}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {row.original.submitted_by_name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "project_tracking_title",
      header: "Project",
      cell: ({ row }: any) => (
        <div className="flex flex-col gap-0.5 max-w-[220px]">
          <span className="truncate text-sm font-medium">
            {row.original.project_tracking_title ?? "—"}
          </span>
          {row.original.project_tracking_status && (
            <StatusBadge value={row.original.project_tracking_status} />
          )}
        </div>
      ),
    },
    {
      accessorKey: "main_deliverables",
      header: "Main Deliverables",
      cell: ({ row }: any) => (
        <p className="max-w-[260px] truncate text-xs text-muted-foreground">
          {row.original.main_deliverables || "—"}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <StatusBadge value={row.original.status} />,
    },
    {
      accessorKey: "is_published",
      header: "Published",
      cell: ({ row }: any) =>
        row.original.is_published ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            {row.original.publication_link ? (
              <a
                href={row.original.publication_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                Link
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">Yes</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        )
    },
    {
      accessorKey: "attachment",
      header: "Attachment",
      cell: ({ row }: any) =>
        row.original.attachment ? (
          <a
            href={resolveFileUrl(row.original.attachment) ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-primary underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="h-3.5 w-3.5" />
            View
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(row.original.submitted_at)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link
            href={`/research/final-report/final-report-approval/${row.original.id}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Final Report Approval"
      description="Review submitted final reports and record closeout decisions."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {statCards.map((stat) => {
                const isActive = statusFilter === stat.key;
                return (
                  <Card
                    key={stat.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => applyStatusFilter(stat.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applyStatusFilter(stat.key);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border shadow-sm transition-all hover:shadow-md",
                      stat.border,
                      isActive && cn("ring-2 shadow-md", stat.activeRing),
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={cn("shrink-0 rounded-xl p-3", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      <div>
                        <div className="text-2xl font-black">{stat.value}</div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {stat.sub}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {statusFilter !== ALL_STATUS_VALUE && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(ALL_STATUS_VALUE)}
                  className="h-7 text-xs"
                >
                  Clear filter
                </Button>
              </div>
            )}
          </>
        )}

        <DataTable
          columns={columns}
          data={reports}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search reports..."
          emptyMessage="No terminal reports found"
          emptyDescription="Try adjusting your search or refresh the list."
          onRowClick={(report) =>
            router.push(
              `/research/final-report/final-report-approval/${report.id}`,
            )
          }
        />
      </div>
    </PageContainer>
  );
}
