"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, MessageSquare, RefreshCw, X } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProgressReportApproval,
  useUpdateProgressReportApproval,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ApprovalDecision = "pending" | "approved" | "rejected";

function decisionBadgeClass(value: ApprovalDecision) {
  if (value === "approved")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function decisionLabel(value: ApprovalDecision) {
  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

function formatDate(value: string) {
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

export default function ProgressReportApprovalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const approvalId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined),
    [id],
  );

  const {
    data: approval,
    isLoading,
    refetch,
  } = useProgressReportApproval(approvalId);
  const updateApproval = useUpdateProgressReportApproval();

  const [decision, setDecision] = useState<ApprovalDecision>("pending");
  const [comment, setComment] = useState("");
  const [progressReportId, setProgressReportId] = useState("");

  useEffect(() => {
    if (approval) {
      setDecision(approval.decision);
      setComment(approval.comment ?? "");
      setProgressReportId(String(approval.progress_report ?? ""));
    }
  }, [approval]);

  async function saveDecision() {
    if (!approvalId) {
      return;
    }

    const parsedProgressReport = Number(progressReportId);
    if (!Number.isFinite(parsedProgressReport) || parsedProgressReport <= 0) {
      toast.error("Progress report must be a valid integer.");
      return;
    }

    try {
      await updateApproval.mutateAsync({
        id: approvalId,
        values: {
          decision,
          comment: comment || "",
          progress_report: parsedProgressReport,
        },
      });

      toast.success("Approval decision updated successfully.");
      await refetch();
    } catch (error) {
      toast.error("Could not update approval decision.");
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading approval...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-72 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!approval) {
    return (
      <PageContainer title="Approval Not Found">
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            This approval record does not exist or you do not have access.
          </p>
          <Button
            onClick={() =>
              router.push("/research/monitoring/progress-report-approval")
            }
          >
            Back to Approval List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Approval #${approval.id}`}
      description={`Reviewer: ${approval.reviewer_name}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push("/research/monitoring/progress-report-approval")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Approval Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Approval ID
                </p>
                <p className="text-sm font-semibold">#{approval.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Progress Report ID
                </p>
                <p className="text-sm font-semibold">
                  {approval.progress_report}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Reviewer
                </p>
                <p className="text-sm font-semibold">
                  {approval.reviewer_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Reviewed At
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(approval.reviewed_at)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Current Decision
              </p>
              <Badge
                variant="outline"
                className={cn("mt-1", decisionBadgeClass(approval.decision))}
              >
                {decisionLabel(approval.decision)}
              </Badge>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Existing Comment
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {approval.comment || "No comment submitted yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Update Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Decision
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDecision("approved")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold",
                    decision === "approved"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("rejected")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold",
                    decision === "rejected"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDecision("pending")}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-semibold",
                  decision === "pending"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-border text-muted-foreground",
                )}
              >
                Mark Pending
              </button>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="progress-report"
                className="text-xs uppercase tracking-widest text-muted-foreground"
              >
                Progress Report ID
              </Label>
              <Input
                id="progress-report"
                type="number"
                value={progressReportId}
                onChange={(event) => setProgressReportId(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="comment"
                className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Comment
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Provide review notes for this decision"
                className="min-h-30"
              />
            </div>

            <Button
              className="w-full"
              onClick={saveDecision}
              disabled={updateApproval.isPending}
            >
              {updateApproval.isPending ? "Saving..." : "Save Decision"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
