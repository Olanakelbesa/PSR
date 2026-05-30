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
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  BarChart3,
  Users,
  Wallet,
  ClipboardCheck,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  CardDescription,
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
} from "@/api/services";
import type { Attachment } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { THEMATIC_AREAS } from "@/lib/constants";
import {
  proposalScreeningSchema,
  type ProposalScreeningFormData,
} from "@/lib/validations";

type ManagedTeamMember = Awaited<
  ReturnType<typeof getManagedProposalById>
>["teamMembers"][number];

export default function ScreeningDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<any>(null);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingReview, setIsStartingReview] = useState(false);

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

    // Build review timeline from proposal data
    const reviewTimeline = [];
    
    // Initial submission event
    if (detail.firstSubmittedAt || detail.createdAt) {
      reviewTimeline.push({
        action: "Proposal Submitted",
        timestamp: detail.firstSubmittedAt || detail.createdAt,
        status: "submitted",
        comment: null,
      });
    }

    // Status change event
    if (detail.status && detail.status !== "submitted") {
      const statusLabels: Record<string, string> = {
        screening_under_review: "Screening Under Review",
        screening_approved: "Screening Approved",
        screening_rejected: "Screening Rejected",
        submitted: "Submitted",
      };
      reviewTimeline.push({
        action: statusLabels[detail.status] || `Status: ${detail.status}`,
        timestamp: detail.lastSubmittedAt || detail.updatedAt,
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
      background: "",
      objectives: "",
      methodology: "",
      expectedOutcomes: "",
      ethicalConsiderations: "",
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
          role: String(member.roleName || member.memberType || "researcher")
            .toLowerCase()
            .includes("co")
            ? "co_pi"
            : "researcher",
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
    };
  };

  useEffect(() => {
    async function loadProposal() {
      try {
        const response = await getManagedProposalById(id as string);
        const mappedProposal = mapManagedProposalToProposal(response);
        
        // Try to fetch comprehensive review history from backend
        try {
          const { getReviewHistory } = await import("@/api/services");
          
          // Get screening ID from response or find it
          let screeningId = response.screeningId ?? response.screening_id;
          if (!screeningId) {
            const screening = await findScreeningByProposal(response.id);
            screeningId = screening?.id;
          }
          
          if (screeningId) {
            const historyData = await getReviewHistory(screeningId);
            if (historyData?.review_timeline) {
              // Use comprehensive timeline from backend
              mappedProposal.reviewTimeline = historyData.review_timeline;
            }
          }
        } catch (historyError) {
          // Fall back to locally generated timeline if endpoint fails
          console.warn("Could not fetch review history from backend:", historyError);
        }
        
        setProposal(mappedProposal);
        setScreeningId(response.screeningId ?? response.screening_id ?? response.id);
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
      const screening = await ensureScreeningForProposal(
        Number.isNaN(proposalId) ? proposal.id : proposalId,
        {
          proposal: Number.isNaN(proposalId) ? proposal.id : proposalId,
          status: "screening_under_review",
          decision_remarks: "",
        },
      );

      setScreeningId(screening.id);
      setProposal((current: any) =>
        current ? { ...current, status: "screening_under_review" } : current,
      );
      setIsReviewOpen(true);
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

  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Fetching proposal documentation...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!proposal) return null;

  const coInvestigators = proposal.coInvestigators as Array<{
    name: string;
    institution: string;
    role: string;
  }>;
  const attachments = proposal.attachments as Array<{
    id: string;
    name: string;
    size: number;
  }>;

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    under_review: "bg-amber-100 text-amber-700 border-amber-200",
    screening_under_review: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    screening_approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    screening_rejected: "bg-rose-100 text-rose-700 border-rose-200",
    revision_requested: "bg-amber-50 text-amber-600 border-amber-200",
  };

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

          {(proposal.status === "screening_under_review" || proposal.status === "submitted") && (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleStartReview}
              disabled={isStartingReview || isSubmitting}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Review
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-6">
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
                Budget & Team
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0"
              >
                Review History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Abstract & Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-2">
                      Technical Abstract
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {proposal.abstract || "No abstract provided."}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-dashed">
                    <h4 className="text-sm font-bold text-foreground mb-2">
                      Research Background & Rationale
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {proposal.background || "No background provided."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Research Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {proposal.objectives || "No objectives provided."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="budget" className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      Total Budget Requested
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary">
                        ETB {(proposal.budget.total || proposal.budgetRequested || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total project funding amount for this proposal
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Research Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shrink-0">
                        {proposal.principalInvestigator.firstName?.[0] || "U"}
                        {proposal.principalInvestigator.lastName?.[0] || ""}
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {proposal.principalInvestigator.firstName}{" "}
                          {proposal.principalInvestigator.lastName}
                        </p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          Principal Investigator
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground px-1">
                        Co-Investigators ({proposal.coInvestigators.length})
                      </h4>
                      {coInvestigators.map((member, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded border border-muted/50 hover:bg-muted/30 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {member.institution}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[9px] uppercase"
                          >
                            {member.role.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="pt-6 space-y-6">
              <div className="space-y-4">
                {proposal.reviewTimeline && proposal.reviewTimeline.length > 0 ? (
                  proposal.reviewTimeline.map((event: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                        {idx < proposal.reviewTimeline.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <Card className="shadow-sm border-primary/5">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <p className="font-bold text-sm text-foreground">
                                  {event.action}
                                </p>
                                {event.comment && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {event.comment}
                                  </p>
                                )}
                                {event.status && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Status: {event.status.replace(/_/g, " ")}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
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
                                <p className="text-xs text-muted-foreground">
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
                      New Submission
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      This is the first administrative screening for this proposal.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submission Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  className={cn(
                    "px-3 py-1 border shadow-none uppercase text-[10px] font-bold",
                    statusColors[proposal.status],
                  )}
                >
                  {proposal.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Thematic Area</span>
                <Badge
                  variant="outline"
                  className="font-bold border-primary/20"
                >
                  {THEMATIC_AREAS.find((a) => a.value === proposal.researchArea)
                    ?.label || proposal.researchArea}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <Clock className="h-4 w-4" />
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

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Primary Institution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {proposal.institution}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Institutional Partner
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 p-0">
              {attachments.map((file) => (
                <button
                  key={file.id}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0 group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="text-xs font-bold truncate max-w-35">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Screening Review</DialogTitle>
            <DialogDescription>
              Add your comment and choose a decision for this proposal.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a decision" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="under_review">Screening Under Review</SelectItem>
                        <SelectItem value="approve">Screening Approved</SelectItem>
                        <SelectItem value="reject">Screening Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write your screening notes here..."
                        className="min-h-35 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                {recommendation === "approve"
                  ? "This will set status to Screening Approved."
                  : recommendation === "under_review"
                    ? "This will keep status as Screening Under Review."
                    : "This will set status to Screening Rejected."}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Submit Review
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
