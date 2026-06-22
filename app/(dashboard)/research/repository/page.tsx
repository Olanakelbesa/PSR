"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  Download,
  Hash,
  Loader2,
  Pencil,
  Tag,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  useDataCenters,
  useFinalSubmissions,
  useOutputTypes,
  useReadyForFinalSubmissionFundingRecommendations,
  useRecordFinalSubmissionDownload,
} from "@/hooks";
import type {
  FinalSubmission,
  FinalSubmissionDownloadFileType,
  FinalSubmissionStatus,
} from "@/types/final-submission";
import { canEditFinalSubmission } from "@/types/final-submission";
import type { FundingRecommendation } from "@/types/funding-recommendation";
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

type ResearchRecord = FinalSubmission & {
  searchText: string;
  output_type_name?: string;
  data_center_name?: string;
  fundedproposal_title?: string;
};

function formatRecommendationLabel(item: FundingRecommendation) {
  const reference = item.reference_number || `FR-${item.id}`;
  const title = item.proposal_title || "Untitled proposal";
  return `${reference} · ${title}`;
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

export default function ResearchRepositoryPage() {
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading: isFinalSubmissionsLoading } = useFinalSubmissions({
    page: 1,
    limit: 100,
    ordering: "-submission_date",
  });

  const recordDownload = useRecordFinalSubmissionDownload();

  const { data: fundingRecommendationsData, isLoading: isFundingLoading } =
    useReadyForFinalSubmissionFundingRecommendations({
      page: 1,
      limit: 100,
      ordering: "-recommended_at",
    });

  const { data: outputTypesData, isLoading: isOutputTypesLoading } =
    useOutputTypes({ page: 1, limit: 100, ordering: "name" });

  const { data: dataCentersData, isLoading: isDataCentersLoading } =
    useDataCenters({ page: 1, limit: 100, ordering: "name" });

  const isLoading =
    isFinalSubmissionsLoading ||
    isFundingLoading ||
    isOutputTypesLoading ||
    isDataCentersLoading;

  const fundingRecommendationMap = new Map(
    (fundingRecommendationsData?.data ?? []).map((item) => [item.id, item]),
  );
  const outputTypeMap = new Map(
    (outputTypesData?.data ?? []).map((item) => [item.id, item]),
  );
  const dataCenterMap = new Map(
    (dataCentersData?.data ?? []).map((item) => [item.id, item]),
  );

  const finalSubmissions: ResearchRecord[] = (data?.data ?? []).map((item) => {
    const fundedProposal = fundingRecommendationMap.get(item.fundedproposal);
    const outputType = outputTypeMap.get(item.output_type);
    const dataCenter = item.data_center
      ? dataCenterMap.get(item.data_center)
      : undefined;

    return {
      ...item,
      searchText: [
        item.title,
        item.submitted_by_name,
        item.ndmc_submission_reference,
        item.status,
        fundedProposal?.proposal_title,
        outputType?.name,
        dataCenter?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      fundedproposal_title: fundedProposal
        ? formatRecommendationLabel(fundedProposal)
        : undefined,
      output_type_name: outputType?.name,
      data_center_name: dataCenter?.name,
    };
  });

  const handleDownload = useCallback(
    async (item: ResearchRecord, event?: React.MouseEvent) => {
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

  const repositoryColumns: ColumnDef<ResearchRecord>[] = useMemo(
    () => [
      {
        id: "searchText",
        accessorFn: (item) =>
          [
            item.title,
            item.submitted_by_name,
            item.ndmc_submission_reference,
            item.fundedproposal_title,
            item.output_type_name,
            item.data_center_name,
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

          return (
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
                  <Tag className="h-3 w-3" />
                  {item.ndmc_submission_reference || `FS-${item.id}`}
                </div>
                <div>
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.submitted_by_name || "Submitted by PSR user"}
                  </p>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "fundedproposal_title",
        header: "Funded Proposal",
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="space-y-1">
              <p className="max-w-[260px] line-clamp-2 text-sm font-semibold text-slate-700">
                {item.fundedproposal_title ||
                  `Funding proposal #${item.fundedproposal}`}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" />
                {item.submitted_by_name || "Unknown submitter"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "output_type_name",
        header: "Output Type",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="border-none bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
          >
            {row.original.output_type_name ||
              `Output #${row.original.output_type}`}
          </Badge>
        ),
      },
      {
        accessorKey: "data_center_name",
        header: "Data Center",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              {row.original.data_center_name ||
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
          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                row.original.status === "approved"
                  ? "border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                  : row.original.status === "rejected"
                    ? "border-rose-200 bg-rose-50 text-[10px] font-bold uppercase tracking-wide text-rose-700"
                    : "border-amber-200 bg-amber-50 text-[10px] font-bold uppercase tracking-wide text-amber-700"
              }
            >
              {statusLabels[row.original.status]}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "submission_date",
        header: "Submitted",
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(row.original.submission_date)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              {row.original.id}
            </div>
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

  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
  }));

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
          <Card className="overflow-hidden rounded-3xl border border-muted-foreground/10 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-[320px] rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-[110px] rounded-xl" />
                  <Skeleton className="h-10 w-[140px] rounded-xl" />
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <DataTable
            columns={repositoryColumns}
            data={finalSubmissions}
            onRowClick={(item) => router.push(`/research/repository/${item.id}`)}
            searchKey="searchText"
            searchPlaceholder="Search submissions by title, reference, submitter, or status..."
            filterOptions={[
              {
                key: "status",
                label: "Status",
                options: statusOptions,
              },
            ]}
            initialColumnVisibility={{
              searchText: false,
            }}
            emptyMessage="No Research Found"
            emptyDescription="Try adjusting your search or status filter."
          />
        )}
      </div>
    </PageContainer>
  );
}
