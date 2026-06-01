"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFundingRecommendation } from "@/hooks";
import { useFundingRecommendationDocumentDownload } from "@/hooks/useFundingRecommendationDocumentDownload";
import { fundingRecommendationsService } from "@/api/services/funding-recommendations.service";
import type { FundingRecommendationPi } from "@/types/funding-recommendation";

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function piName(pi?: FundingRecommendationPi | string | null) {
  if (!pi) return "-";
  if (typeof pi === "string") return pi;
  return pi.full_name || pi.fullName || pi.email || "-";
}

export default function FundingRecommendationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const routeId = params.id;
  const recommendationId = Array.isArray(routeId) ? routeId[0] : routeId;

  const { download, active } = useFundingRecommendationDocumentDownload();

  const {
    data: recommendation,
    isLoading,
    isError,
    refetch,
  } = useFundingRecommendation(recommendationId);

  const fundingDecisionId =
    recommendation?.ready_for_funding_id ?? recommendation?.proposal;

  const { data: contextData } = useQuery({
    queryKey: ["funding-recommendation", "context", fundingDecisionId ?? ""],
    queryFn: () =>
      fundingRecommendationsService.listCandidates({
        limit: 1,
        funding_decision_id: fundingDecisionId,
      }),
    enabled: Boolean(fundingDecisionId),
  });

  const context = (contextData?.data?.[0] ?? null) as Record<string, any> | null;

  const proposalTitle =
    recommendation?.proposal_title ||
    recommendation?.proposalTitle ||
    context?.proposalTitle ||
    context?.proposal_title ||
    "Untitled Proposal";

  const referenceNumber =
    recommendation?.reference_number ||
    recommendation?.referenceNumber ||
    context?.referenceNumber ||
    context?.reference_number ||
    `FR-${recommendation?.id}`;

  const requestedAmount =
    recommendation?.budgetRequested ??
    recommendation?.budget_requested ??
    context?.budgetRequested ??
    context?.budget_requested ??
    null;

  const principalInvestigator =
    recommendation?.pi ||
    context?.principalInvestigator ||
    context?.principal_investigator ||
    context?.pi ||
    null;

  const screeningStatus =
    recommendation?.screening_status ||
    context?.status ||
    context?.proposal_status ||
    null;

  const fundingDecisionStatus =
    recommendation?.funding_decision_status ||
    context?.fundingDecisionStatus ||
    context?.funding_decision_status ||
    "pending";

  if (isLoading) {
    return (
      <PageContainer title="Loading Details...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Fetching recommendation details...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !recommendation) {
    return (
      <PageContainer title="Error Loading Details">
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm max-w-2xl mx-auto my-12">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Unable to load funding recommendation.</p>
              <p className="text-sm text-muted-foreground">
                The record could not be retrieved from the server. It may have been deleted or the ID is invalid.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => router.push("/research/funding-recommendations")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button onClick={() => void refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Funding Recommendation"
      description={`Record ID: FR-${recommendation.id}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={active !== null}
            onClick={() =>
              void download("award", { recommendation, context })
            }
          >
            {active === "award" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Award className="mr-2 h-4 w-4" />
            )}
            Award Generation
          </Button>
          <Button
            variant="outline"
            disabled={active !== null}
            onClick={() =>
              void download("agreement", { recommendation, context })
            }
          >
            {active === "agreement" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="mr-2 h-4 w-4" />
            )}
            Agreement
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/research/funding-recommendations")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>
      }
    >
      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Header Title Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-3">
                <Badge className="bg-primary/10 text-primary border border-primary/20 uppercase text-[9px] font-bold">
                  Award Recommendation
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Recommended: {formatDate(recommendation.recommended_at)}</span>
                </div>
              </div>
              <CardTitle className="mt-3 text-2xl font-extrabold text-slate-900 leading-snug">
                {proposalTitle}
              </CardTitle>
              <p className="text-sm font-bold text-primary mt-1">
                Ref: {referenceNumber}
              </p>
            </CardHeader>
          </Card>

          {/* Award Breakdown Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex gap-2 items-center text-base font-bold">
                <Award className="h-5 w-5 text-emerald-600" />
                Award Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Requested vs Awarded Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 bg-slate-50 border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Budget Requested
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-2">
                    {formatCurrency(requestedAmount)}
                  </span>
                </div>

                <div className="rounded-xl border p-4 bg-emerald-50/20 border-emerald-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                    Total Awarded
                  </span>
                  <span className="text-2xl font-black text-emerald-700 block mt-2">
                    {formatCurrency(recommendation.total_award_amount)}
                  </span>
                </div>
              </div>

              {/* Funding Gap Card */}
              {requestedAmount && recommendation.total_award_amount ? (
                <div className="rounded-xl border p-4 bg-slate-100/30 border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Funded Percentage
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-black text-slate-800">
                      {(
                        ((Number(recommendation.total_award_amount) || 0) /
                          (Number(requestedAmount) || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                    <div
                      className="h-2 flex-1 ml-4 bg-slate-200 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(
                        ((Number(recommendation.total_award_amount) || 0) /
                          (Number(requestedAmount) || 1)) *
                          100,
                      )}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${
                            ((Number(recommendation.total_award_amount) || 0) /
                              (Number(requestedAmount) || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Amount in English Words
                </span>
                <p className="text-sm font-semibold text-slate-800 bg-slate-50 border p-3 rounded-xl capitalize">
                  {recommendation.amount_english_in_words || "No amount words recorded."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Committee Remarks Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex gap-2 items-center text-base font-bold">
                <FileText className="h-5 w-5 text-blue-600" />
                Recommendation Remarks / Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/50 border p-4 rounded-xl">
                {recommendation.comments || "No comments or remarks recorded for this recommendation."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information Panel */}
        <aside className="space-y-6">
          {/* Metadata Checklists */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Governance & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              {/* Proposal Link ID */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Ready For Funding ID</span>
                <Badge variant="outline" className="font-bold border-slate-300">
                  {recommendation.ready_for_funding_id || recommendation.proposal}
                </Badge>
              </div>

              {/* Ethics Badge */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Ethics Approved</span>
                <Badge
                  className={recommendation.has_ethical_clearance_approval
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                  }
                >
                  {recommendation.has_ethical_clearance_approval ? (
                    <>
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      Approved
                    </>
                  ) : (
                    "Not marked"
                  )}
                </Badge>
              </div>

              {/* Funding Decision Status */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Funding Decision</span>
                <Badge
                  className={fundingDecisionStatus === "approved"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : fundingDecisionStatus === "rejected"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {fundingDecisionStatus === "approved" ? (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  ) : fundingDecisionStatus === "rejected" ? (
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                  ) : null}
                  <span className="capitalize">{fundingDecisionStatus || "pending"}</span>
                </Badge>
              </div>

              {/* Screening status */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Screening Status</span>
                <span className="font-semibold text-slate-800 capitalize text-xs">
                  {screeningStatus?.replace(/_/g, " ") || "-"}
                </span>
              </div>

              {/* Terminal report status */}
              {recommendation.terminal_report_status && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-medium">Terminal Report</span>
                  <span className="font-semibold text-slate-800 capitalize text-xs">
                    {recommendation.terminal_report_status.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PI Info Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Principal Investigator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="flex gap-3 items-center">
                <div className="rounded-full bg-slate-100 p-2.5 text-slate-600">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {piName(principalInvestigator)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {typeof principalInvestigator === "object" && principalInvestigator?.email
                      ? principalInvestigator.email
                      : "-"}
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