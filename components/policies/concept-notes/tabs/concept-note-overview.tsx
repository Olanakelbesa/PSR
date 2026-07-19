"use client";

import { FileText, Tag, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { CONCEPT_NOTE_SUMMARY_PANEL_CLASS } from "@/lib/utils/word-count";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { toast } from "sonner";

interface ConceptNoteOverviewProps {
  note: any;
  setViewingFile?: (file: any) => void;
  isReviewMode?: boolean;
}

export function ConceptNoteOverview({
  note,
  setViewingFile,
  isReviewMode,
}: ConceptNoteOverviewProps) {
  const summary = note.overview?.executiveSummary ?? note.background ?? "";
  const thematicAreas =
    note.overview?.thematicAreas ?? note.thematicAreas ?? [];
  const strategicObjectives =
    note.strategicObjectives ?? note.strategic_objectives ?? [];
  const supportingFile =
    resolveFileUrl(
      note.overview?.file ??
        note.versions?.find((version: any) => version.isLatest)?.file ??
        note.attachments?.find((attachment: any) => attachment?.url && attachment.url !== "#")?.url ??
        note.attachments?.find((attachment: any) => attachment?.file && attachment.file !== "#")?.file ??
        null,
    ) ?? null;
  const supportingFileName =
    note.attachments?.find((attachment: any) => attachment?.name)?.name ??
    extractFileName(
      note.overview?.file ??
        note.versions?.find((version: any) => version.isLatest)?.file ??
        note.attachments?.find((attachment: any) => attachment?.url && attachment.url !== "#")?.url ??
        note.attachments?.find((attachment: any) => attachment?.file && attachment.file !== "#")?.file ??
        null,
    ) ??
    `${note.title}.pdf`;
  const supportingFileKind = supportingFile
    ? getConceptNoteAttachmentKind(supportingFile)
    : null;

  const handleOpenAttachment = () => {
    if (!supportingFile) return;

    if (supportingFileKind === "pdf" || supportingFileKind === "word") {
      setViewingFile?.({
        name: supportingFileName,
        url: supportingFile,
      });
      return;
    }

    toast.error("Only PDF and Word (.doc, .docx) attachments are supported.");
  };

  const metadataRows = [
    { label: "Concept ID", value: note.currentStatus?.conceptId || note.id },
    { label: "Current Status", value: note.currentStatus?.status || note.status?.name || note.status || "Under Review" },
    { label: "Document Type", value: note.docType?.name || note.documentType?.name || "N/A" },
    { label: "Category", value: note.documentCategory || "N/A" },
    { label: "Organization", value: note.organization?.name || "N/A" },
    { label: "Unit", value: note.unit?.name || "N/A" },
    { label: "Latest Version", value: note.currentStatus?.version || note.versionNumber || note.versions?.find((version: any) => version.isLatest)?.versionNumber || "N/A" },
    ...(!isReviewMode ? [{ label: "Submitted By", value: note.submittedBy?.fullName || "N/A" }] : []),
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Concept Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metadataRows.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </dt>
                <dd className="text-sm font-semibold break-words">
                  {item.value || "N/A"}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className={CONCEPT_NOTE_SUMMARY_PANEL_CLASS}>
            {summary || "No summary provided."}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Strategic Objectives
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {strategicObjectives.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {strategicObjectives.map((objective: any) => (
                <Badge
                  key={String(objective.id ?? objective.name)}
                  variant="secondary"
                >
                  {objective.name ?? objective.title ?? String(objective.id)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No strategic objectives linked.
            </p>
          )}
        </CardContent>
      </Card>




    </div>
  );
}
