"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileCheck2,
  FileText,
  Loader2,
  Mail,
  ShieldCheck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
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
  if (!pi) return "Principal Investigator";
  if (typeof pi === "string") return pi;
  return pi.full_name || pi.fullName || pi.email || "Principal Investigator";
}

export default function FundingRecommendationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

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
    recommendation?.readyForFundingId ?? recommendation?.ready_for_funding_id ?? recommendation?.proposal;

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

  const totalAwardAmount =
    recommendation?.totalAwardAmount ?? recommendation?.total_award_amount ?? null;

  const principalInvestigator =
    recommendation?.pi ||
    context?.principalInvestigator ||
    context?.principal_investigator ||
    context?.pi ||
    null;

  const piEmail =
    principalInvestigator && typeof principalInvestigator === "object"
      ? principalInvestigator.email ?? null
      : null;

  const rawPhoto =
    principalInvestigator && typeof principalInvestigator === "object"
      ? principalInvestigator.photo ||
      principalInvestigator.photo_url ||
      principalInvestigator.photoUrl ||
      null
      : null;
  const piAvatar = resolveFileUrl(rawPhoto);
  const initials = piName(principalInvestigator)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  const hasEthicsApproval = Boolean(
    recommendation?.hasEthicalClearanceApproval ??
    recommendation?.has_ethical_clearance_approval,
  );

  const handleCopyRef = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!referenceNumber) return;
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state skeleton matching standard architecture
  if (isLoading) {
    return (
      <PageContainer title="Loading Recommendation Details...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (isError || !recommendation) {
    return (
      <PageContainer
        title="Funding Recommendation Unavailable"
        description="The requested recommendation record could not be retrieved."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/research/funding-recommendations")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        }
      >
        <Card className="border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs max-w-xl mx-auto my-12 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-rose-100 dark:bg-rose-900/40 p-3 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold">Unable to load funding recommendation.</p>
              <p className="text-xs text-muted-foreground">
                The record could not be retrieved from the server. It may have been modified or deleted.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/research/funding-recommendations")}
                className="gap-2 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to List
              </Button>
              <Button size="sm" onClick={() => void refetch()} className="gap-2 text-xs">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Percentage calculation
  const fundedPercent =
    requestedAmount && totalAwardAmount
      ? ((Number(totalAwardAmount) / Number(requestedAmount)) * 100).toFixed(1)
      : null;

  return (
    <PageContainer
      title={proposalTitle}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{referenceNumber}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
          <span className="text-muted-foreground/40">•</span>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase">
            Award Recommendation
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/research/funding-recommendations")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <Button
            size="sm"
            disabled={active !== null}
            onClick={() => void download("award", { recommendation, context })}
            className="gap-2 font-semibold shadow-xs"
          >
            {active === "award" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            Award Generation
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={active !== null}
            onClick={() => void download("agreement", { recommendation, context })}
            className="gap-2 font-semibold shadow-xs"
          >
            {active === "agreement" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="h-4 w-4" />
            )}
            Agreement
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* Main Content Area */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            {/* Standard Backdrop Floating Pill Tabs Bar */}
            <div className="bg-muted/60 dark:bg-muted/40 p-1.5 rounded-2xl border border-border/40 shadow-xs backdrop-blur-md overflow-x-auto scrollbar-none">
              <TabsList className="w-full justify-start bg-transparent p-0 gap-1.5 h-auto border-none shadow-none min-w-max">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Award className="h-3.5 w-3.5" />
                  Award Overview
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Documents & Agreements
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Award Overview */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Award Breakdown Card */}
              <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <Wallet className="h-5 w-5 text-emerald-600 shrink-0" />
                    Budget Allocation & Award Summary
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Overview of requested proposal budget versus committee approved award allocation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Requested vs Awarded Comparison Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 p-4 bg-muted/30 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Budget Requested
                      </span>
                      <span className="text-2xl font-black text-foreground block">
                        {formatCurrency(requestedAmount)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-950 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                        Total Awarded
                      </span>
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block">
                        {formatCurrency(totalAwardAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Funded Percentage Progress Bar */}
                  {fundedPercent !== null && (
                    <div className="rounded-xl border border-border/60 p-4 bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Allocation Ratio
                        </span>
                        <span className="text-sm font-black text-foreground">
                          {fundedPercent}% Funded
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full bg-muted rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.round(Number(fundedPercent))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(Number(fundedPercent), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount Words */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Award Amount in English Words
                    </span>
                    <p className="text-sm font-semibold text-foreground bg-muted/40 border border-border/50 p-3.5 rounded-xl capitalize leading-relaxed">
                      {recommendation.amountEnglishInWords ||
                        recommendation.amount_english_in_words ||
                        "No amount words recorded."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Committee Remarks Card */}
              <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                    Committee Recommendation Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-foreground leading-relaxed text-sm whitespace-pre-line bg-muted/30 border border-border/50 p-4 rounded-xl">
                    {recommendation.comments ||
                      "No committee comments or remarks recorded for this recommendation."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Documents */}
            <TabsContent value="documents" className="mt-6 space-y-6">
              <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <FileCheck2 className="h-5 w-5 text-primary shrink-0" />
                    Award Generation & Agreement Downloads
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Download formal PDF award letter and grant agreement documents for this recommendation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Award className="h-4 w-4 text-emerald-600" />
                          Award Letter Document
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Official research grant award notice for the principal investigator.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={active !== null}
                        onClick={() => void download("award", { recommendation, context })}
                        className="w-full gap-2 font-semibold"
                      >
                        {active === "award" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Award className="h-3.5 w-3.5" />
                        )}
                        Download Award Letter
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <FileCheck2 className="h-4 w-4 text-blue-600" />
                          Grant Agreement Document
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Formal grant agreement contract detailing terms and reporting schedules.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={active !== null}
                        onClick={() => void download("agreement", { recommendation, context })}
                        className="w-full gap-2 font-semibold"
                      >
                        {active === "agreement" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileCheck2 className="h-3.5 w-3.5" />
                        )}
                        Download Agreement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Sidebar Information Panel (340px)                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <aside className="space-y-6">
          {/* Governance & Status Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border/40 bg-muted/30 py-3.5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              {/* Proposal Reference */}
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Proposal Reference</span>
                <span className="font-mono font-bold text-primary text-[11px]">{referenceNumber}</span>
              </div>

              {/* Ethics Badge */}
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Ethics Approved</span>
                <Badge
                  className={cn(
                    "border shadow-none text-[10px] font-bold uppercase",
                    hasEthicsApproval
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400",
                  )}
                >
                  {hasEthicsApproval ? (
                    <>
                      <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600" />
                      Approved
                    </>
                  ) : (
                    "Not marked"
                  )}
                </Badge>
              </div>

              {/* Funding Decision Status */}
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Funding Decision</span>
                <Badge
                  className={cn(
                    "border shadow-none text-[10px] font-bold uppercase",
                    fundingDecisionStatus === "approved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : fundingDecisionStatus === "rejected"
                        ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                  )}
                >
                  {fundingDecisionStatus === "approved" ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : fundingDecisionStatus === "rejected" ? (
                    <XCircle className="mr-1 h-3 w-3" />
                  ) : null}
                  <span className="capitalize">{fundingDecisionStatus || "pending"}</span>
                </Badge>
              </div>

              {/* Screening Status */}
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Screening Status</span>
                <span className="font-semibold text-foreground capitalize text-[11px]">
                  {screeningStatus?.replace(/_/g, " ") || "Screening Approved"}
                </span>
              </div>

              {/* Terminal Report Status */}
              {(recommendation.terminalReportStatus || recommendation.terminal_report_status) && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Terminal Report</span>
                  <span className="font-semibold text-foreground capitalize text-[11px]">
                    {(recommendation.terminalReportStatus || recommendation.terminal_report_status)?.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {/* Recommended Date */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground font-medium">Recommended Date</span>
                <span className="font-semibold text-foreground text-[11px]">
                  {formatDate(recommendation.recommendedAt ?? recommendation.recommended_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Application Details & Grant Call Context Card */}
          {context && (
            <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
              <CardHeader className="border-b border-border/40 bg-muted/30 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Grant Detail
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                {(context.call?.title || context.callTitle) && (
                  <div className="space-y-0.5 border-b border-border/40 pb-2">
                    <span className="text-muted-foreground font-medium text-[10px] uppercase">Grant Call</span>
                    <p className="font-bold text-foreground text-[11px] leading-tight">
                      {context.call?.title || context.callTitle}
                    </p>
                  </div>
                )}
                {(context.proposalType?.name || context.proposalTypeName) && (
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground font-medium">Proposal Type</span>
                    <span className="font-semibold text-foreground text-[11px]">
                      {context.proposalType?.name || context.proposalTypeName}
                    </span>
                  </div>
                )}
                {(context.organization?.name || context.organizationName) && (
                  <div className="space-y-0.5 border-b border-border/40 pb-2">
                    <span className="text-muted-foreground font-medium text-[10px] uppercase">Organization</span>
                    <p className="font-medium text-foreground text-[11px] truncate">
                      {context.organization?.name || context.organizationName}
                    </p>
                  </div>
                )}
                {context.averageScorePercentage !== undefined && context.averageScorePercentage !== null && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-medium">Screening Score</span>
                    <Badge className="border-blue-200 bg-blue-50 text-blue-700 shadow-none text-[10px] font-bold">
                      {Number(context.averageScorePercentage).toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Principal Investigator Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border/40 bg-muted/30 py-3.5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Principal Investigator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-3 items-center">
                <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                  {piAvatar && <AvatarImage src={piAvatar} alt={piName(principalInvestigator)} />}
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">
                    {piName(principalInvestigator)}
                  </p>
                  {piEmail && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{piEmail}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}