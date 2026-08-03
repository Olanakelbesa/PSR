"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Award,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCreateExternalResearchApproval,
  externalResearchKeys,
} from "@/hooks/useExternalResearch";

interface GradeExternalResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalResearch: {
    id: number;
    title: string;
    authors?: string | null;
    institution?: string | null;
    abstract?: string | null;
    uploaded_by_name?: string | null;
    graded_evidence?: string | null;
  };
}

export function GradeExternalResearchModal({
  isOpen,
  onClose,
  externalResearch,
}: GradeExternalResearchModalProps) {
  const queryClient = useQueryClient();
  const createApprovalMutation = useCreateExternalResearchApproval();

  const [gradedEvidence, setGradedEvidence] = useState<string>("not_graded");
  const [recommendation, setRecommendation] = useState<string>("");
  const [reportComments, setReportComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (externalResearch) {
      setGradedEvidence(externalResearch.graded_evidence || "not_graded");
    }
  }, [externalResearch]);

  const handleEvaluate = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !recommendation.trim() && !reportComments.trim()) {
      toast.error("Please provide feedback comments explaining why resubmission/rejection is requested.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        external_research: externalResearch.id,
        decision,
        recommendation: recommendation.trim(),
        report_comments: reportComments.trim(),
        graded_evidence: gradedEvidence,
      };

      await createApprovalMutation.mutateAsync(payload);

      toast.success(
        decision === "approved"
          ? "External Research successfully approved!"
          : "Resubmission request sent with review comments.",
        {
          description:
            decision === "approved"
              ? "The research status is now marked as Approved."
              : "The submitter will be able to update and resubmit their entry.",
        }
      );

      queryClient.invalidateQueries({ queryKey: externalResearchKeys.all });

      onClose();
    } catch (err: any) {
      toast.error("Evaluation Error", {
        description: err?.message || "Failed to record evaluation decision.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto sm:rounded-xl p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Reviewer Evaluation & Evidence Grading
              </DialogTitle>
              <DialogDescription className="text-xs">
                Assess evidence tier grade and record committee decision.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-3">
          {/* Research Summary Header Card */}
          <Card className="bg-muted/30 border border-border/60 shadow-2xs">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug">
                    {externalResearch.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Institution: <span className="font-semibold text-foreground">{externalResearch.institution || "Unknown"}</span> | Authors: <span className="font-semibold text-foreground">{externalResearch.authors || "Unknown"}</span>
                  </p>
                </div>
              </div>

              {externalResearch.abstract && (
                <div className="pt-2 border-t text-xs text-muted-foreground line-clamp-2">
                  <span className="font-bold text-foreground">Abstract: </span>
                  {externalResearch.abstract}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graded Evidence Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              Graded Evidence Tier
            </label>
            <Select
              value={gradedEvidence}
              onValueChange={(val) => setGradedEvidence(val)}
            >
              <SelectTrigger className="w-full h-10 text-xs font-semibold">
                <SelectValue placeholder="Select evidence level..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Evidence Tier</SelectItem>
                <SelectItem value="medium">Medium Evidence Tier</SelectItem>
                <SelectItem value="low">Low Evidence Tier</SelectItem>
                <SelectItem value="not_graded">Not Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviewer Feedback Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              Reviewer Recommendation & Notes
            </label>
            <Textarea
              rows={4}
              placeholder="Provide committee recommendation or feedback notes for the submitter..."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="text-xs leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-3 flex-col sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto h-9 text-xs">
            Cancel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => handleEvaluate("rejected")}
              className="flex-1 sm:flex-none h-9 text-xs font-bold gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Request Revision / Reject
            </Button>

            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none h-9 text-xs font-bold gap-1.5"
              disabled={isSubmitting}
              onClick={() => handleEvaluate("approved")}
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Approve & Save Grade
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
