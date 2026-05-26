"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  MessageSquare,
  Loader2,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar as AvatarUI, AvatarFallback as AvatarFallbackUI } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { POLICY_TYPES } from "@/lib/constants";
import type { PolicyStatus, PolicyType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { DraftTabs } from "@/components/policies/drafts/draft-tabs";
import { usePolicyDraftManage, useAssignPSRDecision } from "@/lib/queries/policy-drafts";
import { toast } from "sonner";
import { useServerPermissions } from "@/lib/queries/useServerPermissions";

export default function DraftDetailPage() {
  const params = useParams();
  const draftId = (params as any)?.id;

  const { data: rawDraft, isLoading } = usePolicyDraftManage(draftId);
  const decisionMutation = useAssignPSRDecision();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [decision, setDecision] = useState<"psr_approved" | "resubmission_required">("psr_approved");
  const [comments, setComments] = useState("");

  const draft = useMemo(() => {
    if (!rawDraft) return null;
    
    // 1. Basic status mapping
    const statusMap: Record<string, string> = {
      "draft": "draft",
      "submitted": "submitted",
      "under_review": "under_review",
      "review_completed": "review_completed",
      "psr_approved": "approved",
      "repository_registered": "approved",
      "resubmission_required": "resubmission_required",
      "resubmitted": "resubmitted"
    };

    const statusValue = typeof rawDraft.currentStatus === "string" 
      ? rawDraft.currentStatus 
      : rawDraft.currentStatus?.status || rawDraft.current_status || "draft";
      
    const resolvedStatus = statusMap[String(statusValue).toLowerCase()] || "under_review";

    // 2. Map expert reviews from expertFeedback
    const reviewsList: any[] = [];
    const expertFeedback = rawDraft.expertFeedback || rawDraft.expert_feedback || [];
    
    expertFeedback.forEach((vFeed: any, versionIndex: number) => {
      const version = vFeed.versionNumber || vFeed.version_number || "v1.0.0";
      const versionIsLatest = Boolean(vFeed.isLatest ?? vFeed.is_latest);
      const details = vFeed.feedbackDetail || vFeed.feedback_detail || [];
      
      details.forEach((det: any, index: number) => {
        const reviewerData = det.expertReviewer || det.expert_reviewer || {};
        let reviewerName = reviewerData?.fullName || reviewerData?.full_name || "Anonymous Reviewer";
        const reviewerPosition = reviewerData?.position || "Expert Evaluator";
        const isManagerEntry = reviewerPosition === "PSR Manager" || reviewerName.includes("(PSR Manager)");

        if (isManagerEntry) {
          reviewerName = reviewerName.replace(" (PSR Manager)", "");
        }

        const [firstName, ...rest] = reviewerName.split(" ");
        const lastName = rest.join(" ") || (isManagerEntry ? "PSR Manager" : "Reviewer");
        
        const checklistItems = det.checklistBreakdown || det.checklist_breakdown || [];
        const checklist = checklistItems.map((chk: any) => {
          const isPassed = chk.fulfillment === "yes" || chk.isPassed === true || chk.is_passed === true;
          const isPending = chk.fulfillment === "pending" || ((chk.isPassed === null || chk.isPassed === undefined) && chk.fulfillment == null && chk.is_passed == null);

          return {
            category: chk.questionText || chk.question_text || "Criterion",
            passed: isPassed,
            pending: isPending,
            feedback: chk.reviewerNote || chk.reviewer_note || ""
          };
        });

        const answeredItems = checklist.filter((item: any) => !item.pending);
        const computedScore = answeredItems.length > 0
          ? Math.round((answeredItems.filter((item: any) => item.passed).length / answeredItems.length) * 100)
          : null;

        reviewsList.push({
          id: String(det.id || `REV-${version}-${index}`),
          version: version,
          isLatestVersion: versionIsLatest,
          versionOrder: versionIndex,
          reviewer: {
            id: String(reviewerData?.id || `r-${index}`),
            firstName: firstName,
            lastName: lastName,
            position: reviewerPosition,
            institution: isManagerEntry ? "PSR Management" : "PSR Council"
          },
          status:
            (det.currentStatus === "graded" || det.current_status === "graded") ||
            (det.finalDecisionStatus === "completed" || det.final_decision_status === "completed")
              ? "completed"
              : "pending",
          score: det.score ?? computedScore,
          comments: det.comment || det.comment,
          decision: (() => {
            const rawDecision = det.finalDecisionStatus || det.final_decision_status || null;
            if (rawDecision === "approved") return "psr_approved";
            if (rawDecision === "rejected") return "resubmission_required";
            return rawDecision;
          })(),
          createdAt: det.commentGivenAt || det.comment_given_at || new Date().toISOString(),
          checklist: checklist,
          isPSRManager: isManagerEntry,
        });
      });
    });

    const versions = rawDraft.versions || [];
    const versionHistory = versions.map((ver: any) => {
      const authorName = ver.createdByName || "Author";
      const [firstName, ...rest] = authorName.split(" ");
      const lastName = rest.join(" ") || "";
      
      return {
        version: ver.versionNumber || "v1.0.0",
        date: ver.createdAt || new Date().toISOString(),
        author: { firstName, lastName },
        description: ver.isResubmission ? "Revised resubmission following expert feedback." : "Initial draft document submission.",
        status: ver.isLatest ? "current" : "archived",
        size: "Document File",
        file: ver.file || ""
      };
    });

    // 4. Map timeline
    const timeline = (rawDraft.timeline || []).map((t: any) => ({
      eventType: t.eventType,
      title: t.title,
      actor: t.actor,
      actorPhoto: t.actorPhoto,
      timestamp: t.timestamp,
      version: t.version
    }));

    const originalConceptNoteId = rawDraft.concept_note?.id ?? rawDraft.conceptNote?.id;
    const originalConceptLabel = rawDraft.currentStatus?.conceptId || (originalConceptNoteId ? `CN-${String(originalConceptNoteId).padStart(4, "0")}` : "CN");

    return {
      id: String(rawDraft.id),
      title: rawDraft.title || "Policy Draft",
      versionNumber: rawDraft.currentStatus?.version || rawDraft.versionNumber || "v1.0.0",
      type: (rawDraft.docType?.name ? rawDraft.docType.name.toLowerCase() : "policy") as any,
      status: resolvedStatus as any,
      submissionDate: rawDraft.submittedBy?.submittedAt || rawDraft.submissionDate || new Date().toISOString(),
      submittedBy: {
        firstName: rawDraft.submittedBy?.fullName?.split(" ")[0] || "Proposed",
        lastName: rawDraft.submittedBy?.fullName?.split(" ").slice(1).join(" ") || "User",
        role: "Submitter"
      },
      conceptNoteId: originalConceptNoteId,
      conceptNoteLabel: originalConceptLabel,
      executiveSummary: rawDraft.overview?.executiveSummary || rawDraft.executiveSummary || "No summary provided.",
      draftFile: {
        name: rawDraft.overview?.file?.split("/").pop() || "Draft_Document.pdf",
        size: "PDF Document"
      },
      url: rawDraft.overview?.file || "",
      versionHistory: versionHistory,
      reviews: reviewsList,
      timeline: timeline
    };
  }, [rawDraft]);

  const latestVersionNumber = useMemo(() => {
    if (!draft) return null;

    const latestFromHeader = draft.versionNumber;
    if (latestFromHeader) return String(latestFromHeader);

    const latestFromHistory = draft.versionHistory?.find((item: any) => item.status === "current")?.version;
    return latestFromHistory ? String(latestFromHistory) : null;
  }, [draft]);

  const { hasPermission } = useServerPermissions();

  const latestVersionReviews = useMemo(() => {
    if (!draft) return [];

    const reviews = Array.isArray(draft.reviews) ? draft.reviews : [];

    // 1) Prefer explicit backend latest marker
    const markedLatest = reviews.filter((rev: any) => rev.isLatestVersion === true);
    if (markedLatest.length > 0) return markedLatest;

    // 2) Fallback to version label match
    if (latestVersionNumber) {
      const normalizedLatestVersion = String(latestVersionNumber).toLowerCase();
      const matchedByVersion = reviews.filter(
        (rev: any) => String(rev.version || "").toLowerCase() === normalizedLatestVersion
      );
      if (matchedByVersion.length > 0) return matchedByVersion;
    }

    // 3) Final fallback: first expertFeedback block (serializer returns latest first)
    const withOrder = reviews.filter((rev: any) => typeof rev.versionOrder === "number");
    if (withOrder.length > 0) {
      const minOrder = Math.min(...withOrder.map((rev: any) => rev.versionOrder));
      return withOrder.filter((rev: any) => rev.versionOrder === minOrder);
    }

    return [];
  }, [draft, latestVersionNumber]);

  const currentPsrDecision = useMemo(() => {
    // Only preload PSR decision/comments from the latest version.
    return latestVersionReviews.find((rev: any) => rev.isPSRManager) ?? null;
  }, [latestVersionReviews]);

  const handleOpenDecisionModal = () => {
    if (currentPsrDecision) {
      setDecision(
        currentPsrDecision.decision === "resubmission_required"
          ? "resubmission_required"
          : "psr_approved"
      );
      setComments(currentPsrDecision.comments || "");
    } else {
      setDecision("psr_approved");
      setComments("");
    }
    setIsApproveModalOpen(true);
  };

  const getPsrDecisionLabel = (decisionValue: string | null) => {
    if (decisionValue === "psr_approved") return "Approved";
    if (decisionValue === "resubmission_required") return "Revision Requested";
    return "Pending Decision";
  };

  const getPsrDecisionBadgeClass = (decisionValue: string | null) => {
    return decisionValue === "psr_approved"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : decisionValue === "resubmission_required"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-muted text-muted-foreground border-muted/20";
  };

  const handleSaveDecision = async () => {
    try {
      await decisionMutation.mutateAsync({
        draftId: draftId,
        psr_decision: decision,
        psr_comments: comments,
      });
      toast.success(
        decision === "psr_approved"
          ? "Policy draft successfully approved!"
          : "Revision request successfully recorded."
      );
      setIsApproveModalOpen(false);
      setComments("");
    } catch (error: any) {
      // Axios interceptor normalizes errors to ApiError: { message, status, errors }
      const errors = error.errors;
      let errorMessage = "Failed to submit decision. Please try again.";

      if (errors) {
        if (errors.review) {
          errorMessage = Array.isArray(errors.review) ? errors.review[0] : errors.review;
        } else if (typeof errors === "object") {
          const firstKey = Object.keys(errors)[0];
          if (firstKey) {
            const fieldError = errors[firstKey];
            errorMessage = Array.isArray(fieldError) ? fieldError[0] : fieldError;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  if (isLoading || !draft) {
    return (
      <PageContainer title="Loading Draft Details...">
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const hasAssignedReviewers = latestVersionReviews.some((rev: any) => !rev.isPSRManager);
  const canRecordDecision = hasAssignedReviewers || Boolean(currentPsrDecision);

  return (
    <PageContainer
      title={draft.title}
      description={`Viewing Draft Document: ${draft.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm border-primary/20 hover:bg-primary/5">
            <Link href="/policies/drafts/manage-drafts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back 
            </Link>
          </Button>
          {(() => {
            const { hasPermission } = useServerPermissions();
            return hasPermission("policy_development.assign_reviewer") ? (
              {hasPermission("policy_development.assign_reviewer") && (
                <Button size="sm" asChild className="shadow-sm border-primary/20 hover:bg-primary/5" variant="outline">
                  <Link href={`/policies/drafts/manage-drafts/${draft.id}/assign`}>
                    <Users className="mr-2 h-4 w-4" />
                    {hasAssignedReviewers ? "Change Reviewers" : "Assign Reviewers"}
                  </Link>
                </Button>
              )}
            ) : null;
          })()}
          {canRecordDecision && (
            <Button size="sm" className="shadow-sm font-semibold" onClick={handleOpenDecisionModal}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Record / Edit Decision
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <DraftTabs draft={draft} />
        </div>

        <aside className="space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">PSR Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPsrDecision ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">Final Decision</span>
                    <Badge className={cn(
                      "font-mono text-[10px] font-semibold px-2 py-1",
                      getPsrDecisionBadgeClass(currentPsrDecision.decision)
                    )}>
                      {getPsrDecisionLabel(currentPsrDecision.decision)}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold">PSR Manager Response</p>
                    <p>{currentPsrDecision.comments || "No comments provided."}</p>
                  </div>
                  {currentPsrDecision.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Recorded on {new Date(currentPsrDecision.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No PSR decision has been recorded for this draft yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge type="policy" status={draft.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Document Type
                </span>
                <span className="text-sm font-medium capitalize">
                  {POLICY_TYPES[draft.type as PolicyType]?.label || draft.type}
                </span>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Proposed By
                    </span>
                    <span className="text-sm font-medium">
                      {draft.submittedBy.firstName} {draft.submittedBy.lastName}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Original Concept
                    </span>
                    <Link
                      href={draft.conceptNoteId ? `/policies/concept-notes/manage-concept-notes/${draft.conceptNoteId}` : "#"}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {draft.conceptNoteLabel}
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Submission Date
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(draft.submissionDate).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                Expert Reviewers{" "}
                <Badge variant="secondary" className="font-normal">
                  {draft.reviews.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.reviews.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    No experts assigned yet.
                  </p>
                </div>
              ) : (
                draft.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarUI className="h-8 w-8">
                        <AvatarFallbackUI className="text-[10px] bg-primary/10 text-primary">
                          {rev.reviewer.firstName[0]}
                          {rev.reviewer.lastName[0]}
                        </AvatarFallbackUI>
                      </AvatarUI>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {rev.reviewer.firstName} {rev.reviewer.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                          {rev.status === "completed" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500" />{" "}
                              Graded
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-orange-400" />{" "}
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    {rev.score !== null && (
                      <Badge
                        className={cn(
                          "font-mono font-bold text-white",
                          rev.score >= 75 ? "bg-green-600 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-50"
                        )}
                      >
                        {rev.score}%
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Decision Dialog */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-primary/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Record PSR Decision</DialogTitle>
            <DialogDescription>
              Record the final governance or institutional decision for this policy draft.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Elegant Decision Switcher Cards */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDecision("psr_approved")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 text-center",
                  decision === "psr_approved"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-primary/10 hover:border-primary/20 bg-background text-muted-foreground"
                )}
              >
                <span className="text-sm font-semibold">Approve Draft</span>
                <span className="text-[10px] leading-tight">Ready for registry</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("resubmission_required")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 text-center",
                  decision === "resubmission_required"
                    ? "border-orange-500 bg-orange-50/30 text-orange-950 shadow-sm"
                    : "border-primary/10 hover:border-primary/20 bg-background text-muted-foreground"
                )}
              >
                <span className="text-sm font-semibold">Request Revision</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Proposer needs to update</span>
              </button>
            </div>

            {/* Detailed feedback text area */}
            <div className="space-y-2">
              <label htmlFor="comments" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Comments & Review Notes
              </label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide detailed feedback supporting your policy decision..."
                className="min-h-[120px] focus-visible:ring-primary border-primary/15"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setIsApproveModalOpen(false);
                setComments("");
              }}
              className="border border-primary/10 hover:bg-primary/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDecision}
              disabled={decisionMutation.isPending}
              className={cn(
                "font-semibold text-white",
                decision === "psr_approved" ? "bg-primary hover:bg-primary/90" : "bg-orange-600 hover:bg-orange-700"
              )}
            >
              {decisionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...
                </>
              ) : (
                "Record Decision"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
