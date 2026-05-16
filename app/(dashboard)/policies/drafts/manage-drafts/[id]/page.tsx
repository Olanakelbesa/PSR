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
  Users,
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
import { Avatar as AvatarUI, AvatarFallback as AvatarFallbackUI } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { POLICY_TYPES } from "@/lib/constants";
import type { PolicyStatus, PolicyType } from "@/lib/types";
import { cn } from "@/lib/utils";

import { DraftTabs } from "@/components/policies/drafts/draft-tabs";

// Mock Data structure aligned with DraftTabs component
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
        institution: "Federal Ministry of Health"
      },
      status: "completed",
      score: 85,
      comments: "The draft is technically sound and aligns well with the national e-Health architecture.",
      createdAt: "2024-05-10T14:30:00Z",
      checklist: [
        { category: "Technical Alignment", passed: true, feedback: "Excellent alignment." },
        { category: "Feasibility", passed: true, feedback: "Highly feasible." },
        { category: "Strategic Impact", passed: true, feedback: "High impact." }
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
        institution: "EPHI"
      },
      status: "completed",
      score: 88,
      comments: "Solid architecture. Recommend updating API docs.",
      createdAt: "2024-05-12T09:15:00Z",
      checklist: [
        { category: "System Integration", passed: true, feedback: "Supports legacy protocols." },
        { category: "Security Compliance", passed: true, feedback: "Meets guidelines." }
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
        institution: "WHO Regional Office"
      },
      status: "pending",
      score: null,
      comments: null,
      createdAt: "2024-05-13T11:00:00Z",
      checklist: []
    }
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

  return (
    <PageContainer
      title={draft.title}
      description={`Viewing Draft Document: ${draft.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm">
            <Link href="/policies/drafts/manage-drafts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back 
            </Link>
          </Button>
          <Button size="sm" asChild className="shadow-sm">
            <Link href={`/policies/drafts/manage-drafts/${draft.id}/assign`}>
              <Users className="mr-2 h-4 w-4" />
              Assign Reviewers
            </Link>
          </Button>
          <Button size="sm" asChild className="shadow-sm">
            <Link href={`/policies/drafts/manage-drafts/${draft.id}/approve`}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
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
                      <AvatarUI className="h-8 w-8">
                        <AvatarFallbackUI className="text-[10px] bg-primary/10 text-primary">
                          {rev.reviewer.firstName[0]}
                          {rev.reviewer.lastName[0]}
                        </AvatarFallbackUI>
                      </AvatarUI>
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
