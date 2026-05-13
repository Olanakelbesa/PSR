"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Send,
  FileText,
  User,
  Calendar,
  Clock,
  Building,
  Tag,
  BookOpen,
  Download,
  ClipboardCheck,
  CheckCircle2,
  Eye,
  ZoomIn,
  ZoomOut,
  Printer,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Building2,
  GitBranch,
  ExternalLink,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { conceptNoteApi } from "@/lib/api/client";
import { POLICY_TYPES, POLICY_STATUSES } from "@/lib/constants";
import type { ConceptNote, Attachment } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOCK_REVIEWS: any[] = [
  {
    id: "REV-001",
    reviewerId: "rev1",
    reviewer: {
      firstName: "Dr. Kassahun",
      lastName: "Taye",
      image: "",
      position: "Senior Policy Analyst",
      institution: "Ministry of Education"
    },
    comments: "The strategic alignment with the 10-year development plan is excellent. However, the budget allocation for digital infrastructure needs more granular detail in the next phase.",
    recommendation: "approve",
    decision: "Accepted",
    supportingDocument: { name: "Technical_Compliance_Report.pdf", url: "#" },
    score: 92,
    criteria: [
      { name: "Strategic Alignment", score: 10, maxScore: 10 },
      { name: "Feasibility", score: 8, maxScore: 10 },
      { name: "Institutional Capacity", score: 9, maxScore: 10 },
      { name: "Resource Efficiency", score: 9, maxScore: 10 }
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "REV-002",
    reviewerId: "rev2",
    reviewer: {
      firstName: "Elena",
      lastName: "Girma",
      image: "",
      position: "Technical Specialist",
      institution: "PSR Technical Committee"
    },
    comments: "Methodology is sound and the expected outcomes are realistic. I recommend moving forward to the drafting stage with minor adjustments to the monitoring framework.",
    recommendation: "revise",
    decision: "Partially Accepted",
    supportingDocument: null,
    score: 88,
    criteria: [
      { name: "Strategic Alignment", score: 9, maxScore: 10 },
      { name: "Feasibility", score: 9, maxScore: 10 },
      { name: "Technical Rigor", score: 8, maxScore: 10 },
      { name: "Social Impact", score: 10, maxScore: 10 }
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "REV-003",
    reviewerId: "rev3",
    reviewer: {
      firstName: "Samuel",
      lastName: "Kassa",
      image: "",
      position: "Legal Counsel",
      institution: "Ministry of Justice"
    },
    comments: "The current proposal lacks the necessary legal grounding for data privacy compliance in cross-border education data exchange.",
    recommendation: "reject",
    decision: "Rejected",
    supportingDocument: { name: "Legal_Objection_Memo.pdf", url: "#" },
    score: 45,
    criteria: [
      { name: "Legal Compliance", score: 3, maxScore: 10 },
      { name: "Data Security", score: 4, maxScore: 10 }
    ],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function ConceptNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<ConceptNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingFile, setViewingFile] = useState<Attachment | null>(null);

  useEffect(() => {
    async function loadNote() {
      if (!params.id) return;
      try {
        const response = await conceptNoteApi.getConceptNote(params.id as string);
        const data = response.data;
        if (data) {
          // Inject mock reviews for demonstration if needed
          data.reviews = [...(data.reviews || []), ...MOCK_REVIEWS];
          setNote(data);
        }
      } catch (error) {
        console.error("Failed to load concept note:", error);
        toast.error("Failed to load document details");
      } finally {
        setIsLoading(false);
      }
    }
    loadNote();
  }, [params.id]);

  const handleSubmit = async () => {
    if (!note) return;
    setIsSubmitting(true);
    try {
      const response = await conceptNoteApi.submitConceptNote(note.id);
      if (response.success) {
        toast.success("Concept note successfully submitted for PSR review.");
        setNote(response.data!);
      }
    } catch (error) {
      toast.error("Failed to submit concept note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <PageContainer
      title={note.title}
      description={`${note.id} · ${POLICY_TYPES[note.policyType]?.label || note.policyType} · ${note.createdBy.institution || "Ministry of Health"}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/concept-notes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          {note.status === "draft" && (
            <Button variant="outline" asChild className="shadow-sm border-primary/20 text-primary hover:bg-primary/5">
              <Link href={`/policies/concept-notes/${note.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {note.status === "draft" && (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="shadow-sm">
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main Content Area */}
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-10 w-full justify-start border-b bg-transparent rounded-none p-0 gap-0">
              {[
                { value: "overview", label: "Overview", icon: FileText },
                { value: "document", label: "Document", icon: FileText },
                { value: "feedback", label: "Expert Feedback", icon: ClipboardCheck },
                { value: "timeline", label: "Timeline", icon: Clock },
                { value: "versions", label: "Versions", icon: GitBranch },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{note.background}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Document Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Concept ID", value: note.id },
                      { label: "Policy Type", value: POLICY_TYPES[note.policyType]?.label || note.policyType },
                      { label: "Author", value: `${note.createdBy.firstName} ${note.createdBy.lastName}` },
                      { label: "Organization", value: note.createdBy.institution || "Ministry of Health" },
                      { label: "Created At", value: new Date(note.createdAt).toLocaleDateString() },
                      { label: "Last Updated", value: new Date(note.updatedAt).toLocaleDateString() },
                      { label: "Status", value: note.status.replace("_", " ").toUpperCase() },
                      { label: "Version", value: "v1.0.0" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</dt>
                        <dd className="text-sm font-semibold">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Thematic Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex flex-wrap gap-2">
                  {["Health Systems", "Digital Policy", "Education"].map((area) => (
                    <Badge key={area} variant="secondary" className="px-3 py-1 text-sm">{area}</Badge>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Supporting Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  {note.attachments && note.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {note.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-medium truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 gap-2"
                              onClick={() => setViewingFile(file)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 gap-2"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = file.url;
                                link.download = file.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">No supporting files attached.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Document Tab */}
            <TabsContent value="document" className="mt-6">
              <Card className="shadow-lg border-primary/20 overflow-hidden bg-muted/5">
                <CardHeader className="bg-background border-b py-3 px-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 border rounded-md bg-muted/50 p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomOut className="h-4 w-4" /></Button>
                        <span className="text-xs font-medium px-2">100%</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomIn className="h-4 w-4" /></Button>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-xs font-medium px-1">Page 1 / 1</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <Printer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Full Screen</span>
                      </Button>
                      <Button size="sm" className="h-8 gap-1.5 bg-primary">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download PDF</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 bg-slate-200/50 flex justify-center items-start overflow-auto min-h-[600px] max-h-[1000px]">
                  <div className="my-8 shadow-2xl bg-white w-full max-w-[800px] min-h-[1100px] p-8 sm:p-16 space-y-8 text-slate-800">
                    <div className="text-center space-y-4 border-b-4 border-primary pb-8">
                      <div className="flex justify-center mb-4">
                         <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-primary" />
                         </div>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-tight">Federal Democratic Republic of Ethiopia</h1>
                      <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-muted-foreground">{note.createdBy.institution || "Ministry of Health"}</h2>
                    </div>

                    <div className="py-8 sm:py-12 text-center space-y-6">
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight uppercase">
                        {note.title}
                      </h3>
                      <div className="flex justify-center gap-8 py-4">
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Serial Number</p>
                          <p className="text-sm font-mono font-bold">{note.id}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Version</p>
                          <p className="text-sm font-mono font-bold">v1.0.0</p>
                        </div>
                      </div>
                      <div className="inline-block px-6 py-2 border-2 border-slate-900 font-black text-lg">
                        OFFICIAL CONCEPT DOCUMENT
                      </div>
                    </div>

                    <div className="space-y-6 text-justify">
                      <p className="font-bold text-lg border-l-4 border-primary pl-4 uppercase tracking-wide">1. Executive Summary</p>
                      <p className="leading-relaxed text-sm sm:text-base">
                        {note.background}
                      </p>
                      <p className="leading-relaxed text-sm sm:text-base">
                        This document serves as the primary concept framework for health policy refinement within the national education and health systems. It outlines the strategic objectives, implementation methodologies, and oversight mechanisms required to achieve the stated outcomes within the operational period of 2025-2027.
                      </p>
                    </div>

                    <div className="pt-24 mt-auto">
                      <div className="flex justify-between items-end border-t pt-8">
                        <div className="space-y-4">
                          <div className="h-12 w-48 bg-slate-100 rounded-sm border-b-2 border-slate-300 italic flex items-center justify-center text-slate-400 text-xs">
                            Electronic Signature Verified
                          </div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Authorized PSR Officer</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-bold uppercase">Registry Timestamp</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{new Date(note.createdAt).toLocaleString()} UTC</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="mt-6 space-y-6">
              <div className="grid gap-6">
                {note.reviews && note.reviews.length > 0 ? (
                  note.reviews.map((review) => (
                    <Card key={review.id} className="shadow-sm border-primary/10 overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-background">
                              <AvatarImage src={review.reviewer.image} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {review.reviewer.firstName[0]}{review.reviewer.lastName[0]}
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
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                                (review.decision === "Accepted" || review.recommendation === "approve")
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : (review.decision === "Partially Accepted" || review.recommendation === "revise")
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                              )}
                            >
                              {review.decision || (
                                review.recommendation === "approve"
                                  ? "Accepted"
                                  : review.recommendation === "revise"
                                  ? "Partially Accepted"
                                  : "Rejected"
                              )}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5 pb-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expert Feedback</h4>
                            <p className="text-sm leading-relaxed text-slate-700 italic border-l-4 border-muted pl-4">
                              "{review.comments}"
                            </p>
                          </div>

                          {review.supportingDocument && (
                            <div className="pt-2">
                               <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Supporting Document</h4>
                               <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20 w-fit group cursor-pointer hover:border-primary/30 transition-colors">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <span className="text-xs font-medium group-hover:text-primary transition-colors">{review.supportingDocument.name}</span>
                                  <Download className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                               </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <div className="bg-muted/10 border-t py-2 px-4 flex justify-between items-center">
                         <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                         </span>
                         <span className="text-[10px] font-mono text-muted-foreground/60">{review.id}</span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
                    <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-muted-foreground">No Feedback Yet</h3>
                    <p className="text-sm text-muted-foreground">This concept note is still awaiting expert evaluation.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Document Lifecycle Audit Trail</CardTitle>
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
                        <p className="text-sm font-semibold">Concept Note Created</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {note.reviews?.map((review, index) => (
                      <div key={review.id} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          {index < note.reviews.length - 1 && (
                             <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                          )}
                        </div>
                        <div className="pt-1 pb-2">
                          <p className="text-sm font-semibold">Review Completed by {review.reviewer.firstName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {note.status === "submitted" && (
                       <div className="flex gap-4 pb-6 last:pb-0">
                       <div className="flex flex-col items-center">
                         <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-amber-100 border-amber-400 text-amber-600">
                           <Clock className="h-4 w-4" />
                         </div>
                       </div>
                       <div className="pt-1 pb-2">
                         <p className="text-sm font-semibold text-amber-700">Awaiting Expert Review</p>
                         <p className="text-xs text-muted-foreground mt-0.5">Under evaluation by PSR Council</p>
                       </div>
                     </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value="versions" className="mt-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Version History</CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-md">
                        <GitBranch className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold font-mono">v1.0.0</p>
                          <Badge className="text-[10px] bg-primary">Current</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Initial submission of concept note.</p>
                        <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()} · {note.createdBy.firstName}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Concept Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge type="policy" status={note.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline" className="text-xs">Concept Note</Badge>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Submitted</span><span className="font-medium text-foreground">{new Date(note.createdAt).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Review Deadline</span><span className="font-medium text-amber-600">Pending</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {note.status === "draft" && (
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm" asChild>
                  <Link href={`/policies/concept-notes/${note.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                    Edit Concept
                  </Link>
                </Button>
              )}
              {(note.status === "submitted" || note.status === "under_review") && (
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm" asChild>
                  <Link href={`/policies/concept-notes/${note.id}/review`}>
                    <ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                    Review Document
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm">
                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                Download PDF
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm">
                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                Share Concept
              </Button>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Author Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={note.createdBy.image} />
                  <AvatarFallback>{note.createdBy.firstName[0]}{note.createdBy.lastName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{note.createdBy.firstName} {note.createdBy.lastName}</span>
                  <span className="text-xs text-muted-foreground truncate">{note.createdBy.institution || "Ministry of Health"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-0 border-b bg-background">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 border rounded-md bg-muted/50 p-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomOut className="h-4 w-4" /></Button>
                  <span className="text-xs font-medium px-2">100%</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomIn className="h-4 w-4" /></Button>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs font-medium px-1">Page 1 / 1</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Full Screen</span>
                </Button>
                <Button size="sm" className="h-8 gap-1.5 bg-primary" onClick={() => setViewingFile(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-200/50 flex justify-center items-start overflow-auto p-4 sm:p-8">
            <div className="shadow-2xl bg-white w-full max-w-[800px] min-h-[1100px] p-8 sm:p-16 space-y-8 text-slate-800 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-4 border-b-4 border-primary pb-8">
                <div className="flex justify-center mb-4">
                   <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-primary" />
                   </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-tight">Federal Democratic Republic of Ethiopia</h1>
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-muted-foreground">{note.createdBy.institution || "Ministry of Health"}</h2>
              </div>

              <div className="py-8 sm:py-12 text-center space-y-6">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight uppercase">
                  {note.title}
                </h3>
                <div className="flex justify-center gap-8 py-4">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Serial Number</p>
                    <p className="text-sm font-mono font-bold">{note.id}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Version</p>
                    <p className="text-sm font-mono font-bold">v1.0.0</p>
                  </div>
                </div>
                <div className="inline-block px-6 py-2 border-2 border-slate-900 font-black text-lg">
                  OFFICIAL CONCEPT DOCUMENT
                </div>
              </div>

              <div className="space-y-6 text-justify">
                <p className="font-bold text-lg border-l-4 border-primary pl-4 uppercase tracking-wide">1. Executive Summary</p>
                <p className="leading-relaxed text-sm sm:text-base">
                  {note.background}
                </p>
                <p className="leading-relaxed text-sm sm:text-base">
                  This document serves as the primary concept framework for health policy refinement within the national education and health systems. It outlines the strategic objectives, implementation methodologies, and oversight mechanisms required to achieve the stated outcomes within the operational period of 2025-2027.
                </p>
              </div>

              <div className="pt-24 mt-auto">
                <div className="flex justify-between items-end border-t pt-8">
                  <div className="space-y-4">
                    <div className="h-12 w-48 bg-slate-100 rounded-sm border-b-2 border-slate-300 italic flex items-center justify-center text-slate-400 text-xs">
                      Electronic Signature Verified
                    </div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Authorized PSR Officer</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-bold uppercase">Registry Timestamp</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{new Date(note.createdAt).toLocaleString()} UTC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 border-t bg-muted/5 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewingFile(null)}>
              Close
            </Button>
            <Button size="sm" onClick={() => {
              if (viewingFile) {
                const link = document.createElement("a");
                link.href = viewingFile.url;
                link.download = viewingFile.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
