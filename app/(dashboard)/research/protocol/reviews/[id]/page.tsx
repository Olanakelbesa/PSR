"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { downloadConceptNoteAttachment, getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { useProtocol, useReviewProtocol } from "@/lib/queries/protocol";
import { useProposal } from "@/lib/queries/proposals";
import type { ProtocolStatus } from "@/types/protocol";

const statusConfig: Record<
  ProtocolStatus,
  { label: string; className: string; icon: typeof Clock; description: string }
> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock,
    description: "The investigator has not yet uploaded the protocol file for review.",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: ShieldCheck,
    description: "This research protocol is pending PSR review and approval decision.",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    description: "This research protocol has been officially reviewed and approved.",
  },
  rejected: {
    label: "Requires Revision",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: AlertCircle,
    description: "This protocol requires revision before approval can be granted. The investigator may resubmit.",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    icon: RefreshCcw,
    description: "The investigator has resubmitted an updated protocol for re-review.",
  },
};

const DECISION_OPTIONS = [
  {
    value: "approved" as const,
    icon: CheckCircle2,
    label: "Approve",
    description: "Grant protocol approval",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-50 dark:bg-emerald-950/30",
    selectedRing: "ring-emerald-500/25",
    selectedText: "text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    value: "rejected" as const,
    icon: AlertCircle,
    label: "Request Revision",
    description: "Return protocol for modifications",
    selectedBorder: "border-amber-500",
    selectedBg: "bg-amber-50 dark:bg-amber-950/30",
    selectedRing: "ring-amber-500/25",
    selectedText: "text-amber-700 dark:text-amber-300",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
];

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

export default function ProtocolReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const protocolId = Number(params.id);

  const { data: protocol, isLoading } = useProtocol(protocolId);
  const reviewMutation = useReviewProtocol();

  const proposalIdStr = protocol?.proposal ? String(protocol.proposal) : "";
  const { data: proposalDetail } = useProposal(proposalIdStr);

  const [copiedRef, setCopiedRef] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<
    "approved" | "rejected" | ""
  >("");
  const [reviewComments, setReviewComments] = useState("");
  const [formErrors, setFormErrors] = useState<{
    reviewDecision?: string;
    reviewComments?: string;
  }>({});

  const status = protocol?.status || "pending_review";
  const cfg = statusConfig[status] || statusConfig.pending_review;
  const StatusIcon = cfg.icon;

  const showReviewButton = status !== "pending_submission";
  const isAlreadyReviewed = status === "approved" || status === "rejected";
  const reviewButtonLabel = isAlreadyReviewed
    ? "Edit Review Decision"
    : "Submit Review Decision";

  const handleCopyRef = () => {
    if (!protocol) return;
    const refText = protocol.referenceNumber || protocol.reference_number || `PROT-${protocol.id}`;
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleOpenReviewModal = (overrideDecision?: string, overrideComments?: string) => {
    const initialDecision =
      overrideDecision ||
      (status === "approved" || status === "rejected" ? status : "");
    const initialComments = overrideComments ?? protocol?.decisionRemarks ?? protocol?.decision_remarks ?? "";

    setReviewDecision((initialDecision as "approved" | "rejected" | "") || "");
    setReviewComments(initialComments);
    setFormErrors({});
    setIsReviewModalOpen(true);
  };

  const handleReview = () => {
    const errors: typeof formErrors = {};
    if (!reviewDecision) errors.reviewDecision = "Please select a decision.";
    if (reviewDecision === "rejected" && !reviewComments.trim())
      errors.reviewComments = "Comments/remarks are required when requesting revisions or rejecting.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    reviewMutation.mutate(
      {
        id: protocolId,
        payload: { decision: reviewDecision, comments: reviewComments },
      },
      {
        onSuccess: () => {
          toast.success(
            isAlreadyReviewed
              ? "Protocol review decision updated successfully."
              : reviewDecision === "approved"
                ? "Protocol approved successfully."
                : "Protocol rejected successfully.",
          );
          queryClient.invalidateQueries({ queryKey: ["protocols"] });
          queryClient.invalidateQueries({ queryKey: ["protocol", protocolId] });
          setIsReviewModalOpen(false);
          setReviewDecision("");
          setReviewComments("");
          setFormErrors({});
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to submit review decision.");
        },
      },
    );
  };

  const documentList = useMemo(() => {
    if (!protocol) return [];
    const list: { key: string; label: string; filePath?: string | null; filename?: string }[] = [];

    // 1. Primary Protocol File
    const mainFile = protocol.protocolFile || protocol.protocol_file;
    if (mainFile) {
      list.push({
        key: "protocol-file",
        label: "Primary Protocol File",
        filePath: mainFile,
        filename: "Protocol Document",
      });
    }

    // 2. Other Supporting Document
    const otherDoc = protocol.otherDocument || protocol.other_document;
    if (otherDoc) {
      list.push({
        key: "other-document",
        label: "Supporting Document",
        filePath: otherDoc,
        filename: "Supporting File",
      });
    }

    if (protocol.attachments && protocol.attachments.length > 0) {
      protocol.attachments.forEach((att, idx) => {
        list.push({
          key: `attachment-${att.id}`,
          label: "Supporting Documents",
          filePath: att.file || att.fileUrl || att.file_url,
          filename: att.filename || `Attachment ${idx + 1}`,
        });
      });
    }

    // 3. Original Proposal Document if available
    const propFile = protocol.proposalFile || protocol.proposal_file || proposalDetail?.proposalFile || (proposalDetail as any)?.proposal_file;
    if (propFile) {
      list.push({
        key: "proposal-file",
        label: "Proposal Document",
        filePath: propFile,
        filename: "Proposal Document",
      });
    }

    return list;
  }, [protocol, proposalDetail]);

  const [activeDocKey, setActiveDocKey] = useState<string>("protocol-file");
  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  if (isLoading) {
    return (
      <PageContainer title="Loading Protocol Review...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
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
        title="Protocol Not Found"
        description="The requested protocol review record could not be loaded."
        actions={
          <Button variant="outline" onClick={() => router.push("/research/protocol/reviews")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviews
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Protocol Record Unavailable</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                The protocol submission details could not be loaded. Please try again or return to reviews list.
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
      title={protocol.proposalTitle || protocol.proposal_title || "Review Research Protocol"}
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
          {(protocol.createdAt || protocol.created_at) && (
            <span className="text-xs text-muted-foreground font-medium ml-1">
              · Submitted: {new Date(protocol.createdAt || protocol.created_at!).toLocaleDateString()}
            </span>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-xs">
            <Link href="/research/protocol/reviews">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reviews
            </Link>
          </Button>
          {showReviewButton && (
            <Button size="sm" className="shadow-xs" onClick={() => handleOpenReviewModal()}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {reviewButtonLabel}
            </Button>
          )}
        </div>
      }
    >
      {/* ── Main Layout: Standard Grid 2-Column (Mirrored from IRB Reviews Detail) ──────────────── */}
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
                Status
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
                        {protocol.proposalTitle || protocol.proposal_title || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Reference Number
                      </p>
                      <p className="text-sm font-semibold font-mono text-primary">
                        {protocol.referenceNumber || protocol.reference_number || "—"}
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

                  {(protocol.proposalShortAbstract || protocol.proposal_short_abstract) && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Abstract Summary
                        </p>
                        <div
                          className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 border p-4 rounded-xl [&_p]:mb-2 [&_p:last-child]:mb-0"
                          dangerouslySetInnerHTML={{
                            __html: protocol.proposalShortAbstract || protocol.proposal_short_abstract || "",
                          }}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Protocol Details & Notes Card */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                    Protocol Submission Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Submission Status
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
                    {(protocol.submittedBy || protocol.pi) && (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Submitted By
                        </p>
                        <p className="text-sm font-semibold">
                          {(protocol.submittedBy || protocol.pi)?.fullName} ({(protocol.submittedBy || protocol.pi)?.email})
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
                      Attached Protocol Files
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Preview uploaded protocol files, supporting documents, and proposal file inline.
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
                    <p className="font-bold text-muted-foreground">No Protocol Files Attached</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      No protocol documents or supporting files were uploaded with this application.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Review History Tab Content ──────────────────────────────────── */}
            <TabsContent value="reviews" className="pt-5 space-y-6">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-primary" />
                    Protocol Review & Decision History
                  </CardTitle>
                  {showReviewButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1.5 shadow-2xs"
                      onClick={() => handleOpenReviewModal()}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {reviewButtonLabel}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {hasReviewRecord ? (
                    <div className="rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {(protocol.reviewedByName || protocol.reviewed_by_name || "REV").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {protocol.reviewedByName || protocol.reviewed_by_name || "PSR Reviewer"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 gap-1 px-2.5 rounded-lg border border-primary/20"
                            onClick={() => handleOpenReviewModal(status, protocol.decisionRemarks || protocol.decision_remarks || "")}
                          >
                            Edit
                          </Button>
                        </div>
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
                      <p className="font-bold text-muted-foreground text-sm">No Review Decision Recorded Yet</p>
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

        {/* ── Sidebar Column (Mirrored from IRB Reviews Detail) ──────────────── */}
        <aside className="space-y-6">
          {/* Protocol Status Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80 dark:bg-slate-900/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Protocol Review Status
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

              {(protocol.submittedBy || protocol.pi) && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground font-medium">Submitted by</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">
                    {(protocol.submittedBy || protocol.pi)?.fullName}
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

          {/* Action CTA Card for Reviewers */}
          {showReviewButton && (
            <Card className="border border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {isAlreadyReviewed ? "Edit Review Determination" : "Review Determination"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAlreadyReviewed
                    ? "Modify or update the recorded protocol approval decision and comments."
                    : "Record the official PSR protocol review decision for this submission."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button className="w-full shadow-xs gap-2" onClick={() => handleOpenReviewModal()}>
                  <CheckCircle2 className="h-4 w-4" />
                  {reviewButtonLabel}
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Review Decision Dialog                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="w-[94vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 overflow-x-hidden gap-0 rounded-2xl shadow-2xl">
          {/* Dynamic Colored Header */}
          <div
            className={cn(
              "p-4 sm:p-6 pb-4 border-b transition-colors duration-200",
              reviewDecision === "approved" &&
              "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
              reviewDecision === "rejected" &&
              "bg-amber-50/60 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
              !reviewDecision && "bg-muted/30 border-border",
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {reviewDecision === "approved" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                {reviewDecision === "rejected" && (
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                )}
                {!reviewDecision && (
                  <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                Protocol Review Decision
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed space-y-1 text-xs">
                <span className="block">
                  {reviewDecision === "approved" &&
                    "This research protocol will be approved and promoted to funding recommendation."}
                  {reviewDecision === "rejected" &&
                    "This research protocol requires revision. The investigator will be notified to make updates and resubmit."}
                  {!reviewDecision &&
                    "Select a decision below to record the official protocol review determination."}
                </span>
                <span className="block text-xs text-muted-foreground font-medium truncate">
                  Proposal: {protocol.proposalTitle || protocol.proposal_title}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 bg-background">
            {/* Decision Cards */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">
                Decision <span className="text-rose-500">*</span>
              </label>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full"
                role="radiogroup"
                aria-label="Review decision"
              >
                {DECISION_OPTIONS.map((option) => {
                  const isSelected = reviewDecision === option.value;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setReviewDecision(option.value);
                        if (formErrors.reviewDecision) {
                          setFormErrors((current) => ({
                            ...current,
                            reviewDecision: undefined,
                          }));
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 text-center cursor-pointer",
                        isSelected
                          ? cn(
                            option.selectedBorder,
                            option.selectedBg,
                            "ring-2",
                            option.selectedRing,
                            "shadow-xs",
                          )
                          : "border-border hover:border-border/80 hover:bg-muted/30 ring-2 ring-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-full p-2 transition-colors",
                          isSelected
                            ? cn(option.iconBg, option.iconColor)
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isSelected ? option.selectedText : "text-foreground",
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {formErrors.reviewDecision && (
                <p className="text-xs text-rose-600">
                  {formErrors.reviewDecision}
                </p>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Review Comments {reviewDecision === "rejected" && <span className="text-rose-500">*</span>}
                </label>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {reviewDecision === "rejected" ? "Required" : "Optional"}
                </span>
              </div>
              <Textarea
                placeholder="Provide detailed remarks for the investigator and audit trail..."
                value={reviewComments}
                onChange={(e) => {
                  setReviewComments(e.target.value);
                  if (formErrors.reviewComments) {
                    setFormErrors((current) => ({
                      ...current,
                      reviewComments: undefined,
                    }));
                  }
                }}
                rows={4}
                className={cn(
                  "resize-none text-sm leading-relaxed",
                  formErrors.reviewComments && "border-rose-500 focus-visible:ring-rose-500",
                )}
              />
              {formErrors.reviewComments && (
                <p className="text-xs text-rose-600">
                  {formErrors.reviewComments}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 bg-background flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={cn(
                reviewDecision === "rejected" && "bg-amber-600 hover:bg-amber-700 text-white",
                reviewDecision === "approved" && "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Decision...
                </>
              ) : (
                "Submit Review Decision"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        isOpen={!!viewerDocument}
        onOpenChange={(open) => !open && setViewerDocument(null)}
        url={viewerDocument?.url ?? ""}
        title={viewerDocument?.title ?? "Document"}
      />
    </PageContainer>
  );
}
