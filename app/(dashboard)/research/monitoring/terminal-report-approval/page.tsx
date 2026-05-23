"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  CheckCircle2,
  Activity,
  TrendingUp,
  MoreHorizontal,
  FileCheck2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTerminalReportApprovals } from "@/hooks/useProgressReports";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending Review",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200/60",
  },
} as const;

export default function TerminalReportApprovalListPage() {
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<string>("");

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(decision ? { decision } : {}),
    }),
    [page, decision],
  );

  const { data, isLoading, isFetching } = useTerminalReportApprovals(params);

  const approvals = data?.data ?? [];
  const meta = data?.meta;

  const stats = [
    {
      label: "Total Approvals",
      value: meta?.total ?? approvals.length,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "Terminal reports in review",
    },
    {
      label: "Pending",
      value: approvals.filter((item) => item.decision === "pending").length,
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-500/10",
      desc: "Awaiting decision",
    },
    {
      label: "Approved",
      value: approvals.filter((item) => item.decision === "approved").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      desc: "Cleared for closeout",
    },
    {
      label: "Reviewed This Page",
      value: meta?.limit ?? approvals.length,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      desc: "Current page size",
    },
  ];

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-[10px] font-bold tracking-widest text-primary/70">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "reviewer_name",
      header: "Reviewer",
      cell: ({ row }: any) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">
            {row.original.reviewer_name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Reviewer ID: {row.original.reviewer}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "terminal_report",
      header: "Terminal Report",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">
            Report #{row.original.terminal_report}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "decision",
      header: "Decision",
      cell: ({ row }: any) => {
        const config =
          statusConfig[row.original.decision as keyof typeof statusConfig] ??
          statusConfig.pending;
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5",
              config.className,
            )}
          >
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "reviewed_at",
      header: "Reviewed At",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(row.original.reviewed_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/5"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 shadow-xl border-primary/10"
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/research/monitoring/terminal-report-approval/${row.original.id}`}
                className="cursor-pointer font-bold text-primary"
              >
                <FileCheck2 className="h-4 w-4 mr-2" />
                Review Approval
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/research/monitoring/terminal-report/${row.original.terminal_report}`}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                View Terminal Report
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Terminal Report Approval Portal"
      description="Review submitted terminal reports and record closeout decisions."
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                <Card
                  key={stat.label}
                  className="border-none shadow-sm bg-white"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {stat.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              {(["", "pending", "approved", "rejected"] as const).map(
                (value) => (
                  <Button
                    key={value || "all"}
                    variant={decision === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setPage(1);
                      setDecision(value);
                    }}
                  >
                    {value ? value[0].toUpperCase() + value.slice(1) : "All"}
                  </Button>
                ),
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {isFetching
                ? "Refreshing approvals..."
                : "Data is served through React Query cache."}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={approvals}
            searchKey="reviewer_name"
            searchPlaceholder="Search approvals..."
            emptyMessage="No terminal report approvals found"
            emptyDescription="There are no terminal approvals matching the selected filters."
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(meta?.page ?? page) <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  meta ? meta.page >= meta.totalPages : approvals.length === 0
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
