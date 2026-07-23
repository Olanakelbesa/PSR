"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Wallet,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressReports, useDebounce } from "@/hooks";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

type StatFilter = "all" | "pending" | "approved" | "rejected";

const ALL_VALUE = "all";

export default function MyFinalReportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      status: statusFilter !== ALL_VALUE ? statusFilter : undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [page, debouncedSearch, statusFilter],
  );

  const { data, isLoading, refetch, isFetching } = useProgressReports(queryParams);
  const reports = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
  const statistics = (data?.meta as Record<string, unknown>)?.statistics as
    | { total: number; pending: number; approved: number; rejected: number }
    | undefined;

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total",
        value: statistics?.total ?? meta.total ?? 0,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "All progress reports",
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
        sub: "Approved reports",
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
    [statistics, meta.total],
  );

  const expenditureTotal = reports.reduce(
    (sum, item) => sum + Number(item.amount_used || 0),
    0,
  );

  const columns = [
    {
      accessorKey: "id",
      header: "Report ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs font-semibold text-primary">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "report_name",
      header: "Report Name",
      cell: ({ row }: any) => (
        <div className="max-w-[240px]">
          <span className="font-bold block truncate text-slate-900">
            {row.original.report_name || "Untitled Report"}
          </span>
          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
            Submitted: {formatDate(row.original.submitted_at)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "project_tracking_title",
      header: "Project Title",
      cell: ({ row }: any) => (
        <div className="max-w-[340px]">
          <span className="font-semibold block line-clamp-2 text-slate-800">
            {row.original.project_tracking_title || "Untitled Project"}
          </span>
          <span className="text-[10px] text-primary font-medium block mt-0.5">
            Tracking ID: #{row.original.project_tracking}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "amount_used",
      header: "Amount Used",
      cell: ({ row }: any) => (
        <span className="font-mono text-sm font-bold text-slate-900">
          {formatCurrency(row.original.amount_used)}
        </span>
      ),
    },
    {
      id: "dates",
      header: "Project Dates",
      cell: ({ row }: any) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(row.original.start_date)} - {formatDate(row.original.end_date)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.original.status;
        const statusClasses: Record<string, string> = {
          approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
          pending: "border-amber-200 bg-amber-50 text-amber-700",
          rejected: "border-rose-200 bg-rose-50 text-rose-700",
        };
        return (
          <Badge
            variant="outline"
            className={cn("capitalize", statusClasses[status] ?? "border-slate-200 bg-slate-50 text-slate-700")}
          >
            {status ?? "Unknown"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/research/final-report/my-final-reports/${row.original.id}`);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="My Final Reports"
      description="View and manage progress reports to initiate final report submissions."
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-none shadow-sm">
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="shrink-0 rounded-xl bg-primary/10 p-3">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-black">{formatCurrency(expenditureTotal)}</div>
                  <p className="text-xs font-medium text-muted-foreground">Total Expenditures</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                    Spent across filtered reports
                  </p>
                </div>
              </CardContent>
            </Card>

            {statusFilter !== ALL_VALUE && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(ALL_VALUE)}
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
          onRowClick={(row) =>
            router.push(`/research/final-report/my-final-reports/${row.id}`)
          }
          emptyMessage="No progress reports found"
          emptyDescription={
            search
              ? "No matching results found for your search query."
              : "There are no progress reports currently available."
          }
        />
      </div>
    </PageContainer>
  );
}
