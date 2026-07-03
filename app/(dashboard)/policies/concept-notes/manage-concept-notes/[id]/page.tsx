"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  Download,
  ClipboardCheck,
  CheckCircle2,
  ExternalLink,
  Check,
  FileText,
  GitBranch,
  RefreshCw,
  AlertCircle,
  Building2,
  Maximize2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { ConceptNoteAttachmentViewer } from "@/components/policies/concept-notes/concept-note-attachment-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useManageConceptNoteDetail } from "@/lib/queries/concept-notes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  under_review: {
    label: "Under Review",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  partially_accepted: {
    label: "Partially Accepted",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  not_accepted: {
    label: "Not Accepted",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  revision_required: {
    label: "Revision Required",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  policy_draft_ready: {
    label: "Policy Draft Ready",
    className: "bg-teal-100 text-teal-700 border-teal-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
}

// ── Timeline event icons ──────────────────────────────────────────────────────
const EVENT_ICONS: Record<string, React.ReactNode> = {
  SUBMITTED: <FileText className="h-3.5 w-3.5" />,
  REVIEWER_ASSIGNED: <User className="h-3.5 w-3.5" />,
  REVIEW_COMPLETED: <CheckCircle2 className="h-3.5 w-3.5" />,
  RESUBMITTED: <RefreshCw className="h-3.5 w-3.5" />,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManageConceptNoteDetailPage() {
  const params = useParams();
  const { backendToken } = useAuth();
  const id = params.id as string;

  const {
    data: note,
    isLoading,
    isError,
    refetch,
  } = useManageConceptNoteDetail(id, backendToken);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError || !note) {
    return (
      <PageContainer title="Error">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
          <p className="font-semibold text-destructive">
            Failed to load concept note
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </PageContainer>
    );
  }

  const currentStatusKey = note.currentStatus?.status ?? "";
  const submittedAt = note.submittedBy?.submittedAt;
  const lastUpdated = note.submittedBy?.lastUpdated;
  const fileUrl = resolveFileUrl(note.overview?.file);
  const latestVersion = note.versions?.[note.versions.length - 1];

  const isReviewDetailCompleted = (detail: any) => {
    const finalStatus = String(
      detail.finalDecisionStatus ?? detail.final_decision_status ?? "",
    )
      .trim()
      .toLowerCase();

    const reviewerPresent = Boolean(
      detail.expertReviewer || detail.reviewer || detail.expert_reviewer,
    );
    const commentPresent = Boolean(
      String(detail.comment || detail.recommendation || "").trim(),
    );
    const hasFinalDecision =
      finalStatus && finalStatus !== "pending" && finalStatus !== "draft";

    return reviewerPresent || commentPresent || hasFinalDecision;
  };

  const hasReviewerFeedback =
    note.expertFeedback?.some((fb: any) =>
      (fb.feedbackDetail || []).some(isReviewDetailCompleted),
    ) ?? false;

  return (
    <PageContainer
      title={note.title}
      description={`${note.currentStatus?.conceptId ?? `#${id}`} · ${note.currentStatus?.version ?? ""}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/concept-notes/manage-concept-notes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/policies/concept-notes/manage-concept-notes/${id}/assign`}
            >
              <User className="mr-2 h-4 w-4" />
              Assign Expert
            </Link>
          </Button>
          {hasReviewerFeedback && (
            <Button
              asChild
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Link
                href={`/policies/concept-notes/manage-concept-notes/${id}/approve`}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-10 bg-muted/60 rounded-lg p-1 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="feedback">Expert Feedback</TabsTrigger>
              <TabsTrigger value="versions">
                Versions ({note.versions?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline ({note.timeline?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            {/* Document viewer tab */}
            <TabsContent value="document" className="mt-4">
              <ConceptNoteAttachmentViewer
                url={fileUrl ?? ""}
                title={extractFileName(fileUrl) || note.title}
                viewerClassName="h-[75vh]"
              />
            </TabsContent>

            {/* Overview tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {note.overview?.executiveSummary ?? "No summary provided."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expert Feedback tab */}
            <TabsContent value="feedback" className="mt-4 space-y-4">
              {note.expertFeedback && note.expertFeedback.length > 0 ? (
                note.expertFeedback.map((fb: any, idx: number) => (
                  <Card key={idx} className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                          {fb.versionNumber}
                        </CardTitle>
                        <div className="flex gap-2">
                          {fb.isLatest && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 border">
                              Latest
                            </Badge>
                          )}
                          {fb.isResubmission && (
                            <Badge variant="outline" className="text-[10px]">
                              Resubmission
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {fb.feedbackDetail && fb.feedbackDetail.length > 0 ? (
                        <div className="space-y-3">
                          {fb.feedbackDetail.map((detail: any, di: number) => {
                            if (!detail.expertReviewer && !detail.reviewer) {
                              return (
                                <div
                                  key={di}
                                  className="p-4 rounded-lg border border-dashed border-muted bg-muted/10 text-center space-y-1"
                                >
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Expert reviewer is not assigned
                                  </p>
                                  <p className="text-xs text-muted-foreground/80">
                                    This version is awaiting reviewer assignment.
                                  </p>
                                </div>
                              );
                            }

                            const reviewerName =
                              detail.expertReviewer?.fullName ??
                              detail.reviewer ??
                              `Reviewer ${di + 1}`;
                            const reviewerEmail =
                              detail.expertReviewer?.email ?? "";

                            return (
                              <div
                                key={di}
                                className="p-3 rounded-lg bg-muted/30 space-y-1"
                              >
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {reviewerName} {reviewerEmail && <span>({reviewerEmail})</span>}
                                  </p>
                                 
                                </div>
                                <p className="text-sm text-foreground/80">
                                  {detail.comment ?? detail.recommendation}
                                </p>
                                {detail.decision && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] mt-1"
                                  >
                                    {detail.decision}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No feedback detail available for this version yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-12 text-center">
                  <ClipboardCheck className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No expert feedback yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Feedback will appear here once reviewers submit their
                    evaluations.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Versions tab */}
            <TabsContent value="versions" className="mt-4 space-y-4">
              {note.versions && note.versions.length > 0 ? (
                note.versions.map((v: any) => (
                  <Card key={v.id} className="shadow-sm">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                              v.isLatest ? "bg-primary/10" : "bg-muted",
                            )}
                          >
                            <GitBranch
                              className={cn(
                                "h-4 w-4",
                                v.isLatest
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold font-mono">
                                {v.versionNumber}
                              </span>
                              {v.isLatest && (
                                <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 border px-1.5 py-0">
                                  Latest
                                </Badge>
                              )}
                              {v.isResubmission && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  Resubmission
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              By {v.createdByName} ·{" "}
                              {new Date(v.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                            {v.parentVersionNumber && (
                              <p className="text-xs text-muted-foreground/70">
                                Based on {v.parentVersionNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        {v.file && (
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={resolveFileUrl(v.file) ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />{" "}
                                View
                              </a>
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <a href={resolveFileUrl(v.file) ?? "#"} download>
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-12 text-center">
                  <GitBranch className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No versions yet
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Timeline tab */}
            <TabsContent value="timeline" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  {note.timeline && note.timeline.length > 0 ? (
                    <ol className="relative border-l border-muted-foreground/20 space-y-6 ml-3">
                      {note.timeline.map((event: any, idx: number) => (
                        <li key={idx} className="ml-6">
                          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-muted-foreground/20 shadow-sm">
                            {EVENT_ICONS[event.eventType] ?? (
                              <Calendar className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-foreground leading-tight">
                                {event.title}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  {event.actor}
                                </span>
                                {event.version && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] font-mono px-1.5 py-0"
                                  >
                                    {event.version}
                                  </Badge>
                                )}
                                {event.metadataSummary?.decision && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] capitalize px-1.5 py-0"
                                  >
                                    {event.metadataSummary.decision}
                                  </Badge>
                                )}
                              </div>
                              {event.metadataSummary?.recommendation && (
                                <p className="text-xs text-muted-foreground/80 italic">
                                  "{event.metadataSummary.recommendation}"
                                </p>
                              )}
                            </div>
                            <time className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
                              {new Date(event.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-8">
                      No timeline events recorded yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          {/* Status card */}
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge
                  status={
                    note.currentStatus?.status
                      ?.toLowerCase()
                      .replace(/ /g, "_") ?? "draft"
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Concept ID
                </span>
                <span className="text-xs font-mono font-bold">
                  {note.currentStatus?.conceptId ?? `#${id}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {note.currentStatus?.version ?? "—"}
                </Badge>
              </div>

              <Separator />

              {/* Submitted by */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Submitted By
                </span>
                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="h-9 w-9 border shadow-sm">
                    <AvatarImage
                      src={resolveFileUrl(note.submittedBy?.photoUrl) ?? undefined}
                    />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {note.submittedBy?.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate text-foreground">
                      {note.submittedBy?.fullName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {note.submittedBy?.email}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-2 text-xs text-muted-foreground">
                {submittedAt && (
                  <div className="flex justify-between">
                    <span>Submitted</span>
                    <span className="font-medium text-foreground">
                      {new Date(submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {lastUpdated && (
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="font-medium text-foreground">
                      {new Date(lastUpdated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-9 text-sm"
                asChild
              >
                <Link
                  href={`/policies/concept-notes/manage-concept-notes/${id}/assign`}
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  Assign Expert
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-9 text-sm"
                asChild
              >
                <Link
                  href={`/policies/concept-notes/manage-concept-notes/${id}/approve`}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  Review & Approve
                </Link>
              </Button>
              {fileUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 text-sm"
                  asChild
                >
                  <a href={fileUrl} download>
                    <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                    Download Document
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Latest version */}
          {latestVersion && (
            <Card className="shadow-sm border-muted">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Latest Version
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono font-semibold">
                    {latestVersion.versionNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created by</span>
                  <span className="font-medium truncate max-w-[130px] text-right">
                    {latestVersion.createdByName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(latestVersion.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                {latestVersion.file && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 text-xs h-8"
                    asChild
                  >
                    <a
                      href={resolveFileUrl(latestVersion.file) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1.5 h-3 w-3" /> View File
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
