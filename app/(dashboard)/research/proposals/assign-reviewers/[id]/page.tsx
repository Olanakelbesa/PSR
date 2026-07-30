"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  Tag,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { ReviewerPoolList, type ReviewerPoolItem } from "@/components/research/reviewers";
import { PdfViewerDialog } from "@/components/shared";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
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
};

function getUserAvatarUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl || photoUrl === "#") return undefined;
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

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

// ── Reviewer border colors ─────────────────────────────────────────────────────
const REVIEWER_BORDER_COLORS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
];

function hasReviewContent(review: ScreeningTechnicalReview | any, reviewer?: any): boolean {
  if (reviewer?.isCompleted || (reviewer?.totalScore != null && reviewer.totalScore > 0)) {
    return true;
  }
  if (!review) return false;
  const responses = review.responses ?? review.technical_review_responses ?? [];
  return Boolean(
    review.hasResponses ||
    (Array.isArray(responses) && responses.length > 0) ||
    (review.totalScore != null && Number(review.totalScore) > 0) ||
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
  responses: ScreeningTechnicalReviewResponse[] | any[],
): CategoryGroup[] {
  if (!Array.isArray(responses)) return [];
  const map = new Map<string, CategoryGroup>();
  for (const resp of responses) {
    const q = resp.question ?? resp.question_detail ?? resp;
    const cat = q?.category ?? q?.question_category ?? resp.category;
    const catId = cat?.id ?? "uncategorized";
    const catName = cat?.name || "Evaluation Criteria";
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

// ── Page Component ────────────────────────────────────────────────────────────
export default function AssignReviewersDetailPage() {
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const router = useRouter();
  const screeningId = useMemo(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    return rawId ? String(rawId) : "";
  }, [id]);
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<string>(tabParam || "overview");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [screening, setScreening] = useState<Screening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeDocKey, setActiveDocKey] = useState<string>("proposal");
  const [isCopiedRef, setIsCopiedRef] = useState(false);
  const [viewingFile, setViewingFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  // Manage expanded reviewer cards state (stores stringified reviewer IDs)
  const [expandedReviewerIds, setExpandedReviewerIds] = useState<Set<string>>(new Set());

  const handleCopyRef = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setIsCopiedRef(false), 2000);
  };

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
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Failed to load screening detail:", error?.message || error);
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

  const proposal = (screening?.proposal ?? null) as ScreeningProposalDetail | null;
  const rawProposal = proposal as any;
  const assignedReviewers = (screening?.assignedReviewers ?? []) as ScreeningAssignedReviewer[];

  // ── Multi-location extraction for technicalReviews ──────────────────────────
  const technicalReviews = useMemo(() => {
    const reviewsFromProposal =
      proposal?.reviewHistory?.technicalReviews ??
      (proposal as any)?.reviewHistory?.technical_reviews ??
      (proposal as any)?.technicalReviews ??
      (proposal as any)?.technical_reviews ??
      [];
    const reviewsFromScreening =
      (screening as any)?.technicalReviews ??
      (screening as any)?.technical_reviews ??
      (screening as any)?.reviewHistory?.technicalReviews ??
      (screening as any)?.review_history?.technical_reviews ??
      [];

    if (Array.isArray(reviewsFromProposal) && reviewsFromProposal.length > 0) return reviewsFromProposal;
    if (Array.isArray(reviewsFromScreening) && reviewsFromScreening.length > 0) return reviewsFromScreening;
    return [];
  }, [proposal, screening]);

  // ── Map technical reviews by reviewer ID ──────────────────────────────────────
  const reviewByReviewerId = useMemo(() => {
    const map = new Map<string, ScreeningTechnicalReview>();
    for (const review of technicalReviews) {
      const revId = review.reviewer?.id ?? (review as any).reviewer_id ?? (review as any).reviewerId;
      if (revId != null) {
        map.set(String(revId), review);
      }
    }
    return map;
  }, [technicalReviews]);

  // ── Resolver function to find review for an assigned reviewer ────────────────
  const getReviewForReviewer = (reviewer: any): ScreeningTechnicalReview | undefined => {
    if (!reviewer) return undefined;

    // 1. Direct ID match
    const reviewerId = reviewer.id ?? reviewer.reviewerId ?? reviewer.reviewer_id;
    if (reviewerId != null) {
      const directMatch = reviewByReviewerId.get(String(reviewerId));
      if (directMatch) return directMatch;
    }

    // 2. Email fallback match
    const reviewerEmail = (reviewer.email || "").toLowerCase().trim();
    if (reviewerEmail) {
      const emailMatch = technicalReviews.find((r: any) =>
        (r.reviewer?.email || r.email || "").toLowerCase().trim() === reviewerEmail
      );
      if (emailMatch) return emailMatch;
    }

    // 3. Name fallback match
    const reviewerName = (reviewer.fullName || reviewer.name || "").toLowerCase().trim();
    if (reviewerName) {
      const nameMatch = technicalReviews.find((r: any) =>
        (r.reviewer?.fullName || r.reviewer?.name || "").toLowerCase().trim() === reviewerName
      );
      if (nameMatch) return nameMatch;
    }

    return undefined;
  };

  const submittedReviews = useMemo(
    () => technicalReviews.filter((r) => hasReviewContent(r)),
    [technicalReviews],
  );

  const maxPossiblePoints = (screening as any)?.maxPossiblePoints ?? 0;

  const averageScore = useMemo(() => {
    const scored = submittedReviews.filter(
      (review) => review.totalScore != null,
    );
    if (!scored.length) return (screening as any)?.averageScorePercentage != null ? (screening as any).averageScorePercentage : null;
    const total = scored.reduce(
      (sum, review) => sum + Number(review.totalScore ?? 0),
      0,
    );
    return total / scored.length;
  }, [submittedReviews, screening]);

  const averageScorePct = useMemo(() => {
    if ((screening as any)?.averageScorePercentage != null) {
      return Math.round(Number((screening as any).averageScorePercentage));
    }
    if (averageScore == null || !maxPossiblePoints) return null;
    return Math.round((averageScore / maxPossiblePoints) * 100);
  }, [averageScore, maxPossiblePoints, screening]);

  // ── Auto-expand submitted reviewer cards on load ────────────────────────────
  useEffect(() => {
    if (assignedReviewers.length > 0) {
      setExpandedReviewerIds((prev) => {
        if (prev.size > 0) return prev;
        const initialExpanded = new Set<string>();
        assignedReviewers.forEach((reviewer) => {
          const review = getReviewForReviewer(reviewer);
          if (hasReviewContent(review, reviewer)) {
            initialExpanded.add(String(reviewer.id));
          }
        });
        if (initialExpanded.size === 0 && assignedReviewers[0]?.id != null) {
          initialExpanded.add(String(assignedReviewers[0].id));
        }
        return initialExpanded;
      });
    }
  }, [assignedReviewers.length, technicalReviews.length]);

  const reviewerPoolItems = useMemo<ReviewerPoolItem[]>(() => {
    return assignedReviewers.map((reviewer) => {
      const review = getReviewForReviewer(reviewer);
      const isCompleted = hasReviewContent(review, reviewer);
      const totalScore = reviewer.totalScore ?? review?.totalScore ?? null;
      const scorePct =
        reviewer.scorePercentage ??
        (totalScore != null && maxPossiblePoints > 0
          ? Math.round((Number(totalScore) / maxPossiblePoints) * 100)
          : null);

      return {
        id: reviewer.id,
        fullName: reviewer.fullName || "Unknown Reviewer",
        email: reviewer.email || "",
        role: reviewer.role,
        photoUrl: (reviewer as any).photoUrl || (reviewer as any).photo_url,
        isCompleted,
        totalScore,
        scorePercentage: scorePct,
        reviewData: review,
      };
    });
  }, [assignedReviewers, technicalReviews, maxPossiblePoints]);

  const documentList = useMemo(() => {
    if (!proposal) return [];
    return [
      { key: "proposal", label: "Proposal Document", filePath: proposal.proposalFile },
      { key: "updated", label: "Revised Proposal", filePath: proposal.updatedProposal },
      { key: "supporting", label: "Supporting Documents", filePath: proposal.supportingDocs },
    ].filter((f) => Boolean(f.filePath));
  }, [proposal]);

  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  const currentStatus = proposal?.status ?? screening?.status ?? "screening_under_review";

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
        description="The requested screening detail could not be loaded."
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
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900">
                  Screening Details Unavailable
                </h3>
                <p className="text-sm text-amber-800">
                  The screening details could not be loaded. Please try again or return to the reviewers list.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.refresh()}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const coInvestigators = (proposal.coInvestigators || []) as Array<any>;
  const rawTeamList = (rawProposal?.teamMembers || rawProposal?.team_members || coInvestigators) as Array<any>;

  const getValidUser = (obj: any) => {
    if (!obj || typeof obj !== "object") return null;
    if (obj.id || obj.email || obj.firstName || obj.memberName || obj.name) return obj;
    return null;
  };

  const pi =
    getValidUser(proposal.principalInvestigator) ||
    getValidUser(proposal.createdBy) ||
    getValidUser(rawProposal?.pi) ||
    {};

  const piFirstName = pi.firstName || pi.first_name || pi.memberName?.split(" ")[0] || "";
  const piLastName = pi.lastName || pi.last_name || pi.memberName?.split(" ").slice(1).join(" ") || "";
  const piName =
    [piFirstName, piLastName].filter(Boolean).join(" ") ||
    pi.name ||
    pi.memberName ||
    (pi.email ? pi.email.split("@")[0] : "") ||
    "Principal Investigator";
  const piEmail = pi.email || pi.memberEmail || "";
  const rawPiPhoto =
    pi.photoUrl ||
    pi.photo_url ||
    pi.avatarUrl ||
    pi.avatar ||
    pi.photo ||
    proposal.createdBy?.photoUrl ||
    proposal.createdBy?.photo_url ||
    proposal.createdBy?.photo ||
    proposal.principalInvestigator?.photoUrl ||
    proposal.principalInvestigator?.photo_url;
  const piAvatar = resolveFileUrl(rawPiPhoto) || (rawPiPhoto ? (rawPiPhoto.startsWith("http") ? rawPiPhoto : `http://127.0.0.1:8000${rawPiPhoto}`) : undefined);

  const hasSignature = Boolean(proposal.signature);

  return (
    <PageContainer
      title={proposal.title || "Untitled Proposal"}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={() => handleCopyRef(proposal.referenceNumber || `PRP-${proposal.id}`)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{proposal.referenceNumber || `PRP-${proposal.id}`}</span>
            {isCopiedRef ? (
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
            onClick={() =>
              router.push("/research/proposals/assign-reviewers")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  value="reviewers"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  Assigned Reviewers
                  {assignedReviewers.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold bg-primary/10 text-primary border-none rounded-md">
                      {submittedReviews.length}/{assignedReviewers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  Uploaded Documents
                  {documentList.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-border/60 text-muted-foreground rounded-md">
                      {documentList.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  Team Members
                  {rawTeamList.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-border/60 text-muted-foreground rounded-md">
                      {rawTeamList.length + 1}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  Status Logs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Overview Tab ──────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-6 space-y-6">
              {/* Requested Budget & Period Summary Banner */}
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
                        {formatBudget(proposal.budgetRequested)}
                      </p>
                    </div>
                  </div>

                  {proposal.startDate && proposal.endDate && (
                    <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 border-border/60">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Project Period
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(proposal.startDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" — "}
                          {new Date(proposal.endDate).toLocaleDateString("en-GB", {
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

              {/* Review Progress Summary Highlight Card */}
              <Card className="shadow-sm border-primary/15 bg-primary/5 overflow-hidden">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-primary/15 text-primary shrink-0">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">Reviewer Evaluation Status</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-extrabold uppercase px-2 py-0.5",
                            submittedReviews.length === assignedReviewers.length && assignedReviewers.length > 0
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : submittedReviews.length > 0
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {submittedReviews.length === assignedReviewers.length && assignedReviewers.length > 0
                            ? "All Complete"
                            : assignedReviewers.length === 0
                              ? "Unassigned"
                              : `${submittedReviews.length}/${assignedReviewers.length} Complete`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {assignedReviewers.length === 0
                          ? "No technical reviewers have been assigned to evaluate this proposal yet."
                          : `${submittedReviews.length} out of ${assignedReviewers.length} assigned reviewer(s) have submitted their evaluation scores.`}
                      </p>
                    </div>
                  </div>

                  {averageScorePct != null && (
                    <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 border-border/60 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Average Score
                        </p>
                        <p className={cn(
                          "text-2xl font-black font-mono",
                          averageScorePct >= 70 ? "text-emerald-600" : averageScorePct >= 50 ? "text-amber-600" : "text-rose-600",
                        )}>
                          {averageScorePct}%
                        </p>
                      </div>
                      {maxPossiblePoints > 0 && averageScore != null && (
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-1 bg-background border-border/60">
                          {averageScore.toFixed(1)} / {maxPossiblePoints} pts
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Abstract */}
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
                      content={proposal.abstract || "No abstract provided."}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Keywords */}
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
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Assigned Reviewers Tab ─────────────────────────────────── */}
            <TabsContent value="reviewers" className="pt-6 space-y-6">
              <ReviewerPoolList
                reviewers={reviewerPoolItems}
                maxPossiblePoints={maxPossiblePoints}
                overallAverageScorePct={averageScorePct}
                overallAverageScore={averageScore}
                submittedCount={submittedReviews.length}
                showManageAction={true}
                onManageReviewers={() =>
                  router.push(
                    `/research/proposals/assign-reviewers/${screening.id}/assign`,
                  )
                }
              />
            </TabsContent>

            {/* ── Documents Preview Tab ──────────────────────────────────── */}
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
                <div className="p-16 text-center border-2 border-dashed rounded-xl bg-card">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-bold text-muted-foreground">No Uploaded Files</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    No proposal documents or supporting files were attached to this submission.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── Team Tab ──────────────────────────────────────────────── */}
            <TabsContent value="team" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Principal Investigator */}
                  <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background flex items-center gap-4 shadow-2xs">
                    <Avatar className="h-14 w-14 border-2 border-primary/40 shadow-xs shrink-0 ring-4 ring-primary/10">
                      <AvatarImage
                        src={piAvatar}
                        alt={piName}
                        className="object-cover h-full w-full"
                      />
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
                      {piEmail && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                          {piEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Team Members List with Avatars */}
                  {rawTeamList.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Team Members ({rawTeamList.length})
                        </h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                        {rawTeamList.map((member: any, idx: number) => {
                          const name =
                            member.memberName ||
                            member.stakeholderName ||
                            member.name ||
                            [member.user?.firstName, member.user?.lastName].filter(Boolean).join(" ") ||
                            `Team Member ${idx + 1}`;
                          const email = member.memberEmail || member.email || member.user?.email || "";
                          const roleName = member.roleName || member.position || member.role || "Co-Investigator";
                          const isExternal =
                            member.memberType?.toLowerCase() === "external" ||
                            member.member_type?.toLowerCase() === "external" ||
                            Boolean(member.stakeholderName);
                          const rawPhoto = member.photoUrl || member.photo_url || member.avatarUrl || member.user?.photoUrl;
                          const photoUrl = getUserAvatarUrl(rawPhoto);
                          const initials = getInitials(name);

                          return (
                            <div
                              key={member.id || idx}
                              className={cn(
                                "p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-start gap-3.5 shadow-2xs",
                                isExternal ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-blue-500",
                              )}
                            >
                              <Avatar className="h-10 w-10 border border-border/60 shrink-0 shadow-2xs">
                                <AvatarImage
                                  src={photoUrl}
                                  alt={name}
                                  className="object-cover h-full w-full"
                                />
                                <AvatarFallback
                                  className={cn(
                                    "text-xs font-bold",
                                    isExternal
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                      : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                  )}
                                >
                                  {initials}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="text-sm font-bold text-foreground truncate">{name}</p>
                                  <Badge
                                    variant={isExternal ? "outline" : "secondary"}
                                    className="text-[9px] uppercase px-1.5 py-0 shrink-0 font-semibold"
                                  >
                                    {isExternal ? "External" : "Internal"}
                                  </Badge>
                                </div>

                                <p className="text-xs text-primary font-semibold">{roleName}</p>

                                {email && (
                                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{email}</span>
                                  </p>
                                )}
                                {(member.phoneNumber || member.phone_number) && (
                                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{member.phoneNumber || member.phone_number}</span>
                                  </p>
                                )}
                                {(member.organizationName || member.organization_name) && (
                                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{member.organizationName || member.organization_name}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Review History Tab ────────────────────────────────────── */}
            <TabsContent value="history" className="pt-6 space-y-6">
              <Card className="shadow-xs border-border/60 overflow-hidden">
                <CardHeader className="border-b bg-muted/30 py-4 px-6 flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Proposal Audit & Technical Review History</CardTitle>
                      <p className="text-xs text-muted-foreground">Complete technical evaluations and reviewer decision audit trail</p>
                    </div>
                  </div>
                  {submittedReviews.length > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-background border-border/60">
                      {submittedReviews.length} {submittedReviews.length === 1 ? "Review" : "Reviews"}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {submittedReviews.length > 0 ? (
                    <div className="relative pl-3 space-y-8 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary/40 before:via-border before:to-muted">
                      {submittedReviews.map((review, idx) => {
                        const reviewerName = review.reviewer?.fullName || "Reviewer";
                        const totalScore = review.totalScore;
                        const reviewPercent =
                          totalScore != null && maxPossiblePoints > 0
                            ? Math.round((Number(totalScore) / maxPossiblePoints) * 100)
                            : null;

                        return (
                          <div key={review.id || idx} className="relative flex items-start gap-5 group">
                            {/* Step Node Icon */}
                            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-emerald-500/20 ring-4 ring-emerald-500/15 transition-transform duration-200 group-hover:scale-110">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>

                            {/* Event Card */}
                            <div className="flex-1 min-w-0">
                              <div className="rounded-2xl border border-l-4 border-l-emerald-500 bg-card p-4 shadow-xs transition-all duration-200 hover:shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate">
                                      Technical Evaluation by {reviewerName}
                                    </h4>
                                    {reviewPercent != null && (
                                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                                        Score: {reviewPercent}% ({totalScore}/{maxPossiblePoints} pts)
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Timestamp */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40 shrink-0">
                                    <Calendar className="h-3 w-3 text-muted-foreground/70" />
                                    <span className="font-medium">
                                      {review.createdAt
                                        ? new Date(review.createdAt).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                        : "N/A"}
                                    </span>
                                  </div>
                                </div>

                                {review.comments ? (
                                  <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1.5">
                                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                                      <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                      Reviewer Rationale & Remarks
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed italic pl-5 border-l-2 border-primary/30">
                                      &ldquo;{review.comments}&rdquo;
                                    </p>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-muted-foreground/70 italic">
                                    No additional written comments submitted with this score.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-muted/10">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <History className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm">No Technical Reviews Recorded</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                        Technical evaluations submitted by assigned reviewers will be logged automatically here.
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
          {/* Proposal Details Card */}
          <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/40 border-b py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Proposal Details
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
                <StatusBadge
                  status={currentStatus}
                  displayLabel={proposal.statusDisplay}
                />
              </div>

              {/* Average Score Progress Highlight */}
              {averageScorePct != null && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5" /> Average Technical Score
                    </span>
                    <span className={cn(
                      "text-sm font-black font-mono",
                      averageScorePct >= 70 ? "text-emerald-600" : averageScorePct >= 50 ? "text-amber-600" : "text-rose-600",
                    )}>
                      {averageScorePct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        averageScorePct >= 70 ? "bg-emerald-500" : averageScorePct >= 50 ? "bg-amber-400" : "bg-rose-500",
                      )}
                      style={{ width: `${Math.min(averageScorePct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {averageScore?.toFixed(1)} / {maxPossiblePoints} pts · {submittedReviews.length} of {assignedReviewers.length} submitted
                  </p>
                </div>
              )}

              {/* Requested Budget Highlight */}
              {proposal.budgetRequested && (
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
                    {formatBudget(proposal.budgetRequested)}
                  </span>
                </div>
              )}

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
                {proposal.proposalType && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Type</span>
                    <span className="font-bold text-foreground text-right">{proposal.proposalType.name}</span>
                  </div>
                )}

                {(proposal.thematicAreas?.length > 0 || proposal.researchArea) && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Thematic Area</span>
                    <Badge variant="secondary" className="font-bold text-[10px] text-right truncate max-w-[170px] bg-primary/10 text-primary border-none">
                      {proposal.thematicAreas?.length > 0
                        ? proposal.thematicAreas.map((t: any) => t.name).join(", ")
                        : proposal.researchArea}
                    </Badge>
                  </div>
                )}

                {proposal.version && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Version</span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">
                      v{proposal.version}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Project Period & Submitted Date */}
              <div className="pt-3.5 border-t border-border/40 space-y-3">
                {proposal.startDate && proposal.endDate && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Project Period
                      </p>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {new Date(proposal.startDate).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="text-muted-foreground/60 mx-1.5">•</span>
                        {new Date(proposal.endDate).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Submitted Date & Time
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(proposal.submittedAt || proposal.createdAt || new Date()).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">•</span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-background text-primary border-primary/20 px-1.5 py-0 font-mono">
                        {new Date(proposal.submittedAt || proposal.createdAt || new Date()).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliated Institution Card */}
          <Card className="shadow-xs border-border/60 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b bg-muted/40 flex flex-row items-center gap-2">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Affiliated Institution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Submitted To (Receiving Office) */}
              {proposal.receivingOffice && (
                <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Submitted To
                    </p>
                    <p className="text-xs font-bold text-foreground leading-snug break-words mt-0.5">
                      {proposal.receivingOffice.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Organization */}
              {proposal.Organization && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Lead Organization
                    </p>
                    <p className="text-xs font-bold text-foreground leading-snug break-words mt-0.5">
                      {proposal.Organization.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Unit / Department */}
              {proposal.Unit && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Department / Academic Unit
                    </p>
                    <p className="text-xs font-bold text-foreground leading-snug break-words mt-0.5">
                      {proposal.Unit.name}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {hasSignature && (
            <Card className="shadow-xs border-border/60 overflow-hidden hover:shadow-md transition-all duration-200">
              <CardHeader className="border-b bg-muted/40 py-3.5 px-5 flex flex-row items-center gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="rounded-xl border border-border/60 p-4 bg-white dark:bg-muted/30 backdrop-blur-xs flex items-center justify-center shadow-2xs">
                  <img
                    src={resolveFileUrl(proposal.signature) ?? undefined}
                    alt="Proposal signature"
                    className="h-24 w-auto max-w-full object-contain filter drop-shadow-xs dark:invert dark:hue-rotate-180"
                  />
                </div>
              </CardContent>
            </Card>
          )}
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
