"use client";

import { useMemo } from "react";
import { FileText, ClipboardCheck, Clock, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Sub-components
import { ConceptNoteOverview } from "./tabs/concept-note-overview";
import { ConceptNoteDocument } from "./tabs/concept-note-document";
import { ConceptNoteFeedback } from "./tabs/concept-note-feedback";
import { ConceptNoteTimeline } from "./tabs/concept-note-timeline";
import { ConceptNoteVersions } from "./tabs/concept-note-versions";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

interface ConceptNoteTabsProps {
  note: any;
  setViewingFile?: (file: any) => void;
  isReviewMode?: boolean;
}

export function ConceptNoteTabs({
  note,
  setViewingFile,
  isReviewMode,
}: ConceptNoteTabsProps) {
  const feedbackItems = note.expertFeedback ?? note.reviews ?? [];
  
  const assignedFeedbackCount = useMemo(() => {
    const hasNestedDetails = feedbackItems.some((item: any) =>
      Array.isArray(item.feedbackDetail),
    );

    if (hasNestedDetails) {
      return feedbackItems.reduce((acc: number, item: any) => {
        const details = item.feedbackDetail || [];
        const assignedInBlock = details.filter(
          (d: any) => d.expertReviewer !== null && d.expertReviewer !== undefined
        ).length;
        return acc + assignedInBlock;
      }, 0);
    }

    return feedbackItems.filter((item: any) => {
      const reviewer = item.reviewer || item.expertReviewer;
      const reviewerId = item.reviewerId || item.id;
      return reviewer !== null && reviewer !== undefined && reviewerId !== undefined;
    }).length;
  }, [feedbackItems]);

  const documentUrl =
    resolveFileUrl(
      note.overview?.file ??
        note.versions?.find((version: any) => version.isLatest)?.file ??
        note.attachments?.find((attachment: any) => attachment?.url && attachment.url !== "#")?.url ??
        note.attachments?.find((attachment: any) => attachment?.file && attachment.file !== "#")?.file ??
        null,
    ) ?? "";

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="h-10 w-full justify-start border-b bg-transparent rounded-none p-0 gap-0">
        {[
          { value: "overview", label: "Overview", icon: FileText },
          { value: "document", label: "Document", icon: FileText },
          {
            value: "feedback",
            label: "Expert Feedback",
            icon: ClipboardCheck,
            badge: assignedFeedbackCount,
          },
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
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                {tab.badge}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6 space-y-6">
        <ConceptNoteOverview note={note} setViewingFile={setViewingFile} isReviewMode={isReviewMode} />
      </TabsContent>

      {/* Document Tab */}
      <TabsContent value="document" className="mt-6">
        <ConceptNoteDocument url={documentUrl} title={note.title} />
      </TabsContent>

      {/* Expert Feedback Tab */}
      <TabsContent value="feedback" className="mt-6 space-y-6">
        <ConceptNoteFeedback feedback={feedbackItems} />
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline" className="mt-6">
        <ConceptNoteTimeline note={note} />
      </TabsContent>

      {/* Versions Tab */}
      <TabsContent value="versions" className="mt-6">
        <ConceptNoteVersions note={note} />
      </TabsContent>
    </Tabs>
  );
}
