"use client";

import { ConceptNoteAttachmentViewer } from "@/components/policies/concept-notes/concept-note-attachment-viewer";

interface ConceptNoteDocumentProps {
  url: string;
  title: string;
}

export function ConceptNoteDocument({ url, title }: ConceptNoteDocumentProps) {
  return <ConceptNoteAttachmentViewer url={url} title={title} />;
}
