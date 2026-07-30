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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ExternalLink,
  Award,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  useTerminalReportGrades,
  useCreateTerminalReportApproval,
  terminalReportApprovalKeys,
  terminalReportKeys,
} from "@/hooks/useProgressReports";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

interface TerminalReportItemDetail {
  id: number;
  terminal_type: number;
  terminal_type_name?: string;
  file?: string | null;
  external_link?: string | null;
  grade?: number | null;
  grade_name?: string | null;
  grade_comments?: string | null;
}

interface GradeTerminalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalReport: {
    id: number;
    report_name?: string | null;
    project_tracking_title?: string | null;
    main_deliverables?: string;
    submitted_by_name?: string | null;
    items?: TerminalReportItemDetail[];
    data_center_name?: string | null;
  };
}

export function GradeTerminalReportModal({
  isOpen,
  onClose,
  terminalReport,
}: GradeTerminalReportModalProps) {
  const queryClient = useQueryClient();
  const { data: availableGrades = [], isLoading: isLoadingGrades } =
    useTerminalReportGrades();
  const createApprovalMutation = useCreateTerminalReportApproval();

  const [itemGrades, setItemGrades] = useState<
    Record<number, { grade_id?: number; grade_comments?: string }>
  >({});
  const [rocComments, setRocComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (terminalReport?.items) {
      const initial: Record<number, { grade_id?: number; grade_comments?: string }> = {};
      terminalReport.items.forEach((item) => {
        initial[item.id] = {
          grade_id: item.grade || undefined,
          grade_comments: item.grade_comments || "",
        };
      });
      setItemGrades(initial);
    }
  }, [terminalReport]);

  const handleGradeChange = (itemId: number, gradeId: number) => {
    setItemGrades((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        grade_id: gradeId,
      },
    }));
  };

  const handleGradeCommentsChange = (itemId: number, comments: string) => {
    setItemGrades((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        grade_comments: comments,
      },
    }));
  };

  const handleEvaluate = async (decision: "approved" | "rejected") => {
    if (decision === "approved") {
      const itemsList = terminalReport.items || [];
      const missingGrades = itemsList.filter(
        (it) => !itemGrades[it.id]?.grade_id
      );
      if (missingGrades.length > 0 && availableGrades.length > 0) {
        toast.error("Please assign a grade for each submitted deliverable type before approval.");
        return;
      }
    }

    if (decision === "rejected" && !rocComments.trim()) {
      toast.error("Please provide feedback comments explaining why resubmission is requested.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedItemGrades = Object.entries(itemGrades).map(
        ([itemId, val]) => ({
          item_id: Number(itemId),
          grade_id: val.grade_id,
          grade_comments: val.grade_comments,
        })
      );

      const payload = {
        terminal_report: terminalReport.id,
        decision,
        ROC_Comments: rocComments,
        item_grades: formattedItemGrades,
      };

      await createApprovalMutation.mutateAsync(payload as any);

      toast.success(
        decision === "approved"
          ? "Terminal Report successfully approved and graded!"
          : "Resubmission request sent to investigator with feedback.",
        {
          description:
            decision === "approved"
              ? "The project status is now marked as Completed."
              : "The investigator will be able to update and resubmit their report.",
        }
      );

      queryClient.invalidateQueries({ queryKey: terminalReportKeys.all });
      queryClient.invalidateQueries({ queryKey: terminalReportApprovalKeys.all });

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Reviewer Evaluation & Dynamic Grading
              </DialogTitle>
              <DialogDescription>
                Assign grades per submitted report deliverable and approve or request resubmission.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Project Summary Header Card */}
          <Card className="bg-muted/40 border">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {terminalReport.project_tracking_title || terminalReport.report_name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Submitted by: {terminalReport.submitted_by_name || "Investigator"}
                  </p>
                </div>
                {terminalReport.data_center_name && (
                  <Badge variant="secondary" className="text-xs">
                    Data Center: {terminalReport.data_center_name}
                  </Badge>
                )}
              </div>

              {terminalReport.main_deliverables && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Main Deliverables: </span>
                  {terminalReport.main_deliverables}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section: Per-Item Dynamic Grading */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Deliverables & Per-Type Grading
            </h4>

            {(!terminalReport.items || terminalReport.items.length === 0) ? (
              <p className="text-xs text-muted-foreground italic">
                No individual deliverable items attached to this report.
              </p>
            ) : (
              <div className="space-y-3">
                {terminalReport.items.map((item) => {
                  const currentGradeId = itemGrades[item.id]?.grade_id;
                  const currentComments = itemGrades[item.id]?.grade_comments || "";

                  return (
                    <Card key={item.id} className="border">
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-muted/20">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Badge variant="outline">
                            {item.terminal_type_name || `Type #${item.terminal_type}`}
                          </Badge>
                        </CardTitle>

                        <div>
                          {item.file && (
                            <a
                              href={resolveFileUrl(item.file)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline flex items-center gap-1 font-medium"
                            >
                              View File <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {item.external_link && (
                            <a
                              href={item.external_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline flex items-center gap-1 font-medium"
                            >
                              External Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold">
                            Assign Deliverable Grade *
                          </label>
                          {isLoadingGrades ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading dynamic grades...
                            </div>
                          ) : (
                            <Select
                              value={currentGradeId ? String(currentGradeId) : ""}
                              onValueChange={(val) => handleGradeChange(item.id, Number(val))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select dynamic grade (e.g., Excellent, Good)..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableGrades.map((g) => (
                                  <SelectItem key={g.id} value={String(g.id)}>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="font-semibold">{g.name}</span>
                                      {g.description && (
                                        <span className="text-xs text-muted-foreground">
                                          ({g.description})
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Deliverable Specific Grade Feedback (Optional)
                          </label>
                          <Textarea
                            rows={2}
                            placeholder="Add specific comments regarding this deliverable..."
                            value={currentComments}
                            onChange={(e) =>
                              handleGradeCommentsChange(item.id, e.target.value)
                            }
                            className="text-xs"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Reviewer Feedback & Comments */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Reviewer Summary Feedback / Resubmission Notes
            </label>
            <Textarea
              rows={4}
              placeholder="Provide overall reviewer comments or feedback notes for the investigator..."
              value={rocComments}
              onChange={(e) => setRocComments(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => handleEvaluate("rejected")}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Request Resubmission
            </Button>

            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
              onClick={() => handleEvaluate("approved")}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve & Save Grades
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
