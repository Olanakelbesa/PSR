"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
  RefreshCcw,
  Download,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { downloadConceptNoteAttachment } from "@/lib/utils/concept-note-attachments";
import {
  useEthicalClearance,
  useReviewIRBClearance,
} from "@/lib/queries/ethical-clearance";
import type { IRBClearanceStatus } from "@/types/ethical-clearance";

const statusConfig: Record<
  IRBClearanceStatus,
  { label: string; className: string; icon: typeof Clock; description: string }
> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    description: "The applicant has not yet submitted this clearance for review.",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: ShieldCheck,
    description: "This application is ready for IRB review.",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    description: "This clearance has been approved. No further action required.",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
    description: "This clearance was rejected. The applicant may resubmit.",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 border-violet-200",
    icon: RefreshCcw,
    description: "This application has been resubmitted. Awaiting review.",
  },
};

const DECISION_OPTIONS = [
  {
    value: "approved" as const,
    icon: CheckCircle2,
    label: "Approve",
    description: "Clear the application",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-50",
    selectedRing: "ring-emerald-500/25",
    selectedText: "text-emerald-700",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    value: "rejected" as const,
    icon: AlertCircle,
    label: "Reject",
    description: "Decline the application",
    selectedBorder: "border-red-500",
    selectedBg: "bg-red-50",
    selectedRing: "ring-red-500/25",
    selectedText: "text-red-700",
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
  },
];

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearanceId = Number(params.id);

  const { data: clearance, isLoading } = useEthicalClearance(clearanceId);
  const reviewMutation = useReviewIRBClearance();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<
    "approved" | "rejected" | ""
  >("");
  const [reviewComments, setReviewComments] = useState("");
  const [formErrors, setFormErrors] = useState<{
    reviewDecision?: string;
    reviewComments?: string;
  }>({});

  const status = clearance?.status;
  const cfg =
    statusConfig[status ?? "pending_submission"] ??
    statusConfig.pending_submission;

  const showReviewButton = status === "pending_review";

  const handleOpenReviewModal = () => {
    setReviewDecision("");
    setReviewComments("");
    setFormErrors({});
    setIsReviewModalOpen(true);
  };

  const handleReview = () => {
    const errors: typeof formErrors = {};
    if (!reviewDecision) errors.reviewDecision = "Please select a decision.";
    if (!reviewComments.trim())
      errors.reviewComments = "Comments are required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    reviewMutation.mutate(
      {
        id: clearanceId,
        payload: { decision: reviewDecision, comments: reviewComments },
      },
      {
        onSuccess: () => {
          toast.success(
            reviewDecision === "approved"
              ? "Clearance approved successfully."
              : "Clearance rejected successfully.",
          );
          queryClient.invalidateQueries({
            queryKey: ["ethical-clearances"],
          });
          queryClient.invalidateQueries({
            queryKey: ["ethical-clearance", clearanceId],
          });
          queryClient.invalidateQueries({
            queryKey: ["irb-clearance-statistics"],
          });
          setIsReviewModalOpen(false);
          setReviewDecision("");
          setReviewComments("");
          setFormErrors({});
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to submit review.");
        },
      },
    );
  };

  const [viewerDocument, setViewerDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const resolvedClearanceUrl = clearance?.files?.clearanceFile
    ? resolveFileUrl(clearance.files.clearanceFile)
    : null;

  if (isLoading) {
    return (
      <PageContainer title="Review IRB Clearance">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!clearance) {
    return (
      <PageContainer title="Review IRB Clearance">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="font-semibold">Clearance record not found</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const hasReviews = clearance.reviews && clearance.reviews.length > 0;

  return (
    <PageContainer
      title="Review IRB Clearance"
      description={`${clearance.referenceNumber || ""} · ${clearance.proposalTitle || "Unknown Proposal"}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/research/irb-clearance/reviews">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Reviews
            </Link>
          </Button>
          {showReviewButton && (
            <Button className="shadow-sm" onClick={handleOpenReviewModal}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Review Decision
            </Button>
          )}
        </div>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Proposal info */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  Proposal Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Title
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.proposalTitle || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reference
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.referenceNumber || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Principal Investigator
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.pi?.fullName || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Institution
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.proposalInstitution || "—"}
                  </p>
                </div>
              </div>
              {clearance.proposalShortAbstract && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Abstract
                    </p>
                    <div
                      className="text-sm leading-relaxed text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic"
                      dangerouslySetInnerHTML={{
                        __html: clearance.proposalShortAbstract,
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Clearance details */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  Clearance Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Clearance Type
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.clearanceTypeName || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Application Date
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.applicationDate}
                  </p>
                </div>
                {clearance.submittedBy && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Submitted By
                    </p>
                    <p className="text-sm font-semibold">
                      {clearance.submittedBy.fullName}
                    </p>
                  </div>
                )}
              </div>
              {clearance.submissionNotes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Submission Notes
                    </p>
                    <p className="text-sm leading-relaxed">
                      {clearance.submissionNotes}
                    </p>
                  </div>
                </>
              )}
              {resolvedClearanceUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Clearance Document
                    </p>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        CLR
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          Clearance Document
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded clearance file
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 px-2.5"
                          onClick={() =>
                            setViewerDocument({
                              url: resolvedClearanceUrl,
                              title: "Clearance Document",
                            })
                          }
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 px-2.5"
                          onClick={() =>
                            downloadConceptNoteAttachment(
                              resolvedClearanceUrl,
                              "Clearance Document",
                            )
                          }
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Supporting documents */}
          {clearance.supportingDocuments &&
            clearance.supportingDocuments.length > 0 && (
              <Card className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">
                      Supporting Documents
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {clearance.supportingDocuments.map((doc) => {
                    const resolvedUrl = resolveFileUrl(doc.fileUrl);
                    return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        {doc.documentType === "clearance" ? "CLR" : "SUP"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {doc.originalFilename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileSize
                            ? doc.fileSize < 1024 * 1024
                              ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                              : `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
                            : ""}
                          {doc.uploadedAt &&
                            ` · Uploaded ${doc.uploadedAt}`}
                        </p>
                      </div>
                      {resolvedUrl && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 px-2.5"
                            onClick={() =>
                              setViewerDocument({
                                url: resolvedUrl,
                                title: doc.originalFilename,
                              })
                            }
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 px-2.5"
                            onClick={() =>
                              downloadConceptNoteAttachment(
                                resolvedUrl,
                                doc.originalFilename,
                              )
                            }
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

          {/* Reviews history */}
          {hasReviews && (
            <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">
                    Review History
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {clearance.reviews!.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {review.reviewer}
                      </p>
                      <Badge
                        className={cn(
                          "border px-2 text-[10px] font-bold uppercase shadow-none",
                          review.decision === "approved"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-rose-100 text-rose-700 border-rose-200",
                        )}
                      >
                        {review.decision}
                      </Badge>
                    </div>
                    {review.comments && (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {review.comments}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {review.reviewedAt}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-6 text-sm lg:sticky lg:top-20">
          {/* Status card */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-primary/5 pb-3 text-left">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Review Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">
                  Status
                </span>
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    cfg.className,
                  )}
                >
                  {cfg.label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Applied</span>
                  <span className="font-semibold text-foreground">
                    {clearance.applicationDate || "—"}
                  </span>
                </div>
                {clearance.approvalDate && (
                  <div className="flex justify-between">
                    <span>Approved</span>
                    <span className="font-semibold text-foreground">
                      {clearance.approvalDate}
                    </span>
                  </div>
                )}
                {clearance.submittedBy && (
                  <div className="flex justify-between">
                    <span>Submitted by</span>
                    <span className="font-semibold text-foreground">
                      {clearance.submittedBy.fullName}
                    </span>
                  </div>
                )}
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {cfg.description}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Review Decision Dialog                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
          {/* Dynamic Colored Header */}
          <div
            className={cn(
              "p-6 pb-4 border-b transition-colors duration-200",
              reviewDecision === "approved" &&
                "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
              reviewDecision === "rejected" &&
                "bg-red-50/60 dark:bg-red-500/10 border-red-100 dark:border-red-500/20",
              !reviewDecision && "bg-muted/30 border-border",
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {reviewDecision === "approved" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {reviewDecision === "rejected" && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {!reviewDecision && (
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                )}
                IRB Review Decision
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed space-y-1">
                <span className="block">
                  {reviewDecision === "approved" &&
                    "This clearance application will be approved. The applicant will be notified."}
                  {reviewDecision === "rejected" &&
                    "This clearance application will be rejected. The applicant will be notified and may resubmit."}
                  {!reviewDecision &&
                    "Select a decision below to record the IRB committee's determination."}
                </span>
                <span className="block text-xs text-muted-foreground font-medium truncate">
                  Proposal: {clearance.proposalTitle}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 bg-background">
            {/* Decision Cards */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Decision <span className="text-rose-500">*</span>
              </label>
              <div
                className="grid grid-cols-2 gap-3"
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
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 text-center",
                        isSelected
                          ? cn(
                              option.selectedBorder,
                              option.selectedBg,
                              "ring-2",
                              option.selectedRing,
                              "shadow-sm",
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
                  Review Comments <span className="text-rose-500">*</span>
                </label>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Required
                </span>
              </div>
              <Textarea
                placeholder="Provide detailed comments for the applicant and audit trail..."
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
                className={cn(
                  "min-h-[100px] resize-none focus-visible:ring-primary/50 shadow-sm",
                  formErrors.reviewComments
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "",
                )}
              />
              {formErrors.reviewComments && (
                <p className="text-xs text-rose-600">
                  {formErrors.reviewComments}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-muted/10">
            <Button
              variant="ghost"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={reviewMutation.isPending}
              className="hover:bg-muted/50 font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending || !reviewDecision}
              className={cn(
                "shadow-sm font-semibold",
                reviewDecision === "approved" &&
                  "bg-emerald-600 hover:bg-emerald-700 text-white",
                reviewDecision === "rejected" &&
                  "bg-red-600 hover:bg-red-700 text-white",
                !reviewDecision && "bg-primary hover:bg-primary/90",
              )}
            >
              {reviewMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {reviewDecision === "approved"
                    ? "Confirm Approval"
                    : reviewDecision === "rejected"
                      ? "Confirm Rejection"
                      : "Submit Review"}
                </div>
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
