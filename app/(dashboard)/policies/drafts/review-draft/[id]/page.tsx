"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Download,
  Activity,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Users,
  Edit,
  Eye,
  XCircle,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { POLICY_TYPES } from "@/lib/constants";
import type { PolicyStatus, PolicyType } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PdfViewer } from "@/components/shared";
import { Accordion, AccordionContent } from "@radix-ui/react-accordion";

// Mock Data
const getDraftMock = (id: string) => ({
  id,
  title: "Digital Health Strategy 2025-2030 Draft",
  versionNumber: "v1.2.0",
  type: "strategy" as PolicyType,
  status: "under_review" as PolicyStatus,
  submissionDate: "2024-05-02T10:00:00Z",
  submittedBy: { firstName: "Yohannes", lastName: "Girma", role: "Director" },
  conceptNoteId: "cn-002",
  executiveSummary:
    "This comprehensive draft expands upon the approved concept note, detailing the strategic implementation of digital health resources across national primary and secondary care centers. It includes robust budget forecasts, systemic integration plans, and a 5-year rollout timeline.",
  draftFile: { name: "DHS_Draft_v1.2.pdf", size: "4.5 MB" },
  versionHistory: [
    { 
      version: "v1.2.0", 
      date: "2024-05-02T10:00:00Z", 
      author: { firstName: "Yohannes", lastName: "Girma" }, 
      description: "Comprehensive expansion of e-Health architecture and regional budget forecasting.", 
      status: "current",
      size: "4.5 MB"
    },
    { 
      version: "v1.1.0", 
      date: "2024-04-15T09:30:00Z", 
      author: { firstName: "Yohannes", lastName: "Girma" }, 
      description: "Initial draft structure incorporating core research findings and objectives.", 
      status: "archived",
      size: "3.2 MB"
    },
    { 
      version: "v1.0.1", 
      date: "2024-04-02T16:45:00Z", 
      author: { firstName: "Yohannes", lastName: "Girma" }, 
      description: "Pre-draft alignment with ratified concept note objectives.", 
      status: "archived",
      size: "1.8 MB"
    }
  ],
  reviews: [
    {
      id: "REV-001",
      version: "v1.2.0",
      reviewer: { 
        id: "r1", 
        firstName: "Abebe", 
        lastName: "Kebede", 
        position: "Public Health Lead",
        institution: "Federal Ministry of Health",
        image: "" 
      },
      status: "completed",
      score: 88,
      recommendation: "approve",
      comments: "The draft is technically sound and aligns well with the national e-Health architecture. However, the section on inter-agency data sharing protocols could be more robust.",
      createdAt: "2024-05-10T14:30:00Z",
      checklist: [
        { category: "Technical Alignment", passed: true, feedback: "Excellent alignment with existing digital infrastructure." },
        { category: "Feasibility", passed: true, feedback: "Highly feasible given the current budget allocations." },
        { category: "Strategic Impact", passed: true, feedback: "Addresses 90% of the core strategic objectives." },
        { category: "Data Governance", passed: false, feedback: "Slightly weak on cross-border data handling." },
        { category: "Inclusion & Equity", passed: true, feedback: "Good focus on rural accessibility." },
      ]
    },
    {
      id: "REV-002",
      version: "v1.2.0",
      reviewer: { 
        id: "r2", 
        firstName: "Sara", 
        lastName: "Yohannes", 
        position: "Digital Health Architect",
        institution: "EPHI",
        image: "" 
      },
      status: "completed",
      score: 88,
      recommendation: "approve",
      comments: "The technical architecture is solid. I recommend ensuring the API documentation is fully updated before the final ratification.",
      createdAt: "2024-05-12T09:15:00Z",
      checklist: [
        { category: "System Integration", passed: true, feedback: "Supports all required legacy protocols." },
        { category: "Security Compliance", passed: true, feedback: "Encryption standards meet national guidelines." },
        { category: "API Documentation", passed: false, feedback: "Endpoints for regional sync are not yet documented." },
        { category: "Scalability", passed: true, feedback: "Load balancing plan is well-thought-out." },
      ]
    },
    {
      id: "REV-003",
      version: "v1.2.0",
      reviewer: { 
        id: "r3", 
        firstName: "Tigist", 
        lastName: "Haile", 
        position: "Policy Consultant",
        institution: "WHO Regional Office",
        image: "" 
      },
      status: "pending",
      score: null,
      recommendation: null,
      comments: null,
      createdAt: "2024-05-13T11:00:00Z",
      checklist: []
    },
    {
      id: "REV-004",
      version: "v1.1.0",
      reviewer: { 
        id: "r4", 
        firstName: "Mulugeta", 
        lastName: "Bekele", 
        position: "Senior Researcher",
        institution: "Health Informatics Center",
        image: "" 
      },
      status: "completed",
      score: 74,
      recommendation: "revise",
      comments: "Initial version was too broad. Recommended focusing on secondary care centers first before full national rollout.",
      createdAt: "2024-04-15T11:00:00Z",
      checklist: [
        { category: "Technical Alignment", passed: false, feedback: "Technical specs were too vague in this version." },
        { category: "Feasibility", passed: false, feedback: "Implementation timeline was overly optimistic." },
        { category: "Strategic Impact", passed: true, feedback: "Strategic goals were well-defined." },
        { category: "Data Governance", passed: false, feedback: "Missing key security protocols." },
        { category: "Inclusion & Equity", passed: true, feedback: "Excellent inclusion metrics." },
      ]
    }
  ],
  timeline: [
    { 
      event: "Concept Note Ratified", 
      date: "2024-03-25T10:00:00Z", 
      status: "completed", 
      icon: CheckCircle2,
      description: "Initial strategy for e-Health integration approved by the Federal Council." 
    },
    { 
      event: "Drafting Phase Initiated", 
      date: "2024-04-02T16:45:00Z", 
      status: "completed", 
      icon: Edit,
      description: "First technical draft v1.0.1 developed by the research lead." 
    },
    { 
      event: "Expert Review Cycle 1", 
      date: "2024-04-15T11:00:00Z", 
      status: "completed", 
      icon: Users,
      description: "Preliminary review of v1.1.0 completed by 3 regional experts." 
    },
    { 
      event: "Draft v1.2.0 Published", 
      date: "2024-05-02T10:00:00Z", 
      status: "completed", 
      icon: FileText,
      description: "Current iteration addressing architectural and budget feedback." 
    },
    { 
      event: "Final Review Cycle", 
      date: "2024-05-10T14:30:00Z", 
      status: "active", 
      icon: Activity,
      description: "Peer evaluation and security audits currently underway." 
    },
    { 
      event: "Council Ratification", 
      date: "2024-06-15T09:00:00Z", 
      status: "planned", 
      icon: ClipboardCheck,
      description: "Scheduled final vote for policy adoption." 
    },
  ],
});

