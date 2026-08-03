"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Link2,
  Paperclip,
  Share2,
  Sparkles,
  Tag,
  X,
  Zap,
  LayoutList,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveFileUrl, downloadRemoteFile, extractFileName } from "@/lib/utils/resolve-file-url";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStorage } from "@/api/client";
import type { SearchResultItem } from "@/lib/queries/search";
import DOMPurify from "dompurify";

interface SearchDocumentFullViewerProps {
  document: SearchResultItem | null;
  onClose: () => void;
}

function cleanOrgName(org?: string | null): string | null {
  if (!org) return null;
  const trimmed = org.trim();
  if (
    !trimmed ||
    trimmed === "—" ||
    trimmed === "--" ||
    trimmed === "-" ||
    trimmed === "string" ||
    trimmed.toLowerCase() === "n/a" ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return null;
  }
  return trimmed;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Helper: detect HTML content                                              */
/* ──────────────────────────────────────────────────────────────────────── */
function isHtml(text: string) {
  return /<[a-z][\s\S]*>/i.test(text);
}

/* ──────────────────────────────────────────────────────────────────────── */
/* RichText: renders HTML or plain text                                     */
/* ──────────────────────────────────────────────────────────────────────── */
function RichText({ text, className }: { text: string; className?: string }) {
  if (isHtml(text)) {
    const cleanHtml = typeof window !== "undefined" ? DOMPurify.sanitize(text) : text;
    return (
      <div
        className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }
  return (
    <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${className ?? ""}`}>
      {text}
    </p>
  );
}
/* ──────────────────────────────────────────────────────────────────────── */
/* checkIsLink: detect external web links                                  */
/* ──────────────────────────────────────────────────────────────────────── */
function checkIsLink(item: { url: string; type?: string }) {
  if (item.type === "link") return true;
  const resolved = resolveFileUrl(item.url) || item.url || "";
  if (/^https?:\/\//i.test(resolved) && !resolved.toLowerCase().includes(".pdf") && !resolved.toLowerCase().includes(".docx") && !resolved.toLowerCase().includes("/bff/media/")) {
    return true;
  }
  return false;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* EmbeddedViewer: inline document previewer (PDF/Word/Link/Fallback)       */
/* ──────────────────────────────────────────────────────────────────────── */
function EmbeddedViewer({ url, title, type, onDownload }: { url: string; title: string; type?: string; onDownload?: (url: string) => void }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No file attached</p>
      </div>
    );
  }

  const isLink = type === "link" || checkIsLink({ url, type });
  const targetUrl = isLink ? (url.startsWith("http") ? url : resolveFileUrl(url) || url) : resolveFileUrl(url) || url;

  if (isLink) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/20 bg-card p-12 text-center shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <div className="max-w-lg text-center space-y-1.5">
          <Badge variant="secondary" className="mb-1 uppercase text-[10px] font-extrabold tracking-wider bg-primary/10 text-primary border-primary/20">
            External Publication & Deliverable Link
          </Badge>
          <h4 className="text-base font-bold text-foreground leading-snug">{title}</h4>
          <p className="text-xs text-muted-foreground font-mono truncate max-w-md mx-auto">{targetUrl}</p>
        </div>
        <Button
          type="button"
          className="rounded-xl font-bold gap-2 px-6 shadow-sm"
          onClick={() => window.open(targetUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" />
          Open Link
        </Button>
      </div>
    );
  }

  const resolvedUrl = targetUrl;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-primary/20 shadow-xs bg-card">
        <PdfViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-[#ededed] dark:bg-muted/30 shadow-xs">
        <WordViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-12 text-center shadow-2xs">
      <FileText className="h-12 w-12 text-primary" />
      <div>
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          This document type cannot be embedded directly in the browser preview.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Open File
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-xl"
          onClick={() => downloadRemoteFile(resolvedUrl, extractFileName(resolvedUrl))}
        >
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */


/* ──────────────────────────────────────────────────────────────────────── */
/* FileCard: individual file / link entry                                   */
/* ──────────────────────────────────────────────────────────────────────── */
function FileCard({
  fileItem,
  onPreview,
  onDownload,
}: {
  fileItem: { label: string; url: string; type: string; grade?: string };
  onPreview: (url: string, title: string) => void;
  onDownload?: (url: string) => void;
}) {
  const isLink = fileItem.type === "link" || checkIsLink(fileItem);
  const targetUrl = isLink && fileItem.url.startsWith("http") ? fileItem.url : resolveFileUrl(fileItem.url) || fileItem.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Icon + label row */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 border border-primary/15">
          {isLink ? (
            <Globe className="h-4.5 w-4.5 text-primary" />
          ) : (
            <FileText className="h-4.5 w-4.5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground leading-snug truncate">{fileItem.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isLink ? "External Link" : "PDF Document"}
          </p>
        </div>
        {fileItem.grade && (
          <Badge
            variant="secondary"
            className="shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 gap-1 border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          >
            <Award className="h-2.5 w-2.5" />
            {fileItem.grade}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        {!isLink && targetUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl flex-1 hover:bg-primary/5 hover:border-primary/40 transition-colors"
            onClick={() => onPreview(targetUrl, fileItem.label)}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        )}
        {targetUrl && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl flex-1 transition-colors"
            onClick={() => {
              if (isLink) {
                window.open(targetUrl, "_blank", "noopener,noreferrer");
              } else {
                onDownload?.(targetUrl);
                downloadRemoteFile(targetUrl, extractFileName(targetUrl));
              }
            }}
          >
            {isLink ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            {isLink ? "Open" : "Download"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* MetaRow: a single metadata item in the sidebar panel                    */
/* ──────────────────────────────────────────────────────────────────────── */
function MetaRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs font-bold text-right ${accent ? "text-emerald-600 dark:text-emerald-400 uppercase" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */
export function SearchDocumentFullViewer({ document, onClose }: SearchDocumentFullViewerProps) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [activeDocKey, setActiveDocKey] = useState<number>(0);
  const queryClient = useQueryClient();

  const [localDownloadCount, setLocalDownloadCount] = useState<number>(
    (document?.metadata?.download_count as number) ?? 0
  );

  useEffect(() => {
    if (document?.metadata?.download_count !== undefined) {
      setLocalDownloadCount(document.metadata.download_count as number);
    }
  }, [document?.metadata?.download_count]);

  const handleTrackDownload = async () => {
    if (!document) return;
    try {
      const token = tokenStorage.get();
      const headers: HeadersInit = { "Content-Type": "application/json", accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = document.source === "policy_repository"
        ? `/bff/v1/policy-repository/${document.id}/download/`
        : `/bff/v1/final-submissions/${document.id}/download/`;
      const res = await fetch(url, { method: "POST", headers });
      if (res.ok) {
        const json = await res.json();
        const updatedCount = json?.data?.download_count;

        if (typeof updatedCount === "number") {
          setLocalDownloadCount(updatedCount);

          queryClient.setQueriesData<any>({ queryKey: ["unified-search"] }, (oldData: any) => {
            if (!oldData) return oldData;
            const targetResults = Array.isArray(oldData.results)
              ? oldData.results
              : Array.isArray(oldData.data?.results)
              ? oldData.data.results
              : null;

            if (!targetResults) return oldData;

            const updatedResults = targetResults.map((docItem: SearchResultItem) =>
              docItem.id === document.id && docItem.source === document.source
                ? {
                    ...docItem,
                    metadata: {
                      ...(docItem.metadata || {}),
                      download_count: updatedCount,
                    },
                  }
                : docItem
            );

            if (Array.isArray(oldData.results)) {
              return { ...oldData, results: updatedResults };
            }
            return { ...oldData, data: { ...oldData.data, results: updatedResults } };
          });
        } else {
          setLocalDownloadCount((prev) => prev + 1);
        }
      } else {
        setLocalDownloadCount((prev) => prev + 1);
      }

      queryClient.invalidateQueries({ queryKey: ["public-overview"] });
      queryClient.invalidateQueries({ queryKey: ["unified-search"] });
    } catch {
      setLocalDownloadCount((prev) => prev + 1);
    }
  };

  // Lock body scroll to prevent double scrollbars when detail viewer is active
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalStyle = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    return () => {
      window.document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!document) return null;

  const isPolicy = document.source === "policy_repository";
  const meta = document.metadata || {};
  const abstractText = meta.abstract || (isPolicy ? meta.executive_summary : "") || "";
  const execSummaryText = meta.executive_summary || "";
  const organization = cleanOrgName(meta.organization) || cleanOrgName(document.subtitle) || null;
  const doi = meta.doi || "";
  const ndmcRef = meta.ndmc_submission_reference || "";

  /* ── Files & Deliverables (Populated dynamically from backend response) ── */
  const rawExtLink = meta.publication_link || meta.publication_url || meta.external_url || meta.external_link || meta.website;
  const extPubLink = rawExtLink && rawExtLink !== "#" ? rawExtLink : null;

  const rawFiles: Array<{ label: string; url: string; type: string; grade?: string }> =
    meta.public_files && Array.isArray(meta.public_files) && meta.public_files.length > 0
      ? meta.public_files.map((f: any) => ({
        label: f.label || (f.type === "link" ? "External Publication Link" : "Document File"),
        url: f.url,
        type: f.type || (checkIsLink(f) ? "link" : "pdf"),
        grade: f.grade,
      }))
      : [];

  // Fallback ONLY if backend meta.public_files is empty
  if (rawFiles.length === 0) {
    if (document.file_url && document.file_url !== "#") {
      rawFiles.push({ label: `${document.document_type || "Primary"} Document`, url: document.file_url, type: "pdf" });
    }
    if (meta.file_url && meta.file_url !== "#" && !rawFiles.some((f) => f.url === meta.file_url)) {
      rawFiles.push({ label: "Proposal Document File", url: meta.file_url, type: "pdf" });
    }
    if (meta.policy_brief_url && meta.policy_brief_url !== "#" && !rawFiles.some((f) => f.url === meta.policy_brief_url)) {
      rawFiles.push({ label: "Policy Brief", url: meta.policy_brief_url, type: "pdf" });
    }
    if (meta.supplementary_url && meta.supplementary_url !== "#" && !rawFiles.some((f) => f.url === meta.supplementary_url)) {
      rawFiles.push({ label: "Supplementary Document", url: meta.supplementary_url, type: "pdf" });
    }
    if (rawExtLink && rawExtLink !== "#" && !rawFiles.some((f) => f.url === rawExtLink)) {
      rawFiles.push({ label: "External Publication Link", url: rawExtLink, type: "link" });
    }
  }

  const publicFiles = rawFiles.filter((f) => Boolean(f.url && f.url !== "#"));

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyCitation = () => {
    const orgPart = organization ? `${organization}. ` : "";
    const citation = `${document.title}. ${orgPart}Published: ${formatDate(document.date)}.${doi ? ` DOI: ${doi}.` : ""}`;
    void navigator.clipboard.writeText(citation);
    setCopied(true);
    toast.success("Citation copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  /* ── Tab list ── */
  const dynamicFilesTabLabel = meta.files_tab_label || (isPolicy ? "Policy Documents & Drafts" : "Deliverables, Files & Links");
  const tabs = [
    { value: "overview", label: "Overview", icon: BookOpen },
    { value: "files", label: `${dynamicFilesTabLabel} (${publicFiles.length})`, icon: Paperclip },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
    >
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-background px-4 sm:px-6 py-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl gap-1.5 text-xs font-bold shrink-0 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Search</span>
          </Button>
          <Separator orientation="vertical" className="h-5 shrink-0 hidden sm:block" />
          <Badge
            className={`shrink-0 rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${isPolicy
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
              }`}
          >
            {isPolicy ? "Policy" : "Research"}
          </Badge>
          <span className="text-xs font-semibold text-foreground truncate hidden md:block max-w-md">
            {document.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {extPubLink && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const resolved = resolveFileUrl(extPubLink) || extPubLink;
                window.open(resolved, "_blank", "noopener,noreferrer");
              }}
              className="rounded-xl text-xs font-semibold gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">External Publication</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCitation}
            className="rounded-xl text-xs font-semibold gap-1.5 h-8"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Cite"}</span>
          </Button>

          {document.file_url && document.file_url !== "#" && (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                try {
                  const token = tokenStorage.get();
                  const headers: HeadersInit = { "Content-Type": "application/json", accept: "application/json" };
                  if (token) headers.Authorization = `Bearer ${token}`;
                  const url = document.source === "policy_repository"
                    ? `/bff/v1/policy-repository/${document.id}/download/`
                    : `/bff/v1/final-submissions/${document.id}/download/`;
                  await fetch(url, { method: "POST", headers });
                  queryClient.invalidateQueries({ queryKey: ["final-submissions"] });
                  queryClient.invalidateQueries({ queryKey: ["public-overview"] });
                } catch {
                  // Best effort
                } finally {
                  const resolved = resolveFileUrl(document.file_url);
                  if (resolved) downloadRemoteFile(resolved, extractFileName(resolved));
                }
              }}
              className="rounded-xl text-xs font-bold gap-1.5 h-8 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── SCROLLABLE MAIN AREA ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth [will-change:scroll-position]">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* ── HERO SECTION ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="relative rounded-3xl overflow-hidden border border-border/60 shadow-md mb-8"
          >
            {/* Gradient accent strip */}
            <div className={`absolute inset-x-0 top-0 h-1 ${isPolicy ? "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500" : "bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500"}`} />

            <div className="bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 lg:p-10">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-wide px-2.5">
                  {document.document_type}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  {formatDate(document.date)}
                </span>
                {doi && (
                  <Badge variant="secondary" className="text-[10px] font-mono rounded-lg gap-1">
                    <Hash className="h-2.5 w-2.5" />
                    {doi}
                  </Badge>
                )}
                {ndmcRef && (
                  <Badge variant="secondary" className="text-[10px] font-mono rounded-lg gap-1">
                    <Tag className="h-2.5 w-2.5" />
                    {ndmcRef}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-foreground tracking-tight leading-tight mb-3">
                {document.title}
              </h1>

              {/* Organization */}
              {organization && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                  <Building className="h-4 w-4 text-primary/70 shrink-0" />
                  {organization}
                </p>
              )}

              {/* AI-matched chunk teaser */}
              {document.matched_chunk_text && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    RPDMS AI Context
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-mono leading-relaxed italic line-clamp-3">
                    "{document.matched_chunk_text}"
                  </p>
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* ── TWO-COLUMN LAYOUT ── */}
          <div className="grid gap-6 lg:grid-cols-12 items-start">

            {/* ── LEFT: TABBED CONTENT (8 cols when overview, 12 cols when files) ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              className={activeTab === "files" ? "lg:col-span-12" : "lg:col-span-8"}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                {/* Tab bar */}
                <div className="mb-4 overflow-x-auto scrollbar-none">
                  <TabsList className="inline-flex h-11 rounded-2xl border border-border/60 bg-muted/50 p-1 gap-0.5">
                    {tabs.map(({ value, label, icon: Icon }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className="rounded-xl px-3.5 py-2 text-xs font-bold gap-1.5 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground transition-all"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* ── Tab: Overview (Abstract + Executive Summary + Uploaded Files) ── */}
                <TabsContent value="overview" className="mt-0 space-y-6">

                  {/* Abstract Card */}
                  <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
                    <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/30 px-5 py-3.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-foreground">Abstract</h2>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      {abstractText ? (
                        <RichText
                          text={abstractText}
                          className="text-foreground/90 font-medium"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground italic">No abstract available for this record.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Executive Summary Card (Combined on the same page view) */}
                  {execSummaryText && execSummaryText !== abstractText && (
                    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
                      <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/30 px-5 py-3.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                          <LayoutList className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-foreground">Executive Summary</h2>
                        </div>
                      </div>
                      <div className="p-5 sm:p-6">
                        <RichText text={execSummaryText} className="text-foreground/90 font-medium" />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* ── Tab: Uploaded Files & Preview ── */}
                <TabsContent value="files" className="mt-0 space-y-6">
                  {publicFiles.length > 0 ? (
                    <div className="space-y-5">
                      {/* Document Sub-navigation Pills */}
                      {publicFiles.length > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 rounded-2xl border border-border/60 shadow-2xs">
                          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50 w-full sm:w-auto">
                            {publicFiles.map((fileItem, idx) => {
                              const isActive = idx === activeDocKey;
                              const resolved = resolveFileUrl(fileItem.url) || fileItem.url || "";
                              const isItemLink = fileItem.type === "link" || checkIsLink(fileItem);
                              const kind = getConceptNoteAttachmentKind(resolved);
                              return (
                                <Button
                                  key={idx}
                                  type="button"
                                  variant={isActive ? "default" : "ghost"}
                                  size="sm"
                                  className="h-8 text-xs font-semibold rounded-lg gap-2"
                                  onClick={() => setActiveDocKey(idx)}
                                >
                                  {isItemLink ? <Globe className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                  {fileItem.label}
                                  <Badge
                                    variant={isActive ? "secondary" : "outline"}
                                    className="text-[9px] uppercase px-1.5 py-0 font-bold"
                                  >
                                    {isItemLink ? "LINK" : kind.toUpperCase()}
                                  </Badge>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inline Document Previewer */}
                      {publicFiles[activeDocKey]?.url ? (
                        <EmbeddedViewer
                          url={publicFiles[activeDocKey].url}
                          title={publicFiles[activeDocKey].label}
                          type={publicFiles[activeDocKey].type}
                          onDownload={handleTrackDownload}
                        />
                      ) : (
                        <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <h3 className="font-bold text-muted-foreground">No File Selected</h3>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl bg-card gap-2">
                      <Paperclip className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm font-semibold text-muted-foreground">No public files available</p>
                      <p className="text-xs text-muted-foreground/70">Files may be restricted or not yet uploaded.</p>
                    </div>
                  )}
                </TabsContent>

              </Tabs>
            </motion.div>

            {/* ── RIGHT: METADATA SIDEBAR (Hidden when reading files for maximum space) ── */}
            {activeTab !== "files" && (
              <motion.aside
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.18 }}
                className="lg:col-span-4 space-y-4 sticky top-6 self-start"
              >
                {/* Quick Actions */}
                {publicFiles.length > 0 && (
                  <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Quick Access</h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {publicFiles.slice(0, 3).map((f, i) => {
                        const resolved = resolveFileUrl(f.url);
                        const isLink = checkIsLink(f);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (resolved) {
                                if (isLink) {
                                  window.open(resolved, "_blank", "noopener,noreferrer");
                                } else {
                                  setActiveDocKey(i);
                                  setActiveTab("files");
                                }
                              }
                            }}
                            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-muted transition-colors border border-transparent hover:border-border/60 group"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 border border-primary/10 group-hover:bg-primary/15 transition-colors">
                              {isLink ? <Globe className="h-3.5 w-3.5 text-primary" /> : <FileText className="h-3.5 w-3.5 text-primary" />}
                            </div>
                            <span className="text-xs font-semibold text-foreground/90 truncate flex-1">{f.label}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                      {publicFiles.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("files")}
                          className="w-full text-center text-[11px] text-primary font-bold py-1.5 hover:underline"
                        >
                          View all {publicFiles.length} files →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Record Metadata */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                  <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Record Info</h3>
                  </div>
                  <div className="px-4 pb-2 pt-1">
                    {organization && <MetaRow label="Organization" value={organization} />}
                    <MetaRow label="Source Index" value={document.source?.replace("_", " ")} />
                    <MetaRow label="Access Level" value={document.access_level} accent />
                    <MetaRow label="Document Type" value={document.document_type} />
                    <MetaRow label="Total Downloads" value={localDownloadCount} accent />
                    <MetaRow label="Published" value={formatDate(document.date)} />
                    {meta.serial_number && <MetaRow label="Serial No." value={meta.serial_number} />}
                    {meta.version_code && <MetaRow label="Version Code" value={meta.version_code} />}
                    {meta.reference_number && <MetaRow label="Ref Number" value={meta.reference_number} />}
                    {doi && <MetaRow label="DOI" value={doi} />}
                    {ndmcRef && <MetaRow label="NDMC Ref" value={ndmcRef} />}
                  </div>
                </div>

                {/* Citation Block */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                  <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
                    <Copy className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Cite This</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-mono border border-border/50 rounded-xl bg-muted/30 p-3 italic">
                      {document.title}. {organization ? `${organization}. ` : ""}Published: {formatDate(document.date)}.{doi ? ` DOI: ${doi}.` : ""}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCitation}
                      className="mt-3 w-full h-8 text-xs font-bold gap-1.5 rounded-xl"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied to Clipboard!" : "Copy Citation"}
                    </Button>
                  </div>
                </div>
              </motion.aside>
            )}
          </div>
        </main>
      </div>

      {/* PDF Interactive Previewer Dialog */}
      <PdfViewerDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl ?? undefined}
        title={previewTitle}
      />
    </motion.div>
  );
}
