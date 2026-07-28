"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef, Table } from "@tanstack/react-table";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileText,
  FolderPlus,
  Loader2,
  MoreHorizontal,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout";
import { DataTable, DataTableViewOptions } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { getManagedProposals, getProposals, protocolService } from "@/api/services";
import { useDeleteProtocol, useProtocols } from "@/lib/queries/protocol";
import { ProtocolFormModal } from "@/components/features/protocol/protocol-form-modal";
import type { ProtocolRecord, ProtocolStatus } from "@/types/protocol";

const ALL_VALUE = "all";

type StatFilter = "all" | "pending_review" | "approved" | "rejected";

const statusConfig: Record<
  ProtocolStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: ShieldCheck,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Requires Revision",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: AlertCircle,
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    icon: ShieldCheck,
  },
};

type ProposalOption = {
  id: string;
  title: string;
  referenceNumber: string;
  status: string;
};

interface Row {
  id: number;
  proposalTitle: string;
  referenceNumber: string;
  status: ProtocolStatus;
  createdAt: string;
  approvalDate: string | null;
}

function mapRow(item: ProtocolRecord): Row {
  return {
    id: item.id,
    proposalTitle: item.proposalTitle || item.proposal_title || "—",
    referenceNumber: item.referenceNumber || item.reference_number || "—",
    status: item.status || "pending_review",
    createdAt: item.createdAt || item.created_at || "—",
    approvalDate: item.approvalDate || item.approval_date || null,
  };
}

function ReferenceCell({ refNum, id }: { refNum: string; id: number }) {
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
      <Link
        href={`/research/protocol/my-submissions/${id}`}
        className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {refNum}
      </Link>
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

export default function MyProtocolSubmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposalOptions, setProposalOptions] = useState<ProposalOption[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [otherDocument, setOtherDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingProtocolId, setDeletingProtocolId] = useState<number | null>(null);

  const deleteMutation = useDeleteProtocol();

  const debouncedSearch = useDebounce(search, 350);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? "all" : filter));
  }, []);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status:
        statusFilter !== ALL_VALUE
          ? (statusFilter as ProtocolStatus)
          : undefined,
    }),
    [debouncedSearch, statusFilter],
  );

  const { data: response, isLoading, error, refetch } = useProtocols(filters);

  const stats = response?.meta?.statistics;

  const rows = useMemo(() => {
    const items = response?.data ?? [];
    return items.map(mapRow);
  }, [response]);

  const activeFilterCount = [
    debouncedSearch.trim(),
    statusFilter !== ALL_VALUE,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter(ALL_VALUE);
  }, []);

  // Fetch proposals for submission select
  const fetchProposals = useCallback(async () => {
    setIsLoadingProposals(true);
    try {
      let res = await getProposals({ limit: 100 });

      if ((!res.data || res.data.length === 0) && getManagedProposals) {
        res = await getManagedProposals({ limit: 100 });
      }

      if (res.data) {
        const options: ProposalOption[] = res.data.map((p: any) => ({
          id: String(p.id),
          title: p.title || `Proposal #${p.id}`,
          referenceNumber: p.referenceNumber || p.reference_number || `#${p.id}`,
          status: p.status || "UNKNOWN",
        }));
        setProposalOptions(options);
      }
    } catch (err) {
      console.error("Failed to load proposals for protocol upload:", err);
      toast.error("Failed to load eligible proposals.");
    } finally {
      setIsLoadingProposals(false);
    }
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormError(null);
    setSelectedProposalId("");
    setProtocolFile(null);
    setOtherDocument(null);
    fetchProposals();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalId) {
      setFormError("Please select a research proposal.");
      return;
    }
    if (!protocolFile) {
      setFormError("Primary protocol document is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await protocolService.create({
        proposal: Number(selectedProposalId),
        protocol_file: protocolFile,
        other_document: otherDocument,
      });

      toast.success("Protocol submitted successfully!");
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit protocol.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => (
        <ReferenceCell refNum={row.original.referenceNumber} id={row.original.id} />
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-[360px]">
          <p className="line-clamp-1 text-sm font-semibold">
            {row.original.proposalTitle}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg =
          statusConfig[row.original.status] ?? statusConfig.pending_review;
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
      accessorKey: "createdAt",
      header: "Submitted Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      accessorKey: "approvalDate",
      header: "Approved Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.approvalDate || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isApproved = row.original.status === "approved";
        return (
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
                    `/research/protocol/my-submissions/${row.original.id}`,
                  )
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Submission
              </DropdownMenuItem>
              {!isApproved && (
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingProtocolId(row.original.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Protocol
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const renderToolbar = useCallback(
    (table: Table<Row>) => (
      <div className="overflow-hidden rounded-2xl border bg-card/95 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: Search & Status Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Input
                placeholder="Search by proposal title or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-[280px]"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatFilter)}>
                <SelectTrigger className="h-9 w-full sm:w-[170px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Statuses</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right side: Actions & Column View options */}
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
      </div>
    ),
    [search, statusFilter, activeFilterCount, clearFilters],
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
        sub: "All your uploaded protocols",
      },
      {
        key: "pending_review" as StatFilter,
        label: "Pending Review",
        value: stats?.byStatus?.pendingReview ?? stats?.byStatus?.pending_review ?? 0,
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        activeRing: "ring-blue-500/60 border-blue-300",
        sub: "Awaiting PSR review decision",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved",
        value: stats?.byStatus?.approved ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Approved protocol documents",
      },
      {
        key: "rejected" as StatFilter,
        label: "Requires Revision",
        value: stats?.byStatus?.rejected ?? 0,
        icon: AlertCircle,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Submissions requiring revision",
      },
    ],
    [stats],
  );

  return (
    <PageContainer
      title="My Protocol Submissions"
      description="Upload and track your research protocol documents for ethical & technical clearance."
      actions={
        <Button size="sm" onClick={handleOpenModal} className="shadow-xs">
          <PlusCircle className="mr-2 h-4 w-4" />
          Submit New Protocol
        </Button>
      }
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
                <p className="font-semibold">Unable to load protocol submissions</p>
                <p className="text-sm text-muted-foreground">
                  Check the connection and try again.
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
            toolbar={renderToolbar}
            initialColumnVisibility={{ referenceNumber: false }}
            onRowClick={(row) =>
              router.push(`/research/protocol/my-submissions/${row.id}`)
            }
            emptyMessage="No protocol submissions found"
            emptyDescription="Submit your protocol document to initiate review."
          />
        )}
      </div>

      <ProtocolFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deletingProtocolId !== null}
        onOpenChange={(open) => !open && setDeletingProtocolId(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Delete Protocol Submission?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to delete this research protocol submission? This will remove the uploaded protocol files and make the proposal available again in your submission options list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingProtocolId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingProtocolId !== null) {
                  deleteMutation.mutate(deletingProtocolId, {
                    onSuccess: () => {
                      setDeletingProtocolId(null);
                      refetch();
                    },
                  });
                }
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete Protocol"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
