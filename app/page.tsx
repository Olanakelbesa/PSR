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
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { publicApi } from "@/api/legacy-apis";
import { tokenStorage } from "@/api";
import { API_ENDPOINTS } from "@/api/endpoints";
import { createPortal } from "react-dom";
import StatsStrip from "@/components/landing/StatsStrip";
import TrustBand from "@/components/landing/TrustBand";
import TrendsCard from "@/components/landing/TrendsCard";
import { useThematicAreas } from "@/lib/queries/thematic-area";
import { useSubThematicAreas } from "@/lib/queries/sub-thematic-area";
import type { SearchResultItem } from "@/lib/queries/search";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";

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
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    if (ref) observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref]);

  return (
    <div
      ref={setRef}
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

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResultItem[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionRect, setSuggestionRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portalStyle, setPortalStyle] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [overview, setOverview] = useState<any | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

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

  useEffect(() => {
    setMounted(true);
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
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

          const resp = error?.response?.data ?? null;
          const message = error?.message ?? String(error);
          if (process.env.NODE_ENV === "development") {
            console.warn("Live search suggestion failed:", {
              message,
              resp,
            });
          }

          // Clear suggestions on error to keep UI consistent.
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

    const selectedItem = searchSuggestions[0];
    const selectedParams = selectedItem
      ? `&selected=${encodeURIComponent(String(selectedItem.id))}&selected_source=${encodeURIComponent(selectedItem.source)}`
      : "";

    router.push(
      `/search?search=${encodeURIComponent(trimmed)}&access_level=public&mode=hybrid&sort=relevance&source=all${selectedParams}`,
    );
  };

  useEffect(() => {
    const update = () => {
      const el = searchInputRef.current;
      if (!el) return setSuggestionRect(null);
      const rect = el.getBoundingClientRect();
      setSuggestionRect(rect);

      // compute responsive portal style
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const padding = 16;
      const mobileBreakpoint = 640;

      let width = rect.width;
      let left = rect.x;
      const spaceBelow = viewportH - (rect.y + rect.height);
      const spaceAbove = rect.y;
      const preferredMax = 256;

      if (viewportW <= mobileBreakpoint) {
        width = Math.min(viewportW - padding * 2, width);
        left = Math.max(padding, (viewportW - width) / 2);
      } else {
        // clamp to viewport edges
        width = Math.min(width, viewportW - padding * 2);
        if (left + width > viewportW - padding) left = viewportW - width - padding;
        if (left < padding) left = padding;
      }

      let maxHeight = Math.min(preferredMax, Math.max(120, spaceBelow - 24));
      let top = rect.y + rect.height + 8;
      // if not enough space below and more space above, render above
      if (spaceBelow < 140 && spaceAbove > spaceBelow) {
        const available = Math.min(preferredMax, spaceAbove - 24);
        maxHeight = Math.max(120, Math.min(preferredMax, available));
        top = rect.y - 8 - maxHeight;
      }

      setPortalStyle({ left: Math.round(left), top: Math.round(top), width: Math.round(width), maxHeight: Math.round(maxHeight) });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [searchInputRef.current]);

  useEffect(() => {
    let mounted = true;
    async function loadOverview() {
      setLoadingOverview(true);
      try {
        const res = await publicApi.getOverview();
        // Some APIs wrap data in an envelope — try to be resilient
        const envelope = res ?? null;
        let payload = envelope?.data ?? envelope;
        // double-wrapped envelope: { data: { data: {...} } }
        if (payload && payload.data !== undefined) payload = payload.data;
        if (!mounted) return;
        setOverview(payload ?? null);
      } catch (err) {
        // graceful fallback: leave overview null
        if (!mounted) return;
        setOverview(null);
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    }

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = overview?.metrics ?? {};

  const derivedOverview = {
    publishedPolicies: metrics.publishedPolicies ?? 0,
    openCalls: metrics.openGrantCalls ?? 0,
    proposalsSubmitted: metrics.totalResearchProposalsSubmitted ?? 0,
    institutions: metrics.institutionsUsingSystem ?? 0,
  };

  const trustPayload = {
    institutions: metrics.institutionsUsingSystem ?? 0,
    researchCenters: metrics.researchCenters ?? 0,
    grantCalls: metrics.totalGrantCallsPublished ?? 0,
    approvedPolicies: metrics.totalRegisteredPolicies ?? 0,
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
    useSubThematicAreas({ limit: 200 }); // Preview only — 200 is more than enough for a landing page

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

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / totalScroll) * 100);
      setIsScrolled(currentScroll > 20);
    };

    window.addEventListener("scroll", handleScroll);
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

      <main className="flex-1 ">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center pt-20 overflow-x-clip">
          <div className="absolute inset-0 -z-10">
            <div
              className="absolute top-0 left-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full animate-pulse"
              style={{
                transform: `translate(${scrollProgress * 0.2}px, ${scrollProgress * 0.1}px)`,
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full animate-pulse delay-700"
              style={{
                transform: `translate(-${scrollProgress * 0.15}px, -${scrollProgress * 0.2}px)`,
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
                The unified operating system for policy repositories and
                research lifecycle management. Built for institutions that
                prioritize transparency and efficiency.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  openSearchPage(searchQuery);
                }}
                className="relative w-full max-w-2xl mx-auto pt-4"
              >
                <div className="relative flex items-center bg-background/60 backdrop-blur-xl border border-primary/20 hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl p-2 pr-2.5 shadow-xl transition-all duration-300">
                  <div className="flex items-center pl-3 pr-2 text-muted-foreground pointer-events-none">
                    <Search className="h-5 w-5 text-primary/70" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search national policies, guidelines, or research strategies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (searchSuggestions.length > 0) {
                          e.preventDefault();
                          openSearchPage(searchQuery);
                        }
                      }
                    }}
                    className="w-full bg-transparent border-0 outline-none focus:ring-0 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 "
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                  >
                    Search
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                {(searchQuery.trim().length >= 2 || suggestionsLoading) && mounted && suggestionRect && portalStyle && createPortal(
                  <div
                    style={{
                      position: "fixed",
                      left: portalStyle.left,
                      top: portalStyle.top,
                      width: portalStyle.width,
                      zIndex: 9999,
                      maxHeight: portalStyle.maxHeight,
                    }}
                    className="max-h-112 overflow-hidden rounded-xl border bg-muted/30 p-2 shadow-2xl relative group backdrop-blur-xl"
                  >
                    {suggestionsLoading ? (
                      <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="overflow-auto">
                        {searchSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => {
                              router.push(
                                `/search?search=${encodeURIComponent(searchQuery.trim())}&access_level=public&mode=hybrid&sort=relevance&source=all&selected=${encodeURIComponent(String(item.id))}&selected_source=${encodeURIComponent(item.source)}`,
                              );
                            }}
                            className="w-full text-left p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-200/70 last:border-b-0 dark:border-slate-800"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
                                <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.subtitle}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                              {item.snippet}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-muted/10 px-2.5 py-1 text-muted-foreground">
                                  {item.source.replace(/_/g, " ")}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted/10 px-2.5 py-1 text-muted-foreground">
                                  {item.document_type}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted/10 px-2.5 py-1 text-muted-foreground">
                                  {item.access_level}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted/10 px-2.5 py-1 text-muted-foreground">
                                  {formatDate(item.date)}
                                </span>
                              </div>
                              {item.file_url ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                  onClick={(event) => event.stopPropagation()}
                                  onMouseDown={(event) => event.stopPropagation()}
                                >
                                  <a
                                    href={resolveFileUrl(item.file_url) ?? "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={extractFileName(item.file_url)}
                                  >
                                    <Download className="mr-1.5 h-3.5 w-3.5" />
                                    Download
                                  </a>
                                </Button>
                              ) : null}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground">
                        No suggestions found. Press Enter to search the public repository.
                      </div>
                    )}
                  </div>,
                  document.body,
                )}
                
                
              </form>

            </div>

            {/* Dashboard Showcase */}
            <motion.div
              className="mt-20 max-w-5xl mx-auto"
            >
              

              
            </motion.div>
          </div>
        </section>

        {/* Features / Modules Section */}
        <section id="modules" className="py-12 md:py-24 md:px-20 bg-background relative">
          <div className="container mx-auto px-4">
            {/* <RevealOnScroll className="max-w-3xl mx-auto text-center space-y-4 mb-20">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase"
              >
                Modules
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                The Infrastructure for{" "}
                <span className="text-primary">Research & Policy</span>
              </h2>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                A unified ecosystem designed to streamline institutional
                workflows, ensuring transparency, compliance, and impact
                tracking across every stage.
              </p>
            </RevealOnScroll> */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {openGrantCalls.length ? (
                openGrantCalls.slice(0, 4).map((call: any, index: number) => {
                  const theme = grantCallCardThemes[index % grantCallCardThemes.length];

                  return (
                    <RevealOnScroll key={call.id} delay={index * 100}>
                      <div className="group h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500">
                        <div className="h-40 relative overflow-hidden">
                          <Image
                            src={theme.image}
                            alt={call.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
                          <div
                            className={cn(
                              "absolute bottom-4 left-4 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10",
                              theme.bg,
                              theme.color,
                            )}
                          >
                            <theme.icon className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="p-6 space-y-3 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-3">
                            <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                              Open Call
                            </Badge>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {call.status}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {call.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-4">
                            {call.description}
                          </p>

                          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-foreground">Deadline</span>
                              <span>{call.submissionDeadline ? new Date(call.submissionDeadline).toLocaleDateString() : "Soon"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-foreground">Funding</span>
                              <span>
                                {call.budgetRange ? `$${(call.budgetRange.max / 1000).toFixed(0)}k max` : "Available"}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-foreground">Priority</span>
                              <span className="text-right line-clamp-2">
                                {call.priorityAreas?.slice(0, 2).join(", ") || "Grant opportunity"}
                              </span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border/50 mt-auto flex items-center justify-between gap-3">
                            <Link
                              href={`/calls/${call.id}`}
                              className="inline-flex items-center text-xs font-bold text-primary hover:gap-2 transition-all"
                            >
                              View call <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
                            <Button asChild variant="outline" size="sm" className="rounded-full h-9 px-4 text-xs font-bold border-primary/15">
                              <Link href={`/calls/${call.id}`}>Apply now</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </RevealOnScroll>
                  );
                })
              ) : (
                <RevealOnScroll className="sm:col-span-2 lg:col-span-4">
                  <div className="rounded-2xl border border-dashed border-border/70 bg-card px-6 py-12 text-center text-sm text-muted-foreground">
                    No open grant calls are available right now.
                  </div>
                </RevealOnScroll>
              )}
            </div>
          </div>
        </section>

        {/* Feature Spotlight */}
        <section className="py-12 md:py-24 md:px-20 bg-muted/20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <RevealOnScroll className="space-y-8 md:space-y-10">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                    Document Intelligence <br />
                    <span className="text-primary underline decoration-primary/10">
                      Redefined.
                    </span>
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-md">
                    RPDSR maps semantic relationships across your entire
                    institutional memory.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      title: "Smart Search",
                      desc: "Quickly find research papers, policies, guidelines, and related institutional documents through intelligent search.",
                      icon: Network,
                    },
                    {
                      title: "Lifecycle Management",
                      desc: "Manage document submission, review, approval, updates, and archival within a centralized workflow.",
                      icon: Users,
                    },
                    {
                      title: "Secured System",
                      desc: "Protect sensitive research and policy data with role-based access, secure authentication, and controlled permissions.",
                      icon: Lock,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5 group">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                        <item.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-lg font-bold tracking-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="h-14 px-8 rounded-2xl font-bold group shadow-lg active:scale-95 text-sm"
                >
                  Get Started
                  <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </RevealOnScroll>

              <RevealOnScroll
                className="relative lg:rotate-6 lg:hover:rotate-3 transition-all duration-700"
                delay={200}
              >
                <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full -z-10" />
                <div className="rounded-3xl lg:rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl lg:rotate-2 lg:hover:rotate-0 transition-all duration-700 group">
                  <Image
                    src="/psr_spotlight.png"
                    alt="Feature Spotlight"
                    width={1000}
                    height={600}
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* Public Analytics Section */}
        <section id="insights" className="py-12 md:py-20 md:px-20 bg-muted/20 border-y border-border/50">
          <div className="container mx-auto px-4 space-y-6">
            {/* <RevealOnScroll>
              <StatsStrip overview={derivedOverview} />
            </RevealOnScroll> */}

            <RevealOnScroll>
              <TrustBand trust={trustPayload} />
            </RevealOnScroll>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevealOnScroll>
                <TrendsCard data={trendData} title="Monthly proposal submissions" />
              </RevealOnScroll>

              <RevealOnScroll>
                <TrendsCard data={policyTrendData} title="Monthly policy registrations" />
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RevealOnScroll className="lg:col-span-1">
                <div className="bg-card rounded-2xl p-6 h-full border border-border">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">Thematic areas</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Live research domains and their sub-thematics.
                      </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full h-9 px-4 text-xs font-bold">
                      <Link href="/thematic-areas">View all</Link>
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3 max-h-[28rem] overflow-auto pr-1">
                    {loadingThematicAreas || loadingSubThematicAreas ? (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                        Loading thematic areas...
                      </div>
                    ) : thematicAreaPreview.length ? (
                      thematicAreaPreview.map((area: any) => (
                        <div
                          key={area.id}
                          className="rounded-xl border border-border/70 bg-background/60 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground line-clamp-1">
                                {area.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {area.description || "Thematic area"}
                              </p>
                            </div>
                            <Badge variant="secondary" className="w-fit shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                              {area.subAreas?.length ?? 0} sub
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {(area.subAreas ?? []).slice(0, 3).map((sub: any) => (
                              <Badge
                                key={sub.id}
                                variant="outline"
                                className="rounded-full border-border/70 bg-muted/30 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
                              >
                                {sub.name}
                              </Badge>
                            ))}
                            {(area.subAreas?.length ?? 0) > 3 ? (
                              <Badge
                                variant="outline"
                                className="rounded-full border-border/70 bg-muted/30 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
                              >
                                +{area.subAreas.length - 3} more
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                        No thematic areas available right now.
                      </div>
                    )}
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 h-full border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">Active grant calls</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Public opportunities currently open or published.
                      </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full h-9 px-4 text-xs font-bold">
                      <Link href="/calls">View all</Link>
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {openGrantCalls.length ? (
                      openGrantCalls.map((call: any) => (
                        <div
                          key={call.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold">{call.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Closes {call.closeDate ? new Date(call.closeDate).toLocaleDateString() : call.submissionDeadline ? new Date(call.submissionDeadline).toLocaleDateString() : "soon"}
                            </p>
                          </div>
                          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            {call.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                        No open grant calls are published right now.
                      </div>
                    )}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 md:py-24 px-4 md:px-20 container mx-auto">
          <RevealOnScroll className="rounded-3xl md:rounded-[3rem] bg-primary px-6 py-14 md:px-8 md:py-20 text-center text-background relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 h-[400px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="max-w-3xl mx-auto space-y-8 md:space-y-10 relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-none">
                Join the New Standard.
              </h2>
              <p className="text-base md:text-lg opacity-80 leading-relaxed font-medium max-w-xl mx-auto">
                Modernize your institutional infrastructure with RPDMS Global.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto h-14 px-10 text-base font-bold rounded-2xl shadow-xl hover:scale-105 transition-all"
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-10 text-base font-bold rounded-2xl bg-transparent text-background border-background/20 hover:bg-background hover:text-foreground transition-all"
                  asChild
                >
                  <Link href="/contact">Learn More</Link>
                </Button>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
