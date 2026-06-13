"use client";

import { 
  FileText, 
  ClipboardCheck, 
  Clock, 
  Activity
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Sub-components
import { DraftOverview } from "./tabs/draft-overview";
import { DraftDocument } from "./tabs/draft-document";
import { DraftFeedback } from "./tabs/draft-feedback";
import { DraftVersions } from "./tabs/draft-versions";
import { DraftTimeline } from "./tabs/draft-timeline";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

interface DraftTabsProps {
  draft: any;
  mode?: "draft" | "repository";
}

export function DraftTabs({ draft, mode = "draft", isFeedbackVisible = true }: DraftTabsProps & { isFeedbackVisible?: boolean }) {
  const isRepository = mode === "repository";

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview" className="gap-2">
          <FileText className="h-4 w-4" /> Overview
        </TabsTrigger>
        <TabsTrigger value="document" className="gap-2">
          <FileText className="h-4 w-4" /> Document
        </TabsTrigger>
        {!isRepository && isFeedbackVisible && (
          <TabsTrigger value="feedback" className="gap-2">
            <ClipboardCheck className="h-4 w-4" /> Expert Feedback
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
              {draft.reviews?.length || 0}
            </Badge>
          </TabsTrigger>
        )}
        <TabsTrigger value="versions" className="gap-2">
          <Activity className="h-4 w-4" /> Versions
        </TabsTrigger>
        <TabsTrigger value="timeline" className="gap-2">
          <Clock className="h-4 w-4" /> Timeline
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6 space-y-6">
        <DraftOverview 
          executiveSummary={draft.executiveSummary || draft.description} 
          metadata={draft}
          mode={mode}
        />
      </TabsContent>

      {/* Document Tab */}
      <TabsContent value="document" className="mt-6">
        <DraftDocument
          url={
            resolveFileUrl(
              isRepository
                ? typeof draft.draftFile === "string"
                  ? draft.draftFile
                  : draft.documentUrl ?? ""
                : draft.documentUrl ??
                    (typeof draft.draftFile === "string"
                      ? draft.draftFile
                      : draft.url) ??
                    "",
            ) ?? ""
          }
          fileName={
            draft.documentFileName ??
            draft.draftFile?.name ??
            draft.serialNumber ??
            draft.title ??
            "Document"
          }
        />
      </TabsContent>

      {/* Expert Feedback Tab */}
      {!isRepository && (
        <TabsContent value="feedback" className="mt-6 space-y-6">
          <DraftFeedback reviews={draft.reviews} />
        </TabsContent>
      )}

      {/* Versions Tab */}
      <TabsContent value="versions" className="mt-6">
        <DraftVersions versionHistory={draft.versionHistory} />
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline" className="mt-6">
        <DraftTimeline draft={draft} mode={mode} />
      </TabsContent>
    </Tabs>
  );
}
