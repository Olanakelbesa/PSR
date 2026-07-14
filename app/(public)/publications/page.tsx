"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  Globe,
  Library,
  Lock,
  Microscope,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  useUnifiedSearch,
  type SearchResultItem,
} from "@/lib/queries/search";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { tokenStorage } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

type PublicationTab = "all" | "policy_repository" | "research_output";

const TABS: Array<{
  value: PublicationTab;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Library;
}> = [
  {
    value: "all",
    label: "All",
    shortLabel: "All",
    description: "Published repository",
    icon: Library,
  },
  {
    value: "policy_repository",
    label: "Policy Docs",
    shortLabel: "Policies",
    description: "Published policies",
    icon: FileText,
  },
  {
    value: "research_output",
    label: "Research",
    shortLabel: "Research",
    description: "Approved outputs",
    icon: Microscope,
  },
];

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime())
    ? dateValue
    : parsed.toLocaleDateString();
}

function getAccessBadgeClass(accessLevel?: string) {
  return accessLevel === "restricted"
    ? "bg-red-500/10 text-red-500 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
}

function getSourceBadgeClass(source?: string) {
  return source === "research_output"
    ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
    : "bg-primary/10 text-primary border-primary/20";
}

function getSourceLabel(source?: string) {
  return source === "research_output" ? "Research" : "Policy";
}

function isPublishedPolicy(item: SearchResultItem) {
  if (item.source !== "policy_repository") return true;
  const status = String(item.metadata?.status ?? "").toLowerCase();
  return !status || status === "published";
}

function resolveTabFromParams(
  typeParam: string | null,
  sourceParam: string | null,
): PublicationTab {
  const raw = (typeParam || sourceParam || "all").toLowerCase();
  if (raw === "research" || raw === "research_output") return "research_output";
  if (raw === "policy" || raw === "policy_docs" || raw === "policy_repository") {
    return "policy_repository";
  }
  return "all";
}

function tabToUrlType(tab: PublicationTab) {
  if (tab === "research_output") return "research";
  if (tab === "policy_repository") return "policy";
  return null;
}

