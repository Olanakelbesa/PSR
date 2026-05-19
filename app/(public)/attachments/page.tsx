"use client";

import { useState, useMemo, useEffect } from "react";
import { Download, ChevronLeft, ChevronRight, FileText, Search, FileSpreadsheet, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface MockAttachment {
  id: string;
  description: string;
  category: "Templates" | "Guidelines" | "Forms";
  fileType: "PDF" | "DOCX" | "XLSX";
  fileSize: string;
  uploadedAt: string;
  fileName: string;
}

const MOCK_ATTACHMENTS: MockAttachment[] = [
  {
    id: "att-01",
    description: "PSR Research Proposal Template (v3.2)",
    category: "Templates",
    fileType: "DOCX",
    fileSize: "1.4 MB",
    uploadedAt: "2024-03-01",
    fileName: "PSR_Research_Proposal_Template_v3.2.docx",
  },
  {
    id: "att-02",
    description: "Institutional Ethics Review Board Guidelines",
    category: "Guidelines",
    fileType: "PDF",
    fileSize: "2.8 MB",
    uploadedAt: "2024-02-15",
    fileName: "IRB_Ethics_Guidelines_2024.pdf",
  },
  {
    id: "att-03",
    description: "Annual Research Cost & Budgeting Template",
    category: "Templates",
    fileType: "XLSX",
    fileSize: "750 KB",
    uploadedAt: "2024-03-08",
    fileName: "Annual_Research_Budgeting_Rates.xlsx",
  },
  {
    id: "att-04",
    description: "Conflict of Interest Declaration Form",
    category: "Forms",
    fileType: "PDF",
    fileSize: "420 KB",
    uploadedAt: "2024-01-20",
    fileName: "Conflict_of_Interest_Form.pdf",
  },
  {
    id: "att-05",
    description: "Research Publication Subsidy Application Form",
    category: "Forms",
    fileType: "DOCX",
    fileSize: "320 KB",
    uploadedAt: "2024-03-12",
    fileName: "Publication_Subsidy_Request.docx",
  },
  {
    id: "att-06",
    description: "Data Management and Integrity Guidelines",
    category: "Guidelines",
    fileType: "PDF",
    fileSize: "1.9 MB",
    uploadedAt: "2024-02-28",
    fileName: "Data_Management_Guidelines_v1.0.pdf",
  },
  {
    id: "att-07",
    description: "Progress Report Submission Template",
    category: "Templates",
    fileType: "DOCX",
    fileSize: "680 KB",
    uploadedAt: "2024-03-10",
    fileName: "PSR_Progress_Report_Template.docx",
  },
  {
    id: "att-08",
    description: "Joint Collaborative Research Agreement (MoU Template)",
    category: "Templates",
    fileType: "DOCX",
    fileSize: "1.1 MB",
    uploadedAt: "2024-03-14",
    fileName: "Collaborative_MoU_Draft.docx",
  },
  {
    id: "att-09",
    description: "Intellectual Property and Patent Policy Handbook",
    category: "Guidelines",
    fileType: "PDF",
    fileSize: "4.5 MB",
    uploadedAt: "2024-01-15",
    fileName: "PSR_IP_Policy_Handbook.pdf",
  },
  {
    id: "att-10",
    description: "Travel & Field Work Allowance Reimbursement Form",
    category: "Forms",
    fileType: "XLSX",
    fileSize: "510 KB",
    uploadedAt: "2024-03-05",
    fileName: "Field_Work_Reimbursement_Rates.xlsx",
  },
];

const ITEMS_PER_PAGE = 6;

export default function AttachmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    let result = MOCK_ATTACHMENTS;

    if (selectedCategory !== "All") {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          a.fileName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filtered, currentPage]
  );

  const goToPage = (p: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  };

  const handleDownload = (doc: MockAttachment) => {
    setDownloadingId(doc.id);
    
    // Simulate high-end download delay
    setTimeout(() => {
      setDownloadingId(null);
      // Trigger a harmless mock download of a small text file named after the requested document
      const element = document.createElement("a");
      const file = new Blob(["PSR Platform Mock File for " + doc.description], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = doc.fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "XLSX":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      default:
        return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full">
        {/* Hero Banner */}
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
              <p className="max-w-2xl text-base md:text-lg text-slate-350 leading-relaxed mx-auto">
                Access official guidelines, research proposal forms, budgeting templates, and legal MoUs required throughout the research lifecycle.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col gap-8">
            
            {/* Search and Category Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
              {/* Category Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {["All", "Templates", "Guidelines", "Forms"].map((cat) => (
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

              {/* Search Bar */}
              <div className="relative w-full lg:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search files..."
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
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground text-sm mt-4">Indexing files...</p>
              </div>
            ) : (
              <Card className="border border-white/5 bg-slate-900/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                {filtered.length === 0 ? (
                  <div className="py-24 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-bold text-foreground">No matches found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                      No files match your search criteria. Try modifying your filter or queries.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/[0.02]">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Document Description & Metadata
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                              Format
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                              File Size
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                              Updated
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Download
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <AnimatePresence mode="popLayout">
                            {paginated.map((doc) => (
                              <motion.tr
                                key={doc.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="hover:bg-white/[0.01] transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="shrink-0 h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                      {getFileIcon(doc.fileType)}
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-foreground block">
                                        {doc.description}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-medium font-mono block mt-0.5">
                                        {doc.fileName}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center hidden md:table-cell">
                                  <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                                    {doc.fileType}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground hidden sm:table-cell">
                                  {doc.fileSize}
                                </td>
                                <td className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                                  {doc.uploadedAt}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloadingId !== null}
                                    className="rounded-xl border border-white/5 hover:bg-primary hover:text-primary-foreground font-bold h-9 px-4 text-xs tracking-wider uppercase transition-all flex items-center gap-2 ml-auto"
                                  >
                                    {downloadingId === doc.id ? (
                                      <>
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Pulling
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
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.01]">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        Showing{" "}
                        <span className="text-foreground">
                          {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                        </span>{" "}
                        to{" "}
                        <span className="text-foreground">
                          {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                        </span>{" "}
                        of <span className="text-foreground">{filtered.length}</span> documents
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
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => goToPage(page)}
                            className="h-8 w-8 rounded-lg text-xs font-bold border-white/5"
                          >
                            {page}
                          </Button>
                        ))}

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