export default function DraftDetailPage() {
  const params = useParams();
  const [draft, setDraft] = useState<ReturnType<typeof getDraftMock>>(
    getDraftMock((params as any)?.id || "d-001"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <PageContainer title="Loading Draft Details...">
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const versions = Array.from(new Set(draft.reviews.map(r => r.version)));

  const filteredReviews = draft.reviews.map(review => {
    // If we are filtering by checklist status, we need to filter the items inside
    const filteredChecklist = review.checklist.filter(item => {
      if (statusFilter === "all") return true;
      if (statusFilter === "yes") return item.passed === true;
      if (statusFilter === "no") return item.passed === false;
      return true;
    });

    return { ...review, checklist: filteredChecklist };
  }).filter(review => {
    const matchesVersion = versionFilter === "all" || review.version === versionFilter;
    // If filtering by checklist status, the review must have at least one matching item
    // UNLESS it's pending (no checklist items yet) and we are showing all
    const hasMatchingChecklist = statusFilter === "all" || review.checklist.length > 0;
    
    return matchesVersion && hasMatchingChecklist;
  });

  const groupedReviews = filteredReviews.reduce((acc: any, review: any) => {
    const v = review.version || "v1.0.0";
    if (!acc[v]) acc[v] = [];
    acc[v].push(review);
    return acc;
  }, {});

  return (
    <PageContainer
      title={draft.title}
      description={`Reviewing Draft Version: ${draft.versionNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm">
            <Link href="/policies/drafts/review-draft">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drafts
            </Link>
          </Button>
          <Button  asChild className="shadow-sm">
            <Link href={`/policies/drafts/review-draft/${draft.id}/review`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Review
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-10 w-full justify-start border-b bg-transparent rounded-none p-0 gap-0">
              {[
                { value: "overview", label: "Overview", icon: FileText },
                { value: "document", label: "Document", icon: FileText },
                {
                  value: "feedback",
                  label: "Expert Feedback",
                  icon: ClipboardCheck,
                },
                { value: "timeline", label: "Timeline", icon: Clock },
                { value: "versions", label: "Versions", icon: Users },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Executive
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {draft.executiveSummary}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="document" className="mt-6">
              <Card className="shadow-lg border-primary/20 overflow-hidden">
                <PdfViewer
                  url="/doc/PSR_FRS_v1.pdf"
                  title={draft.draftFile.name}
                  className="h-[900px]"
                />
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="mt-6 space-y-6">
              {/* Filter Bar */}
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Filters</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Version</label>
                        <Select value={versionFilter} onValueChange={setVersionFilter}>
                          <SelectTrigger className="h-9 w-[130px] bg-background">
                            <SelectValue placeholder="All Versions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Versions</SelectItem>
                            {versions.map(v => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Checklist Decision</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-9 w-[130px] bg-background">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="yes" className="text-green-600 font-bold">Yes / Passed</SelectItem>
                            <SelectItem value="no" className="text-red-600 font-bold">No / Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {(versionFilter !== "all" || statusFilter !== "all") && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setVersionFilter("all"); setStatusFilter("all"); }}
                          className="text-xs font-bold text-primary hover:text-primary/80"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {filteredReviews.length > 0 ? (
                <Accordion
                  type="multiple" 
                  defaultValue={Object.keys(groupedReviews).sort((a, b) => b.localeCompare(a))}
                  className="space-y-6"
                >
                  {Object.entries(groupedReviews)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([version, reviews]: [string, any]) => {
                      const avgScore = Math.round(reviews.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / reviews.filter((r: any) => r.score !== null).length || 0);
                      
                      return (
                        <Card key={version} className="shadow-sm border-primary/10 overflow-hidden">
                          <AccordionItem value={version} className="border-none">
                            <AccordionTrigger className="hover:no-underline p-6 bg-muted/20 group data-[state=open]:bg-muted/40 transition-colors">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full text-left">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[state=closed]:bg-muted group-data-[state=closed]:text-muted-foreground transition-all duration-300">
                                    <Activity className="h-6 w-6" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                      Draft <span className="text-primary">{version}</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                      {reviews.length} Expert Assessment{reviews.length !== 1 ? "s" : ""} recorded
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 md:border-l md:pl-6 border-muted-foreground/20">
                                  <div className="flex flex-col items-end">
                                    <Badge 
                                      className={cn(
                                        "font-mono font-bold text-sm px-3 py-1",
                                        avgScore >= 70 ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"
                                      )}
                                    >
                                      Avg. {avgScore}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-6 pb-6 pt-8">
                              <div className="grid gap-8 pl-4 border-l-2 border-primary/10 ml-4">
                                {reviews.map((review: any) => (
                                  <Card
                                    key={review.id}
                                    className="shadow-sm border-primary/5 bg-background overflow-hidden hover:shadow-md transition-shadow duration-300"
                                  >
                                    <CardHeader className="bg-muted/30 border-b py-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-10 w-10 border-2 border-background">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                              {review.reviewer.firstName[0]}
                                              {review.reviewer.lastName[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground">
                                              {review.reviewer.firstName} {review.reviewer.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {review.reviewer.position || "Expert Reviewer"} · {review.reviewer.institution || "PSR Council"}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Score</span>
                                            <Badge 
                                              className={cn(
                                                "font-mono font-bold text-xs px-2 py-0.5",
                                                review.score === null ? "bg-muted text-muted-foreground" :
                                                review.score >= 70 ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"
                                              )}
                                            >
                                              {review.score !== null ? `${review.score}%` : "N/A"}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-5 pb-6">
                                      <div className="space-y-6">
                                        <div className="space-y-2">
                                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            Expert Feedback
                                          </h4>
                                          <p className="text-sm leading-relaxed text-slate-700 italic border-l-4 border-muted pl-4">
                                            {review.comments || "Review in progress..."}
                                          </p>
                                        </div>

                                        {review.checklist && review.checklist.length > 0 && (
                                          <div className="pt-2">
                                            <Accordion type="single" collapsible className="w-full">
                                              <AccordionItem value="checklist" className="border-none">
                                                <AccordionTrigger className="flex items-center gap-2 py-2 hover:no-underline group">
                                                  <div className="flex items-center gap-2">
                                                    <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                                                      Checklist Breakdown
                                                    </h4>
                                                  </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-4 pb-0">
                                                  <div className="grid gap-3 pl-4 border-l-2 border-muted/50">
                                                    {review.checklist.map((item: any) => (
                                                      <div key={item.category} className="flex items-start justify-between gap-4 py-1">
                                                        <div className="space-y-1">
                                                          <p className="text-sm font-medium text-foreground">{item.category}</p>
                                                          {item.feedback && (
                                                            <p className="text-xs text-muted-foreground italic">
                                                              {item.feedback}
                                                            </p>
                                                          )}
                                                        </div>
                                                        <Badge 
                                                          variant="outline"
                                                          className={cn(
                                                            "h-6 px-2 text-[10px] font-bold uppercase tracking-wider gap-1 shrink-0",
                                                            item.passed 
                                                              ? "bg-green-50 text-green-700 border-green-200" 
                                                              : "bg-red-50 text-red-700 border-red-200"
                                                          )}
                                                        >
                                                          {item.passed ? (
                                                            <>
                                                              <CheckCircle2 className="h-3 w-3" />
                                                              Yes
                                                            </>
                                                          ) : (
                                                            <>
                                                              <XCircle className="h-3 w-3" />
                                                              No
                                                            </>
                                                          )}
                                                        </Badge>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </AccordionContent>
                                              </AccordionItem>
                                            </Accordion>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                    <div className="bg-muted/10 border-t py-2 px-4 flex justify-between items-center">
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                      <span className="text-[10px] font-mono text-muted-foreground/60">
                                        {review.id}
                                      </span>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Card>
                      );
                    })
                  }
                </Accordion>
              ) : (
                <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-muted-foreground">
                    No Feedback Yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This draft is still awaiting expert evaluation.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Policy Development Timeline</CardTitle>
                  <CardDescription>Complete traceability from submission to review</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative">
                    <div className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                      </div>
                      <div className="pt-1 pb-2">
                        <p className="text-sm font-semibold">Draft Document Created</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(draft.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {draft.reviews?.filter(r => r.status === "completed").map((review, index) => (
                      <div key={review.id} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                        </div>
                        <div className="pt-1 pb-2">
                          <p className="text-sm font-semibold">Expert Review Completed by {review.reviewer.firstName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {draft.reviews?.some(r => r.status === "pending") && (
                       <div className="flex gap-4 pb-6 last:pb-0">
                       <div className="flex flex-col items-center">
                         <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-amber-100 border-amber-400 text-amber-600">
                           <Clock className="h-4 w-4" />
                         </div>
                       </div>
                       <div className="pt-1 pb-2">
                         <p className="text-sm font-semibold text-amber-700">Awaiting Expert Review</p>
                         <p className="text-xs text-muted-foreground mt-0.5">Under evaluation by assigned PSR experts</p>
                       </div>
                     </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="mt-6">
              <div className="grid gap-6">
                {(draft as any).versionHistory?.map((v: any, index: number) => (
                  <Card key={v.version} className={cn(
                    "shadow-sm border-primary/10 overflow-hidden relative group",
                    v.status === "current" ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
                  )}>
                    {v.status === "current" && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-bl-lg shadow-sm">
                          Latest Version
                        </div>
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5 flex-1">
                          <div className={cn(
                            "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            v.status === "current" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <FileText className="h-7 w-7" />
                          </div>
                          <div className="space-y-3 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-bold text-foreground">Draft Document {v.version}</h3>
                              <Badge variant="outline" className="font-mono text-[10px] bg-background">
                                {v.size}
                              </Badge>
                              {v.status === "archived" && (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                  Archived
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {v.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-6 pt-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <User className="h-3.5 w-3.5" />
                                <span>Uploaded by {v.author.firstName} {v.author.lastName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(v.date).toLocaleDateString("en-US", { 
                                  month: "short", 
                                  day: "numeric", 
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 md:border-l md:pl-6 border-muted/60">
                           <Button variant="outline" size="sm" className="h-10 px-4 font-semibold text-xs gap-2 border-primary/20 hover:bg-primary/5">
                              <Eye className="h-4 w-4" />
                              View
                           </Button>
                           <Button size="sm" className="h-10 px-4 font-semibold text-xs gap-2">
                              <Download className="h-4 w-4" />
                              Download
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Progress Indicator line for history */}
                    {index < (draft as any).versionHistory.length - 1 && (
                      <div className="absolute bottom-0 left-12 w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground/20 translate-y-full" />
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge type="policy" status={draft.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Document Type
                </span>
                <span className="text-sm font-medium">
                  {POLICY_TYPES[draft.type]?.label || draft.type}
                </span>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Proposed By
                    </span>
                    <span className="text-sm font-medium">
                      {draft.submittedBy.firstName} {draft.submittedBy.lastName}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Original Concept
                    </span>
                    <Link
                      href={`/policies/concept-notes/${draft.conceptNoteId}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {draft.conceptNoteId}
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Submission Date
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(draft.submissionDate).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                Expert Reviewers{" "}
                <Badge variant="secondary" className="font-normal">
                  {draft.reviews.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.reviews.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    No experts assigned yet.
                  </p>
                </div>
              ) : (
                draft.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {rev.reviewer.firstName[0]}
                          {rev.reviewer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {rev.reviewer.firstName} {rev.reviewer.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                          {rev.status === "completed" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500" />{" "}
                              Graded
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-orange-400" />{" "}
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    {rev.score !== null && (
                      <Badge
                        className={cn(
                          "font-mono font-bold",
                          rev.score >= 70 ? "bg-green-600" : "bg-orange-500",
                        )}
                      >
                        {rev.score}%
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
