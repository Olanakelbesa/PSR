"use client";

import { FileText, Tag, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function resolveFileUrl(filePath?: string | null) {
  if (!filePath || filePath === "#") return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith("/bff")) return filePath;
  if (filePath.startsWith("/")) return `/bff${filePath}`;
  return `/bff/${filePath}`;
}

function extractFileName(filePath?: string | null) {
  if (!filePath) return null;
  return filePath.split("/").pop() || filePath;
}

interface ConceptNoteOverviewProps {
  note: any;
  setViewingFile?: (file: any) => void;
}

export function ConceptNoteOverview({
  note,
  setViewingFile,
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
  const metadataRows = [
    { label: "Concept ID", value: note.currentStatus?.conceptId || note.id },
    { label: "Current Status", value: note.currentStatus?.status || note.status?.name || note.status || "Under Review" },
    { label: "Document Type", value: note.docType?.name || note.documentType?.name || "N/A" },
    { label: "Category", value: note.documentCategory || "N/A" },
    { label: "Organization", value: note.organization?.name || "N/A" },
    { label: "Unit", value: note.unit?.name || "N/A" },
    { label: "Latest Version", value: note.currentStatus?.version || note.versionNumber || note.versions?.find((version: any) => version.isLatest)?.versionNumber || "N/A" },
    { label: "Submitted By", value: note.submittedBy?.fullName || "N/A" },
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
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {summary}
          </p>
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



      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Supporting Files
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {supportingFile ? (
            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">
                    {supportingFileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Concept note file
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {setViewingFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 gap-2"
                    onClick={() =>
                      setViewingFile({
                          name: supportingFileName,
                        url: supportingFile,
                      })
                    }
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = supportingFile;
                    link.download = supportingFileName;
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
          ) : (
            <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground italic">
                No supporting files attached.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
