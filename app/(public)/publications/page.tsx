"use client";

import { useState, useMemo, useEffect } from "react";
import { BookOpen, Download, Search, ChevronDown, Calendar, Users, FileText, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface MockPublication {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  category: "Policy Brief" | "Journal Article" | "Technical Report";
  journal?: string;
  year: number;
  doi?: string;
  keywords: string[];
  fileName: string;
}

const MOCK_PUBLICATIONS: MockPublication[] = [
  {
    id: "pub-01",
    title: "National Health Financing Strategy: Evaluating the Impact of Out-of-Pocket Cost Caps",
    abstract: "This policy brief analyzes the implementation of community-based health insurance cap reforms across regional states. Results indicate a 40% reduction in catastrophic health expenses among low-income households, alongside a 12% rise in clinical utilization rates.",
    authors: ["Dr. Elias Kebede", "Dr. Sarah Jenkins", "Ato Tesfaye Lemma"],
    category: "Policy Brief",
    year: 2024,
    keywords: ["Health Financing", "Out-of-Pocket Costs", "Policy Brief", "Insurance Caps"],
    fileName: "National_Health_Financing_Policy_Brief_2024.pdf",
  },
  {
    id: "pub-02",
    title: "Malaria Elimination Pathways: A Geospatial Analysis of Bed Net Efficacy in Lowland Woredas",
    abstract: "A GIS-backed assessment mapping vector resistance and long-lasting insecticidal net (LLIN) distribution. Using remote sensing, we correlate climatic patterns with local transmission peaks to suggest optimized seasonally-adjusted insecticide spraying intervals.",
    authors: ["Dr. Solomon Worku", "Dr. Michael Chen"],
    category: "Journal Article",
    journal: "East African Medical Journal, Vol. 98, No. 2",
    year: 2023,
    doi: "10.1016/j.eamj.2023.04.112",
    keywords: ["Malaria Elimination", "Geospatial Analysis", "Vector Control", "GIS Mapping"],
    fileName: "Geospatial_Malaria_BedNet_Efficacy_2023.pdf",
  },
  {
    id: "pub-03",
    title: "Decentralization of Primary Health Care: Ten-Year Review of Woreda-Level Efficacy",
    abstract: "An exhaustive technical audit analyzing devolved health sector governance. This review evaluates financial accountability structures, resource allocation, and local service delivery benchmarks across 120 woredas between 2014 and 2024.",
    authors: ["Prof. Abraham Bekele", "Dr. Helen Tesfaye", "Dr. Robert Green"],
    category: "Technical Report",
    year: 2024,
    keywords: ["Decentralization", "Health Sector Governance", "Primary Care Audits", "Resource Allocation"],
    fileName: "PHC_Decentralization_Ten_Year_Review_2024.pdf",
  },
  {
    id: "pub-04",
    title: "Telemedicine Adoption Barriers in Remote Communities: A Mixed-Methods Study",
    abstract: "Investigates infrastructure, cultural, and training bottlenecks impacting satellite-linked clinical consultations in pastoralist zones. Recommends mobile-first light-weight visual tools to bypass regional cellular bandwidth constraints.",
    authors: ["Dr. Martha Tsige", "Dr. David Vance"],
    category: "Journal Article",
    journal: "Journal of Medical Internet Research (JMIR), Vol. 15",
    year: 2023,
    doi: "10.2196/jmir.48512",
    keywords: ["Telemedicine Barriers", "Pastoralist Health", "mHealth Connectivity", "Infrastructure Limitations"],
    fileName: "Telemedicine_Adoption_Barriers_Study_2023.pdf",
  },
  {
    id: "pub-05",
    title: "Efficacy of mHealth SMS Alerts on Maternal Health Service Adherence",
    abstract: "Evaluates a randomized control trial of text message reminders sent to pregnant women in rural zones. Adherence to all four recommended prenatal appointments increased from 42% in the control cohort to 68% in the SMS intervention cohort.",
    authors: ["Dr. Helen Tesfaye", "Dr. Jane Doe"],
    category: "Policy Brief",
    year: 2024,
    keywords: ["mHealth Alerts", "Maternal Care", "Prenatal Adherence", "Behavioral Nudges"],
    fileName: "mHealth_SMS_Maternal_Care_Efficacy_2024.pdf",
  },
  {
    id: "pub-06",
    title: "Tuberculosis Diagnostic Pathways: GeneXpert Implementation Audits in Public Health Facilities",
    abstract: "Reviews the roll-out of rapid molecular testing machines at district hospitals. The study evaluates average sample transit delays, cartage cost optimization, and recommendations for technical support networks.",
    authors: ["Dr. Samuel Kidane", "Dr. Robert Green"],
    category: "Technical Report",
    year: 2022,
    keywords: ["Tuberculosis Diagnostics", "GeneXpert Audit", "Molecular Testing", "Supply Chain Logics"],
    fileName: "TB_GeneXpert_Implementation_Audit_2022.pdf",
  },
];

export default function PublicPublicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredPublications = useMemo(() => {
    let result = MOCK_PUBLICATIONS;

    // Filter by Category
    if (categoryFilter !== "All") {
      result = result.filter((pub) => pub.category === categoryFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (pub) =>
          pub.title.toLowerCase().includes(q) ||
          pub.abstract.toLowerCase().includes(q) ||
          pub.authors.some((author) => author.toLowerCase().includes(q)) ||
          pub.keywords.some((keyword) => keyword.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      return sortBy === "newest" ? b.year - a.year : a.year - b.year;
    });

    return result;
  }, [searchQuery, categoryFilter, sortBy]);

  const handleDownload = (pub: MockPublication) => {
    setDownloadingId(pub.id);
    setTimeout(() => {
      setDownloadingId(null);
      // Trigger a harmless mock download
      const element = document.createElement("a");
      const file = new Blob(["PSR Platform Mock Publication: " + pub.title], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = pub.fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
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
              animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl"
              animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          <Image
            alt="Research and Books"
            className="absolute inset-0 w-full h-full object-cover opacity-15 z-0 grayscale"
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1920"
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
                Publications & <span className="text-primary">Policy Archives</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-slate-350 leading-relaxed mx-auto">
                Discover peer-reviewed journals, administrative reviews, and strategic policy briefs published by investigators working under PSR grant calls.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col gap-8">
            
            {/* Filter and Sorting Header */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
              {/* Category tags */}
              <div className="flex flex-wrap items-center gap-2">
                {["All", "Policy Brief", "Journal Article", "Technical Report"].map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setExpandedId(null);
                    }}
                    className="rounded-full h-9 px-5 text-xs font-bold border-white/5 transition-all duration-300"
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {/* Sorting & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
                  className="rounded-xl h-10 border-white/5 text-xs font-bold flex items-center gap-2 bg-muted/20"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort: {sortBy === "newest" ? "Newest" : "Oldest"}
                </Button>

                <div className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search titles, authors..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setExpandedId(null);
                    }}
                    className="pl-9 h-10 bg-muted/30 border-white/5 focus-visible:ring-primary rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground text-sm mt-4">Indexing publication database...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredPublications.map((pub) => {
                    const isExpanded = expandedId === pub.id;
                    return (
                      <motion.div
                        key={pub.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border border-white/5 bg-slate-900/30 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : pub.id)}
                            className="w-full text-left p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.01] transition"
                          >
                            <div className="space-y-2 flex-grow">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                                  {pub.category}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {pub.year}
                                </span>
                              </div>
                              <h3 className="text-base md:text-lg font-bold text-foreground leading-snug">
                                {pub.title}
                              </h3>
                              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="line-clamp-1">{pub.authors.join(", ")}</span>
                              </div>
                            </div>

                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                                isExpanded ? "rotate-180 text-primary" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-slate-950/15 space-y-4">
                                  {/* Journal detail */}
                                  {pub.journal && (
                                    <div className="text-xs text-muted-foreground font-bold italic">
                                      Published in: <span className="text-foreground">{pub.journal}</span>
                                      {pub.doi && ` (DOI: ${pub.doi})`}
                                    </div>
                                  )}

                                  {/* Abstract */}
                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5 text-primary" />
                                      Executive Summary / Abstract
                                    </h4>
                                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                      {pub.abstract}
                                    </p>
                                  </div>

                                  {/* Keywords */}
                                  <div className="flex flex-wrap gap-1.5 pt-2">
                                    {pub.keywords.map((kw, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[9px] font-bold text-muted-foreground font-mono bg-white/[0.03] border border-white/5 rounded px-2 py-0.5"
                                      >
                                        #{kw}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Action */}
                                  <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <Button
                                      onClick={() => handleDownload(pub)}
                                      disabled={downloadingId !== null}
                                      className="rounded-xl font-bold text-xs tracking-wider uppercase h-10 px-6 gap-2"
                                    >
                                      {downloadingId === pub.id ? (
                                        <>
                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                          Pulling PDF
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4" />
                                          Download Full Document
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {!isLoading && filteredPublications.length === 0 && (
                  <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-foreground">No Research Matches</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                      No matching records found for "{searchQuery}". Modify your search parameters or check a different category.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("All");
                      }}
                      className="mt-4 border-white/5"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
