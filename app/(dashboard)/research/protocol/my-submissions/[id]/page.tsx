"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User as UserIcon,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { protocolService } from "@/api/services/protocol.service";
import { getProposalById } from "@/api/services/proposals.service";
import type { ProtocolRecord, ProtocolStatus } from "@/types/protocol";
import { ProtocolFormModal } from "@/components/features/protocol/protocol-form-modal";
import type { ProposalDetail as Proposal } from "@/types/proposal";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { downloadConceptNoteAttachment, getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ProtocolStatus,
  { label: string; className: string; icon: typeof Clock; description: string }
> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock,
    description: "Please upload your primary protocol file to initiate evaluation.",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: ShieldCheck,
    description: "Your protocol submission is currently under PSR review and determination.",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    description: "Your protocol has been approved! Your proposal has advanced to funding recommendation.",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: XCircle,
    description: "Your submission was declined. Please review comments and upload an updated protocol file.",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    icon: RefreshCcw,
    description: "You have resubmitted an updated protocol file for committee re-evaluation.",
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
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function EmbeddedViewer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground text-sm">No document available for preview</p>
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
          This document type cannot be embedded directly in the browser preview.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => downloadConceptNoteAttachment(resolvedUrl, title)}
      >
        <Download className="mr-2 h-3.5 w-3.5" />
        Download File
      </Button>
    </div>
  );
}

