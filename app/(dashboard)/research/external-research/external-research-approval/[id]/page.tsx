"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Tag,
  User,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useExternalResearch, useUpdateExternalResearch } from "@/hooks";
import { toast } from "sonner";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

type ReviewDecision = "approved" | "rejected";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rejected: "bg-rose-50 border-rose-200 text-rose-700",
  pending: "bg-amber-50 border-amber-200 text-amber-700",
};

export default function ExternalResearchApprovalDetailPage() {
  const params = useParams();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();

  const { data: item, isLoading } = useExternalResearch(id);
  const updateMutation = useUpdateExternalResearch();

  const [remarks, setRemarks] = useState("");
  const [pendingDecision, setPendingDecision] =
    useState<ReviewDecision | null>(null);

  const status = String(item?.approval_status ?? "pending");
  const isPending = status === "pending";
  const statusLabel =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : "Pending Approval";

  const submitDecision = async (decision: ReviewDecision) => {
    if (!id) return;

    setPendingDecision(decision);
    try {
      await updateMutation.mutateAsync({
        id,
        values: {
          approval_status: decision,
          approval_remarks: remarks,
        },
      });
      toast.success(
        `External research ${decision === "approved" ? "approved" : "rejected"}.`,
      );
      router.push("/research/external-research/external-research-approval");
    } catch {
      toast.error("Unable to save the review decision.");
    } finally {
      setPendingDecision(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="text-center py-16 text-sm text-muted-foreground">
          Loading submission...
        </div>
      </PageContainer>
    );
  }

  if (!item) {
    return (
      <PageContainer title="Submission Not Found">
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground">
            Submission Not Found
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            The requested external research submission does not exist or has
            been removed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/research/external-research/external-research-approval">
              Back to Approval Queue
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={item.title}
      description={`Submission Reference: ${item.id}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" className="shadow-sm bg-white">
            <Link href="/research/external-research/external-research-approval">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Approval Queue
            </Link>
          </Button>

          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 font-bold uppercase tracking-wider",
              STATUS_STYLES[status] ?? STATUS_STYLES.pending,
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT: Submission details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-3xl">
              <CardContent className="p-6 md:p-8 space-y-6">
                {item.keywords && (
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5" />
                    {item.keywords}
                  </div>
                )}

                <h1 className="text-xl md:text-2xl font-bold leading-snug text-slate-900">
                  {item.title}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Author(s)
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                        {item.authors ?? "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Publisher / Source
                      </span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block truncate">
                        {item.institution ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Year
                      </span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block">
                        {item.year ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Research Type
                      </span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block capitalize">
                        {item.type ?? "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-3xl">
              <CardHeader className="border-b pb-4 p-6 md:p-8">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Abstract / Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {item.abstract ??
                    item.citation ??
                    "No abstract was provided for this submission."}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-3xl">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Document Access
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {item.file ? (
                  <Button
                    asChild
                    className="w-full h-11 text-xs font-bold uppercase tracking-wider"
                  >
                    <a
                      href={resolveFileUrl(String(item.file)) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Document
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No document was attached to this submission.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Review panel & document */}
          <div className="space-y-6">
            <Card className="border border-primary/15 shadow-md bg-white overflow-hidden rounded-3xl">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Review Decision
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {isPending ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="approval-remarks" className="text-xs">
                        Remarks
                      </Label>
                      <Textarea
                        id="approval-remarks"
                        value={remarks}
                        onChange={(event) => setRemarks(event.target.value)}
                        placeholder="Leave a note for the submitter or record the review reason."
                        rows={4}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => submitDecision("approved")}
                        disabled={updateMutation.isPending}
                        className="w-full h-10 font-bold"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {pendingDecision === "approved"
                          ? "Approving..."
                          : "Approve"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => submitDecision("rejected")}
                        disabled={updateMutation.isPending}
                        className="w-full h-10 font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {pendingDecision === "rejected"
                          ? "Rejecting..."
                          : "Reject"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1 font-bold uppercase tracking-wider",
                        STATUS_STYLES[status] ?? STATUS_STYLES.pending,
                      )}
                    >
                      {statusLabel}
                    </Badge>
                    {item.reviewed_by_name && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed by{" "}
                        <span className="font-semibold text-slate-700">
                          {item.reviewed_by_name}
                        </span>
                        {item.reviewed_at &&
                          ` on ${new Date(item.reviewed_at).toLocaleDateString()}`}
                      </p>
                    )}
                    {item.approval_remarks && (
                      <div className="p-3 bg-slate-50 border rounded-xl text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                        {item.approval_remarks}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-3xl">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Submission Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Submitted by
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {item.uploaded_by_name ?? "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Submitted on
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.uploaded_at
                      ? new Date(item.uploaded_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Reference
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-700">
                    {item.id}
                  </span>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
