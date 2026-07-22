"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressReports } from "@/hooks";
import { useRouter } from "next/navigation";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { cn } from "@/lib/utils";

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
} as const;

type StatFilter = "all" | "pending" | "approved" | "rejected";

const ALL_VALUE = "all";

export default function ProgressReportApprovalListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);
  const router = useRouter();

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      search: search || undefined,
      status: statusFilter !== ALL_VALUE ? statusFilter : undefined,
    }),
    [search, statusFilter],
  );

  const { data, isLoading } = useProgressReports(queryParams);
  const reports = data?.data ?? [];
  const stats = (data?.meta as Record<string, unknown>)?.statistics as
    | { total: number; pending: number; approved: number; rejected: number }
    | undefined;

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Reports",
        value: stats?.total ?? 0,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "All progress reports",
      },
      {
        key: "pending" as StatFilter,
        label: "Pending",
        value: stats?.pending ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Awaiting review decision",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved",
        value: stats?.approved ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Reports approved",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected",
        value: stats?.rejected ?? 0,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Reports rejected",
      },
    ],
    [stats],
  );

  const columns = [
    {
      accessorKey: "id",
      header: "Report ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-[11px] font-semibold text-primary/80">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "project_tracking_title",
      header: "Proposal",
      cell: ({ row }: any) => (
        <div className="max-w-[320px]">
          <div className="font-semibold truncate">
            {row.original.project_tracking_title || "Untitled proposal"}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            Progress report: {row.original.report_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "report_name",
      header: "Report Name",
      cell: ({ row }: any) => (
        <div className="max-w-[320px]">
          <div className="font-semibold truncate">
            {row.original.report_name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {row.original.main_activities_achieved || "No activities recorded"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount_used",
      header: "Amount Used",
      cell: ({ row }: any) => (
        <span className="font-mono text-[12px] font-semibold">
          {row.original.amount_used
            ? `ETB ${Number(row.original.amount_used).toLocaleString()}`
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground">
          {row.original.submitted_at
            ? new Date(row.original.submitted_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const value = row.original.status as keyof typeof statusLabels;
        return (
          <Badge variant="outline" className={statusClasses[value]}>
            {statusLabels[value] || row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "attachment",
      header: "Attachment",
      cell: ({ row }: any) => (
        <a
          href={resolveFileUrl(row.original.attachment) ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline underline-offset-2"
        >
          {row.original.attachment ? "View" : "No file"}
        </a>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link
            href={`/research/monitoring/progress-report-approval/${row.original.id}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Proposal Progress Reports"
      description="Review progress reports and approve or reject them."
    >
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardContent className="flex items-center gap-4 p-5">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat) => {
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

        <DataTable
          columns={columns}
          data={reports}
          searchKey="report_name"
          searchPlaceholder="Filter loaded rows..."
          emptyMessage="No progress reports found"
          emptyDescription="Try changing your search text or refresh the list."
          onRowClick={(report) =>
            router.push(
              `/research/monitoring/progress-report-approval/${report.id}`,
            )
          }
        />
      </div>
    </PageContainer>
  );
}
