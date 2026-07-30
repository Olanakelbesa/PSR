"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  PenLine,
  Plus,
  RefreshCw,
  Tag,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useFinalSubmissions,
  useRecordFinalSubmissionDownload,
} from "@/hooks";
import type {
  FinalSubmission,
  FinalSubmissionDownloadFileType,
  FinalSubmissionStatus,
} from "@/types/final-submission";
import { canEditFinalSubmission } from "@/types/final-submission";
import {
  downloadRemoteFile,
  extractFileName,
  resolveFileUrl,
} from "@/lib/utils/resolve-file-url";
import { tokenStorage } from "@/api/client";

const statusConfig: Record<
  FinalSubmissionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  draft: {
    label: "Draft",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  submitted: {
    label: "Submitted",
    variant: "default",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  under_review: {
    label: "Under Review",
    variant: "outline",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  revision_requested: {
    label: "Revision Requested",
    variant: "outline",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  approved: {
    label: "Approved",
    variant: "default",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
};

const statusLabels: Record<FinalSubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ReferenceCell({ refNum, id }: { refNum: string; id: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!refNum) return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 transition-colors max-w-fit">
      <Link
        href={`/research/repository/${id}`}
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

function PiUserCell({
  pi,
  submitterName,
  submitterDetail,
}: {
  pi?: any;
  submitterName?: string;
  submitterDetail?: any;
}) {
  const name =
    pi?.full_name ||
    pi?.fullName ||
    [pi?.first_name, pi?.last_name].filter(Boolean).join(" ") ||
    submitterDetail?.full_name ||
    submitterDetail?.fullName ||
    submitterName ||
    "PSR Investigator";

  const email = pi?.email || submitterDetail?.email || "";
  const rawPhoto =
    pi?.photo_url ||
    pi?.photoUrl ||
    pi?.avatarUrl ||
    pi?.avatar ||
    pi?.photo ||
    submitterDetail?.photo_url ||
    submitterDetail?.photoUrl;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;
  const initials = getInitials(name);

  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <Avatar className="h-8 w-8 border border-border shrink-0 shadow-2xs">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary flex items-center justify-center size-full">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span
          className="text-sm font-semibold text-foreground truncate max-w-[170px]"
          title={name}
        >
          {name}
        </span>
        {email && (
          <span
            className="text-[11px] text-muted-foreground truncate max-w-[170px]"
            title={email}
          >
            {email}
          </span>
        )}
      </div>
    </div>
  );
}

function getPrimaryDownloadFile(item: FinalSubmission): {
  path: string;
  fileType: FinalSubmissionDownloadFileType;
} | null {
  if (item.full_report) {
    return { path: item.full_report, fileType: "full_report" };
  }
  if (item.policy_brief) {
    return { path: item.policy_brief, fileType: "policy_brief" };
  }
  if (item.supplementary_document) {
    return {
      path: item.supplementary_document,
      fileType: "supplementary_document",
    };
  }
  return null;
}

const ALL_VALUE = "all";

type StatFilter =
  | "all"
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "rejected";

export default function ResearchRepositoryPage() {
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const { data, isLoading, refetch, isFetching } = useFinalSubmissions({
    page: 1,
    limit: 100,
    ordering: "-submission_date",
    ...(statusFilter !== ALL_VALUE ? { status: statusFilter } : {}),
  });

  const recordDownload = useRecordFinalSubmissionDownload();

  const deduplicatedData = useMemo(() => {
    const rawData = data?.data ?? [];
    const seenProposalKeys = new Set<string | number>();
    const uniqueSubmissions: FinalSubmission[] = [];

    for (const item of rawData) {
      const proposalKey =
        item.fundedproposal_detail?.reference_number ||
        item.fundedproposal_detail?.proposal_id ||
        item.fundedproposal_detail?.funding_recommendation_id ||
        item.fundedproposal ||
        item.id;

      if (!seenProposalKeys.has(proposalKey)) {
        seenProposalKeys.add(proposalKey);
        uniqueSubmissions.push(item);
      }
    }

    return uniqueSubmissions;
  }, [data?.data]);

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total Submissions",
        value: deduplicatedData.length,
        icon: <BarChart3 className="h-4 w-4 text-primary" />,
        iconBg: "bg-primary/10",
        border: "border-primary/10",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "Across all categories",
      },
      {
        key: "draft" as StatFilter,
        label: "Draft",
        value: deduplicatedData.filter((s) => s.status === "draft").length,
        icon: <FileText className="h-4 w-4 text-slate-600" />,
        iconBg: "bg-slate-100",
        border: "border-slate-200/70 bg-slate-50/20",
        activeRing: "ring-slate-500/60 border-slate-300",
        sub: "Not yet submitted",
      },
      {
        key: "submitted" as StatFilter,
        label: "Submitted",
        value: deduplicatedData.filter((s) => s.status === "submitted").length,
        icon: <FileText className="h-4 w-4 text-sky-600" />,
        iconBg: "bg-sky-100",
        border: "border-sky-200/70 bg-sky-50/20",
        activeRing: "ring-sky-500/60 border-sky-300",
        sub: "Awaiting review",
      },
      {
        key: "under_review" as StatFilter,
        label: "Under Review",
        value: deduplicatedData.filter((s) => s.status === "under_review").length,
        icon: <Clock className="h-4 w-4 text-blue-500" />,
        iconBg: "bg-blue-100",
        border: "border-blue-100/50 bg-blue-50/10",
        activeRing: "ring-blue-500/60 border-blue-300",
        sub: "Being evaluated",
      },
      {
        key: "revision_requested" as StatFilter,
        label: "Revision Requested",
        value: deduplicatedData.filter((s) => s.status === "revision_requested").length,
        icon: <PenLine className="h-4 w-4 text-amber-500" />,
        iconBg: "bg-amber-100",
        border: "border-amber-100/50 bg-amber-50/10",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Needs changes",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved",
        value: deduplicatedData.filter((s) => s.status === "approved").length,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        iconBg: "bg-emerald-100",
        border: "border-emerald-100/50 bg-emerald-50/10",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Published submissions",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected",
        value: deduplicatedData.filter((s) => s.status === "rejected").length,
        icon: <XCircle className="h-4 w-4 text-rose-500" />,
        iconBg: "bg-rose-100",
        border: "border-rose-100/50 bg-rose-50/10",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Rejected submissions",
      },
    ],
    [deduplicatedData],
  );

  const handleDownload = useCallback(
    async (item: FinalSubmission, event?: React.MouseEvent) => {
      event?.stopPropagation();

      const primaryFile = getPrimaryDownloadFile(item);
      if (!primaryFile) {
        toast.error("No downloadable file is available for this submission.");
        return;
      }

      setDownloadingId(item.id);
      try {
        let fileUrl = resolveFileUrl(primaryFile.path) ?? primaryFile.path;

        try {
          const result = await recordDownload.mutateAsync({
            id: item.id,
            fileType: primaryFile.fileType,
          });
          fileUrl = result.fileUrl || fileUrl;
        } catch {
          // Still download if count recording endpoint fails
        }

        await downloadRemoteFile(
          fileUrl,
          extractFileName(primaryFile.path),
          { token: tokenStorage.get() },
        );
      } catch {
        toast.error("Failed to download document.");
      } finally {
        setDownloadingId(null);
      }
    },
    [recordDownload],
  );

  const columns: ColumnDef<FinalSubmission>[] = useMemo(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Reference #",
        cell: ({ row }) => {
          const item = row.original;
          const refNum =
            item.fundedproposal_detail?.reference_number ||
            item.ndmc_submission_reference ||
            `FS-${item.id}`;
          return <ReferenceCell refNum={refNum} id={item.id} />;
        },
      },
      {
        accessorKey: "title",
        header: "Submission Title",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="max-w-[320px] min-w-[180px] py-1 space-y-1">
              <Link
                href={`/research/repository/${item.id}`}
                className="font-semibold text-sm line-clamp-2 text-foreground hover:text-primary transition-colors block leading-snug"
                onClick={(e) => e.stopPropagation()}
              >
                {item.title}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "pi",
        header: "Principal Investigator",
        cell: ({ row }) => (
          <PiUserCell
            pi={row.original.pi}
            submitterName={row.original.submitted_by_name}
            submitterDetail={row.original.submitted_by_detail}
          />
        ),
      },
      {
        accessorKey: "fundedproposal_detail",
        header: "Funded Proposal",
        cell: ({ row }) => {
          const detail = row.original.fundedproposal_detail;
          if (!detail) {
            return (
              <span className="text-xs text-muted-foreground">
                Funding proposal #{row.original.fundedproposal}
              </span>
            );
          }

          return (
            <div className="max-w-[240px] space-y-0.5">
              <p className="line-clamp-2 text-sm font-semibold text-foreground/90">
                {detail.title || "Untitled proposal"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {detail.reference_number ||
                  `FR-${detail.funding_recommendation_id}`}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "output_type_detail",
        header: "Output Type",
        cell: ({ row }) => {
          const name = row.original.output_type_detail?.name;
          return (
            <Badge
              variant="outline"
              className="text-[11px] font-semibold bg-muted/50 text-foreground/80 border-border/60"
            >
              {name || `Output #${row.original.output_type}`}
            </Badge>
          );
        },
      },
      {
        accessorKey: "data_center_detail",
        header: "Data Center & Version",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground/90">
              {row.original.data_center_detail?.name ||
                `Center #${row.original.data_center || "-"}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Version {row.original.version ?? 1}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const config =
            statusConfig[row.original.status] || statusConfig.draft;
          return (
            <Badge
              variant={config.variant}
              className={cn("text-xs font-semibold gap-1", config.className)}
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "submission_date",
        header: "Submitted",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            {formatDate(row.original.submission_date)}
          </div>
        ),
      },
      {
        accessorKey: "download_count",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0 font-semibold hover:bg-transparent"
          >
            Downloads
            <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-sm font-medium text-muted-foreground">
            {row.original.download_count ?? 0}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          const hasFile = Boolean(getPrimaryDownloadFile(item));
          const isDownloading = downloadingId === item.id;
          const canEdit = canEditFinalSubmission(item.status);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/research/repository/${item.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/research/repository/${item.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Submission
                    </Link>
                  </DropdownMenuItem>
                )}
                {hasFile && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isDownloading}
                      onClick={(event) => void handleDownload(item, event)}
                      className="cursor-pointer"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download Document
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [downloadingId, handleDownload],
  );

  return (
    <PageContainer
      title="Research Repository"
      description="The official PSR archive of final submissions, output records, and repository registrations."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/research/repository/new">
              <Plus className="h-4 w-4 mr-2" />
              Register Submission
            </Link>
          </Button>
        </div>
      }
    >
      {/* ── Stats Cards Grid ───────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-md">
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
          : statCards.map(
            ({
              key,
              label,
              value,
              icon,
              iconBg,
              border,
              activeRing,
              sub,
            }) => {
              const isActive = statusFilter === key;

              return (
                <Card
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => applyStatusFilter(key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      applyStatusFilter(key);
                    }
                  }}
                  className={cn(
                    border,
                    "cursor-pointer transition-all hover:shadow-md",
                    isActive && cn("ring-2 shadow-md", activeRing),
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {label}
                    </CardTitle>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
                    >
                      {icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        value
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {sub}
                    </p>
                  </CardContent>
                </Card>
              );
            },
          )}
      </div>

      {/* ── Active Status Filter Banner ───────────────────────────────── */}
      {statusFilter !== ALL_VALUE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">
            Showing research submissions filtered by status:{" "}
            <span className="font-semibold capitalize">
              {statusLabels[statusFilter]}
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-background"
            onClick={() => setStatusFilter(ALL_VALUE)}
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* ── Main Data Table ───────────────────────────────────────────── */}
      <div className="mt-8 w-full max-w-full overflow-hidden">
        <DataTable
          columns={columns}
          data={deduplicatedData}
          onRowClick={(item) => router.push(`/research/repository/${item.id}`)}
          searchKey="title"
          searchPlaceholder="Search submissions by title..."
          initialColumnVisibility={{
            referenceNumber: false,
          }}
          filterOptions={[
            {
              key: "status",
              label: "Status",
              options: Object.entries(statusLabels).map(([value, label]) => ({
                value,
                label,
              })),
            },
          ]}
          emptyMessage="No Research Submissions Found"
          emptyDescription="Try adjusting your search or status filter."
        />
      </div>
    </PageContainer>
  );
}
