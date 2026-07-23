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
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Pencil,
  PenLine,
  Tag,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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

type StatFilter = "all" | "draft" | "submitted" | "under_review" | "revision_requested" | "approved" | "rejected";

export default function ResearchRepositoryPage() {
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const { data, isLoading } = useFinalSubmissions({
    page: 1,
    limit: 100,
    ordering: "-submission_date",
    ...(statusFilter !== ALL_VALUE ? { status: statusFilter } : {}),
  });

  const recordDownload = useRecordFinalSubmissionDownload();

  const statistics = (data?.meta as Record<string, unknown>)?.statistics as
    | {
        total: number;
        draft: number;
        submitted: number;
        underReview: number;
        revisionRequested: number;
        approved: number;
        rejected: number;
      }
    | undefined;

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total",
        value: statistics?.total ?? 0,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "All submissions",
      },
      {
        key: "draft" as StatFilter,
        label: "Draft",
        value: statistics?.draft ?? 0,
        icon: FileText,
        color: "text-slate-600",
        bg: "bg-slate-100",
        border: "border-slate-200",
        activeRing: "ring-slate-500/60 border-slate-300",
        sub: "Not yet submitted",
      },
      {
        key: "submitted" as StatFilter,
        label: "Submitted",
        value: statistics?.submitted ?? 0,
        icon: FileText,
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-200",
        activeRing: "ring-sky-500/60 border-sky-300",
        sub: "Awaiting review",
      },
      {
        key: "under_review" as StatFilter,
        label: "Under Review",
        value: statistics?.underReview ?? 0,
        icon: Clock,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        activeRing: "ring-blue-500/60 border-blue-300",
        sub: "Being evaluated",
      },
      {
        key: "revision_requested" as StatFilter,
        label: "Revision Requested",
        value: statistics?.revisionRequested ?? 0,
        icon: PenLine,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Needs changes",
      },
      {
        key: "approved" as StatFilter,
        label: "Approved",
        value: statistics?.approved ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Published submissions",
      },
      {
        key: "rejected" as StatFilter,
        label: "Rejected",
        value: statistics?.rejected ?? 0,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Rejected submissions",
      },
    ],
    [statistics],
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
          // Still download if the count endpoint is unavailable.
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
        id: "searchText",
        accessorFn: (item) =>
          [
            item.title,
            item.submitted_by_name,
            item.ndmc_submission_reference,
            item.fundedproposal_detail?.reference_number,
            item.fundedproposal_detail?.title,
            item.output_type_detail?.name,
            item.data_center_detail?.name,
            item.status,
          ]
            .join(" ")
            .toLowerCase(),
        enableHiding: true,
        cell: () => null,
      },
      {
        accessorKey: "title",
        header: "Submission",
        cell: ({ row }) => {
          const item = row.original;
          const ref =
            item.fundedproposal_detail?.reference_number ||
            item.ndmc_submission_reference ||
            `FS-${item.id}`;

          return (
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
                <Tag className="h-3 w-3 shrink-0" />
                <span className="truncate">{ref}</span>
              </div>
              <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                {item.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.submitted_by_name || "Submitted by PSR user"}
              </p>
            </div>
          );
        },
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
            <div className="max-w-[260px] space-y-0.5">
              <p className="line-clamp-2 text-sm font-semibold text-slate-700">
                {detail.title || "Untitled proposal"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {detail.reference_number || `FR-${detail.funding_recommendation_id}`}
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
              variant="secondary"
              className="border-none bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
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
            <p className="text-sm font-medium text-slate-700">
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
        cell: ({ row }) => (
          <Badge
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide",
              row.original.status === "approved"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : row.original.status === "rejected"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {statusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "submission_date",
        header: "Submitted",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
            <div
              className="flex justify-end gap-1"
              onClick={(event) => event.stopPropagation()}
            >
              {canEdit ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  title="Edit submission"
                  asChild
                >
                  <Link href={`/research/repository/${item.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {hasFile ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 px-2.5 text-primary hover:bg-muted"
                  disabled={isDownloading}
                  title="Download document"
                  onClick={(event) => void handleDownload(item, event)}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              ) : null}
            </div>
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
        <Button asChild className="px-5">
          <Link href="/research/repository/new">
            Register Submission
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
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
            <Card className="overflow-hidden rounded-3xl border border-muted-foreground/10 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                <Skeleton className="h-10 w-[320px] rounded-xl" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

            {statusFilter !== ALL_VALUE && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(ALL_VALUE)}
                  className="h-7 text-xs"
                >
                  Clear filter
                </Button>
              </div>
            )}

            <DataTable
              columns={columns}
              data={data?.data ?? []}
              onRowClick={(item) => router.push(`/research/repository/${item.id}`)}
              searchKey="searchText"
              searchPlaceholder="Search submissions by title, reference, submitter, or status..."
              initialColumnVisibility={{
                searchText: false,
              }}
              emptyMessage="No Research Found"
              emptyDescription="Try adjusting your search or status filter."
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
