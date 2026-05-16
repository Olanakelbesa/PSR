"use client";

import { ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export function PdfViewer({
  url,
  title = "Document",
  className,
}: PdfViewerProps) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-muted/10 text-muted-foreground p-8 text-center border rounded-lg border-dashed">
        <p className="text-sm">No document URL provided</p>
      </div>
    );
  }

  const handleOpenInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className={`flex flex-col h-full w-full bg-background overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">Document Viewer</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenInNewTab} className="h-8">
            <ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" />
            Open
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="h-8">
            <Download className="h-3.5 w-3.5 mr-2 text-primary" />
            Download
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full bg-muted/20 relative min-h-[700px]">
        <iframe 
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} 
          title={title} 
          className="absolute inset-0 h-full w-full border-0" 
        />
      </div>
    </div>
  );
}
