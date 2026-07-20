"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Mail,
  MapPin,
  RefreshCw,
  Tag,
  Users,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getScreeningById,
  type Screening,
  type ScreeningAssignedReviewer,
  type ScreeningProposalDetail,
  type ScreeningTechnicalReview,
  type ScreeningTechnicalReviewResponse,
} from "@/api/services";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { PdfViewerDialog } from "@/components/shared";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
  }).format(date);
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

function DetailLine({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof FileText;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "R"
  );
}

// ── Reviewer border colors ─────────────────────────────────────────────────────
const REVIEWER_BORDER_COLORS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
];

/** Check if a technical review has actual submitted content (not just a placeholder stub) */
function hasReviewContent(review: ScreeningTechnicalReview): boolean {
  return Boolean(
    review.hasResponses ||
      (review.totalScore != null && review.totalScore > 0) ||
      (review.comments && review.comments.trim().length > 0) ||
      review.attachment,
  );
}

type CategoryGroup = {
  id: number | string;
  name: string;
  responses: ScreeningTechnicalReviewResponse[];
};

function groupResponsesByCategory(
  responses: ScreeningTechnicalReviewResponse[],
): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const resp of responses) {
    const catId = resp.question?.category?.id ?? "uncategorized";
    const catName = resp.question?.category?.name || "Evaluation Criteria";
    const key = String(catId);
    const existing = map.get(key);
    if (existing) {
      existing.responses.push(resp);
    } else {
      map.set(key, { id: catId, name: catName, responses: [resp] });
    }
  }
  return Array.from(map.values());
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AssignReviewersDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const screeningId = useMemo(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    return rawId ? String(rawId) : "";
  }, [id]);

  const [screening, setScreening] = useState<Screening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [viewingFile, setViewingFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!screeningId) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }
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
    })();
    return () => {
      isMounted = false;
    };
  }, [screeningId]);

  const proposal = (screening?.proposal ??
    null) as ScreeningProposalDetail | null;
  const rawProposal = proposal as any;
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

  const submittedReviews = useMemo(
    () => technicalReviews.filter(hasReviewContent),
    [technicalReviews],
  );

  const maxPossiblePoints = (screening as any)?.maxPossiblePoints ?? 0;

  const averageScore = useMemo(() => {
    const scored = submittedReviews.filter(
      (review) => review.totalScore != null,
    );
    if (!scored.length) return null;
    const total = scored.reduce(
      (sum, review) => sum + Number(review.totalScore ?? 0),
      0,
    );
    return total / scored.length;
  }, [submittedReviews]);

  const averageScorePct = useMemo(() => {
    if (averageScore == null || !maxPossiblePoints) return null;
    return Math.round((averageScore / maxPossiblePoints) * 100);
  }, [averageScore, maxPossiblePoints]);

  /** Convert a raw score to a percentage string */
  const toPercent = (rawScore: number | null | undefined): string => {
    if (rawScore == null || !maxPossiblePoints) return "—";
    return `${Math.round((Number(rawScore) / maxPossiblePoints) * 100)}%`;
  };

  const currentStatus =
    proposal?.status ?? screening?.status ?? "screening_under_review";
  const statusKey = String(currentStatus)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const statusLabel =
    proposal?.statusDisplay ??
    screening?.status?.replace(/_/g, " ") ??
    currentStatus.replace(/_/g, " ");
  const teamMembers = (rawProposal?.teamMembers ?? []) as Array<{
    id?: string | number;
    memberName?: string;
    stakeholderName?: string;
    roleName?: string;
    memberType?: string;
    email?: string;
  }>;

  const hasFiles =
    proposal?.proposalFile || proposal?.supportingDocs || proposal?.updatedProposal;
  const hasSignature = Boolean(proposal?.signature);

  const fileEntries: Array<{
    key: string;
    label: string;
    filePath: string | null;
  }> = [
    {
      key: "proposal",
      label: "Proposal Document",
      filePath: proposal?.proposalFile ?? null,
    },
    {
      key: "updated",
      label: "Updated Proposal",
      filePath: proposal?.updatedProposal ?? null,
    },
    {
      key: "supporting",
      label: "Supporting Documents",
      filePath: proposal?.supportingDocs ?? null,
    },
  ].filter((f) => Boolean(f.filePath));

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading Screening...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (hasError || !screening || !proposal) {
    return (
      <PageContainer
        title="Screening Not Found"
        description="The requested screening could not be loaded."
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/assign-reviewers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">
                Screening Details Unavailable
              </h3>
              <p className="text-sm text-amber-800">
                The screening details could not be loaded. Please try again or
                contact support.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.refresh()}
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Assign Reviewers"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push("/research/proposals/assign-reviewers")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button
            onClick={() =>
              router.push(
                `/research/proposals/assign-reviewers/${screening.id}/assign`,
              )
            }
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Reviewers
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          {/* Proposal Header */}
          <Card className="shadow-sm border-primary/5 overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide border shadow-none",
                        submittedReviews.length === assignedReviewers.length && assignedReviewers.length > 0
                          ? "bg-green-100 text-green-700 border-green-200"
                          : submittedReviews.length > 0
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {submittedReviews.length === assignedReviewers.length && assignedReviewers.length > 0
                        ? "All Reviews Complete"
                        : assignedReviewers.length === 0
                          ? "No Reviewers Assigned"
                          : `${submittedReviews.length} of ${assignedReviewers.length} Reviews Complete`}
                    </Badge>
                    {averageScorePct != null && (
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                        averageScorePct >= 70
                          ? "bg-green-100 text-green-700 border-green-200"
                          : averageScorePct >= 50
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-rose-50 text-rose-600 border-rose-200",
                      )}>
                        <span>Average: {averageScorePct}%</span>
                        {maxPossiblePoints > 0 && averageScore != null && (
                          <span className="font-normal text-muted-foreground">
                            ({averageScore.toFixed(1)} / {maxPossiblePoints})
                          </span>
                        )}
                      </div>
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
                    {formatDate(proposal.submittedAt)}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-primary/5 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Budget
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {proposal.budgetRequested
                        ? `ETB ${proposal.budgetRequested}`
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border bg-violet-50 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Tag className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Type
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {proposal.proposalType?.name || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border bg-blue-50 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Thematic Area
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {proposal.thematicAreas?.[0]?.name || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border bg-emerald-50 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Reviews
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {submittedReviews.length} of {assignedReviewers.length}{" "}
                      completed
                    </p>
                    {averageScorePct != null && (
                      <p className={cn(
                        "text-xs font-bold mt-0.5",
                        averageScorePct >= 70 ? "text-green-600" : averageScorePct >= 50 ? "text-amber-600" : "text-rose-600",
                      )}>
                        Average: {averageScorePct}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              <TabsTrigger
                value="overview"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Team
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Review History
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ──────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Abstract
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <HtmlContentRenderer
                      content={
                        proposal.abstract || "No abstract provided."
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {proposal.keywords && proposal.keywords.length > 0 && (
                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {proposal.keywords.map((kw: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-xs"
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Team Tab ──────────────────────────────────────────────── */}
            <TabsContent value="team" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Research Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Principal Investigator */}
                  {rawProposal.principalInvestigator && (
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shrink-0 text-sm">
                        {rawProposal.principalInvestigator.firstName?.[0] ||
                          "U"}
                        {rawProposal.principalInvestigator.lastName?.[0] || ""}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          {rawProposal.principalInvestigator.firstName}{" "}
                          {rawProposal.principalInvestigator.lastName}
                        </p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          Principal Investigator
                        </p>
                        {rawProposal.principalInvestigator.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {rawProposal.principalInvestigator.email}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  {teamMembers.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Team Members
                      </p>
                      {teamMembers.map((member, index) => {
                        const name = String(
                          member.memberName ??
                            member.stakeholderName ??
                            "Unnamed member",
                        );
                        const borderColor =
                          REVIEWER_BORDER_COLORS[
                            index % REVIEWER_BORDER_COLORS.length
                          ];
                        return (
                          <div
                            key={String(member.id ?? index)}
                            className={cn(
                              "rounded-xl border-l-4 border border-border p-4 flex items-start gap-3",
                              borderColor,
                            )}
                          >
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                              {getInitials(name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {String(
                                  member.roleName ??
                                    member.memberType ??
                                    "Member",
                                )}
                              </p>
                              {member.email && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!rawProposal.principalInvestigator &&
                    teamMembers.length === 0 && (
                      <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No team information available.
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Review History Tab ────────────────────────────────────── */}
            <TabsContent value="history" className="pt-6 space-y-6">
              {/* Screening Decision */}
              {proposal.reviewHistory?.decisionRemarks && (
                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Screening Decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
                      <p className="text-sm font-medium">
                        {proposal.reviewHistory.decisionRemarks}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {proposal.reviewHistory.status || statusLabel} - {" "}
                        {formatDateTime(proposal.reviewHistory.reviewedAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technical Reviews */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Technical Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submittedReviews.length > 0 ? (
                    <div className="space-y-6">
                      {submittedReviews.map((review, index) => {
                        const categoryGroups = groupResponsesByCategory(
                          review.responses ?? [],
                        );
                        const reviewPercent =
                          review.totalScore != null && maxPossiblePoints > 0
                            ? Math.round(
                                (Number(review.totalScore) /
                                  maxPossiblePoints) *
                                  100,
                              )
                            : null;

                        return (
                          <div key={review.id ?? index} className="relative">
                            {index < submittedReviews.length - 1 && (
                              <div className="absolute left-4 top-10 h-full w-px bg-border" />
                            )}
                            <div className="flex gap-4">
                              <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="text-[10px] font-bold">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 rounded-xl border p-4 space-y-3">
                                {/* Reviewer header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7 border shrink-0">
                                      <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                                        {(review.reviewer?.fullName || "R")
                                          .split(" ")
                                          .map((w: string) => w[0])
                                          .join("")
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-semibold">
                                      {review.reviewer?.fullName || "Reviewer"}
                                    </p>
                                  </div>
                                  {reviewPercent != null && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs font-bold",
                                        reviewPercent >= 70
                                          ? "bg-green-100 text-green-700 border-green-200"
                                          : reviewPercent >= 50
                                            ? "bg-amber-50 text-amber-600 border-amber-200"
                                            : "bg-rose-50 text-rose-600 border-rose-200",
                                      )}
                                    >
                                      {reviewPercent}%
                                      {maxPossiblePoints > 0 && (
                                        <span className="text-muted-foreground font-normal ml-1">
                                          ({review.totalScore}/{maxPossiblePoints})
                                        </span>
                                      )}
                                    </Badge>
                                  )}
                                </div>

                                {/* Comments */}
                                {review.comments && (
                                  <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                                    {review.comments}
                                  </p>
                                )}

                                {/* Date */}
                                {review.createdAt && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatDateTime(review.createdAt)}
                                  </p>
                                )}

                                {/* Category-grouped responses checklist */}
                                {categoryGroups.length > 0 && (
                                  <div className="rounded-lg border border-border/60 overflow-hidden mt-2">
                                    <div className="bg-muted/30 px-3 py-2 border-b border-border/60">
                                      <div className="flex items-center gap-1.5">
                                        <ClipboardList className="h-3.5 w-3.5 text-primary" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Review Checklist ({categoryGroups.length} {categoryGroups.length === 1 ? "category" : "categories"})
                                        </p>
                                      </div>
                                    </div>
                                    {categoryGroups.map((group) => {
                                      const groupMax = group.responses.reduce(
                                        (s, r) => s + (r.question?.maxPoints ?? 0),
                                        0,
                                      );
                                      const groupEarned = group.responses.reduce(
                                        (s, r) => s + r.pointsEarned,
                                        0,
                                      );
                                      const groupPct =
                                        groupMax > 0
                                          ? Math.round((groupEarned / groupMax) * 100)
                                          : 0;

                                      return (
                                        <Collapsible key={group.id}>
                                          <CollapsibleTrigger asChild>
                                            <button
                                              type="button"
                                              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors border-b border-border/40 last:border-b-0"
                                            >
                                              <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-foreground truncate">
                                                  {group.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                  {group.responses.length} criteria · {groupEarned}/{groupMax} pts
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <Badge
                                                  variant="outline"
                                                  className={cn(
                                                    "text-[10px] font-bold",
                                                    groupPct >= 70
                                                      ? "bg-green-100 text-green-700 border-green-200"
                                                      : groupPct >= 50
                                                        ? "bg-amber-50 text-amber-600 border-amber-200"
                                                        : "bg-rose-50 text-rose-600 border-rose-200",
                                                  )}
                                                >
                                                  {groupPct}%
                                                </Badge>
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            </button>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent className="bg-background">
                                            {group.responses.map((resp) => {
                                              const maxPts = resp.question?.maxPoints ?? 0;
                                              const respPct =
                                                maxPts > 0
                                                  ? Math.round((resp.pointsEarned / maxPts) * 100)
                                                  : 0;
                                              return (
                                                <div
                                                  key={resp.id}
                                                  className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/30 last:border-b-0"
                                                >
                                                  <p className="text-xs text-foreground min-w-0 truncate flex-1">
                                                    {resp.question?.text || `Question ${resp.question?.id}`}
                                                  </p>
                                                  <Badge
                                                    variant="outline"
                                                    className={cn(
                                                      "text-[10px] font-bold shrink-0",
                                                      respPct >= 70
                                                        ? "bg-green-100 text-green-700 border-green-200"
                                                        : respPct >= 50
                                                          ? "bg-amber-50 text-amber-600 border-amber-200"
                                                          : "bg-rose-50 text-rose-600 border-rose-200",
                                                    )}
                                                  >
                                                    {resp.pointsEarned}/{maxPts}
                                                  </Badge>
                                                </div>
                                              );
                                            })}
                                          </CollapsibleContent>
                                        </Collapsible>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                      <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No technical reviews have been submitted yet.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reviews will appear here once assigned reviewers submit
                        their evaluations.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          {/* Assigned Reviewers */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Reviewers ({assignedReviewers.length})
              </CardTitle>
              {averageScorePct != null && maxPossiblePoints > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Average Score
                    </span>
                    <span className={cn(
                      "text-sm font-black",
                      averageScorePct >= 70 ? "text-green-600" : averageScorePct >= 50 ? "text-amber-600" : "text-rose-600",
                    )}>
                      {averageScorePct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        averageScorePct >= 70 ? "bg-green-500" : averageScorePct >= 50 ? "bg-amber-400" : "bg-rose-500",
                      )}
                      style={{ width: `${Math.min(averageScorePct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {averageScore?.toFixed(1)} / {maxPossiblePoints} pts · {submittedReviews.length} submitted
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {assignedReviewers.length > 0 ? (
                assignedReviewers.map((reviewer, index) => {
                  const review = reviewByReviewerId.get(reviewer.id);
                  const borderColor =
                    REVIEWER_BORDER_COLORS[
                      index % REVIEWER_BORDER_COLORS.length
                    ];
                  const hasSubmitted = Boolean(review && hasReviewContent(review));

                  return (
                    <div
                      key={reviewer.id}
                      className={cn(
                        "rounded-xl border-l-4 border p-4 space-y-2",
                        borderColor,
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <Avatar className="h-9 w-9 border shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                              {getInitials(
                                reviewer.fullName || "Reviewer",
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {reviewer.fullName || "Unknown Reviewer"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {reviewer.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {review?.totalScore != null ? (
                            <div className="text-right">
                              <p className={cn(
                                "text-lg font-black leading-none",
                                toPercent(review.totalScore) !== "—" &&
                                  parseInt(toPercent(review.totalScore)) >= 70
                                    ? "text-green-600"
                                    : parseInt(toPercent(review.totalScore)) >= 50
                                      ? "text-amber-600"
                                      : "text-rose-600",
                              )}>
                                {toPercent(review.totalScore)}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {review.totalScore}/{maxPossiblePoints || "?"}
                              </p>
                            </div>
                          ) : (
                            <p className="text-lg font-black text-muted-foreground/40 leading-none">
                              —
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {reviewer.role ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {reviewer.role}
                          </Badge>
                        ) : null}
                        <Badge
                          variant={hasSubmitted ? "secondary" : "outline"}
                          className={cn(
                            "text-[10px]",
                            hasSubmitted
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-600 border-amber-200",
                          )}
                        >
                          {hasSubmitted ? "Review Submitted" : "Pending Review"}
                        </Badge>
                      </div>
                      {review?.comments && (
                        <p className="text-xs text-muted-foreground italic border-t pt-2 line-clamp-2">
                          {review.comments}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                  <Users className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No reviewers assigned yet.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      router.push(
                        `/research/proposals/assign-reviewers/${screening.id}/assign`,
                      )
                    }
                  >
                    Assign Reviewers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {hasFiles && (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Uploaded Files
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 p-0">
                {fileEntries.map((entry) => {
                  const resolvedUrl = resolveFileUrl(entry.filePath);
                  return (
                    <button
                      key={entry.key}
                      onClick={() => {
                        if (resolvedUrl) {
                          setViewingFile({
                            name: entry.label,
                            url: resolvedUrl,
                          });
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold truncate">
                            {entry.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {entry.filePath?.split("/").pop() || "File"}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Digital Signature */}
          {hasSignature && (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="border-b bg-primary/5 py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-xl border p-3 bg-white">
                  <img
                    src={
                      resolveFileUrl(proposal.signature) ?? undefined
                    }
                    alt="Proposal signature"
                    className="h-28 w-full max-w-full object-contain rounded-lg"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Preview only
                </p>
              </CardContent>
            </Card>
          )}

          {/* Proposal Details */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DetailLine
                label="Status"
                value={statusLabel}
              />
              <Separator className="my-0.5" />
              {proposal.proposalType && (
                <>
                  <DetailLine
                    label="Type"
                    value={proposal.proposalType.name}
                  />
                  <Separator className="my-0.5" />
                </>
              )}
              {proposal.thematicAreas?.[0]?.name && (
                <>
                  <DetailLine
                    label="Thematic Area"
                    value={proposal.thematicAreas[0].name}
                  />
                  <Separator className="my-0.5" />
                </>
              )}
              {proposal.version && (
                <>
                  <DetailLine
                    label="Version"
                    value={`v${proposal.version}`}
                  />
                  <Separator className="my-0.5" />
                </>
              )}
              <DetailLine
                label="Resubmissions"
                value={String(proposal.resubmissionCount ?? 0)}
              />
              <Separator className="my-0.5" />
              <div className="flex items-center gap-2.5 text-muted-foreground pt-2">
                <Clock className="h-4 w-4 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-foreground uppercase tracking-tighter text-[9px]">
                    Submitted Date
                  </p>
                  <p className="font-medium">
                    {formatDate(proposal.submittedAt)}
                  </p>
                </div>
              </div>
              {proposal.startDate && proposal.endDate && (
                <div className="flex items-center gap-2.5 text-muted-foreground pt-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-foreground uppercase tracking-tighter text-[9px]">
                      Project Period
                    </p>
                    <p className="font-medium">
                      {new Date(proposal.startDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                      {" \u2014 "}
                      {new Date(proposal.endDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Institutional Context */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-primary/5 py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Institutional Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.Organization?.name || "No organization"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Organization
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <Layers className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.Unit?.name || "No unit"}
                  </p>
                  <p className="text-xs text-muted-foreground">Unit</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <MapPin className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.receivingOffice?.name ||
                      "No receiving office"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receiving Office
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submitted By */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-primary/5 py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submitted By
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {proposal.createdBy
                    ? getInitials(
                        [
                          proposal.createdBy.firstName,
                          proposal.createdBy.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "U",
                      )
                    : "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.createdBy
                      ? [
                          proposal.createdBy.firstName,
                          proposal.createdBy.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Unknown"
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
        </aside>
      </div>

      {/* ── File Preview Dialog ─────────────────────────────────────────────── */}
      <PdfViewerDialog
        isOpen={!!viewingFile}
        onOpenChange={(open) => {
          if (!open) setViewingFile(null);
        }}
        url={viewingFile?.url ?? ""}
        title={viewingFile?.name ?? "Document preview"}
      />
    </PageContainer>
  );
}