export default function MyProtocolSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = Number(params.id);

  const [protocol, setProtocol] = useState<ProtocolRecord | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);

  // Update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [otherDocument, setOtherDocument] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!protocolId || Number.isNaN(protocolId)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const record = await protocolService.getById(protocolId);
      setProtocol(record);
      if (record.proposal) {
        try {
          const propDetail = await getProposalById(String(record.proposal));
          setProposal(propDetail);
        } catch {
          // Ignore error
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load protocol submission detail.");
    } finally {
      setIsLoading(false);
    }
  }, [protocolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyRef = () => {
    if (!protocol) return;
    const refText = protocol.referenceNumber || protocol.reference_number || `PROT-${protocol.id}`;
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocol) return;
    if (!protocolFile && !otherDocument) {
      setFormError("Please select at least one file to upload.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const updated = await protocolService.update(protocol.id, {
        protocol_file: protocolFile ?? undefined,
        other_document: otherDocument ?? undefined,
      });

      setProtocol(updated);
      toast.success("Protocol files updated successfully!");
      setIsUpdateModalOpen(false);
      setProtocolFile(null);
      setOtherDocument(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update protocol files.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = protocol?.status || "pending_review";
  const cfg = statusConfig[status] || statusConfig.pending_review;
  const StatusIcon = cfg.icon;

  const canEdit = status === "pending_review" || status === "rejected" || status === "pending_submission";

  const documentList = useMemo(() => {
    if (!protocol) return [];
    const list: { key: string; label: string; filePath?: string | null }[] = [];

    const mainFile = protocol.protocolFile || protocol.protocol_file;
    if (mainFile) {
      list.push({ key: "protocol-file", label: "Primary Protocol File", filePath: mainFile });
    }

    const otherDoc = protocol.otherDocument || protocol.other_document;
    if (otherDoc) {
      list.push({ key: "other-document", label: "Supporting Document", filePath: otherDoc });
    }

    if (protocol.attachments && protocol.attachments.length > 0) {
      protocol.attachments.forEach((att, idx) => {
        list.push({
          key: `attachment-${att.id}`,
          label: att.filename || `Attachment ${idx + 1}`,
          filePath: att.file || att.fileUrl || att.file_url,
        });
      });
    }

    const propFile = protocol.proposalFile || protocol.proposal_file || proposal?.proposalFile || (proposal as any)?.proposal_file;
    if (propFile) {
      list.push({ key: "proposal-file", label: "Original Proposal Document", filePath: propFile });
    }

    return list;
  }, [protocol, proposal]);

  const [activeDocKey, setActiveDocKey] = useState<string>("protocol-file");
  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  if (isLoading) {
    return (
      <PageContainer title="Loading Protocol Submission...">
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

  if (!protocol) {
    return (
      <PageContainer
        title="Protocol Submission Not Found"
        description="The requested protocol submission could not be loaded."
        actions={
          <Button variant="outline" onClick={() => router.push("/research/protocol/my-submissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Protocol Record Unavailable</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Could not load submission details. Return to My Protocol Submissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const hasReviewRecord = Boolean(protocol.decisionRemarks || protocol.decision_remarks);

  return (
    <PageContainer
      title={protocol.proposalTitle || protocol.proposal_title || proposal?.title || "My Protocol Submission"}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{protocol.referenceNumber || protocol.reference_number || `PROT-${protocol.id}`}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
          <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border ml-1", cfg.className)}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-xs">
            <Link href="/research/protocol/my-submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setIsUpdateModalOpen(true)} className="shadow-xs">
              <Upload className="mr-2 h-4 w-4" />
              Update / Resubmit Files
            </Button>
          )}
        </div>
      }
    >
      {/* ── Main Layout: Standard 2-Column Grid (Mirrored from IRB My Submissions Detail) ──────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Content Column */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full flex flex-wrap sm:flex-nowrap justify-start h-auto sm:h-11 bg-muted/60 p-1 border border-border/50 rounded-xl gap-1 overflow-x-auto">
              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FileText className="h-3.5 w-3.5" />
                Overview & Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FolderOpen className="h-3.5 w-3.5" />
                Uploaded Documents
                {documentList.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    {documentList.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <MessageSquare className="h-3.5 w-3.5" />
                Review Feedback
                {hasReviewRecord && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    1
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab Content ────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-5 space-y-6">
              {/* Proposal Information Card */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    Proposal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Proposal Title
                      </p>
                      <p className="text-sm font-semibold leading-snug">
                        {protocol.proposalTitle || protocol.proposal_title || proposal?.title || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Reference Number
                      </p>
                      <p className="text-sm font-semibold font-mono text-primary">
                        {protocol.referenceNumber || protocol.reference_number || proposal?.referenceNumber || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Principal Investigator
                      </p>
                      <p className="text-sm font-semibold">
                        {protocol.pi?.fullName || protocol.uploadedByName || protocol.uploaded_by_name || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Institution / Unit
                      </p>
                      <p className="text-sm font-semibold">
                        {protocol.proposalInstitution || protocol.proposal_institution || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Protocol Submission Status Card */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                    Submission Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Status
                      </p>
                      <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", cfg.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Submission Date
                      </p>
                      <p className="text-sm font-semibold">
                        {protocol.createdAt || protocol.created_at ? new Date(protocol.createdAt || protocol.created_at!).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    {(protocol.approvalDate || protocol.approval_date) && (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Approval Date
                        </p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {protocol.approvalDate || protocol.approval_date}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Documents Tab Content ────────────────────────────────────────── */}
            <TabsContent value="documents" className="pt-5 space-y-6">
              {documentList.length > 0 ? (
                <Card className="border border-muted-foreground/15 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-slate-50/70 dark:bg-slate-900/40">
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Uploaded Protocol Documents
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Preview your uploaded protocol file and supporting attachments inline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    {/* Document Sub-navigation Pills */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 rounded-xl border border-border/60 shadow-2xs">
                      <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/50 w-full sm:w-auto">
                        {documentList.map((doc) => {
                          const isActive = doc.key === (activeDoc?.key || documentList[0]?.key);
                          const resolved = resolveFileUrl(doc.filePath) || doc.filePath || "";
                          const kind = getConceptNoteAttachmentKind(resolved);
                          return (
                            <Button
                              key={doc.key}
                              variant={isActive ? "default" : "ghost"}
                              size="sm"
                              className="h-8 text-xs font-semibold rounded-md gap-2"
                              onClick={() => setActiveDocKey(doc.key)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>{doc.label}</span>
                              <Badge
                                variant={isActive ? "secondary" : "outline"}
                                className="text-[9px] uppercase px-1.5 py-0 font-bold"
                              >
                                {kind.toUpperCase()}
                              </Badge>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Embedded Document Viewer */}
                    {activeDoc?.filePath ? (
                      <EmbeddedViewer
                        url={activeDoc.filePath}
                        title={activeDoc.label}
                      />
                    ) : (
                      <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-bold text-muted-foreground text-sm">No Document Selected</h3>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed py-16 text-center">
                  <CardContent className="flex flex-col items-center justify-center gap-3">
                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                    <p className="font-bold text-muted-foreground">No Protocol Files Uploaded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Review Feedback Tab Content ──────────────────────────────────── */}
            <TabsContent value="reviews" className="pt-5 space-y-6">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-primary" />
                    Review Feedback & Determination
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {hasReviewRecord ? (
                    <div className="rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">

                        <Badge
                          className={cn(
                            "border px-2 py-0.5 text-[10px] font-bold uppercase shadow-none",
                            status === "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200",
                          )}
                        >
                          {status}
                        </Badge>
                      </div>

                      {(protocol.decisionRemarks || protocol.decision_remarks) && (
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-background border p-3.5 rounded-lg whitespace-pre-line">
                          {protocol.decisionRemarks || protocol.decision_remarks}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Reviewed on: {formatDateTime(protocol.reviewedAt || protocol.reviewed_at)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                      <p className="font-bold text-muted-foreground text-sm">No Review Remarks Yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Review feedback will appear here as soon as a reviewer records an official determination.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar Column (Mirrored from IRB Submissions Detail) ──────────────── */}
        <aside className="space-y-6">
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80 dark:bg-slate-900/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Protocol Submission Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", cfg.className)}>
                  <StatusIcon className="h-3 w-3" />
                  {cfg.label}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Submitted Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {protocol.createdAt || protocol.created_at ? new Date(protocol.createdAt || protocol.created_at!).toLocaleDateString() : "—"}
                </span>
              </div>

              {(protocol.approvalDate || protocol.approval_date) && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground font-medium">Approval Date</span>
                  <span className="font-semibold text-emerald-600 text-xs">
                    {protocol.approvalDate || protocol.approval_date}
                  </span>
                </div>
              )}

              <div className="rounded-xl border p-3.5 bg-slate-50/70 dark:bg-slate-900/30 space-y-1.5 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  Guidance Note
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cfg.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {canEdit && (
            <Card className="border border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Update Protocol Files
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload updated protocol files if requested by reviewers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button className="w-full shadow-xs gap-2" onClick={() => setIsUpdateModalOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Update Files
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <ProtocolFormModal
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        protocol={protocol}
        onSuccess={(updated) => setProtocol(updated)}
      />
    </PageContainer>
  );
}
