"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  File,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { tokenStorage } from "@/api";
import type { AttachmentRecord } from "@/types/attachments";
import {
  downloadRemoteFile,
  extractFileName,
  resolveFileUrl,
} from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 6;

function getFileTypeLabel(
  documentType?: string | null,
  filePath?: string | null,
) {
  if (documentType === "pdf") return "PDF";
  if (documentType === "doc") return "DOCX";

  const extension = extractFileName(filePath).split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "DOCX";
    default:
      return "FILE";
  }
}

function formatUploadDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function loadAttachments() {
  const headers: HeadersInit = {
    accept: "application/json",
  };

  const token = tokenStorage.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/bff/v1/attachments/?limit=100&ordering=-date_of_upload", {
    headers,
  });

  if (!response.ok) {
    let message = "Unable to load downloadable files.";

    try {
      const errorPayload = await response.json();
      message =
        errorPayload?.message ??
        errorPayload?.error?.message ??
        errorPayload?.detail ??
        message;
    } catch {
      message = message;
    }

    throw new Error(message);
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    return payload as AttachmentRecord[];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data as AttachmentRecord[];
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data as AttachmentRecord[];
  }

  return [] as AttachmentRecord[];
}

export default function AttachmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAttachments = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const records = await loadAttachments();

        if (!isMounted) return;

        setAttachments(records);
      } catch (error) {
        if (!isMounted) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load downloadable files.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAttachments();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedAttachments = useMemo(
    () =>
      [...attachments].sort((left, right) => {
        const leftDate = new Date(left.dateOfUpload).getTime();
        const rightDate = new Date(right.dateOfUpload).getTime();

        if (leftDate !== rightDate) {
          return rightDate - leftDate;
        }

        return right.id - left.id;
      }),
    [attachments],
  );

  const availableCategories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          sortedAttachments.map((item) =>
            getFileTypeLabel(item.documentType, item.attachment),
          ),
        ),
      ),
    ],
    [sortedAttachments],
  );

  const filtered = useMemo(() => {
    let result = sortedAttachments;

    if (selectedCategory !== "All") {
      result = result.filter(
        (item) =>
          getFileTypeLabel(item.documentType, item.attachment) ===
          selectedCategory,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          extractFileName(item.attachment).toLowerCase().includes(q) ||
          item.attachment.toLowerCase().includes(q),
      );
    }

    return result;
  }, [searchQuery, selectedCategory, sortedAttachments]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filtered, currentPage],
  );

  const goToPage = (p: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "DOCX":
        return <File className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-slate-500" />;
    }
  };

  const openAttachment = (doc: AttachmentRecord) => {
    const url = resolveFileUrl(doc.attachment);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (
    doc: AttachmentRecord,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    setDownloadingId(doc.id);

    try {
      await downloadRemoteFile(
        doc.attachment,
        extractFileName(doc.attachment),
        { token: tokenStorage.get() },
      );
    } catch {
      toast.error("Failed to download file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full">
        <section className="relative w-full h-[380px] md:h-[480px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-10 opacity-90" />

          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
              animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-3xl"
              animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          <Image
            alt="Global Networking"
            className="absolute inset-0 w-full h-full object-cover opacity-15 z-0 grayscale"
            src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1920"
            width={1920}
            height={1080}
          />

          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                Forms & <span className="text-primary">Downloadable Files</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-white leading-relaxed mx-auto">
                Access essential research, policy, reporting, and administrative
                forms and downloadable documents through a centralized digital
                repository.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                {availableCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className="rounded-full h-9 px-5 text-xs font-bold border-white/5 transition-all duration-300"
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              <div className="relative w-full lg:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search title or file name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-10 bg-muted/30 border-white/5 focus-visible:ring-primary rounded-xl"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground text-sm mt-4">
                  Loading downloadable files...
                </p>
              </div>
            ) : loadError ? (
              <Card className="border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                <div className="py-24 text-center px-6">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-bold text-foreground">
                    Files could not be loaded
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    {loadError}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                {filtered.length === 0 ? (
                  <div className="py-24 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-bold text-foreground">
                      No matches found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                      No files match your search criteria. Try modifying your
                      filter or queries.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/[0.02]">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Title & File
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                              Format
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                              Uploaded
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Download
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <AnimatePresence mode="popLayout">
                            {paginated.map((doc) => {
                              const fileType = getFileTypeLabel(
                                doc.documentType,
                                doc.attachment,
                              );

                              return (
                                <motion.tr
                                  key={doc.id}
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="hover:bg-white/[0.01] transition-colors cursor-pointer"
                                  onClick={() => openAttachment(doc)}
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="shrink-0 h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                        {getFileIcon(fileType)}
                                      </div>
                                      <div>
                                        <span className="text-sm font-semibold text-foreground block">
                                          {doc.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium font-mono block mt-0.5">
                                          {extractFileName(doc.attachment)}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center hidden md:table-cell">
                                    <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                                      {fileType}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-center hidden lg:table-cell">
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {formatUploadDate(doc.dateOfUpload)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <Button
                                      variant="ghost"
                                      disabled={downloadingId === doc.id}
                                      className="rounded-xl border border-white/5 hover:bg-primary hover:text-primary-foreground font-bold h-9 px-4 text-xs tracking-wider uppercase transition-all flex items-center gap-2 ml-auto"
                                      onClick={(event) => handleDownload(doc, event)}
                                    >
                                      {downloadingId === doc.id ? (
                                        <>
                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                          Downloading
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-3.5 h-3.5" />
                                          Download
                                        </>
                                      )}
                                    </Button>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>

                    <div className="px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.01]">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        Showing{" "}
                        <span className="text-foreground">
                          {filtered.length === 0
                            ? 0
                            : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                        </span>{" "}
                        to{" "}
                        <span className="text-foreground">
                          {Math.min(
                            currentPage * ITEMS_PER_PAGE,
                            filtered.length,
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="text-foreground">{filtered.length}</span>{" "}
                        documents
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="h-8 w-8 rounded-lg border-white/5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              onClick={() => goToPage(page)}
                              className="h-8 w-8 rounded-lg text-xs font-bold border-white/5"
                            >
                              {page}
                            </Button>
                          ),
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="h-8 w-8 rounded-lg border-white/5"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
