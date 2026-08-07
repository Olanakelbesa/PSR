"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Download, FileWarning, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const safeUrl = encodeURI(url || "");

  const verifyAndLoadPdf = async (fileUrl: string) => {
    if (!fileUrl) {
      setHasError(true);
      setErrorMessage("No document URL provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    try {
      const res = await fetch(fileUrl);
      const contentType = res.headers.get("content-type") || "";

      // If response is not 200 OK or returns HTML (Django debug traceback/404 page)
      if (!res.ok || contentType.includes("text/html")) {
        setHasError(true);
        setErrorMessage("The requested document file is unavailable or missing on the server storage.");
        setIsLoading(false);
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
    } catch {
      setHasError(true);
      setErrorMessage("Unable to fetch document preview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyAndLoadPdf(safeUrl);

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [safeUrl]);

  const handleOpenInNewTab = () => {
    if (hasError) {
      toast.error("Document Unavailable", {
        description: "The file cannot be opened because it is missing on the server.",
      });
      return;
    }
    window.open(blobUrl || safeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (hasError) {
      toast.error("Document Unavailable", {
        description: "The file cannot be downloaded because it is missing on the server.",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = blobUrl || safeUrl;
    link.download = `${title.replace(/\s+/g, "_")}.pdf`;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className={`flex flex-col h-full w-full bg-background overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">Document Viewer</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            disabled={isLoading || hasError}
            className="h-8 text-xs cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading || hasError}
            className="h-8 text-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-primary" />
            Download
          </Button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 w-full bg-muted/20 relative min-h-[550px] flex items-center justify-center">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            Verifying and loading document...
          </div>
        ) : hasError ? (
          <div className="p-8 max-w-md text-center space-y-3 bg-card border border-border/80 rounded-2xl shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto">
              <FileWarning className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Document Unavailable</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => verifyAndLoadPdf(safeUrl)}
              className="text-xs font-bold gap-2 cursor-pointer mt-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Loading
            </Button>
          </div>
        ) : (
          <iframe
            src={(blobUrl || safeUrl) + "#toolbar=0&navpanes=0&scrollbar=0"}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}
