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
import { useProgressReportApprovals } from "@/hooks";

const decisionLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;

const decisionClasses = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
} as const;

export default function ProgressReportApprovalListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [ordering, setOrdering] = useState("-reviewed_at");

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      decision: decision === "all" ? undefined : decision,
      ordering,
    }),
    [page, search, decision, ordering],
  );

  const { data, isLoading, refetch } = useProgressReportApprovals(queryParams);
  const approvals = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const stats = [
    { label: "Total", value: meta.total },
    {
      label: "Pending",
      value: approvals.filter((approval) => approval.decision === "pending")
        .length,
    },
    {
      label: "Approved",
      value: approvals.filter((approval) => approval.decision === "approved")
        .length,
    },
    {
      label: "Rejected",
      value: approvals.filter((approval) => approval.decision === "rejected")
        .length,
    },
  ];

  const columns = [
    {
      accessorKey: "id",
      header: "Approval ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-[11px] font-semibold text-primary/80">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "progress_report",
      header: "Progress Report",
      cell: ({ row }: any) => (
        <span className="font-mono text-[11px] font-semibold">
          {row.original.progress_report}
        </span>
      ),
    },
    {
      accessorKey: "reviewer_name",
      header: "Reviewer",
      cell: ({ row }: any) => (
        <div className="max-w-65">
          <div className="font-semibold truncate">
            {row.original.reviewer_name}
          </div>
          <div className="text-[11px] text-muted-foreground">
            ID: {row.original.reviewer}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "decision",
      header: "Decision",
      cell: ({ row }: any) => {
        const value = row.original.decision as keyof typeof decisionLabels;
        return (
          <Badge variant="outline" className={decisionClasses[value]}>
            {decisionLabels[value]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "reviewed_at",
      header: "Reviewed At",
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground">
          {row.original.reviewed_at
            ? new Date(row.original.reviewed_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }: any) => (
        <span className="block max-w-70 truncate text-xs text-muted-foreground">
          {row.original.comment || "No comment"}
        </span>
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
            <Eye className="mr-1 h-4 w-4" />
            Review
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Progress Report Approvals"
      description="Review and decide progress report approval records from the monitoring workflow."
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

        <Card className="border-none shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search reviewer, comment, report id"
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSearch(searchInput.trim());
                  }}
                >
                  Search
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={decision}
                  onChange={(event) => {
                    setPage(1);
                    setDecision(
                      event.target.value as
                        | "all"
                        | "pending"
                        | "approved"
                        | "rejected",
                    );
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Decisions</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={ordering}
                  onChange={(event) => {
                    setPage(1);
                    setOrdering(event.target.value);
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="-reviewed_at">Newest Review</option>
                  <option value="reviewed_at">Oldest Review</option>
                  <option value="id">Approval ID Asc</option>
                  <option value="-id">Approval ID Desc</option>
                </select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={approvals}
              searchKey="reviewer_name"
              searchPlaceholder="Filter loaded rows..."
              emptyMessage="No progress report approvals found"
              emptyDescription="Try changing decision or search filters."
            />

            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Page {meta.page} of {Math.max(meta.totalPages, 1)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || page <= 1}
                  onClick={() =>
                    setPage((previous) => Math.max(previous - 1, 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    isLoading ||
                    (meta.totalPages > 0 && page >= meta.totalPages)
                  }
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
