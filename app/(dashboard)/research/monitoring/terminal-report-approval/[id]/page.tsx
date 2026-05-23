"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useTerminalReportApproval,
  useUpdateTerminalReportApproval,
} from "@/hooks/useProgressReports";
import { toast } from "sonner";

const statusConfig = {
  pending: {
    label: "Pending Review",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200/60",
  },
} as const;

export default function TerminalReportApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const { data, isLoading } = useTerminalReportApproval(id);
  const updateMutation = useUpdateTerminalReportApproval();

  const [decision, setDecision] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [comment, setComment] = useState("");
  const [terminalReportId, setTerminalReportId] = useState("");

  useEffect(() => {
    if (!data) return;
    setDecision(data.decision);
    setComment(data.comment ?? "");
    setTerminalReportId(String(data.terminal_report ?? ""));
  }, [data]);

  const status = useMemo(
    () => statusConfig[decision] ?? statusConfig.pending,
    [decision],
  );

  async function handleSubmit() {
    if (!id) return;

    const parsedTerminalReportId = terminalReportId.trim()
      ? Number(terminalReportId)
      : undefined;

    if (terminalReportId.trim() && Number.isNaN(parsedTerminalReportId)) {
      toast.error("Terminal report must be a valid number.");
      return;
    }

    updateMutation.mutate(
      {
        id,
        values: {
          decision,
          comment,
          terminal_report: parsedTerminalReportId,
        },
      },
      {
        onSuccess: () => {
          toast.success("Terminal report approval updated successfully.");
          router.push("/research/monitoring/terminal-report-approval");
        },
        onError: () => {
          toast.error("Failed to update terminal report approval.");
        },
      },
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Terminal Approval...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-[420px]" />
            <Skeleton className="h-[420px]" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer title="Terminal Approval Not Found">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">
            No Approval Record Found
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            The requested terminal report approval could not be loaded.
          </p>
          <Button
            onClick={() =>
              router.push("/research/monitoring/terminal-report-approval")
            }
            className="mt-4"
          >
            Back to Approvals
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Terminal Approval #${data.id}`}
      description={`Reviewer: ${data.reviewer_name}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() =>
              router.push("/research/monitoring/terminal-report-approval")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Approvals
          </Button>

          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 font-bold uppercase tracking-wider",
              status.className,
            )}
          >
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Approval Summary
                </CardTitle>
                <CardDescription>
                  Terminal report approval details from the backend record.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Reviewer
                  </span>
                  <span className="text-sm font-semibold text-foreground mt-1 block">
                    {data.reviewer_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Review Date
                  </span>
                  <span className="text-sm font-semibold text-foreground mt-1 block">
                    {new Date(data.reviewed_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Terminal Report
                  </span>
                  <span className="text-sm font-semibold text-foreground mt-1 block">
                    #{data.terminal_report}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Reviewer ID
                  </span>
                  <span className="text-sm font-semibold text-foreground mt-1 block">
                    {data.reviewer}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Reviewer Comment
                </CardTitle>
                <CardDescription>
                  Update the decision notes that will be sent to the backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="comment"
                    className="text-xs uppercase font-bold text-muted-foreground"
                  >
                    ROC Comments
                  </Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter review notes..."
                    className="min-h-[160px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white sticky top-6">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Decision Panel
                </CardTitle>
                <CardDescription>
                  Edit approval status and linked report reference.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">
                    Decision
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {(["pending", "approved", "rejected"] as const).map(
                      (value) => (
                        <Button
                          key={value}
                          type="button"
                          variant={decision === value ? "default" : "outline"}
                          onClick={() => setDecision(value)}
                          className={cn(
                            "justify-start",
                            value === "approved" &&
                              decision === value &&
                              "bg-emerald-600 hover:bg-emerald-700",
                            value === "rejected" &&
                              decision === value &&
                              "bg-rose-600 hover:bg-rose-700",
                          )}
                        >
                          {value[0].toUpperCase() + value.slice(1)}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="terminal-report"
                    className="text-xs uppercase font-bold text-muted-foreground"
                  >
                    Terminal Report ID
                  </Label>
                  <input
                    id="terminal-report"
                    type="number"
                    value={terminalReportId}
                    onChange={(e) => setTerminalReportId(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="border-t pt-4">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Approval"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
