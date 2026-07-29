"use client";

import React, { Fragment, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  Search,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronsUpDown,
  ChevronsDownUp,
  ShieldCheck,
  Paperclip,
  Eye,
  Calendar,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProgressReportApprovals } from "@/hooks";
import { GroupedProgressReportProposal } from "@/api/services/progress-reports.service";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const statusClasses = {
  on_progress: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  terminated: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
} as const;

type StatFilter = "all" | "pending" | "on_progress" | "approved" | "rejected";
const ALL_VALUE = "all";

interface ColumnVisibility {
  referenceNumber: boolean;
  projectTrackingId: boolean;
  title: boolean;
  pi: boolean;
  status: boolean;
  totalReports: boolean;
  pending: boolean;
  approved: boolean;
  rejected: boolean;
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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "ETB 0.00";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `ETB ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function ReferenceCell({ refNum }: { refNum: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!refNum || refNum === "-") return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!refNum || refNum === "-") {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 transition-colors max-w-fit">
      <span className="font-mono text-xs font-bold text-primary truncate">
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

function TrackingIdCell({ id }: { id: string | number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!id) return;
    const valueToCopy = String(id).replace(/^#/, "");
    navigator.clipboard.writeText(valueToCopy);
    setCopied(true);
    toast.success("Tracking ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!id) return <span className="text-xs text-muted-foreground">-</span>;

  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 transition-colors max-w-fit">
      <span className="font-mono text-xs font-bold text-primary truncate">
        #{id}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-3.5 w-3.5 p-0 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleCopy}
        title="Copy tracking ID"
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

function PICell({ pi, fallbackName }: { pi: any; fallbackName?: string }) {
  const target = pi || (fallbackName ? { fullName: fallbackName } : null);
  if (!target) return <span className="text-xs text-muted-foreground">-</span>;

  const name =
    typeof target === "string"
      ? target
      : target.fullName || target.full_name || target.name || target.email || fallbackName || "PI";
  const email = typeof target === "object" ? target.email : null;
  const rawPhoto =
    typeof target === "object"
      ? target.photo || target.photo_url || target.photoUrl || target.avatarUrl
      : null;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PI";

  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <Avatar className="h-8 w-8 border border-border/60 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-foreground truncate">{name}</span>
        {email && <span className="text-[10px] text-muted-foreground truncate">{email}</span>}
      </div>
    </div>
  );
}

export default function ProgressReportApprovalListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Column visibility state (referenceNumber disabled by default like research/monitoring/progress-report)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    referenceNumber: false,
    projectTrackingId: true,
    title: true,
    pi: true,
    status: true,
    totalReports: true,
    pending: true,
    approved: true,
    rejected: true,
  });

  const router = useRouter();

  const { data: response, isLoading } = useProgressReportApprovals({
    page: 1,
    limit: 100,
    search: search || undefined,
  });

  const proposals: GroupedProgressReportProposal[] = useMemo(() => {
    return response?.data || [];
  }, [response]);

  const stats = useMemo(() => {
    if (response?.meta?.statistics) {
      return {
        total: response.meta.statistics.total || 0,
        pending: response.meta.statistics.pending || 0,
        approved: response.meta.statistics.approved || 0,
        rejected: response.meta.statistics.rejected || 0,
      };
    }
    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    proposals.forEach((p) => {
      total += p.statistics.totalReports || 0;
      pending += p.statistics.pending || 0;
      approved += p.statistics.approved || 0;
      rejected += p.statistics.rejected || 0;
    });
    return { total, pending, approved, rejected };
  }, [response, proposals]);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Proposals",
        value: proposals.length,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: `${stats.total} progress reports`,
      },
      {
        key: "pending" as StatFilter,
        label: "Pending Review",
        value: stats.pending,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Requires staff evaluation",
      },
      {
        key: "on_progress" as StatFilter,
        label: "Active Proposals",
        value: proposals.filter((p) => p.status?.toLowerCase() === "on_progress").length,
        icon: ShieldCheck,
        color: "text-sky-600",
        bg: "bg-sky-50 dark:bg-sky-950/30",
        border: "border-sky-200 dark:border-sky-800",
        activeRing: "ring-sky-500/60 border-sky-300",
        sub: "Monitored active projects",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved Reports",
        value: stats.approved,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Verified & approved",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected / Hold",
        value: stats.rejected,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-800",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Returned for revision",
      },
    ],
    [proposals, stats],
  );

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const q = search.toLowerCase().trim();
      if (!q) {
        if (statusFilter === "pending") return p.statistics.pending > 0;
        if (statusFilter === "approved") return p.statistics.approved > 0;
        if (statusFilter === "rejected") return p.statistics.rejected > 0;
        if (statusFilter === "on_progress") return p.status?.toLowerCase() === "on_progress";
        return true;
      }

      const cleanQ = q.replace(/^(ref-|pt-|#)/i, "");
      const refStr = (p.referenceNumber || "").toLowerCase();
      const piName = typeof p.pi === "string" ? p.pi.toLowerCase() : (p.pi?.fullName || p.pi?.name || p.pi?.email || "").toLowerCase();
      const ptIdStr = String(p.projectTrackingId || "");
      const propIdStr = String(p.proposalId || "");

      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        refStr.includes(q) ||
        (cleanQ && refStr.includes(cleanQ)) ||
        piName.includes(q) ||
        (ptIdStr && ptIdStr !== "0" && (
          ptIdStr.includes(q) ||
          (cleanQ && ptIdStr.includes(cleanQ)) ||
          `#${ptIdStr}`.toLowerCase().includes(q) ||
          `pt-${ptIdStr}`.toLowerCase().includes(q)
        )) ||
        (propIdStr && propIdStr !== "0" && (
          propIdStr.includes(q) ||
          (cleanQ && propIdStr.includes(cleanQ))
        )) ||
        p.reports.some(
          (r) =>
            r.reportName.toLowerCase().includes(q) ||
            r.mainActivitiesAchieved.toLowerCase().includes(q),
        );

      if (!matchesSearch) return false;

      if (statusFilter === "pending") return p.statistics.pending > 0;
      if (statusFilter === "approved") return p.statistics.approved > 0;
      if (statusFilter === "rejected") return p.statistics.rejected > 0;
      if (statusFilter === "on_progress") return p.status?.toLowerCase() === "on_progress";
      return true;
    });
  }, [proposals, search, statusFilter]);

  const toggleRowExpanded = (targetId: string) => {
    setExpandedRows((prev) => {
      // Single-expand (Accordion mode): collapse other proposals when expanding a new row
      if (prev[targetId]) {
        return {};
      }
      return { [targetId]: true };
    });
  };

  const allRowIds = useMemo(
    () => filteredProposals.map((p) => String(p.projectTrackingId || p.proposalId || 0)),
    [filteredProposals],
  );

  const areAllExpanded = useMemo(
    () => allRowIds.length > 0 && allRowIds.every((id) => expandedRows[id]),
    [allRowIds, expandedRows],
  );

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      setExpandedRows({});
    } else {
      const newExpanded: Record<string, boolean> = {};
      allRowIds.forEach((id) => {
        newExpanded[id] = true;
      });
      setExpandedRows(newExpanded);
    }
  };

  const visibleColumnCount = useMemo(() => {
    let count = 2; // Expand trigger + Actions column
    if (columnVisibility.referenceNumber) count++;
    if (columnVisibility.projectTrackingId) count++;
    if (columnVisibility.title) count++;
    if (columnVisibility.pi) count++;
    if (columnVisibility.status) count++;
    if (columnVisibility.totalReports) count++;
    if (columnVisibility.pending) count++;
    if (columnVisibility.approved) count++;
    if (columnVisibility.rejected) count++;
    return count;
  }, [columnVisibility]);

  return (
    <PageContainer
      title="Progress Report Approvals"
      description="Track and evaluate milestone progress reports submitted for active research projects."
    >
      <div className="space-y-6 w-full">
        {/* ── Stat Cards Grid (Mirrored from Project Tracking List View) ───────── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
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
                    "cursor-pointer border shadow-xs transition-all hover:shadow-md",
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

        {/* ── Search & Filter Controls (Includes Columns Toggle Dropdown) ──── */}
        <Card className="border border-muted-foreground/15 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search project title, ref #, PI, or tracking ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {statusFilter !== ALL_VALUE && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(ALL_VALUE)}
                  className="h-9 text-xs font-semibold rounded-xl"
                >
                  Clear filter
                </Button>
              )}

              {filteredProposals.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpandAll}
                  className="h-9 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs"
                >
                  {areAllExpanded ? (
                    <>
                      <ChevronsDownUp className="h-3.5 w-3.5" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                      Expand All
                    </>
                  )}
                </Button>
              )}

              {/* Columns Visibility Dropdown (Mirrored from DataTable / Settings2) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs"
                  >
                    <Settings2 className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs font-bold">Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.referenceNumber}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, referenceNumber: val }))
                    }
                    className="text-xs"
                  >
                    Reference Number
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.projectTrackingId}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, projectTrackingId: val }))
                    }
                    className="text-xs"
                  >
                    Tracking ID
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.title}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, title: val }))
                    }
                    className="text-xs"
                  >
                    Proposal Title
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.pi}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, pi: val }))
                    }
                    className="text-xs"
                  >
                    Principal Investigator
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.status}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, status: val }))
                    }
                    className="text-xs"
                  >
                    Proposal Status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.totalReports}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, totalReports: val }))
                    }
                    className="text-xs"
                  >
                    Total Reports
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.pending}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, pending: val }))
                    }
                    className="text-xs"
                  >
                    Pending Reports
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.approved}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, approved: val }))
                    }
                    className="text-xs"
                  >
                    Approved Reports
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.rejected}
                    onCheckedChange={(val) =>
                      setColumnVisibility((prev) => ({ ...prev, rejected: val }))
                    }
                    className="text-xs"
                  >
                    Rejected Reports
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* ── Main Responsive Collapsible DataTable ─────────────────────────── */}
        <Card className="border border-muted-foreground/15 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="w-10 text-center"></TableHead>
                  {columnVisibility.referenceNumber && (
                    <TableHead className="font-bold text-xs">Reference</TableHead>
                  )}
                  {columnVisibility.projectTrackingId && (
                    <TableHead className="font-bold text-xs">Tracking ID</TableHead>
                  )}
                  {columnVisibility.title && (
                    <TableHead className="font-bold text-xs">Proposal Title</TableHead>
                  )}
                  {columnVisibility.pi && (
                    <TableHead className="font-bold text-xs">Principal Investigator</TableHead>
                  )}
                  {columnVisibility.status && (
                    <TableHead className="font-bold text-xs text-center">Status</TableHead>
                  )}
                  {columnVisibility.totalReports && (
                    <TableHead className="font-bold text-xs text-center">Reports Count</TableHead>
                  )}
                  {columnVisibility.pending && (
                    <TableHead className="font-bold text-xs text-center">Pending</TableHead>
                  )}
                  {columnVisibility.approved && (
                    <TableHead className="font-bold text-xs text-center">Approved</TableHead>
                  )}
                  {columnVisibility.rejected && (
                    <TableHead className="font-bold text-xs text-center">Rejected</TableHead>
                  )}
                  <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={visibleColumnCount} className="p-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-44 text-center">
                      <div className="space-y-2">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">No progress report proposals found</p>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search query or status filter.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProposals.map((proposal) => {
                    const targetId = String(proposal.projectTrackingId || proposal.proposalId || 0);
                    const isExpanded = !!expandedRows[targetId];
                    const statusKey = proposal.status?.toLowerCase() || "on_progress";

                    return (
                      <Fragment key={targetId}>
                        {/* Parent Proposal Row */}
                        <TableRow
                          onClick={() => toggleRowExpanded(targetId)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/30",
                            isExpanded && "bg-slate-50/80 dark:bg-slate-900/40 font-semibold",
                          )}
                        >
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isExpanded && "rotate-180 text-primary",
                                )}
                              />
                            </Button>
                          </TableCell>

                          {columnVisibility.referenceNumber && (
                            <TableCell>
                              <ReferenceCell
                                refNum={proposal.referenceNumber || `PT-${proposal.projectTrackingId}`}
                              />
                            </TableCell>
                          )}

                          {columnVisibility.projectTrackingId && (
                            <TableCell>
                              <TrackingIdCell id={proposal.projectTrackingId} />
                            </TableCell>
                          )}

                          {columnVisibility.title && (
                            <TableCell>
                              <div className="max-w-[300px]">
                                <div className="font-semibold text-xs leading-snug truncate text-foreground">
                                  {proposal.title}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  {proposal.referenceNumber || (proposal.proposalId ? `Proposal #${proposal.proposalId}` : `PT-${proposal.projectTrackingId}`)}
                                </div>
                              </div>
                            </TableCell>
                          )}

                          {columnVisibility.pi && (
                            <TableCell>
                              <PICell
                                pi={proposal.pi}
                                fallbackName={
                                  (proposal as any).piName ||
                                  (proposal as any).principalInvestigator ||
                                  (proposal as any).created_by
                                }
                              />
                            </TableCell>
                          )}

                          {columnVisibility.status && (
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] font-bold uppercase", statusClasses[statusKey as keyof typeof statusClasses] || statusClasses.on_progress)}
                              >
                                {proposal.status?.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                          )}

                          {columnVisibility.totalReports && (
                            <TableCell className="text-center font-bold text-xs">
                              {proposal.statistics.totalReports}
                            </TableCell>
                          )}

                          {columnVisibility.pending && (
                            <TableCell className="text-center">
                              {proposal.statistics.pending > 0 ? (
                                <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                                  {proposal.statistics.pending} Pending
                                </Badge>
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">0</span>
                              )}
                            </TableCell>
                          )}

                          {columnVisibility.approved && (
                            <TableCell className="text-center font-bold text-xs text-emerald-600">
                              {proposal.statistics.approved}
                            </TableCell>
                          )}

                          {columnVisibility.rejected && (
                            <TableCell className="text-center font-bold text-xs text-rose-600">
                              {proposal.statistics.rejected}
                            </TableCell>
                          )}

                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" asChild className="h-8 text-xs shadow-2xs">
                              <Link href={`/research/monitoring/progress-report-approval/${targetId}`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                Evaluate
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Nested Sub-Table Row with Smooth Animation */}
                        <TableRow
                          className={cn(
                            "border-b-0 transition-colors",
                            !isExpanded && "hidden border-b-0",
                          )}
                        >
                          <TableCell colSpan={visibleColumnCount} className="p-0 border-b-0">
                            <div
                              className={cn(
                                "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                                isExpanded
                                  ? "grid-rows-[1fr] opacity-100"
                                  : "grid-rows-[0fr] opacity-0 overflow-hidden",
                              )}
                            >
                              <div className="overflow-hidden">
                                <div className="p-4 sm:p-5">
                                  <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Submitted Progress Reports for &ldquo;{proposal.title}&rdquo; ({proposal.reports.length})
                                      </p>
                                      <Button size="sm" variant="secondary" asChild className="h-7 text-xs shadow-2xs">
                                        <Link href={`/research/monitoring/progress-report-approval/${targetId}`}>
                                          Evaluate All Reports
                                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                        </Link>
                                      </Button>
                                    </div>

                                    <div className="overflow-x-auto w-full">
                                      {(() => {
                                        const sortedAscendingReports = [...proposal.reports].sort((a, b) => {
                                          const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                                          const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                                          if (timeA !== timeB) return timeA - timeB;
                                          return Number(a.id) - Number(b.id);
                                        });

                                        const chronologicalMap = new Map<number, number>();
                                        sortedAscendingReports.forEach((r, index) => {
                                          chronologicalMap.set(r.id, index + 1);
                                        });

                                        const displayedReports = [...proposal.reports].sort((a, b) => {
                                          const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                                          const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                                          if (timeA !== timeB) return timeB - timeA;
                                          return Number(b.id) - Number(a.id);
                                        });

                                        return (
                                          <Table className="border rounded-xl w-full">
                                            <TableHeader className="bg-muted/50">
                                              <TableRow>
                                                <TableHead className="font-bold text-[11px]">Report</TableHead>
                                                <TableHead className="font-bold text-[11px]">Submitted By</TableHead>
                                                <TableHead className="font-bold text-[11px]">Reporting Period</TableHead>
                                                <TableHead className="font-bold text-[11px]">Amount Used</TableHead>
                                                <TableHead className="font-bold text-[11px]">Submitted Date</TableHead>
                                                <TableHead className="font-bold text-[11px] text-center">Status</TableHead>
                                                <TableHead className="font-bold text-[11px] text-right">Actions</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {displayedReports.map((report, idx) => {
                                                const reportSeqNum = chronologicalMap.get(report.id) ?? (proposal.reports.length - idx);

                                                return (
                                                  <TableRow key={report.id} className="hover:bg-muted/30">
                                                    <TableCell>
                                                      <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold font-mono text-muted-foreground">
                                                          Report #{reportSeqNum}
                                                        </span>
                                                        {reportSeqNum === proposal.reports.length && proposal.reports.length > 1 && (
                                                          <Badge variant="outline" className="text-[9px] font-bold py-0 px-1.5 text-primary border-primary/30 bg-primary/5">
                                                            Latest
                                                          </Badge>
                                                        )}
                                                        <span className="text-xs font-bold text-foreground">
                                                          {report.reportName}
                                                        </span>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell>
                                                      <PICell
                                                        pi={report.submittedBy || proposal.pi}
                                                        fallbackName={
                                                          (proposal as any).piName ||
                                                          (proposal as any).principalInvestigator
                                                        }
                                                      />
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                                      {formatDate(report.startDate)} – {formatDate(report.endDate)}
                                                    </TableCell>

                                                    <TableCell className="font-mono text-xs font-semibold text-primary whitespace-nowrap">
                                                      {formatAmount(report.amountUsed)}
                                                    </TableCell>

                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                      {formatDateTime(report.submittedAt)}
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                      <Badge
                                                        variant="outline"
                                                        className={cn(
                                                          "text-[10px] font-bold uppercase",
                                                          statusClasses[report.status as keyof typeof statusClasses] || statusClasses.pending,
                                                        )}
                                                      >
                                                        {report.status}
                                                      </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                      <Button size="sm" variant="secondary" asChild className="h-7 text-xs shadow-2xs">
                                                        <Link href={`/research/monitoring/progress-report-approval/${targetId}`}>
                                                          Evaluate
                                                        </Link>
                                                      </Button>
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              })}
                                            </TableBody>
                                          </Table>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
