"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import mammoth from "mammoth";

import { paginateWordDocumentHtml } from "@/lib/utils/word-document-pagination";

import "./word-viewer.css";

interface WordViewerProps {
  url: string;
  title?: string;
  className?: string;
}

const MAMMOTH_STYLE_MAP = [
  "p[style-name='Title'] => h1.document-title:fresh",
  "p[style-name='Subtitle'] => p.document-subtitle:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='List Paragraph'] => p:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
];

function isLegacyDocFile(source: string): boolean {
  const path = source.split("?")[0]?.split("#")[0] ?? "";
  return path.toLowerCase().endsWith(".doc") && !path.toLowerCase().endsWith(".docx");
}

export function WordViewer({
  url,
  title = "Document",
  className,
}: WordViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isLegacyDoc = useMemo(() => isLegacyDocFile(url), [url]);

  useEffect(() => {
    let cancelled = false;

    async function convert() {
      if (isLegacyDoc) {
        setError(
          "Legacy .doc previews are not supported in the browser. Download the file to open it in Microsoft Word.",
        );
        setHtml(null);
        return;
      }

      setError(null);
      setHtml(null);

      try {
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("psr_token");
          if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch document");

        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: MAMMOTH_STYLE_MAP,
            includeDefaultStyleMap: true,
          },
        );

        if (!cancelled) {
          if (!result.value.trim()) {
            setError("This document has no readable content to preview.");
            return;
          }
          setHtml(result.value);
        }
      } catch {
        if (!cancelled) {
          setError("Could not preview this document.");
        }
      }
    }

    void convert();
    return () => {
      cancelled = true;
    };
  }, [url, isLegacyDoc]);

  useLayoutEffect(() => {
    if (!html) {
      setPages([]);
      setActivePage(1);
      return;
    }

    const paginated = paginateWordDocumentHtml(html);
    setPages(paginated);
    setActivePage(1);
    canvasRef.current?.scrollTo({ top: 0 });
  }, [html]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pages.length === 0) return;

    const pageElements = canvas.querySelectorAll<HTMLElement>(".word-document-page");
    if (pageElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) return;

        const index = Number(visible[0].target.getAttribute("data-page-index"));
        if (!Number.isNaN(index)) {
          setActivePage(index + 1);
        }
      },
      {
        root: canvas,
        threshold: [0.35, 0.55, 0.75],
      },
    );

    pageElements.forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [pages]);

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
    <div
      className={`flex h-full w-full flex-col overflow-hidden bg-background ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {pages.length > 0
              ? `Page ${activePage} of ${pages.length}`
              : "Word layout preview"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="h-8"
        >
          <Download className="mr-2 h-3.5 w-3.5 text-primary" />
          Download
        </Button>
      </div>

      <div ref={canvasRef} className="word-viewer-canvas">
        {pages.length > 0 ? (
          <div className="word-document-pages">
            {pages.map((pageHtml, index) => (
              <article
                key={`word-page-${index}`}
                className="word-document-page"
                data-page-index={index}
              >
                <div
                  className="word-document-content"
                  dangerouslySetInnerHTML={{ __html: pageHtml }}
                />
              </article>
            ))}
          </div>
        ) : html ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          </div>
        ) : error ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center text-muted-foreground">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="max-w-md font-medium">{error}</p>
            <p className="mt-1 text-sm">
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={handleDownload}
              >
                Download the file
              </Button>{" "}
              to view it in Microsoft Word.
            </p>
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          </div>
        )}
      </div>
    </div>
  );
}
