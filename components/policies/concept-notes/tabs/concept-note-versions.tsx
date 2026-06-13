"use client";

import { GitBranch, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

interface ConceptNoteVersionsProps {
  note: any;
}

export function ConceptNoteVersions({ note }: ConceptNoteVersionsProps) {
  const versions = note.versions ?? [];

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="text-base">Version History</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y">
        {(versions.length > 0
          ? versions
          : [
              {
                versionNumber: note.currentStatus?.version ?? "v1.0.0",
                file: note.overview?.file ?? "",
                isLatest: true,
                createdByName: note.submittedBy?.fullName ?? "System",
                createdAt:
                  note.submittedBy?.submittedAt ?? new Date().toISOString(),
              },
            ]
        ).map((version: any) => (
          <div
            key={version.id ?? version.versionNumber}
            className="p-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/5 rounded-md">
                <GitBranch className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold font-mono">
                    {version.versionNumber}
                  </p>
                  {version.isLatest && (
                    <Badge className="text-[10px] bg-primary">Current</Badge>
                  )}
                  {version.isResubmission && (
                    <Badge variant="secondary" className="text-[10px]">
                      Resubmission
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {version.file
                    ? "Attached PDF available for preview."
                    : "No file attached for this version."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleDateString()} ·{" "}
                  {version.createdByName}
                </p>
              </div>
            </div>
            {version.file ? (
              <Button variant="outline" size="sm" asChild>
                <a href={resolveFileUrl(version.file) ?? "#"} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-3 w-3 mr-1" /> Download
                </a>
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
