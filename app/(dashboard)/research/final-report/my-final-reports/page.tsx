"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  Search,
  Send,
  RotateCcw,
  Building,
  Check,
  FilePlus2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { DataTable, DataTableViewOptions } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useTerminalReports,
  useEligibleForTerminalReport,
} from "@/hooks/useProgressReports";
import { TerminalReportSummary } from "@/api/services/progress-reports.service";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

const ALL_VALUE = "all";
type StatFilter = "ready_for_report" | "all" | "draft" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
  revision_requested: {
    label: "Revision Requested",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: RotateCcw,
  },
  pending: {
    label: "Pending Review",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Clock,
  },
};

interface ReportRow {
  id: number;
  proposalId: number | null;
  projectTrackingId: number | null;
  referenceNumber: string;
  proposalTitle: string;
  submittedByName: string | null;
  dataCenterName: string;
  items: any[];
  status: string;
  submittedAt: string;
}

interface EligibleRow {
  id: number;
  referenceNumber: string;
  proposalTitle: string;
  piName: string | null;
  status: string;
}

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

function getStatusBadge(status?: string) {
  const key = status?.toLowerCase() || "pending";
  const cfg = STATUS_CONFIG[key] || {
    label: status?.replace(/_/g, " ") || "Pending",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <Badge
      className={cn(
        "text-[11px] font-bold uppercase gap-1 px-2.5 py-0.5 shadow-none border",
        cfg.className
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function ReferenceCell({ refNum }: { refNum: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!refNum || refNum === "—") return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!refNum || refNum === "—") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 transition-colors max-w-fit">
      <span className="font-mono text-xs font-semibold text-foreground truncate">
        {refNum}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleCopy}
        title="Copy reference number"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

export default function MyFinalReportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);

  const debouncedSearch = useDebounce(search, 350);

  // Fetch logged in user's submitted final reports
  const { data: response, isLoading: isLoadingSubmitted } = useTerminalReports({
    page: 1,
    limit: 100,
    scope: "my",
    search: debouncedSearch.trim() || undefined,
    status:
      statusFilter !== ALL_VALUE && statusFilter !== "ready_for_report"
        ? statusFilter
        : undefined,
  });

  // Fetch proposals eligible / ready for final report
  const { data: eligibleProjects = [], isLoading: isLoadingEligible } =
    useEligibleForTerminalReport({ scope: "my" });

  const rawReports: TerminalReportSummary[] = useMemo(() => {
    return response?.data || [];
  }, [response]);

  const rows: ReportRow[] = useMemo(() => {
    return rawReports.map((r) => {
      const pt = r.project_tracking || {};
      const ptId = r.project_tracking_id || pt.project_tracking_id || r.id;
      const propId = r.proposal_id || pt.proposal_id || pt.proposalId || null;
      const refNum =
        r.reference_number ||
        pt.reference_number ||
        pt.referenceNumber ||
        (propId ? `PROP-${propId}` : `PT-${ptId}`);
      const title =
        r.project_tracking_title ||
        pt.title ||
        r.report_name ||
        `Final Report #${r.id}`;
      const dataCenter =
        r.data_center_name || r.custom_data_center || "Standard Repository";

      return {
        id: r.id,
        proposalId: propId,
        projectTrackingId: ptId,
        referenceNumber: refNum,
        proposalTitle: title,
        submittedByName: r.submitted_by_name || null,
        dataCenterName: dataCenter,
        items: r.items || [],
        status: r.status || r.general_status || "pending",
        submittedAt: r.submitted_at || "",
      };
    });
  }, [rawReports]);

  // Normalized list of eligible proposals ready for final report (excluding already submitted ones)
  const eligibleRows: EligibleRow[] = useMemo(() => {
    const submittedTrackingIds = new Set<number>();
    rawReports.forEach((r) => {
      const pt = r.project_tracking || {};
      const ptId = r.project_tracking_id || pt.project_tracking_id || r.id;
      const propId = r.proposal_id || pt.proposal_id || pt.proposalId;
      if (ptId) submittedTrackingIds.add(Number(ptId));
      if (propId) submittedTrackingIds.add(Number(propId));
    });

    return (eligibleProjects || [])
      .filter((p: any) => {
        const ptId = p.id || p.project_tracking_id;
        const propId = p.proposal_id || p.proposal?.id || p.proposalId;
        if (ptId && submittedTrackingIds.has(Number(ptId))) return false;
        if (propId && submittedTrackingIds.has(Number(propId))) return false;
        return true;
      })
      .map((p: any) => {
        const ptId = p.id || p.project_tracking_id;
        const prop = p.proposal || {};
        const refNum =
          p.reference_number ||
          p.referenceNumber ||
          prop.reference_number ||
          prop.referenceNumber ||
          `PT-${ptId}`;
        const title =
          p.proposalTitle ||
          p.proposal_title ||
          prop.title ||
          p.title ||
          `Project #${ptId}`;
        const piName =
          prop.principal_investigator_name ||
          p.principal_investigator_name ||
          null;

        return {
          id: ptId,
          referenceNumber: refNum,
          proposalTitle: title,
          piName: piName,
          status: "ready_for_report",
        };
      });
  }, [eligibleProjects, rawReports]);

  const filteredEligibleRows = useMemo(() => {
    if (!debouncedSearch.trim()) return eligibleRows;
    const q = debouncedSearch.toLowerCase().trim();
    return eligibleRows.filter(
      (r) =>
        r.proposalTitle.toLowerCase().includes(q) ||
        r.referenceNumber.toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [eligibleRows, debouncedSearch]);

  const meta = response?.meta;
  const statsFromMeta = meta?.statistics;

  const stats = useMemo(() => {
    if (statsFromMeta) {
      return {
        total: statsFromMeta.total ?? 0,
        draft: statsFromMeta.draft ?? 0,
        pending: statsFromMeta.pending ?? 0,
        approved: statsFromMeta.approved ?? 0,
        rejected: statsFromMeta.rejected ?? 0,
      };
    }
    const total = rawReports.length;
    const draft = rawReports.filter((r) => r.status === "draft").length;
    const pending = rawReports.filter((r) => r.status === "pending").length;
    const approved = rawReports.filter((r) => r.status === "approved").length;
    const rejected = rawReports.filter((r) => r.status === "rejected").length;
    return { total, draft, pending, approved, rejected };
  }, [rawReports, statsFromMeta]);

  // Columns for Submitted Reports
  const submittedColumns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Reference",
        enableHiding: true,
        meta: { defaultHidden: true },
        cell: ({ row }) => <ReferenceCell refNum={row.original.referenceNumber} />,
      },
      {
        accessorKey: "proposalTitle",
        header: "Proposal Title",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-1 min-w-[260px] max-w-[420px]">
              <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                {item.proposalTitle}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "projectTrackingId",
        header: "Tracking ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            #{row.original.projectTrackingId || row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "dataCenterName",
        header: "Data Center",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Building className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[140px]">{row.original.dataCenterName}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted Date",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">
            {formatDate(row.original.submittedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isDraft = item.status.toLowerCase() === "draft";
          const isRejected =
            item.status.toLowerCase() === "rejected" ||
            item.status.toLowerCase() === "revision_requested";

          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Link href={`/research/final-report/new?resubmit_id=${item.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-semibold gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isDraft ? "Resume Draft" : isRejected ? "Resubmit" : "Edit / Update"}
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  // Columns for Proposals Ready for Final Report
  const eligibleColumns = useMemo<ColumnDef<EligibleRow>[]>(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Reference",
        enableHiding: true,
        meta: { defaultHidden: true },
        cell: ({ row }) => <ReferenceCell refNum={row.original.referenceNumber} />,
      },
      {
        accessorKey: "proposalTitle",
        header: "Proposal Title",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-[260px] max-w-[420px]">
            <span className="font-bold text-xs text-foreground leading-snug line-clamp-2">
              {row.original.proposalTitle}
            </span>
            {row.original.piName && (
              <span className="text-[11px] text-muted-foreground">
                PI: {row.original.piName}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "id",
        header: "Tracking ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: () => (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-bold uppercase gap-1 px-2.5 py-0.5 shadow-none border">
            Ready for Final Report
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <Link href={`/research/final-report/new?tracking_id=${row.original.id}`}>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 h-8 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Final Report
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const activeFilterCount = [
    debouncedSearch.trim(),
    statusFilter !== ALL_VALUE,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter(ALL_VALUE);
  }, []);

  const renderToolbar = useCallback(
    (table: any) => (
      <div className="p-4 border-b bg-card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                statusFilter === "ready_for_report"
                  ? "Search ready proposals by title, reference #, tracking ID..."
                  : "Search by title, reference #, tracking ID..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 font-medium rounded-xl bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold px-1"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </Button>
            )}
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </div>
    ),
    [search, activeFilterCount, clearFilters, statusFilter]
  );

  const statCards = [
    {
      key: "ready_for_report" as StatFilter,
      label: "Ready for Final Report",
      value: eligibleRows.length,
      sub: "Proposals Eligible for Submission",
      icon: FilePlus2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      border: "border-emerald-200 dark:border-emerald-800",
      activeRing: "ring-emerald-500/60 border-emerald-300",
      badge: "Action Available",
    },
    {
      key: ALL_VALUE as StatFilter,
      label: "All Final Reports",
      value: stats.total,
      sub: "Submitted Final Reports",
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      activeRing: "ring-primary/50 border-primary/40",
    },
    {
      key: "draft" as StatFilter,
      label: "Drafts",
      value: stats.draft,
      sub: "Saved Report Progress",
      icon: Clock,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-900/50",
      border: "border-slate-200 dark:border-slate-800",
      activeRing: "ring-slate-500/60 border-slate-300",
    },
    {
      key: "pending" as StatFilter,
      label: "Pending Review",
      value: stats.pending,
      sub: "Under Committee Evaluation",
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      border: "border-blue-200 dark:border-blue-800",
      activeRing: "ring-blue-500/60 border-blue-300",
    },
    {
      key: "approved" as StatFilter,
      label: "Approved & Completed",
      value: stats.approved,
      sub: "Cleared Final Research Reports",
      icon: CheckCircle2,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/50",
      border: "border-teal-200 dark:border-teal-800",
      activeRing: "ring-teal-500/60 border-teal-300",
    },
    {
      key: "rejected" as StatFilter,
      label: "Requires Revision",
      value: stats.rejected,
      sub: "Requires Modifications",
      icon: XCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      border: "border-amber-200 dark:border-amber-800",
      activeRing: "ring-amber-500/60 border-amber-300",
    },
  ];

  const isLoading =
    statusFilter === "ready_for_report" ? isLoadingEligible : isLoadingSubmitted;

  return (
    <PageContainer
      title="My Final Reports"
      description="Monitor your submitted final research reports, review grading feedback, or submit a final report for eligible proposals."
      actions={
        <Link href="/research/final-report/new">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 h-9 shadow-xs">
            <Send className="w-4 h-4" />
            Submit Final Report
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 w-full">
        {/* Stat Cards Grid - 6 Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {isLoadingSubmitted && isLoadingEligible
            ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="mt-1 h-3 w-20" />
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
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === stat.key ? ALL_VALUE : stat.key
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setStatusFilter((current) =>
                        current === stat.key ? ALL_VALUE : stat.key
                      );
                    }
                  }}
                  className={cn(
                    "cursor-pointer border shadow-xs transition-all hover:shadow-md relative overflow-hidden",
                    stat.border,
                    isActive && cn("ring-2 shadow-md", stat.activeRing)
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground truncate" title={stat.label}>
                      {stat.label}
                    </CardTitle>
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shrink-0", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      {stat.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          {stat.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground truncate" title={stat.sub}>
                      {stat.sub}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Data Table with Conditional Views based on Stat Card Selection */}
        {statusFilter === "ready_for_report" ? (
          <DataTable
            columns={eligibleColumns}
            data={filteredEligibleRows}
            isLoading={isLoadingEligible}
            toolbar={renderToolbar}
            initialColumnVisibility={{ referenceNumber: false }}
            onRowClick={(row) =>
              router.push(`/research/final-report/new?tracking_id=${row.id}`)
            }
          />
        ) : (
          <DataTable
            columns={submittedColumns}
            data={rows}
            isLoading={isLoadingSubmitted}
            toolbar={renderToolbar}
            initialColumnVisibility={{ referenceNumber: false }}
            onRowClick={(row) =>
              router.push(`/research/final-report/my-final-reports/${row.id}`)
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
