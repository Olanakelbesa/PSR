"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Send,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { toast } from "sonner";

import { readyForFundingService } from "@/api/services/ready-for-funding.service";
import {
  getApprovedPendingFundingScreening,
  type ApprovedPendingFundingScreening,
} from "@/api/services/screenings.service";
import { fundingDecisionSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import {
  resolveFileUrl,
  downloadRemoteFile,
  extractFileName,
} from "@/lib/utils/resolve-file-url";
import { tokenStorage } from "@/lib/axios";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";

// ============================================================================
// Helpers
// ============================================================================

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return "ETB 0";
  return `ETB ${amount.toLocaleString()}`;
}

function statusBadgeClass(status?: string | null) {
  if (!status) return "border-slate-200 bg-slate-50 text-slate-700";
  const s = status.toLowerCase();
  if (s === "approved")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "rejected")
    return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusIcon(status?: string | null) {
  if (!status) return <Clock className="h-3.5 w-3.5" />;
  const s = status.toLowerCase();
  if (s === "approved")
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (s === "rejected") return <XCircle className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}

async function handleDownload(
  url: string | null | undefined,
  name: string,
) {
  if (!url) return;
  await downloadRemoteFile(url, extractFileName(name), {
    token: tokenStorage.get(),
  });
}

// ============================================================================
// Component
// ============================================================================

