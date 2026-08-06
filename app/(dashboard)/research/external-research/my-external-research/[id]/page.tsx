"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Lock,
  Mail,
  MessageSquare,
  Paperclip,
  PenLine,
  RotateCcw,
  Tag,
  User as UserIcon,
  Globe,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { useExternalResearch, useRecordExternalResearchDownload } from "@/hooks/useExternalResearch";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind, downloadConceptNoteAttachment } from "@/lib/utils/concept-note-attachments";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock; description: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: PenLine,
    description: "This external research entry is saved as a draft. Complete your details and submit when ready.",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    description: "Your external research entry has been reviewed and officially approved for the repository.",
  },
  rejected: {
    label: "Revisions Required",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: RotateCcw,
    description: "Your external research entry requires revisions. Please review committee feedback and resubmit.",
  },
  revision_requested: {
    label: "Revisions Required",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: RotateCcw,
    description: "Committee has requested modifications to your external research submission.",
  },
  pending: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Clock,
    description: "Your external research submission is currently under committee review.",
  },
  submitted: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Clock,
    description: "Your external research submission is currently under committee review.",
  },
};

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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
          <UserIcon className="h-3.5 w-3.5 text-primary shrink-0" />
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

function EmbeddedViewer({ url, title, onDownload }: { url: string; title: string; onDownload?: () => void }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground text-sm">No document file available for preview</p>
      </div>
    );
  }

  const resolvedUrl = resolveFileUrl(url) || url;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 shadow-xs bg-card">
        <PdfViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-[#ededed] dark:bg-muted/30 shadow-xs">
        <WordViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-12 text-center shadow-xs">
      <FileText className="h-10 w-10 text-primary" />
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          This document format cannot be embedded directly in the browser preview.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="text-xs font-semibold gap-1.5"
        onClick={() => {
          if (onDownload) onDownload();
          downloadConceptNoteAttachment(resolvedUrl, title);
        }}
      >
        <Download className="h-3.5 w-3.5" />
        Download File
      </Button>
    </div>
  );
}

