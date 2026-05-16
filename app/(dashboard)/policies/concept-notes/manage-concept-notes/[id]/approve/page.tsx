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
  () => import("@/components/shared/pdf-viewer-dialog").then((mod) => mod.PdfViewerDialog),
  { ssr: false }
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
  recommendation: "approve" | "revise" | "reject";
  score: number;
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
    score: 92,
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
    recommendation: "revise",
    score: 88,
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
  const [viewerDocument, setViewerDocument] = useState<{ url: string; title: string } | null>(null);

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
    if (!decision || !decisionNotes.trim()) {
      toast.error("Please provide feedback for your decision.");
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
  const averageScore = Math.round(
    reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length,
  );

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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Summary */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Reviewer Assessments
              </CardTitle>
              <CardDescription>
                Detailed feedback from technical reviewers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
                              {review.reviewer.firstName}{" "}
                              {review.reviewer.lastName}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                              {review.reviewer.position} ·{" "}
                              {review.reviewer.institution}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] bg-background border-primary/20"
                            >
                              {review.score}/100
                            </Badge>
                            {review.recommendation === "approve" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20">
                                <ThumbsUp className="mr-1 h-3 w-3" />
                                APPROVE
                              </Badge>
                            ) : review.recommendation === "revise" ? (
                              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20">
                                <Clock className="mr-1 h-3 w-3" />
                                REVISE
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/20">
                                <ThumbsDown className="mr-1 h-3 w-3" />
                                REJECT
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">
                            Submitted{" "}
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div className="relative pl-4 border-l-2 border-primary/10">
                        <MessageSquare className="absolute -left-[9px] top-0 h-4 w-4 text-primary/40 bg-background" />
                        <p className="text-sm text-foreground/80 leading-relaxed italic italic-feedback">
                          "{review.feedback}"
                        </p>
                      </div>

                      {/* Supporting Document */}
                      {review.document && (
                        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 group/doc hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded bg-blue-100 text-blue-600">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate text-blue-900">
                                {review.document.name}
                              </p>
                              <p className="text-[10px] text-blue-600 font-medium">
                                Supporting Document
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-100/50"
                            onClick={() => setViewerDocument({ url: review.document!.url, title: review.document!.name })}
                          >
                            VIEW
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Decision Actions */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-lg">Your Decision</CardTitle>
              <CardDescription>
                Make the final decision on this concept note
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={handleApprove}
                  variant={decision === "approve" ? "default" : "outline"}
                  className={cn(
                    decision === "approve" && "bg-green-600 hover:bg-green-700",
                  )}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={handleRequestChanges}
                  variant={
                    decision === "request-changes" ? "default" : "outline"
                  }
                  className={cn(
                    decision === "request-changes" &&
                      "bg-yellow-600 hover:bg-yellow-700",
                  )}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Request Changes
                </Button>
                <Button
                  onClick={handleReject}
                  variant={decision === "reject" ? "destructive" : "outline"}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base">Reviewer Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Total reviewers: {reviews.length}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Recommend approve: {approveCount}</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span>Request revision: {reviseCount}</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <ThumbsDown className="h-4 w-4" />
                  <span>Recommend reject: {rejectCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-blue-200/50 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Note
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Your decision will be communicated to the submission team. Please
              provide clear feedback for transparency.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Decision</DialogTitle>
            <DialogDescription>
              {decision === "approve" &&
                "You are about to approve this concept note."}
              {decision === "request-changes" &&
                "You are requesting changes to this concept note."}
              {decision === "reject" && "You are rejecting this concept note."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Feedback / Comments
              </label>
              <Textarea
                placeholder="Provide detailed feedback for your decision..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="min-h-30 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={isSubmitting}
              className={cn(
                decision === "approve" && "bg-green-600 hover:bg-green-700",
                decision === "request-changes" &&
                  "bg-yellow-600 hover:bg-yellow-700",
              )}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PdfViewerDialog 
        isOpen={!!viewerDocument}
        onOpenChange={(open) => !open && setViewerDocument(null)}
        url={viewerDocument?.url || ""}
      />
    </PageContainer>
  );
}
