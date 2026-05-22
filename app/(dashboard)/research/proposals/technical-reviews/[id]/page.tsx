"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  Wallet,
  ClipboardList,
  ChevronRight,
  CalendarClock,
  BadgeCheck,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import {
  getIndividualReviewById,
  type IndividualReviewDetail,
} from "@/api/services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { THEMATIC_AREAS } from "@/lib/constants";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TechnicalReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [review, setReview] = useState<IndividualReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReview() {
      try {
        const response = await getIndividualReviewById(id as string);
        setReview(response);
      } catch (error) {
        console.error("Error loading individual review:", error);
        toast.error("Failed to load technical review details");
        router.push("/research/proposals/technical-reviews");
      } finally {
        setIsLoading(false);
      }
    }

    loadReview();
  }, [id, router]);

  const proposal = review?.screening?.proposal;

  const statusColors: Record<string, string> = {
    screening_under_review: "bg-amber-100 text-amber-700 border-amber-200",
    screening_approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    screening_rejected: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const reviewBadge =
    review?.reviewStatus === "reviewed"
      ? {
          label: "Reviewed",
          variant: "secondary" as const,
          icon: CheckCircle2,
        }
      : {
          label: "Pending Review",
          variant: "outline" as const,
          icon: Clock,
        };

  const proposalReference =
    proposal?.referenceNumber || `PRP-${proposal?.id ?? id}`;
  const proposalTitle = proposal?.title || "Untitled Proposal";
  const proposalStatus =
    proposal?.status || review?.screening?.status || "screening_under_review";
  const thematicArea = proposal?.thematicAreas?.[0]?.name || "Unspecified Area";
  const organizationName = proposal?.Organization?.name || "—";
  const unitName = proposal?.Unit?.name || "—";
  const callTitle = proposal?.call?.title || "—";
  const submittedAt =
    proposal?.submittedAt || review?.screening?.createdAt || null;
  const principalInvestigator = proposal?.createdBy
    ? [proposal.createdBy.firstName, proposal.createdBy.lastName]
        .filter(Boolean)
        .join(" ") ||
      proposal.createdBy.email ||
      "—"
    : "—";
  const responses = review?.responses || [];
  const thematicAreaLabel =
    THEMATIC_AREAS.find(
      (area) => area.value === proposal?.thematicAreas?.[0]?.name,
    )?.label || thematicArea;

  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Fetching individual review details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!review || !proposal) {
    return (
      <PageContainer
        title="Review Not Found"
        description="The requested individual review could not be found."
      >
        <Button
          onClick={() => router.push("/research/proposals/technical-reviews")}
        >
          Back to List
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={proposalTitle}
      description={`Reference: ${proposalReference}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/technical-reviews")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href={`/research/proposals/technical-reviews/${id}/review`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Open Review Form
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              <TabsTrigger
                value="overview"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Review Overview
              </TabsTrigger>
              <TabsTrigger
                value="screening"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Screening Decision
              </TabsTrigger>
              <TabsTrigger
                value="responses"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Review Responses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5 bg-primary/[0.02]">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold"
                      >
                        {proposalReference}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold uppercase border",
                          statusColors[proposalStatus] ||
                            statusColors.screening_under_review,
                        )}
                      >
                        {proposalStatus.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant={reviewBadge.variant}
                        className="text-[10px] font-bold uppercase gap-1.5"
                      >
                        <reviewBadge.icon className="h-3 w-3" />
                        {reviewBadge.label}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs tracking-widest text-muted-foreground mb-1">
                        Proposal Title
                      </p>
                      <h3 className="text-lg font-bold leading-tight text-primary">
                        {proposalTitle}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-primary/5">
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">
                          Principal Investigator
                        </p>
                        <p className="text-sm font-bold">
                          {principalInvestigator}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">
                          Total Score
                        </p>
                        <p className="text-sm font-bold">{review.totalScore}</p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">
                          Review Status
                        </p>
                        <p className="text-sm font-bold capitalize">
                          {review.reviewStatus.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Abstract & Proposal Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-2">
                      Short Abstract
                    </h4>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <HtmlContentRenderer
                        content={proposal.shortAbstract || ""}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-dashed">
                    <h4 className="text-sm font-bold text-foreground mb-2">
                      Proposal Summary
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {callTitle} · {thematicArea}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="screening" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">
                      Screening Decision
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Screening ID
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {review.screening.id}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Submitted Date
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {formatDateTime(submittedAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Organization
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {organizationName}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Unit
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {unitName}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed bg-muted/30 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      Decision Remarks
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {review.screening.decisionRemarks ||
                        "No screening remarks provided."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responses" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">
                        Review Responses
                      </CardTitle>
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-bold">
                      {responses.length} response
                      {responses.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {responses.length > 0 ? (
                    responses.map((response) => (
                      <div
                        key={response.id}
                        className="rounded-xl border border-border bg-card p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-foreground">
                            {response.question?.text ||
                              `Question ${response.question_id ?? response.id}`}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold"
                          >
                            {response.points_earned} /{" "}
                            {response.question?.maxPoints ?? 0}
                          </Badge>
                        </div>
                        {response.question?.category?.name && (
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {response.question.category.name}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                      <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-bold text-muted-foreground">
                        No Review Responses Yet
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        This individual review has not recorded scored responses
                        yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Review Status</span>
                <Badge
                  variant={reviewBadge.variant}
                  className="gap-1.5 px-3 py-1 border shadow-none uppercase text-[10px] font-bold"
                >
                  <reviewBadge.icon className="h-3 w-3" />
                  {reviewBadge.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proposal Status</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-bold uppercase text-[10px]",
                    statusColors[proposalStatus] ||
                      statusColors.screening_under_review,
                  )}
                >
                  {proposalStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Count</span>
                <span className="text-sm font-bold text-foreground">
                  {responses.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Score</span>
                <span className="text-sm font-bold text-foreground">
                  {review.totalScore}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  <div className="text-xs">
                    <p className="font-bold text-foreground uppercase tracking-tighter text-[9px]">
                      Submitted Date
                    </p>
                    <p className="font-medium">{formatDate(submittedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {organizationName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Primary Institution
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {principalInvestigator}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Principal Investigator
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {thematicAreaLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Thematic Area
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 p-0">
              {review.attachment ? (
                <a
                  href={review.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Paperclip className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold truncate max-w-[140px]">
                        Review Attachment
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Open attached file
                      </p>
                    </div>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  No attachment uploaded
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
