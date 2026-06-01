"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import {
  DataTable,
  type FilterOptionConfig,
} from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTerminalReports } from "@/hooks/useProgressReports";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const ALL_STATUS_VALUE = "all";

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
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL_STATUS_VALUE);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
    setSearch(debouncedSearch.trim());
  }, [debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(status !== ALL_STATUS_VALUE ? { status } : {}),
      ...(search ? { search } : {}),
    }),
    [page, status, search],
  );

  const { data, isLoading, isFetching, refetch } = useTerminalReports(params);

  const reports = data?.data ?? [];
  const meta = data?.meta;

  const filterOptions = useMemo<FilterOptionConfig[]>(
    () => [
      {
        key: "status",
        label: "Status",
        value: status,
        onValueChange: (value) => {
          setPage(1);
          setStatus(value);
        },
        placeholder: "Filter by status",
        allValue: ALL_STATUS_VALUE,
        allLabel: "All Status",
        options: [
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ],
      },
    ],
    [status],
  );

  const stats = [
    {
      label: "Total Reports",
      value: meta?.total ?? reports.length,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "Terminal reports submitted",
    },
    {
      label: "Pending",
      value: reports.filter((r) => r.status === "pending").length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      desc: "Awaiting review",
    },
    {
      label: "Approved",
      value: reports.filter((r) => r.status === "approved").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      desc: "Cleared for closeout",
    },
    {
      label: "Published",
      value: reports.filter((r) => r.is_published).length,
      icon: Globe,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      desc: "With publication link",
    },
  ];

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
        ),
    },
    {
      accessorKey: "attachment",
      header: "Attachment",
      cell: ({ row }: any) =>
        row.original.attachment ? (
          <a
            href={row.original.attachment}
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
            href={`/research/monitoring/terminal-report-approval/${row.original.id}`}
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
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={cn("rounded-lg p-1.5", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">
                      {stat.value}
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                      {stat.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={reports}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search reports..."
          filterOptions={filterOptions}
          emptyMessage="No terminal reports found"
          emptyDescription="Try adjusting your filters or refresh the list."
        />
      </div>
    </PageContainer>
  );
}
