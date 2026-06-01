"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, RefreshCw, Calendar, Wallet, CheckCircle2, ArrowRight } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressReports } from "@/hooks";

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

export default function MyFinalReportsPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();

  // Fetch only approved progress reports
  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      status: "approved",
    }),
    [page]
  );

  const { data, isLoading, refetch, isFetching } = useProgressReports(queryParams);
  const reports = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

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
      cell: () => (
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none capitalize">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Approved
        </Badge>
      ),
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
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const stats = [
    {
      title: "Approved Progress Reports",
      value: meta.total,
      caption: "Ready for final reports",
      icon: CheckCircle2,
      accent: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    },
    {
      title: "Total Expenditures",
      value: formatCurrency(
        reports.reduce((sum, item) => sum + Number(item.amount_used || 0), 0)
      ),
      caption: "Spent across approved reports",
      icon: Wallet,
      accent: { iconBg: "bg-primary/10", iconColor: "text-primary" },
    },
  ];

  return (
    <PageContainer
      title="My Final Reports"
      description="View and manage approved progress reports to initiate final report submissions."
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={reports}
          onRowClick={(row) =>
            router.push(`/research/final-report/my-final-reports/${row.id}`)
          }
          emptyMessage="No approved progress reports found"
          emptyDescription="There are no progress reports currently marked as approved."
        />
      </div>
    </PageContainer>
  );
}