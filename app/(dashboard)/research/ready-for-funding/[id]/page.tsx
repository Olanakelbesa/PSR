"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileClock,
  FileText,
  History,
  Layers,
  Loader2,
  Mail,
  Paperclip,
  Phone,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Tag,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";

// ============================================================================
// Status display config & Helpers
// ============================================================================

const STATUS_DISPLAY: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  resubmitted: { label: "Resubmitted", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  under_review: { label: "Under Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  screening_under_review: { label: "Screening Under Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  screening_approved: { label: "Screening Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Not Accepted", className: "bg-rose-100 text-rose-700 border-rose-200" },
  screening_rejected: { label: "Screening Not Accepted", className: "bg-rose-100 text-rose-700 border-rose-200" },
  revision_requested: { label: "Revision Requested", className: "bg-amber-50 text-amber-600 border-amber-200" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" },
  deferred: { label: "Deferred", className: "bg-amber-100 text-amber-700 border-amber-200" },
  funding_decision_exists: { label: "Decision Recorded", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function StatusBadge({ status, displayLabel }: { status?: string | null; displayLabel?: string | null }) {
  const normalizedKey = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  const cfg = STATUS_DISPLAY[normalizedKey] ?? {
    label: displayLabel || (status ? status.replace(/_/g, " ") : "Ready for Funding"),
    className: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <Badge
      variant="outline"
      className={cn("px-3 py-1 border shadow-none text-[10px] font-bold uppercase tracking-wide", cfg.className)}
    >
      {displayLabel || cfg.label}
    </Badge>
  );
}

function getUserAvatarUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl || photoUrl === "#") return undefined;
  const resolved = resolveFileUrl(photoUrl);
  if (resolved) return resolved;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `/bff/media/stream/${cleanPath.replace(/^\/media\//, "")}`;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

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

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return "ETB 0";
  return `ETB ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadgeClass(status?: string | null) {
  if (!status) return "border-slate-200 bg-slate-50 text-slate-700";
  const s = status.toLowerCase();
  if (s === "approved" || s === "funding_decision_exists")
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (s === "rejected")
    return "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
}

function statusIcon(status?: string | null) {
  if (!status) return <Clock className="h-3.5 w-3.5" />;
  const s = status.toLowerCase();
  if (s === "approved" || s === "funding_decision_exists")
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

function EmbeddedViewer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No document attached</p>
      </div>
    );
  }

  const resolvedUrl = resolveFileUrl(url) || url;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 shadow-xs bg-card">
        <PdfViewer url={resolvedUrl} title={title} className="h-[700px] w-full" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-[#ededed] dark:bg-muted/30 shadow-xs">
        <WordViewer url={resolvedUrl} title={title} className="h-[700px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-16 text-center shadow-xs">
      <FileText className="h-12 w-12 text-primary" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          This document type cannot be embedded directly in the browser preview.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
            <Eye className="mr-2 h-4 w-4" /> Open File
          </a>
        </Button>
        <Button asChild size="sm">
          <a href={resolvedUrl} download>
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
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
  const [copied, setCopied] = useState(false);
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);

  // Modal State
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingDecision, setFundingDecision] = useState("");
  const [requiresEthicalClearance, setRequiresEthicalClearance] = useState("");
  const [committeeRemarks, setCommitteeRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (data.attachments && data.attachments.length > 0) {
          setActiveDocKey(data.attachments[0].id);
        }
      } catch (error) {
        console.error("Failed to load screening:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [router, screeningId]);

  const handleCopyRef = () => {
    if (!screening) return;
    navigator.clipboard.writeText(screening.id.toUpperCase());
    setCopied(true);
    toast.success("Reference copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const openFundingModal = () => {
    setFundingDecision(screening?.fundingStatus?.decision || "");
    const fs = screening?.fundingStatus as any;
    const initialEthical =
      fs?.ethicalClearanceRequirement ||
      (fs?.allowPostFundingIrb
        ? "required_post_funding"
        : fs?.needIrbEthicalClearance
          ? "yes"
          : "no");
    setRequiresEthicalClearance(initialEthical);
    setCommitteeRemarks(screening?.fundingStatus?.remark || "");
    setFormErrors({});
    setIsFundingModalOpen(true);
  };

  // --- Loading Skeleton ---
  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal Details...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // --- Error State ---
  if (isError || !screening) {
    return (
      <PageContainer
        title="Proposal Details Unavailable"
        description="The requested ready-for-funding record could not be retrieved."
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/research/ready-for-funding")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20 max-w-2xl mx-auto my-8">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-4 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-lg">
                Unable to load proposal details
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                The record could not be loaded from the backend server. It may have been modified or the screening ID is invalid.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/research/ready-for-funding")}
                className="gap-2 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
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
                className="gap-2 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // --- Submit decision handler ---
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
      const reqOpt = validation.data.requiresEthicalClearance;
      const needIrb = reqOpt === "yes" || reqOpt === "required_post_funding";
      const allowPostFunding = reqOpt === "required_post_funding";

      const payload = {
        Remark: validation.data.committeeRemarks,
        need_irb_ethical_clearance: needIrb,
        allow_post_funding_irb: allowPostFunding,
        ethical_clearance_requirement: reqOpt,
        decision_status: validation.data.fundingDecision as
          | "pending"
          | "approved"
          | "rejected"
          | "not_accepted"
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
              needIrbEthicalClearance: needIrb,
              allowPostFundingIrb: allowPostFunding,
              ethicalClearanceRequirement: reqOpt,
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

  // --- Derived Data ---
  const piName = [
    screening.principalInvestigator?.firstName,
    screening.principalInvestigator?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Principal Investigator";

  const piPhotoRaw =
    screening.principalInvestigator?.photoUrl ||
    screening.principalInvestigator?.photo_url ||
    screening.principalInvestigator?.photo ||
    screening.principalInvestigator?.avatarUrl ||
    screening.principalInvestigator?.avatar;
  const piPhoto = getUserAvatarUrl(piPhotoRaw);

  const fundingDecisionStatus = screening.fundingStatus?.decision || "pending";
  const hasRecommendations =
    (screening.fundingStatus?.recommendations?.length ?? 0) > 0;

  const activeDoc = screening.attachments.find((att) => att.id === activeDocKey) || screening.attachments[0];

  return (
    <PageContainer
      title={screening.title}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{screening.id.toUpperCase()}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/research/ready-for-funding")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <Button
            size="sm"
            onClick={openFundingModal}
            className="gap-2 font-semibold shadow-xs bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            Funding Decision
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Main Content                                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            {/* Standard Backdrop Floating Pill Tabs Bar */}
            <div className="bg-muted/60 dark:bg-muted/40 p-1.5 rounded-2xl border border-border/40 shadow-xs backdrop-blur-md overflow-x-auto scrollbar-none">
              <TabsList className="w-full justify-start bg-transparent p-0 gap-1.5 h-auto border-none shadow-none min-w-max">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  Proposal Content
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  Research Team
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-border/60 text-muted-foreground rounded-md">
                    {1 + screening.coInvestigators.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  Uploaded Documents
                  {screening.attachments.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold bg-primary/10 text-primary border-none rounded-md">
                      {screening.attachments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="budget"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  Budget & Recommendations
                </TabsTrigger>
                <TabsTrigger
                  value="decision"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Recorded Decision
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Overview Tab ──────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-6 space-y-6">
              {/* Requested & Approved Budget Summary Banner */}
              <Card className="shadow-xs border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-background overflow-hidden">
                <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Requested Budget
                      </p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                        {formatCurrency(screening.budget?.total)}
                      </p>
                    </div>
                  </div>

                  {screening.fundingStatus?.approvedAmount ? (
                    <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 border-border/60">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Approved Funding
                        </p>
                        <p className="text-xl font-black text-primary font-mono">
                          {formatCurrency(screening.fundingStatus.approvedAmount)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <Badge variant="outline" className="text-xs font-bold py-1 px-3 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        Pending Decision Determination
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Abstract Card */}
              <Card className="shadow-xs border-border/60">
                <CardHeader className="border-b bg-muted/20 py-3.5 px-5">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Abstract
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 text-sm text-foreground leading-relaxed">
                  <HtmlContentRenderer
                    content={screening.abstract || "No abstract provided for this proposal."}
                  />
                </CardContent>
              </Card>

              {/* Extended Sections */}
              {(screening.background ||
                screening.objectives ||
                screening.methodology ||
                screening.ethicalConsiderations) && (
                  <Card className="shadow-xs border-border/60">
                    <CardHeader className="border-b bg-muted/20 py-3.5 px-5">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-600" />
                        Research Proposal Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-6">
                      {screening.background && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Background & Rationale
                          </h4>
                          <div className="text-sm text-foreground leading-relaxed bg-muted/20 border border-border/60 p-4 rounded-xl">
                            <HtmlContentRenderer content={screening.background} />
                          </div>
                        </div>
                      )}
                      {screening.objectives && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Objectives
                          </h4>
                          <div className="text-sm text-foreground leading-relaxed bg-muted/20 border border-border/60 p-4 rounded-xl">
                            <HtmlContentRenderer content={screening.objectives} />
                          </div>
                        </div>
                      )}
                      {screening.methodology && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Methodology
                          </h4>
                          <div className="text-sm text-foreground leading-relaxed bg-muted/20 border border-border/60 p-4 rounded-xl">
                            <HtmlContentRenderer content={screening.methodology} />
                          </div>
                        </div>
                      )}
                      {screening.ethicalConsiderations && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Ethical Considerations
                          </h4>
                          <div className="text-sm text-foreground leading-relaxed bg-muted/20 border border-border/60 p-4 rounded-xl">
                            <HtmlContentRenderer content={screening.ethicalConsiderations} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* ── Team Tab ──────────────────────────────────────────────── */}
            <TabsContent value="team" className="pt-6 space-y-6">
              <Card className="shadow-xs border-border/60">
                <CardHeader className="border-b bg-muted/20 py-3.5 px-5">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Research Team & Investigators
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  {/* Principal Investigator Banner */}
                  <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background flex items-center gap-4 shadow-2xs">
                    <Avatar className="h-14 w-14 border-2 border-primary/40 shadow-xs shrink-0 ring-4 ring-primary/10">
                      <AvatarImage src={piPhoto} alt={piName} className="object-cover h-full w-full" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-black text-base">
                        {getInitials(piName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-bold text-foreground truncate">
                          {piName}
                        </p>
                        <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider bg-primary">
                          Principal Investigator
                        </Badge>
                      </div>
                      {screening.principalInvestigator?.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                          {screening.principalInvestigator.email}
                        </p>
                      )}
                      {screening.principalInvestigator?.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                          {screening.principalInvestigator.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Co-Investigators Grid */}
                  {screening.coInvestigators.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Co-Investigators ({screening.coInvestigators.length})
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                        {screening.coInvestigators.map((ci, idx) => {
                          const name =
                            (ci.name as string) ||
                            ((ci as Record<string, unknown>).stakeholderName as string) ||
                            "Team Member";
                          const role = (ci.role as string) || "Co-Investigator";
                          const email = (ci.email as string) || "";
                          const institution =
                            (ci.institution as string) ||
                            ((ci as Record<string, unknown>).organizationName as string) ||
                            "";

                          const ciPhotoRaw =
                            (ci.photoUrl as string) ||
                            (ci.photo_url as string) ||
                            (ci.avatarUrl as string) ||
                            (ci.photo as string);
                          const ciPhoto = getUserAvatarUrl(ciPhotoRaw);

                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors flex items-start gap-3.5 shadow-2xs border-l-4 border-l-emerald-500"
                            >
                              <Avatar className="h-10 w-10 border border-border/60 shrink-0 shadow-2xs">
                                <AvatarImage src={ciPhoto} alt={name} className="object-cover h-full w-full" />
                                <AvatarFallback className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                  {getInitials(name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="text-sm font-bold text-foreground truncate">{name}</p>
                                  <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 shrink-0 font-semibold">
                                    Member
                                  </Badge>
                                </div>
                                <p className="text-xs text-primary font-semibold">{role}</p>
                                {email && (
                                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{email}</span>
                                  </p>
                                )}
                                {institution && (
                                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{institution}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-xl border border-dashed border-border/60">
                      No co-investigators registered for this proposal.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Documents Tab ─────────────────────────────────────────── */}
            <TabsContent value="documents" className="pt-6 space-y-6">
              {screening.attachments.length > 0 ? (
                <div className="space-y-4">
                  {/* Document Sub-navigation */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 rounded-xl border border-border/60 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/50 w-full sm:w-auto">
                      {screening.attachments.map((att, idx) => {
                        const isActive = att.id === (activeDoc?.id || screening.attachments[0]?.id);
                        const resolved = resolveFileUrl(att.url) || att.url || "";
                        const kind = getConceptNoteAttachmentKind(resolved);

                        const lower = (att.name || "").toLowerCase();
                        let label = "Proposal File";
                        if (lower.includes("budget") || lower.includes("finance") || lower.includes("supporting") || idx === 1) {
                          label = "Budget File";
                        } else if (idx > 1) {
                          label = `Supporting File ${idx}`;
                        }

                        return (
                          <Button
                            key={att.id}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-md gap-2"
                            onClick={() => setActiveDocKey(att.id)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>{label}</span>
                            <Badge
                              variant={isActive ? "secondary" : "outline"}
                              className="text-[9px] uppercase px-1.5 py-0 font-bold"
                            >
                              {kind.toUpperCase()}
                            </Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline Document Previewer */}
                  {activeDoc?.url ? (
                    <EmbeddedViewer
                      url={activeDoc.url}
                      title={activeDoc.name}
                    />
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-bold text-muted-foreground">No Document Selected</h3>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 text-center border-2 border-dashed rounded-xl bg-card">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-bold text-muted-foreground">No Uploaded Files</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    No proposal documents or supporting files were attached to this submission.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── Budget & Recommendations Tab ─────────────────────────── */}
            <TabsContent value="budget" className="pt-6 space-y-6">
              <Card className="shadow-xs border-border/60">
                <CardHeader className="border-b bg-muted/20 py-3.5 px-5">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Budget Allocation & Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 p-4 bg-muted/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        Requested Total
                      </span>
                      <span className="text-2xl font-black text-foreground block mt-1.5 font-mono">
                        {formatCurrency(screening.budget?.total)}
                      </span>
                    </div>

                    <div className={cn(
                      "rounded-xl border p-4",
                      screening.fundingStatus?.approvedAmount
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-muted/20 border-border/60"
                    )}>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        Approved Funding Amount
                      </span>
                      <span className={cn(
                        "text-2xl font-black block mt-1.5 font-mono",
                        screening.fundingStatus?.approvedAmount
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground"
                      )}>
                        {screening.fundingStatus?.approvedAmount
                          ? formatCurrency(screening.fundingStatus.approvedAmount)
                          : "Pending Determination"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasRecommendations && (
                <Card className="shadow-xs border-border/60">
                  <CardHeader className="border-b bg-muted/20 py-3.5 px-5">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Funding Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {screening.fundingStatus!.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border border-border/60 p-4 bg-muted/10 space-y-3"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Recommended Amount
                            </span>
                            <span className="text-xl font-black text-foreground font-mono block mt-0.5">
                              {formatCurrency(rec.amount)}
                            </span>
                          </div>
                          {rec.recommendedAt && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(rec.recommendedAt)}
                            </div>
                          )}
                        </div>
                        {rec.amountInWords && (
                          <p className="text-xs font-medium text-foreground italic bg-background border border-border/60 p-3 rounded-lg capitalize">
                            &ldquo;{rec.amountInWords}&rdquo;
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold",
                              rec.hasEthicalClearanceApproval
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "border border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
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
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                              Committee Comments
                            </span>
                            <p className="text-xs text-foreground leading-relaxed bg-background border border-border/60 p-3 rounded-lg">
                              {rec.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Decision & Remarks Tab ────────────────────────────────── */}
            <TabsContent value="decision" className="pt-6 space-y-6">
              <Card className="shadow-xs border-border/60">
                <CardHeader className="border-b bg-muted/20 py-3.5 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Recorded Funding Decision
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={openFundingModal}
                    className="gap-2 text-xs font-semibold"
                  >
                    Update Decision
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Funding Decision Status
                      </span>
                      <div className="pt-1">
                        <StatusBadge status={fundingDecisionStatus} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        IRB Ethical Clearance
                      </span>
                      <div className="pt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            (screening.fundingStatus as any)?.allowPostFundingIrb ||
                              (screening.fundingStatus as any)?.ethicalClearanceRequirement === "required_post_funding"
                              ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                              : screening.fundingStatus?.needIrbEthicalClearance
                                ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
                          )}
                        >
                          {(screening.fundingStatus as any)?.allowPostFundingIrb ||
                            (screening.fundingStatus as any)?.ethicalClearanceRequirement === "required_post_funding"
                            ? "Required (Post-Funding Allowed)"
                            : screening.fundingStatus?.needIrbEthicalClearance
                              ? "Required before disbursement"
                              : "Not Required"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {screening.fundingStatus?.ethicalClearanceStatus && (
                    <div className="flex justify-between items-center py-3 border-b border-border/60">
                      <span className="text-muted-foreground font-medium text-xs">
                        Ethical Clearance Verification
                      </span>
                      <Badge
                        className={cn(
                          "capitalize text-xs font-semibold",
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

                  {screening.fundingStatus?.remark ? (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        Committee Remarks & Justification
                      </span>
                      <div className="text-xs text-foreground leading-relaxed bg-muted/20 border border-border/60 p-4 rounded-xl whitespace-pre-line">
                        {screening.fundingStatus.remark}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-xl border border-dashed border-border/60">
                      No committee remarks recorded yet. Click &quot;Update Decision&quot; above to submit funding determination notes.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* Sticky Sidebar                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          {/* Proposal Details Card */}
          <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/40 border-b py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Proposal & Funding Details
              </CardTitle>
              {screening.id && (
                <Badge variant="outline" className="font-mono text-[10px] bg-background border-border/60 font-bold px-2 py-0.5">
                  {screening.id.toUpperCase()}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Decision</span>
                <StatusBadge status={fundingDecisionStatus} />
              </div>

              {/* PI Profile Card */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
                  <AvatarImage src={piPhoto} alt={piName} className="object-cover h-full w-full" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(piName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Investigator</p>
                  <p className="text-xs font-bold text-foreground truncate">{piName}</p>
                </div>
              </div>

              {/* Requested Budget Highlight */}
              {screening.budget?.total ? (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-background border border-emerald-500/20 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                        Requested Budget
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {formatCurrency(screening.budget.total)}
                  </span>
                </div>
              ) : null}

              {/* Classification Grid */}
              <div className="space-y-2.5 text-xs pt-1">
                {screening.institution && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Institution</span>
                    <span className="font-bold text-foreground text-right truncate max-w-[170px]">{screening.institution}</span>
                  </div>
                )}

                {screening.researchArea && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Research Area</span>
                    <Badge variant="secondary" className="font-bold text-[10px] text-right truncate max-w-[170px] bg-primary/10 text-primary border-none">
                      {screening.researchArea}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground font-medium">IRB Required</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      (screening.fundingStatus as any)?.allowPostFundingIrb ||
                        (screening.fundingStatus as any)?.ethicalClearanceRequirement === "required_post_funding"
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                        : screening.fundingStatus?.needIrbEthicalClearance
                          ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                          : "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
                    )}
                  >
                    {(screening.fundingStatus as any)?.allowPostFundingIrb ||
                      (screening.fundingStatus as any)?.ethicalClearanceRequirement === "required_post_funding"
                      ? "Yes (Post-Funding Allowed)"
                      : screening.fundingStatus?.needIrbEthicalClearance
                        ? "Yes"
                        : "No"}
                  </Badge>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3.5 border-t border-border/40">
                <Button
                  onClick={openFundingModal}
                  className="w-full gap-2 font-semibold shadow-xs text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  Record Funding Decision
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review Pipeline Card */}
          <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/40 border-b py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Review Pipeline Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
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
                  label: "Budget Review",
                  value: screening.reviewStatus?.financialReview,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b border-border/40 last:border-b-0"
                >
                  <span className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </span>
                  <Badge className={cn("capitalize text-[10px]", statusBadgeClass(item.value))}>
                    {statusIcon(item.value)}
                    <span className="ml-1">
                      {item.value?.replace(/_/g, " ") || "N/A"}
                    </span>
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Funding Decision Dialog                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isFundingModalOpen} onOpenChange={setIsFundingModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[680px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl overflow-x-hidden shadow-2xl">
          {/* Dynamic Colored Header */}
          <div
            className={cn(
              "p-4 sm:p-6 pb-4 border-b transition-colors duration-200",
              fundingDecision === "approved" &&
              "bg-emerald-500/10 border-emerald-500/20",
              (fundingDecision === "rejected" || fundingDecision === "not_accepted") &&
              "bg-rose-500/10 border-rose-500/20",
              !fundingDecision &&
              "bg-muted/30 border-border",
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {fundingDecision === "approved" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                {(fundingDecision === "rejected" || fundingDecision === "not_accepted") && (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                Funding Decision
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed space-y-1 text-xs">
                <span className="block">
                  {fundingDecision === "approved" &&
                    "This proposal is approved for funding and will proceed to award generation."}
                  {(fundingDecision === "rejected" || fundingDecision === "not_accepted") &&
                    "This proposal is not accepted. The submitter will be notified of the decision."}
                  {!fundingDecision &&
                    "Select a decision below to record the committee's funding determination."}
                </span>
                <span className="block text-xs text-muted-foreground font-medium truncate">
                  Proposal: {screening.title}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Dialog Body */}
          <div className="p-4 sm:p-6 space-y-6 bg-background">
            {/* Decision Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Decision Selection <span className="text-rose-500">*</span>
              </label>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full"
                role="radiogroup"
                aria-label="Funding decision"
              >
                {[
                  {
                    value: "approved",
                    icon: CheckCircle2,
                    label: "Approved",
                    description: "Proceed to award generation",
                    selectedBorder: "border-emerald-500",
                    selectedBg: "bg-emerald-50 dark:bg-emerald-950/20",
                    selectedRing: "ring-emerald-500/25",
                    selectedText: "text-emerald-700 dark:text-emerald-400",
                    iconColor: "text-emerald-600",
                    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
                  },
                  {
                    value: "rejected",
                    icon: AlertCircle,
                    label: "Not Accepted",
                    description: "Notify PSR for Not Accepted status",
                    selectedBorder: "border-rose-500",
                    selectedBg: "bg-rose-50 dark:bg-rose-950/20",
                    selectedRing: "ring-rose-500/25",
                    selectedText: "text-rose-700 dark:text-rose-400",
                    iconColor: "text-rose-600",
                    iconBg: "bg-rose-100 dark:bg-rose-900/40",
                  },
                ].map((option) => {
                  const isSelected =
                    fundingDecision === option.value ||
                    (option.value === "rejected" && fundingDecision === "not_accepted");
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
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-3.5 transition-all duration-200 text-center cursor-pointer min-w-0 w-full",
                        isSelected
                          ? cn(
                            option.selectedBorder,
                            option.selectedBg,
                            "ring-2",
                            option.selectedRing,
                            "shadow-xs",
                          )
                          : "border-border hover:border-border/80 hover:bg-muted/30 ring-2 ring-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-full p-2 transition-colors shrink-0",
                          isSelected
                            ? cn(option.iconBg, option.iconColor)
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 w-full">
                        <p
                          className={cn(
                            "text-xs font-bold truncate",
                            isSelected ? option.selectedText : "text-foreground",
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 break-words">
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

            {/* Ethical Clearance Requirement */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  Ethical Clearance Requirement <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  Select Policy Option
                </span>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 min-w-0 w-full"
                role="radiogroup"
                aria-label="Ethical clearance requirement"
              >
                {[
                  {
                    value: "yes",
                    title: "Yes, Required",
                    badge: "Pre-Funding",
                    description: "Ethical approval must be obtained before funding is released.",
                    icon: ShieldAlert,
                    selectedBorder: "border-amber-500",
                    selectedBg: "bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-amber-950/10",
                    selectedRing: "ring-amber-500/30",
                    selectedText: "text-amber-800 dark:text-amber-300",
                    iconColor: "text-amber-600 dark:text-amber-400",
                    iconBg: "bg-amber-100 dark:bg-amber-900/60",
                    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200/60",
                  },
                  {
                    value: "required_post_funding",
                    title: "Required (Post-Funding)",
                    badge: "Post Funding",
                    description: "Required, but can submit IRB clearance after funding recommendation.",
                    icon: FileClock,
                    selectedBorder: "border-indigo-500",
                    selectedBg: "bg-gradient-to-b from-indigo-500/10 to-indigo-500/5 dark:from-indigo-950/40 dark:to-indigo-950/10",
                    selectedRing: "ring-indigo-500/30",
                    selectedText: "text-indigo-800 dark:text-indigo-300",
                    iconColor: "text-indigo-600 dark:text-indigo-400",
                    iconBg: "bg-indigo-100 dark:bg-indigo-900/60",
                    badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200/60",
                  },
                  {
                    value: "no",
                    title: "No, Not Required",
                    badge: "Exempt",
                    description: "No additional IRB or ethical clearance approval needed.",
                    icon: ShieldOff,
                    selectedBorder: "border-slate-500",
                    selectedBg: "bg-gradient-to-b from-slate-500/10 to-slate-500/5 dark:from-slate-800/40 dark:to-slate-900/10",
                    selectedRing: "ring-slate-500/30",
                    selectedText: "text-slate-800 dark:text-slate-200",
                    iconColor: "text-slate-600 dark:text-slate-400",
                    iconBg: "bg-slate-100 dark:bg-slate-800",
                    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60",
                  },
                ].map((opt) => {
                  const isSelected = requiresEthicalClearance === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setRequiresEthicalClearance(opt.value);
                        if (formErrors.requiresEthicalClearance) {
                          setFormErrors((current) => ({
                            ...current,
                            requiresEthicalClearance: undefined,
                          }));
                        }
                      }}
                      className={cn(
                        "relative flex flex-col justify-between rounded-xl border-2 p-3 sm:p-3.5 text-left transition-all duration-200 cursor-pointer group hover:shadow-md min-w-0 w-full overflow-hidden",
                        isSelected
                          ? cn(
                            opt.selectedBorder,
                            opt.selectedBg,
                            "ring-2",
                            opt.selectedRing,
                            "shadow-xs",
                          )
                          : "border-border/70 hover:border-border hover:bg-muted/40 ring-2 ring-transparent",
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                          <div
                            className={cn(
                              "rounded-lg p-1.5 sm:p-2 shrink-0 transition-transform duration-200 group-hover:scale-105",
                              isSelected
                                ? cn(opt.iconBg, opt.iconColor)
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 truncate max-w-full",
                              opt.badgeClass,
                            )}
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center transition-all duration-150 mt-0.5 shrink-0",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground scale-110"
                              : "border-muted-foreground/30 bg-transparent group-hover:border-muted-foreground/60",
                          )}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-2.5 sm:mt-3 space-y-1 min-w-0 w-full">
                        <p
                          className={cn(
                            "text-xs font-bold leading-tight break-words",
                            isSelected ? opt.selectedText : "text-foreground",
                          )}
                        >
                          {opt.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {formErrors.requiresEthicalClearance ? (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formErrors.requiresEthicalClearance}
                </p>
              ) : null}
            </div>

            {/* Committee Remarks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Committee Remarks <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">
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
                  "min-h-[100px] resize-none focus-visible:ring-primary/50 text-xs shadow-xs",
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

          {/* Dialog Footer */}
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFundingModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !fundingDecision}
              className={cn(
                "shadow-xs font-semibold gap-2",
                fundingDecision === "approved" &&
                "bg-emerald-600 hover:bg-emerald-700 text-white",
                (fundingDecision === "rejected" || fundingDecision === "not_accepted") &&
                "bg-rose-600 hover:bg-rose-700 text-white",
                !fundingDecision && "bg-primary hover:bg-primary/90",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {fundingDecision === "approved"
                    ? "Confirm Approval"
                    : fundingDecision === "rejected" || fundingDecision === "not_accepted"
                      ? "Confirm Decision (Not Accepted)"
                      : "Submit Decision"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
