"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, RefreshCw, Search } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressReports } from "@/hooks";
import { useRouter } from "next/navigation";

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

export default function ProgressReportApprovalListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
    }),
    [page, search],
  );

  const { data, isLoading, refetch } = useProgressReports(queryParams);
  const reports = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const stats = [
    { label: "Total", value: meta.total },
    {
      label: "Pending",
      value: reports.filter((report) => report.status === "pending").length,
    },
    {
      label: "Approved",
      value: reports.filter((report) => report.status === "approved").length,
    },
    {
      label: "Rejected",
      value: reports.filter((report) => report.status === "rejected").length,
    },
  ];

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
          href={row.original.attachment || "#"}
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
      description="Review the proposal progress reports returned by the backend and open the related report details."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((item) => (
                <Card key={item.label} className="border-none shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{item.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

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
