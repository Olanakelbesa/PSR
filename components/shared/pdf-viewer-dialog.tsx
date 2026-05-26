"use client";

import { ExternalLink, Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";

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

  const handleOpenInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = blobUrl || url;
    link.download = title;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fetchAndSetBlob = async () => {
    try {
      const res = await fetch(url);
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
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="min-w-0">
            <DialogTitle className="truncate text-sm font-semibold text-foreground">
              {title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Document preview</p>
          </div>
          <div className="flex items-center gap-2 px-8">
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 h-full w-full bg-background">
          <iframe
            ref={iframeRef}
            src={blobUrl || url}
            title={title}
            className="h-full w-full border-0"
            onError={handleIframeError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
