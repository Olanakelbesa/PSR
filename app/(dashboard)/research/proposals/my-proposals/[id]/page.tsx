"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Users,
  Wallet,
  Edit,
  AlertTriangle,
  Layers,
  Compass,
  FileSignature,
  Loader2,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { proposalsApi } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Custom type aligning with GET /api/v1/proposals/{id}/ structure
interface BackendProposal {
  id: number;
  title: string;
  abstract: string;
  keywords: string[];
  startDate: string;
  endDate: string;
  budgetRequested: string;
  proposalFile: string | null;
  updatedProposal: string | null;
  supportingDocs: any;
  version: number;
  resubmissionCount: number;
  rejectionReason: string | null;
  needsIrb: boolean;
  createdAt: string;
  firstSubmittedAt: string | null;
  lastSubmittedAt: string | null;
  submittedAt: string | null;
  signature: string | null;
  workflowState: string;
  status: string;
  referenceNumber: string | null;
  thematicAreas: { id: number; name: string }[];
  strategicObjectives: { id: number; name: string }[];
  receivingOffice: { id: number; name: string } | null;
  call: { id: number; title: string } | null;
  Organization: { id: number; name: string } | null;
  Unit: { id: number; name: string } | null;
  proposalType: { id: number; name: string } | null;
  subThematicArea: { id: number; name: string } | null;
  createdBy: { id: number; firstName: string; lastName: string | null; email: string } | null;
  teamMembers: { id: string; name: string; institution: string; role: string }[];
  reviewHistory: any;
}

