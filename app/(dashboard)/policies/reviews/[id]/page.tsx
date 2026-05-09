"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  Building,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { POLICY_TYPES } from "@/lib/constants";
import type { PolicyStatus, PolicyType } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data to simulate API response
const getMockDetail = (id: string) => ({
  id,
  title: "National Digital Education Strategy 2024-2030",
  type: "strategy" as PolicyType,
  status: "under_review" as PolicyStatus,
  priority: "high",
  submitter: { firstName: "Solomon", lastName: "Ayele" },
  organization: "MoE - ICT Directorate",
  submissionTimestamp: "2024-05-01T10:30:00Z",
  deadline: "2024-05-15T23:59:59Z",
  executiveSummary:
    "This strategy outlines the national approach to integrating digital technology in education across all levels, addressing the gaps identified during the previous five-year plan. It focuses on ensuring equitable access to digital resources, expanding infrastructure, and enhancing teacher digital literacy.",
  thematicAreas: ["Education Technology", "Digital Infrastructure", "Curriculum Development"],
  documentCategory: "New",
  versionNumber: "v1.0.0",
  attachments: [
    { id: "att-1", name: "Digital_Edu_Strategy_Draft_v2.pdf", size: "2.4 MB" },
  ],
});

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600 border-blue-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-600 border-orange-200" },
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reviewItem, setReviewItem] = useState<ReturnType<typeof getMockDetail> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState("");
  const [score, setScore] = useState<number | "">("");

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setReviewItem(getMockDetail(params.id as string));
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [params.id]);

  const handleReviewSubmit = async (decision: "approve" | "revise" | "reject") => {
    if (score === "" || score < 0 || score > 100) {
      toast.error("Please provide a valid score between 0 and 100.");
      return;
    }
    
    if (!comments.trim() && decision !== "approve") {
      toast.error("Please provide comments for your decision.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const statusMap = {
        approve: "approved",
        revise: "revision_requested",
        reject: "archived", // or rejected based on your statuses
      };
      
      setReviewItem((prev) => prev ? { ...prev, status: statusMap[decision] as PolicyStatus } : null);
      
      toast.success(`Review submitted successfully. Document marked as ${decision}.`);
      router.push("/policies/reviews");
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!reviewItem) return null;

  return (
    <PageContainer
      title="Review Document"
      description={`Reviewing ${reviewItem.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/reviews">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reviews
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Document Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {reviewItem.id}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium border-primary/20 text-primary bg-primary/5">
                      {reviewItem.documentCategory}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">{reviewItem.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {reviewItem.executiveSummary}
                </p>
              </div>
              <Separator className="bg-muted" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" /> Thematic Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {reviewItem.thematicAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="font-medium">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Attached Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {reviewItem.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="group flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Review Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <StatusBadge type="policy" status={reviewItem.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="outline" className="font-mono bg-muted/50">
                  {reviewItem.versionNumber}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Document Type</span>
                <span className="text-sm font-medium">
                  {POLICY_TYPES[reviewItem.type]?.label || reviewItem.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-semibold border",
                    priorityConfig[reviewItem.priority as keyof typeof priorityConfig].color
                  )}
                >
                  {priorityConfig[reviewItem.priority as keyof typeof priorityConfig].label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">Submitted By</span>
                    <span className="text-sm font-medium">
                      {reviewItem.submitter.firstName} {reviewItem.submitter.lastName}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">Organization</span>
                    <span className="text-sm font-medium">{reviewItem.organization}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between  w-full">
                    <span className="text-xs text-muted-foreground">Submission Timestamp</span>
                    <span className="text-sm font-medium">
                      {new Date(reviewItem.submissionTimestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="flex items-center justify-between  w-full">
                    <span className="text-xs text-orange-600/80">Review Deadline</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {new Date(reviewItem.deadline).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Meta Info & Review Actions */}
        <div className="space-y-6">

          {/* Action Panel */}
          {reviewItem.status !== "approved" && (
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Your Review</CardTitle>
                <CardDescription>
                  Provide feedback and submit your decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 flex flex-col items-start">
                  <label className="text-sm font-medium">Score (out of 100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    value={score}
                    onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments & Feedback</label>
                  <Textarea
                    placeholder="Enter your detailed review comments here..."
                    className="min-h-[120px] resize-none"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2 pt-0">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                  onClick={() => handleReviewSubmit("approve")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Document
                </Button>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    disabled={isSubmitting}
                    onClick={() => handleReviewSubmit("revise")}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Request Revision
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={isSubmitting}
                    onClick={() => handleReviewSubmit("reject")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
