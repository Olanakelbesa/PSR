"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, RefreshCw, Calendar, Wallet, CheckCircle2, ArrowRight, Search } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useProgressReports, useDebounce } from "@/hooks";

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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch only approved progress reports
  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      status: "approved",
      search: debouncedSearch.trim() || undefined,
    }),
    [page, debouncedSearch]
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
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            onRowClick={(row) =>
              router.push(`/research/final-report/my-final-reports/${row.id}`)
            }
            emptyMessage="No approved progress reports found"
            emptyDescription={search ? "No matching results found for your search query." : "There are no progress reports currently marked as approved."}
            toolbar={
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by report name or project title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-muted/20 border-muted-foreground/20 focus-visible:ring-primary/20 h-10"
                      />
                    </div>
                  </div>
                  {search && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setSearch("")} 
                      className="text-xs text-muted-foreground hover:text-foreground h-10 px-3"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            }
          />
        )}
      </div>
    </PageContainer>
  );
}