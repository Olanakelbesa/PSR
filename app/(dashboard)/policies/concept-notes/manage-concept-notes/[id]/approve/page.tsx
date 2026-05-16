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
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { StatusBadge } from "@/components/shared";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

type ReviewSummary = {
  id: string;
  reviewer: {
    firstName: string;
    lastName: string;
    position: string;
    institution: string;
    image?: string;
  };
  recommendation?: "approve" | "revise" | "reject";
  feedback: string;
  document?: {
    name: string;
    url: string;
  };
  createdAt: string;
};

const mockReviews: ReviewSummary[] = [
  {
    id: "REV-001",
    reviewer: {
      firstName: "Dr. Kassahun",
      lastName: "Taye",
      position: "Senior Policy Analyst",
      institution: "Ministry of Education",
    },
    recommendation: "approve",
    feedback:
      "The concept note is exceptionally well-structured. The alignment with national education goals is clear, and the proposed implementation timeline is realistic. I suggest highlighting the budgetary requirements more explicitly in the full draft.",
    document: {
      name: "PSR_FRS_v1.pdf",
      url: "/doc/PSR_FRS_v1.pdf",
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "REV-002",
    reviewer: {
      firstName: "Elena",
      lastName: "Girma",
      position: "Technical Specialist",
      institution: "PSR Technical Committee",
    },
    feedback:
      "The background section needs more data on existing gaps. While the policy direction is sound, the stakeholder engagement plan feels generic. Please specify the target groups for the consultation phase.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ApproveConceptNotePage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<
    "approve" | "request-changes" | "reject" | null
  >(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [reviews] = useState(mockReviews);
  const [viewerDocument, setViewerDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

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

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const decisionText =
        decision === "approve"
          ? "Approved"
          : decision === "request-changes"
            ? "Requested Changes"
            : "Rejected";
      toast.success(`Concept note ${decisionText.toLowerCase()}.`);
      router.push(`/policies/concept-notes/manage-concept-notes/${params.id}`);
    } catch {
      toast.error("Failed to submit decision. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowDialog(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading approval page...">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </PageContainer>
    );
  }

  const approveCount = reviews.filter(
    (r) => r.recommendation === "approve",
  ).length;
  const reviseCount = reviews.filter(
    (r) => r.recommendation === "revise",
  ).length;
  const rejectCount = reviews.filter(
    (r) => r.recommendation === "reject",
  ).length;

  return (
    <PageContainer
      title="Approve Concept Note"
      description={`Review assessment summary and make final decision for: ${params.id}`}
      actions={
        <Button variant="outline" asChild className="shadow-sm">
          <Link
            href={`/policies/concept-notes/manage-concept-notes/${params.id}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Sidebar: Decision Actions */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-lg">Your Decision</CardTitle>
              <CardDescription>
                Make the final decision on this concept note based on the reviewer feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleApprove}
                  className={cn(
                    "flex items-start text-left w-full p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                    decision === "approve"
                      ? "border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/50 dark:bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 transition-colors duration-200",
                    decision === "approve" ? "bg-primary text-white" : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary group-hover:bg-primary/20 dark:group-hover:bg-primary/30"
                  )}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-foreground">Approve Concept Note</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Ready for the next evaluation phase.</span>
                  </div>
                </button>

                <button
                  onClick={handleRequestChanges}
                  className={cn(
                    "flex items-start text-left w-full p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                    decision === "request-changes"
                      ? "border-yellow-500 bg-yellow-50/80 shadow-sm ring-1 ring-yellow-500 dark:bg-yellow-500/10"
                      : "border-border hover:border-yellow-500/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 transition-colors duration-200",
                    decision === "request-changes" ? "bg-yellow-500 text-white" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-500/30"
                  )}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-foreground">Request Changes</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Needs revision before approval.</span>
                  </div>
                </button>

                <button
                  onClick={handleReject}
                  className={cn(
                    "flex items-start text-left w-full p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                    decision === "reject"
                      ? "border-red-500 bg-red-50/80 shadow-sm ring-1 ring-red-500 dark:bg-red-500/10"
                      : "border-border hover:border-red-500/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 transition-colors duration-200",
                    decision === "reject" ? "bg-red-500 text-white" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-500/30"
                  )}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-foreground">Reject Concept Note</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Does not meet the criteria.</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
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
                Detailed feedback and recommendations from the technical committee
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6 pr-2">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="group relative border rounded-xl p-5 hover:border-primary/30 hover:bg-muted/5 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header: Reviewer & Recommendation */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm ring-1 ring-border/50">
                            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary uppercase">
                              {review.reviewer.firstName[0]}
                              {review.reviewer.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-sm text-foreground">
                              {review.reviewer.firstName} {review.reviewer.lastName}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                              {review.reviewer.position} · {review.reviewer.institution}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-2">
                            {review.recommendation === "approve" ? (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                              </Badge>
                            ) : review.recommendation === "revise" ? (
                              <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                                <Clock className="mr-1 h-3 w-3" /> Revise
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                                <AlertCircle className="mr-1 h-3 w-3" /> Reject
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div className="relative pl-4 border-l-2 border-primary/10">
                        <MessageSquare className="absolute -left-2.25 top-0 h-4 w-4 text-primary/40 bg-background" />
                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                          "{review.feedback}"
                        </p>
                      </div>

                      {/* Supporting Document */}
                      {review.document && (
                        <div className="pt-3 mt-1 border-t border-border/50 flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">
                              {review.document.name}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-100/50 shrink-0 ml-2"
                            onClick={() =>
                              setViewerDocument({
                                url: review.document!.url,
                                title: review.document!.name,
                              })
                            }
                          >
                            VIEW PDF
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0">
          <div className={cn(
            "p-6 pb-4 border-b",
            decision === "approve" && "bg-primary/10 dark:bg-primary/10 border-primary/10 dark:border-primary/20",
            decision === "request-changes" && "bg-yellow-50/50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20",
            decision === "reject" && "bg-red-50/50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
          )}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {decision === "approve" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {decision === "request-changes" && <Clock className="h-5 w-5 text-yellow-600" />}
                {decision === "reject" && <AlertCircle className="h-5 w-5 text-red-600" />}
                Confirm Decision
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed">
                {decision === "approve" && "You are about to officially approve this concept note. It will proceed to the next stage."}
                {decision === "request-changes" && "You are requesting further revisions. The author will be notified to update the document."}
                {decision === "reject" && "You are rejecting this concept note. It will be archived and the author will be notified."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 bg-background">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Feedback / Comments
                </label>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full">Optional</span>
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
            <Button variant="ghost" onClick={() => setShowDialog(false)} className="hover:bg-muted/50 font-medium">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={isSubmitting}
              className={cn(
                "shadow-sm font-semibold",
                decision === "approve" && "bg-primary hover:bg-primary/80 text-white",
                decision === "request-changes" && "bg-yellow-600 hover:bg-yellow-700 text-white",
                decision === "reject" && "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Confirm {decision === 'approve' ? 'Approval' : decision === 'reject' ? 'Rejection' : 'Changes'}
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
