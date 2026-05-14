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
  Edit
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { proposalsApi } from "@/lib/api/client";
import type { ResearchProposal, ProposalReview } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { THEMATIC_AREAS } from "@/lib/constants";

export default function ProposalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<ResearchProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) return <PageContainer title="Loading Proposal..."><div className="h-96 flex items-center justify-center">Loading...</div></PageContainer>;
  if (!proposal) return <PageContainer title="Proposal Not Found">Not Found</PageContainer>;

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    under_review: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <PageContainer
      title={proposal.title}
      description={`Reference: ${proposal.id || 'PRP-2024-0042'}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
             <Link href={`/research/proposals/my-proposals/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
             </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Overview</TabsTrigger>
              <TabsTrigger value="methodology" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Methodology</TabsTrigger>
              <TabsTrigger value="budget" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Budget & Team</TabsTrigger>
              <TabsTrigger value="evaluations" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">ROC Evaluations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              {/* Abstract */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Abstract & Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Technical Abstract</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{proposal.abstract}</p>
                   </div>
                   <div className="pt-4 border-t border-dashed">
                      <h4 className="text-sm font-bold text-foreground mb-2">Research Background & Rationale</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{proposal.background}</p>
                   </div>
                </CardContent>
              </Card>

              {/* Objectives */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Research Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{proposal.objectives}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methodology" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Methodology & Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{proposal.methodology}</p>
                   </div>
                   <div className="pt-6 border-t border-dashed">
                      <h4 className="text-sm font-bold text-foreground mb-2">Ethical Considerations</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">"{proposal.ethicalConsiderations}"</p>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                 <Card className="shadow-sm border-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Budget Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="space-y-2">
                          {[
                            { label: "Personnel", value: proposal.budget.personnel },
                            { label: "Equipment", value: proposal.budget.equipment },
                            { label: "Travel & Fieldwork", value: proposal.budget.travel },
                            { label: "Consumables", value: proposal.budget.consumables },
                            { label: "Other / Institutional", value: proposal.budget.other },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center py-2 border-b border-muted/30 last:border-0">
                               <span className="text-sm text-muted-foreground">{item.label}</span>
                               <span className="text-sm font-bold">ETB {item.value.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center py-3 mt-2 bg-primary/5 rounded-lg px-3 border border-primary/10">
                               <span className="text-sm font-black text-primary uppercase">Total Requested</span>
                               <span className="text-base font-black text-primary">ETB {proposal.budget.total.toLocaleString()}</span>
                          </div>
                       </div>
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
                             {proposal.principalInvestigator.firstName[0]}{proposal.principalInvestigator.lastName[0]}
                          </div>
                          <div>
                             <p className="text-sm font-bold">Dr. {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}</p>
                             <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Principal Investigator</p>
                          </div>
                       </div>
                       
                       <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-bold uppercase text-muted-foreground px-1">Co-Investigators ({proposal.coInvestigators.length})</h4>
                          {proposal.coInvestigators.map((member) => (
                             <div key={member.id} className="flex items-center justify-between p-2 rounded border border-muted/50 hover:bg-muted/30 transition-colors">
                                <div>
                                   <p className="text-sm font-medium">{member.name}</p>
                                   <p className="text-[10px] text-muted-foreground">{member.institution}</p>
                                </div>
                                <Badge variant="secondary" className="text-[9px] uppercase">{member.role.replace('_', ' ')}</Badge>
                             </div>
                          ))}
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </TabsContent>

            <TabsContent value="evaluations" className="pt-6 space-y-6">
               <div className="grid gap-4">
                  {proposal.reviews && proposal.reviews.length > 0 ? (
                    proposal.reviews.map((review) => (
                       <Card key={review.id} className="shadow-sm border-primary/5">
                          <CardContent className="p-5">
                             <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                      <ShieldCheck className="h-4 w-4 text-primary" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold">ROC Reviewer {review.id.slice(-4)}</p>
                                      <p className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-xl font-black text-primary">{review.overallScore}/100</p>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Score</p>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                                {[
                                  { label: "Technical", val: review.technicalMerit, max: 25 },
                                  { label: "Methodology", val: review.methodology, max: 25 },
                                  { label: "Feasibility", val: review.feasibility, max: 20 },
                                  { label: "Budget", val: review.budget, max: 15 },
                                  { label: "Impact", val: review.impact, max: 15 },
                                ].map((s) => (
                                   <div key={s.label} className="bg-muted/30 p-2 rounded-lg text-center">
                                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{s.label}</p>
                                      <p className="text-sm font-black">{s.val}<span className="text-[9px] font-normal text-muted-foreground">/{s.max}</span></p>
                                   </div>
                                ))}
                             </div>

                             <div className="space-y-4">
                                <div>
                                   <h4 className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1 mb-1">
                                      <CheckCircle2 className="h-3 w-3" /> Strengths
                                   </h4>
                                   <p className="text-xs text-muted-foreground leading-relaxed">{review.strengths}</p>
                                </div>
                                <div>
                                   <h4 className="text-[10px] font-bold text-rose-700 uppercase flex items-center gap-1 mb-1">
                                      <AlertCircle className="h-3 w-3" /> Weaknesses
                                   </h4>
                                   <p className="text-xs text-muted-foreground leading-relaxed">{review.weaknesses}</p>
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                    ))
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                       <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                       <h3 className="font-bold text-muted-foreground">No Evaluations Yet</h3>
                       <p className="text-xs text-muted-foreground max-w-xs mx-auto">This proposal is currently in the queue for the Research Oversight Committee (ROC) evaluation.</p>
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
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={cn("px-3 py-1 border shadow-none", statusColors[proposal.status])}>
                       {proposal.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Research Area</span>
                    <Badge variant="outline" className="font-bold border-primary/20">
                       {THEMATIC_AREAS.find(a => a.value === proposal.researchArea)?.label || proposal.researchArea}
                    </Badge>
                 </div>
                 <div className="pt-4 border-t">
                    <div className="flex items-center gap-3 text-muted-foreground mb-3">
                       <Clock className="h-4 w-4" />
                       <div className="text-xs">
                          <p className="font-bold text-foreground">Submitted on</p>
                          <p>{new Date(proposal.submittedAt || proposal.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institutional Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                       <p className="text-sm font-bold leading-tight">{proposal.institution}</p>
                       <p className="text-xs text-muted-foreground mt-1">Lead Research Institution</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 p-0">
                 {proposal.attachments.map((file) => (
                    <button 
                       key={file.id} 
                       className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                       <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-rose-500" />
                          <div className="text-left">
                             <p className="text-xs font-bold truncate max-w-[140px]">{file.name}</p>
                             <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                       </div>
                       <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                 ))}
                 {proposal.attachments.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground italic">No files attached</div>
                 )}
              </CardContent>
           </Card>
        </aside>
      </div>
    </PageContainer>
  );
}

const MOCK_PROPOSAL = {
   id: "PRP-2024-0042",
   title: "Enhancing Inclusive Education for Students with Special Needs in Primary Schools of Addis Ababa",
   abstract: "This study aims to investigate the current state of inclusive education practices in primary schools of Addis Ababa. Despite the existing policy frameworks, students with disabilities continue to face significant barriers to quality education. This research will employ a mixed-methods approach to identify systemic challenges and recommend evidence-based interventions.",
   background: "Ethiopia has made commendable strides in universalizing primary education. However, children with disabilities remain one of the most marginalized groups. Preliminary data suggests that less than 10% of children with special needs have access to formal schooling. This research is critical to aligning national practice with the 'Education Sector Development Programme VI' goals of equity and inclusion.",
   objectives: "1. To assess the physical and pedagogical accessibility of 20 selected primary schools.\n2. To evaluate the competency of teachers in adapting curricula for diverse learners.\n3. To identify psychosocial barriers among peers and school management.\n4. To propose a scalable model for 'Inclusion Hubs' in metropolitan schools.",
   methodology: "A concurrent transformative mixed-methods design will be used. Quantitatively, we will survey 400 teachers using a standardized Inclusive Education Competency Scale. Qualitatively, we will conduct 12 focus group discussions with parents and students with disabilities. Data triangulation will be performed using NVivo and SPSS software.",
   ethicalConsiderations: "Informed consent will be obtained from all participants. For students under 18, parental consent and student assent will be secured. Data will be anonymized to ensure confidentiality.",
   principalInvestigator: {
      firstName: "Abebe",
      lastName: "Mekonnen",
      institution: "Addis Ababa University",
      email: "abebe.m@aau.edu.et"
   },
   coInvestigators: [
      { id: "1", name: "Dr. Sarah Johnson", institution: "Kotebe Education University", role: "co_pi" },
      { id: "2", name: "Ato Tadesse Haile", institution: "Ministry of Education", role: "researcher" }
   ],
   institution: "Addis Ababa University, College of Education",
   researchArea: "Basic Education",
   budget: {
      personnel: 240000,
      equipment: 85000,
      travel: 120000,
      consumables: 45000,
      other: 60000,
      total: 550000
   },
   status: "under_review",
   attachments: [
      { id: "f1", name: "Technical_Proposal_V2.pdf", size: 4500000 },
      { id: "f2", name: "Ethical_Clearance_AAU.pdf", size: 1200000 },
      { id: "f3", name: "Budget_Justification.docx", size: 850000 }
   ],
   reviews: [
      {
         id: "rev-101",
         overallScore: 88,
         technicalMerit: 22,
         methodology: 20,
         feasibility: 18,
         budget: 14,
         impact: 14,
         strengths: "The research addresses a critical gap in the education sector. The mixed-methods approach is robust and the PI has a strong track record.",
         weaknesses: "The travel budget seems slightly inflated for an urban study. Some data collection tools need better validation.",
         createdAt: "2024-03-15T10:00:00Z"
      }
   ],
   submittedAt: "2024-02-10T14:30:00Z",
   createdAt: "2024-02-01T09:00:00Z"
};
