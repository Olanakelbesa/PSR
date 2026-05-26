"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePolicyDraft } from "@/lib/queries/policy-drafts";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  RefreshCw,
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

import { DraftTabs } from "@/components/policies/drafts/draft-tabs";
import { useAuth } from "@/hooks";

export default function DraftDetailPage() {
  const params = useParams();
  const draftId = (params as any)?.id;
  const { data: rawDraft, isLoading } = usePolicyDraft(draftId);

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

    const normalizedStatus = String(statusValue).toLowerCase().replace(/[\s-]+/g, "_");

    const resolvedStatus = statusMap[normalizedStatus] || "under_review";

    // 2. Map expert reviews from expertFeedback
    const reviewsList: any[] = [];
    const expertFeedback = rawDraft.expertFeedback || rawDraft.expert_feedback || [];
    
    expertFeedback.forEach((vFeed: any) => {
      const version = vFeed.versionNumber || vFeed.version_number || "v1.0.0";
      const details = vFeed.feedbackDetail || vFeed.feedback_detail || [];
      
      details.forEach((det: any, index: number) => {
        const reviewerData = det.expertReviewer || det.expert_reviewer || {};
        const reviewerPosition = reviewerData?.position || "Expert Evaluator";
        const reviewerNameRaw = reviewerData?.fullName || reviewerData?.full_name || "Anonymous Reviewer";
        const isManagerEntry = reviewerPosition === "PSR Manager" || reviewerNameRaw.includes("PSR Manager");

        // Keep expert reviewers anonymous for draft owners.
        const reviewerName = isManagerEntry ? "PSR Manager" : "Anonymous Reviewer";
        const [firstName, ...rest] = reviewerName.split(" ");
        const lastName = rest.join(" ") || "Reviewer";
        
        const checklist = (det.checklistBreakdown || det.checklist_breakdown || []).map((chk: any) => {
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
          comments: det.comment,
          createdAt: det.commentGivenAt || det.comment_given_at || new Date().toISOString(),
          checklist: checklist,
          isPSRManager: isManagerEntry,
          decision: (() => {
            const rawDecision = det.finalDecisionStatus || det.final_decision_status || null;
            if (rawDecision === "approved") return "psr_approved";
            if (rawDecision === "rejected") return "resubmission_required";
            return rawDecision;
          })(),
        });
      });
    });

    // 3. Map version history
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

    const originalConceptNoteId = rawDraft.concept_note?.id ?? rawDraft.conceptNote?.id ?? rawDraft.currentStatus?.conceptId;
    const originalConceptLabel = rawDraft.currentStatus?.conceptId || (originalConceptNoteId ? `CN-${String(originalConceptNoteId).padStart(4, "0")}` : "CN");

    return {
      id: String(rawDraft.id),
      title: rawDraft.title || "Policy Draft",
      versionNumber: rawDraft.currentStatus?.version || rawDraft.versionNumber || "v1.0.0",
      type: (rawDraft.docType?.name ? rawDraft.docType.name.toLowerCase() : "policy") as any,
      docTypeName: rawDraft.docTypeName || rawDraft.docType?.name || "Policy Draft",
      organizationName: rawDraft.organizationName || rawDraft.organization?.name || "",
      status: resolvedStatus as any,
      submissionDate: rawDraft.submittedBy?.submittedAt || rawDraft.submissionDate || new Date().toISOString(),
      submittedBy: {
        firstName: rawDraft.submittedBy?.fullName?.split(" ")[0] || "Proposed",
        lastName: rawDraft.submittedBy?.fullName?.split(" ").slice(1).join(" ") || "User",
        role: "Submitter"
      },
      submittedById: rawDraft.submittedBy?.id ?? null,
      conceptNoteId: originalConceptNoteId,
      conceptNoteLabel: originalConceptLabel,
      conceptNoteTitle: rawDraft.conceptNote?.title || rawDraft.concept_note?.title || "",
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

  const { user } = useAuth();
  const isOwner = Boolean(user && draft && draft.submittedById && String(user.id) === String(draft.submittedById));

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

  return (
    <PageContainer
      title={draft.title}
      description={`Viewing Draft Document: ${draft.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm">
            <Link href="/policies/drafts/my-drafts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drafts
            </Link>
          </Button>
          <Button size="sm" asChild className="shadow-sm">
            <Link href={`/policies/drafts/my-drafts/${draft.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {draft.status === "resubmission_required" && isOwner && (
            <Button asChild className="shadow-sm bg-amber-600 hover:bg-amber-700">
              <Link href={`/policies/drafts/my-drafts/${draft.id}/edit`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resubmit Draft
              </Link>
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
          <Card className="shadow-sm">
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
                <span className="text-sm font-medium">
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
                      href={`/policies/concept-notes/my-concept-note/${draft.conceptNoteId}`}
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

          <Card className="shadow-sm">
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
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border"
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
                          "font-mono font-bold",
                          rev.score >= 70 ? "bg-green-600" : "bg-orange-500",
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
    </PageContainer>
  );
}
