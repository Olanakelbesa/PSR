"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Download,
  FileText,
  Search,
  Users,
  ShieldCheck,
  Network,
  ArrowUpRight,
  Lock,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { publicApi } from "@/api/legacy-apis";
import { tokenStorage } from "@/api";
import { API_ENDPOINTS } from "@/api/endpoints";
import StatsStrip from "@/components/landing/StatsStrip";
import TrustBand from "@/components/landing/TrustBand";
import TrendsCard from "@/components/landing/TrendsCard";
import { useThematicAreas } from "@/lib/queries/thematic-area";
import { useSubThematicAreas } from "@/lib/queries/sub-thematic-area";
import type { SearchResultItem } from "@/lib/queries/search";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const grantCallCardThemes = [
  {
    color: "text-blue-600",
    bg: "bg-blue-50",
    image: "/workflow_ingestion.png",
    icon: FileText,
  },
  {
    color: "text-purple-600",
    bg: "bg-purple-50",
    image: "/workflow_execution.png",
    icon: BarChart3,
  },
  {
    color: "text-orange-600",
    bg: "bg-orange-50",
    image: "/psr_spotlight.png",
    icon: Users,
  },
  {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    image: "/workflow_governance.png",
    icon: ShieldCheck,
  },
];

function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? dateValue : parsed.toLocaleDateString();
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResultItem[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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
      await fetch(url, { method: "POST", headers });
      queryClient.invalidateQueries({ queryKey: ["public-overview"] });
    } catch {
      // Best effort — don't block the download
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search debounced query effect
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    setShowSuggestions(true);
    const controller = new AbortController();
    const debounce = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          access_level: "public",
          explain: "false",
          mode: "hybrid",
          page: "1",
          page_size: "5",
          search: query,
          sort: "relevance",
          source: "all",
        });

        const headers: HeadersInit = { accept: "application/json" };
        const token = tokenStorage.get();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `/bff${API_ENDPOINTS.SEARCH.LIST}?${params.toString()}`,
          {
            headers,
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }

        const data = await response.json();
        setSearchSuggestions(Array.isArray(data?.results) ? data.results : []);
      } catch (error: any) {
        const isAbort =
          controller.signal.aborted ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED";

        if (isAbort) return;

        if (process.env.NODE_ENV === "development") {
          console.warn("Live search suggestion failed:", error);
        }

        setSearchSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [searchQuery]);

  const openSearchPage = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setShowSuggestions(false);

    router.push(
      `/search?search=${encodeURIComponent(trimmed)}&access_level=public&mode=hybrid&sort=relevance&source=all`,
    );
  };

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["public-overview"],
    queryFn: async () => {
      const res = await publicApi.getOverview();
      const envelope = res ?? null;
      let payload = envelope?.data ?? envelope;
      if (payload && payload.data !== undefined) payload = payload.data;
      return payload ?? null;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const metrics = overview?.metrics ?? overview ?? {};

  const derivedOverview = {
    publishedPolicies: metrics.publishedPolicies ?? 0,
    openCalls: metrics.openGrantCalls ?? metrics.openCalls ?? 0,
    proposalsSubmitted: metrics.totalResearchProposalsSubmitted ?? metrics.proposalsSubmitted ?? 0,
    institutions: metrics.institutionsUsingSystem ?? metrics.institutions ?? 0,
  };

  const trustPayload = {
    publishedPolicies: metrics.publishedPolicies ?? 0,
    totalResearchOutputs: metrics.totalResearchOutputs ?? 0,
    totalGrantCalls: metrics.totalGrantCalls ?? metrics.totalGrantCallsPublished ?? 0,
    totalStrategicObjectives: metrics.totalStrategicObjectives ?? 0,
    totalThematicAreas: metrics.totalThematicAreas ?? 0,
    totalPolicyDownloads: metrics.totalPolicyDownloads ?? 0,
    totalResearchDownloads: metrics.totalResearchDownloads ?? 0,
  };

  const trendData = overview?.monthlyProposalSubmissions ?? [];
  const policyTrendData = overview?.monthlyPolicyRegistrations ?? [];
  const activeGrantCalls = overview?.activeGrantCalls ?? [];
  const openGrantCalls = activeGrantCalls.filter((call: any) => {
    const status = String(call?.status ?? "").toLowerCase();
    return status === "open" || status === "active";
  });
  const featuredGrantCall = openGrantCalls[0] ?? activeGrantCalls[0] ?? null;

  const { data: thematicAreasResponse, isLoading: loadingThematicAreas } =
    useThematicAreas();
  const { data: subThematicAreasResponse, isLoading: loadingSubThematicAreas } =
    useSubThematicAreas({ limit: 200 });

  const thematicAreaPreview = useMemo(() => {
    const areas = thematicAreasResponse?.data ?? [];
    const subAreas = subThematicAreasResponse?.data ?? [];

    return areas.map((area: any) => ({
      ...area,
      subAreas: subAreas.filter(
        (sub: any) => String(sub.thematic_area) === String(area.id),
      ),
    }));
  }, [subThematicAreasResponse?.data, thematicAreasResponse?.data]);

  // Throttled scroll listener using requestAnimationFrame for smooth 60fps scrolling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;
          setScrollProgress(totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0);
          setIsScrolled(currentScroll > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 scroll-smooth antialiased">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-primary z-[100] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center pt-20 overflow-x-clip">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div
              className="absolute top-0 left-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full animate-pulse"
              style={{
                transform: `translate(${Math.min(scrollProgress, 100) * 0.2}px, ${Math.min(scrollProgress, 100) * 0.1}px)`,
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full animate-pulse delay-700"
              style={{
                transform: `translate(-${Math.min(scrollProgress, 100) * 0.15}px, -${Math.min(scrollProgress, 100) * 0.2}px)`,
              }}
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>

          <div className="container mx-auto px-4 pt-10 md:pt-20 relative">
            <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-7xl font-black tracking-tight leading-[1.1] md:leading-[1.05]">
                Research and Policy {" "}
                <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                  Documents
                </span>{" "}
                Management System
              </h1>

              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto opacity-90">
                The system for policy repositories and
                research lifecycle management. Built for institutions that
                prioritize transparency and efficiency.
              </p>

              {/* Landing Search Bar Container */}
              <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto pt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    openSearchPage(searchQuery);
                  }}
                  className="relative flex items-center bg-background/80 backdrop-blur-md border border-primary/20 hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl p-2 pr-2.5 shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center pl-3 pr-2 text-muted-foreground pointer-events-none">
                    <Search className="h-5 w-5 text-primary/70" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search national policies, guidelines, or research strategies..."
                    value={searchQuery}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length >= 2) {
                        setShowSuggestions(true);
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setShowSuggestions(false);
                        searchInputRef.current?.blur();
                      } else if (e.key === "Enter") {
                        if (searchSuggestions.length > 0) {
                          e.preventDefault();
                          openSearchPage(searchQuery);
                        }
                      }
                    }}
                    className="w-full bg-transparent border-0 outline-none focus:ring-0 py-3 text-sm text-foreground placeholder:text-muted-foreground/60"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 mr-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                      aria-label="Clear search query"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
                  >
                    Search
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </form>

                {/* Smooth Search Suggestions Dropdown positioned natively in CSS */}
                {showSuggestions && (searchQuery.trim().length >= 2 || suggestionsLoading) && (
                  <div className="absolute top-full left-0 right-0 w-full mt-2 z-50 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl p-2 max-h-96 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
                    {suggestionsLoading ? (
                      <div className="flex items-center gap-2.5 p-4 text-sm text-muted-foreground">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                        <span>Searching repository...</span>
                      </div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                        {searchSuggestions.map((item) => (
                          <div
                            key={`${item.source}-${item.id}`}
                            role="button"
                            tabIndex={0}
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => {
                              setShowSuggestions(false);
                              router.push(
                                `/search?search=${encodeURIComponent(item.title.trim())}&access_level=public&mode=hybrid&sort=relevance&source=all`,
                              );
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                setShowSuggestions(false);
                                router.push(
                                  `/search?search=${encodeURIComponent(item.title.trim())}&access_level=public&mode=hybrid&sort=relevance&source=all`,
                                );
                              }
                            }}
                            className="w-full text-left p-3.5 transition-colors hover:bg-muted/60 rounded-xl cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {item.title}
                                </div>
                                {item.subtitle && (
                                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.snippet && (
                              <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                {item.snippet}
                              </div>
                            )}
                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                              <div className="flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium text-[10px]">
                                  {item.source.replace(/_/g, " ")}
                                </span>
                                {item.document_type && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-[10px]">
                                    {item.document_type}
                                  </span>
                                )}
                                {item.access_level && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-[10px]">
                                    {item.access_level}
                                  </span>
                                )}
                                {item.date && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-[10px]">
                                    {formatDate(item.date)}
                                  </span>
                                )}
                              </div>
                              {item.file_url ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] rounded-lg border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 px-2.5"
                                  disabled={downloadingId === `${item.source}-${item.id}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setDownloadingId(`${item.source}-${item.id}`);
                                    trackDownload(item).finally(() => {
                                      window.open(resolveFileUrl(item.file_url) ?? "#", "_blank", "noreferrer");
                                      setDownloadingId(null);
                                    });
                                  }}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  {downloadingId === `${item.source}-${item.id}` ? "Downloading..." : "Download"}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No suggestions found. Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Enter</kbd> to search the public repository.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Dashboard Showcase */}
            <motion.div className="mt-20 max-w-5xl mx-auto" />
          </div>
        </section>

        {/* Features / Modules Section */}
        <section id="modules" className="py-12 md:py-16 bg-background relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {loadingOverview ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-[360px] rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4 flex flex-col justify-between shadow-xs">
                    <div className="space-y-3">
                      <Skeleton className="h-40 w-full rounded-xl" />
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-5 w-3/4 rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-2/3 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                ))
              ) : openGrantCalls.length ? (
                openGrantCalls.slice(0, 4).map((call: any, index: number) => {
                  const theme = grantCallCardThemes[index % grantCallCardThemes.length];
                  const cleanDesc = stripHtmlTags(call.description);
                  const dueDate = call.closeDate ?? call.deadline;

                  return (
                    <RevealOnScroll key={call.id} delay={index * 100}>
                      <div
                        onClick={() => router.push(`/calls/${call.id}`)}
                        className="group h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer"
                      >
                        <div className="h-44 relative overflow-hidden bg-muted">
                          <Image
                            src={resolveFileUrl(call.thumbnailImage) ?? resolveFileUrl(call.bannerImage) ?? theme.image}
                            alt={call.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10 pointer-events-none" />
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2.5">
                            {dueDate && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 font-mono">
                                  Due {formatDate(dueDate)}
                                </span>
                              </div>
                            )}
                            <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {call.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                              {cleanDesc}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="w-full justify-between hover:bg-primary/5 hover:text-primary font-bold text-xs p-0 h-auto pt-2 border-t border-border/50 rounded-none"
                          >
                            <Link href={`/calls/${call.id}`}>
                              Learn More
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </RevealOnScroll>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  No active grant calls at this moment.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <StatsStrip metrics={derivedOverview} isLoading={loadingOverview} />

        {/* Trust Band */}
        <TrustBand payload={trustPayload} isLoading={loadingOverview} />

        {/* Analytics / Trends Preview */}
        <section className="py-16 md:py-24 bg-muted/20 relative border-t border-b border-border/40">
          <div className="container mx-auto px-4 md:px-20">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase">
                Analytics & Insight
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Data-Driven <span className="text-primary">Policy Impact</span>
              </h2>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                Real-time tracking of research output registrations, submissions, and institutional impact metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TrendsCard
                title="Research Proposals Over Time"
                subtitle="Monthly proposal submission volume across institutions"
                data={trendData}
                dataKey="proposals"
                loading={loadingOverview}
              />
              <TrendsCard
                title="Policy Document Registrations"
                subtitle="Cumulative national policy document registrations by month"
                data={policyTrendData}
                dataKey="policies"
                loading={loadingOverview}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
