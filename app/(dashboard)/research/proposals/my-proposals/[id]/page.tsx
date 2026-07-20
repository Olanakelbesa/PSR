"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Layers,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";

import { proposalsApi } from "@/api/client";
import { PageContainer } from "@/components/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

type NamedEntity = {
  id: number;
  name: string;
};

type ProposalCall = {
  id: number;
  title: string;
};

type ProposalCreatedBy = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
};

type ProposalTeamMember = {
  id: number;
  memberType: "internal" | "external" | string;
  userType?: string | null;
  organizationName?: string | null;
  stakeholderName?: string | null;
  position?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  member?: number | null;
  memberName?: string | null;
  memberEmail?: string | null;
  role?: number | null;
  roleName?: string | null;
};

type ProposalTechnicalReview = {
  id: number;
  reviewer?: {
    id?: number;
    fullName?: string | null;
    email?: string | null;
    photoUrl?: string | null;
  } | null;
  comments?: string | null;
  totalScore?: number | null;
  attachment?: string | null;
  createdAt?: string | null;
};

type ProposalReviewHistory = {
  status?: string | null;
  decisionRemarks?: string | null;
  reviewedAt?: string | null;
  technicalReviews?: ProposalTechnicalReview[] | null;
};

type ProposalReviewEvent = {
  id: number;
  recommendation?: string | null;
  comments?: string | null;
  createdAt?: string | null;
  reviewer?: {
    name?: string | null;
  } | null;
};

type ProposalDetail = {
  id: number;
  title: string;
  abstract?: string | null;
  keywords?: string[] | null;
  thematicAreas?: NamedEntity[] | null;
  receivingOffice?: NamedEntity | null;
  call?: ProposalCall | null;
  Organization?: NamedEntity | null;
  Unit?: NamedEntity | null;
  submittedAt?: string | null;
  proposalType?: NamedEntity | null;
  subThematicArea?: NamedEntity | null;
  createdBy?: ProposalCreatedBy | null;
  teamMembers?: ProposalTeamMember[] | null;
  reviewHistory?: ProposalReviewHistory | ProposalReviewEvent[] | null;
  status?: string | null;
  statusDisplay?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetRequested?: string | null;
  proposalFile?: string | null;
  updatedProposal?: string | null;
  supportingDocs?: string | null;
  signature?: string | null;
  createdAt?: string | null;
  rejectionReason?: string | null;
};

const statusStyles: Record<string, string> = {
  draft:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
  submitted:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  resubmitted:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  under_review:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  revision_requested:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  approved:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  rejected:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  screening_rejected:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  revision_required:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  protocol_stage:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  funding_recommendation:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
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
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
  }).format(date);
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "N/A";
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

function isReviewHistoryObject(
  value?: ProposalReviewHistory | ProposalReviewEvent[] | null,
): value is ProposalReviewHistory {
  return (
    !!value &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    ("technicalReviews" in value ||
      "status" in value ||
      "decisionRemarks" in value ||
      "reviewedAt" in value)
  );
}

