"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  ClipboardCheck,
  ChevronRight,
  Layers,
  MapPin,
  Calendar,
  Tag,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import {
  ensureScreeningForProposal,
  getManagedProposalById,
  updateScreening,
  findScreeningByProposal,
  type ReviewHistoryEvent,
} from "@/api/services";
import type { Attachment } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  proposalScreeningSchema,
  type ProposalScreeningFormData,
} from "@/lib/validations";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { PdfViewerDialog } from "@/components/shared";

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
};

function StatusBadge({ status, displayLabel }: { status: string; displayLabel?: string }) {
  const cfg = STATUS_DISPLAY[status] ?? {
    label: displayLabel || status.replace(/_/g, " "),
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ScreeningDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<any>(null);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string } | null>(null);

  const form = useForm<ProposalScreeningFormData>({
    resolver: zodResolver(proposalScreeningSchema),
    defaultValues: {
      comments: "",
      recommendation: "approve",
      assignedReviewers: [],
    },
  });

  const recommendation = form.watch("recommendation");

  const screeningStatusByRecommendation = {
    approve: "screening_approved",
    under_review: "screening_under_review",
    reject: "screening_rejected",
  } as const;

  const mapManagedProposalToProposal = (
    detail: Awaited<ReturnType<typeof getManagedProposalById>>,
  ) => {
    const firstName = detail.createdBy?.firstName || "Unknown";
    const lastName = detail.createdBy?.lastName || "";

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

    if (detail.firstSubmittedAt || detail.createdAt) {
      reviewTimeline.push({
        action: "Proposal Submitted",
        timestamp: String(
          detail.firstSubmittedAt || detail.createdAt || new Date().toISOString(),
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
      callId: detail.call?.id || "",
      call: detail.call || undefined,
      title: detail.title,
      abstract: detail.abstract || "",
      principalInvestigator: {
        id: detail.createdBy?.id || "",
        image: undefined,
        email: detail.createdBy?.email || "",
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
      coInvestigators: (detail.teamMembers || []).map(
        (member: ManagedTeamMember, index: number) => ({
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
          memberType: member.memberType || "internal",
          institution: member.organizationName || "",
          expertise: member.position || member.userType || "",
        }),
      ),
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
      receivingOffice: detail.receivingOffice || null,
      Organization: detail.Organization || null,
      Unit: detail.Unit || null,
      teamMembers: detail.teamMembers || [],
      reviewHistory: detail.reviewHistory,
      reviewTimeline,
      startDate: detail.startDate || undefined,
      endDate: detail.endDate || undefined,
      budgetRequested: detail.budgetRequested || null,
      proposalFile: detail.proposalFile || null,
      updatedProposal: detail.updatedProposal || null,
      supportingDocs: detail.supportingDocs,
      version: detail.version || null,
      resubmissionCount: detail.resubmissionCount || null,
      rejectionReason: detail.rejectionReason || null,
      needsIrb: detail.needsIrb || null,
      firstSubmittedAt: detail.firstSubmittedAt || null,
      lastSubmittedAt: detail.lastSubmittedAt || null,
      signature: detail.signature,
      workflowState: detail.workflowState || null,
      subThematicArea: detail.subThematicArea || null,
      proposalType: detail.proposalType || null,
      subProposalType: detail.subProposalType || null,
    };
  };

  useEffect(() => {
    async function loadProposal() {
      try {
        const response = await getManagedProposalById(id as string);
        const mappedProposal = mapManagedProposalToProposal(response);

        try {
          const { getReviewHistory } = await import("@/api/services");

          let screeningId = String(
            response.screeningId ?? response.screening_id ?? "",
          );
          if (!screeningId) {
            const screening = await findScreeningByProposal(String(response.id));
            if (screening?.id) {
              screeningId = String(screening.id);
            }
          }

          if (screeningId) {
            const historyData = await getReviewHistory(String(screeningId));
            if (historyData?.review_timeline) {
              mappedProposal.reviewTimeline = historyData.review_timeline;
            }
          }
        } catch (historyError) {
          console.warn("Could not fetch review history from backend:", historyError);
        }

        setProposal(mappedProposal);
        setScreeningId(
          String(response.screeningId ?? response.screening_id ?? response.id),
        );
      } catch (error) {
        console.error("Error loading proposal:", error);
        toast.error("Failed to load proposal details");
        router.push("/research/proposals/screening-reviews");
      } finally {
        setIsLoading(false);
      }
    }
    loadProposal();
  }, [id, router]);

  async function handleStartReview() {
    if (!proposal) return;

    setIsStartingReview(true);
    try {
      const proposalId = Number(proposal.id);
      const safeId = Number.isNaN(proposalId) ? proposal.id : proposalId;

      if (isAlreadyScreened) {
        // Editing an existing screening — find it and pre-fill
        const existing = await findScreeningByProposal(safeId);
        if (existing) {
          setScreeningId(existing.id);
          // Map current status back to recommendation
          const statusToRecommendation: Record<string, "approve" | "under_review" | "reject"> = {
            screening_approved: "approve",
            screening_rejected: "reject",
            screening_under_review: "under_review",
          };
          form.reset({
            recommendation: statusToRecommendation[existing.status] || "approve",
            comments: (existing as any).decisionRemarks || "",
            assignedReviewers: [],
          });
        }
        setIsReviewOpen(true);
      } else {
        // New review — ensure screening exists
        const screening = await ensureScreeningForProposal(safeId, {
          proposal: safeId,
          status: "screening_under_review",
          decision_remarks: "",
        });

        setScreeningId(screening.id);
        setProposal((current: any) =>
          current ? { ...current, status: "screening_under_review" } : current,
        );
        form.reset({
          recommendation: "approve",
          comments: "",
          assignedReviewers: [],
        });
        setIsReviewOpen(true);
      }
    } catch (error) {
      console.error("Error starting screening review:", error);
      toast.error("Failed to start screening review");
    } finally {
      setIsStartingReview(false);
    }
  }

  async function onSubmit(data: ProposalScreeningFormData) {
    setIsSubmitting(true);
    try {
      const proposalId = Number(proposal.id);
      const status = screeningStatusByRecommendation[data.recommendation];
      const screening =
        screeningId ||
        (
          await ensureScreeningForProposal(
            Number.isNaN(proposalId) ? proposal.id : proposalId,
            {
              proposal: Number.isNaN(proposalId) ? proposal.id : proposalId,
              status: "screening_under_review",
              decision_remarks: "",
            },
          )
        ).id;

      await updateScreening(screening, {
        proposal: Number.isNaN(proposalId) ? proposal.id : proposalId,
        status,
        decision_remarks: data.comments || "",
      });
      toast.success("Screening submitted successfully");
      setIsReviewOpen(false);
      form.reset({
        comments: "",
        recommendation: "approve",
        assignedReviewers: [],
      });
      setProposal((current: any) =>
        current ? { ...current, status } : current,
      );
      router.push("/research/proposals/screening-reviews");
    } catch (error) {
      console.error("Error submitting screening review:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
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

  if (!proposal) {
    return (
      <PageContainer
        title="Proposal Not Found"
        description="The requested proposal could not be loaded."
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/screening-reviews")}
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
              <p className="text-sm text-amber-800">The proposal details could not be loaded. Please try again or contact support.</p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const coInvestigators = proposal.coInvestigators as Array<{
    name: string;
    email: string;
    institution: string;
    role: string;
    roleName: string;
    memberType: string;
  }>;

  const hasFiles = proposal.proposalFile || proposal.supportingDocs || proposal.updatedProposal;
  const hasSignature = Boolean(proposal.signature);

  const isAlreadyScreened =
    proposal.status === "screening_approved" ||
    proposal.status === "screening_rejected";

  // ── File entries for sidebar (preview mode) ───────────────────────────────
  const fileEntries: Array<{
    key: string;
    label: string;
    filePath: string | null;
  }> = [
    { key: "proposal", label: "Proposal Document", filePath: proposal.proposalFile },
    { key: "updated", label: "Updated Proposal", filePath: proposal.updatedProposal },
    { key: "supporting", label: "Supporting Documents", filePath: proposal.supportingDocs },
  ].filter((f) => Boolean(f.filePath));

  return (
    <PageContainer
      title={proposal.title}
      description={`Reference: ${proposal.referenceNumber || `PRP-${proposal.id}`}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/proposals/screening-reviews")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>

          {(proposal.status === "screening_under_review" ||
            proposal.status === "submitted" ||
            proposal.status === "resubmitted" ||
            proposal.status === "screening_approved" ||
            proposal.status === "screening_rejected") && (
            <Button
              className={cn(
                "hover:opacity-90",
                isAlreadyScreened
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-primary hover:bg-primary/90",
              )}
              onClick={handleStartReview}
              disabled={isStartingReview || isSubmitting}
            >
              {isAlreadyScreened ? (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Review
                </>
              ) : (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Review
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              <TabsTrigger
                value="overview"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Proposal Content
              </TabsTrigger>
              <TabsTrigger
                value="budget"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Team
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Review History
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ──────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-6 space-y-6">
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

            {/* ── Team Tab ──────────────────────────────────────────────── */}
            <TabsContent value="budget" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Research Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* PI */}
                    <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shrink-0 text-sm">
                        {proposal.principalInvestigator.firstName?.[0] || "U"}
                        {proposal.principalInvestigator.lastName?.[0] || ""}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {proposal.principalInvestigator.firstName}{" "}
                          {proposal.principalInvestigator.lastName}
                        </p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          Principal Investigator
                        </p>
                        {proposal.principalInvestigator.email && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {proposal.principalInvestigator.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Team Members */}
                    {coInvestigators.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground px-1">
                          Team Members ({coInvestigators.length})
                        </h4>
                        {coInvestigators.map((member, idx) => {
                          const isExternal =
                            member.memberType?.toLowerCase() === "external" ||
                            member.memberType?.toLowerCase() === "stakeholder";
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex items-center justify-between p-3 rounded border border-muted/50 hover:bg-muted/30 transition-colors",
                                isExternal
                                  ? "border-l-2 border-l-emerald-500"
                                  : "border-l-2 border-l-blue-500",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {member.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] uppercase px-1.5 py-0"
                                  >
                                    {member.roleName}
                                  </Badge>
                                  {member.email && (
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {member.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
              </Card>
            </TabsContent>

            {/* ── Review History Tab ────────────────────────────────────── */}
            <TabsContent value="history" className="pt-6 space-y-6">
              <div className="space-y-4">
                {proposal.reviewTimeline && proposal.reviewTimeline.length > 0 ? (
                  proposal.reviewTimeline.map((event: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                        {idx < proposal.reviewTimeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <Card className="shadow-sm border-primary/5">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-foreground">
                                  {event.action}
                                </p>
                                {event.comment && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {event.comment}
                                  </p>
                                )}
                                {event.status && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] mt-2 uppercase"
                                  >
                                    {event.status.replace(/_/g, " ")}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {event.timestamp
                                    ? new Date(event.timestamp).toLocaleDateString(
                                        "en-GB",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )
                                    : "N/A"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {event.timestamp
                                    ? new Date(event.timestamp).toLocaleTimeString(
                                        "en-GB",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        },
                                      )
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-bold text-muted-foreground">
                      No Review History
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                      This is the first administrative screening for this proposal.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          {/* Status & Metadata */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proposal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <StatusBadge
                  status={proposal.status}
                  displayLabel={proposal.statusDisplay}
                />
              </div>

              {proposal.proposalType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Type</span>
                  <span className="text-sm font-semibold">{proposal.proposalType.name}</span>
                </div>
              )}

              {proposal.subProposalType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sub Type</span>
                  <span className="text-sm font-semibold">{proposal.subProposalType.name}</span>
                </div>
              )}

              {proposal.researchArea && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Thematic Area</span>
                  <Badge variant="outline" className="font-bold border-primary/20 text-xs">
                    {proposal.researchArea}
                  </Badge>
                </div>
              )}

              {proposal.subThematicArea && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sub Thematic</span>
                  <Badge variant="outline" className="font-bold border-primary/20 text-xs">
                    {proposal.subThematicArea.name}
                  </Badge>
                </div>
              )}

              {proposal.version && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    v{proposal.version}
                  </Badge>
                </div>
              )}

              <div className="pt-3 border-t space-y-3">
                {proposal.startDate && proposal.endDate && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-foreground uppercase tracking-tighter text-[9px]">
                        Project Period
                      </p>
                      <p className="font-medium">
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

                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-foreground uppercase tracking-tighter text-[9px]">
                      Submitted Date
                    </p>
                    <p className="font-medium">
                      {new Date(
                        proposal.submittedAt || proposal.createdAt,
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institutional Context */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Institutional Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {proposal.call && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Grant Call
                    </p>
                    <p className="text-sm font-semibold leading-tight truncate">
                      {proposal.call.title}
                    </p>
                  </div>
                </div>
              )}

              {proposal.Organization && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Organization
                    </p>
                    <p className="text-sm font-semibold leading-tight truncate">
                      {proposal.Organization.name}
                    </p>
                  </div>
                </div>
              )}

              {proposal.Unit && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Unit
                    </p>
                    <p className="text-sm font-semibold leading-tight truncate">
                      {proposal.Unit.name}
                    </p>
                  </div>
                </div>
              )}

              {proposal.receivingOffice && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Receiving Office
                    </p>
                    <p className="text-sm font-semibold leading-tight truncate">
                      {proposal.receivingOffice.name}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {hasFiles && (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Uploaded Files
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 p-0">
                {fileEntries.map((entry) => {
                  const resolvedUrl = resolveFileUrl(entry.filePath);
                  return (
                    <button
                      key={entry.key}
                      onClick={() => {
                        if (resolvedUrl) {
                          setViewingFile({ name: entry.label, url: resolvedUrl });
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold truncate">
                            {entry.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {entry.filePath?.split("/").pop() || "File"}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {hasSignature && (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="border-b bg-primary/5 py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-xl border p-3 bg-white">
                  <img
                    src={resolveFileUrl(proposal.signature) ?? undefined}
                    alt="Proposal signature"
                    className="h-28 w-full max-w-full object-contain rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* ── Review Dialog ────────────────────────────────────────────────── */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
          {/* Colored header based on decision */}
          <div
            className={cn(
              "p-6 pb-4 border-b",
              recommendation === "approve" &&
                "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
              recommendation === "under_review" &&
                "bg-amber-50/60 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
              recommendation === "reject" &&
                "bg-red-50/60 dark:bg-red-500/10 border-red-100 dark:border-red-500/20",
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {recommendation === "approve" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {recommendation === "under_review" && (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
                {recommendation === "reject" && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {isAlreadyScreened ? "Edit Screening Decision" : "Screening Decision"}
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground/80 leading-relaxed">
                {recommendation === "approve" &&
                  "This proposal will be approved and proceed to the next workflow stage."}
                {recommendation === "under_review" &&
                  "This proposal will remain under screening review for further evaluation."}
                {recommendation === "reject" &&
                  "This proposal will be rejected and the submitter will be notified."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-6 space-y-5 bg-background">
                {/* Decision Select */}
                <FormField
                  control={form.control}
                  name="recommendation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Decision</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a decision" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="approve" className="py-2.5">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Approve</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="under_review" className="py-2.5">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span>Under Review</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="reject" className="py-2.5">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span>Reject</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Comment Field — Optional */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">
                      Comments
                    </label>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <Textarea
                    {...form.register("comments")}
                    placeholder="Add any notes or rationale for your decision..."
                    className="min-h-[100px] resize-none focus-visible:ring-primary/50 shadow-sm"
                  />
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="p-4 border-t gap-2 sm:gap-0 bg-muted/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsReviewOpen(false)}
                  disabled={isSubmitting}
                  className="hover:bg-muted/50 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "shadow-sm font-semibold",
                    recommendation === "approve" &&
                      "bg-emerald-600 hover:bg-emerald-700 text-white",
                    recommendation === "under_review" &&
                      "bg-amber-600 hover:bg-amber-700 text-white",
                    recommendation === "reject" &&
                      "bg-red-600 hover:bg-red-700 text-white",
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isAlreadyScreened ? (
                        <Pencil className="h-4 w-4" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4" />
                      )}
                      {isAlreadyScreened
                        ? "Update Decision"
                        : recommendation === "approve"
                          ? "Submit Approval"
                          : recommendation === "under_review"
                            ? "Submit Review"
                            : "Submit Rejection"}
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── File Preview Dialog ─────────────────────────────────────────────── */}
      <PdfViewerDialog
        isOpen={!!viewingFile}
        onOpenChange={(open) => { if (!open) setViewingFile(null); }}
        url={viewingFile?.url ?? ""}
        title={viewingFile?.name ?? "Document preview"}
      />
    </PageContainer>
  );
}
