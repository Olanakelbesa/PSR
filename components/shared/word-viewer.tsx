"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import mammoth from "mammoth";

interface WordViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export function WordViewer({
  url,
  title = "Document",
  className,
}: WordViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function convert() {
      try {
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("psr_token");
          if (token) headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch document");
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value);
      } catch (err) {
        if (!cancelled) setError("Could not preview this document.");
      }
    }

    convert();
    return () => { cancelled = true; };
  }, [url]);

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
          <p className="text-xs text-muted-foreground">Word Document Viewer</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="h-8">
          <Download className="h-3.5 w-3.5 mr-2 text-primary" />
          Download
        </Button>
      </div>
      <div className="flex-1 w-full overflow-y-auto bg-white p-6">
        {html ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-sm">
              <Button variant="link" className="h-auto p-0 text-xs" onClick={handleDownload}>
                Download the file
              </Button>
              {" "}to view it in Microsoft Word.
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          </div>
        )}
      </div>
    </div>
  );
}
