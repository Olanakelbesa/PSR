"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Users,
} from "lucide-react";

import { proposalsApi } from "@/api/client";
import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

type ProposalReview = {
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
  strategicObjectives?: NamedEntity[] | null;
  receivingOffice?: NamedEntity | null;
  call?: ProposalCall | null;
  Organization?: NamedEntity | null;
  Unit?: NamedEntity | null;
  submittedAt?: string | null;
  proposalType?: NamedEntity | null;
  subThematicArea?: NamedEntity | null;
  createdBy?: ProposalCreatedBy | null;
  teamMembers?: ProposalTeamMember[] | null;
  reviewHistory?: ProposalReview[] | null;
  status?: string | null;
  createdAt?: string | null;
  rejectionReason?: string | null;
};

const statusStyles: Record<string, string> = {
  draft:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
  submitted:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  under_review:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  revision_requested:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  approved:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  rejected:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
};

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

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
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
          setProposal(response.data as ProposalDetail);
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
  const statusLabel = currentStatus.replace(/_/g, " ");
  const isEditable =
    !proposal?.submittedAt || currentStatus === "revision_requested";
  const teamMembers = proposal?.teamMembers ?? [];
  const internalTeam = teamMembers.filter(
    (member) => member.memberType === "internal",
  );
  const externalTeam = teamMembers.filter(
    (member) => member.memberType === "external",
  );

  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Fetching proposal details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (hasError || !proposal) {
    return (
      <PageContainer title="Proposal Not Found">
        <div className="h-96 flex flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <p className="font-bold text-lg">Unable to load this proposal</p>
          <p className="text-sm text-muted-foreground max-w-md">
            The detail record could not be retrieved from the proposals API.
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
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
        <div className="flex items-center gap-2">
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
                Edit
              </Link>
            </Button>
          )}
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
                        statusStyles[currentStatus] || statusStyles.draft,
                      )}
                    >
                      {statusLabel}
                    </Badge>
                    {proposal.submittedAt && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                      >
                        Submitted
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl md:text-2xl leading-tight">
                    {proposal.title || "Untitled Proposal"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground max-w-3xl">
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
              {proposal.rejectionReason && currentStatus === "rejected" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-rose-800">
                  <p className="text-sm font-bold">Rejection feedback</p>
                  <p className="mt-1 text-sm italic">
                    {proposal.rejectionReason}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    Thematic Areas
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {proposal.thematicAreas?.length
                      ? `${proposal.thematicAreas.length} linked`
                      : "None"}
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
                    Created On
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
              </div>

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
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Research Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Sub-Thematic Area
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {proposal.subThematicArea?.name || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Thematic Areas
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {proposal.thematicAreas?.length ? (
                      proposal.thematicAreas.map((area) => (
                        <Badge key={area.id} variant="outline">
                          {area.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No thematic areas linked.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Strategic Objectives
                  </p>
                  {proposal.strategicObjectives?.length ? (
                    <ul className="mt-2 space-y-2">
                      {proposal.strategicObjectives.map((objective) => (
                        <li
                          key={objective.id}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{objective.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No strategic objectives linked.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Team Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-muted/20 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Internal
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {internalTeam.length}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      External
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {externalTeam.length}
                    </p>
                  </div>
                </div>

                {teamMembers.length ? (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {member.memberName ||
                                member.stakeholderName ||
                                "Unnamed member"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.roleName ||
                                `Role ${member.role ?? "N/A"}`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {member.memberType}
                          </Badge>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                          {member.memberEmail && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4 shrink-0" />
                              <span className="break-all">
                                {member.memberEmail}
                              </span>
                            </div>
                          )}
                          {member.phoneNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <ExternalLink className="h-4 w-4 shrink-0" />
                              <span>{member.phoneNumber}</span>
                            </div>
                          )}
                          {member.organizationName && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4 shrink-0" />
                              <span>{member.organizationName}</span>
                            </div>
                          )}
                          {member.position && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>{member.position}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No team members linked yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Review History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposal.reviewHistory?.length ? (
                <div className="space-y-4">
                  {proposal.reviewHistory.map((review) => (
                    <div key={review.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {review.reviewer?.name || "Reviewer"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(review.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {review.recommendation || "pending"}
                        </Badge>
                      </div>

                      {review.comments && (
                        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                          {review.comments}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No review history available yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DetailLine label="Proposal ID" value={String(proposal.id)} />
              <DetailLine label="Status" value={statusLabel} />
              <DetailLine
                label="Submitted"
                value={proposal.submittedAt ? "Yes" : "No"}
              />
              <DetailLine
                label="Created"
                value={formatDateTime(proposal.createdAt)}
              />
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
                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.call?.title || "No call assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Grant call</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <Building2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.Organization?.name || "No organization assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Organization</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <Layers className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.Unit?.name || "No unit assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Unit</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-dashed pt-4">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {proposal.receivingOffice?.name ||
                      "No receiving office assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receiving office
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Created By
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
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
                  <p className="text-xs text-muted-foreground">
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
