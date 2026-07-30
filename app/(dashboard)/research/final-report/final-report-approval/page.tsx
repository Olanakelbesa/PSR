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
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTerminalReports } from "@/hooks/useProgressReports";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const ALL_STATUS_VALUE = "all";

type StatFilter = "all" | "pending" | "approved" | "rejected";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending Review",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
    icon: XCircle,
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock,
  },
};

function StatusBadge({ value }: { value: string }) {
  const cfg = statusConfig[value?.toLowerCase()] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[11px] font-bold uppercase shadow-none border", cfg.className)}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
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
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
    setSearch(debouncedSearch.trim());
  }, [debouncedSearch]);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_STATUS_VALUE : filter));
  }, []);

  const params = useMemo(
    () => ({
      page,
      limit: 100,
      ...(statusFilter !== ALL_STATUS_VALUE ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }),
    [page, statusFilter, search],
  );

  const { data, isLoading, isFetching, refetch } = useTerminalReports(params);

  const reports = data?.data ?? [];
  const statistics = (data?.meta as Record<string, unknown>)?.statistics as
    | { total: number; pending: number; approved: number; rejected: number }
    | undefined;

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Reports",
        value: statistics?.total ?? 0,
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
        value: statistics?.pending ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Awaiting committee grading",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved & Graded",
        value: statistics?.approved ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Cleared for repository",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected / Revision",
        value: statistics?.rejected ?? 0,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Revision requested",
      },
    ],
    [statistics],
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
      cell: ({ row }: any) => <StatusBadge value={row.original.status} />,
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={cn("shrink-0 rounded-xl p-3", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      <div>
                        <div className="text-2xl font-black">{stat.value}</div>
                        <p className="text-xs font-bold text-foreground">
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

            {statusFilter !== ALL_STATUS_VALUE && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(ALL_STATUS_VALUE)}
                  className="h-7 text-xs font-semibold"
                >
                  Clear filter
                </Button>
              </div>
            )}
          </>
        )}

        <DataTable
          columns={columns}
          data={reports}
          showRowNumber={true}
          initialColumnVisibility={{ referenceNumber: false }}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search terminal reports..."
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
