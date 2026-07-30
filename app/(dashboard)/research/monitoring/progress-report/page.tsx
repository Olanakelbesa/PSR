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
  PlayCircle,
  Search,
  PlusCircle,
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
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import {
  useProgressReportApprovals,
  useReadyForTracking,
  useCreateProjectTracking,
} from "@/hooks";
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

type StatFilter = "all" | "pending" | "on_progress" | "approved" | "rejected" | "ready_for_tracking";
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
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
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

export default function ProgressReportListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReadyDialogOpen, setIsReadyDialogOpen] = useState(false);
  const [readySearchQuery, setReadySearchQuery] = useState("");
  const [formValues, setFormValues] = useState({ proposal: "" });

  // Document Preview Viewer state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

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

  const { data: readyProjects } = useReadyForTracking({ scope: "my" });
  const createMutation = useCreateProjectTracking();

  const { data: response, isLoading } = useProgressReportApprovals({
    page: 1,
    limit: 100,
    scope: "my",
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
      total += p.statistics?.totalReports || 0;
      pending += p.statistics?.pending || 0;
      approved += p.statistics?.approved || 0;
      rejected += p.statistics?.rejected || 0;
    });
    return { total, pending, approved, rejected };
  }, [response, proposals]);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    if (filter === "ready_for_tracking") {
      setIsReadyDialogOpen(true);
      return;
    }
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const handlePreviewDocument = (fileUrl: string, title?: string) => {
    if (!fileUrl) return;
    const resolved = resolveFileUrl(fileUrl);
    setPreviewUrl(resolved);
    setPreviewTitle(title || "Progress Report Document");
    setPreviewOpen(true);
  };

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Projects",
        value: proposals.length,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: `${stats.total} total reports`,
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
        sub: "Reports in evaluation",
      },
      {
        key: "on_progress" as StatFilter,
        label: "Active Projects",
        value: proposals.filter((p) => p.status?.toLowerCase() === "on_progress").length,
        icon: ShieldCheck,
        color: "text-sky-600",
        bg: "bg-sky-50 dark:bg-sky-950/30",
        border: "border-sky-200 dark:border-sky-800",
        activeRing: "ring-sky-500/60 border-sky-300",
        sub: "Ongoing tracking",
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
        sub: "Verified milestones",
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
        sub: "Requires revisions",
      },
    ],
    [proposals, stats],
  );

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const q = search.toLowerCase().trim();
      if (!q) {
        if (statusFilter === "pending") return p.statistics?.pending > 0;
        if (statusFilter === "approved") return p.statistics?.approved > 0;
        if (statusFilter === "rejected") return p.statistics?.rejected > 0;
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

      if (statusFilter === "pending") return p.statistics?.pending > 0;
      if (statusFilter === "approved") return p.statistics?.approved > 0;
      if (statusFilter === "rejected") return p.statistics?.rejected > 0;
      if (statusFilter === "on_progress") return p.status?.toLowerCase() === "on_progress";
      return true;
    });
  }, [proposals, search, statusFilter]);

  const toggleRowExpanded = (targetId: string) => {
    setExpandedRows((prev) => {
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
    let count = 2;
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

  const readyForTrackingCount = readyProjects?.data?.length || 0;

  const filteredReadyProjects = useMemo(() => {
    if (!readyProjects?.data) return [];
    if (!readySearchQuery.trim()) return readyProjects.data;
    const query = readySearchQuery.toLowerCase();
    return readyProjects.data.filter(
      (item: any) =>
        item.title?.toLowerCase().includes(query) ||
        item.referenceNumber?.toLowerCase().includes(query) ||
        item.pi?.fullName?.toLowerCase().includes(query),
    );
  }, [readyProjects, readySearchQuery]);

  const handleSubmitTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.proposal) {
      toast.error("Please select an approved proposal to initiate tracking.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        proposal: Number(formValues.proposal),
      });
      toast.success("Project tracking record initialized successfully!");
      setIsDialogOpen(false);
      setFormValues({ proposal: "" });
    } catch {
      toast.error("Failed to initialize project tracking.");
    }
  };

  return (
    <PageContainer
      title="Progress Reports"
      description="Track milestones, view progress logs, and log project expenditures for active research projects."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReadyDialogOpen(true)}
            className="relative font-bold text-xs gap-1.5 h-9"
          >
            <PlayCircle className="h-4 w-4 text-emerald-600" />
            <span>Ready for Tracking</span>
            {readyForTrackingCount > 0 && (
              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 rounded-full font-extrabold ml-1">
                {readyForTrackingCount}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="font-bold text-xs gap-1.5 h-9 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Initiate Tracking
          </Button>
        </div>
      }
    >
      <div className="space-y-6 w-full">
        {/* ── Stat Cards Grid ───────────────────────────────────────── */}
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

        {/* ── Search & Filter Controls ─────────────────────────────────── */}
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

              {/* Columns Visibility Dropdown */}
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

        {/* ── Expandable Progress Reports Table ───────────────────────────── */}
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
                        <p className="text-sm font-semibold">No progress reports found</p>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search query or status filter.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProposals.map((proposal) => {
                    const rowKey = String(proposal.projectTrackingId || proposal.proposalId || proposal.title);
                    const isExpanded = !!expandedRows[rowKey];
                    const refNum = proposal.referenceNumber || "-";
                    const statusKey = (proposal.status || "on_progress").toLowerCase();
                    const statusStyle = statusClasses[statusKey as keyof typeof statusClasses] || statusClasses.on_progress;
                    const reportCount = proposal.statistics?.totalReports || proposal.reports.length;
                    const targetDetailId = proposal.projectTrackingId || proposal.proposalId;

                    // Chronological ordering map (1 = initial report, N = latest report)
                    const sortedAscendingReports = [...proposal.reports].sort((a, b) => {
                      const timeA = new Date(a.submittedAt || a.submitted_at || 0).getTime();
                      const timeB = new Date(b.submittedAt || b.submitted_at || 0).getTime();
                      if (timeA !== timeB) return timeA - timeB;
                      return (a.id || 0) - (b.id || 0);
                    });

                    const chronologicalMap = new Map<number, number>();
                    sortedAscendingReports.forEach((r, index) => {
                      chronologicalMap.set(r.id, index + 1);
                    });

                    return (
                      <Fragment key={rowKey}>
                        {/* Parent Proposal Row */}
                        <TableRow
                          onClick={() => toggleRowExpanded(rowKey)}
                          className={cn(
                            "cursor-pointer transition-colors group border-b",
                            isExpanded ? "bg-slate-50/90 dark:bg-slate-900/60" : "hover:bg-muted/40",
                          )}
                        >
                          <TableCell className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground group-hover:text-foreground"
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
                            <TableCell className="p-3">
                              <ReferenceCell refNum={refNum} />
                            </TableCell>
                          )}

                          {columnVisibility.projectTrackingId && (
                            <TableCell className="p-3">
                              <TrackingIdCell id={proposal.projectTrackingId} />
                            </TableCell>
                          )}

                          {columnVisibility.title && (
                            <TableCell className="p-3 max-w-[280px]">
                              <span className="font-bold text-xs leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                {proposal.title}
                              </span>
                            </TableCell>
                          )}

                          {columnVisibility.pi && (
                            <TableCell className="p-3">
                              <PICell pi={proposal.pi} />
                            </TableCell>
                          )}

                          {columnVisibility.status && (
                            <TableCell className="p-3 text-center">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] font-bold uppercase tracking-wider shadow-none py-0.5", statusStyle)}
                              >
                                {statusKey.replace("_", " ")}
                              </Badge>
                            </TableCell>
                          )}

                          {columnVisibility.totalReports && (
                            <TableCell className="p-3 text-center">
                              <Badge variant="secondary" className="font-mono font-bold text-xs">
                                {reportCount} Reports
                              </Badge>
                            </TableCell>
                          )}

                          {columnVisibility.pending && (
                            <TableCell className="p-3 text-center">
                              {proposal.statistics?.pending > 0 ? (
                                <Badge className="bg-amber-500 text-white font-mono font-bold text-xs">
                                  {proposal.statistics.pending}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground font-mono">0</span>
                              )}
                            </TableCell>
                          )}

                          {columnVisibility.approved && (
                            <TableCell className="p-3 text-center">
                              <span className="text-xs font-mono font-bold text-emerald-600">
                                {proposal.statistics?.approved || 0}
                              </span>
                            </TableCell>
                          )}

                          {columnVisibility.rejected && (
                            <TableCell className="p-3 text-center">
                              <span className="text-xs font-mono font-bold text-rose-600">
                                {proposal.statistics?.rejected || 0}
                              </span>
                            </TableCell>
                          )}

                          <TableCell className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/research/monitoring/progress-report/${targetDetailId}`)}
                              className="text-xs font-bold h-8 rounded-lg gap-1.5 shadow-2xs"
                            >
                              <span>View Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Child Progress Reports Sub-Table */}
                        {isExpanded && (
                          <TableRow className="bg-slate-100/50 dark:bg-slate-950/40 border-b">
                            <TableCell colSpan={visibleColumnCount} className="p-4 sm:p-5">
                              <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Submitted Progress Reports for &ldquo;{proposal.title}&rdquo; ({proposal.reports.length})
                                  </h4>
                                  <Button
                                    size="sm"
                                    onClick={() => router.push(`/research/monitoring/progress-report/${targetDetailId}`)}
                                    className="text-xs h-7 font-bold gap-1 shadow-2xs"
                                  >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Submit New Report
                                  </Button>
                                </div>

                                {proposal.reports.length === 0 ? (
                                  <div className="p-6 text-center border border-dashed rounded-xl bg-card">
                                    <p className="text-xs text-muted-foreground">
                                      No progress reports submitted for this project yet.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto w-full">
                                    {(() => {
                                      const sortedAscendingReports = [...proposal.reports].sort((a, b) => {
                                        const timeA = a.submittedAt || a.submitted_at ? new Date(a.submittedAt || a.submitted_at).getTime() : 0;
                                        const timeB = b.submittedAt || b.submitted_at ? new Date(b.submittedAt || b.submitted_at).getTime() : 0;
                                        if (timeA !== timeB) return timeA - timeB;
                                        return Number(a.id) - Number(b.id);
                                      });

                                      const chronologicalMap = new Map<number, number>();
                                      sortedAscendingReports.forEach((r, index) => {
                                        chronologicalMap.set(r.id, index + 1);
                                      });

                                      const displayedReports = [...proposal.reports].sort((a, b) => {
                                        const timeA = a.submittedAt || a.submitted_at ? new Date(a.submittedAt || a.submitted_at).getTime() : 0;
                                        const timeB = b.submittedAt || b.submitted_at ? new Date(b.submittedAt || b.submitted_at).getTime() : 0;
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
                                              <TableHead className="font-bold text-[11px]">Attachment</TableHead>
                                              <TableHead className="font-bold text-[11px] text-center">Status</TableHead>
                                              <TableHead className="font-bold text-[11px] text-right">Actions</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {displayedReports.map((report, idx) => {
                                              const reportSeqNum = chronologicalMap.get(report.id) ?? (proposal.reports.length - idx);
                                              const repStatusKey = (report.status || report.generalStatus || "pending").toLowerCase();
                                              const repStatusStyle = statusClasses[repStatusKey as keyof typeof statusClasses] || statusClasses.pending;

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
                                                    <PICell pi={report.submittedBy || report.submitted_by || proposal.pi} />
                                                  </TableCell>

                                                  <TableCell className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                                    {formatDate(report.startDate || report.start_date)} – {formatDate(report.endDate || report.end_date)}
                                                  </TableCell>

                                                  <TableCell className="font-mono text-xs font-semibold text-primary whitespace-nowrap">
                                                    {formatAmount(report.amountUsed ?? report.amount_used)}
                                                  </TableCell>

                                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(report.submittedAt || report.submitted_at)}
                                                  </TableCell>

                                                  <TableCell className="whitespace-nowrap">
                                                    {report.attachment ? (
                                                      <div className="flex items-center gap-1">
                                                        <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => handlePreviewDocument(report.attachment!, report.reportName)}
                                                          className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10 px-1.5"
                                                        >
                                                          <Eye className="mr-1 h-3 w-3" /> Preview
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          asChild
                                                          className="h-6 text-[10px] font-bold text-muted-foreground hover:text-foreground px-1.5"
                                                        >
                                                          <a
                                                            href={resolveFileUrl(report.attachment)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                          >
                                                            <Download className="mr-1 h-3 w-3" /> Download
                                                          </a>
                                                        </Button>
                                                      </div>
                                                    ) : (
                                                      <span className="text-muted-foreground text-[11px] italic">
                                                        No file
                                                      </span>
                                                    )}
                                                  </TableCell>

                                                  <TableCell className="text-center">
                                                    <Badge
                                                      variant="outline"
                                                      className={cn(
                                                        "text-[10px] font-bold uppercase",
                                                        repStatusStyle,
                                                      )}
                                                    >
                                                      {repStatusKey}
                                                    </Badge>
                                                  </TableCell>

                                                  <TableCell className="text-right">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => router.push(`/research/monitoring/progress-report/${targetDetailId}`)}
                                                      className="h-7 text-xs font-bold shadow-2xs"
                                                    >
                                                      View Detail
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
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Dialog 1: Initiate Tracking Form Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Upload className="h-5 w-5 text-primary" />
              Initiate Project Tracking
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select an approved proposal with funding recommendation to begin tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitTracking} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="proposal-select" className="text-xs font-bold text-foreground">
                Approved Proposal / Funding Recommendation *
              </label>
              <SearchableSelect
                items={
                  readyProjects?.data?.map((item: any) => ({
                    value: String(item.id),
                    label: `${item.title} (${item.referenceNumber || `Ref #${item.id}`})`,
                  })) || []
                }
                value={formValues.proposal}
                onValueChange={(value) =>
                  setFormValues((prev) => ({ ...prev, proposal: value }))
                }
                placeholder="Select an approved proposal…"
              />
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="shadow-xs font-bold"
              >
                {createMutation.isPending ? "Initializing..." : "Start Tracking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Ready for Tracking Modal List */}
      <Dialog open={isReadyDialogOpen} onOpenChange={setIsReadyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <PlayCircle className="h-5 w-5 text-emerald-600" />
              Proposals Ready for Tracking ({readyForTrackingCount})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Proposals that have been approved for funding recommendation but haven&apos;t started progress tracking yet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter ready proposals..."
                value={readySearchQuery}
                onChange={(e) => setReadySearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {filteredReadyProjects.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl">
                <p className="text-xs text-muted-foreground">
                  No proposals found ready for tracking.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredReadyProjects.map((item: any) => (
                  <Card key={item.id} className="border border-border/80 p-4 space-y-2 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <ReferenceCell refNum={item.referenceNumber || `REF-${item.id}`} />
                        <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                        {item.pi && <PICell pi={item.pi} />}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setFormValues({ proposal: String(item.id) });
                          setIsReadyDialogOpen(false);
                          setIsDialogOpen(true);
                        }}
                        className="text-xs font-bold h-8 shrink-0 shadow-2xs"
                      >
                        <PlusCircle className="mr-1 h-3.5 w-3.5" />
                        Track Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Previewer Dialog */}
      <PdfViewerDialog
        isOpen={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        title={previewTitle}
      />
    </PageContainer>
  );
}
