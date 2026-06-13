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
  Globe,
  RefreshCw,
  Tag,
  User,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useTerminalReport,
  useCreateTerminalReportApproval,
} from "@/hooks/useProgressReports";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Decision = "pending" | "approved" | "rejected";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: () => <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  on_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: RefreshCw,
  },
};

function StatusBadge({ value }: { value: string }) {
  const cfg = statusConfig[value] ?? statusConfig.pending;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-semibold", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

interface ApproveModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  terminalReportId: number;
  onSuccess: () => void;
}

function ApproveModal({
  open,
  onOpenChange,
  terminalReportId,
  onSuccess,
}: ApproveModalProps) {
  const [decision, setDecision] = useState<Decision>("approved");
  const [rocComments, setRocComments] = useState("");

  const createApproval = useCreateTerminalReportApproval();

  async function handleSubmit() {
    try {
      await createApproval.mutateAsync({
        decision,
        ROC_Comments: rocComments || undefined,
        terminal_report: terminalReportId,
      });
      toast.success("Approval submitted successfully.");
      onSuccess();
      onOpenChange(false);
      setDecision("approved");
      setRocComments("");
    } catch {
      toast.error("Failed to submit approval. Please try again.");
    }
  }

  const decisionOptions: {
    value: Decision;
    label: string;
    active: string;
    inactive: string;
  }[] = [
    {
      value: "approved",
      label: "Approved",
      active: "border-emerald-500 bg-emerald-50 text-emerald-700",
      inactive:
        "border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-700",
    },
    {
      value: "pending",
      label: "Pending",
      active: "border-amber-500 bg-amber-50 text-amber-700",
      inactive:
        "border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700",
    },
    {
      value: "rejected",
      label: "Rejected",
      active: "border-rose-500 bg-rose-50 text-rose-700",
      inactive:
        "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-700",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Approval Decision</DialogTitle>
          <DialogDescription>
            Record a decision for Terminal Report #{terminalReportId}.
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

          {/* ROC Comments */}
          <div className="space-y-2">
            <Label
              htmlFor="roc-comments"
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              ROC Comments
            </Label>
            <Textarea
              id="roc-comments"
              value={rocComments}
              onChange={(e) => setRocComments(e.target.value)}
              placeholder="Add review comments (optional)…"
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Terminal Report ID (read-only info) */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Terminal Report:{" "}
            <span className="font-semibold text-foreground">
              #{terminalReportId}
            </span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TerminalReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  }, [params]);

  const { data: report, isLoading, refetch } = useTerminalReport(reportId);
  const [approveOpen, setApproveOpen] = useState(false);

  // ── Loading ────────────────────────────────────────────────────────────
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

  // ── Not found ──────────────────────────────────────────────────────────
  if (!report) {
    return (
      <PageContainer title="Report Not Found">
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            This terminal report does not exist or you do not have access.
          </p>
          <Button
            onClick={() =>
              router.push("/research/monitoring/terminal-report-approval")
            }
          >
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer
        title={report.report_name ?? `Terminal Report #${report.id}`}
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
                router.push("/research/monitoring/terminal-report-approval")
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
          {/* ── Main ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Report details */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Report Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Report ID">
                    <span className="font-mono text-sm font-bold text-primary/80">
                      #{report.id}
                    </span>
                  </Field>

                  <Field label="Report Name">
                    <span className="text-sm font-medium">
                      {report.report_name ?? "—"}
                    </span>
                  </Field>

                  <Field
                    label="Project"
                    icon={<Tag className="h-3 w-3" />}
                  >
                    <span className="text-sm font-medium">
                      {report.project_tracking_title ?? "—"}
                    </span>
                  </Field>

                  <Field label="Submitted By" icon={<User className="h-3 w-3" />}>
                    <span className="text-sm font-medium">
                      {report.submitted_by_name ?? "—"}
                    </span>
                  </Field>
                </div>

                <Field
                  label="Main Deliverables"
                  icon={<ClipboardList className="h-3 w-3" />}
                >
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                    {report.main_deliverables || "No deliverables recorded."}
                  </p>
                </Field>
              </CardContent>
            </Card>

            {/* Publication */}
            {(report.is_published || report.publication_link) && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Publication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Published">
                    <Badge
                      variant="outline"
                      className={
                        report.is_published
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border text-muted-foreground"
                      }
                    >
                      {report.is_published ? "Yes" : "No"}
                    </Badge>
                  </Field>
                  {report.publication_link && (
                    <Field label="Publication Link">
                      <a
                        href={report.publication_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {report.publication_link}
                      </a>
                    </Field>
                  )}
                </CardContent>
              </Card>
            )}

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
            {/* Dates & meta */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Submission Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field
                  label="Submitted At"
                  icon={<Calendar className="h-3 w-3" />}
                >
                  <span className="text-sm font-medium">
                    {formatDate(report.submitted_at)}
                  </span>
                </Field>

                {report.terminal_type.length > 0 && (
                  <Field label="Terminal Type">
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {report.terminal_type.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-[11px]"
                        >
                          Type {t}
                        </Badge>
                      ))}
                    </div>
                  </Field>
                )}
              </CardContent>
            </Card>

            {/* Approval action */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Current Status">
                  <StatusBadge value={report.status} />
                </Field>
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
        terminalReportId={report.id}
        onSuccess={() => refetch()}
      />
    </>
  );
}
