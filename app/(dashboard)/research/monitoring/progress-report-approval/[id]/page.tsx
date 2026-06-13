"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  useCreateProgressReportApproval,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";

type ApprovalDecision = "pending" | "approved" | "rejected";

function statusBadgeClass(value: string) {
  if (value === "approved")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function statusLabel(value: string) {
  const map: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
    on_progress: "In Progress",
  };
  return map[value] ?? value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value: string | null | undefined) {
  if (!value) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `ETB ${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

interface ApproveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressReportId: number;
  onSuccess: () => void;
}

function ApproveModal({
  open,
  onOpenChange,
  progressReportId,
  onSuccess,
}: ApproveModalProps) {
  const [decision, setDecision] = useState<ApprovalDecision>("approved");
  const [comment, setComment] = useState("");

  const createApproval = useCreateProgressReportApproval();

  async function handleSubmit() {
    try {
      await createApproval.mutateAsync({
        decision,
        comment: comment || undefined,
        progress_report: progressReportId,
      });
      toast.success("Approval submitted successfully.");
      onSuccess();
      onOpenChange(false);
      setDecision("approved");
      setComment("");
    } catch {
      toast.error("Failed to submit approval. Please try again.");
    }
  }

  const decisionOptions: {
    value: ApprovalDecision;
    label: string;
    active: string;
    inactive: string;
  }[] = [
    {
      value: "approved",
      label: "Approved",
      active: "border-emerald-500 bg-emerald-50 text-emerald-700",
      inactive: "border-border text-muted-foreground hover:border-emerald-300",
    },
    {
      value: "pending",
      label: "Pending",
      active: "border-amber-500 bg-amber-50 text-amber-700",
      inactive: "border-border text-muted-foreground hover:border-amber-300",
    },
    {
      value: "rejected",
      label: "Rejected",
      active: "border-rose-500 bg-rose-50 text-rose-700",
      inactive: "border-border text-muted-foreground hover:border-rose-300",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Approval Decision</DialogTitle>
          <DialogDescription>
            Select a decision and optionally add a comment for Progress Report #
            {progressReportId}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Decision */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Decision <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {decisionOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDecision(opt.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                    decision === opt.value ? opt.active : opt.inactive,
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label
              htmlFor="approval-comment"
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Comment
            </Label>
            <Textarea
              id="approval-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a review comment (optional)…"
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createApproval.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createApproval.isPending}>
            {createApproval.isPending ? "Submitting…" : "Submit Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Field ─────────────────────────────────────────────────────────────

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
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
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
    data: report,
    isLoading,
    refetch,
  } = useProgressReport(reportId);

  const [approveOpen, setApproveOpen] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading report…">
        <div className="space-y-4">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <PageContainer title="Report Not Found">
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            This progress report does not exist or you do not have access.
          </p>
          <Button
            onClick={() =>
              router.push("/research/monitoring/progress-report-approval")
            }
          >
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  const generalStatus = (report as any).general_status ?? report.status;

  return (
    <>
      <PageContainer
        title={report.report_name ?? `Progress Report #${report.id}`}
        description={
          report.project_tracking_title
            ? `Project: ${report.project_tracking_title}`
            : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push("/research/monitoring/progress-report-approval")
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setApproveOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Main details ── */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Report Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailField
                    label="Report ID"
                    value={
                      <span className="font-mono text-primary/80">
                        #{report.id}
                      </span>
                    }
                  />
                  <DetailField
                    label="Report Name"
                    value={report.report_name ?? "—"}
                  />
                  <DetailField
                    label="Project Tracking"
                    value={
                      report.project_tracking_title ?? (
                        <span className="text-muted-foreground">
                          #{report.project_tracking}
                        </span>
                      )
                    }
                  />
                  <DetailField
                    label="General Status"
                    value={
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(generalStatus)}
                      >
                        {statusLabel(generalStatus)}
                      </Badge>
                    }
                  />
                </div>

                <div>
                  <DetailField
                    label="Main Activities Achieved"
                    icon={<ClipboardList className="h-3 w-3" />}
                    value={
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                        {report.main_activities_achieved ||
                          "No activities recorded."}
                      </p>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachment */}
            {report.attachment && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Attachment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={resolveFileUrl(report.attachment) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Attachment
                  </a>
                  <p className="mt-2 break-all text-[11px] text-muted-foreground">
                    {report.attachment}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  Financials &amp; Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <DetailField
                  label="Amount Used"
                  icon={<Wallet className="h-3 w-3" />}
                  value={
                    <span className="font-mono text-base font-bold">
                      {formatAmount(report.amount_used)}
                    </span>
                  }
                />
                <DetailField
                  label="Start Date"
                  icon={<Calendar className="h-3 w-3" />}
                  value={formatDate(report.start_date)}
                />
                <DetailField
                  label="End Date"
                  icon={<Calendar className="h-3 w-3" />}
                  value={formatDate(report.end_date)}
                />
                <DetailField
                  label="Submitted At"
                  value={formatDate(report.submitted_at)}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Approval Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField
                  label="Current Status"
                  value={
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(report.status)}
                    >
                      {statusLabel(report.status)}
                    </Badge>
                  }
                />
                <Button
                  className="w-full gap-2"
                  onClick={() => setApproveOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Approval Decision
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      <ApproveModal
        open={approveOpen}
        onOpenChange={setApproveOpen}
        progressReportId={report.id}
        onSuccess={() => refetch()}
      />
    </>
  );
}
