"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  ShieldCheck,
  XCircle,
  RefreshCcw,
  AlertCircle,
  Upload,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useEthicalClearances } from "@/lib/queries/ethical-clearance";
import type { EthicalClearance, IRBClearanceStatus } from "@/types/ethical-clearance";

const ALL_VALUE = "all";

type StatFilter = "all" | "pending_submission" | "pending_review" | "rejected";

const statusConfig: Record<
  IRBClearanceStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: ShieldCheck,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 border-violet-200",
    icon: RefreshCcw,
  },
};

interface Row {
  id: number;
  proposalTitle: string;
  referenceNumber: string;
  clearanceType: string;
  status: IRBClearanceStatus;
  applicationDate: string;
  approvalDate: string | null;
}

function mapRow(item: EthicalClearance): Row {
  return {
    id: item.id,
    proposalTitle: item.proposalTitle || "—",
    referenceNumber: item.referenceNumber || "—",
    clearanceType: item.clearanceTypeName || "—",
    status: item.status,
    applicationDate: item.applicationDate,
    approvalDate: item.approvalDate,
  };
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);

  const debouncedSearch = useDebounce(search, 350);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? "all" : filter));
  }, []);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status:
        statusFilter !== ALL_VALUE
          ? (statusFilter as IRBClearanceStatus)
          : undefined,
      mine: true,
    }),
    [debouncedSearch, statusFilter],
  );

  const { data: response, isLoading, error } = useEthicalClearances(filters);

  const stats = response?.meta?.statistics;

  const rows = useMemo(() => {
    const items = response?.data ?? [];
    return items.map(mapRow);
  }, [response]);

  const activeFilterCount = [
    debouncedSearch.trim(),
    statusFilter !== ALL_VALUE,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_VALUE);
  };

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.referenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-[320px]">
          <p className="line-clamp-1 text-sm font-semibold">
            {row.original.proposalTitle}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "clearanceType",
      header: "Clearance Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.clearanceType}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg =
          statusConfig[row.original.status] ?? statusConfig.pending_submission;
        const Icon = cfg.icon;
        return (
          <Badge
            className={cn(
              "gap-1 border px-2 text-[10px] font-bold uppercase shadow-none",
              cfg.className,
            )}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "applicationDate",
      header: "Applied",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.applicationDate || "—"}
        </span>
      ),
    },
    {
      accessorKey: "approvalDate",
      header: "Approved",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.approvalDate || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/research/irb-clearance/my-submissions/${row.original.id}`,
                )
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {(row.original.status === "pending_submission" ||
              row.original.status === "rejected") && (
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/research/irb-clearance/my-submissions/submit/${row.original.id}`,
                  )
                }
              >
                <Upload className="mr-2 h-4 w-4" />
                {row.original.status === "rejected"
                  ? "Resubmit Application"
                  : "Edit Draft"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const toolbar = (
    <div className="overflow-hidden rounded-2xl border bg-card/95 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px] lg:flex-1">
            <Input
              placeholder="Search by title or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="shrink-0"
            >
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Submissions",
        value: stats?.total ?? 0,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "Your total IRB submissions",
      },
      {
        key: "pending_submission" as StatFilter,
        label: "Pending Submission",
        value: stats?.byStatus?.pendingSubmission ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Drafts not yet submitted",
      },
      {
        key: "pending_review" as StatFilter,
        label: "Pending Review",
        value: stats?.byStatus?.pendingReview ?? 0,
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        activeRing: "ring-blue-500/60 border-blue-300",
        sub: "Awaiting IRB committee review",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected",
        value: stats?.byStatus?.rejected ?? 0,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Requires resubmission",
      },
    ],
    [stats],
  );

  return (
    <PageContainer
      title="My IRB Submissions"
      description="Track and manage your IRB clearance submissions."
    >
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
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
                      "cursor-pointer border shadow-sm transition-all hover:shadow-md",
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

        {error ? (
          <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-rose-600" />
              <div className="space-y-1">
                <p className="font-semibold">Unable to load data</p>
                <p className="text-sm text-muted-foreground">
                  Check the backend connection and try again.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            toolbar={toolbar}
            onRowClick={(row) =>
              router.push(`/research/irb-clearance/my-submissions/${row.id}`)
            }
            emptyMessage="No IRB submissions found"
            emptyDescription="Try adjusting your filters."
          />
        )}
      </div>
    </PageContainer>
  );
}
