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

function resolveFileUrl(filePath?: string | null) {
  if (!filePath) return "#";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith("/api/proxy")) return filePath;
  if (filePath.startsWith("/")) return `/api/proxy${filePath}`;
  return `/api/proxy/${filePath}`;
}

function extractFileName(filePath?: string | null) {
  if (!filePath) return "No file";
  return filePath.split("/").pop() || filePath;
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? dateValue : parsed.toLocaleDateString();
}

// Simple text highlighter utility
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-500/25 text-amber-200 px-0.5 rounded font-medium">
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
  const policyResultCount = searchResults.filter((item) => item.source === "policy_repository").length;
  const researchResultCount = searchResults.filter((item) => item.source === "research_output").length;
  const policyCount = meta.counts?.policy_repository > 0 ? meta.counts.policy_repository : policyResultCount;
  const researchCount = meta.counts?.research_outputs > 0 ? meta.counts.research_outputs : researchResultCount;
  const summaryCounts = {
    all: policyCount + researchCount,
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
            <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1 text-xs font-semibold tracking-wider uppercase mb-3 flex items-center gap-1.5 w-fit mx-auto shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Intelligence Search
            </Badge>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            PSR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-cyan-500 bg-300% animate-gradient">Unified Intelligence</span> Search
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
                <div className="relative flex-grow flex items-center bg-background/70 border border-border focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl p-1.5 transition-all duration-300">
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
                  className={`rounded-2xl border-border flex items-center gap-1.5 h-12 text-xs font-semibold px-4 transition ${
                    showFilters || queryYear || queryOrg ? "bg-primary/10 text-primary border-primary/20" : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
              </form>

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
                      {/* Search Mode */}
                      {/* <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Search Paradigm</label>
                        <div className="grid grid-cols-2 gap-1 bg-background/70 p-1 rounded-xl border border-border">
                          {["hybrid", "semantic", "keyword", "fuzzy"].map((md) => (
                            <button
                              key={md}
                              type="button"
                              onClick={() => updateUrlParams({ mode: md })}
                              className={`rounded-lg py-1 px-2 text-[10px] font-bold capitalize transition-all ${
                                queryMode === md ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {md}
                            </button>
                          ))}
                        </div>
                      </div> */}

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
                          className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-all ${
                            explainEnabled ? "bg-emerald-500" : "bg-muted"
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                              explainEnabled ? "translate-x-4" : "translate-x-0"
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
          <div className="flex items-center gap-2 bg-card/70 p-1 rounded-2xl border border-border backdrop-blur">
            {[
              { id: "all", label: "All Sources", count: summaryCounts.all },
              { id: "policy_repository", label: "Policies", count: summaryCounts.policy_repository },
              { id: "research_output", label: "Research Outputs", count: summaryCounts.research_output },
            ].map((src) => (
              <button
                key={src.id}
                onClick={() => updateUrlParams({ source: src.id })}
                className={`rounded-xl py-2 px-5 text-xs font-bold transition flex items-center gap-2 ${
                  querySource === src.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          {querySearch && (
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-card/60 border border-border px-4 py-2 rounded-xl">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Routed: <span className="font-bold text-primary capitalize">{queryMode === "hybrid" ? "Hybrid Model" : queryMode} Mode</span>
            </div>
          )}
        </section>

        {/* Search Results Display Feed */}
        <section className="max-w-4xl mx-auto space-y-5">
          {isLoading ? (
            <div className="py-24 text-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground text-sm font-semibold tracking-wide animate-pulse">Running advanced routing and blend ranking queries...</p>
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
                              <Badge className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                  isPolicy ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                              }`}>
                                {isPolicy ? "Policy" : "Research"}
                              </Badge>
                                <Badge className="bg-muted text-muted-foreground border border-border rounded-md px-2 py-0.5 text-[9px] font-bold">
                                {item.document_type}
                              </Badge>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(item.date)}
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
                              <span className="line-clamp-1">{item.subtitle}</span>
                            </div>
                          </div>

                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                            <HighlightedText text={item.snippet} query={clean_query_terms(querySearch)} />
                          </p>

                          {/* Explain calculations dashboard inside result */}
                          {item.explain && (
                              <div className="p-4 bg-background/70 border border-border rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono">
                              <div>
                                  <span className="text-muted-foreground block">Keyword FTS</span>
                                  <span className="font-bold text-foreground">{item.explain.keyword_score}</span>
                              </div>
                              <div>
                                  <span className="text-muted-foreground block">Semantic Vector</span>
                                  <span className="font-bold text-foreground">{item.explain.semantic_score}</span>
                              </div>
                              <div>
                                  <span className="text-muted-foreground block">Trigram Fuzzy</span>
                                  <span className="font-bold text-foreground">{item.explain.fuzzy_score}</span>
                              </div>
                              <div>
                                  <span className="text-muted-foreground block">Meta/Fresh Boosts</span>
                                <span className="font-bold text-emerald-400">+{item.explain.metadata_boost + item.explain.freshness_boost}</span>
                              </div>
                                <div className="col-span-2 sm:col-span-4 pt-1.5 mt-1.5 border-t border-border text-[9px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                  <span>
                                    Signals: {Array.isArray(item.explain.candidate_sources) ? item.explain.candidate_sources.join(", ") : "none"}
                                  </span>
                                  <span>
                                    Fields: {Array.isArray(item.explain.matched_fields) && item.explain.matched_fields.length > 0
                                      ? item.explain.matched_fields.join(", ")
                                      : "none"}
                                  </span>
                              </div>
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
                              asChild
                              size="sm"
                              className="rounded-xl font-bold text-xs uppercase px-4 h-9 gap-1.5 shadow"
                            >
                              <a
                                href={resolveFileUrl(item.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                download={extractFileName(item.file_url)}
                              >
                                <Download className="w-3.5 h-3.5" />
                                File Field
                              </a>
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
            <div className="py-24 text-center border border-dashed border-border rounded-3xl bg-card/40">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold text-foreground">No Intelligence Matches</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                We couldn't retrieve documents for "{querySearch}". Try typing a descriptive sentence, clear your year filters, or choose another mode.
              </p>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="mt-6 border-border text-xs font-bold"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Details Slide-Over Drawer panel */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-background border-l border-border shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-background/90 sticky top-0 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <Badge className={`px-2 py-0.5 rounded uppercase text-[9px] font-black tracking-wide ${
                    selectedDoc.source === "policy_repository" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                  }`}>
                    {selectedDoc.source === "policy_repository" ? "Policy Repository" : "Research Output"}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="p-6 space-y-6 flex-grow">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{selectedDoc.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <Building className="w-4 h-4 text-primary shrink-0" />
                    <span>{selectedDoc.subtitle}</span>
                  </div>
                </div>

                <div className="p-5 bg-card rounded-2xl border border-border space-y-3.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Abstract Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                    {selectedDoc.metadata?.abstract || selectedDoc.metadata?.executive_summary || selectedDoc.snippet}
                  </p>
                </div>

                {/* Metadata Fields Accordion */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Indexed Properties</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-background/60 border border-border p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Document ID</span>
                      <span className="font-semibold text-foreground">{selectedDoc.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Type classification</span>
                      <span className="font-semibold text-foreground">{selectedDoc.document_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Access status</span>
                      <span className="font-semibold text-foreground capitalize flex items-center gap-1">
                        {selectedDoc.access_level === "public" ? <Globe className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Lock className="w-3 h-3 text-red-500" />}
                        {selectedDoc.access_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Publication date</span>
                      <span className="font-semibold text-foreground">{formatDate(selectedDoc.date)}</span>
                    </div>
                    
                    {selectedDoc.metadata?.serial_number && (
                      <div className="col-span-2 border-t border-border pt-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Registry Serial Number</span>
                        <span className="font-semibold text-foreground font-mono">{selectedDoc.metadata.serial_number}</span>
                      </div>
                    )}
                    {selectedDoc.metadata?.doi && (
                      <div className="col-span-2 border-t border-border pt-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Digital Object Identifier (DOI)</span>
                        <span className="font-semibold text-foreground font-mono break-all">{selectedDoc.metadata.doi}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-border bg-background/90 sticky bottom-0 backdrop-blur z-10 flex gap-3">
                <Button
                  onClick={() => setSelectedDoc(null)}
                  variant="outline"
                  className="rounded-2xl border-border flex-grow font-bold text-xs uppercase h-12"
                >
                  Close Drawer
                </Button>
                <Button
                  asChild
                  className="rounded-2xl flex-grow font-bold text-xs uppercase h-12 gap-1.5 shadow"
                >
                  <a
                    href={resolveFileUrl(selectedDoc.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    download={extractFileName(selectedDoc.file_url)}
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
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