export default function MyExternalResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const researchId = params?.id as string;

  const { data: research, isLoading } = useExternalResearch(researchId);
  const downloadDownloadMutation = useRecordExternalResearchDownload();

  const [copiedRef, setCopiedRef] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const refNum = `EXT-${researchId}`;
  const title = research?.title || `External Research #${researchId}`;
  const authors = research?.authors || "Unknown Authors";
  const institution = research?.institution || "Unknown Institution";
  const dataCenter = research?.data_center_detail?.name || research?.custom_data_center || "Standard Repository";
  const uploadedByName = research?.uploaded_by_name || research?.uploaded_by_detail?.full_name || "Submitter";

  const statusKey = (research?.approval_status || "pending").toLowerCase();
  const isPublished = research?.is_published ?? true;
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const isDraft = statusKey === "draft";
  const isRejectedOrRevision = statusKey === "rejected" || statusKey === "revision_requested";
  const isApproved = statusKey === "approved";
  const isUnderReview = statusKey === "submitted" || statusKey === "under_review" || statusKey === "pending";
  const researchLocked = isApproved || isUnderReview;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(refNum);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const documentList = useMemo(() => {
    if (!research) return [];
    const list: { key: string; label: string; url?: string | null; isExternal?: boolean }[] = [];

    // 1. Items array deliverables
    const items = research.items || (research as any).external_research_items || [];
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((it: any, idx: number) => {
        const name = it.output_type_name || it.outputTypeName || `Deliverable #${idx + 1}`;
        if (it.file) {
          list.push({
            key: `item-file-${it.id || idx}`,
            label: `${name} (File)`,
            url: it.file,
          });
        } else if (it.external_link || it.externalLink) {
          list.push({
            key: `item-link-${it.id || idx}`,
            label: `${name} (External Link)`,
            url: it.external_link || it.externalLink,
            isExternal: true,
          });
        }
      });
    }

    // 2. Legacy top-level fallback files
    const fullReport = research.full_report || (research as any).fullReport || research.file;
    if (fullReport && !list.some((d) => d.url === fullReport)) {
      list.push({ key: "full-report", label: "Full Research Report File", url: fullReport });
    }

    const policyBrief = research.policy_brief || (research as any).policyBrief;
    if (policyBrief && !list.some((d) => d.url === policyBrief)) {
      list.push({ key: "policy-brief", label: "Policy Brief File", url: policyBrief });
    }

    const supplementary = research.supplementary_document || (research as any).supplementaryDocument;
    if (supplementary && !list.some((d) => d.url === supplementary)) {
      list.push({ key: "supplementary", label: "Supplementary Document", url: supplementary });
    }

    const extLink = research.external_link || (research as any).externalLink;
    if (extLink && !list.some((d) => d.url === extLink)) {
      list.push({ key: "external-link", label: "External Publication Link", url: extLink, isExternal: true });
    }

    return list;
  }, [research]);

  const [activeDocKey, setActiveDocKey] = useState<string>("full-report");
  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  if (isLoading) {
    return (
      <PageContainer title="Loading External Research Details...">
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

  if (!research) {
    return (
      <PageContainer
        title="External Research Not Found"
        description="The requested external research record could not be loaded."
        actions={
          <Button variant="outline" onClick={() => router.push("/research/external-research/my-external-research")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Record Unavailable</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Could not load research entry details. Return to My External Research.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={title}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{refNum}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
          
          {statusKey === "approved" ? (
            isPublished ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] font-bold uppercase gap-1 px-2.5 py-0.5 shadow-none border">
                <Globe className="h-3 w-3 text-emerald-600 shrink-0" />
                Approved & Published
              </Badge>
            ) : (
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 text-[10px] font-bold uppercase gap-1 px-2.5 py-0.5 shadow-none border">
                <Building className="h-3 w-3 text-indigo-600 shrink-0" />
                Approved (Internal Only)
              </Badge>
            )
          ) : (
            <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border ml-1", cfg.className)}>
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </Badge>
          )}
          <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 border border-primary/20 gap-1.5 shadow-2xs">
            <Download className="h-3 w-3 text-primary" />
            {research?.download_count ?? 0} Downloads
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-2xs">
            <Link href="/research/external-research/my-external-research">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>

          {researchLocked ? (
            <Button
              size="sm"
              disabled
              className="shadow-2xs text-xs font-bold gap-1.5 cursor-not-allowed"
              title={isApproved ? "This entry has been approved and can no longer be edited." : "This entry is under review and cannot be edited."}
            >
              <Lock className="h-4 w-4" />
              {isApproved ? "Approved — Locked" : "Under Review — Locked"}
            </Button>
          ) : isDraft ? (
            <Link href={`/research/external-research/my-external-research/add?edit_id=${researchId}`}>
              <Button
                size="sm"
                className="shadow-2xs text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90"
              >
                <PenLine className="h-4 w-4" />
                Continue Editing
              </Button>
            </Link>
          ) : (
            <Link href={`/research/external-research/my-external-research/add?edit_id=${researchId}`}>
              <Button
                size="sm"
                className={cn(
                  "shadow-2xs text-xs font-bold gap-1.5",
                  isRejectedOrRevision ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                )}
              >
                <RotateCcw className="h-4 w-4" />
                {isRejectedOrRevision ? "Resubmit Entry" : "Edit / Update Entry"}
              </Button>
            </Link>
          )}
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

      {researchLocked && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-xs mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                External Research Approved — Editing Locked
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                This external research entry has been reviewed and officially approved. It can no longer be edited or resubmitted. Contact the research committee if you need to request a change.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Layout Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Content Column */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full flex flex-wrap sm:flex-nowrap justify-start h-auto sm:h-11 bg-muted/60 p-1 border border-border/50 rounded-xl gap-1 overflow-x-auto">
              {/* PRIMARY TAB 1: Abstract & Summary */}
              <TabsTrigger value="summary" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Abstract & Summary
              </TabsTrigger>

              {/* TAB 2: Uploaded Documents */}
              <TabsTrigger value="documents" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                Uploaded Documents
                {documentList.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold bg-primary/10 text-primary">
                    {documentList.length}
                  </Badge>
                )}
              </TabsTrigger>

              {/* TAB 3: Metadata Overview */}
              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Research Metadata
              </TabsTrigger>

              {/* TAB 4: Review Feedback */}
              <TabsTrigger value="reviews" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Review Feedback
              </TabsTrigger>
            </TabsList>

            {/* TAB 1 CONTENT: Abstract & Executive Summary */}
            <TabsContent value="summary" className="pt-5 space-y-6">
              <Card className="border border-border/60 shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5 text-primary" />
                    Abstract & Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5 text-xs leading-relaxed">
                  {research.abstract ? (
                    <div className="p-4 rounded-xl border border-border/50 bg-card space-y-1.5">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" /> Abstract
                      </h4>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{research.abstract}</p>
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-muted-foreground border border-dashed rounded-xl text-center">
                      No abstract provided.
                    </div>
                  )}

                  {research.executive_summary || (research as any).executiveSummary ? (
                    <div className="p-4 rounded-xl border border-border/50 bg-card space-y-1.5">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" /> Executive Summary
                      </h4>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {research.executive_summary || (research as any).executiveSummary}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-muted-foreground border border-dashed rounded-xl text-center">
                      No executive summary provided.
                    </div>
                  )}

                  {(research.keywords || research.doi) && (
                    <div className="space-y-3 pt-3 border-t">
                      {research.keywords && (
                        <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50 space-y-1.5">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Keywords & Subject Topics
                          </h4>
                          {renderKeywordsBadges(research.keywords)}
                        </div>
                      )}
                      {research.doi && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-foreground">DOI Identifier:</span>
                          <span className="font-mono bg-muted px-2.5 py-1 rounded-md border text-muted-foreground">{research.doi}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2 CONTENT: Documents */}
            <TabsContent value="documents" className="pt-5 space-y-6">
              {documentList.length === 0 ? (
                <Card className="border border-border/60 shadow-xs p-12 text-center">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-foreground">No Document Files Uploaded</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2 border-b pb-2 overflow-x-auto">
                    {documentList.map((doc) => (
                      <Button
                        key={doc.key}
                        variant={activeDocKey === doc.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveDocKey(doc.key)}
                        className="text-xs font-semibold"
                      >
                        {doc.label}
                      </Button>
                    ))}
                  </div>

                  {activeDoc?.url && (
                    <EmbeddedViewer
                      url={activeDoc.url}
                      title={activeDoc.label}
                      onDownload={() => {
                        if (researchId) downloadDownloadMutation.mutate({ id: researchId });
                      }}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 3 CONTENT: Metadata Overview */}
            <TabsContent value="overview" className="pt-5 space-y-6">
              <Card className="border border-border/60 shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    Research Metadata Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1 sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Title</p>
                      <p className="text-sm font-bold text-foreground leading-snug">{title}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1 sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5 text-primary" /> Authors
                      </p>
                      {renderAuthorsList(authors)}
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Institution & Department</p>
                      <p className="text-xs font-bold text-foreground">{institution} {research.department ? `(${research.department})` : ""}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Publication Year</p>
                      <p className="text-xs font-bold text-foreground">{research.year || "N/A"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Data Center</p>
                      <p className="text-xs font-bold text-foreground">{dataCenter}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Download className="h-3.5 w-3.5 text-primary" /> Total Downloads
                      </p>
                      <p className="text-xs font-bold text-primary tabular-nums">{research.download_count ?? 0}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evidence Tier</p>
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                        {research.graded_evidence ? research.graded_evidence.replace("_", " ") : "NOT GRADED"}
                      </Badge>
                    </div>
                    {research.keywords && (
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1.5 sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-emerald-600" /> Keywords & Research Subjects
                        </p>
                        {renderKeywordsBadges(research.keywords)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4 CONTENT: Reviews */}
            <TabsContent value="reviews" className="pt-5 space-y-6">
              <Card className="border border-border/60 shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-primary" />
                    Review Feedback & Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {research.approval_remarks || (research as any).approvalRemarks ? (
                    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Committee Remarks</p>
                      <p className="text-xs text-foreground whitespace-pre-wrap">
                        {research.approval_remarks || (research as any).approvalRemarks}
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      No review remarks recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card className="border border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Submitter Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex items-center gap-3.5">
              <Avatar className="h-11 w-11 border border-border/60 shadow-2xs">
                <AvatarFallback className="font-bold bg-primary/10 text-primary">
                  {getInitials(uploadedByName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{uploadedByName}</span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Submitted: {formatDateTime(research.uploaded_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