export default function ProposalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<BackendProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProposal() {
      try {
        const response = await proposalsApi.getById(id as string);
        if (response.success && response.data) {
          setProposal(response.data);
        } else {
          // If no API, use mock
          setProposal(MOCK_PROPOSAL as any);
        }
      } catch (error) {
        console.error("Error loading proposal:", error);
        setProposal(MOCK_PROPOSAL as any);
      } finally {
        setIsLoading(false);
      }
    }
    loadProposal();
  }, [id]);

  const handlePublishSubmit = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    try {
      const response = await proposalsApi.submitProposal(String(proposal.id));
      if (response.success) {
        toast.success("Proposal submitted successfully!");
        // Refresh detail page
        const updated = await proposalsApi.getById(String(proposal.id));
        if (updated.success && updated.data) {
          setProposal(updated.data);
        }
      } else {
        toast.error(response.message || "Failed to submit proposal");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while submitting proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Fetching proposal details...</p>
        </div>
      </PageContainer>
    );
  }

  if (!proposal) {
    return (
      <PageContainer title="Proposal Not Found">
        <div className="h-96 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <p className="font-bold text-lg">Unable to find this proposal</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </PageContainer>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
    submitted: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    under_review: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    rejected: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    revision_requested: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    contracted: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
    in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    terminated: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  };

  const getDurationInMonths = (start: string, end: string) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    }
    const diffMonths = Math.round(diffDays / 30.4);
    return `${diffMonths} Month${diffMonths > 1 ? 's' : ''}`;
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return "ETB 0.00";
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const piName = proposal.createdBy 
    ? `${proposal.createdBy.firstName} ${proposal.createdBy.lastName || ""}`.trim()
    : "N/A";

  const thematicAreaString = proposal.thematicAreas && proposal.thematicAreas.length > 0
    ? proposal.thematicAreas.map(ta => ta.name).join(", ")
    : "N/A";

  const isEditable = proposal.status === "draft" || proposal.status === "revision_requested";

  return (
    <PageContainer
      title={proposal.title || "Untitled Proposal"}
      description={`Reference: ${proposal.referenceNumber || `PRP-${proposal.id}`}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} className="h-9">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isEditable && (
            <Button asChild className="bg-primary hover:bg-primary/90 h-9">
               <Link href={`/research/proposals/my-proposals/${proposal.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
               </Link>
            </Button>
          )}

          {proposal.status === "draft" && (
            <Button 
              onClick={handlePublishSubmit} 
              disabled={isSubmitting} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Submit Proposal
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Rejection Alert Box */}
          {proposal.rejectionReason && proposal.status === "rejected" && (
            <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                  Rejection Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed italic">
                  "{proposal.rejectionReason}"
                </p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Overview</TabsTrigger>
              <TabsTrigger value="methodology" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Regulatory & History</TabsTrigger>
              <TabsTrigger value="budget" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Budget & Team</TabsTrigger>
              <TabsTrigger value="evaluations" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">ROC Evaluations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              {/* Abstract */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <FileText className="h-4 w-4 text-primary" />
                    Technical Abstract
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{proposal.abstract || "No abstract provided."}</p>
                  
                  {proposal.keywords && proposal.keywords.length > 0 && (
                    <div className="pt-4 border-t border-dashed border-muted/50 flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keywords:</span>
                      {proposal.keywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-muted/70">{kw}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Taxonomy and Strategic Alignments */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 font-bold">
                      <Layers className="h-4 w-4 text-primary" />
                      Thematic & Research Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">Proposal Type</h4>
                      <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                        {proposal.proposalType?.name || "Standard Research"}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">Thematic Area</h4>
                      <p className="text-sm font-medium">{thematicAreaString}</p>
                    </div>

                    {proposal.subThematicArea && (
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">Sub-Thematic Area</h4>
                        <p className="text-sm font-medium">{proposal.subThematicArea.name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 font-bold">
                      <Compass className="h-4 w-4 text-emerald-600" />
                      Strategic Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {proposal.strategicObjectives && proposal.strategicObjectives.length > 0 ? (
                      <ul className="space-y-3">
                        {proposal.strategicObjectives.map((so) => (
                          <li key={so.id} className="flex items-start gap-2 text-sm text-muted-foreground leading-snug">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{so.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No strategic objectives linked.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="methodology" className="pt-6 space-y-6">
              {/* Compliance & IRB */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Regulatory & IRB Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {proposal.needsIrb ? (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Institutional Review Board (IRB) Clearance Required</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                          This research involves human participants, clinical parameters, or sensitive demographic variables. Prior to release of research funding, formal IRB ethical clearance certification must be submitted and validated.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">IRB Clearance Exempt</h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                          This project does not include processes requiring ethical committee oversight. No IRB certificate submission is requested.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Version & Submission History */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <Clock className="h-4 w-4 text-primary" />
                    Version & Submission Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/40 p-3 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Document Version</p>
                      <p className="text-base font-black text-primary mt-1">v{proposal.version}</p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Resubmission Count</p>
                      <p className="text-base font-black text-primary mt-1">{proposal.resubmissionCount}</p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Created Date</p>
                      <p className="text-xs font-bold text-foreground mt-1">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Submitted Date</p>
                      <p className="text-xs font-bold text-foreground mt-1">
                        {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString() : "Not Submitted Yet"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-muted/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">First Submitted At:</span>
                      <span className="font-medium">{proposal.firstSubmittedAt ? new Date(proposal.firstSubmittedAt).toLocaleString() : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Submitted At:</span>
                      <span className="font-medium">{proposal.lastSubmittedAt ? new Date(proposal.lastSubmittedAt).toLocaleString() : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Digital Signature Status:</span>
                      <span className={cn("font-bold", proposal.signature ? "text-emerald-600" : "text-muted-foreground")}>
                        {proposal.signature ? "Verified Secure Signed" : "Pending Signature"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Budget */}
                <Card className="shadow-sm border-primary/5 flex flex-col justify-between">
                  <div>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 font-bold">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Budget Requested
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Total Projected Budget</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                          {formatCurrency(proposal.budgetRequested)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground leading-relaxed text-center mt-2">
                        Budget allocation has been aggregated and matches currency specifications set by the granting Call agency. Detailed justification documents are included as attachments.
                      </div>
                    </CardContent>
                  </div>
                </Card>

                {/* Team */}
                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 font-bold">
                      <Users className="h-4 w-4 text-primary" />
                      Research Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-primary/10 bg-primary/5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shrink-0">
                        {proposal.createdBy?.firstName?.[0] || "U"}{proposal.createdBy?.lastName?.[0] || ""}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{piName}</p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-wider">Principal Investigator</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{proposal.createdBy?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-wider">
                        Co-Investigators / Members ({proposal.teamMembers?.length || 0})
                      </h4>
                      {proposal.teamMembers && proposal.teamMembers.length > 0 ? (
                        proposal.teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg border border-muted/50 hover:bg-muted/30 transition-colors">
                            <div>
                              <p className="text-sm font-semibold">{member.name}</p>
                              <p className="text-[10px] text-muted-foreground">{member.institution}</p>
                            </div>
                            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                              {member.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 border border-dashed rounded-lg bg-muted/10">
                          <p className="text-xs text-muted-foreground italic">No additional team members listed.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="evaluations" className="pt-6 space-y-6">
               <div className="grid gap-6">
                  {/* Reviews list if present */}
                  {proposal.reviewHistory && proposal.reviewHistory.length > 0 ? (
                    (proposal.reviewHistory as any[]).map((review) => (
                       <Card key={review.id} className="shadow-sm border-primary/5">
                          <CardContent className="p-5">
                             <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                      <ShieldCheck className="h-4 w-4 text-primary" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold">Reviewer: {review.reviewer?.name || "ROC Member"}</p>
                                      <p className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <Badge variant={review.recommendation === "approve" ? "default" : "destructive"}>
                                      {review.recommendation.toUpperCase()}
                                   </Badge>
                                </div>
                             </div>
                             
                             <div className="space-y-2">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase">Comments & Review Feedback</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/40 p-3 rounded-lg">
                                  "{review.comments}"
                                </p>
                             </div>
                          </CardContent>
                       </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center border rounded-2xl bg-muted/15 space-y-4">
                       <Clock className="h-10 w-10 text-muted-foreground/70 mx-auto" />
                       <div>
                         <h3 className="font-bold text-base text-foreground">Review & Board Evaluation Timeline</h3>
                         <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                           Evaluations will be triggered once the proposal completes basic compliance screening and is assigned to the Research Oversight Committee (ROC).
                         </p>
                       </div>

                       <div className="max-w-md mx-auto pt-4 border-t border-dashed border-muted/50 text-left space-y-4">
                          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Workflow Status Progress</h4>
                          <div className="space-y-4">
                             {[
                               { step: "Draft Mode", desc: "Proposal is editable and saved locally.", checked: true },
                               { step: "Submitted / Screening", desc: "Initial validation checklist by LEO/PSR officers.", checked: proposal.status !== "draft" },
                               { step: "Technical ROC Peer Review", desc: "Detailed feasibility and methodology evaluation.", checked: ["under_review", "approved", "rejected"].includes(proposal.status) },
                               { step: "Final Board Decision", desc: "Final contract initiation or review outcome approval.", checked: ["approved", "rejected"].includes(proposal.status) }
                             ].map((step, idx) => (
                               <div key={idx} className="flex gap-3">
                                 <div className={cn("h-5 w-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border", 
                                   step.checked 
                                     ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" 
                                     : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                                 )}>
                                   {step.checked ? "✓" : idx + 1}
                                 </div>
                                 <div>
                                   <p className={cn("text-xs font-bold", step.checked ? "text-foreground" : "text-muted-foreground")}>{step.step}</p>
                                   <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.desc}</p>
                                 </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
           {/* Status Card */}
           <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className="bg-muted/50 border-b py-4">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={cn("px-2.5 py-1 border shadow-none capitalize font-bold", statusColors[proposal.status] || statusColors.draft)}>
                       {proposal.status.replace('_', ' ')}
                    </Badge>
                 </div>

                 {proposal.receivingOffice && (
                   <div className="flex items-start justify-between gap-4 pt-1">
                      <span className="text-sm font-medium shrink-0">Receiving Office</span>
                      <span className="text-xs font-bold text-right text-muted-foreground leading-tight">{proposal.receivingOffice.name}</span>
                   </div>
                 )}

                 <div className="pt-4 border-t border-muted/50">
                    <div className="flex items-center gap-3 text-muted-foreground">
                       <Clock className="h-4 w-4 shrink-0 text-primary" />
                       <div className="text-xs">
                          <p className="font-bold text-foreground">Initiated on</p>
                          <p>{new Date(proposal.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Call Details Card */}
           {proposal.call && (
             <Card className="shadow-sm border-primary/10">
                <CardHeader className="py-4 border-b">
                   <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grant Call Program</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3">
                   <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                         <p className="text-sm font-bold leading-tight text-foreground">{proposal.call.title}</p>
                         <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-1.5">Assigned Program</p>
                      </div>
                   </div>
                </CardContent>
             </Card>
           )}

           {/* Institutional Context */}
           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institutional Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 {proposal.Organization && (
                   <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                         <p className="text-sm font-bold leading-tight text-foreground">{proposal.Organization.name}</p>
                         <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-1">Lead Institution</p>
                      </div>
                   </div>
                 )}
                 
                 {proposal.Unit && (
                   <div className="flex items-start gap-3 pt-2 border-t border-dashed border-muted/50">
                      <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                         <p className="text-sm font-semibold leading-tight text-foreground">{proposal.Unit.name}</p>
                         <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-1">Assigned Department</p>
                      </div>
                   </div>
                 )}
              </CardContent>
           </Card>

           {/* Execution Dates */}
           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1.5 w-full">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Start Date:</span>
                         <span className="font-bold">{proposal.startDate ? new Date(proposal.startDate).toLocaleDateString() : "N/A"}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">End Date:</span>
                         <span className="font-bold">{proposal.endDate ? new Date(proposal.endDate).toLocaleDateString() : "N/A"}</span>
                       </div>
                       {proposal.startDate && proposal.endDate && (
                         <div className="flex justify-between pt-1 border-t border-dashed border-muted/50">
                           <span className="text-muted-foreground">Duration:</span>
                           <span className="font-black text-primary">
                             {getDurationInMonths(proposal.startDate, proposal.endDate)}
                           </span>
                         </div>
                       )}
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Attachments / PDF Document */}
           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attachments & PDFs</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                 {proposal.proposalFile ? (
                    <div className="flex flex-col p-4 gap-3 bg-muted/20">
                      <div className="flex items-start gap-3">
                         <FileText className="h-8 w-8 text-rose-500 shrink-0" />
                         <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-foreground">Proposal_Document.pdf</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Primary Submission File</p>
                         </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button asChild variant="outline" size="sm" className="flex-1 text-[11px] h-8">
                          <a href={proposal.proposalFile} target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="mr-1.5 h-3 w-3" /> View PDF
                          </a>
                        </Button>
                        <Button asChild size="sm" className="flex-1 text-[11px] h-8 bg-primary">
                          <a href={proposal.proposalFile} download>
                             <Download className="mr-1.5 h-3 w-3" /> Download
                          </a>
                        </Button>
                      </div>
                    </div>
                 ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground italic">No primary PDF file uploaded</div>
                 )}

                 {proposal.updatedProposal && (
                   <button 
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-t border-muted/50 text-left"
                      onClick={() => window.open(proposal.updatedProposal!, "_blank")}
                   >
                      <div className="flex items-center gap-3">
                         <FileText className="h-4 w-4 text-rose-500" />
                         <div>
                            <p className="text-xs font-bold truncate max-w-[150px]">Updated_Proposal.pdf</p>
                            <p className="text-[10px] text-muted-foreground">Revised Document</p>
                         </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                   </button>
                 )}
              </CardContent>
           </Card>
        </aside>
      </div>
    </PageContainer>
  );
}

const MOCK_PROPOSAL = {
  id: 2,
  referenceNumber: "PRP-2026-0002",
  title: "Enhancing Inclusive Education for Students with Special Needs in Primary Schools of Addis Ababa",
  abstract: "This study aims to investigate the current state of inclusive education practices in primary schools of Addis Ababa. Despite the existing policy frameworks, students with disabilities continue to face significant barriers to quality education. This research will employ a mixed-methods approach to identify systemic challenges and recommend evidence-based interventions.",
  keywords: ["Inclusive Education", "Special Needs", "Primary Schools", "Addis Ababa"],
  startDate: "2026-05-20",
  endDate: "2027-05-20",
  budgetRequested: "73047.00",
  proposalFile: "http://localhost:8000/media/proposals/PSR_FRS_v1-1.pdf",
  updatedProposal: null,
  supportingDocs: null,
  version: 1,
  resubmissionCount: 0,
  rejectionReason: null,
  needsIrb: true,
  createdAt: "2026-05-20T14:50:03.483760Z",
  firstSubmittedAt: null,
  lastSubmittedAt: null,
  submittedAt: null,
  signature: null,
  workflowState: "draft",
  status: "draft",
  thematicAreas: [
    {
      id: 1,
      name: "Basic Education & Quality Enhancement"
    }
  ],
  strategicObjectives: [
    {
      id: 1,
      name: "Improve physical and pedagogical accessibility in metropolitan primary schools"
    },
    {
      id: 2,
      name: "Build adaptive capacity for inclusive teaching methods among core educators"
    }
  ],
  receivingOffice: {
    id: 1,
    name: "Ministry of Innovation and Technology"
  },
  call: {
    id: 5,
    title: "2026 Research and Innovation Grant Call"
  },
  Organization: {
    id: 2,
    name: "Addis Ababa Science and Technology University"
  },
  Unit: {
    id: 1,
    name: "Electrical and Computer Engineering"
  },
  proposalType: {
    id: 1,
    name: "Research Proposal"
  },
  subThematicArea: {
    id: 1,
    name: "Special Needs & Pedagogical Support"
  },
  createdBy: {
    id: 1,
    firstName: "Mecha",
    lastName: "Daniel",
    email: "admin@gmail.com"
  },
  teamMembers: [
    { id: "1", name: "Dr. Sarah Johnson", institution: "Kotebe Education University", role: "co_pi" },
    { id: "2", name: "Ato Tadesse Haile", institution: "Ministry of Education", role: "researcher" }
  ],
  reviewHistory: null
};