export default function PublicPublicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeSearch = searchParams.get("search") ?? "";
  const routeSelected = searchParams.get("selected") ?? null;
  const routeType = searchParams.get("type");
  const routeSource = searchParams.get("source");

  const [searchQuery, setSearchQuery] = useState(routeSearch);
  const [activeTab, setActiveTab] = useState<PublicationTab>(() =>
    resolveTabFromParams(routeType, routeSource),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSearchQuery(routeSearch);
  }, [routeSearch]);

  useEffect(() => {
    setActiveTab(resolveTabFromParams(routeType, routeSource));
  }, [routeType, routeSource]);

  const { data, isLoading, isError } = useUnifiedSearch({
    search: routeSearch,
    source: activeTab,
    access_level: "public",
    mode: "hybrid",
    sort: sortBy === "newest" ? "date_desc" : "date_asc",
    page_size: PAGE_SIZE,
  });

  const publications = useMemo(() => {
    const results = (data?.results ?? []).filter(isPublishedPolicy);

    if (!searchQuery.trim()) return results;

    const q = searchQuery.toLowerCase();
    return results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.document_type.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        String(item.metadata?.organization ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.metadata?.serial_number ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.metadata?.version_code ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [data?.results, searchQuery]);

  const tabCounts = useMemo(() => {
    const policy =
      data?.meta?.counts?.policy_repository ??
      publications.filter((item) => item.source === "policy_repository").length;
    const research =
      data?.meta?.counts?.research_outputs ??
      publications.filter((item) => item.source === "research_output").length;
    return {
      all: policy + research,
      policy_repository: policy,
      research_output: research,
    };
  }, [data?.meta?.counts, publications]);

  useEffect(() => {
    if (!routeSelected || !data) return;

    const exists = publications.find(
      (item) => String(item.id) === String(routeSelected),
    );
    if (!exists) return;

    setExpandedId(`${exists.source}-${routeSelected}`);
    setTimeout(() => {
      const el = document.getElementById(
        `pub-${exists.source}-${routeSelected}`,
      );
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [routeSelected, data, publications]);

  const handleTabChange = (value: string) => {
    const next = value as PublicationTab;
    setActiveTab(next);
    setExpandedId(null);

    const params = new URLSearchParams(searchParams.toString());
    const typeValue = tabToUrlType(next);
    if (typeValue) {
      params.set("type", typeValue);
    } else {
      params.delete("type");
    }
    params.delete("source");
    params.delete("selected");
    const qs = params.toString();
    router.push(qs ? `/publications?${qs}` : "/publications");
  };

  const trackDownload = async (item: SearchResultItem) => {
    try {
      const token = tokenStorage.get();
      const headers: HeadersInit = { "Content-Type": "application/json", accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = item.source === "policy_repository"
        ? `/bff/v1/policy-repository/${item.id}/download/`
        : `/bff/v1/final-submissions/${item.id}/download/`;
      await fetch(url, { method: "POST", headers });
      queryClient.invalidateQueries({ queryKey: ["public-overview"] });
    } catch {
      // Best effort
    }
  };

  const handleDownload = async (item: SearchResultItem) => {
    setDownloadingId(`${item.source}-${item.id}`);
    await trackDownload(item);
    setDownloadingId(null);
  };

  const emptyLabel =
    activeTab === "research_output"
      ? "research outputs"
      : activeTab === "policy_repository"
        ? "policy documents"
        : "publications";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full">
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
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
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
                Policy &{" "}
                <span className="text-primary">Research Repository</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-white leading-relaxed mx-auto">
                A centralized repository for accessing research publications,
                policy documents, reports, guidelines, and institutional
                resources.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5 pb-6 border-b border-border/60">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div
                  role="tablist"
                  aria-label="Publication sources"
                  className="grid grid-cols-3 gap-1 p-1.5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-sm w-full xl:w-auto xl:min-w-[520px]"
                >
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    const count = tabCounts[tab.value];

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleTabChange(tab.value)}
                        className={cn(
                          "relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl px-3 py-2.5 text-center transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                          <span className="text-[11px] sm:text-xs font-bold tracking-wide truncate">
                            <span className="sm:hidden">{tab.shortLabel}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-[10px] font-bold tabular-nums",
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {count}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSortBy(sortBy === "newest" ? "oldest" : "newest")
                    }
                    className="rounded-xl h-11 border-border/70 text-xs font-bold flex items-center gap-2 bg-card/60"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Sort: {sortBy === "newest" ? "Newest" : "Oldest"}
                  </Button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const query = searchQuery.trim();
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      if (query) params.set("search", query);
                      else params.delete("search");
                      const qs = params.toString();
                      router.push(
                        qs ? `/publications?${qs}` : "/publications",
                      );
                    }}
                    className="relative w-full sm:w-72 group"
                  >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder="Search titles, orgs, serials…"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setExpandedId(null);
                      }}
                      className="pl-9 h-11 bg-card/60 border-border/70 focus-visible:ring-primary rounded-xl"
                    />
                  </form>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                {TABS.find((tab) => tab.value === activeTab)?.description}
                {activeTab === "all"
                  ? " — policies and research in one place"
                  : null}
              </p>
            </div>

            {isLoading ? (
              <div className="py-24 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground text-sm mt-4">
                  Indexing publication database...
                </p>
              </div>
            ) : isError ? (
              <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground">
                  Unable to load the repository
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                  The public repository could not be loaded right now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {publications.map((pub) => {
                    const rowKey = `${pub.source}-${pub.id}`;
                    const isExpanded = expandedId === rowKey;
                    const organization = String(
                      pub.metadata?.organization ?? pub.subtitle ?? "—",
                    );
                    const serial = String(pub.metadata?.serial_number ?? "");
                    const version = String(pub.metadata?.version_code ?? "");
                    const status = String(
                      pub.metadata?.status ??
                        (pub.source === "research_output"
                          ? "Approved"
                          : "Published"),
                    );
                    const fileUrl = resolveFileUrl(
                      pub.file_url || pub.metadata?.file_url,
                    );
                    const isDownloading = downloadingId === rowKey;

                    return (
                      <motion.div
                        id={`pub-${rowKey}`}
                        key={rowKey}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : rowKey)
                            }
                            className="w-full text-left p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/1 transition"
                          >
                            <div className="space-y-2 grow">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge
                                  className={`border text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${getSourceBadgeClass(pub.source)}`}
                                >
                                  {getSourceLabel(pub.source)}
                                </Badge>
                                <Badge className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                                  {pub.document_type || "Document"}
                                </Badge>
                                <Badge
                                  className={`border text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${getAccessBadgeClass(pub.access_level)}`}
                                >
                                  {pub.access_level === "restricted" ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Lock className="h-3 w-3" /> Restricted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      <Globe className="h-3 w-3" /> Public
                                    </span>
                                  )}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(pub.date)}
                                </span>
                              </div>
                              <h3 className="text-base md:text-lg font-bold text-foreground leading-snug">
                                {pub.title}
                              </h3>
                              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="line-clamp-1">
                                  {organization}
                                </span>
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
                                <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div className="space-y-1.5 md:col-span-2">
                                      <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-primary" />
                                        Summary
                                      </h4>
                                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                        {pub.snippet ||
                                          (serial
                                            ? `${pub.title} is registered under serial ${serial}${version ? ` with version ${version}` : ""}.`
                                            : pub.title)}
                                      </p>
                                    </div>

                                    {serial ? (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          Serial Number
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground font-mono">
                                          {serial}
                                        </p>
                                      </div>
                                    ) : null}
                                    {version ? (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          Version Code
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground font-mono">
                                          {version}
                                        </p>
                                      </div>
                                    ) : null}
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Date
                                      </p>
                                      <p className="mt-1 font-semibold text-foreground">
                                        {formatDate(pub.date)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Organization
                                      </p>
                                      <p className="mt-1 font-semibold text-foreground">
                                        {organization}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Status
                                      </p>
                                      <p className="mt-1 font-semibold text-foreground">
                                        {status}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Access
                                      </p>
                                      <p className="mt-1 font-semibold text-foreground capitalize">
                                        {pub.access_level}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="pt-4 border-t border-white/5 flex justify-end">
                                    {fileUrl && fileUrl !== "#" ? (
                                      <Button
                                        disabled={isDownloading}
                                        className="rounded-xl font-bold text-xs tracking-wider uppercase h-10 px-6 gap-2"
                                        onClick={() => {
                                          handleDownload(pub).then(() => {
                                            window.open(fileUrl, "_blank", "noreferrer");
                                          });
                                        }}
                                      >
                                        {isDownloading ? (
                                          <>
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Opening File
                                          </>
                                        ) : (
                                          <>
                                            <Download className="w-4 h-4" />
                                            Download Official File
                                          </>
                                        )}
                                      </Button>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        No downloadable file available.
                                      </p>
                                    )}
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

                {!isLoading && publications.length === 0 && (
                  <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-foreground">
                      No matches found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                      No {emptyLabel} found
                      {searchQuery ? ` for "${searchQuery}"` : ""}. Try another
                      tab or clear your search.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        handleTabChange("all");
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
