"use client";

import { ExternalLink, Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { WordViewer } from "@/components/shared/word-viewer";

interface PdfViewerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
}

export function PdfViewerDialog({
  isOpen,
  onOpenChange,
  url,
  title = "Document preview",
}: PdfViewerDialogProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!url) return null;

  const attachmentKind = getConceptNoteAttachmentKind(url);
  if (attachmentKind === "unsupported") return null;

  const safeUrl = encodeURI(url);

  const handleOpenInNewTab = () => {
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = blobUrl || safeUrl;
    link.download = title;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fetchAndSetBlob = async () => {
    try {
      const res = await fetch(safeUrl);
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
    } catch (err) {
      // ignore — fallback will be to open in new tab
    }
  };

  const handleIframeError = () => {
    if (!blobUrl) fetchAndSetBlob();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] h-[92vh] p-0 overflow-hidden flex flex-col gap-0">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="min-w-0">
            <DialogTitle className="truncate text-sm font-semibold text-foreground">
              {title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {attachmentKind === "pdf" ? "Document preview" : "Word Document Viewer"}
            </p>
          </div>
          <div className="flex items-center gap-2 px-8">
            {attachmentKind === "pdf" && (
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 h-full w-full bg-background overflow-hidden">
          {attachmentKind === "pdf" ? (
            <iframe
              ref={iframeRef}
              src={(blobUrl || safeUrl) + "#toolbar=0&navpanes=0&scrollbar=0"}
              title={title}
              className="h-full w-full border-0"
              onError={handleIframeError}
            />
          ) : (
            <WordViewer url={url} title={title} className="h-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
