export const CONCEPT_NOTE_ATTACHMENT_ACCEPT = ".pdf,.doc,.docx";

export const CONCEPT_NOTE_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type ConceptNoteAttachmentKind = "pdf" | "word" | "unsupported";

function getExtension(value: string): string {
  const path = value.split("?")[0]?.split("#")[0] ?? "";
  const dotIndex = path.lastIndexOf(".");
  return dotIndex >= 0 ? path.slice(dotIndex).toLowerCase() : "";
}

export function getConceptNoteAttachmentKind(
  source: string | File,
): ConceptNoteAttachmentKind {
  const name = typeof source === "string" ? source : source.name;
  const mime = typeof source === "string" ? "" : source.type;
  const ext = getExtension(name);

  if (ext === ".pdf" || mime === "application/pdf") {
    return "pdf";
  }

  if (
    ext === ".doc" ||
    ext === ".docx" ||
    mime === "application/msword" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "word";
  }

  return "unsupported";
}

export function isConceptNoteAllowedAttachment(source: string | File): boolean {
  return getConceptNoteAttachmentKind(source) !== "unsupported";
}

export function downloadConceptNoteAttachment(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
