"use client";

import { useState, useMemo } from "react";
import { Download, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/landing/Footer";
import { useAttachments, attachmentHref } from "@/lib/queries/attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 8;

export default function AttachmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: attachments = [],
    isLoading,
    isError,
    refetch,
  } = useAttachments({
    page_size: 200,
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return attachments;
    const q = searchQuery.toLowerCase();
    return attachments.filter((a) => a.description.toLowerCase().includes(q));
  }, [attachments, searchQuery]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full">
       <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 z-10" />
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl"
              animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/20 dark:bg-accent/30 rounded-full blur-3xl"
              animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>
          <Image
            alt="University Campus"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 dark:opacity-20 z-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6WXl7KgjS5FzKpmYyc5yv_CUi46C0c4cWxQ4tMk31YaH2sfw9uP_Dc_2ArDDKYyHYng0EvR8G3UMpZHF_a-2I7KyjNboYFYblse3SenObmVjFifU2t3l1S3Fs9010g1wJgYQQd_YkGn3OLVYyAbmgUAQyt1vfevluODH_QKygfpHYHOfh5HQ24CA3EIk_Cs72A--B_GRDt4nqayh5XOxcUPRlyytJf3TjbEDRQX2sX6JF6nQuGUnpGh89LZZmj8X7cgwhoDYVPLg"
            width={1920}
            height={1080}
          />
          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-accent">Forms and Files</span>
            </motion.h1>
            <motion.p
              className="max-w-2xl text-lg text-slate-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
               Access and download research guidelines, forms, and templates.
            </motion.p>
          </div>
        </section>

        <section className="w-full py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Forms and Files
              </h2>
              <p className="text-muted-foreground">
                Browse the latest documents and downloadable resources.
              </p>
            </div>

            <Card className="border shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <Input
                  type="search"
                  placeholder="Search by description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="max-w-sm"
                />
              </div>

              {isLoading ? (
                <div className="px-8 py-16 text-center text-muted-foreground">
                  Loading documents…
                </div>
              ) : isError ? (
                <div className="px-8 py-16 text-center">
                  <p className="text-muted-foreground mb-4">
                    Unable to load documents.
                  </p>
                  <Button variant="outline" onClick={() => refetch()}>
                    Try again
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-8 py-16 text-center text-muted-foreground">
                  {attachments.length === 0
                    ? "No documents available."
                    : "No documents match your search."}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            scope="col"
                          >
                            Document Description
                          </th>
                          <th
                            className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            scope="col"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginated.map((doc) => {
                          const href = attachmentHref(doc.attachment);
                          return (
                            <tr
                              key={doc.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <span className="text-sm font-medium text-foreground">
                                    {doc.description}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-sm font-medium transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {filtered.length === 0
                          ? 0
                          : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-foreground">
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          filtered.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {filtered.length}
                      </span>
                    </p>
                    <nav
                      aria-label="Pagination"
                      className="inline-flex rounded-lg border border-border overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-2 border-r border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => goToPage(page)}
                            aria-current={
                              currentPage === page ? "page" : undefined
                            }
                            className={`px-4 py-2 border-r border-border last:border-r-0 text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-2 bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </nav>
                  </div>
                </>
              )}
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
