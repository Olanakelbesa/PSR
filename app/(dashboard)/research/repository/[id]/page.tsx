"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  Link2,
  Loader2,
  Paperclip,
  Pencil,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { DetailLayout, PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { useFinalSubmission, useRecordFinalSubmissionDownload } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  downloadRemoteFile,
  extractFileName,
  openRemoteFile,
  resolveFileUrl,
} from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { tokenStorage } from "@/api/client";
import type { FinalSubmissionDownloadFileType } from "@/types/final-submission";
import { canEditFinalSubmission } from "@/types/final-submission";

const STATUS_DISPLAY: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  },
  under_review: {
    label: "Under Review",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
  },
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

function fileNameFromPath(filePath?: string | null) {
  if (!filePath) return "No file attached";
  return filePath.split("/").pop() || filePath;
}

function getUserAvatarUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl || photoUrl === "#") return undefined;
  return resolveFileUrl(photoUrl) || photoUrl;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatBudget(val: any): string {
  if (!val) return "N/A";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `ETB ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getGradeBadgeStyle(gradeName?: string | null) {
  const g = (gradeName || "").toLowerCase();
  if (g.includes("excellent")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (g.includes("very good")) {
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
  }
  if (g.includes("good")) {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
  }
  if (g.includes("satisfactory")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
  }
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
}

function EmbeddedViewer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground text-sm">No document available for preview</p>
      </div>
    );
  }

  const resolvedUrl = resolveFileUrl(url) || url;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-primary/20 shadow-xs bg-card">
        <PdfViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-[#ededed] dark:bg-muted/30 shadow-xs">
        <WordViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-12 text-center shadow-xs">
      <FileText className="h-10 w-10 text-primary" />
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          This document type cannot be embedded directly in the browser preview.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Open File
          </a>
        </Button>
        <Button asChild size="sm">
          <a href={resolvedUrl} download>
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <PageContainer title="Research Repository" description="Loading repository details...">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}

function NotFoundState() {
  return (
    <PageContainer title="Research Not Found">
      <div className="py-16 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h3 className="text-base font-bold text-foreground">
          Final submission not found
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The requested record does not exist or has been archived.
        </p>
        <Button asChild className="mt-6">
          <Link href="/research/repository">Back to Repository</Link>
        </Button>
      </div>
    </PageContainer>
  );
}

export default function ResearchRepositoryDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data: item, isLoading } = useFinalSubmission(id);
  const recordDownload = useRecordFinalSubmissionDownload();

  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [activeDocKey, setActiveDocKey] = useState<string>("full_report");

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewDialogUrl, setPreviewDialogUrl] = useState<string | null>(null);
  const [previewDialogTitle, setPreviewDialogTitle] = useState("");

  const handleCopyRef = useCallback((refText: string) => {
    if (!refText) return;
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  }, []);

  const handleOpenFile = useCallback(
    async (
      fileType: FinalSubmissionDownloadFileType | string,
      filePath?: string | null,
    ) => {
      if (!filePath) {
        toast.error("No file is attached for this document.");
        return;
      }

      setOpeningKey(fileType);
      try {
        await openRemoteFile(filePath, { token: tokenStorage.get() });
      } catch {
        toast.error("Failed to open file.");
      } finally {
        setOpeningKey(null);
      }
    },
    [],
  );

  const handleDownloadFile = useCallback(
    async (
      fileType: FinalSubmissionDownloadFileType | string,
      filePath?: string | null,
    ) => {
      if (!filePath) {
        toast.error("No file is attached for this document.");
        return;
      }

      setDownloadingKey(fileType);
      try {
        let fileUrl = filePath;

        if (id && ["full_report", "policy_brief", "supplementary_document"].includes(fileType)) {
          try {
            const result = await recordDownload.mutateAsync({
              id: Number(id),
              fileType: fileType as FinalSubmissionDownloadFileType,
            });
            fileUrl = result.fileUrl || fileUrl;
          } catch {
            // Still download if the count endpoint is unavailable.
          }
        }

        await downloadRemoteFile(fileUrl, extractFileName(filePath), {
          token: tokenStorage.get(),
        });
      } catch {
        toast.error("Failed to download file.");
      } finally {
        setDownloadingKey(null);
      }
    },
    [id, recordDownload],
  );

  const fullReportUrl = item?.full_report || item?.terminal_report_attachment || null;
  const proposalFileUrl = item?.fundedproposal_detail?.proposal_file || null;

  // Main submission files filtered to ONLY existing files
  const mainDocEntries = useMemo(() => {
    if (!item) return [];
    return [
      {
        key: "full_report",
        label: "Full Report",
        file: fullReportUrl,
        fileType: "full_report" as const,
      },
      {
        key: "proposal_file",
        label: "Proposal Document",
        file: proposalFileUrl,
        fileType: "proposal_file" as const,
      },
      {
        key: "policy_brief",
        label: "Policy Brief",
        file: item.policy_brief,
        fileType: "policy_brief" as const,
      },
      {
        key: "supplementary_document",
        label: "Supplementary Document",
        file: item.supplementary_document,
        fileType: "supplementary_document" as const,
      },
    ].filter((entry) => Boolean(entry.file));
  }, [item, fullReportUrl, proposalFileUrl]);

  const gradedItems = useMemo(() => {
    return item?.items || [];
  }, [item]);

  // Combined available files for sub-navigation preview
  const documentList = useMemo(() => {
    const list: { key: string; label: string; filePath?: string | null }[] = [];
    mainDocEntries.forEach((doc) => {
      list.push({ key: doc.key, label: doc.label, filePath: doc.file });
    });
    gradedItems.forEach((it: any, idx: number) => {
      if (it.file) {
        list.push({
          key: `item_${it.id || idx}`,
          label: it.terminal_type_name || it.terminalTypeName || `Deliverable #${idx + 1}`,
          filePath: it.file,
        });
      }
    });
    return list;
  }, [mainDocEntries, gradedItems]);

  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!item) {
    return <NotFoundState />;
  }

  // PI & Submitter resolution
  const pi = item.pi || item.submitted_by_detail || {};
  const piName = pi.full_name || item.submitted_by_name || "emabm temer Temesgen";
  const piEmail = pi.email || item.submitted_by_detail?.email || "-";
  const piAvatar = getUserAvatarUrl(pi.photo_url || item.submitted_by_detail?.photo_url);

  // Funded proposal detail resolution
  const fpDetail = item.fundedproposal_detail;
  const fundedRef = fpDetail?.reference_number || (item.fundedproposal ? `PSR-${item.fundedproposal}` : "PSR-20260725150114");
  const fundedTitle = fpDetail?.title || item.title;
  const fundedAward = fpDetail?.total_award_amount;

  // Metadata labels
  const outputTypeLabel = item.output_type_detail?.name || (item.output_type ? `Output #${item.output_type}` : "Full Report");
  const dataCenterLabel = item.data_center_detail?.name || (item.data_center ? `Center #${item.data_center}` : "Ethiotelecom Data Center");
  const referenceNumber = item.ndmc_submission_reference || `FS-${item.id}`;

  const statusTone = STATUS_DISPLAY[item.status] ?? {
    label: item.status ? item.status.replace(/_/g, " ") : "Draft",
    className: "bg-muted text-muted-foreground border-border",
  };

  const canEdit = canEditFinalSubmission(item.status);

  return (
    <DetailLayout
      title={item.title}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={() => handleCopyRef(referenceNumber)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{referenceNumber}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>

          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 border shadow-none text-[10px] font-bold uppercase tracking-wide ml-1",
              statusTone.className,
            )}
          >
            {statusTone.label}
          </Badge>

          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 border border-border/50"
          >
            v{item.version ?? 1}
          </Badge>

          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 border border-primary/20"
          >
            {item.download_count ?? 0} Downloads
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          {canEdit ? (
            <Button asChild size="sm" className="bg-primary text-white shadow-xs">
              <Link href={`/research/repository/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm" className="shadow-xs">
            <Link href="/research/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Archive
            </Link>
          </Button>
        </div>
      }
      sidebar={
        <>
          {/* Submission Specs Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80 dark:bg-slate-900/40 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Submission Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase shadow-none border",
                    statusTone.className,
                  )}
                >
                  {statusTone.label}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Version</span>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold text-[10px] px-2.5"
                >
                  v{item.version ?? 1}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Output Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {outputTypeLabel}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Data Center</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {dataCenterLabel}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Total Downloads</span>
                <span className="font-bold tabular-nums text-primary text-xs">
                  {item.download_count ?? 0}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Submission Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {formatDate(item.submission_date)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground font-medium">Data Sharing Checklist</span>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {item.data_sharing_checklist_completed ? "Completed" : "Incomplete"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Document Download Card */}
          <Card className="border border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <Download className="h-4 w-4" />
                Quick Document Download
              </CardTitle>
              <CardDescription className="text-xs">
                Download research output or approved proposal files.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              {fullReportUrl ? (
                <Button
                  type="button"
                  className="w-full shadow-xs gap-2 font-bold text-xs uppercase tracking-wider"
                  disabled={downloadingKey !== null}
                  onClick={() => void handleDownloadFile("full_report", fullReportUrl)}
                >
                  {downloadingKey === "full_report" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download Full Report
                </Button>
              ) : null}

              {proposalFileUrl ? (
                <Button
                  type="button"
                  variant={fullReportUrl ? "outline" : "default"}
                  className="w-full shadow-xs gap-2 font-bold text-xs uppercase tracking-wider"
                  disabled={downloadingKey !== null}
                  onClick={() => void handleDownloadFile("proposal_file", proposalFileUrl)}
                >
                  {downloadingKey === "proposal_file" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download Proposal File
                </Button>
              ) : null}

              {!fullReportUrl && !proposalFileUrl && (
                <Button
                  type="button"
                  disabled
                  className="w-full shadow-xs gap-2 font-bold text-xs uppercase tracking-wider"
                >
                  No Document Available
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      }
    >
      {/* Main Content Tabs */}
      <Tabs defaultValue="narrative" className="w-full">
        <TabsList className="w-full flex flex-wrap sm:flex-nowrap justify-start h-auto sm:h-11 bg-muted/60 p-1 border border-border/50 rounded-xl gap-1 overflow-x-auto">
          <TabsTrigger value="narrative" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
            <FileText className="h-3.5 w-3.5" />
            Abstract & Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
            <Layers className="h-3.5 w-3.5" />
            Output & Data Center
          </TabsTrigger>
          <TabsTrigger value="pi-proposal" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
            <User className="h-3.5 w-3.5" />
            Funded Proposal & PI
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
            <FolderOpen className="h-3.5 w-3.5" />
            Document Attachments
            {documentList.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                {documentList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Abstract & Executive Summary ────────────────────────────────────────── */}
        <TabsContent value="narrative" className="pt-5 space-y-6">
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-4.5 w-4.5 text-primary" />
                Abstract & Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 p-6 md:p-8">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Abstract
                </h4>
                <div className="rounded-xl border border-border/50 bg-slate-50/50 dark:bg-slate-900/20 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {item.abstract || "No abstract provided."}
                </div>
              </div>

              <div className="space-y-2 border-t pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  Executive Summary
                </h4>
                <div className="rounded-xl border border-border/50 bg-slate-50/50 dark:bg-slate-900/20 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {item.executive_summary || "No executive summary provided."}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Output & Data Center Details ────────────────────────────────────────── */}
        <TabsContent value="details" className="pt-5 space-y-6">
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-primary" />
                Output & Data Center Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2 p-6 md:p-8">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-primary" />
                  Output Type Detail
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {outputTypeLabel}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Data Center Detail
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {dataCenterLabel}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Digital Object Identifier (DOI)
                </p>
                {item.doi ? (
                  <a
                    href={item.doi.startsWith("http") ? item.doi : `https://doi.org/${item.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{item.doi}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No DOI assigned</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  External Link
                </p>
                {item.external_link ? (
                  <a
                    href={item.external_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{item.external_link}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No external link specified</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-1 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  NDMC Reference Field
                </p>
                <p className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                  {referenceNumber}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Funded Proposal & PI Information ────────────────────────────────────────── */}
        <TabsContent value="pi-proposal" className="pt-5 space-y-6">
          {/* PI Info Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-primary" />
                Principal Investigator (PI) & Submitter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border/50 bg-slate-50/60 dark:bg-slate-900/40">
                <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-xs">
                  <AvatarImage src={piAvatar} alt={piName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {getInitials(piName)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {piName}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase bg-primary/10 text-primary border-primary/20">
                      Principal Investigator
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>{piEmail}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funded Proposal Details Card */}
          <Card className="border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-background shadow-sm">
            <CardHeader className="pb-3 border-b border-emerald-500/20">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <Wallet className="h-4.5 w-4.5 text-emerald-600" />
                Associated Funded Proposal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2 p-6 md:p-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Funded Proposal Reference Number
                </p>
                <p className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {fundedRef}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Award Amount
                </p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {formatBudget(fundedAward)}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-emerald-500/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Proposal Title
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {fundedTitle}
                </p>
              </div>

              {proposalFileUrl && (
                <div className="sm:col-span-2 pt-3 border-t border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Original Proposal Document</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 rounded-lg border-emerald-300 text-emerald-800 dark:text-emerald-300"
                    onClick={() => void handleDownloadFile("proposal_file", proposalFileUrl)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Proposal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Document Attachments & Links ────────────────────────────────────────── */}
        <TabsContent value="documents" className="pt-5 space-y-6">
          <Card className="border border-muted-foreground/15 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/70 dark:bg-slate-900/40">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200">
                <FolderOpen className="h-5 w-5 text-primary" />
                Document Attachments & Approved Deliverables
              </CardTitle>
              <CardDescription className="text-xs">
                Access, preview, or download research outputs and evaluation deliverables.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8 p-6 md:p-8">
              {/* 1. Graded Terminal Report Deliverables Section */}
              {gradedItems.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Award className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Graded Terminal Report Deliverables
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Officially evaluated and approved output items from terminal report grading.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      {gradedItems.length} - Approved {gradedItems.length === 1 ? "Item" : "Items"}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {gradedItems.map((it: any, idx: number) => {
                      const itemFile = it.file;
                      const itemLink = it.external_link || it.externalLink;
                      const typeName = it.terminal_type_name || it.terminalTypeName || `Deliverable #${idx + 1}`;
                      const gradeName = it.grade_name || it.gradeName;
                      const isDocActive = activeDocKey === `item_${it.id || idx}`;

                      return (
                        <div
                          key={`deliv-${it.id || idx}`}
                          className={cn(
                            "flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200",
                            isDocActive
                              ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                              : "border-border/60 bg-card hover:bg-slate-50/70 dark:hover:bg-slate-900/30",
                          )}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
                                  {itemLink && !itemFile ? (
                                    <Globe className="h-4.5 w-4.5 text-primary" />
                                  ) : (
                                    <FileText className="h-4.5 w-4.5 text-primary" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {typeName}
                                  </h5>
                                  <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                                    {itemFile ? fileNameFromPath(itemFile) : itemLink ? "External URL Link" : "Deliverable Output"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Evaluation Grade Pill */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {gradeName ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
                                    getGradeBadgeStyle(gradeName),
                                  )}
                                >
                                  <Award className="h-3 w-3 mr-1" />
                                  {gradeName}
                                </Badge>
                              ) : null}

                              {itemFile && (
                                <Badge variant="secondary" className="text-[10px] font-semibold bg-muted/80 text-muted-foreground border border-border/40 gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  File Attached
                                </Badge>
                              )}

                              {itemLink && (
                                <Badge variant="secondary" className="text-[10px] font-semibold bg-muted/80 text-muted-foreground border border-border/40 gap-1">
                                  <Link2 className="h-3 w-3" />
                                  Web Link
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Footer */}
                          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/40 justify-end">
                            {itemFile && (
                              <>
                                <Button
                                  type="button"
                                  variant={isDocActive ? "default" : "outline"}
                                  size="sm"
                                  className="h-8 text-xs rounded-xl font-semibold gap-1.5 flex-1"
                                  onClick={() => setActiveDocKey(`item_${it.id || idx}`)}
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Preview
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs rounded-xl gap-1.5"
                                  onClick={() => downloadRemoteFile(itemFile, extractFileName(itemFile))}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </Button>
                              </>
                            )}
                            {itemLink && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs rounded-xl gap-1.5"
                                onClick={() => window.open(itemLink, "_blank", "noopener,noreferrer")}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open Link
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State when zero files exist */}
              {mainDocEntries.length === 0 && gradedItems.length === 0 && (
                <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
                  <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-bold text-foreground">No Document Attachments Found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    There are no research report documents or graded deliverables attached to this repository record.
                  </p>
                </div>
              )}

              {/* 3. Document Preview Sub-Navigation & Inline Viewer */}
              {activeDoc?.filePath ? (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/40 p-3 rounded-2xl border border-border/60">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground">
                        Document Viewer:
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {activeDoc.label}
                      </span>
                    </div>

                    {documentList.length > 1 && (
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        {documentList.map((doc) => (
                          <Button
                            key={`subnav-${doc.key}`}
                            type="button"
                            variant={doc.key === activeDocKey ? "default" : "ghost"}
                            size="sm"
                            className="h-7 text-[11px] font-semibold rounded-lg px-2.5 shrink-0"
                            onClick={() => setActiveDocKey(doc.key)}
                          >
                            {doc.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <EmbeddedViewer
                    url={activeDoc.filePath}
                    title={activeDoc.label}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PdfViewerDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        pdfUrl={previewDialogUrl ?? undefined}
        title={previewDialogTitle}
      />
    </DetailLayout>
  );
}
