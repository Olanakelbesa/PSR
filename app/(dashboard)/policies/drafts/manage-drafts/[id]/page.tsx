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
  reviewers: [
    {
      id: "rev1",
      firstName: "Abebe",
      lastName: "Kebede",
      status: "completed",
      score: 85,
    },
    {
      id: "rev2",
      firstName: "Tigist",
      lastName: "Haile",
      status: "pending",
      score: null,
    },
  ],
});

export default function DraftDetailPage() {
  const params = useParams();
  const [draft, setDraft] = useState<ReturnType<typeof getDraftMock>>(
    getDraftMock((params as any)?.id || "d-001"),
  );
  return (
    <PageContainer
      title="Policy Draft Details"
      description={`Viewing Draft Document: ${draft.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/drafts/manage-drafts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back 
            </Link>
          </Button>
          <Button  asChild className="shadow-sm">
            <Link href={`/policies/drafts/manage-drafts/${draft.id}/assign`}>
              <Users className="mr-2 h-4 w-4" />
              Assign Reviewers
            </Link>
          </Button>
          <Button  asChild className="shadow-sm">
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
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Draft Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">
                          {draft.draftFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {draft.draftFile.size}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="mt-6 space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Expert Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {draft.reviewers.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground italic">
                        No expert feedback yet.
                      </p>
                    </div>
                  ) : (
                    draft.reviewers.map((rev) => (
                      <div key={rev.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="text-sm font-bold">
                                {rev.firstName[0]}
                                {rev.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm">
                                {rev.firstName} {rev.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Status: {rev.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {rev.score !== null && (
                              <Badge className="font-mono font-bold">
                                {rev.score}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Timeline events for this draft will appear here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="mt-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Versions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Version history and downloads will be listed here.
                  </p>
                </CardContent>
              </Card>
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
                  {draft.reviewers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.reviewers.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    No experts assigned yet.
                  </p>
                </div>
              ) : (
                draft.reviewers.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {rev.firstName[0]}
                          {rev.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {rev.firstName} {rev.lastName}
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
