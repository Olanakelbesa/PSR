"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Edit,
  Users,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { cn } from "@/lib/utils";

import { DraftTabs } from "@/components/policies/drafts/draft-tabs";

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

  if (!draft) return <div>Loading...</div>;

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
          <DraftTabs draft={draft} />
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
