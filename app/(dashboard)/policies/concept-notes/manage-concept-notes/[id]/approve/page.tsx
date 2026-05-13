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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  };
  recommendation: "approve" | "revise" | "reject";
  score: number;
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
                Review Summary
              </CardTitle>
              <CardDescription>
                Consolidated feedback from all reviewers
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {averageScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg Score
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {approveCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Approve
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {reviseCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Revise
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {rejectCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Reject
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="text-sm font-bold">
                            {review.reviewer.firstName[0]}
                            {review.reviewer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">
                            {review.reviewer.firstName}{" "}
                            {review.reviewer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review.reviewer.position}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review.reviewer.institution}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="font-bold">{review.score}</Badge>
                        {review.recommendation === "approve" && (
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            Approve
                          </Badge>
                        )}
                        {review.recommendation === "revise" && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Revise
                          </Badge>
                        )}
                        {review.recommendation === "reject" && (
                          <Badge variant="destructive">
                            <ThumbsDown className="mr-1 h-3 w-3" />
                            Reject
                          </Badge>
                        )}
                      </div>
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
    </PageContainer>
  );
}
