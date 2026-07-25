"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  Hash,
  LayoutList,
  Layers,
  Maximize2,
  Minimize2,
  Paperclip,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useProgressReports } from "@/hooks";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { cn } from "@/lib/utils";

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
} as const;

type StatFilter = "all" | "pending" | "approved" | "rejected";
type ViewMode = "grouped" | "table";

const ALL_VALUE = "all";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "ETB 0.00";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `ETB ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export default function ProgressReportApprovalListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  // Group reports by proposal / project tracking
  const groupedReports = useMemo(() => {
    const map = new Map<
      string | number,
      {
        projectId: string | number;
        proposalTitle: string;
        proposalId?: number;
        reports: typeof reports;
        pendingCount: number;
        approvedCount: number;
        rejectedCount: number;
        totalAmountUsed: number;
      }
    >();

    for (const report of reports) {
      const ptObj = (report as any).projectTracking || (report as any).project_tracking_obj;
      const projectId =
        report.project_tracking ??
        ptObj?.projectTrackingId ??
        ptObj?.id ??
        "Unassigned";

      const proposalTitle =
        report.project_tracking_title ??
        ptObj?.title ??
        `Project Tracking #${projectId}`;

      const proposalId = ptObj?.proposalId ?? ptObj?.proposal;

      if (!map.has(projectId)) {
        map.set(projectId, {
          projectId,
          proposalTitle,
          proposalId,
          reports: [],
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalAmountUsed: 0,
        });
      }

      const group = map.get(projectId)!;
      group.reports.push(report);
      if (report.status === "pending") group.pendingCount++;
      if (report.status === "approved") group.approvedCount++;
      if (report.status === "rejected") group.rejectedCount++;
      group.totalAmountUsed += Number(report.amount_used || 0);
    }

    return Array.from(map.values());
  }, [reports]);

  // Toggle single group collapse state (defaults to open if not specified)
  const toggleGroup = (projectId: string | number) => {
    const key = String(projectId);
    setOpenGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isGroupOpen = (projectId: string | number) => {
    const key = String(projectId);
    return openGroups[key] !== false; // Open by default
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const group of groupedReports) {
      next[String(group.projectId)] = true;
    }
    setOpenGroups(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const group of groupedReports) {
      next[String(group.projectId)] = false;
    }
    setOpenGroups(next);
  };

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
        sub: "All progress reports logged",
      },
      {
        key: "pending" as StatFilter,
        label: "Pending Review",
        value: stats?.pending ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Awaiting approval decision",
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
        sub: "Reports verified clean",
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
        <span className="font-mono text-[11px] font-semibold text-primary">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "project_tracking_title",
      header: "Proposal / Project",
      cell: ({ row }: any) => (
        <div className="max-w-[280px]">
          <div className="font-semibold truncate text-xs">
            {row.original.project_tracking_title || "Untitled proposal"}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            Report: {row.original.report_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "report_name",
      header: "Report Title",
      cell: ({ row }: any) => (
        <div className="max-w-[280px]">
          <div className="font-semibold truncate text-xs">
            {row.original.report_name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {row.original.main_activities_achieved || "No activities described"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount_used",
      header: "Amount Used",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs font-semibold">
          {formatAmount(row.original.amount_used)}
        </span>
      ),
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.submitted_at)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const value = (row.original.status || "pending") as keyof typeof statusLabels;
        return (
          <Badge variant="outline" className={cn("px-2 py-0.5 text-[11px] font-medium", statusClasses[value])}>
            {statusLabels[value] || row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: any) => (
        <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 shadow-2xs">
          <Link href={`/research/monitoring/progress-report-approval/${row.original.id}`}>
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Review
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Proposal Progress Reports"
      description="Review progress reports and approve or reject them, organized by proposal."
    >
      <div className="space-y-6">
        {/* KPI Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border shadow-xs bg-card">
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
                      "cursor-pointer border shadow-xs transition-all hover:shadow-md bg-card",
                      stat.border,
                      isActive && cn("ring-2 shadow-md", stat.activeRing),
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={cn("shrink-0 rounded-xl p-3", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      <div>
                        <div className="text-2xl font-black font-mono">{stat.value}</div>
                        <p className="text-xs font-semibold text-muted-foreground">
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

        {/* Toolbar & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-2xs">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search proposal or report title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            {statusFilter !== ALL_VALUE && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(ALL_VALUE)}
                className="h-9 text-xs text-rose-600 hover:text-rose-700"
              >
                Clear Status Filter
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === "grouped" && (
              <div className="flex items-center gap-1.5 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="h-8 text-xs px-2.5"
                >
                  <Maximize2 className="mr-1 h-3 w-3" />
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="h-8 text-xs px-2.5"
                >
                  <Minimize2 className="mr-1 h-3 w-3" />
                  Collapse All
                </Button>
              </div>
            )}

            <div className="flex items-center rounded-lg border bg-muted/30 p-1">
              <Button
                variant={viewMode === "grouped" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grouped")}
                className="h-7 text-xs px-2.5 shadow-2xs"
              >
                <FolderKanban className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Grouped by Proposal
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 text-xs px-2.5 shadow-2xs"
              >
                <LayoutList className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                Flat List View
              </Button>
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border shadow-2xs">
                <CardHeader className="p-4 flex flex-row items-center gap-4">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-1/2 rounded-md" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* View Mode 1: Collapsible Proposal Groups */}
        {!isLoading && viewMode === "grouped" && (
          <div className="space-y-4">
            {groupedReports.length === 0 ? (
              <Card className="border border-dashed p-12 text-center bg-card">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <FolderKanban className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-base">No Proposal Progress Reports Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    No progress reports match your active search or filter criteria.
                  </p>
                </div>
              </Card>
            ) : (
              groupedReports.map((group) => {
                const open = isGroupOpen(group.projectId);
                return (
                  <Card
                    key={group.projectId}
                    className={cn(
                      "shadow-2xs border transition-all duration-200 bg-card overflow-hidden",
                      open ? "ring-1 ring-primary/20 border-primary/30" : "hover:border-muted-foreground/30",
                    )}
                  >
                    {/* Collapsible Proposal Group Header */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleGroup(group.projectId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleGroup(group.projectId);
                        }
                      }}
                      className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-card hover:bg-muted/30 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          {open ? (
                            <ChevronDown className="h-5 w-5 transition-transform" />
                          ) : (
                            <ChevronRight className="h-5 w-5 transition-transform" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-[11px] bg-muted/60">
                              <Hash className="mr-1 h-3 w-3 opacity-60" />
                              Project #{group.projectId}
                            </Badge>
                            <h3 className="font-bold text-base text-foreground truncate">
                              {group.proposalTitle}
                            </h3>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {group.reports.length} {group.reports.length === 1 ? "Progress Report" : "Progress Reports"}
                            </span>
                            <span>•</span>
                            <span className="font-mono font-medium text-foreground/90">
                              Total Expended: {formatAmount(group.totalAmountUsed)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {group.pendingCount > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold px-2.5 py-0.5">
                            <Clock className="mr-1 h-3 w-3" />
                            {group.pendingCount} Pending
                          </Badge>
                        )}
                        {group.approvedCount > 0 && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {group.approvedCount} Approved
                          </Badge>
                        )}
                        {group.rejectedCount > 0 && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold px-2.5 py-0.5">
                            <XCircle className="mr-1 h-3 w-3" />
                            {group.rejectedCount} Rejected
                          </Badge>
                        )}

                        {group.proposalId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hidden sm:flex"
                            title="View Proposal Details"
                          >
                            <Link href={`/research/proposals/my-proposals/${group.proposalId}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Content Body */}
                    {open && (
                      <div>
                        <Separator />
                        <div className="divide-y bg-muted/10">
                          {group.reports.map((report, idx) => {
                            const rStatus = (report.status || "pending") as keyof typeof statusLabels;
                            return (
                              <div
                                key={report.id}
                                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                              >
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-primary">
                                      #{report.id}
                                    </span>
                                    <h4 className="font-bold text-sm text-foreground truncate">
                                      {report.report_name || `Progress Report #${report.id}`}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={cn("px-2 py-0.5 text-[11px] font-medium ml-1", statusClasses[rStatus])}
                                    >
                                      {statusLabels[rStatus] || report.status}
                                    </Badge>
                                  </div>

                                  <p className="text-xs text-foreground/80 line-clamp-2 bg-background p-3 rounded-lg border border-border/40 font-normal">
                                    {report.main_activities_achieved || "No specific activities recorded."}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                                    <div className="flex items-center gap-1 font-mono font-semibold text-foreground">
                                      <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                      {formatAmount(report.amount_used)}
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      Submitted: {formatDate(report.submitted_at)}
                                    </div>
                                    {(report.start_date || report.end_date) && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          Timeline: {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  {report.attachment && (
                                    <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                                      <a
                                        href={resolveFileUrl(report.attachment) ?? "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <Download className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                        Attachment
                                      </a>
                                    </Button>
                                  )}

                                  <Button size="sm" className="h-8 text-xs shadow-2xs gap-1.5 bg-primary hover:bg-primary/90" asChild>
                                    <Link href={`/research/monitoring/progress-report-approval/${report.id}`}>
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      Review & Decide
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* View Mode 2: Flat List Table View */}
        {!isLoading && viewMode === "table" && (
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
        )}
      </div>
    </PageContainer>
  );
}