function getReviewHistoryEvents(
  reviewHistory?: ProposalReviewHistory | ProposalReviewEvent[] | null,
): ProposalReviewEvent[] {
  if (Array.isArray(reviewHistory)) return reviewHistory;
  return reviewHistory?.technicalReviews ?? [];
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function SkeletonLoading() {
  return (
    <PageContainer title=" ">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </PageContainer>
  );
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = useMemo(() => {
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    return rawId ? String(rawId) : "";
  }, [params.id]);

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!proposalId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProposal() {
      try {
        const response = await proposalsApi.getById(proposalId);
        if (!isMounted) return;

        if (response?.success && response?.data) {
          const proposalData = response.data as ProposalDetail;
          setProposal(proposalData);
          setHasError(false);
        } else {
          setProposal(null);
          setHasError(true);
          toast.error(response?.message || "Failed to load proposal details");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading proposal:", error);
        setProposal(null);
        setHasError(true);
        toast.error("Failed to load proposal details");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProposal();

    return () => {
      isMounted = false;
    };
  }, [proposalId]);

  const currentStatus =
    proposal?.status ?? (proposal?.submittedAt ? "submitted" : "draft");
  const statusKey = normalizeStatusKey(currentStatus);
  const statusLabel =
    proposal?.statusDisplay ?? currentStatus.replace(/_/g, " ");
  const isScreeningRejected = statusKey === "screening_rejected";
  const isRevisionRequired = statusKey === "revision_required";
  const isProtocolStage = statusKey === "protocol_stage";
  const isResubmittable = isScreeningRejected || isRevisionRequired;
  const isDraft = statusKey === "draft" && !proposal?.submittedAt;
  const isEditable = isDraft || isProtocolStage;
  const teamMembers = proposal?.teamMembers ?? [];
  const internalTeam = teamMembers.filter(
    (member) => member.memberType === "internal",
  );
  const externalTeam = teamMembers.filter(
    (member) => member.memberType === "external",
  );
  const reviewHistoryObject =
    proposal && isReviewHistoryObject(proposal.reviewHistory)
      ? proposal.reviewHistory
      : undefined;
  const reviewHistoryEvents = getReviewHistoryEvents(proposal?.reviewHistory);
  const rejectionFeedback =
    proposal?.rejectionReason || reviewHistoryObject?.decisionRemarks || null;

  if (isLoading) {
    return <SkeletonLoading />;
  }

  if (hasError || !proposal) {
    return (
      <PageContainer title="Proposal Not Found">
        <div className="h-96 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-lg">Unable to load this proposal</p>
            <p className="text-sm text-muted-foreground max-w-md">
              The detail record could not be retrieved from the proposals API.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={proposal.title || "Untitled Proposal"}
      description={`Proposal ID: ${proposal.id} · ${proposal.call?.title || "No call assigned"}`}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-9"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isEditable && (
            <Button asChild className="h-9 bg-primary hover:bg-primary/90">
              <Link
                href={`/research/proposals/my-proposals/${proposal.id}/edit`}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isProtocolStage ? "Edit Proposal Details" : "Edit"}
              </Link>
            </Button>
          )}

          {isResubmittable && (
            <Button asChild className="h-9 bg-amber-600 hover:bg-amber-700">
              <Link
                href={`/research/proposals/my-proposals/${proposal.id}/edit?mode=resubmit`}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resubmit Proposal
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="shadow-sm border-primary/5 overflow-hidden">
            <CardHeader className="border-b bg-primary/5 pb-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "border px-2.5 py-1 text-[11px] capitalize font-bold shadow-none",
                      statusStyles[statusKey] ||
                        statusStyles[currentStatus] ||
                        statusStyles.draft,
                    )}
                  >
                    {statusLabel}
                  </Badge>
                  {proposal.submittedAt && (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 text-[11px]"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Submitted
                    </Badge>
                  )}
                  {proposal.proposalType?.name && (
                    <Badge variant="secondary" className="text-[11px]">
                      {proposal.proposalType.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl md:text-2xl leading-tight">
                  {proposal.title || "Untitled Proposal"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {proposal.call?.title && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {proposal.call.title}
                    </span>
                  )}
                  {proposal.submittedAt && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Submitted {formatDateTime(proposal.submittedAt)}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {rejectionFeedback && isResubmittable && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                  <p className="text-sm font-bold">Screening feedback</p>
                  <p className="mt-1 text-sm italic">{rejectionFeedback}</p>
                  <p className="mt-3 text-xs text-rose-700/80 dark:text-rose-300/80">
                    Update your proposal and resubmit it for screening review.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    Team Members
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {teamMembers.length} total
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Budget
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {proposal.budgetRequested
                      ? `ETB ${proposal.budgetRequested}`
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Created On
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview">
                <TabsList className="h-10 bg-muted/60 rounded-lg p-1 w-full">
                  <TabsTrigger value="overview" className="text-xs">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="team" className="text-xs">
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    Team ({teamMembers.length})
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs">
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    Reviews ({reviewHistoryEvents.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h2 className="text-base font-bold">Abstract</h2>
                    </div>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
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
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="bg-muted/70"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="team" className="mt-6 space-y-6">
                  {teamMembers.length ? (
                    <>
                      {internalTeam.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            Members ({internalTeam.length})
                          </h3>
                          <div className="space-y-3">
                            {internalTeam.map((member) => (
                              <div
                                key={member.id}
                                className="rounded-xl border border-l-4 border-l-blue-500 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 mt-0.5">
                                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                        {getInitials(
                                          member.memberName?.split(" ")[0],
                                          member.memberName?.split(" ")[1],
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-semibold">
                                        {member.memberName || "Unnamed member"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {member.roleName ||
                                          `Role ${member.role ?? "N/A"}`}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="capitalize text-[10px]"
                                  >
                                    {member.memberType}
                                  </Badge>
                                </div>
                                <div className="mt-3 ml-13 grid gap-2 text-sm sm:grid-cols-2">
                                  {member.memberEmail && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="break-all text-xs">
                                        {member.memberEmail}
                                      </span>
                                    </div>
                                  )}
                                  {member.phoneNumber && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span className="text-xs">
                                        {member.phoneNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {externalTeam.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            External Stakeholders ({externalTeam.length})
                          </h3>
                          <div className="space-y-3">
                            {externalTeam.map((member) => (
                              <div
                                key={member.id}
                                className="rounded-xl border border-l-4 border-l-emerald-500 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 mt-0.5">
                                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                                        {getInitials(
                                          member.stakeholderName?.split(" ")[0],
                                          member.stakeholderName?.split(" ")[1],
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-semibold">
                                        {member.stakeholderName ||
                                          "Unnamed stakeholder"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {member.roleName ||
                                          `Role ${member.role ?? "N/A"}`}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="capitalize text-[10px]"
                                  >
                                    {member.memberType}
                                  </Badge>
                                </div>
                                <div className="mt-3 ml-13 grid gap-2 text-sm sm:grid-cols-2">
                                  {member.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="break-all text-xs">
                                        {member.email}
                                      </span>
                                    </div>
                                  )}
                                  {member.phoneNumber && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span className="text-xs">
                                        {member.phoneNumber}
                                      </span>
                                    </div>
                                  )}
                                  {member.organizationName && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                                      <span className="text-xs">
                                        {member.organizationName}
                                      </span>
                                    </div>
                                  )}
                                  {member.position && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                                      <span className="text-xs">
                                        {member.position}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No team members added yet.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  {reviewHistoryObject || reviewHistoryEvents.length ? (
                    <div className="space-y-4">
                      {reviewHistoryObject ? (
                        <div className="rounded-xl border bg-muted/10 p-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <DetailLine
                              label="Review Status"
                              value={reviewHistoryObject.status || "N/A"}
                            />
                            <DetailLine
                              label="Reviewed At"
                              value={formatDateTime(
                                reviewHistoryObject.reviewedAt,
                              )}
                            />
                            <DetailLine
                              label="Decision Remarks"
                              value={
                                reviewHistoryObject.decisionRemarks || "None"
                              }
                            />
                          </div>
                        </div>
                      ) : null}
                      {reviewHistoryEvents.length ? (
                        <div className="space-y-0">
                          {reviewHistoryEvents.map((review, idx) => (
                            <div key={review.id || idx} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className={cn(
                                    "w-3 h-3 rounded-full mt-1.5",
                                    review.recommendation?.includes("approved")
                                      ? "bg-emerald-500"
                                      : review.recommendation?.includes(
                                            "rejected",
                                          )
                                        ? "bg-rose-500"
                                        : "bg-primary",
                                  )}
                                />
                                {idx < reviewHistoryEvents.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-6">
                                <div className="rounded-xl border bg-card p-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-foreground capitalize">
                                        {review.recommendation?.replace(
                                          /_/g,
                                          " ",
                                        ) ||
                                          review.comments?.split("\n")[0] ||
                                          "Event"}
                                      </p>
                                      {review.reviewer?.name && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          by {review.reviewer.name}
                                        </p>
                                      )}
                                      {review.comments && (
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                          {review.comments}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                      {formatDate(review.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                          <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            No technical reviews available.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                      <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No review history available yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          {/* Proposal Metadata */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-primary/5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DetailLine label="Status" value={statusLabel} />
              <Separator className="my-1" />
              <DetailLine
                label="Submitted"
                value={proposal.submittedAt ? "Yes" : "No"}
              />
              <Separator className="my-1" />
              <DetailLine
                label="Start Date"
                value={formatDate(proposal.startDate)}
              />
              <Separator className="my-1" />
              <DetailLine
                label="End Date"
                value={formatDate(proposal.endDate)}
              />
              <Separator className="my-1" />
              <DetailLine
                label="Budget"
                value={
                  proposal.budgetRequested
                    ? `ETB ${proposal.budgetRequested}`
                    : "Not set"
                }
              />
              {proposal.subThematicArea?.name && (
                <>
                  <Separator className="my-1" />
                  <DetailLine
                    label="Sub-Thematic Area"
                    value={proposal.subThematicArea.name}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Institutional Context */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-primary/5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Institutional Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {proposal.call?.title || "No call assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Grant call</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {proposal.Organization?.name ||
                      "No organization assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Organization
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {proposal.Unit?.name || "No unit assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Unit</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {proposal.receivingOffice?.name ||
                      "No receiving office assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted To
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files & Signature */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-primary/5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Files & Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {proposal.proposalFile ? (
                <a
                  href={resolveFileUrl(proposal.proposalFile) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      Proposal Document
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ) : null}
              {proposal.updatedProposal ? (
                <a
                  href={resolveFileUrl(proposal.updatedProposal) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-90/30">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      Updated Proposal
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ) : null}
              {proposal.supportingDocs ? (
                <a
                  href={resolveFileUrl(proposal.supportingDocs) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-90/30">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      Supporting Documents
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ) : null}
              {proposal.signature ? (
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Digital Signature
                  </p>
                  <img
                    src={resolveFileUrl(proposal.signature) ?? undefined}
                    alt="Proposal signature"
                    className="mt-2 h-28 w-full max-w-full object-contain rounded-lg border bg-white"
                  />
                </div>
              ) : null}
              {!proposal.proposalFile &&
              !proposal.updatedProposal &&
              !proposal.supportingDocs &&
              !proposal.signature ? (
                <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                  <FileText className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    No files available.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Created By */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-primary/5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Created By
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {proposal.createdBy
                      ? getInitials(
                          proposal.createdBy.firstName,
                          proposal.createdBy.lastName,
                        )
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {proposal.createdBy
                      ? formatName(
                          proposal.createdBy.firstName,
                          proposal.createdBy.lastName,
                        )
                      : "Unknown creator"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {proposal.createdBy?.email || "No email available"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
