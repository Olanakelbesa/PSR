"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
  RefreshCcw,
  Download,
  Paperclip,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { downloadConceptNoteAttachment } from "@/lib/utils/concept-note-attachments";
import { useEthicalClearance } from "@/lib/queries/ethical-clearance";
import type { IRBClearanceStatus } from "@/types/ethical-clearance";

const statusConfig: Record<
  IRBClearanceStatus,
  { label: string; className: string; icon: typeof Clock; description: string }
> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    description: "You need to submit this clearance application to the IRB.",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: ShieldCheck,
    description: "Your application is under review by the IRB committee.",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    description: "Your IRB clearance has been approved.",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
    description:
      "Your application was rejected. Please review feedback and resubmit.",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 border-violet-200",
    icon: RefreshCcw,
    description: "You have resubmitted this application. Awaiting review.",
  },
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clearanceId = Number(params.id);

  const { data: clearance, isLoading } = useEthicalClearance(clearanceId);

  const [viewerDocument, setViewerDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const resolvedClearanceUrl = clearance?.files?.clearanceFile
    ? resolveFileUrl(clearance.files.clearanceFile)
    : null;

  const status = clearance?.status;
  const cfg =
    statusConfig[status ?? "pending_submission"] ??
    statusConfig.pending_submission;
  const StatusIcon = cfg.icon;

  if (isLoading) {
    return (
      <PageContainer title="Submission Details">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!clearance) {
    return (
      <PageContainer title="Submission Details">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="font-semibold">Clearance record not found</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const showSubmitButton =
    status === "pending_submission" || status === "rejected";
  const hasReviews =
    clearance.reviews && clearance.reviews.length > 0;

  return (
    <PageContainer
      title="Submission Details"
      description={`${clearance.referenceNumber || ""} · ${clearance.proposalTitle || "Unknown Proposal"}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/research/irb-clearance/my-submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My Submissions
            </Link>
          </Button>
          {showSubmitButton && (
            <Button className="shadow-sm" asChild>
              <Link
                href={`/research/irb-clearance/my-submissions/submit/${clearanceId}`}
              >
                {status === "rejected" ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Resubmit Application
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Edit Draft
                  </>
                )}
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Proposal info */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  Proposal Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Title
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.proposalTitle || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reference
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.referenceNumber || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Principal Investigator
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.pi?.fullName || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Institution
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.proposalInstitution || "—"}
                  </p>
                </div>
              </div>
              {clearance.proposalShortAbstract && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Abstract
                    </p>
                    <div
                      className="text-sm leading-relaxed text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic"
                      dangerouslySetInnerHTML={{
                        __html: clearance.proposalShortAbstract,
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Clearance details */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  Clearance Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Clearance Type
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.clearanceTypeName || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Application Date
                  </p>
                  <p className="text-sm font-semibold">
                    {clearance.applicationDate}
                  </p>
                </div>
              </div>
              {clearance.submissionNotes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Submission Notes
                    </p>
                    <p className="text-sm leading-relaxed">
                      {clearance.submissionNotes}
                    </p>
                  </div>
                </>
              )}
              {resolvedClearanceUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Clearance Document
                    </p>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        CLR
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          Clearance Document
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded clearance file
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 px-2.5"
                          onClick={() =>
                            setViewerDocument({
                              url: resolvedClearanceUrl,
                              title: "Clearance Document",
                            })
                          }
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 px-2.5"
                          onClick={() =>
                            downloadConceptNoteAttachment(
                              resolvedClearanceUrl,
                              "Clearance Document",
                            )
                          }
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Supporting documents */}
          {clearance.supportingDocuments &&
            clearance.supportingDocuments.length > 0 && (
              <Card className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">
                      Supporting Documents
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {clearance.supportingDocuments.map((doc) => {
                    const resolvedUrl = resolveFileUrl(doc.fileUrl);
                    return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        {doc.documentType === "clearance" ? "CLR" : "SUP"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {doc.originalFilename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileSize
                            ? doc.fileSize < 1024 * 1024
                              ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                              : `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
                            : ""}
                          {doc.uploadedAt &&
                            ` · Uploaded ${doc.uploadedAt}`}
                        </p>
                      </div>
                      {resolvedUrl && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 px-2.5"
                            onClick={() =>
                              setViewerDocument({
                                url: resolvedUrl,
                                title: doc.originalFilename,
                              })
                            }
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 px-2.5"
                            onClick={() =>
                              downloadConceptNoteAttachment(
                                resolvedUrl,
                                doc.originalFilename,
                              )
                            }
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

          {/* Reviews history */}
          {hasReviews && (
            <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">
                    Review History
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {clearance.reviews!.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {review.reviewer}
                      </p>
                      <Badge
                        className={cn(
                          "border px-2 text-[10px] font-bold uppercase shadow-none",
                          review.decision === "approved"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-rose-100 text-rose-700 border-rose-200",
                        )}
                      >
                        {review.decision}
                      </Badge>
                    </div>
                    {review.comments && (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {review.comments}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {review.reviewedAt}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-6 text-sm lg:sticky lg:top-20">
          {/* Status card */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-primary/5 pb-3 text-left">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Submission Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">
                  Status
                </span>
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    cfg.className,
                  )}
                >
                  {cfg.label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Applied</span>
                  <span className="font-semibold text-foreground">
                    {clearance.applicationDate || "—"}
                  </span>
                </div>
                {clearance.approvalDate && (
                  <div className="flex justify-between">
                    <span>Approved</span>
                    <span className="font-semibold text-foreground">
                      {clearance.approvalDate}
                    </span>
                  </div>
                )}
                {clearance.clearanceTypeName && (
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-semibold text-foreground">
                      {clearance.clearanceTypeName}
                    </span>
                  </div>
                )}
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {cfg.description}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
      <PdfViewerDialog
        isOpen={!!viewerDocument}
        onOpenChange={(open) => !open && setViewerDocument(null)}
        url={viewerDocument?.url ?? ""}
        title={viewerDocument?.title ?? "Document"}
      />
    </PageContainer>
  );
}
