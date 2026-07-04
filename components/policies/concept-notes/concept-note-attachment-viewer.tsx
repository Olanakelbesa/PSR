"use client";

import { FileText } from "lucide-react";

import { PdfViewer, WordViewer } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";

interface ConceptNoteAttachmentViewerProps {
  url: string;
  title: string;
  className?: string;
  viewerClassName?: string;
}

export function ConceptNoteAttachmentViewer({
  url,
  title,
  className,
  viewerClassName = "h-[900px]",
}: ConceptNoteAttachmentViewerProps) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No document attached</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Upload a PDF or Word document to preview it here.
        </p>
      </div>
    );
  }

  const kind = getConceptNoteAttachmentKind(url);

  if (kind === "pdf") {
    return (
      <Card
        className={`overflow-hidden border-primary/20 shadow-lg ${className ?? ""}`}
      >
        <PdfViewer url={url} title={title} className={viewerClassName} />
      </Card>
    );
  }

  if (kind === "word") {
    return (
      <Card
        className={`overflow-hidden border-primary/20 shadow-lg ${className ?? ""}`}
      >
        <WordViewer url={url} title={title} className={viewerClassName} />
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden shadow-sm ${className ?? ""}`}>
      <div className="flex flex-col items-center justify-center gap-4 bg-muted/10 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <FileText className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Unsupported file format</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Only PDF and Word (.doc, .docx) attachments are supported. Replace
            this file with a supported format.
          </p>
        </div>
      </div>
    </Card>
  );
}
