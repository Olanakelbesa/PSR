"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Edit,
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
  Trash2,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { ConfirmDialog } from "@/components/shared";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { useDeleteProposal } from "@/hooks/useProposals";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { cn } from "@/lib/utils";
import {
  getProposalById,
  getManagedProposalById,
} from "@/api/services/proposals.service";
import {
  getReviewHistory,
  type ReviewHistoryEvent,
} from "@/api/services/screenings.service";
import type { Attachment } from "@/lib/types";

type ManagedTeamMember = Awaited<
  ReturnType<typeof getManagedProposalById>
>["teamMembers"][number];

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
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" },
  screening_rejected: { label: "Screening Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" },
  revision_requested: { label: "Revision Requested", className: "bg-amber-50 text-amber-600 border-amber-200" },
  revision_required: { label: "Revision Required", className: "bg-orange-100 text-orange-700 border-orange-200" },
  protocol_stage: { label: "Protocol Stage", className: "bg-violet-100 text-violet-700 border-violet-200" },
  funding_recommendation: { label: "Funding Recommendation", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
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
    label: displayLabel || (status ? status.replace(/_/g, " ") : "Draft"),
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

// ── Page Component ────────────────────────────────────────────────────────────
export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();

  const proposalId = useMemo(() => {
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    return rawId ? String(rawId) : "";
  }, [params.id]);

  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeDocKey, setActiveDocKey] = useState<string>("proposal");
  const [isCopiedRef, setIsCopiedRef] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string } | null>(null);

  const deleteProposalMutation = useDeleteProposal();

  const handleCopyRef = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setIsCopiedRef(false), 2000);
  };

  const documentList = useMemo(() => {
    if (!proposal) return [];
    return [
      { key: "proposal", label: "Proposal Document", filePath: proposal.proposalFile },
      { key: "updated", label: "Revised Proposal", filePath: proposal.updatedProposal },
      { key: "supporting", label: "Budget / Supporting Document", filePath: proposal.supportingDocs },
    ].filter((f) => Boolean(f.filePath));
  }, [proposal]);

  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  const mapManagedProposalToProposal = (detail: any) => {
    const firstName = detail.createdBy?.firstName || detail.created_by?.first_name || "Unknown";
    const lastName = detail.createdBy?.lastName || detail.created_by?.last_name || "";

    const attachments: Attachment[] = [];
    if (detail.proposalFile) {
      attachments.push({
        id: `${detail.id}-proposal-file`,
        name: detail.proposalFile.split("/").pop() || "Proposal File",
        type: "application/pdf",
        size: 0,
        url: detail.proposalFile,
        uploadedAt:
          detail.lastSubmittedAt ||
          detail.createdAt ||
          new Date().toISOString(),
      });
    }

    const reviewTimeline: ReviewHistoryEvent[] = [];

    if (detail.firstSubmittedAt || detail.submittedAt || detail.createdAt) {
      reviewTimeline.push({
        action: "Proposal Submitted",
        timestamp: String(
          detail.firstSubmittedAt || detail.submittedAt || detail.createdAt || new Date().toISOString(),
        ),
        status: "submitted",
        comment: null,
      });
    }

    if (detail.status && detail.status !== "submitted") {
      const statusLabels: Record<string, string> = {
        screening_under_review: "Screening Under Review",
        screening_approved: "Screening Approved",
        screening_rejected: "Screening Rejected",
        resubmitted: "Resubmitted",
        submitted: "Submitted",
        revision_requested: "Revision Requested",
        revision_required: "Revision Required",
        protocol_stage: "Protocol Stage",
        approved: "Approved",
        rejected: "Rejected",
      };
      reviewTimeline.push({
        action: statusLabels[detail.status] || `Status: ${detail.status}`,
        timestamp: String(
          detail.lastSubmittedAt || detail.updatedAt || new Date().toISOString(),
        ),
        status: detail.status,
        comment: detail.rejectionReason || null,
      });
    }

    return {
      id: detail.id,
      callId: detail.call?.id || detail.callId || "",
      call: detail.call || undefined,
      title: detail.title,
      abstract: detail.abstract || "",
      principalInvestigator: {
        id: detail.createdBy?.id || detail.created_by?.id || "",
        image: detail.createdBy?.photoUrl || detail.createdBy?.photo_url || detail.createdBy?.photo || undefined,
        photoUrl: detail.createdBy?.photoUrl || detail.createdBy?.photo_url || detail.createdBy?.photo || undefined,
        photo_url: detail.createdBy?.photoUrl || detail.createdBy?.photo_url || detail.createdBy?.photo || undefined,
        email: detail.createdBy?.email || detail.created_by?.email || "",
        firstName,
        lastName,
        role: "researcher",
        status: "active",
        createdAt: detail.createdAt || new Date().toISOString(),
        updatedAt:
          detail.lastSubmittedAt ||
          detail.createdAt ||
          new Date().toISOString(),
      },
      createdBy: detail.createdBy || detail.created_by || undefined,
      coInvestigators: (detail.teamMembers || detail.team_members || [])
        .filter((member: any) => {
          const ownerId = String(detail.createdBy?.id || detail.created_by?.id || "");
          const ownerEmail = (detail.createdBy?.email || detail.created_by?.email || "").toLowerCase();
          const memberUserId = String(member.member?.id || member.member || "");
          const memberEmail = (member.memberEmail || member.email || "").toLowerCase();
          const isOwner =
            (ownerId && memberUserId === ownerId) ||
            (ownerEmail && memberEmail === ownerEmail) ||
            member.roleName === "Principal Investigator" ||
            member.is_pi;
          return !isOwner;
        })
        .map((member: any, index: number) => ({
          id: member.id,
          userId: member.member ? String(member.member) : undefined,
          name:
            member.memberName ||
            member.stakeholderName ||
            member.organizationName ||
            `Team Member ${index + 1}`,
          email: member.memberEmail || member.email || "",
          role: String(member.roleName || member.memberType || "researcher"),
          roleName: member.roleName || "Team Member",
          memberType: member.memberType || member.member_type || "internal",
          institution: member.organizationName || "",
          expertise: member.position || member.userType || "",
          phoneNumber: member.phoneNumber || member.phone_number || "",
          organizationName: member.organizationName || member.organization_name || "",
          photoUrl: member.photoUrl || member.photo_url || member.avatarUrl || member.user?.photoUrl,
        })),
      institution: detail.Organization?.name || "",
      researchArea: detail.thematicAreas?.[0]?.name || "",
      budget: {
        personnel: 0,
        equipment: 0,
        consumables: 0,
        travel: 0,
        other: 0,
        total: Number(detail.budgetRequested || 0),
      },
      timeline: [],
      status: detail.status,
      statusDisplay: detail.statusDisplay || null,
      attachments,
      reviews: [],
      submittedAt:
        detail.submittedAt ||
        detail.lastSubmittedAt ||
        detail.firstSubmittedAt ||
        undefined,
      createdAt:
        detail.createdAt || detail.firstSubmittedAt || new Date().toISOString(),
      updatedAt:
        detail.lastSubmittedAt || detail.createdAt || new Date().toISOString(),
      referenceNumber: detail.referenceNumber || `PRP-${detail.id}`,
      keywords: detail.keywords || [],
      thematicAreas: detail.thematicAreas || [],
      receivingOffice: detail.receivingOffice || null,
      Organization: detail.Organization || null,
      Unit: detail.Unit || null,
      teamMembers: detail.teamMembers || detail.team_members || [],
      reviewHistory: detail.reviewHistory,
      reviewTimeline,
      startDate: detail.startDate || undefined,
      endDate: detail.endDate || undefined,
      budgetRequested: detail.budgetRequested || null,
      proposalFile: detail.proposalFile || null,
      updatedProposal: detail.updatedProposal || null,
      supportingDocs: detail.supportingDocs || null,
      version: detail.version || null,
      resubmissionCount: detail.resubmissionCount || null,
      rejectionReason: detail.rejectionReason || null,
      needsIrb: detail.needsIrb || null,
      firstSubmittedAt: detail.firstSubmittedAt || null,
      lastSubmittedAt: detail.lastSubmittedAt || null,
      signature: detail.signature || null,
      workflowState: detail.workflowState || null,
      subThematicArea: detail.subThematicArea || null,
      proposalType: detail.proposalType || null,
      subProposalType: detail.subProposalType || null,
    };
  };

  useEffect(() => {
    if (!proposalId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProposal() {
      try {
        let proposalData: any = null;
        try {
          proposalData = await getManagedProposalById(proposalId);
        } catch {
          proposalData = await getProposalById(proposalId);
        }

        if (!isMounted) return;

        if (proposalData) {
          const mappedProposal = mapManagedProposalToProposal(proposalData);

          try {
            const { getReviewHistory: fetchReviewHistory } = await import(
              "@/api/services/screenings.service"
            );
            const historyData = await fetchReviewHistory(String(proposalId));
            if (historyData?.review_timeline && Array.isArray(historyData.review_timeline)) {
              mappedProposal.reviewTimeline = historyData.review_timeline.map((evt: any) => ({
                ...evt,
                actor: undefined,
                reviewer: undefined,
                reviewerName: undefined,
                reviewerEmail: undefined,
              }));
            } else if (Array.isArray(historyData)) {
              mappedProposal.reviewTimeline = historyData.map((evt: any) => ({
                ...evt,
                actor: undefined,
                reviewer: undefined,
                reviewerName: undefined,
                reviewerEmail: undefined,
              }));
            }
          } catch (historyError) {
            console.warn("Could not fetch review history from backend:", historyError);
          }

          setProposal(mappedProposal);
          setHasError(false);
        } else {
          setProposal(null);
          setHasError(true);
          toast.error("Failed to load proposal details");
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

  // ── Ownership & Status Calculations ──────────────────────────────────────────
  const currentStatus = proposal?.status ?? (proposal?.submittedAt ? "submitted" : "draft");
  const statusKey = (currentStatus || "").toLowerCase().replace(/[\s-]+/g, "_");
  const isScreeningRejected = statusKey === "screening_rejected";
  const isRevisionRequired = statusKey === "revision_required" || statusKey === "revision_requested";
  const isProtocolStage = statusKey === "protocol_stage";
  const isResubmittable = isScreeningRejected || isRevisionRequired;
  const isDraft = statusKey === "draft" && !proposal?.submittedAt;
  const isEditable = isDraft || isProtocolStage;

  const currentUserId = String(currentUser?.id ?? "");
  const currentUserEmail = (currentUser?.email ?? "").toLowerCase();
  const createdBy = (proposal?.createdBy || proposal?.created_by) as any;
  const createdById = String(createdBy?.id ?? createdBy ?? "");
  const createdByEmail = (createdBy?.email ?? "").toLowerCase();

  const isOwner = Boolean(
    (currentUserId && createdById === currentUserId) ||
    (currentUserEmail && createdByEmail === currentUserEmail) ||
    proposal?.isOwner ||
    proposal?.is_owner
  );

  const rejectionFeedback = proposal?.rejectionReason || null;

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal...">
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

  if (hasError || !proposal) {
    return (
      <PageContainer
        title="Proposal Not Found"
        description="The requested proposal could not be loaded."
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/my-proposals")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900">Proposal Details Unavailable</h3>
              <p className="text-sm text-amber-800">
                The proposal details could not be retrieved. Please try again or return to the proposals list.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const coInvestigators = (proposal.coInvestigators || []) as Array<any>;
  const rawTeamList = (proposal.teamMembers || proposal.team_members || coInvestigators) as Array<any>;

  const getValidUser = (obj: any) => {
    if (!obj || typeof obj !== "object") return null;
    if (obj.id || obj.email || obj.firstName || obj.memberName || obj.name) return obj;
    return null;
  };

  const pi =
    getValidUser(proposal.principalInvestigator) ||
    getValidUser(proposal.createdBy) ||
    getValidUser(proposal.pi) ||
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/my-proposals")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>

          {isEditable && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link
                href={`/research/proposals/my-proposals/${proposal.id}/edit`}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isProtocolStage ? "Edit Proposal Details" : "Edit"}
              </Link>
            </Button>
          )}

          {isResubmittable && (
            <Button asChild className="bg-amber-600 hover:bg-amber-700">
              <Link
                href={`/research/proposals/my-proposals/${proposal.id}/edit?mode=resubmit`}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resubmit Proposal
              </Link>
            </Button>
          )}

          {isDraft && isOwner && (
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Proposal
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
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
                  value="documents"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  Uploaded Documents
                  {documentList.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold bg-primary/10 text-primary border-none rounded-md">
                      {documentList.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl h-10 px-4 font-semibold text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-border/60 gap-2"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  Research Team
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
                  Review History
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

              {/* Rejection / Revision Feedback Alert Banner */}
              {rejectionFeedback && isResubmittable && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Screening Feedback & Rationale</span>
                  </div>
                  <p className="mt-2 text-xs italic leading-relaxed pl-6 border-l-2 border-rose-400">
                    &ldquo;{rejectionFeedback}&rdquo;
                  </p>
                  <p className="mt-3 text-[11px] text-rose-700/80 dark:text-rose-300/80 font-medium">
                    Please revise your proposal details and click &ldquo;Resubmit Proposal&rdquo; when ready.
                  </p>
                </div>
              )}

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
                    Research Team
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
                      <CardTitle className="text-base font-bold">Proposal Audit & Review History</CardTitle>
                      <p className="text-xs text-muted-foreground">Complete lifecycle activity log and status progression</p>
                    </div>
                  </div>
                  {proposal.reviewTimeline && proposal.reviewTimeline.length > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-background border-border/60">
                      {proposal.reviewTimeline.length} {proposal.reviewTimeline.length === 1 ? "Event" : "Events"}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {proposal.reviewTimeline && proposal.reviewTimeline.length > 0 ? (
                    <div className="relative pl-3 space-y-8 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary/40 before:via-border before:to-muted">
                      {proposal.reviewTimeline.map((event: any, idx: number) => {
                        const statusStr = (event.status || event.action || "").toLowerCase();
                        let Icon = Clock;
                        let nodeStyle = "bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/10";
                        let borderStyle = "border-l-4 border-l-primary";
                        let badgeStyle = "bg-primary/10 text-primary border-primary/20";
                        let statusLabel = event.action || "Status Update";

                        if (statusStr.includes("approved")) {
                          Icon = CheckCircle2;
                          nodeStyle = "bg-emerald-600 text-white shadow-emerald-500/20 ring-4 ring-emerald-500/15";
                          borderStyle = "border-l-4 border-l-emerald-500";
                          badgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
                          statusLabel = "Screening Approved";
                        } else if (statusStr.includes("rejected")) {
                          Icon = XCircle;
                          nodeStyle = "bg-rose-600 text-white shadow-rose-500/20 ring-4 ring-rose-500/15";
                          borderStyle = "border-l-4 border-l-rose-500";
                          badgeStyle = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
                          statusLabel = "Screening Rejected";
                        } else if (statusStr.includes("revision")) {
                          Icon = RotateCcw;
                          nodeStyle = "bg-amber-600 text-white shadow-amber-500/20 ring-4 ring-amber-500/15";
                          borderStyle = "border-l-4 border-l-amber-500";
                          badgeStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
                          statusLabel = "Revision Requested";
                        } else if (statusStr.includes("under_review") || statusStr.includes("screening")) {
                          Icon = Search;
                          nodeStyle = "bg-blue-600 text-white shadow-blue-500/20 ring-4 ring-blue-500/15";
                          borderStyle = "border-l-4 border-l-blue-500";
                          badgeStyle = "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
                          statusLabel = "Under Screening Review";
                        } else if (statusStr.includes("submitted")) {
                          Icon = Send;
                          nodeStyle = "bg-indigo-600 text-white shadow-indigo-500/20 ring-4 ring-indigo-500/15";
                          borderStyle = "border-l-4 border-l-indigo-500";
                          badgeStyle = "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
                          statusLabel = "Submitted";
                        }

                        const commentText = event.comment || event.decisionRemarks || event.remarks;

                        return (
                          <div key={idx} className="relative flex items-start gap-5 group">
                            {/* Step Node Icon */}
                            <div className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110", nodeStyle)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>

                            {/* Event Card */}
                            <div className="flex-1 min-w-0">
                              <div className={cn("rounded-2xl border bg-card p-4 shadow-xs transition-all duration-200 hover:shadow-md", borderStyle)}>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate">
                                      {event.action || statusLabel}
                                    </h4>
                                    {event.status && (
                                      <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5", badgeStyle)}>
                                        {event.status.replace(/_/g, " ")}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Timestamp Badge */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40 shrink-0">
                                    <Calendar className="h-3 w-3 text-muted-foreground/70" />
                                    <span className="font-medium">
                                      {event.timestamp
                                        ? new Date(event.timestamp).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                        : "N/A"}
                                    </span>
                                    {event.timestamp && (
                                      <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                                        <span className="font-medium">
                                          {new Date(event.timestamp).toLocaleTimeString("en-US", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Decision Remarks / Comments Section */}
                                {commentText ? (
                                  <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                                        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                        Reviewer Comments & Remarks
                                      </div>
                                      <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground border-border/60 bg-background">
                                        Anonymous Feedback
                                      </Badge>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed italic pl-5 border-l-2 border-primary/30">
                                      &ldquo;{commentText}&rdquo;
                                    </p>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-muted-foreground/70 italic">
                                    No additional remarks recorded for this status step.
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
                      <h3 className="font-bold text-foreground text-sm">No Review History Recorded</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                        This proposal is currently in its initial submission stage. Review activity will be logged automatically here as it moves through the screening process.
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
                  status={proposal.status}
                  displayLabel={proposal.statusDisplay}
                />
              </div>

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

                {proposal.subProposalType && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Sub Type</span>
                    <span className="font-semibold text-foreground text-right">{proposal.subProposalType.name}</span>
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

                {proposal.subThematicArea && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Sub Thematic</span>
                    <Badge variant="outline" className="font-semibold text-[10px] text-right truncate max-w-[170px]">
                      {proposal.subThematicArea.name}
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
                        {new Date(proposal.submittedAt || proposal.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">•</span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-background text-primary border-primary/20 px-1.5 py-0 font-mono">
                        {new Date(proposal.submittedAt || proposal.createdAt).toLocaleTimeString("en-US", {
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
        onOpenChange={(open) => { if (!open) setViewingFile(null); }}
        url={viewingFile?.url ?? ""}
        title={viewingFile?.name ?? "Document preview"}
      />

      {/* ── Confirm Delete Dialog ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Proposal"
        description={`Are you sure you want to delete "${proposal.title || "this proposal"}"? This action cannot be undone.`}
        confirmLabel="Delete Proposal"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteProposalMutation.isPending}
        onConfirm={async () => {
          try {
            await deleteProposalMutation.mutateAsync(proposal.id);
            toast.success(
              `Proposal "${proposal.title || proposal.id}" deleted successfully.`,
            );
            router.push("/research/proposals/my-proposals");
          } catch (error: any) {
            const message =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to delete proposal. Please try again.";
            toast.error(message);
          }
        }}
      />
    </PageContainer>
  );
}
