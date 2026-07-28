"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Shield,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import {
  getIndividualReviewById,
  type IndividualReviewDetail,
} from "@/api/services";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { THEMATIC_AREAS } from "@/lib/constants";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";

// ── Status display config ──────────────────────────────────────────────────────
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
  revision_required: { label: "Revision Required", className: "bg-orange-100 text-orange-700 border-orange-200" },
  protocol_stage: { label: "Protocol Stage", className: "bg-violet-100 text-violet-700 border-violet-200" },
};

function StatusBadge({ status, displayLabel }: { status?: string | null; displayLabel?: string | null }) {
  const normalizedKey = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  const cfg = STATUS_DISPLAY[normalizedKey] ?? {
    label: displayLabel || (status ? status.replace(/_/g, " ") : "Screening Under Review"),
    className: "bg-muted text-muted-foreground border-border",
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

function formatBudget(val: any): string {
  if (!val) return "N/A";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `ETB ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function EmbeddedViewer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No document attached to proposal</p>
      </div>
    );
  }

  const resolvedUrl = resolveFileUrl(url) || url;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 shadow-xs bg-card">
        <PdfViewer url={resolvedUrl} title={title} className="h-[750px] w-full" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-[#ededed] dark:bg-muted/30 shadow-xs">
        <WordViewer url={resolvedUrl} title={title} className="h-[750px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-16 text-center shadow-2xs">
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
            <ExternalLink className="mr-2 h-4 w-4" /> Open File
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

type GroupedCategoryResponse = {
  id: string;
  name: string;
  responses: NonNullable<IndividualReviewDetail["responses"]>;
};

export default function TechnicalReviewDetailPage() {
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const router = useRouter();
  const [review, setReview] = useState<IndividualReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [activeDocKey, setActiveDocKey] = useState<string>("proposal");
  const [isCopiedRef, setIsCopiedRef] = useState(false);

  useEffect(() => {
    async function loadReview() {
      try {
        const response = await getIndividualReviewById(id as string);
        setReview(response);
        setHasError(false);
      } catch (error) {
        console.error("Error loading individual review:", error);
        toast.error("Failed to load technical review details");
        setReview(null);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadReview();
  }, [id]);

  const proposal = review?.screening?.proposal;

  const handleCopyRef = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setIsCopiedRef(false), 2000);
  };

  const proposalReference =
    proposal?.referenceNumber || `PRP-${proposal?.id ?? id}`;
  const proposalTitle = proposal?.title || "Untitled Proposal";
  const proposalStatus =
    proposal?.status || review?.screening?.status || "screening_under_review";
  const thematicArea = proposal?.thematicAreas?.[0]?.name || "Unspecified Area";
  const organizationName = proposal?.Organization?.name || proposal?.receivingOffice?.name || "—";
  const callTitle = proposal?.call?.title || "—";
  const submittedAt =
    proposal?.submittedAt || review?.screening?.createdAt || null;

  const responses = review?.responses || [];
  const maxPossiblePoints = responses.reduce(
    (sum, r) => sum + (r.question?.maxPoints ?? 0),
    0,
  );
  const totalScore = review?.totalScore ?? 0;
  const scorePercent =
    maxPossiblePoints > 0
      ? Math.round((totalScore / maxPossiblePoints) * 100)
      : 0;

  const thematicAreaLabel =
    THEMATIC_AREAS.find(
      (area) => area.value === proposal?.thematicAreas?.[0]?.name,
    )?.label || thematicArea;

  // ── Document list extraction ─────────────────────────────────────────────
  const documentList = useMemo(() => {
    const rawProp = proposal as any;
    const items: Array<{ key: string; label: string; filePath: string }> = [];

    const mainFile =
      rawProp?.proposalFile ||
      rawProp?.proposal_file ||
      rawProp?.conceptNoteFile ||
      rawProp?.concept_note_file ||
      rawProp?.attachment ||
      rawProp?.fullProposalDocument ||
      rawProp?.documentUrl;

    if (mainFile) {
      items.push({ key: "proposal", label: "Proposal Document", filePath: mainFile });
    }

    const updatedFile = rawProp?.updatedProposal || rawProp?.updated_proposal;
    if (updatedFile) {
      items.push({ key: "updated", label: "Revised Proposal", filePath: updatedFile });
    }

    // const supportingFile = rawProp?.supportingDocs || rawProp?.supporting_docs;
    // if (supportingFile) {
    //   items.push({ key: "supporting", label: "Supporting Documents", filePath: supportingFile });
    // }

    if (review?.attachment) {
      items.push({ key: "review_attachment", label: "Evaluation Attachment", filePath: review.attachment });
    }

    return items;
  }, [proposal, review]);

  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  // ── Group responses by question category ─────────────────────────────────
  const categoryGroups = useMemo<GroupedCategoryResponse[]>(() => {
    if (!responses || responses.length === 0) return [];
    const map = new Map<string, GroupedCategoryResponse>();

    responses.forEach((resp) => {
      const cat = resp.question?.category;
      const catId = String(cat?.id ?? "uncategorized");
      const catName = cat?.name || "Evaluation Criteria";

      const existing = map.get(catId);
      if (existing) {
        existing.responses.push(resp);
      } else {
        map.set(catId, { id: catId, name: catName, responses: [resp] });
      }
    });

    return Array.from(map.values());
  }, [responses]);

  const isReviewed = review?.reviewStatus === "reviewed";

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading Technical Review Detail...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-2xl" />
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

  // ── Error State ──────────────────────────────────────────────────────────
  if (hasError || !review || !proposal) {
    return (
      <PageContainer
        title="Review Not Found"
        description="The requested individual review detail could not be loaded."
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/technical-reviews")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-300">
                  Technical Review Unavailable
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  The requested review detail could not be loaded. Please return to the technical reviews list.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/research/proposals/technical-reviews")}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Return to List
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={proposalTitle}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={() => handleCopyRef(proposalReference)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{proposalReference}</span>
            {isCopiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
          <StatusBadge status={proposalStatus} displayLabel={proposal.statusDisplay} />
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
            {thematicAreaLabel}
          </Badge>
        </div>
      }
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main Content Column ────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Unified Tab Bar Header */}
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
                  value="responses"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  Review Responses
                  {responses.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold bg-primary/10 text-primary border-none rounded-md">
                      {responses.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  Proposal Document
                  {documentList.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-border/60 text-muted-foreground rounded-md">
                      {documentList.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Overview Tab ──────────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-6 space-y-6">
              {/* Requested Budget & Period Banner (if present) */}
              {(proposal as any)?.budgetRequested && (
                <Card className="shadow-sm border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-background overflow-hidden">
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
                          {formatBudget((proposal as any).budgetRequested)}
                        </p>
                      </div>
                    </div>

                    {(proposal as any)?.startDate && (proposal as any)?.endDate && (
                      <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 border-border/60">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Project Period
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {new Date((proposal as any).startDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" — "}
                            {new Date((proposal as any).endDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Review Evaluation Progress Highlight Card */}
              <Card className="shadow-sm border-primary/15 bg-primary/5 overflow-hidden">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-primary/15 text-primary shrink-0">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">Technical Review Score</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-extrabold uppercase px-2 py-0.5",
                            isReviewed
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-amber-100 text-amber-700 border-amber-200",
                          )}
                        >
                          {isReviewed ? "Review Completed" : "Review Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isReviewed
                          ? `Evaluation submitted with ${responses.length} criteria scored.`
                          : "This technical review is pending completion. Scored criteria will be displayed below once evaluated."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 border-border/60 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Overall Score
                      </p>
                      <p className={cn(
                        "text-2xl font-black font-mono",
                        scorePercent >= 70 ? "text-emerald-600" : scorePercent >= 50 ? "text-amber-600" : "text-rose-600",
                      )}>
                        {scorePercent}%
                      </p>
                    </div>
                    {maxPossiblePoints > 0 && (
                      <Badge variant="outline" className="text-xs font-semibold px-2 py-1 bg-background border-border/60">
                        {totalScore} / {maxPossiblePoints} pts
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Abstract */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Proposal Abstract
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <HtmlContentRenderer
                      content={(proposal as any)?.abstract || proposal.shortAbstract || "No abstract provided for this proposal."}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Research Scope Context */}

            </TabsContent>

            {/* ── Responses Tab ─────────────────────────────────────────────── */}
            <TabsContent value="responses" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5 overflow-hidden">
                <CardHeader className="bg-muted/40 border-b py-3.5 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Technical Evaluation Responses
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5">
                    {responses.length} Criteria Scored
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {categoryGroups.length > 0 ? (
                    categoryGroups.map((group) => (
                      <div key={group.id} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {group.name}
                          </h4>
                          <Badge variant="secondary" className="ml-auto text-[10px] font-bold">
                            {group.responses.length} item{group.responses.length === 1 ? "" : "s"}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {group.responses.map((response) => {
                            const maxPts = response.question?.maxPoints ?? 0;
                            const earned = response.points_earned;
                            const responsePercent =
                              maxPts > 0 ? Math.round((earned / maxPts) * 100) : 0;
                            return (
                              <div
                                key={response.id}
                                className="rounded-xl border border-border bg-card p-4 space-y-2 hover:shadow-xs transition-shadow"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                                    {response.question?.text ||
                                      `Question ${response.question_id ?? response.id}`}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] uppercase font-bold shrink-0",
                                      responsePercent >= 70
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : responsePercent >= 50
                                          ? "bg-amber-50 text-amber-600 border-amber-200"
                                          : "bg-rose-50 text-rose-600 border-rose-200",
                                    )}
                                  >
                                    {responsePercent}%
                                    <span className="font-normal text-muted-foreground ml-1">
                                      ({earned} / {maxPts} pts)
                                    </span>
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-muted/10">
                      <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <h3 className="font-bold text-foreground text-sm">
                        No Scored Responses Yet
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                        This individual review has not recorded scored responses yet. Click "Open Review Form" to complete evaluation.
                      </p>
                    </div>
                  )}

                  {review?.comments && (
                    <div className="pt-4 border-t border-dashed space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                        Reviewer Summary Remarks
                      </div>
                      <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-sm text-foreground leading-relaxed italic border-l-4 border-l-primary/40">
                        &ldquo;{review.comments}&rdquo;
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Documents Tab ─────────────────────────────────────────────── */}
            <TabsContent value="documents" className="pt-6 space-y-6">
              {documentList.length > 0 ? (
                <div className="space-y-4">
                  {/* Document Sub-navigation Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 rounded-xl border border-border/60 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/50 w-full sm:w-auto">
                      {documentList.map((doc) => {
                        const isActive = doc.key === (activeDoc?.key || documentList[0]?.key);
                        const resolved = resolveFileUrl(doc.filePath) || doc.filePath || "";
                        const kind = getConceptNoteAttachmentKind(resolved);
                        return (
                          <Button
                            key={doc.key}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-md gap-2"
                            onClick={() => setActiveDocKey(doc.key)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {doc.label}
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
                  {activeDoc?.filePath ? (
                    <EmbeddedViewer
                      url={activeDoc.filePath}
                      title={activeDoc.label}
                    />
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-bold text-muted-foreground">No Document Selected</h3>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-card">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-bold text-muted-foreground">No Uploaded Files</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    No proposal documents or supporting files were attached to this submission.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar Column ────────────────────────────────────────────────── */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          {/* Review Details Card */}
          <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/40 border-b py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Review Details
              </CardTitle>
              {proposal.referenceNumber && (
                <Badge variant="outline" className="font-mono text-[10px] bg-background border-border/60 font-bold px-2 py-0.5">
                  {proposal.referenceNumber}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Status</span>
                <StatusBadge status={proposalStatus} displayLabel={proposal.statusDisplay} />
              </div>

              {/* Technical Review Score Highlight */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                    <ClipboardCheck className="h-3.5 w-3.5" /> Technical Review Score
                  </span>
                  <span className={cn(
                    "text-sm font-black font-mono",
                    scorePercent >= 70 ? "text-emerald-600" : scorePercent >= 50 ? "text-amber-600" : "text-rose-600",
                  )}>
                    {scorePercent}%
                  </span>
                </div>
                {maxPossiblePoints > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          scorePercent >= 70 ? "bg-emerald-500" : scorePercent >= 50 ? "bg-amber-400" : "bg-rose-500",
                        )}
                        style={{ width: `${Math.min(scorePercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right font-medium">
                      {totalScore} / {maxPossiblePoints} pts &bull; {responses.length} criteria scored
                    </p>
                  </div>
                )}
              </div>

              {/* Grant Call Info */}
              {proposal.call && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary tracking-wider">
                    <Tag className="h-3 w-3" />
                    Grant Call
                  </div>
                  <p className="text-xs font-bold text-foreground leading-snug break-words">
                    {proposal.call.title}
                  </p>
                </div>
              )}

              {/* Classification Grid */}
              <div className="space-y-2.5 text-xs pt-1">
                {thematicAreaLabel && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Thematic Area</span>
                    <Badge variant="secondary" className="font-bold text-[10px] text-right truncate max-w-[170px] bg-primary/10 text-primary border-none">
                      {thematicAreaLabel}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
                  <span className="text-muted-foreground font-medium">Submission Date</span>
                  <span className="font-semibold text-foreground text-right">{formatDate(submittedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Context (Strict Owner Privacy Enforced) */}
          <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/40 border-b py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Detail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">


              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {organizationName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Primary Receiving Office
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {callTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Research Call
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {thematicAreaLabel}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Thematic Area
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments Card */}
          {/* <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/40 border-b py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {review.attachment ? (
                <a
                  href={resolveFileUrl(review.attachment) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Paperclip className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold truncate max-w-[150px]">
                        Review Document
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Attached evaluation file
                      </p>
                    </div>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground italic">
                  No review attachment uploaded
                </div>
              )}
            </CardContent>
          </Card> */}
        </aside>
      </div>
    </PageContainer>
  );
}
