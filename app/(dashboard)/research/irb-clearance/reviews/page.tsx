"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  ShieldCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  useEthicalClearances,
} from "@/lib/queries/ethical-clearance";
import type { EthicalClearance, IRBClearanceStatus } from "@/types/ethical-clearance";

const ALL_VALUE = "all";

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
    icon: ShieldCheck,
  },
};

interface Row {
  id: number;
  proposalTitle: string;
  referenceNumber: string;
  pi: string;
  institution: string;
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
    pi: item.pi?.fullName || "—",
    institution: item.proposalInstitution || "—",
    clearanceType: item.clearanceTypeName || "—",
    status: item.status,
    applicationDate: item.applicationDate,
    approvalDate: item.approvalDate,
  };
}

export default function IRBReviewsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_VALUE);

  const debouncedSearch = useDebounce(search, 350);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status:
        statusFilter !== ALL_VALUE
          ? (statusFilter as IRBClearanceStatus)
          : undefined,
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
      accessorKey: "pi",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pi}</span>
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
                  `/research/irb-clearance/reviews/${row.original.id}`,
                )
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              View & Review
            </DropdownMenuItem>
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
              placeholder="Search by title, reference, or PI name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

  const statsDisplay = isLoading
    ? [
        { label: "Total", value: 0, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
        { label: "Pending Review", value: 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Approved", value: 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Rejected", value: 0, icon: XCircle, color: "text-rose-600", bg: "bg-rose-100" },
      ]
    : [
        {
          label: "Total",
          value: stats?.total ?? 0,
          icon: FileText,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "Pending Review",
          value: stats?.byStatus?.pending_review ?? 0,
          icon: Clock,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          label: "Approved",
          value: stats?.byStatus?.approved ?? 0,
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-100",
        },
        {
          label: "Rejected",
          value: stats?.byStatus?.rejected ?? 0,
          icon: XCircle,
          color: "text-rose-600",
          bg: "bg-rose-100",
        },
      ];

  return (
    <PageContainer
      title="IRB Reviews"
      description="Review and manage IRB clearance applications from researchers."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            : statsDisplay.map((stat) => (
                <Card
                  key={stat.label}
                  className="group relative overflow-hidden border-none shadow-md transition-all hover:shadow-lg"
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      stat.bg,
                    )}
                  />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
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
              router.push(`/research/irb-clearance/reviews/${row.id}`)
            }
            emptyMessage="No IRB clearance records found"
            emptyDescription="Try adjusting your filters."
          />
        )}
      </div>
    </PageContainer>
  );
}
