"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Download, FileWarning, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { WordViewer } from "@/components/shared/word-viewer";

interface PdfViewerDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  pdfUrl?: string;
  title?: string;
}

export function PdfViewerDialog({
  isOpen,
  open,
  onOpenChange,
  url,
  pdfUrl,
  title = "Document preview",
}: PdfViewerDialogProps) {
  const activeOpen = isOpen ?? open ?? false;
  const activeUrl = url || pdfUrl || "";

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const safeUrl = encodeURI(activeUrl);
  const attachmentKind = getConceptNoteAttachmentKind(activeUrl);

  const verifyAndLoadFile = async (fileUrl: string) => {
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

      // If response is not OK or returns HTML (Django debug traceback/404 page)
      if (!res.ok || contentType.includes("text/html")) {
        setHasError(true);
        setErrorMessage("The requested document file is unavailable or missing on server storage.");
        setIsLoading(false);
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
    } catch {
      setHasError(true);
      setErrorMessage("Unable to fetch document file.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeOpen && activeUrl) {
      verifyAndLoadFile(safeUrl);
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [activeOpen, activeUrl, safeUrl]);

  if (!activeUrl) return null;
  if (attachmentKind === "unsupported") return null;

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
    link.download = `${title.replace(/\s+/g, "_")}`;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={activeOpen} onOpenChange={onOpenChange}>
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
          <div className="flex items-center gap-2 pr-6">
            {attachmentKind === "pdf" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={isLoading || hasError}
                className="h-8 text-xs cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || hasError}
              className="h-8 text-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 h-full w-full bg-background overflow-hidden relative flex items-center justify-center">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
              Verifying document file...
            </div>
          ) : hasError ? (
            <div className="p-8 max-w-md text-center space-y-3 bg-card border border-border/80 rounded-2xl shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto">
                <FileWarning className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Document File Unavailable</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyAndLoadFile(safeUrl)}
                className="text-xs font-bold gap-2 cursor-pointer mt-2"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Loading
              </Button>
            </div>
          ) : attachmentKind === "pdf" ? (
            <iframe
              src={(blobUrl || safeUrl) + "#toolbar=0&navpanes=0&scrollbar=0"}
              title={title}
              className="h-full w-full border-0"
            />
          ) : (
            <WordViewer url={activeUrl} title={title} className="h-full" hideHeader />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
