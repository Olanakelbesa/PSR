"use client";

import { useMemo } from "react";
import {
  GitBranch,
  Calendar,
  FileText,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ConceptNoteFeedbackProps {
  feedback?: any[];
  reviews?: any[];
}

export function ConceptNoteFeedback({
  feedback,
  reviews,
}: ConceptNoteFeedbackProps) {
  const items = feedback ?? reviews ?? [];

  const normalizedVersions = useMemo(() => {
    // Case 1: Items are already versioned blocks containing nested feedbackDetail
    const hasNestedDetails = items.some((item: any) => Array.isArray(item.feedbackDetail));
    if (hasNestedDetails) {
      return items.map((item: any) => ({
        versionNumber: item.versionNumber || "v1.0.0",
        isLatest: item.isLatest || false,
        isResubmission: item.isResubmission || false,
        feedbackDetail: item.feedbackDetail || [],
      }));
    }

    // Case 2: Items are flat review items, group them by version number
    const grouped = items.reduce((acc: Record<string, any[]>, review: any) => {
      const v = review.versionNumber || review.version || "v1.0.0";
      if (!acc[v]) acc[v] = [];
      acc[v].push(review);
      return acc;
    }, {});

    return Object.entries(grouped).map(([versionNumber, reviewsList]) => {
      const mappedDetails = (reviewsList as any[]).map((rev: any, idx: number) => ({
        expertReviewer: {
          id: rev.reviewerId || rev.id || `rev-${idx}`,
          fullName: rev.reviewer?.firstName && rev.reviewer?.lastName
            ? `${rev.reviewer.firstName} ${rev.reviewer.lastName}`
            : `Reviewer ${idx + 1}`,
          email: rev.reviewer?.email || "",
          photoUrl: rev.reviewer?.image || null,
        },
        comment: rev.comments || rev.feedback || "",
        reviewFile: rev.supportingDocument ? rev.supportingDocument.url : null,
        commentGivenAt: rev.createdAt || null,
        finalDecisionStatus: rev.recommendation || rev.decision || "approve",
        supportingDocument: rev.supportingDocument || null,
        score: rev.score || null,
        criteria: rev.criteria || [],
        decision: rev.decision || null,
      }));

      return {
        versionNumber,
        isLatest: versionNumber === "v1.0.0",
        isResubmission: false,
        feedbackDetail: mappedDetails,
      };
    });
  }, [items]);

  if (!normalizedVersions.length) {
    return (
      <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-muted-foreground">
          No Feedback Yet
        </h3>
        <p className="text-sm text-muted-foreground">
          This concept note is still awaiting expert evaluation.
        </p>
      </div>
    );
  }

  // Sort versions descending (latest first)
  const sortedVersions = [...normalizedVersions].sort((a, b) =>
    b.versionNumber.localeCompare(a.versionNumber),
  );

  return (
    <div className="space-y-6">
      <Accordion
        type="single"
        collapsible
        defaultValue={sortedVersions[0]?.versionNumber}
        className="space-y-4"
      >
        {sortedVersions.map((versionBlock) => {
          const version = versionBlock.versionNumber;
          const feedbackList = versionBlock.feedbackDetail;

          return (
            <Card
              key={version}
              className="overflow-hidden border-primary/10 shadow-sm"
            >
              <AccordionItem value={version} className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 w-full text-left">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {version}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent" />
                    <div className="flex items-center gap-4 mr-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {feedbackList.length} Expert Assessment
                        {feedbackList.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="grid gap-6">
                    {feedbackList.map((review: any, idx: number) => {
                      const reviewerName = review.expertReviewer?.fullName || "Anonymous Reviewer";
                      const reviewerEmail = review.expertReviewer?.email || "";
                      const reviewerPhoto = review.expertReviewer?.photoUrl;
                      const reviewerId = review.expertReviewer?.id || `rev-${idx}`;
                      const uniqueCardKey = `${version}-${reviewerId}-${idx}`;

                      return (
                        <Card
                          key={uniqueCardKey}
                          className="shadow-sm border-primary/5 bg-background/50 overflow-hidden hover:shadow-md transition-all duration-300"
                        >
                          <CardHeader className="bg-muted/20 border-b py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-background">
                                  {reviewerPhoto && (
                                    <AvatarImage src={reviewerPhoto} alt={reviewerName} />
                                  )}
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase">
                                    {reviewerName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">
                                    {reviewerName}
                                  </span>
                                  {reviewerEmail && (
                                    <span className="text-xs text-muted-foreground">
                                      {reviewerEmail}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                                    review.finalDecisionStatus === "accepted" ||
                                      review.finalDecisionStatus === "approve"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : review.finalDecisionStatus === "partially_accepted" ||
                                        review.finalDecisionStatus === "revision" ||
                                        review.finalDecisionStatus === "revise"
                                        ? "bg-orange-100 text-orange-700 border-orange-200"
                                        : "bg-red-100 text-red-700 border-red-200",
                                  )}
                                >
                                  {review.finalDecisionStatus === "accepted" || review.finalDecisionStatus === "approve"
                                    ? "Accepted"
                                    : review.finalDecisionStatus === "partially_accepted" ||
                                      review.finalDecisionStatus === "revision" ||
                                      review.finalDecisionStatus === "revise"
                                      ? "Partially Accepted"
                                      : "Rejected"}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-5 pb-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                  Expert Feedback
                                </h4>
                                <p className="text-sm leading-relaxed text-slate-700 italic border-l-4 border-muted pl-4">
                                  {review.comment || "No detailed feedback notes recorded yet."}
                                </p>
                              </div>

                              {review.reviewFile && (
                                <div className="pt-2">
                                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                    Supporting Document
                                  </h4>
                                  <div 
                                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/20 w-fit group cursor-pointer hover:border-primary/30 transition-colors"
                                    onClick={() => window.open(review.reviewFile, "_blank")}
                                  >
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-medium group-hover:text-primary transition-colors">
                                      {review.reviewFile.split("/").pop()}
                                    </span>
                                    <Download className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <div className="bg-muted/10 border-t py-2 px-4 flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {review.commentGivenAt
                                ? `Reviewed on ${new Date(review.commentGivenAt).toLocaleDateString()}`
                                : `Version ${version}`}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground/60">
                              {reviewerId}
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
    </div>
  );
}
