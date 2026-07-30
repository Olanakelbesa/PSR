"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Loader2,
  Download,
  Eye,
  User,
  Calendar,
  Building,
  Paperclip,
  Info,
  Tag,
  Mail,
  ArrowLeft,
  MessageSquare,
  Copy,
  Check,
  Globe,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTerminalReportGrades,
  useCreateTerminalReportApproval,
  terminalReportApprovalKeys,
  terminalReportKeys,
} from "@/hooks/useProgressReports";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { downloadConceptNoteAttachment } from "@/lib/utils/concept-note-attachments";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface TerminalReportEvaluationFormProps {
  terminalReport: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TerminalReportEvaluationForm({
  terminalReport,
  onSuccess,
  onCancel,
}: TerminalReportEvaluationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: availableGrades = [], isLoading: isLoadingGrades } =
    useTerminalReportGrades();
  const createApprovalMutation = useCreateTerminalReportApproval();

  const [itemGrades, setItemGrades] = useState<
    Record<number, { grade_id?: number; grade_comments?: string }>
  >({});
  const [rocComments, setRocComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Active preview document tab
  const rawItems = useMemo(() => terminalReport?.items || [], [terminalReport]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [pdfDialogOpen, setPdfDialogOpen] = useState<boolean>(false);

  // Deliverables list (including primary attachment if present)
  const items = useMemo(() => {
    if (rawItems.length > 0) return rawItems;
    if (terminalReport?.attachment) {
      return [
        {
          id: 0,
          terminal_type_name: "Primary Terminal Report",
          file: terminalReport.attachment,
          external_link: terminalReport.publication_link || terminalReport.publicationLink,
        },
      ];
    }
    return [];
  }, [rawItems, terminalReport]);

  useEffect(() => {
    if (items.length > 0) {
      const initial: Record<number, { grade_id?: number; grade_comments?: string }> = {};
      items.forEach((item: any) => {
        if (item.id !== undefined) {
          initial[item.id] = {
            grade_id: item.grade || undefined,
            grade_comments: item.grade_comments || item.gradeComments || "",
          };
        }
      });
      setItemGrades(initial);
    }

    const existingComments =
      terminalReport?.reviewer_comments ||
      terminalReport?.reviewerComments ||
      terminalReport?.approvals?.[0]?.ROC_Comments ||
      terminalReport?.approvals?.[0]?.ROCComments ||
      terminalReport?.approvals?.[0]?.comment ||
      "";
    setRocComments(existingComments);
  }, [terminalReport, items]);

  const activeItem = items[activeItemIndex] || items[0] || null;
  const activeFileUrl = resolveFileUrl(activeItem?.file || terminalReport?.attachment);

  const gradedCount = useMemo(() => {
    return Object.values(itemGrades).filter((v) => !!v.grade_id).length;
  }, [itemGrades]);

  const projectTracking = terminalReport?.project_tracking || {};
  const refNum =
    terminalReport?.reference_number ||
    terminalReport?.referenceNumber ||
    projectTracking?.reference_number ||
    projectTracking?.referenceNumber ||
    `TR-#${terminalReport?.id}`;

  const proposalTitle =
    terminalReport?.project_tracking_title ||
    projectTracking?.title ||
    terminalReport?.report_name ||
    "Untitled Proposal";

  const submittedByName =
    terminalReport?.submitted_by_name ||
    terminalReport?.submittedByName ||
    "Investigator";
  const submittedByPhotoUrl = resolveFileUrl(
    terminalReport?.submitted_by_photo_url || terminalReport?.submittedByPhotoUrl
  );
  const submittedByEmail =
    terminalReport?.submitted_by_email || terminalReport?.submittedByEmail;
  const submitterInitials = getInitials(submittedByName, "SB");

  const piData = terminalReport?.pi || projectTracking?.pi || null;
  const piName = piData?.full_name || piData?.fullName || submittedByName;
  const piPhotoUrl = resolveFileUrl(piData?.photo_url || piData?.photoUrl);
  const piEmail = piData?.email;
  const piDepartment = piData?.department;
  const piInitials = getInitials(piName, "PI");

  const dataCenter =
    terminalReport?.data_center_name ||
    terminalReport?.dataCenterName ||
    terminalReport?.data_center ||
    "Ethiotelecom Data Center";

  const handleCopyReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!refNum) return;
    navigator.clipboard.writeText(refNum);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!", {
      description: refNum,
    });
    setTimeout(() => setCopiedRef(false), 2000);
  };

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
    if (decision === "approved" && rawItems.length > 0) {
      const missingGrades = rawItems.filter((it: any) => !itemGrades[it.id]?.grade_id);
      if (missingGrades.length > 0 && availableGrades.length > 0) {
        toast.error("Please assign a grade for each submitted deliverable item before approving.");
        return;
      }
    }

    if (decision === "rejected" && !rocComments.trim()) {
      toast.error("Please provide feedback notes explaining why resubmission is requested.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedItemGrades = Object.entries(itemGrades)
        .filter(([itemId]) => Number(itemId) > 0)
        .map(([itemId, val]) => ({
          item_id: Number(itemId),
          grade_id: val.grade_id,
          grade_comments: val.grade_comments,
        }));

      const payload = {
        terminal_report: terminalReport.id,
        decision,
        ROC_Comments: rocComments,
        item_grades: formattedItemGrades,
      };

      await createApprovalMutation.mutateAsync(payload as any);

      toast.success(
        decision === "approved"
          ? "Terminal report evaluation successfully approved & graded!"
          : "Resubmission request & feedback sent to investigator.",
        {
          description:
            decision === "approved"
              ? "Project tracking status is marked as Completed."
              : "Investigator can now update and resubmit deliverables.",
        }
      );

      queryClient.invalidateQueries({ queryKey: terminalReportKeys.all });
      queryClient.invalidateQueries({ queryKey: terminalReportApprovalKeys.all });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/research/final-report/final-report-approval/${terminalReport.id}`);
      }
    } catch (err: any) {
      toast.error("Evaluation Submission Error", {
        description: err?.message || "Failed to record reviewer decision.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PdfViewerDialog
        isOpen={pdfDialogOpen}
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        url={activeFileUrl || ""}
        pdfUrl={activeFileUrl || ""}
        title={activeItem?.terminal_type_name || "Deliverable File"}
      />

      {/* Top Header Workbench Summary */}
      <Card className="border border-border/70 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Copiable Reference Number */}
              <div
                onClick={handleCopyReference}
                className="inline-flex items-center gap-1.5 bg-muted/40 hover:bg-muted text-foreground border border-border/70 rounded-lg px-2.5 py-1 text-xs font-mono font-bold shadow-2xs cursor-pointer transition-colors group"
                title="Click to copy reference number"
              >
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>{refNum}</span>
                {copiedRef ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>

              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold uppercase border border-amber-200">
                Evaluation Workbench
              </Badge>

              <Badge variant="outline" className="text-[10px] font-bold flex items-center gap-1 bg-background">
                <Building className="w-3 h-3 text-primary" />
                {dataCenter}
              </Badge>

              {rawItems.length > 0 && (
                <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {gradedCount} of {rawItems.length} Deliverables Graded
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel || (() => router.back())}
                disabled={isSubmitting}
                className="h-9 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleEvaluate("rejected")}
                className="h-9 text-xs font-bold gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Request Resubmission
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleEvaluate("approved")}
                className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve & Save Grades
              </Button>
            </div>
          </div>

          <div className="pt-1 space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {proposalTitle}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Submitted: <strong className="text-foreground">{terminalReport?.submitted_at ? new Date(terminalReport.submitted_at).toLocaleDateString() : "Recent"}</strong></span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Split Workbench Grid (12 Columns) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Deliverable Document Inspection Panel (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="py-3.5 px-5 border-b bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                Submitted Deliverables & Documents Inspection
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold font-mono">
                {items.length} File{items.length !== 1 ? "s" : ""}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Deliverable Items Tab Bar */}
              {items.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {items.map((item: any, idx: number) => {
                    const typeName = item.terminal_type_name || item.terminalTypeName || `Item #${idx + 1}`;
                    const isSelected = activeItemIndex === idx;
                    const isItemGraded = !!itemGrades[item.id]?.grade_id;

                    return (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => setActiveItemIndex(idx)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                            : "bg-card hover:bg-muted text-foreground border-border/70"
                        )}
                      >
                        <FileText className={cn("w-3.5 h-3.5", isSelected ? "text-primary-foreground" : "text-primary")} />
                        <span>{typeName}</span>
                        {isItemGraded && (
                          <CheckCircle2 className={cn("w-3.5 h-3.5", isSelected ? "text-primary-foreground" : "text-emerald-600")} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-foreground">No per-item deliverable documents attached</p>
                </div>
              )}

              {/* Selected Deliverable Inspector Card */}
              {activeItem && (
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {activeItem.terminal_type_name || `Deliverable Item #${activeItemIndex + 1}`}
                      </h4>
                      {activeItem.id > 0 && (
                        <p className="text-[10px] text-muted-foreground font-mono">Item ID: #{activeItem.id}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeItem.file && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPdfDialogOpen(true)}
                            className="h-8 text-xs font-semibold gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" /> Full Screen Preview
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => downloadConceptNoteAttachment(activeFileUrl || activeItem.file, activeItem.terminal_type_name || "Deliverable")}
                            className="h-8 text-xs font-semibold gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        </>
                      )}
                      {(activeItem.external_link || activeItem.externalLink) && (
                        <a
                          href={activeItem.external_link || activeItem.externalLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 text-primary border-primary/30">
                            <ExternalLink className="w-3.5 h-3.5" /> Open Link
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Document Preview Box */}
                  {activeFileUrl ? (
                    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] rounded-lg border bg-muted/20 overflow-hidden flex flex-col items-center justify-center">
                      <iframe
                        src={activeFileUrl}
                        title={activeItem.terminal_type_name || "Document Preview"}
                        className="w-full h-full border-none"
                      />
                    </div>
                  ) : (activeItem.external_link || activeItem.externalLink) ? (
                    <div className="p-6 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 text-xs space-y-2">
                      <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <ExternalLink className="w-4 h-4 text-blue-600" /> External Deliverable Link
                      </p>
                      <p className="text-blue-950 dark:text-blue-100 font-mono text-[11px] break-all">
                        {activeItem.external_link || activeItem.externalLink}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-8">
                      No file or link provided for this deliverable.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Scoring & Committee Decision Form (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="py-3.5 px-5 border-b bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Dynamic Evaluation & Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-5">
              {/* Deliverable Scoring List */}
              <div className="space-y-4">
                {rawItems.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-xs text-muted-foreground bg-muted/20">
                    <p className="font-semibold text-foreground">No per-type deliverable items listed for itemized scoring.</p>
                    <p className="text-[11px] mt-1">You can provide summary reviewer feedback and record the final closeout decision below.</p>
                  </div>
                ) : (
                  rawItems.map((item: any, idx: number) => {
                    const typeName = item.terminal_type_name || item.terminalTypeName || `Item #${idx + 1}`;
                    const currentGradeId = itemGrades[item.id]?.grade_id;
                    const currentComments = itemGrades[item.id]?.grade_comments || "";

                    const selectedGradeObj = availableGrades.find((g: any) => g.id === currentGradeId);

                    return (
                      <div
                        key={item.id || idx}
                        className={cn(
                          "p-3.5 rounded-xl border space-y-3 transition-all",
                          activeItemIndex === idx
                            ? "border-primary/50 bg-card ring-1 ring-primary/20 shadow-2xs"
                            : "border-border/70 bg-muted/10"
                        )}
                        onClick={() => setActiveItemIndex(idx)}
                      >
                        <div className="flex items-center justify-between gap-2 border-b pb-2">
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-bold bg-background">
                              {typeName}
                            </Badge>
                          </span>
                          {currentGradeId ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold border-emerald-200">
                              {selectedGradeObj?.name || "Graded"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                              Pending Grade *
                            </Badge>
                          )}
                        </div>

                        {/* Grade Dropdown */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground">
                            Assign Deliverable Grade <span className="text-rose-500">*</span>
                          </label>
                          {isLoadingGrades ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-2 p-2 border rounded-md">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading grades...
                            </div>
                          ) : (
                            <Select
                              value={currentGradeId ? String(currentGradeId) : ""}
                              onValueChange={(val) => handleGradeChange(item.id, Number(val))}
                            >
                              <SelectTrigger className="w-full h-9 text-xs font-semibold">
                                <SelectValue placeholder="Select dynamic grade (e.g. Excellent, Good)..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableGrades.map((g: any) => (
                                  <SelectItem key={g.id} value={String(g.id)}>
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="font-bold text-xs">{g.name}</span>
                                      {g.description && (
                                        <span className="text-[10px] text-muted-foreground">
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

                        {/* Grade Comments */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Deliverable Feedback Comments (Optional)
                          </label>
                          <Textarea
                            rows={2}
                            placeholder="Add deliverable-specific reviewer notes..."
                            value={currentComments}
                            onChange={(e) => handleGradeCommentsChange(item.id, e.target.value)}
                            className="text-xs resize-none"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Separator />

              {/* Committee Summary Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  Reviewer Summary Feedback / Resubmission Notes
                </label>
                <Textarea
                  rows={4}
                  placeholder="Provide overall reviewer evaluation notes, comments, or resubmission feedback for the investigator..."
                  value={rocComments}
                  onChange={(e) => setRocComments(e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Sticky Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleEvaluate("approved")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 gap-2 shadow-2xs"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve & Save Evaluation
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={() => handleEvaluate("rejected")}
                  className="w-full font-bold text-xs h-10 gap-2 shadow-2xs"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Request Resubmission with Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
