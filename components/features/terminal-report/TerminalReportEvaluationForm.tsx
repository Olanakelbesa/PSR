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
  Sparkles,
  RotateCcw,
  GitCommit,
  History,
  Clock,
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
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function EvaluationDocumentViewer({ url, title }: { url: string; title: string }) {
  if (!url) return null;

  const resolvedUrl = resolveFileUrl(url) || url;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-border/70 shadow-2xs bg-card h-[460px] sm:h-[540px] lg:h-[600px] w-full">
        <PdfViewer url={resolvedUrl} title={title} className="h-full w-full" hideHeader />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-[#ededed] dark:bg-muted/30 shadow-2xs h-[460px] sm:h-[540px] lg:h-[600px] w-full">
        <WordViewer url={resolvedUrl} title={title} className="h-full w-full" hideHeader />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] rounded-xl border bg-muted/20 overflow-hidden">
      <iframe
        src={resolvedUrl}
        title={title}
        className="w-full h-full border-none"
      />
    </div>
  );
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
  const [submittingAction, setSubmittingAction] = useState<"rejected" | "approve_internal" | "approve_repo" | null>(null);
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

  const reportStatus = (terminalReport?.status || "").toLowerCase();
  const isPendingReview = reportStatus === "pending" || reportStatus === "draft";

  useEffect(() => {
    if (isPendingReview) {
      setItemGrades({});
      setRocComments("");
      return;
    }

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
  }, [terminalReport, items, isPendingReview]);

  // Derive existing logged decision key ONLY if not pending review
  const existingApproval = useMemo(() => {
    if (Array.isArray(terminalReport?.approvals) && terminalReport.approvals.length > 0) {
      return terminalReport.approvals[0];
    }
    return null;
  }, [terminalReport]);

  const currentLoggedDecisionKey = useMemo(() => {
    if (isPendingReview) return null;
    if (!existingApproval && !terminalReport) return null;
    const dec = (existingApproval?.decision || terminalReport?.status || "").toLowerCase();
    if (dec === "rejected") return "rejected";
    if (dec === "approved") {
      const isRepoReady =
        existingApproval?.ready_for_repository ??
        existingApproval?.readyForRepository ??
        terminalReport?.is_published ??
        terminalReport?.isPublished ??
        false;
      return isRepoReady ? "approve_repo" : "approve_internal";
    }
    return null;
  }, [existingApproval, terminalReport, isPendingReview]);

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

  const handleEvaluate = async (
    decision: "approved" | "rejected",
    readyForRepository = true,
  ) => {
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

    const actionKey = decision === "rejected" ? "rejected" : readyForRepository ? "approve_repo" : "approve_internal";
    setSubmittingAction(actionKey);

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
        ready_for_repository: decision === "approved" ? readyForRepository : false,
        ROC_Comments: rocComments,
        item_grades: formattedItemGrades,
      };

      await createApprovalMutation.mutateAsync(payload as any);

      toast.success(
        decision === "approved"
          ? readyForRepository
            ? "Terminal report approved & marked Ready for Research Repository!"
            : "Terminal report evaluation successfully approved & graded!"
          : "Resubmission request & feedback sent to investigator.",
        {
          description:
            decision === "approved"
              ? readyForRepository
                ? "Submission is queued for Research Repository publishing."
                : "Project tracking status is marked as Completed."
              : "Investigator can now update and resubmit deliverables.",
        }
      );

      queryClient.invalidateQueries({ queryKey: terminalReportKeys.all });
      queryClient.invalidateQueries({ queryKey: terminalReportApprovalKeys.all });
      queryClient.invalidateQueries({ queryKey: ["graded-for-repository"] });
      queryClient.invalidateQueries({ queryKey: ["final-submissions"] });

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
      setSubmittingAction(null);
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

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel || (() => router.back())}
                disabled={!!submittingAction}
                className="h-9 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={!!submittingAction}
                onClick={() => handleEvaluate("rejected")}
                className="h-9 text-xs font-bold gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                title="Return report to Principal Investigator with reviewer comments for required edits"
              >
                {submittingAction === "rejected" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Request Resubmission
              </Button>

              <Button
                size="sm"
                disabled={!!submittingAction}
                onClick={() => handleEvaluate("approved", true)}
                className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                title="Approve report evaluation & publish submission into Research Repository"
              >
                {submittingAction === "approve_repo" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve & Publish to Repository
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
                    <EvaluationDocumentViewer
                      url={activeFileUrl}
                      title={activeItem.terminal_type_name || "Deliverable File"}
                    />
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

        {/* Right Column: Dynamic Scoring (5 cols) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Card 1: Dynamic Evaluation & Itemized Scoring */}
          <Card className="border border-border/70 shadow-xs">
            <CardHeader className="py-3.5 px-5 border-b bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Dynamic Evaluation & Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
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
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Full-Width Bottom Card: Reviewer Summary Feedback & Committee Action Bar */}
      <Card className="border border-border/70 shadow-xs bg-card">
        <CardHeader className="py-3.5 px-5 border-b bg-muted/30 flex flex-row items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            Reviewer Summary Feedback & Final Decision
          </CardTitle>
          {currentLoggedDecisionKey ? (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold py-1 px-2.5 flex items-center gap-1.5 shadow-2xs",
                currentLoggedDecisionKey === "approve_repo" && "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
                currentLoggedDecisionKey === "approve_internal" && "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300",
                currentLoggedDecisionKey === "rejected" && "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
              )}
            >
              {currentLoggedDecisionKey === "approve_internal" ? <Building className="w-3.5 h-3.5 text-indigo-600" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Logged Decision: {
                currentLoggedDecisionKey === "approve_repo" ? "Approved & Published to Repository" :
                  currentLoggedDecisionKey === "approve_internal" ? "Approved for Internal Records" :
                    "Returned for Edits"
              }
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-bold">
              Pending Evaluation Decision
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Summary Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Overall Reviewer Evaluation Summary / Revision Notes
            </label>
            <Textarea
              rows={3}
              placeholder="Provide overall evaluation summary notes or revision feedback for the investigator..."
              value={rocComments}
              onChange={(e) => setRocComments(e.target.value)}
              className="text-xs leading-relaxed bg-background"
            />
          </div>

          <Separator />

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                Select Final Committee Decision
              </p>
              <p className="text-[11px] text-muted-foreground">
                {currentLoggedDecisionKey
                  ? "Click any button below to update your evaluation decision."
                  : "Hover over buttons for outcome details before confirming review closeout."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!!submittingAction}
                onClick={() => handleEvaluate("rejected")}
                className={cn(
                  "h-10 text-xs font-bold gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40 transition-all",
                  currentLoggedDecisionKey === "rejected" && "ring-2 ring-rose-500 ring-offset-1 bg-rose-50 dark:bg-rose-950/60 shadow-xs"
                )}
                title="Return report to Principal Investigator with reviewer feedback for required edits"
              >
                {submittingAction === "rejected" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Request Resubmission</span>
                {currentLoggedDecisionKey === "rejected" && (
                  <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 font-bold ml-1">
                    Current
                  </Badge>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!!submittingAction}
                onClick={() => handleEvaluate("approved", false)}
                className={cn(
                  "h-10 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all",
                  currentLoggedDecisionKey === "approve_internal" && "ring-2 ring-indigo-500 ring-offset-1 bg-indigo-50 dark:bg-indigo-950/60 font-bold shadow-xs"
                )}
                title="Approve project closeout for internal tracking records only (Does not publish to Research Repository)"
              >
                {submittingAction === "approve_internal" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                <span>Approve for Internal Records Only</span>
                {currentLoggedDecisionKey === "approve_internal" && (
                  <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0 font-bold ml-1">
                    Current
                  </Badge>
                )}
              </Button>

              <Button
                type="button"
                disabled={!!submittingAction}
                onClick={() => handleEvaluate("approved", true)}
                className={cn(
                  "h-10 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all",
                  currentLoggedDecisionKey === "approve_repo" && "ring-2 ring-emerald-400 ring-offset-2 scale-[1.02] shadow-md"
                )}
                title="Approve project closeout AND pre-fill submission into system Research Repository"
              >
                {submittingAction === "approve_repo" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Approve & Publish to Repository</span>
                {currentLoggedDecisionKey === "approve_repo" && (
                  <Badge className="bg-white text-emerald-800 text-[9px] px-1.5 py-0 font-bold ml-1">
                    Current
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Git-Style Evaluation & Version Audit Trail Log */}
      {Array.isArray(terminalReport?.approvals) && terminalReport.approvals.length > 0 && (
        <Card className="border border-border/70 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary shrink-0" />
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Evaluation Pass & Audit Trail Log
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tracked history of reviewer evaluations, comments, and decision commits.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1 text-[10px] font-bold">
              <GitCommit className="w-3 h-3 text-primary" />
              {terminalReport.approvals.length} {terminalReport.approvals.length === 1 ? "Commit" : "Commits"}
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {terminalReport.approvals.map((app: any, idx: number) => {
                const passNumber = terminalReport.approvals.length - idx;
                const dec = (app.decision || "").toLowerCase();
                const isPub = app.ready_for_repository ?? app.readyForRepository ?? false;
                const reviewerEmail = app.reviewer_email || app.reviewerEmail || app.reviewer || "Reviewer";
                const dateStr = app.reviewed_at || app.reviewedAt || app.created_at;

                return (
                  <div key={app.id || idx} className="relative group">
                    {/* Commit Node Marker */}
                    <div className={cn(
                      "absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center transition-transform group-hover:scale-110",
                      dec === "approved"
                        ? isPub ? "border-emerald-500 text-emerald-600" : "border-indigo-500 text-indigo-600"
                        : "border-rose-500 text-rose-600"
                    )}>
                      <GitCommit className="w-3 h-3" />
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            Evaluation Pass #{passNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-muted-foreground/70" />
                            {dateStr ? new Date(dateStr).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "Recent Pass"}
                          </span>
                        </div>

                        {/* Decision Outcome Badge */}
                        {dec === "approved" ? (
                          isPub ? (
                            <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border-emerald-300">
                              <Globe className="w-3 h-3 text-emerald-600" />
                              Approved & Published
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 border-indigo-300">
                              <Building className="w-3 h-3 text-indigo-600" />
                              Approved (Internal)
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="gap-1 text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border-rose-300">
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            Revisions Required
                          </Badge>
                        )}
                      </div>

                      {/* Reviewer Info */}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                        <User className="w-3 h-3 text-primary" />
                        <span>Evaluated by: <strong className="text-foreground">{reviewerEmail}</strong></span>
                      </div>

                      {/* Reviewer Feedback Notes */}
                      {(app.ROC_Comments || app.ROCComments || app.comment) && (
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs text-foreground/90 space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-primary" /> Reviewer Feedback:
                          </p>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {app.ROC_Comments || app.ROCComments || app.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
