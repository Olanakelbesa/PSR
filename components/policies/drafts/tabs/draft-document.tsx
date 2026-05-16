"use client";

import { Card } from "@/components/ui/card";
import { PdfViewer } from "@/components/shared";

interface DraftDocumentProps {
  url: string;
  fileName: string;
}

export function DraftDocument({ url, fileName }: DraftDocumentProps) {
  return (
    <Card className="shadow-lg border-primary/20 overflow-hidden">
      <PdfViewer
        url={url}
        title={fileName}
        className="h-[900px]"
      />
    </Card>
  );
}