export default function ReadyForFundingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id;
  const screeningId = Array.isArray(routeId) ? routeId[0] : routeId;

  const [screening, setScreening] =
    useState<ApprovedPendingFundingScreening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingDecision, setFundingDecision] = useState("");
  const [requiresEthicalClearance, setRequiresEthicalClearance] = useState("");
  const [committeeRemarks, setCommitteeRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<{
    fundingDecision?: string;
    requiresEthicalClearance?: string;
    committeeRemarks?: string;
  }>({});

  useEffect(() => {
    async function load() {
      if (!screeningId) {
        toast.error("Invalid screening id");
        router.push("/research/ready-for-funding");
        return;
      }

      setIsLoading(true);
      setIsError(false);
      try {
        const data = await getApprovedPendingFundingScreening(screeningId);
        setScreening(data);
      } catch (error) {
        console.error("Failed to load screening:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [router, screeningId]);

  const openFundingModal = () => {
    setFundingDecision(screening?.fundingStatus?.decision || "");
    setRequiresEthicalClearance(
      screening?.fundingStatus?.needIrbEthicalClearance ? "yes" : "no",
    );
    setCommitteeRemarks(screening?.fundingStatus?.remark || "");
    setFormErrors({});
    setIsFundingModalOpen(true);
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <PageContainer title="Loading Details...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Fetching proposal details...
          </p>
        </div>
      </PageContainer>
    );
  }

  // --- Error ---
  if (isError || !screening) {
    return (
      <PageContainer title="Error Loading Details">
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm max-w-2xl mx-auto my-12">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                Unable to load proposal details.
              </p>
              <p className="text-sm text-muted-foreground">
                The record could not be retrieved from the server. It may have
                been deleted or the ID is invalid.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() =>
                  router.push("/research/ready-for-funding")
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setIsError(false);
                  getApprovedPendingFundingScreening(screeningId!)
                    .then((data) => setScreening(data))
                    .catch(() => setIsError(true))
                    .finally(() => setIsLoading(false));
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // --- Submit handler ---
  const handleSubmit = async () => {
    const validation = fundingDecisionSchema.safeParse({
      fundingDecision,
      requiresEthicalClearance,
      committeeRemarks,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setFormErrors({
        fundingDecision: fieldErrors.fundingDecision?.[0],
        requiresEthicalClearance: fieldErrors.requiresEthicalClearance?.[0],
        committeeRemarks: fieldErrors.committeeRemarks?.[0],
      });
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    if (!screeningId) {
      toast.error("Invalid screening id");
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const payload = {
        Remark: validation.data.committeeRemarks,
        need_irb_ethical_clearance:
          validation.data.requiresEthicalClearance === "yes",
        decision_status: validation.data.fundingDecision as
          | "pending"
          | "approved"
          | "rejected"
          | "deferred",
      };

      if (screening?.fundingStatus?.id) {
        await readyForFundingService.updateDecision(screeningId, payload);
      } else {
        await readyForFundingService.createDecision(screeningId, payload);
      }

      setScreening((current) =>
        current
          ? {
              ...current,
              fundingStatus: {
                ...current.fundingStatus,
                decision: validation.data.fundingDecision,
                remark: validation.data.committeeRemarks,
                needIrbEthicalClearance:
                  validation.data.requiresEthicalClearance === "yes",
                state: "funding_decision_exists",
              },
            }
          : current,
      );

      toast.success("Funding decision submitted successfully");
      setIsFundingModalOpen(false);
      setCommitteeRemarks("");
      setFundingDecision("");
      setRequiresEthicalClearance("");
    } catch (error) {
      console.error("Failed to submit funding decision:", error);
      toast.error("Failed to submit funding decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Derived data ---
  const piName = [
    screening.principalInvestigator?.firstName,
    screening.principalInvestigator?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Principal Investigator";

  const fundingDecisionStatus = screening.fundingStatus?.decision || "pending";
  const hasRecommendations =
    (screening.fundingStatus?.recommendations?.length ?? 0) > 0;

  return (
    <PageContainer
      title={screening.title}
      description={`Reference: ${screening.id.toUpperCase()}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/ready-for-funding")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={openFundingModal}>
            Funding Decision
          </Button>
        </div>
      }
    >
      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Main Content                                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6 min-w-0">
          {/* Header Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <Badge className="bg-primary/10 text-primary border border-primary/20 uppercase text-[9px] font-bold">
                  Ready for Funding
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Submitted:{" "}
                    {formatDate(screening.submittedAt) || "—"}
                  </span>
                </div>
              </div>
              <CardTitle className="mt-3 text-2xl font-extrabold text-slate-900 leading-snug">
                {screening.title}
              </CardTitle>
              <p className="text-sm font-bold text-primary mt-1">
                Ref: {screening.id.toUpperCase()}
              </p>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="border-b rounded-none w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="budget">Budget & Funding</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ──────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6 pt-6">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Abstract
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <HtmlContentRenderer content={screening.abstract} />
                </CardContent>
              </Card>

              {/* Research Sections — show only if at least one exists */}
              {(screening.background ||
                screening.objectives ||
                screening.methodology ||
                screening.ethicalConsiderations) && (
                <Card className="border border-muted-foreground/15 shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex gap-2 items-center text-base font-bold">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Research Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    {screening.background && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Background
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 border p-4 rounded-xl">
                          <HtmlContentRenderer content={screening.background} />
                        </div>
                      </div>
                    )}
                    {screening.objectives && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Objectives
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 border p-4 rounded-xl">
                          <HtmlContentRenderer content={screening.objectives} />
                        </div>
                      </div>
                    )}
                    {screening.methodology && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Methodology
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 border p-4 rounded-xl">
                          <HtmlContentRenderer
                            content={screening.methodology}
                          />
                        </div>
                      </div>
                    )}
                    {screening.ethicalConsiderations && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Ethical Considerations
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 border p-4 rounded-xl">
                          <HtmlContentRenderer
                            content={screening.ethicalConsiderations}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Team Tab ──────────────────────────────────────────────── */}
            <TabsContent value="team" className="space-y-6 pt-6">
              {/* PI Card */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <User className="h-5 w-5 text-blue-600" />
                    Principal Investigator
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex gap-4 items-start">
                    <div className="rounded-full bg-slate-100 p-3 text-slate-600 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-slate-800 text-lg truncate">
                        {piName}
                      </p>
                      {screening.principalInvestigator?.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {screening.principalInvestigator.email}
                        </p>
                      )}
                      {screening.principalInvestigator?.phone && (
                        <p className="text-sm text-muted-foreground">
                          {screening.principalInvestigator.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Co-Investigators Card */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <User className="h-5 w-5 text-emerald-600" />
                    Co-Investigators
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  {screening.coInvestigators.length > 0 ? (
                    <div className="space-y-3">
                      {screening.coInvestigators.map((ci, idx) => {
                        const name =
                          (ci.name as string) ||
                          (ci as Record<string, unknown>).stakeholderName as string ||
                          "Unknown";
                        const role = (ci.role as string) || "";
                        const email = (ci.email as string) || "";
                        const institution =
                          (ci.institution as string) ||
                          (ci as Record<string, unknown>).organizationName as string ||
                          "";

                        return (
                          <div
                            key={idx}
                            className="flex gap-4 items-start p-3 rounded-xl border bg-slate-50/50"
                          >
                            <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600 shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {name}
                                {role && (
                                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                                    ({role})
                                  </span>
                                )}
                              </p>
                              {email && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {email}
                                </p>
                              )}
                              {institution && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {institution}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No co-investigators listed.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Attachments Tab ───────────────────────────────────────── */}
            <TabsContent value="attachments" className="pt-6">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <Download className="h-5 w-5 text-violet-600" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-3">
                    {screening.attachments.length > 0 ? (
                      screening.attachments.map((attachment) => {
                        const fileName =
                          attachment.name.split("/").pop() ||
                          attachment.name;
                        const resolvedUrl = resolveFileUrl(
                          attachment.url,
                        );
                        const isPdf = fileName
                          .toLowerCase()
                          .endsWith(".pdf");

                        return (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className={cn(
                                "rounded-lg p-2 shrink-0",
                                isPdf
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-blue-50 text-blue-600",
                              )}
                            >
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {fileName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatFileSize(attachment.size) ||
                                  "Unknown size"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5 px-2.5"
                                onClick={() =>
                                  setViewerDocument({
                                    url: resolvedUrl ?? "",
                                    title: fileName,
                                  })
                                }
                                disabled={!resolvedUrl}
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  Preview
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5 px-2.5"
                                onClick={() =>
                                  void handleDownload(
                                    resolvedUrl,
                                    attachment.name,
                                  )
                                }
                                disabled={!resolvedUrl}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  Download
                                </span>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No attachments available.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Budget & Funding Tab ──────────────────────────────────── */}
            <TabsContent value="budget" className="space-y-6 pt-6">
              {/* Budget Overview */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    Budget Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border p-4 bg-slate-50 border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        Budget Requested
                      </span>
                      <span className="text-2xl font-black text-slate-900 block mt-2">
                        {formatCurrency(screening.budget?.total)}
                      </span>
                    </div>
                    {screening.fundingStatus?.approvedAmount && (
                      <div className="rounded-xl border p-4 bg-emerald-50/20 border-emerald-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                          Approved Amount
                        </span>
                        <span className="text-2xl font-black text-emerald-700 block mt-2">
                          {formatCurrency(
                            screening.fundingStatus.approvedAmount,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Review Status */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Review Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Technical Review
                      </p>
                      <Badge
                        className={cn(
                          "mt-2",
                          statusBadgeClass(
                            screening.reviewStatus?.technicalReview,
                          ),
                        )}
                      >
                        {statusIcon(screening.reviewStatus?.technicalReview)}
                        <span className="ml-1 capitalize">
                          {screening.reviewStatus?.technicalReview?.replace(
                            /_/g,
                            " ",
                          ) || "N/A"}
                        </span>
                      </Badge>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Ethics Review
                      </p>
                      <Badge
                        className={cn(
                          "mt-2",
                          statusBadgeClass(
                            screening.reviewStatus?.ethicsReview,
                          ),
                        )}
                      >
                        {statusIcon(screening.reviewStatus?.ethicsReview)}
                        <span className="ml-1 capitalize">
                          {screening.reviewStatus?.ethicsReview?.replace(
                            /_/g,
                            " ",
                          ) || "N/A"}
                        </span>
                      </Badge>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Financial Review
                      </p>
                      <Badge
                        className={cn(
                          "mt-2",
                          statusBadgeClass(
                            screening.reviewStatus?.financialReview,
                          ),
                        )}
                      >
                        {statusIcon(screening.reviewStatus?.financialReview)}
                        <span className="ml-1 capitalize">
                          {screening.reviewStatus?.financialReview?.replace(
                            /_/g,
                            " ",
                          ) || "N/A"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Funding Recommendations */}
              {hasRecommendations && (
                <Card className="border border-muted-foreground/15 shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex gap-2 items-center text-base font-bold">
                      Funding Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    {screening.fundingStatus!.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border p-4 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                              Recommended Amount
                            </span>
                            <span className="text-xl font-black text-slate-900 block mt-1">
                              {formatCurrency(rec.amount)}
                            </span>
                          </div>
                          {rec.recommendedAt && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(rec.recommendedAt)}
                            </div>
                          )}
                        </div>
                        {rec.amountInWords && (
                          <p className="text-sm font-medium text-slate-700 italic bg-white border p-3 rounded-lg capitalize">
                            &ldquo;{rec.amountInWords}&rdquo;
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold",
                              rec.hasEthicalClearanceApproval
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-slate-200 bg-slate-50 text-slate-700",
                            )}
                          >
                            {rec.hasEthicalClearanceApproval ? (
                              <>
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Ethics Cleared
                              </>
                            ) : (
                              "Ethics Pending"
                            )}
                          </Badge>
                        </div>
                        {rec.comments && (
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                              Comments
                            </span>
                            <p className="text-sm text-slate-700 leading-relaxed bg-white border p-3 rounded-lg">
                              {rec.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Funding Decision Summary */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex gap-2 items-center text-base font-bold">
                      Funding Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground font-medium text-sm">
                      Decision
                    </span>
                    <Badge
                      className={cn(
                        "capitalize",
                        statusBadgeClass(fundingDecisionStatus),
                      )}
                    >
                      {fundingDecisionStatus === "approved" ? (
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      ) : fundingDecisionStatus === "rejected" ? (
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <Clock className="mr-1 h-3.5 w-3.5" />
                      )}
                      {fundingDecisionStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground font-medium text-sm">
                      IRB Required
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold",
                        screening.fundingStatus?.needIrbEthicalClearance
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : "border border-slate-200 bg-slate-50 text-slate-700",
                      )}
                    >
                      {screening.fundingStatus?.needIrbEthicalClearance
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  {screening.fundingStatus?.ethicalClearanceStatus && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground font-medium text-sm">
                        Ethical Clearance
                      </span>
                      <Badge
                        className={cn(
                          "capitalize",
                          statusBadgeClass(
                            screening.fundingStatus.ethicalClearanceStatus,
                          ),
                        )}
                      >
                        {screening.fundingStatus.ethicalClearanceStatus.replace(
                          /_/g,
                          " ",
                        )}
                      </Badge>
                    </div>
                  )}
                  {screening.fundingStatus?.remark && (
                    <div className="pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Remarks
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 border p-4 rounded-xl whitespace-pre-line">
                        {screening.fundingStatus.remark}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Sidebar                                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <aside className="space-y-6 xl:sticky xl:top-6">
          {/* Status Card */}
          <Card className="border border-muted-foreground/15 shadow-sm overflow-hidden">
            <CardHeader className="p-4 rounded-t-lg bg-primary text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-semibold">Status</p>
              </div>
              <p className="text-sm opacity-90 mt-0.5">
                {screening.fundingStatus?.state?.replace(/_/g, " ") || "—"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className="font-bold text-slate-800">
                  {screening.institution || "Institution not provided"}
                </p>
                <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase">
                  {screening.researchArea || "Uncategorized"}
                </Badge>
              </div>

              <div className="rounded-xl border p-3 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Principal Investigator
                </p>
                <p className="font-semibold text-sm text-slate-800">
                  {piName}
                </p>
                {screening.principalInvestigator?.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {screening.principalInvestigator.email}
                  </p>
                )}
                {screening.principalInvestigator?.phone && (
                  <p className="text-xs text-muted-foreground">
                    {screening.principalInvestigator.phone}
                  </p>
                )}
              </div>

              <div className="rounded-xl border p-3 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Funding Decision
                </p>
                <Badge
                  className={cn(
                    "capitalize",
                    statusBadgeClass(fundingDecisionStatus),
                  )}
                >
                  {fundingDecisionStatus === "approved" ? (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  ) : fundingDecisionStatus === "rejected" ? (
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <Clock className="mr-1 h-3.5 w-3.5" />
                  )}
                  {fundingDecisionStatus.replace(/_/g, " ")}
                </Badge>
                {screening.fundingStatus?.remark && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {screening.fundingStatus.remark}
                  </p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Submitted:{" "}
                    {formatDate(screening.submittedAt) || "—"}
                  </span>
                </div>
                {screening.createdAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created: {formatDate(screening.createdAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review Pipeline Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Review Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              {[
                {
                  label: "Technical Review",
                  value: screening.reviewStatus?.technicalReview,
                },
                {
                  label: "Ethics Review",
                  value: screening.reviewStatus?.ethicsReview,
                },
                {
                  label: "Financial Review",
                  value: screening.reviewStatus?.financialReview,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <span className="text-sm text-muted-foreground font-medium">
                    {item.label}
                  </span>
                  <Badge className={cn("capitalize", statusBadgeClass(item.value))}>
                    {statusIcon(item.value)}
                    <span className="ml-1">
                      {item.value?.replace(/_/g, " ") || "N/A"}
                    </span>
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Co-Investigators Quick List */}
          {screening.coInvestigators.length > 0 && (
            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardHeader className="border-b bg-slate-50/80">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Co-Investigators ({screening.coInvestigators.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                {screening.coInvestigators.map((ci, idx) => {
                  const name =
                    (ci.name as string) ||
                    (ci as Record<string, unknown>).stakeholderName as string ||
                    "Unknown";
                  const role = (ci.role as string) || "";
                  return (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 shrink-0">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {name}
                        </p>
                        {role && (
                          <p className="text-[11px] text-muted-foreground">
                            {role}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Key Figures
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground font-medium">
                  Requested Budget
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(screening.budget?.total)}
                </span>
              </div>
              {screening.fundingStatus?.approvedAmount && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground font-medium">
                    Approved Amount
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatCurrency(
                      screening.fundingStatus.approvedAmount,
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground font-medium">
                  IRB Required
                </span>
                <Badge
                  className={cn(
                    "text-[10px] font-bold",
                    screening.fundingStatus?.needIrbEthicalClearance
                      ? "border border-amber-200 bg-amber-50 text-amber-700"
                      : "border border-slate-200 bg-slate-50 text-slate-700",
                  )}
                >
                  {screening.fundingStatus?.needIrbEthicalClearance
                    ? "Yes"
                    : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Funding Decision Dialog                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isFundingModalOpen} onOpenChange={setIsFundingModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
          {/* ── Dynamic Colored Header ──────────────────────────────────── */}
          <div
            className={cn(
              "p-6 pb-4 border-b transition-colors duration-200",
              fundingDecision === "approved" &&
                "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
              fundingDecision === "deferred" &&
                "bg-amber-50/60 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
              fundingDecision === "rejected" &&
                "bg-red-50/60 dark:bg-red-500/10 border-red-100 dark:border-red-500/20",
              !fundingDecision &&
                "bg-muted/30 border-border",
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {fundingDecision === "approved" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {fundingDecision === "deferred" && (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
                {fundingDecision === "rejected" && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Funding Decision
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed space-y-1">
                <p>
                  {fundingDecision === "approved" &&
                    "This proposal is approved for funding and will proceed to award generation."}
                  {fundingDecision === "deferred" &&
                    "This proposal is deferred. Funding will be reconsidered in the next cycle."}
                  {fundingDecision === "rejected" &&
                    "This proposal is rejected. The submitter will be notified of the decision."}
                  {!fundingDecision &&
                    "Select a decision below to record the committee's funding determination."}
                </p>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  Proposal: {screening.title}
                </p>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="p-6 space-y-6 bg-background">
            {/* Decision Cards */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Decision <span className="text-rose-500">*</span>
              </label>
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                role="radiogroup"
                aria-label="Funding decision"
              >
                {[
                  {
                    value: "approved",
                    icon: CheckCircle2,
                    label: "Approved",
                    description: "Proceed to award",
                    selectedBorder: "border-emerald-500",
                    selectedBg: "bg-emerald-50",
                    selectedRing: "ring-emerald-500/25",
                    selectedText: "text-emerald-700",
                    iconColor: "text-emerald-600",
                    iconBg: "bg-emerald-100",
                  },
                  {
                    value: "deferred",
                    icon: Clock,
                    label: "Deferred",
                    description: "Reconsider later",
                    selectedBorder: "border-amber-500",
                    selectedBg: "bg-amber-50",
                    selectedRing: "ring-amber-500/25",
                    selectedText: "text-amber-700",
                    iconColor: "text-amber-600",
                    iconBg: "bg-amber-100",
                  },
                  {
                    value: "rejected",
                    icon: AlertCircle,
                    label: "Rejected",
                    description: "Notify submitter",
                    selectedBorder: "border-red-500",
                    selectedBg: "bg-red-50",
                    selectedRing: "ring-red-500/25",
                    selectedText: "text-red-700",
                    iconColor: "text-red-600",
                    iconBg: "bg-red-100",
                  },
                ].map((option) => {
                  const isSelected = fundingDecision === option.value;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setFundingDecision(option.value);
                        if (formErrors.fundingDecision) {
                          setFormErrors((current) => ({
                            ...current,
                            fundingDecision: undefined,
                          }));
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 text-center",
                        isSelected
                          ? cn(
                              option.selectedBorder,
                              option.selectedBg,
                              "ring-2",
                              option.selectedRing,
                              "shadow-sm",
                            )
                          : "border-border hover:border-border/80 hover:bg-muted/30 ring-2 ring-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-full p-2 transition-colors",
                          isSelected
                            ? cn(option.iconBg, option.iconColor)
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isSelected ? option.selectedText : "text-foreground",
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {formErrors.fundingDecision ? (
                <p className="text-xs text-rose-600">
                  {formErrors.fundingDecision}
                </p>
              ) : null}
            </div>

            {/* Ethical Clearance */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Ethical Clearance Requirement{" "}
                <span className="text-rose-500">*</span>
              </label>

              <RadioGroup
                value={requiresEthicalClearance}
                onValueChange={(value) => {
                  setRequiresEthicalClearance(value);
                  if (formErrors.requiresEthicalClearance) {
                    setFormErrors((current) => ({
                      ...current,
                      requiresEthicalClearance: undefined,
                    }));
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    requiresEthicalClearance === "yes"
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/25"
                      : "border-border hover:border-border/80 hover:bg-muted/30 ring-2 ring-transparent",
                  )}
                >
                  <RadioGroupItem value="yes" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Yes, Required</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Must be obtained before funding is released.
                    </p>
                  </div>
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    requiresEthicalClearance === "no"
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/25"
                      : "border-border hover:border-border/80 hover:bg-muted/30 ring-2 ring-transparent",
                  )}
                >
                  <RadioGroupItem value="no" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">No, Not Required</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      No additional ethical approval needed.
                    </p>
                  </div>
                </label>
              </RadioGroup>
              {formErrors.requiresEthicalClearance ? (
                <p className="text-xs text-rose-600">
                  {formErrors.requiresEthicalClearance}
                </p>
              ) : null}
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Committee Remarks <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full">
                  Required
                </span>
              </div>
              <Textarea
                placeholder="Provide detailed justification, conditions, or notes for audit and governance tracking..."
                value={committeeRemarks}
                onChange={(e) => {
                  setCommitteeRemarks(e.target.value);
                  if (formErrors.committeeRemarks) {
                    setFormErrors((current) => ({
                      ...current,
                      committeeRemarks: undefined,
                    }));
                  }
                }}
                className={cn(
                  "min-h-[100px] resize-none focus-visible:ring-primary/50 shadow-sm",
                  formErrors.committeeRemarks
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "",
                )}
              />
              {formErrors.committeeRemarks && (
                <p className="text-xs text-rose-600">
                  {formErrors.committeeRemarks}
                </p>
              )}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-muted/10">
            <Button
              variant="ghost"
              onClick={() => setIsFundingModalOpen(false)}
              disabled={isSubmitting}
              className="hover:bg-muted/50 font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !fundingDecision}
              className={cn(
                "shadow-sm font-semibold",
                fundingDecision === "approved" &&
                  "bg-emerald-600 hover:bg-emerald-700 text-white",
                fundingDecision === "deferred" &&
                  "bg-amber-600 hover:bg-amber-700 text-white",
                fundingDecision === "rejected" &&
                  "bg-red-600 hover:bg-red-700 text-white",
                !fundingDecision && "bg-primary hover:bg-primary/90",
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {fundingDecision === "approved"
                    ? "Confirm Approval"
                    : fundingDecision === "rejected"
                      ? "Confirm Rejection"
                      : fundingDecision === "deferred"
                        ? "Confirm Deferral"
                        : "Submit Decision"}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        isOpen={!!viewerDocument}
        onOpenChange={(open) => !open && setViewerDocument(null)}
        url={viewerDocument?.url ?? ""}
        title={viewerDocument?.title ?? "Document"}
      />
    </PageContainer>
  );
}
