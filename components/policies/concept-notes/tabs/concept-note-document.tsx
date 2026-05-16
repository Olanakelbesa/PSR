"use client";

import { Card } from "@/components/ui/card";
import { PdfViewer } from "@/components/shared";

interface ConceptNoteDocumentProps {
  url: string;
  title: string;
}

export function ConceptNoteDocument({ url, title }: ConceptNoteDocumentProps) {
  return (
    <Card className="shadow-lg border-primary/20 overflow-hidden">
      <PdfViewer
        url={url}
        title={title}
        className="h-[900px]"
      />
    </Card>
  );
}
