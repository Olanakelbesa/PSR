"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  Send,
  Upload,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateProgressReport,
  useCreateTerminalReport,
  useProgressReport,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ReportStatus = "pending" | "approved" | "rejected";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: ReportStatus) {
  if (status === "approved")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function statusLabel(status: ReportStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export default function ProgressReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const reportId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined),
    [id],
  );

  const { data: report, isLoading, refetch } = useProgressReport(reportId);
  const createProgressReport = useCreateProgressReport();
  const createTerminalReport = useCreateTerminalReport();

  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isTerminalDialogOpen, setIsTerminalDialogOpen] = useState(false);

  const [progressReportName, setProgressReportName] = useState("");
  const [progressActivities, setProgressActivities] = useState("");
  const [progressAmountUsed, setProgressAmountUsed] = useState("");
  const [progressStartDate, setProgressStartDate] = useState("");
  const [progressEndDate, setProgressEndDate] = useState("");
  const [progressAttachment, setProgressAttachment] = useState<File | null>(
    null,
  );
  const [progressStatus, setProgressStatus] = useState<ReportStatus>("pending");

  const [terminalReportName, setTerminalReportName] = useState("");
  const [terminalDeliverables, setTerminalDeliverables] = useState("");
  const [terminalAttachment, setTerminalAttachment] = useState<File | null>(
    null,
  );
  const [terminalIsPublished, setTerminalIsPublished] = useState(false);
  const [terminalPublicationLink, setTerminalPublicationLink] = useState("");
  const [terminalStatus, setTerminalStatus] = useState<ReportStatus>("pending");
  const [terminalTypeInput, setTerminalTypeInput] = useState("");

  async function submitProgressReport() {
    if (!report) {
      toast.error("Progress report details are still loading.");
      return;
    }
    if (!progressReportName || !progressActivities) {
      toast.error("Report name and activities are required.");
      return;
    }

    try {
      await createProgressReport.mutateAsync({
        project_tracking: report.project_tracking,
        report_name: progressReportName,
        main_activities_achieved: progressActivities,
        attachment: progressAttachment,
        amount_used: progressAmountUsed,
        start_date: progressStartDate,
        end_date: progressEndDate,
        status: progressStatus,
      });

      toast.success("Progress report submitted successfully.");
      setIsProgressDialogOpen(false);
      setProgressReportName("");
      setProgressActivities("");
      setProgressAmountUsed("");
      setProgressStartDate("");
      setProgressEndDate("");
      setProgressAttachment(null);
      setProgressStatus("pending");
      await refetch();
    } catch (error) {
      toast.error("Progress report submission failed.");
    }
  }

  async function submitTerminalReport() {
    if (!report) {
      toast.error("Progress report details are still loading.");
      return;
    }
    if (!terminalDeliverables.trim()) {
      toast.error("Main deliverables are required.");
      return;
    }

    const terminalTypes = terminalTypeInput
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (terminalTypeInput.trim() && terminalTypes.length === 0) {
      toast.error(
        "Terminal type must be a comma-separated list of integer IDs.",
      );
      return;
    }

    try {
      await createTerminalReport.mutateAsync({
        project_tracking: report.project_tracking,
        report_name: terminalReportName || undefined,
        main_deliverables: terminalDeliverables,
        attachment: terminalAttachment,
        is_published: terminalIsPublished,
        publication_link: terminalPublicationLink,
        status: terminalStatus,
        terminal_type: terminalTypes,
      });

      toast.success("Terminal report submitted successfully.");
      setIsTerminalDialogOpen(false);
      setTerminalReportName("");
      setTerminalDeliverables("");
      setTerminalAttachment(null);
      setTerminalIsPublished(false);
      setTerminalPublicationLink("");
      setTerminalStatus("pending");
      setTerminalTypeInput("");
    } catch (error) {
      toast.error("Terminal report submission failed.");
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading report...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-56 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer title="Progress Report Not Found">
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            This report could not be loaded. It may not exist or you may not
            have permission to view it.
          </p>
          <Button
            onClick={() => router.push("/research/monitoring/progress-report")}
          >
            Back to Progress Reports
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={report.report_name || `Progress Report #${report.id}`}
      description={`Project Tracking ID: ${report.project_tracking}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/monitoring/progress-report")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setIsProgressDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Submit Progress Report
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsTerminalDialogOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Terminal Report
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Report ID
                </p>
                <p className="text-sm font-semibold">#{report.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Project Tracking
                </p>
                <p className="text-sm font-semibold">
                  {report.project_tracking}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Submitted
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(report.submitted_at)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant="outline"
                  className={cn("mt-1", statusClass(report.status))}
                >
                  {statusLabel(report.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                General Status
              </p>
              <p className="text-sm">{report.general_status || "-"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Main Activities Achieved
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {report.main_activities_achieved}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Amount Used
                </p>
                <p className="text-sm font-semibold">
                  ETB {Number(report.amount_used || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Start Date
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(report.start_date)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  End Date
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(report.end_date)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Attachment
              </p>
              {report.attachment ? (
                <a
                  href={report.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Paperclip className="h-4 w-4" />
                  Open attachment
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No attachment uploaded.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Submission Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setIsProgressDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              New Progress Report
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsTerminalDialogOpen(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              New Terminal Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Progress Report</DialogTitle>
            <DialogDescription>
              This sends data through the progress report service layer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="progress-project-tracking">
                Project Tracking ID
              </Label>
              <Input
                id="progress-project-tracking"
                value={report.project_tracking}
                readOnly
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="progress-report-name">Report Name *</Label>
              <Input
                id="progress-report-name"
                value={progressReportName}
                onChange={(event) => setProgressReportName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="progress-activities">
                Main Activities Achieved *
              </Label>
              <Textarea
                id="progress-activities"
                value={progressActivities}
                onChange={(event) => setProgressActivities(event.target.value)}
                className="min-h-30"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="progress-amount">Amount Used</Label>
                <Input
                  id="progress-amount"
                  type="number"
                  value={progressAmountUsed}
                  onChange={(event) =>
                    setProgressAmountUsed(event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="progress-status">Status</Label>
                <select
                  id="progress-status"
                  value={progressStatus}
                  onChange={(event) =>
                    setProgressStatus(event.target.value as ReportStatus)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="progress-start-date">Start Date</Label>
                <Input
                  id="progress-start-date"
                  type="date"
                  value={progressStartDate}
                  onChange={(event) => setProgressStartDate(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="progress-end-date">End Date</Label>
                <Input
                  id="progress-end-date"
                  type="date"
                  value={progressEndDate}
                  onChange={(event) => setProgressEndDate(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="progress-attachment">Attachment</Label>
              <Input
                id="progress-attachment"
                type="file"
                onChange={(event) =>
                  setProgressAttachment(event.target.files?.[0] || null)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProgressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitProgressReport}
              disabled={createProgressReport.isPending}
            >
              {createProgressReport.isPending
                ? "Submitting..."
                : "Submit Progress Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTerminalDialogOpen}
        onOpenChange={setIsTerminalDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Terminal Report</DialogTitle>
            <DialogDescription>
              This sends data through the terminal report service layer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="terminal-project-tracking">
                Project Tracking ID
              </Label>
              <Input
                id="terminal-project-tracking"
                value={report.project_tracking}
                readOnly
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terminal-report-name">Report Name</Label>
              <Input
                id="terminal-report-name"
                value={terminalReportName}
                onChange={(event) => setTerminalReportName(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terminal-main-deliverables">
                Main Deliverables *
              </Label>
              <Textarea
                id="terminal-main-deliverables"
                value={terminalDeliverables}
                onChange={(event) =>
                  setTerminalDeliverables(event.target.value)
                }
                className="min-h-30"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="terminal-status">Status</Label>
                <select
                  id="terminal-status"
                  value={terminalStatus}
                  onChange={(event) =>
                    setTerminalStatus(event.target.value as ReportStatus)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="terminal-type">Terminal Type IDs</Label>
                <Input
                  id="terminal-type"
                  value={terminalTypeInput}
                  onChange={(event) => setTerminalTypeInput(event.target.value)}
                  placeholder="e.g. 1,2,3"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terminal-attachment">Attachment</Label>
              <Input
                id="terminal-attachment"
                type="file"
                onChange={(event) =>
                  setTerminalAttachment(event.target.files?.[0] || null)
                }
              />
            </div>
            <div className="grid gap-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="terminal-published" className="cursor-pointer">
                  Is Published
                </Label>
                <input
                  id="terminal-published"
                  type="checkbox"
                  checked={terminalIsPublished}
                  onChange={(event) =>
                    setTerminalIsPublished(event.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="terminal-publication-link">
                  Publication Link
                </Label>
                <Input
                  id="terminal-publication-link"
                  value={terminalPublicationLink}
                  onChange={(event) =>
                    setTerminalPublicationLink(event.target.value)
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTerminalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitTerminalReport}
              disabled={createTerminalReport.isPending}
            >
              {createTerminalReport.isPending
                ? "Submitting..."
                : "Submit Terminal Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
