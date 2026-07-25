"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Wallet,
  Clock,
  AlertCircle,
  XCircle,
  Hash,
  Paperclip,
  ShieldCheck,
  Layers,
  Download,
  Building2,
  MessageSquare,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useProgressReport,
  useProgressReportApproval,
  useCreateProgressReportApproval,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";

type ApprovalDecision = "pending" | "approved" | "rejected";

function statusBadgeClass(value?: string) {
  switch (value?.toLowerCase()) {
    case "approved":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "rejected":
    case "terminated":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    case "on_progress":
    case "active":
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
}

function statusIcon(value?: string) {
  switch (value?.toLowerCase()) {
    case "approved":
      return CheckCircle2;
    case "rejected":
      return XCircle;
    default:
      return Clock;
  }
}

function statusLabel(value?: string) {
  if (!value) return "Pending";
  const map: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending Review",
    on_progress: "On Progress",
  };
  return map[value.toLowerCase()] ?? value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "ETB 0.00";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `ETB ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

interface ApproveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressReportId: number;
  initialDecision?: string;
  initialComment?: string;
  onSuccess: () => void;
}

function ApproveModal({
  open,
  onOpenChange,
  progressReportId,
  initialDecision,
  initialComment,
  onSuccess,
}: ApproveModalProps) {
  const [decision, setDecision] = useState<ApprovalDecision>("approved");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      if (initialDecision && ["approved", "pending", "rejected"].includes(initialDecision.toLowerCase())) {
        setDecision(initialDecision.toLowerCase() as ApprovalDecision);
      } else {
        setDecision("approved");
      }
      setComment(initialComment || "");
    }
  }, [open, initialDecision, initialComment]);

  const createApproval = useCreateProgressReportApproval();

  async function handleSubmit() {
    try {
      await createApproval.mutateAsync({
        decision,
        comment: comment.trim() || undefined,
        progress_report: progressReportId,
      });
      toast.success(`Approval decision updated for Progress Report #${progressReportId}.`);
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit approval decision. Please try again.");
    }
  }

  const decisionOptions: {
    value: ApprovalDecision;
    label: string;
    description: string;
    activeClass: string;
  }[] = [
    {
      value: "approved",
      label: "Approve Report",
      description: "Milestone & budget usage verified clean.",
      activeClass: "border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    },
    {
      value: "pending",
      label: "Hold Pending",
      description: "Requires additional clarification from PI.",
      activeClass: "border-amber-500 bg-amber-50/60 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    },
    {
      value: "rejected",
      label: "Reject Report",
      description: "Report does not satisfy compliance or output standards.",
      activeClass: "border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Submit Approval Decision
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review and log an official decision for Progress Report #{progressReportId}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Decision <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2.5">
              {decisionOptions.map((opt) => {
                const isSelected = decision === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDecision(opt.value)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? opt.activeClass + " shadow-xs ring-1 ring-primary/20"
                        : "border-border/70 hover:border-muted-foreground/40 bg-card text-foreground",
                    )}
                  >
                    <div className="mt-0.5">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                        )}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-background" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="approval-comment"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Reviewer Remarks / Feedback
            </Label>
            <Textarea
              id="approval-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add review notes, comments, or justification…"
              className="min-h-[90px] text-xs resize-y"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createApproval.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createApproval.isPending}
            className="shadow-xs"
          >
            {createApproval.isPending ? "Submitting…" : "Confirm Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Field Component ───────────────────────────────────────────────────

function DetailField({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const reportId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined),
    [id],
  );

  const {
    data: primaryReport,
    isLoading: isPrimaryLoading,
    refetch: refetchPrimary,
  } = useProgressReport(reportId);

  const {
    data: fallbackApproval,
    isLoading: isFallbackLoading,
    refetch: refetchFallback,
  } = useProgressReportApproval(!primaryReport && reportId ? reportId : undefined);

  const report =
    primaryReport ||
    (fallbackApproval as any)?.progressReport ||
    (fallbackApproval as any)?.progress_report_detail ||
    fallbackApproval;

  const isLoading = isPrimaryLoading || (isFallbackLoading && !primaryReport);

  const refetch = () => {
    refetchPrimary();
    refetchFallback();
  };

  const [approveOpen, setApproveOpen] = useState(false);

  // ── Loading Skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading Progress Report Review Workspace...">
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  // ── Report Not Found ─────────────────────────────────────────────────────────
  if (!report) {
    return (
      <PageContainer title="Report Not Found">
        <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed p-12 text-center bg-card max-w-xl mx-auto my-12">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
            <AlertCircle className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">Progress Report Unavailable</h3>
            <p className="text-sm text-muted-foreground">
              This progress report record could not be found or you do not have permission to view it.
            </p>
          </div>
          <Button
            onClick={() => router.push("/research/monitoring/progress-report-approval")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Progress Report Approvals
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Handle camelCase & snake_case API payload fields
  const reportObj = report as any;
  const reportName =
    reportObj.reportName ??
    reportObj.report_name ??
    `Progress Report #${report.id}`;

  const projectTrackingObj =
    reportObj.projectTracking ??
    (typeof reportObj.project_tracking === "object" ? reportObj.project_tracking : null);

  const projectTrackingId =
    projectTrackingObj?.projectTrackingId ??
    projectTrackingObj?.id ??
    (typeof reportObj.project_tracking === "number" || typeof reportObj.project_tracking === "string"
      ? reportObj.project_tracking
      : null);

  const proposalId = projectTrackingObj?.proposalId ?? projectTrackingObj?.proposal;

  const projectTitle =
    projectTrackingObj?.title ??
    reportObj.project_tracking_title ??
    (projectTrackingId ? `Project Tracking #${projectTrackingId}` : "—");

  const mainActivities =
    reportObj.mainActivitiesAchieved ??
    reportObj.main_activities_achieved;

  const amountUsed =
    reportObj.amountUsed ??
    reportObj.amount_used;

  const startDate = reportObj.startDate ?? reportObj.start_date;
  const endDate = reportObj.endDate ?? reportObj.end_date;
  const submittedAt = reportObj.submittedAt ?? reportObj.submitted_at;
  const statusVal = reportObj.status ?? "pending";
  const generalStatusVal = reportObj.generalStatus ?? reportObj.general_status ?? statusVal;

  const latestApproval =
    reportObj.latest_approval ||
    reportObj.latestApproval ||
    (Array.isArray(reportObj.approvals) && reportObj.approvals.length > 0
      ? reportObj.approvals[0]
      : Array.isArray(reportObj.approval_list) && reportObj.approval_list.length > 0
      ? reportObj.approval_list[0]
      : null);

  const existingDecision = latestApproval?.decision || statusVal;
  const existingComment =
    latestApproval?.comment ??
    latestApproval?.remarks ??
    reportObj.comment ??
    reportObj.remarks ??
    "";
  const reviewerName =
    latestApproval?.reviewer_name ??
    latestApproval?.reviewerName ??
    (typeof latestApproval?.reviewer === "object"
      ? latestApproval.reviewer?.fullName || latestApproval.reviewer?.name
      : null);

  const StatusIconComp = statusIcon(statusVal);

  return (
    <PageContainer
      title={reportName}
      description={`Project: ${projectTitle}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/research/monitoring/progress-report-approval")}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Approvals Directory
          </Button>
          {projectTrackingId && (
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href={`/research/monitoring/progress-report/${projectTrackingId}`}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Project Workspace
              </Link>
            </Button>
          )}
          {proposalId && (
            <Button variant="outline" size="sm" asChild className="hidden md:flex">
              <Link href={`/research/proposals/my-proposals/${proposalId}`}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                View Proposal
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            className="shadow-xs bg-primary hover:bg-primary/90"
            onClick={() => setApproveOpen(true)}
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {existingDecision && existingDecision !== "pending" ? "Edit Approval Decision" : "Review & Approve"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status & Context Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border bg-card shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Badge variant="outline" className="font-mono text-xs bg-muted/50">
              <Hash className="mr-1 h-3 w-3 opacity-60" />
              Report #{report.id}
            </Badge>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{projectTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium", statusBadgeClass(statusVal))}>
              <StatusIconComp className="mr-1.5 h-3 w-3" />
              Decision: {statusLabel(statusVal)}
            </Badge>
            <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium", statusBadgeClass(generalStatusVal))}>
              <Clock className="mr-1.5 h-3 w-3" />
              General: {statusLabel(generalStatusVal)}
            </Badge>
          </div>
        </div>

        {/* Financial & Timeline Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-xs border bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount Expended
                </p>
                <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5 font-mono">
                  {formatAmount(amountUsed)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Activity Start Date
                </p>
                <h3 className="text-base font-bold tracking-tight text-foreground mt-0.5">
                  {formatDate(startDate)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Activity End Date
                </p>
                <h3 className="text-base font-bold tracking-tight text-foreground mt-0.5">
                  {formatDate(endDate)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Submitted On
                </p>
                <h3 className="text-base font-bold tracking-tight text-foreground mt-0.5">
                  {formatDate(submittedAt)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content (Activities & Deliverables) */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-xs border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Main Activities Achieved
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed progress description provided by the project lead.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-6">
                <div className="rounded-xl border bg-muted/20 p-5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {mainActivities && mainActivities !== "string"
                    ? mainActivities
                    : "No specific activities listed for this progress report."}
                </div>
              </CardContent>
            </Card>

            {/* Supporting Attachment Banner */}
            {report.attachment && (
              <Card className="shadow-xs border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    Supporting Attachment
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verification documents, receipts, or technical logs attached to this report.
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {typeof report.attachment === "string"
                            ? report.attachment.split("/").pop()
                            : "Progress_Report_Attachment.pdf"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Attached Verification Document
                        </p>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" asChild className="shrink-0">
                      <a
                        href={resolveFileUrl(report.attachment) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download / View Document
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (Decision Box & Project Context) */}
          <div className="space-y-6">
            <Card className="shadow-xs border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Approval Decision
                </CardTitle>
                <CardDescription className="text-xs">
                  Review status and take administrative action.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5 space-y-4">
                <DetailField
                  label="Current Status"
                  value={
                    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium", statusBadgeClass(statusVal))}>
                      <StatusIconComp className="mr-1.5 h-3 w-3" />
                      {statusLabel(statusVal)}
                    </Badge>
                  }
                />

                {existingComment && (
                  <div className="rounded-xl border bg-muted/40 p-3.5 text-xs space-y-1.5">
                    <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-primary" />
                      Review Remarks
                    </p>
                    <p className="text-foreground leading-relaxed italic">{existingComment}</p>
                    {reviewerName && (
                      <p className="text-[10px] text-muted-foreground text-right font-medium">— {reviewerName}</p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full shadow-xs bg-primary hover:bg-primary/90 mt-2"
                  onClick={() => setApproveOpen(true)}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {existingDecision && existingDecision !== "pending" ? "Edit Approval Decision" : "Submit Approval Decision"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xs border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-2 text-xs">
                {projectTrackingId && (
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start text-xs font-medium">
                    <Link href={`/research/monitoring/progress-report/${projectTrackingId}`}>
                      <Layers className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      Project Tracking Workspace
                    </Link>
                  </Button>
                )}
                {proposalId && (
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start text-xs font-medium">
                    <Link href={`/research/proposals/my-proposals/${proposalId}`}>
                      <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      Associated Research Proposal
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ApproveModal
          open={approveOpen}
          onOpenChange={setApproveOpen}
          progressReportId={report.id}
          initialDecision={existingDecision}
          initialComment={existingComment}
          onSuccess={() => refetch()}
        />
      </div>
    </PageContainer>
  );
}
