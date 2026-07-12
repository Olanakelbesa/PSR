"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  Clock,
  FileText,
  User,
  Building2,
  MessageSquare,
  ClipboardCheck,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const PdfViewerDialog = dynamic(
  () =>
    import("@/components/shared/pdf-viewer-dialog").then(
      (mod) => mod.PdfViewerDialog,
    ),
  { ssr: false },
);
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useManageConceptNoteDetail,
  useApproveConceptNote,
} from "@/lib/queries/concept-notes";

const formatTimestamp = (timestampString?: string | null) => {
  if (!timestampString) return "—";
  const date = new Date(timestampString);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
};

const normalizeStatusKey = (status?: string | null) =>
  (status || "").toLowerCase().replace(/[\s-]+/g, "_");

const normalizeDecision = (status?: string | null) => {
  const norm = normalizeStatusKey(status);
  if (norm === "accepted" || norm === "approve") return "approve" as const;
  if (norm === "partially_accepted" || norm === "revision" || norm === "revise") {
    return "request-changes" as const;
  }
  if (norm === "not_accepted" || norm === "reject") return "reject" as const;
  return null;
};

const getRecommendationBadge = (
  status?: string | null,
  opts?: { pendingWhenMissing?: boolean },
) => {
  const norm = normalizeStatusKey(status);
  if (!norm || norm === "pending" || norm === "draft" || norm === "unreviewed") {
    if (opts?.pendingWhenMissing) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-200 border">
        <ClipboardCheck className="mr-1 h-3 w-3" /> Unreviewed
      </Badge>
    );
  }
  if (norm === "accepted" || norm === "approve") {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 border">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
      </Badge>
    );
  }
  if (
    norm === "partially_accepted" ||
    norm === "revision" ||
    norm === "revise"
  ) {
    return (
      <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 border">
        <Clock className="mr-1 h-3 w-3" /> Revise
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/10 text-red-700 border-red-500/20 border">
      <AlertCircle className="mr-1 h-3 w-3" /> Reject
    </Badge>
  );
};

const getApprovalStatusBadge = (
  approvalDecision?: string | null,
  workflowStatus?: string | null,
) => {
  if (approvalDecision) {
    return getRecommendationBadge(approvalDecision);
  }

  const workflow = normalizeStatusKey(workflowStatus);
  if (
    workflow === "submitted" ||
    workflow === "under_review" ||
    workflow === "resubmitted"
  ) {
    return getRecommendationBadge("pending", { pendingWhenMissing: true });
  }

  return getRecommendationBadge("unreviewed");
};

const getStatusBadge = (status?: string | null) => {
  const norm = normalizeStatusKey(status) || "draft";
  const labelMap: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    accepted: "Accepted",
    partially_accepted: "Partially Accepted",
    not_accepted: "Not Accepted",
    revision_required: "Revision Required",
    resubmitted: "Resubmitted",
    policy_draft_ready: "Policy Draft Ready",
    unreviewed: "Unreviewed",
  };

  const classMap: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    under_review: "bg-amber-100 text-amber-700 border-amber-200",
    accepted: "bg-green-100 text-green-700 border-green-200",
    partially_accepted: "bg-orange-100 text-orange-700 border-orange-200",
    not_accepted: "bg-red-100 text-red-700 border-red-200",
    revision_required: "bg-yellow-100 text-yellow-700 border-yellow-200",
    resubmitted: "bg-purple-100 text-purple-700 border-purple-200",
    policy_draft_ready: "bg-teal-100 text-teal-700 border-teal-200",
    unreviewed: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5",
        classMap[norm] ?? classMap.draft,
      )}
    >
      {labelMap[norm] ?? status ?? "Draft"}
    </Badge>
  );
};

