"use client";

import { ConceptNoteAttachmentViewer } from "@/components/policies/concept-notes/concept-note-attachment-viewer";

interface DraftDocumentProps {
  url: string;
  fileName: string;
}

export function DraftDocument({ url, fileName }: DraftDocumentProps) {
  return <ConceptNoteAttachmentViewer url={url} title={fileName} />;
}
