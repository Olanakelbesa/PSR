"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Globe,
  Lock,
  Download,
  BookOpen,
  Sparkles,
  Layers,
  Calendar,
  Building,
  HelpCircle,
  TrendingUp,
  Maximize2,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUnifiedSearch, type SearchResultItem } from "@/lib/queries/search";
import { extractFileName, resolveFileUrl, downloadRemoteFile } from "@/lib/utils/resolve-file-url";
import { tokenStorage } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { SearchDocumentFullViewer } from "@/components/features/search/SearchDocumentFullViewer";

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? dateValue : parsed.toLocaleDateString();
}

function stripHtmlAndEntities(text?: string | null): string {
  if (!text) return "";
  let cleaned = text.replace(/<[^>]*>/g, "");
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return cleaned.trim();
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

function formatSubtitle(subtitle?: string | null, org?: string | null, docType?: string | null): string {
  const validOrg = cleanOrgName(org);

  if (subtitle) {
    let cleaned = subtitle
      .replace(/—\s*—/g, "—")
      .replace(/\s*—\s*$/, "")
      .replace(/^\s*—\s*/, "")
      .trim();

    cleaned = cleaned.replace(/\s*—\s*$/, "").trim();

    if (cleaned && cleaned !== "—" && cleaned !== "--") {
      if (validOrg && !cleaned.includes(validOrg)) {
        return `${cleaned} • ${validOrg}`;
      }
      return cleaned;
    }
  }

  const typePart = docType || "Document";
  return validOrg ? `${typePart} • ${validOrg}` : typePart;
}

// Simple text highlighter utility
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!text) return null;
  const cleanText = stripHtmlAndEntities(text);
  if (!query || !query.trim()) return <span>{cleanText}</span>;

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));

  if (terms.length === 0) return <span>{cleanText}</span>;

  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = cleanText.split(regex);
  const lowerTerms = new Set(terms.map((t) => t.toLowerCase()));

  return (
    <span>
      {parts.map((part, i) =>
        lowerTerms.has(part.toLowerCase()) ? (
          <mark
            key={i}
            className="bg-amber-200/90 text-amber-950 dark:bg-amber-500/35 dark:text-amber-100 px-1 py-0.5 rounded font-semibold border border-amber-300/60 dark:border-amber-500/30 shadow-xs"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function PremiumSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state synchronized with URL query params
  const querySearch = searchParams.get("search") ?? "";
  const routeSelected = searchParams.get("selected") ?? "";
  const routeSelectedSource = searchParams.get("selected_source") ?? "";
  const queryAccessLevel = (searchParams.get("access_level") ?? "public") as "all" | "public" | "restricted";
  const querySource = (searchParams.get("source") ?? "all") as "all" | "policy_repository" | "research_output";
  const queryMode = (searchParams.get("mode") ?? "hybrid") as "hybrid" | "keyword" | "semantic" | "fuzzy";
  const querySort = (searchParams.get("sort") ?? "relevance") as "relevance" | "date_desc" | "date_asc";
  const queryYear = searchParams.get("year") ?? "";
  const queryOrg = searchParams.get("organization") ?? "";

  const [searchInput, setSearchInput] = useState(querySearch);
  const [showFilters, setShowFilters] = useState(false);
  const [explainEnabled, setExplainEnabled] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SearchResultItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const trackDownload = async (item: SearchResultItem) => {
    try {
      const token = tokenStorage.get();
      const headers: HeadersInit = { "Content-Type": "application/json", accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = item.source === "policy_repository"
        ? `/bff/v1/policy-repository/${item.id}/download/`
        : `/bff/v1/final-submissions/${item.id}/download/`;
      const res = await fetch(url, { method: "POST", headers });
      if (res.ok) {
        const json = await res.json();
        const updatedCount = json?.data?.download_count;

        if (typeof updatedCount === "number") {
          queryClient.setQueriesData<any>({ queryKey: ["unified-search"] }, (oldData: any) => {
            if (!oldData) return oldData;
            const targetResults = Array.isArray(oldData.results)
              ? oldData.results
              : Array.isArray(oldData.data?.results)
              ? oldData.data.results
              : null;

            if (!targetResults) return oldData;

            const updatedResults = targetResults.map((docItem: SearchResultItem) =>
              docItem.id === item.id && docItem.source === item.source
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

          if (selectedDoc && selectedDoc.id === item.id && selectedDoc.source === item.source) {
            setSelectedDoc((prev) =>
              prev
                ? {
                    ...prev,
                    metadata: {
                      ...(prev.metadata || {}),
                      download_count: updatedCount,
                    },
                  }
                : null
            );
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["public-overview"] });
      queryClient.invalidateQueries({ queryKey: ["unified-search"] });
    } catch {
      // Best effort
    }
  };

  // Sync state with URL changes
  useEffect(() => {
    setSearchInput(querySearch);
  }, [querySearch]);

  // Hook into unified search service
  const { data, isLoading, isError } = useUnifiedSearch({
    search: querySearch,
    access_level: queryAccessLevel,
    source: querySource,
    mode: queryMode,
    sort: querySort,
    year: queryYear,
    organization: queryOrg,
    explain: explainEnabled,
    page_size: 30
  });

  const searchResults = data?.results ?? [];
  const meta = data?.meta ?? { total: 0, counts: { policy_repository: 0, research_outputs: 0 } };
  const policyCount = meta.counts?.policy_repository ?? searchResults.filter((item) => item.source === "policy_repository").length;
  const researchCount = meta.counts?.research_outputs ?? searchResults.filter((item) => item.source === "research_output").length;
  const summaryCounts = {
    all: meta.total > 0 ? meta.total : policyCount + researchCount,
    policy_repository: policyCount,
    research_output: researchCount,
  };

  useEffect(() => {
    if (!routeSelected) {
      return;
    }

    const selectedItem = searchResults.find((item) => {
      const matchesId = String(item.id) === String(routeSelected);
      const matchesSource = !routeSelectedSource || item.source === routeSelectedSource;
      return matchesId && matchesSource;
    });

    if (selectedItem) {
      setSelectedDoc(selectedItem);
    }
  }, [routeSelected, routeSelectedSource, searchResults]);

  // Update query params in URL
  const updateUrlParams = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });
    router.push(`/search?${nextParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput.trim() });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    router.push("/search?mode=hybrid&source=all&sort=relevance&access_level=public");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-primary/20">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[120px] opacity-50" />
      </div>

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-10 relative">

        {/* Header Title Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >

          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            RPDMS <span className="bg-gradient-to-r from-primary via-emerald-500 to-cyan-500 bg-clip-text text-transparent bg-300% animate-gradient">Unified Intelligence</span> Search
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Cross-source search across Policies and Research submission indices.
          </motion.p>
        </section>

        {/* Central Search Form Bar */}
        <section className="max-w-4xl mx-auto">
          <Card className="border border-border/70 bg-card/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_20px_60px_-28px_rgba(0,0,0,0.35)]">
            <CardContent className="p-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative grow flex items-center bg-background/70 border border-border focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl p-1.5 transition-all duration-300">
                  <Search className="w-5 h-5 text-muted-foreground pl-3 shrink-0" />
                  <Input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search national policies, executive summaries, abstract files or upload references..."
                    className="border-0 focus-visible:ring-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full pl-2"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="p-1 hover:bg-muted rounded-full mr-2 text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl h-12 px-6 shadow-md transition shadow-primary/20 text-xs shrink-0"
                >
                  Search
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`rounded-2xl border-border flex items-center gap-1.5 h-12 text-xs font-semibold px-4 transition ${showFilters || queryYear || queryOrg ? "bg-primary/10 text-primary border-primary/20" : "bg-background text-muted-foreground border-border"
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
              </form>

              {/* Search Mode Pills & Quick Prompts */}
              <div className="pt-3 space-y-2 border-t border-border/40 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground mr-1">Mode:</span>
                  {[
                    { mode: "hybrid", label: "Hybrid", desc: "Keyword + Semantic" },
                    { mode: "semantic", label: "Semantic", desc: "Search by Meaning" },
                    { mode: "keyword", label: "Keyword", desc: "Exact Terms" },
                  ].map((m) => (
                    <button
                      key={m.mode}
                      type="button"
                      onClick={() => updateUrlParams({ mode: m.mode })}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border ${queryMode === m.mode
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background/80 hover:bg-muted text-muted-foreground border-border/70"
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>


              </div>

              {/* Faceted Filters Drawer */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 border-t border-border mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Sort Order */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ordering</label>
                        <select
                          value={querySort}
                          onChange={(e) => updateUrlParams({ sort: e.target.value })}
                          className="w-full bg-background/70 border border-border rounded-xl h-9 text-[11px] font-semibold text-foreground focus:outline-none focus:border-primary/50 px-3"
                        >
                          <option value="relevance">Sort: AI Relevance</option>
                          <option value="date_desc">Sort: Newest First</option>
                          <option value="date_asc">Sort: Oldest First</option>
                        </select>
                      </div>

                      {/* Filter by Year */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Publication Year</label>
                        <Input
                          type="number"
                          placeholder="e.g. 2024"
                          value={queryYear}
                          onChange={(e) => updateUrlParams({ year: e.target.value })}
                          className="bg-background/70 border border-border rounded-xl h-9 text-[11px] text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
                        />
                      </div>

                      {/* Filter by Organization */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Organization</label>
                        <Input
                          type="text"
                          placeholder="e.g. Ministry of Health"
                          value={queryOrg}
                          onChange={(e) => updateUrlParams({ organization: e.target.value })}
                          className="bg-background/70 border border-border rounded-xl h-9 text-[11px] text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-4">
                      {/* Explain Toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExplainEnabled(!explainEnabled)}
                          className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-all ${explainEnabled ? "bg-emerald-500" : "bg-muted"
                            }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${explainEnabled ? "translate-x-4" : "translate-x-0"
                              }`}
                          />
                        </button>
                        <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1">
                          Show AI Relevance Calculations
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground cursor-pointer" />
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase px-3 h-8"
                      >
                        Reset All
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Source Categories Slider Tabs */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-4xl mx-auto border-b border-border pb-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
            {[
              { id: "all", label: `All Results (${summaryCounts.all})` },
              { id: "policy_repository", label: `Policy Repository (${summaryCounts.policy_repository})` },
              { id: "research_output", label: `Research Outputs (${summaryCounts.research_output})` },
            ].map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => updateUrlParams({ source: src.id })}
                className={`rounded-xl py-2 px-5 text-xs font-bold transition flex items-center gap-2 ${querySource === src.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          {querySearch && (
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-card/60 border border-border px-4 py-2 rounded-xl">
              <span className="font-bold text-primary capitalize">{queryMode === "hybrid" ? "Hybrid Model" : queryMode} Mode</span>
            </div>
          )}
        </section>

        {/* Search Results Display Feed */}
        <section className="max-w-4xl mx-auto space-y-5">
          {isLoading ? (
            <div className="py-24 text-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground text-sm font-semibold tracking-wide animate-pulse">Searching...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center bg-destructive/5 border border-dashed border-destructive/20 rounded-3xl max-w-xl mx-auto">
              <BookOpen className="w-12 h-12 text-destructive/60 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">Search Service Unavailable</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                The search result matching your query could not be reached.
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {searchResults.map((item) => {
                  const isPolicy = item.source === "policy_repository";
                  const orgName = cleanOrgName(item.metadata?.organization);
                  const displaySubtitle = formatSubtitle(item.subtitle, orgName, item.document_type);

                  return (
                    <motion.div
                      key={`${item.source}-${item.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border border-border bg-card/70 hover:bg-card backdrop-blur rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 flex flex-col shadow-sm">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${isPolicy ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                                }`}>
                                {isPolicy ? "Policy" : "Research"}
                              </Badge>
                              <Badge className="bg-muted text-muted-foreground border border-border rounded-md px-2 py-0.5 text-[9px] font-bold">
                                {item.document_type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-primary/70" />
                                {formatDate(item.date)}
                              </span>
                              <span className="text-[10px] font-bold text-foreground/80 flex items-center gap-1 font-mono bg-muted/80 px-2 py-0.5 rounded-md border border-border/60">
                                <Download className="w-3 h-3 text-primary" />
                                {(item.metadata?.download_count ?? 0).toLocaleString()} Downloads
                              </span>
                            </div>

                          </div>

                          <div className="space-y-1">
                            <h3
                              onClick={() => setSelectedDoc(item)}
                              className="text-lg font-bold text-foreground hover:text-primary transition leading-snug cursor-pointer"
                            >
                              <HighlightedText text={item.title} query={clean_query_terms(querySearch)} />
                            </h3>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                              <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="line-clamp-1">{displaySubtitle}</span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                            <HighlightedText text={item.snippet} query={clean_query_terms(querySearch)} />
                          </p>

                          {/* Matched Vector Paragraph Context Card */}
                          {(item.matched_chunk_text || item.snippet) && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                RPDMS AI Context
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono italic">
                                <HighlightedText text={item.matched_chunk_text || item.snippet} query={clean_query_terms(querySearch)} />
                              </p>
                            </div>
                          )}

                          <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedDoc(item)}
                              className="text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase gap-1 px-3 h-8 hover:bg-muted"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              View Summary
                            </Button>

                            <Button
                              size="sm"
                              className="rounded-xl font-bold text-xs uppercase px-4 h-9 gap-1.5 shadow"
                              disabled={downloadingId === `${item.source}-${item.id}`}
                              onClick={() => {
                                const resolvedUrl = item.file_url && item.file_url !== "#" ? item.file_url : item.url;
                                const isExternal = resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://");
                                if (isExternal) {
                                  window.open(resolvedUrl, "_blank", "noopener,noreferrer");
                                  return;
                                }
                                setDownloadingId(`${item.source}-${item.id}`);
                                void trackDownload(item).finally(() => {
                                  setDownloadingId(null);
                                  downloadRemoteFile(resolvedUrl, extractFileName(resolvedUrl));
                                });
                              }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              {downloadingId === `${item.source}-${item.id}` ? "Downloading..." : "Download File"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-20 text-center bg-card/40 border border-dashed border-border rounded-3xl space-y-3">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-bold text-foreground">No matching documents found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try searching with broader terms, clearing active filters, or switching search modes above.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-2 text-xs font-bold rounded-xl"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Full-Page Document Intelligence Viewer */}
      <AnimatePresence>
        {selectedDoc && (
          <SearchDocumentFullViewer
            document={selectedDoc}
            onClose={() => {
              setSelectedDoc(null);
              updateUrlParams({ selected: null, selected_source: null });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility to escape clean terms from parsed filters
function clean_query_terms(query: string) {
  const parts = query.split(/\s+/);
  return parts.filter(p => !p.includes(":")).join(" ").trim();
}
