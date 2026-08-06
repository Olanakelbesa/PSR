"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Info,
  Mail,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Tag,
  User,
  XCircle,
  GitCommit,
  History,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useExternalResearch, useRecordExternalResearchDownload } from "@/hooks/useExternalResearch";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import {
  downloadConceptNoteAttachment,
  getConceptNoteAttachmentKind,
} from "@/lib/utils/concept-note-attachments";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";

// ─── Status Config ────────────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200",
    icon: FileText,
  },
  submitted: {
    label: "Pending Review",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
    icon: Clock,
  },
  pending: {
    label: "Pending Review",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
    icon: Eye,
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200",
    icon: XCircle,
  },
  revision_requested: {
    label: "Revisions Required",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
    icon: RotateCcw,
  },
};

function StatusBadge({ value }: { value: string }) {
  const cfg = statusConfig[value?.toLowerCase()] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[11px] font-bold uppercase shadow-none border",
        cfg.className
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function DecisionBadge({ decision, isPublished }: { decision: string; isPublished?: boolean }) {
  if (decision === "approved") {
    if (isPublished) {
      return (
        <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border-emerald-300">
          <Globe className="w-3 h-3 text-emerald-600" /> Approved & Published
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 border-indigo-300">
        <Building className="w-3 h-3 text-indigo-600" /> Approved (Internal)
      </Badge>
    );
  }
  if (decision === "rejected") {
    return (
      <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border-rose-300">
        <XCircle className="w-3 h-3 text-rose-600" /> Rejected
      </Badge>
    );
  }
  if (decision === "minor_revision" || decision === "major_revision") {
    return (
      <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border-amber-300">
        <RotateCcw className="w-3 h-3 text-amber-600" /> Revisions Required
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border-slate-300">
      <Clock className="w-3 h-3" /> {decision || "Pending"}
    </Badge>
  );
}

function renderAuthorsList(authorsStr?: string | null) {
  if (!authorsStr || !authorsStr.trim()) {
    return <span className="text-xs text-muted-foreground italic">No authors listed</span>;
  }

  let cleanStr = authorsStr.trim();
  if (/^authors\s*:/i.test(cleanStr)) {
    cleanStr = cleanStr.replace(/^authors\s*:/i, "").trim();
  }

  const authorList = cleanStr
    .split(/[,;\n]/)
    .map((a) => a.trim())
    .filter(Boolean);

  if (authorList.length === 0) {
    return <span className="text-xs font-bold text-foreground">{authorsStr}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {authorList.map((name, idx) => (
        <Badge
          key={idx}
          variant="secondary"
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 gap-1.5 shadow-2xs hover:bg-primary/15 transition-colors"
        >
          <User className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{name}</span>
        </Badge>
      ))}
    </div>
  );
}

function renderKeywordsBadges(keywordsStr?: string | null) {
  if (!keywordsStr || !keywordsStr.trim()) {
    return <span className="text-xs text-muted-foreground italic">No keywords provided</span>;
  }

  let cleanStr = keywordsStr.trim();
  if (/^keywords\s*:/i.test(cleanStr)) {
    cleanStr = cleanStr.replace(/^keywords\s*:/i, "").trim();
  }

  const kwList = cleanStr
    .split(/[,;\n]/)
    .map((k) => k.trim())
    .filter(Boolean);

  if (kwList.length === 0) {
    return <span className="text-xs font-medium text-foreground">{keywordsStr}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {kwList.map((kw, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1.5 shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <Tag className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{kw}</span>
        </Badge>
      ))}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ExternalResearchApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();

  const researchId = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  }, [params]);

  const { data: research, isLoading } = useExternalResearch(researchId);
  const downloadMutation = useRecordExternalResearchDownload();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────
  const title = research?.title || "Untitled External Research";
  const authors = research?.authors || "Unknown Authors";
  const institution = research?.institution || "Unknown Institution";
  const department = research?.department;
  const year = research?.year;
  const doi = research?.doi;
  const keywords = research?.keywords;
  const abstract = research?.abstract;
  const executiveSummary =
    research?.executive_summary || (research as any)?.executiveSummary;
  const status = (
    research?.approval_status ||
    (research as any)?.approvalStatus ||
    "pending"
  ).toLowerCase();
  const isPublished =
    research?.is_published ?? (research as any)?.isPublished ?? false;
  const gradedEvidence =
    research?.graded_evidence || (research as any)?.gradedEvidence || "not_graded";

  const uploadedByName =
    research?.uploaded_by_name ||
    (research as any)?.uploadedByName ||
    research?.uploaded_by_detail?.full_name ||
    "Submitter";
  const uploadedByEmail =
    research?.uploaded_by_detail?.email ||
    (research as any)?.uploadedByDetail?.email;
  const uploadedByPhoto = resolveFileUrl(
    research?.uploaded_by_detail?.photo_url ||
      (research as any)?.uploadedByDetail?.photoUrl
  );
  const submitterInitials = getInitials(uploadedByName, "SB");

  const dataCenterName =
    research?.data_center_detail?.name ||
    (research as any)?.dataCenterDetail?.name ||
    research?.custom_data_center ||
    (research as any)?.customDataCenter ||
    "Standard Repository";

  const outputTypesDetail = research?.output_types_detail || [];

  // Items (deliverables)
  const items = useMemo(() => {
    const raw = research?.items || (research as any)?.external_research_items || [];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [];
  }, [research]);

  const approvals = research?.approvals || [];

  const refId = `EXT-#${research?.id || researchId}`;

  const handleCopyId = () => {
    if (!refId) return;
    navigator.clipboard.writeText(refId);
    setCopiedId(true);
    toast.success("Reference ID copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePreviewDocument = (url: string, docTitle: string) => {
    if (!url) return;
    setPreviewUrl(resolveFileUrl(url) || url);
    setPreviewTitle(docTitle);
    setPreviewOpen(true);
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading research details...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!research) {
    return (
      <PageContainer title="External Research Not Found">
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Record Unavailable
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This external research entry does not exist or you do not have
                permission to view it.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  router.push(
                    "/research/external-research/external-research-approval"
                  )
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Approval Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer
        title={title}
        description={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-muted-foreground">
              Reference:
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
              title="Click to copy reference ID"
            >
              <span>{refId}</span>
              {copiedId ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              )}
            </button>
            <StatusBadge value={status} />
            {status === "approved" && (
              isPublished ? (
                <Badge variant="outline" className="gap-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border-emerald-300">
                  <Globe className="h-3 w-3 text-emerald-600" /> Published
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border-indigo-300">
                  <Building className="h-3 w-3 text-indigo-600" /> Internal Only
                </Badge>
              )
            )}
            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 border border-primary/20 gap-1.5 shadow-2xs">
              <Download className="h-3 w-3 text-primary" />
              {research?.download_count ?? 0} Downloads
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  "/research/external-research/external-research-approval"
                )
              }
              className="shadow-2xs"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>

            <Button
              asChild
              size="sm"
              className="shadow-2xs text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Link
                href={`/research/external-research/external-research-approval/${research.id}/evaluate`}
              >
                <Award className="h-4 w-4" />
                Evaluate & Grade
              </Link>
            </Button>
          </div>
        }
      >
        <PdfViewerDialog
          isOpen={previewOpen}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          url={previewUrl}
          pdfUrl={previewUrl}
          title={previewTitle}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
          {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
          <div className="space-y-6 min-w-0">
            {/* Abstract & Executive Summary */}
            <Card className="border border-border/70 shadow-xs overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Abstract & Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5 text-xs leading-relaxed">
                {abstract ? (
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-card">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" /> Abstract
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {abstract}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-muted-foreground border border-dashed rounded-xl text-center">
                    No abstract text provided.
                  </div>
                )}
                {executiveSummary ? (
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-card">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" /> Executive
                      Summary
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {executiveSummary}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-muted-foreground border border-dashed rounded-xl text-center">
                    No executive summary provided.
                  </div>
                )}
                {(keywords || doi) && (
                  <div className="space-y-3 pt-3 border-t">
                    {keywords && (
                      <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50 space-y-1.5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Keywords & Subject Topics
                        </h4>
                        {renderKeywordsBadges(keywords)}
                      </div>
                    )}
                    {doi && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-foreground">DOI Identifier:</span>
                        <span className="font-mono bg-muted px-2.5 py-1 rounded-md border text-muted-foreground">
                          {doi}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Research Metadata Overview */}
            <Card className="border border-border/70 shadow-xs overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Research Metadata Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Title
                    </p>
                    <p className="text-sm font-bold text-foreground leading-snug">
                      {title}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-primary" /> Authors
                    </p>
                    {renderAuthorsList(authors)}
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Institution & Department
                    </p>
                    <p className="text-xs font-bold text-foreground">
                      {institution}{" "}
                      {department ? `(${department})` : ""}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Publication Year
                    </p>
                    <p className="text-xs font-bold text-foreground">
                      {year || "N/A"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Target Data Center
                    </p>
                    <p className="text-xs font-bold text-foreground">
                      {dataCenterName}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Evidence Tier
                    </p>
                    <Badge
                      variant="secondary"
                      className="font-bold text-[10px] uppercase"
                    >
                      {gradedEvidence
                        ? gradedEvidence.replace(/_/g, " ")
                        : "Not Graded"}
                    </Badge>
                  </div>
                  {keywords && (
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1.5 sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-emerald-600" /> Keywords & Research Subjects
                      </p>
                      {renderKeywordsBadges(keywords)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submitted Deliverable Files & Links */}
            <Card className="border border-border/70 shadow-xs overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary" />
                  Submitted Deliverable Files & Links
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold font-mono"
                >
                  {items.length} Item{items.length !== 1 ? "s" : ""}
                </Badge>
              </CardHeader>
              <CardContent className="p-5">
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item: any, idx: number) => {
                      const typeName =
                        item.output_type_name ||
                        item.outputTypeName ||
                        `Deliverable #${idx + 1}`;
                      const fileUrl = item.file
                        ? resolveFileUrl(item.file)
                        : null;
                      const extLink =
                        item.external_link || item.externalLink || null;
                      const kind = fileUrl
                        ? getConceptNoteAttachmentKind(fileUrl)
                        : null;

                      return (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                                fileUrl
                                  ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800"
                                  : "bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/30 dark:border-violet-800"
                              )}
                            >
                              {fileUrl ? (
                                <FileText className="w-4 h-4" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {typeName}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {fileUrl
                                  ? `File: ${kind?.toUpperCase() || "Document"}`
                                  : extLink
                                  ? extLink
                                  : "No attachment"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {fileUrl && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePreviewDocument(
                                      item.file,
                                      typeName
                                    )
                                  }
                                  className="h-7 text-[11px] font-semibold gap-1"
                                >
                                  <Eye className="w-3 h-3 text-primary" />{" "}
                                  Preview
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    if (researchId) downloadMutation.mutate({ id: researchId });
                                    downloadConceptNoteAttachment(
                                      fileUrl,
                                      typeName
                                    );
                                  }}
                                  className="h-7 text-[11px] font-semibold gap-1"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </Button>
                              </>
                            )}
                            {extLink && (
                              <a
                                href={extLink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[11px] font-semibold gap-1 text-primary border-primary/30"
                                >
                                  <ExternalLink className="w-3 h-3" /> Open
                                  Link
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    <Paperclip className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                    No per-type deliverable items attached.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Submitter Profile Card */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Submitter Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex items-center gap-3.5">
                <Avatar className="h-11 w-11 border border-border/60 shrink-0">
                  {uploadedByPhoto && (
                    <AvatarImage src={uploadedByPhoto} alt={uploadedByName} />
                  )}
                  <AvatarFallback className="font-bold bg-primary/10 text-primary">
                    {submitterInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">
                    {uploadedByName}
                  </p>
                  {uploadedByEmail && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground/70" />{" "}
                      {uploadedByEmail}
                    </p>
                  )}
                  {research?.uploaded_at && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Submitted: {formatDate(research.uploaded_at)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Status
                  </span>
                  <StatusBadge value={status} />
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Evidence Tier
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold uppercase"
                  >
                    {gradedEvidence.replace(/_/g, " ")}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Data Center
                  </span>
                  <span className="font-bold text-foreground text-right truncate max-w-[160px]">
                    {dataCenterName}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Version
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    v{research?.version || 1}
                  </Badge>
                </div>
                {research?.download_count != null && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Downloads
                      </span>
                      <span className="font-bold text-foreground">
                        {research.download_count}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Approval Audit Trail */}
            {Array.isArray(approvals) && approvals.length > 0 && (
              <Card className="border border-border/70 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        Evaluation Audit Trail
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Tracked history of reviewer evaluations.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px] font-bold"
                  >
                    <GitCommit className="w-3 h-3 text-primary" />
                    {approvals.length}{" "}
                    {approvals.length === 1 ? "Entry" : "Entries"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {approvals.map((app: any, idx: number) => {
                      const passNumber = approvals.length - idx;
                      const dec = (app.decision || "").toLowerCase();
                      const isPub = app.ready_for_repository ?? false;
                      const reviewerDisplay =
                        app.reviewer_name || app.reviewer_email || "Reviewer";
                      const dateStr = app.reviewed_at;

                      return (
                        <div key={app.id || idx} className="relative group">
                          <div
                            className={cn(
                              "absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center transition-transform group-hover:scale-110",
                              dec === "approved"
                                ? isPub
                                  ? "border-emerald-500 text-emerald-600"
                                  : "border-indigo-500 text-indigo-600"
                                : "border-rose-500 text-rose-600"
                            )}
                          >
                            <GitCommit className="w-3 h-3" />
                          </div>

                          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  Evaluation #{passNumber}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-muted-foreground/70" />
                                  {formatFullDateTime(dateStr)}
                                </span>
                              </div>
                              <DecisionBadge
                                decision={dec}
                                isPublished={isPub}
                              />
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                              <User className="w-3 h-3 text-primary" />
                              <span>
                                Evaluated by:{" "}
                                <strong className="text-foreground">
                                  {reviewerDisplay}
                                </strong>
                              </span>
                            </div>
                            {(app.recommendation || app.report_comments) && (
                              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs text-foreground/90 space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-primary" />{" "}
                                  Reviewer Feedback:
                                </p>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                  {app.recommendation || app.report_comments}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Committee Remarks Card */}
            {(research?.approval_remarks ||
              (research as any)?.approvalRemarks) && (
              <Card className="border border-border/60 shadow-xs">
                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Committee
                    Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {research.approval_remarks ||
                      (research as any)?.approvalRemarks}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
