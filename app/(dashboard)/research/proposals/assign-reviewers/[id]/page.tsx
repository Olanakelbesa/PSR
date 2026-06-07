"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Star,
  Users,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getScreeningById,
  type Screening,
  type ScreeningAssignedReviewer,
  type ScreeningProposalDetail,
  type ScreeningTechnicalReview,
} from "@/api/services";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

const statusStyles: Record<string, string> = {
  submitted:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  resubmitted:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  screening_under_review:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  screening_approved:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  screening_rejected:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
};

function normalizeStatusKey(status?: string | null) {
  return String(status ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium" }).format(date);
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "N/A";
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function fileUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "R"
  );
}

export default function AssignReviewersDetailPage() {
  const { id } = useParams();
  const screeningId = useMemo(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    return rawId ? String(rawId) : "";
  }, [id]);

  const [screening, setScreening] = useState<Screening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!screeningId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadScreening() {
      try {
        const record = await getScreeningById(screeningId);
        if (!isMounted) return;
        setScreening(record);
        setHasError(false);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load screening detail:", error);
        setScreening(null);
        setHasError(true);
        toast.error("Failed to load screening detail");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadScreening();

    return () => {
      isMounted = false;
    };
  }, [screeningId]);

  const proposal = (screening?.proposal ?? null) as ScreeningProposalDetail | null;
  const assignedReviewers = (screening?.assignedReviewers ??
    []) as ScreeningAssignedReviewer[];
  const technicalReviews = proposal?.reviewHistory?.technicalReviews ?? [];
  const reviewByReviewerId = useMemo(() => {
    const map = new Map<number, ScreeningTechnicalReview>();
    for (const review of technicalReviews) {
      if (review.reviewer?.id != null) {
        map.set(review.reviewer.id, review);
      }
    }
    return map;
  }, [technicalReviews]);

  const averageScore = useMemo(() => {
    const scored = technicalReviews.filter(
      (review) => review.totalScore != null,
    );
    if (!scored.length) return null;
    const total = scored.reduce(
      (sum, review) => sum + Number(review.totalScore ?? 0),
      0,
    );
    return total / scored.length;
  }, [technicalReviews]);

  const currentStatus =
    proposal?.status ?? screening?.status ?? "screening_under_review";
  const statusKey = normalizeStatusKey(currentStatus);
  const statusLabel =
    proposal?.statusDisplay ??
    screening?.status?.replace(/_/g, " ") ??
    currentStatus.replace(/_/g, " ");
  const teamMembers = proposal?.teamMembers ?? [];

  if (isLoading) {
    return (
      <PageContainer title="Loading Screening...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Fetching screening details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (hasError || !screening || !proposal) {
    return (
      <PageContainer title="Screening Not Found">
        <div className="h-96 flex flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <p className="font-bold text-lg">Unable to load this screening</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/research/proposals/assign-reviewers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const proposalFile = fileUrl(proposal.proposalFile);
  const updatedProposal = fileUrl(proposal.updatedProposal);
  const supportingDocs = fileUrl(proposal.supportingDocs);
  const signatureUrl = fileUrl(proposal.signature);

  return (
    <PageContainer
      title={proposal.title || "Untitled Proposal"}
      description={`${proposal.referenceNumber || `SCR-${screening.id}`} · Screening #${screening.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="h-9">
            <Link href="/research/proposals/assign-reviewers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild className="h-9">
            <Link href={`/research/proposals/assign-reviewers/${screening.id}/assign`}>
              <Users className="mr-2 h-4 w-4" />
              Manage Reviewers
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Card className="shadow-sm border-primary/5 overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "border px-2.5 py-1 capitalize font-bold shadow-none",
                        statusStyles[statusKey] || statusStyles.screening_under_review,
                      )}
                    >
                      {statusLabel}
                    </Badge>
                    {averageScore != null && (
                      <Badge variant="outline" className="gap-1">
                        Avg Score: {averageScore.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl md:text-2xl leading-tight">
                    {proposal.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {proposal.call?.title || "No call assigned"}
                  </p>
                </div>
                <div className="min-w-45 rounded-2xl border bg-background px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Submitted At
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatDateTime(proposal.submittedAt)}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Budget Requested
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {proposal.budgetRequested
                      ? `ETB ${proposal.budgetRequested}`
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Proposal Type
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {proposal.proposalType?.name || "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Thematic Area
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {proposal.thematicAreas?.[0]?.name || "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Reviews Completed
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {technicalReviews.length} / {assignedReviewers.length}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold">Abstract</h2>
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <HtmlContentRenderer
                    content={proposal.abstract || "No abstract provided."}
                  />
                </div>
              </div>

              {proposal.keywords?.length ? (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-bold">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {proposal.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="bg-muted/70">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          {proposal.reviewHistory?.decisionRemarks ? (
            <Card className="shadow-sm border-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Screening Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
                  <p className="text-sm">{proposal.reviewHistory.decisionRemarks}</p>
                  <p className="text-xs text-muted-foreground">
                    {proposal.reviewHistory.status || statusLabel} ·{" "}
                    {formatDateTime(proposal.reviewHistory.reviewedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {teamMembers.length ? (
            <Card className="shadow-sm border-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.map((member, index) => {
                  const name =
                    String(member.memberName ?? member.stakeholderName ?? "Unnamed member");
                  return (
                    <div key={String(member.id ?? index)} className="rounded-xl border p-4">
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(member.roleName ?? member.memberType ?? "Member")}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Reviewers ({assignedReviewers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {assignedReviewers.length ? (
                assignedReviewers.map((reviewer) => {
                  const review = reviewByReviewerId.get(reviewer.id);
                  return (
                    <div
                      key={reviewer.id}
                      className="rounded-xl border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <Avatar className="h-9 w-9 border shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                              {getInitials(reviewer.fullName || "Reviewer")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {reviewer.fullName || "Unknown Reviewer"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {reviewer.email || "No email"}
                            </p>
                            {reviewer.role ? (
                              <Badge variant="secondary" className="mt-1 text-[10px]">
                                {reviewer.role}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Score
                          </p>
                          <p className="text-lg font-black text-primary">
                            {review?.totalScore ?? "—"}
                          </p>
                        </div>
                      </div>
                      {review?.comments ? (
                        <p className="text-xs text-muted-foreground italic border-t pt-2">
                          {review.comments}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reviewers assigned yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Screening Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DetailLine label="Screening ID" value={String(screening.id)} />
              <DetailLine label="Status" value={statusLabel} />
              <DetailLine
                label="Decision Remarks"
                value={screening.decisionRemarks || proposal.reviewHistory?.decisionRemarks || "None"}
              />
              <DetailLine
                label="Reviewed At"
                value={formatDateTime(proposal.reviewHistory?.reviewedAt ?? screening.updatedAt)}
              />
              <DetailLine label="Version" value={String(proposal.version ?? 1)} />
              <DetailLine
                label="Resubmissions"
                value={String(proposal.resubmissionCount ?? 0)}
              />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submitted By
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.createdBy
                      ? formatName(
                        proposal.createdBy.firstName,
                        proposal.createdBy.lastName,
                      )
                      : "Unknown creator"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {proposal.createdBy?.email || "No email"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Institutional Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.Organization?.name || "No organization"}
                  </p>
                  <p className="text-xs text-muted-foreground">Organization</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <Layers className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.Unit?.name || "No unit"}
                  </p>
                  <p className="text-xs text-muted-foreground">Unit</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.receivingOffice?.name || "No receiving office"}
                  </p>
                  <p className="text-xs text-muted-foreground">Receiving Office</p>
                </div>
              </div>
            </CardContent>
          </Card>


        </aside>
      </div>
    </PageContainer>
  );
}