export default function ApproveConceptNotePage() {
  const params = useParams();
  const router = useRouter();
  const { backendToken } = useAuth();
  const id = params.id as string;

  const { data: note, isLoading, isError } = useManageConceptNoteDetail(
    id,
    backendToken,
  );
  const approveMutation = useApproveConceptNote();

  const [decision, setDecision] = useState<
    "approve" | "request-changes" | "reject" | null
  >(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!note) return;
    const existingDecision =
      normalizeDecision(note.psrFinalDecision ?? (note as any).psr_final_decision) ??
      null;
    setDecision(existingDecision);
  }, [note]);

  const handleApprove = () => {
    setDecision("approve");
    setShowDialog(true);
  };

  const handleRequestChanges = () => {
    setDecision("request-changes");
    setShowDialog(true);
  };

  const handleReject = () => {
    setDecision("reject");
    setShowDialog(true);
  };

  const handleSubmitDecision = async () => {
    if (!decision) {
      toast.error("Please select a decision.");
      return;
    }

    const backendDecision =
      decision === "approve"
        ? "approve"
        : decision === "request-changes"
          ? "revision"
          : "reject";

    approveMutation.mutate(
      {
        id,
        decision: backendDecision,
        comments: decisionNotes,
      },
      {
        onSuccess: () => {
          const decisionText =
            decision === "approve"
              ? "Approved"
              : decision === "request-changes"
                ? "Requested Changes"
                : "Rejected";
          toast.success(
            `Concept note ${decisionText.toLowerCase()} successfully.`,
          );
          setShowDialog(false);
          router.push(`/policies/concept-notes/manage-concept-notes/${id}`);
        },
        onError: (err: any) => {
          const errMsg =
            err?.message || "Failed to submit decision. Please try again.";
          toast.error(errMsg);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Approve Concept Note"
        description="Review expert assessment summaries and make a final governance decision."
        actions={
          <Skeleton className="h-9 w-36 rounded-md" />
        }
      >
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Decision sidebar skeleton */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-4 space-y-3">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-full max-w-[260px]" />
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border p-4"
                  >
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56 max-w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Reviewer assessments skeleton */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-52 max-w-full" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="pl-4 border-l-2 border-muted space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[92%]" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="pt-3 border-t flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Skeleton className="h-4 w-4 shrink-0" />
                        <Skeleton className="h-3 w-40 max-w-full" />
                      </div>
                      <Skeleton className="h-8 w-20 shrink-0" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !note) {
    return (
      <PageContainer title="Error Loading Concept Note">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold">
            Failed to load concept note details
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            There was a problem retrieving the feedback and status information
            for this concept note. Please verify the URL or try again.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" asChild>
              <Link href={`/policies/concept-notes/manage-concept-notes`}>
                Go to Dashboard
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Flatten feedback details across all versions for a unified list
  const allFeedbacks =
    note.expertFeedback?.flatMap((versionFb: any) =>
      (versionFb.feedbackDetail || []).map((detail: any) => ({
        ...detail,
        versionNumber: versionFb.versionNumber,
        isLatestVersion: versionFb.isLatest,
        finalDecisionStatus:
          detail.finalDecisionStatus ?? detail.final_decision_status,
        commentGivenAt:
          detail.decisionMadeAt ??
          detail.decision_made_at ??
          detail.commentGivenAt ??
          detail.comment_given_at,
        decisionMadeAt: detail.decisionMadeAt ?? detail.decision_made_at,
        reviewFile: detail.reviewFile ?? detail.review_file,
        expertReviewer: {
          ...detail.expertReviewer,
          fullName:
            detail.expertReviewer?.fullName ?? detail.expertReviewer?.full_name,
          photoUrl:
            detail.expertReviewer?.photoUrl ?? detail.expertReviewer?.photo_url,
        },
      })),
    ) || [];

  const isExpertReviewSubmitted = (detail: any) => {
    const finalStatus = String(
      detail.finalDecisionStatus ?? detail.final_decision_status ?? "",
    )
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    return Boolean(
      finalStatus &&
        finalStatus !== "pending" &&
        finalStatus !== "draft" &&
        finalStatus !== "unreviewed",
    );
  };

  const latestFeedbacks = allFeedbacks.filter(
    (detail: any) => detail.isLatestVersion !== false,
  );
  const assignedLatestReviews = (
    latestFeedbacks.length > 0 ? latestFeedbacks : allFeedbacks
  ).filter((detail: any) =>
    Boolean(detail.expertReviewer || detail.reviewer || detail.expert_reviewer),
  );

  const expertReviewsComplete =
    assignedLatestReviews.length > 0 &&
    assignedLatestReviews.every(isExpertReviewSubmitted);
  const hasReviewerFeedback = expertReviewsComplete;
  const currentStatus =
    note.currentStatus?.status ??
    (note as any).current_status?.status ??
    (note as any).current_status?.status_name ??
    (note as any).current_status ??
    "draft";
  const currentStatusLabel = getStatusBadge(currentStatus);
  const approvalStatus =
    note.psrFinalDecision ?? (note as any).psr_final_decision;
  const approvalStatusLabel = getApprovalStatusBadge(
    approvalStatus,
    currentStatus,
  );

  return (
    <PageContainer
      title={note.title || "Approve Concept Note"}
      description="Review expert assessment summaries and make a final governance decision."
      actions={
        <Button variant="outline" asChild className="shadow-sm">
          <Link href={`/policies/concept-notes/manage-concept-notes/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Sidebar: Decision Actions */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          {!hasReviewerFeedback ? (
            <Card className="shadow-sm border-yellow-200 bg-yellow-50/50">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <CardTitle className="text-lg">Decision Locked</CardTitle>
                <CardDescription>
                  Approval decisions are available after assigned reviewers
                  submit their review.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm text-foreground/80">
                  <p>
                    This concept note cannot be approved yet because no reviewer
                    assessments have been submitted.
                  </p>
                  <p>
                    Please assign an expert or wait for the review to complete
                    before making a final decision.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <CardTitle className="text-lg">Your Decision</CardTitle>
                <CardDescription>
                  Make the final decision on this concept note based on the
                  reviewer feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3 sm:grid-cols-2 mb-6">
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Current Status
                    </p>
                    <div>{currentStatusLabel}</div>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Approval Status
                    </p>
                    <div>{approvalStatusLabel}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleApprove}
                    className={cn(
                      "flex items-start text-left w-full p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                      decision === "approve"
                        ? "border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/50 dark:bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0 transition-colors duration-200",
                        decision === "approve"
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary group-hover:bg-primary/20 dark:group-hover:bg-primary/30",
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-semibold text-foreground">
                        Approve Concept Note
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Ready for the next evaluation phase.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleRequestChanges}
                    className={cn(
                      "flex items-start text-left w-full p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                      decision === "request-changes"
                        ? "border-yellow-500 bg-yellow-50/80 shadow-sm ring-1 ring-yellow-500 dark:bg-yellow-500/10"
                        : "border-border hover:border-yellow-500/50 hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0 transition-colors duration-200",
                        decision === "request-changes"
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-500/30",
                      )}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-semibold text-foreground">
                      Request Resubmission
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Needs revision before resubmission.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleReject}
                    className={cn(
                      "flex items-start text-left w-full p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                      decision === "reject"
                        ? "border-red-500 bg-red-50/80 shadow-sm ring-1 ring-red-500 dark:bg-red-500/10"
                        : "border-border hover:border-red-500/50 hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0 transition-colors duration-200",
                        decision === "reject"
                          ? "bg-red-500 text-white"
                          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-500/30",
                      )}
                    >
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-semibold text-foreground">
                        Reject Concept Note
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Does not meet the criteria.
                      </span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content: Reviewer Assessments */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Reviewer Assessments
              </CardTitle>
              <CardDescription>
                Detailed feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6 pr-2">
                {allFeedbacks.length > 0 ? (
                  allFeedbacks.map((review: any, idx: number) => {
                    const reviewerName =
                      review.expertReviewer?.full_name ?? "Anonymous Reviewer";
                    const reviewerEmail = review.expertReviewer?.email ?? "";
                    const reviewerPhoto = review.expertReviewer?.photoUrl ?? "";
                    const displayReviewerName =
                      review.expertReviewer?.fullName ?? reviewerName;

                    return (
                      <div
                        key={idx}
                        className="group relative border rounded-xl p-5 hover:border-primary/30 hover:bg-muted/5 transition-all duration-300"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Header: Reviewer & Recommendation */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm ring-1 ring-border/50">
                                {reviewerPhoto && (
                                  <AvatarImage
                                    src={reviewerPhoto}
                                    alt={displayReviewerName}
                                  />
                                )}
                                <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary uppercase">
                                  {displayReviewerName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-black text-sm text-foreground">
                                    {displayReviewerName}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] scale-90 origin-left px-1.5 py-0"
                                  >
                                    {review.versionNumber}
                                  </Badge>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate">
                                  {reviewerEmail ||
                                    "Technical Committee Member"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className="flex items-center gap-2">
                                {getRecommendationBadge(review.finalDecisionStatus, {
                                  pendingWhenMissing: true,
                                })}
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium">
                                {isExpertReviewSubmitted(review)
                                  ? formatTimestamp(
                                      review.decisionMadeAt ??
                                        review.commentGivenAt,
                                    )
                                  : "Awaiting review"}
                              </p>
                            </div>
                          </div>

                          {/* Feedback Section */}
                          <div className="relative pl-4 border-l-2 border-primary/10">
                            <MessageSquare className="absolute -left-2.25 top-0 h-4 w-4 text-primary/40 bg-background" />
                            <p className="text-sm text-foreground/80 leading-relaxed italic">
                              "{review.comment || "No comment provided."}"
                            </p>
                          </div>

                          {/* Supporting Document */}
                          {review.reviewFile && (
                            <div className="pt-3 mt-1 border-t border-border/50 flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-xs font-medium truncate max-w-[200px] sm:max-w-xs">
                                  {review.reviewFile.split("/").pop()}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-100/50 shrink-0 ml-2"
                                onClick={() =>
                                  setViewerDocument({
                                    url: resolveFileUrl(review.reviewFile) ?? "",
                                    title:
                                      review.reviewFile.split("/").pop() ||
                                      "Review Document",
                                  })
                                }
                              >
                                View File
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl">
                    <ClipboardCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Unreviewed
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Assessments will appear here once reviewers submit their
                      feedback.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0">
          <div
            className={cn(
              "p-6 pb-4 border-b",
              decision === "approve" &&
                "bg-primary/10 dark:bg-primary/10 border-primary/10 dark:border-primary/20",
              decision === "request-changes" &&
                "bg-yellow-50/50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20",
              decision === "reject" &&
                "bg-red-50/50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20",
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {decision === "approve" && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
                {decision === "request-changes" && (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                {decision === "reject" && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Confirm Decision
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed">
                {decision === "approve" &&
                  "You are about to officially approve this concept note. It will proceed to the next stage."}
                {decision === "request-changes" &&
                  "You are requesting further revisions. The author will be notified to update the document."}
                {decision === "reject" &&
                  "You are rejecting this concept note. It will be archived and the author will be notified."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 bg-background">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Feedback / Comments
                </label>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              <Textarea
                placeholder="Add any additional context or rationale for your decision..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="min-h-[120px] resize-none focus-visible:ring-primary/50 shadow-sm"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-muted/10">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="hover:bg-muted/50 font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={approveMutation.isPending}
              className={cn(
                "shadow-sm font-semibold",
                decision === "approve" &&
                  "bg-primary hover:bg-primary/80 text-white",
                decision === "request-changes" &&
                  "bg-yellow-600 hover:bg-yellow-700 text-white",
                decision === "reject" &&
                  "bg-red-600 hover:bg-red-700 text-white",
              )}
            >
              {approveMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Confirm{" "}
                  {decision === "approve"
                    ? "Approval"
                    : decision === "reject"
                      ? "Rejection"
                      : "Changes"}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PdfViewerDialog
        isOpen={!!viewerDocument}
        onOpenChange={(open) => !open && setViewerDocument(null)}
        url={viewerDocument?.url || ""}
        title={viewerDocument?.title}
      />
    </PageContainer>
  );
}
