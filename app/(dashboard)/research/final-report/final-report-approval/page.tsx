"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Globe,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTerminalReports } from "@/hooks/useProgressReports";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const ALL_STATUS_VALUE = "all";

type StatFilter = "all" | "pending" | "approved_internal" | "approved_published" | "rejected";

function StatusBadge({ value, isPublished }: { value: string; isPublished?: boolean }) {
  const statusKey = (value || "").toLowerCase();

  if (statusKey === "approved" || statusKey === "graded_for_repository") {
    if (isPublished) {
      return (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] font-bold uppercase shadow-none border bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
        >
          <Globe className="h-3 w-3 text-emerald-600 shrink-0" />
          Approved & Published
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 text-[10px] font-bold uppercase shadow-none border bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300"
      >
        <Building className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
        Approved (Internal Only)
      </Badge>
    );
  }

  if (statusKey === "rejected" || statusKey === "revision_requested") {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-[10px] font-bold uppercase shadow-none border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
      >
        <RotateCcw className="h-3 w-3 text-rose-600 shrink-0" />
        Revisions Required
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 text-[10px] font-bold uppercase shadow-none border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
    >
      <Clock className="h-3 w-3 text-blue-600 shrink-0" />
      Pending Review
    </Badge>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopiableRefNumber({ refNum }: { refNum?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!refNum || refNum === "—") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2.5 py-1 rounded-md border border-border/50 transition-colors max-w-fit shadow-2xs">
      <span className="font-mono text-xs font-bold text-foreground truncate">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function UserAvatarCell({
  name,
  email,
  rawPhoto,
}: {
  name: string;
  email?: string | null;
  rawPhoto?: string | null;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(() => {
    if (!rawPhoto) return null;
    if (rawPhoto.startsWith("http")) return rawPhoto;
    return (
      resolveFileUrl(rawPhoto) ||
      `http://localhost:8000${rawPhoto.startsWith("/") ? "" : "/"}${rawPhoto}`
    );
  });

  const [hasError, setHasError] = useState(false);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PI";

  const handleError = () => {
    if (
      imgSrc &&
      !imgSrc.includes("localhost:8000") &&
      typeof rawPhoto === "string"
    ) {
      setImgSrc(
        `http://localhost:8000${rawPhoto.startsWith("/") ? "" : "/"}${rawPhoto}`,
      );
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="flex items-center gap-2.5 min-w-[180px] py-0.5">
      <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-primary/20 bg-primary/10 items-center justify-center shadow-2xs">
        {imgSrc && !hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={name}
            className="h-full w-full object-cover"
            onError={handleError}
          />
        ) : (
          <span className="text-[10px] font-bold text-primary">{initials}</span>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-foreground truncate">
          {name}
        </span>
        {email && (
          <span className="text-[10px] text-muted-foreground truncate">
            {email}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TerminalReportApprovalPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_STATUS_VALUE);
  const [dataCenterFilter, setDataCenterFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [searchInput, setSearchInput] = useState("");

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_STATUS_VALUE : filter));
  }, []);

  const params = useMemo(
    () => ({
      page,
      limit: 100,
    }),
    [page],
  );

  const { data, isLoading, isFetching, refetch } = useTerminalReports(params);

  const reports = data?.data ?? [];
  const statistics = (data?.meta as Record<string, unknown>)?.statistics as
    | { total: number; pending: number; approved: number; rejected: number }
    | undefined;

  const availableDataCenters = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r: any) => {
      const dc =
        r.data_center_name ||
        r.dataCenterName ||
        r.custom_data_center ||
        r.customDataCenter;
      if (dc) set.add(dc);
    });
    return Array.from(set).sort();
  }, [reports]);

  const counts = useMemo(() => {
    let pending = 0;
    let approvedInternal = 0;
    let approvedPublished = 0;
    let rejected = 0;

    reports.forEach((r: any) => {
      const st = (r.status || "").toLowerCase();
      const isPub = r.is_published ?? r.isPublished ?? r.ready_for_repository ?? false;
      if (st === "pending" || st === "draft") pending++;
      else if (st === "approved" || st === "graded_for_repository") {
        if (isPub) approvedPublished++;
        else approvedInternal++;
      } else if (st === "rejected" || st === "revision_requested") rejected++;
    });

    return {
      total: statistics?.total ?? reports.length,
      pending: statistics?.pending ?? pending,
      approvedInternal,
      approvedPublished,
      rejected: statistics?.rejected ?? rejected,
    };
  }, [reports, statistics]);

  const filteredReports = useMemo(() => {
    let list = reports.filter((r: any) => {
      const st = (r.status || "").toLowerCase();
      const isPub = r.is_published ?? r.isPublished ?? r.ready_for_repository ?? false;

      // Status Filter
      if (statusFilter === "pending" && !(st === "pending" || st === "draft")) return false;
      if (statusFilter === "approved_internal" && !((st === "approved" || st === "graded_for_repository") && !isPub)) return false;
      if (statusFilter === "approved_published" && !((st === "approved" || st === "graded_for_repository") && isPub)) return false;
      if (statusFilter === "rejected" && !(st === "rejected" || st === "revision_requested")) return false;

      // Data Center Filter
      if (dataCenterFilter !== "all") {
        const dc =
          r.data_center_name ||
          r.dataCenterName ||
          r.custom_data_center ||
          r.customDataCenter ||
          "";
        if (dc !== dataCenterFilter) return false;
      }

      // Search Filter
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase().trim();
        const title = (r.project_tracking_title || r.project_tracking?.title || r.report_name || "").toLowerCase();
        const ref = (r.reference_number || r.project_tracking?.reference_number || "").toLowerCase();
        const pi = (r.submitted_by_name || r.submittedByName || r.pi?.full_name || "").toLowerCase();
        const dc = (r.data_center_name || r.dataCenterName || "").toLowerCase();
        if (!title.includes(q) && !ref.includes(q) && !pi.includes(q) && !dc.includes(q)) {
          return false;
        }
      }

      return true;
    });

    return list.sort((a: any, b: any) => {
      if (sortBy === "oldest") {
        const timeA = new Date(a.submitted_at || 0).getTime();
        const timeB = new Date(b.submitted_at || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === "title") {
        const titleA = a.project_tracking_title || a.project_tracking?.title || a.report_name || "";
        const titleB = b.project_tracking_title || b.project_tracking?.title || b.report_name || "";
        return titleA.localeCompare(titleB);
      }
      const timeA = new Date(a.submitted_at || 0).getTime();
      const timeB = new Date(b.submitted_at || 0).getTime();
      return timeB - timeA;
    });
  }, [reports, statusFilter, dataCenterFilter, searchInput, sortBy]);

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Reports",
        value: counts.total,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "All final report submissions",
      },
      {
        key: "pending" as StatFilter,
        label: "Pending Review",
        value: counts.pending,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Awaiting committee evaluation",
      },
      {
        key: "approved_internal" as StatFilter,
        label: "Approved (Internal)",
        value: counts.approvedInternal,
        icon: Building,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        border: "border-indigo-200 dark:border-indigo-800",
        activeRing: "ring-indigo-500/60 border-indigo-300",
        sub: "Internal tracking records only",
      },
      {
        key: "approved_published" as StatFilter,
        label: "Approved & Published",
        value: counts.approvedPublished,
        icon: Globe,
        color: "text-teal-600",
        bg: "bg-teal-50",
        border: "border-teal-200",
        activeRing: "ring-teal-500/60 border-teal-300",
        sub: "Indexed in Research Repository",
      },
      {
        key: "rejected" as StatFilter,
        label: "Revisions Required",
        value: counts.rejected,
        icon: RotateCcw,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Returned to PI for updates",
      },
    ],
    [counts],
  );

  const columns = [
    {
      accessorKey: "referenceNumber",
      id: "referenceNumber",
      header: "Reference No.",
      cell: ({ row }: any) => {
        const pt = row.original.project_tracking || {};
        const ptId = row.original.project_tracking_id || pt.project_tracking_id || row.original.id;
        const propId = row.original.proposal_id || pt.proposal_id || pt.proposalId || null;
        const refNum =
          row.original.reference_number ||
          pt.reference_number ||
          pt.referenceNumber ||
          (propId ? `PROP-${propId}` : `PT-${ptId}`);
        return <CopiableRefNumber refNum={refNum} />;
      },
      enableHiding: true,
    },
    {
      accessorKey: "report_name",
      header: "Proposal Title",
      cell: ({ row }: any) => {
        const ptTitle =
          row.original.project_tracking_title ||
          (row.original.project_tracking || {}).title ||
          row.original.report_name ||
          "Untitled Proposal";

        return (
          <div className="flex flex-col max-w-[280px] py-1">
            <span className="font-bold text-xs text-foreground leading-snug truncate">
              {ptTitle}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "submitted_by",
      header: "Submitted By",
      cell: ({ row }: any) => {
        const pt = row.original.project_tracking || {};
        const pi = row.original.pi || pt.pi || {};
        const name =
          row.original.submitted_by_name ||
          row.original.submittedByName ||
          pi.full_name ||
          pi.fullName ||
          "Investigator";

        const email =
          row.original.submitted_by_email ||
          row.original.submittedByEmail ||
          pi.email ||
          null;

        const rawPhoto =
          row.original.submitted_by_photo_url ||
          row.original.submittedByPhotoUrl ||
          row.original.photo_url ||
          row.original.photoUrl ||
          row.original.photo ||
          pi.photo_url ||
          pi.photoUrl ||
          pi.photo;

        return (
          <UserAvatarCell name={name} email={email} rawPhoto={rawPhoto} />
        );
      },
    },
    {
      accessorKey: "data_center_name",
      header: "Target Data Center",
      cell: ({ row }: any) => {
        const dc =
          row.original.data_center_name ||
          row.original.dataCenterName ||
          row.original.custom_data_center ||
          row.original.customDataCenter ||
          "Standard Repository";
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Building className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[180px]">{dc}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Deliverable Items",
      cell: ({ row }: any) => {
        const items = row.original.items || [];
        if (items.length === 0) {
          const tTypes = row.original.terminalType || row.original.terminal_type || [];
          if (tTypes.length > 0) {
            return (
              <div className="flex items-center gap-1.5 py-0.5">
                <Badge variant="outline" className="text-[10px] font-bold bg-muted/60 text-foreground border-border/80 rounded-lg px-2.5 py-1 shadow-2xs">
                  <Paperclip className="w-3 h-3 mr-1 text-primary shrink-0" />
                  Terminal Report
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary border border-primary/25 font-black text-[10px] px-2 py-0.5 shadow-2xs">
                  1
                </Badge>
              </div>
            );
          }
          return <span className="text-xs text-muted-foreground italic">No items</span>;
        }

        const displayedItems = items.slice(0, 2);
        const remainingCount = items.length - displayedItems.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 max-w-[260px]">
            {displayedItems.map((it: any, idx: number) => {
              const typeName =
                it.terminalTypeName ||
                it.terminal_type_name ||
                it.terminal_type_name_display ||
                it.name ||
                `Deliverable #${idx + 1}`;
              return (
                <Badge
                  key={it.id || idx}
                  variant="outline"
                  className="text-[10px] font-bold bg-muted/60 hover:bg-muted text-foreground border-border/80 rounded-lg truncate max-w-[140px] px-2.5 py-1 shadow-2xs transition-colors"
                >
                  <Paperclip className="w-3 h-3 mr-1 text-primary shrink-0" />
                  {typeName}
                </Badge>
              );
            })}
            {remainingCount > 0 ? (
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/15 text-primary border border-primary/25 font-black text-[10px] px-2 py-0.5 shadow-2xs"
              >
                +{remainingCount}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/10 text-primary border border-primary/20 font-extrabold text-[10px] px-2 py-0.5 shadow-2xs"
              >
                {items.length}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const isPub =
          row.original.is_published ??
          row.original.isPublished ??
          row.original.ready_for_repository ??
          false;
        return <StatusBadge value={row.original.status} isPublished={isPub} />;
      },
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted At",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
          {formatDate(row.original.submitted_at)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-bold border-border shadow-2xs">
          <Link
            href={`/research/final-report/final-report-approval/${row.original.id}`}
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            Evaluate
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Final Report Approval"
      description="Review submitted terminal reports, evaluate deliverable files with dynamic grades, and record closeout decisions."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shadow-2xs"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {statCards.map((stat) => {
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
                    <CardContent className="flex items-center gap-3.5 p-4">
                      <div className={cn("shrink-0 rounded-xl p-2.5", stat.bg)}>
                        <stat.icon className={cn("h-4.5 w-4.5", stat.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-black">{stat.value}</div>
                        <p className="text-xs font-bold text-foreground truncate">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/80 truncate">
                          {stat.sub}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Filter Controls Toolbar Card */}
            <Card className="border border-border/70 shadow-2xs bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search title, reference #, investigator, data center..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 pr-8 text-xs h-9 bg-background"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput("")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="w-full md:w-56">
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatFilter)}>
                      <SelectTrigger className="h-9 text-xs font-semibold bg-background">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses ({counts.total})</SelectItem>
                        <SelectItem value="pending">Pending Review ({counts.pending})</SelectItem>
                        <SelectItem value="approved_internal">Approved (Internal) ({counts.approvedInternal})</SelectItem>
                        <SelectItem value="approved_published">Approved & Published ({counts.approvedPublished})</SelectItem>
                        <SelectItem value="rejected">Revisions Required ({counts.rejected})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data Center Dropdown */}
                  <div className="w-full md:w-52">
                    <Select value={dataCenterFilter} onValueChange={setDataCenterFilter}>
                      <SelectTrigger className="h-9 text-xs font-semibold bg-background">
                        <Building className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="All Data Centers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Data Centers</SelectItem>
                        {availableDataCenters.map((dc) => (
                          <SelectItem key={dc} value={dc}>
                            {dc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="w-full md:w-44">
                    <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                      <SelectTrigger className="h-9 text-xs font-semibold bg-background">
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="title">Title (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filter Badges & Reset Button */}
                {(statusFilter !== "all" || dataCenterFilter !== "all" || searchInput || sortBy !== "newest") && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/40">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Active Filters:
                    </span>
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        Status: {statusFilter.replace("_", " ")}
                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => setStatusFilter("all")} />
                      </Badge>
                    )}
                    {dataCenterFilter !== "all" && (
                      <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        Center: {dataCenterFilter}
                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => setDataCenterFilter("all")} />
                      </Badge>
                    )}
                    {searchInput && (
                      <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        Search: &ldquo;{searchInput}&rdquo;
                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => setSearchInput("")} />
                      </Badge>
                    )}
                    {sortBy !== "newest" && (
                      <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        Sort: {sortBy}
                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => setSortBy("newest")} />
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setDataCenterFilter("all");
                        setSearchInput("");
                        setSortBy("newest");
                      }}
                      className="h-6 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Reset All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <DataTable
          columns={columns}
          data={filteredReports}
          showRowNumber={true}
          initialColumnVisibility={{ referenceNumber: false }}
          emptyMessage="No terminal reports found"
          emptyDescription="Try adjusting your search or refresh the list."
          onRowClick={(report) =>
            router.push(
              `/research/final-report/final-report-approval/${report.id}`,
            )
          }
        />
      </div>
    </PageContainer>
  );
}
