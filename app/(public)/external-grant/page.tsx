"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ArrowUp,
  ChevronDown,
  Globe,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  Info,
  Tag,
  Users,
  Filter,
  ArrowUpRight,
  LayoutGrid,
  List,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  ExternalGrantItem,
  usePublicExternalGrants,
} from "@/lib/queries/external-grant";

interface ExternalGrant {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  budget: string;
  status: "Active" | "Closed" | "Upcoming";
  category: string;
  description: string;
  source_url: string;
  eligibility: string;
  start_date: string | null;
  end_date: string | null;
}

export default function ExternalGrantsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: apiResponse, isLoading } = usePublicExternalGrants({
    page,
    page_size: pageSize,
  });

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const grants = useMemo(() => {
    if (!apiResponse?.data) return [];

    return apiResponse.data.map((item: ExternalGrantItem) => {
      const output = item.grant_output || "";
      const sourceMatch = output.match(/Source:\s*(https?:\/\/[^\s\n]+)/i);
      const eligibilityMatch = output.match(/Eligibility:\s*([^\n]+)/i);

      let description = output;
      if (sourceMatch) description = description.replace(sourceMatch[0], "");
      if (eligibilityMatch)
        description = description.replace(eligibilityMatch[0], "");
      description = description.replace(/Source:|Eligibility:/gi, "").trim();

      // Determine status
      let status: "Active" | "Closed" | "Upcoming" = "Active";
      if (item.end_date) {
        const deadline = new Date(item.end_date);
        const now = new Date();
        if (deadline < now) {
          status = "Closed";
        }
      }

      const fundingAgent = typeof item.funding_agent === "object" && item.funding_agent !== null ? item.funding_agent : null;
      return {
        id: item.id.toString(),
        title: item.title,
        agency: fundingAgent?.name ?? "",
        deadline: item.end_date || "Rolling",
        budget:
          item.allocated_budget && parseFloat(item.allocated_budget) > 0
            ? `$${parseFloat(item.allocated_budget).toLocaleString()}`
            : "Competitive",
        status,
        category: "Research & Innovation",
        description: description || "No description available.",
        source_url: fundingAgent?.website ?? sourceMatch?.[1] ?? "#",
        eligibility: eligibilityMatch
          ? eligibilityMatch[1].trim()
          : "See description for details",
        start_date: item.start_date,
        end_date: item.end_date,
      } as ExternalGrant;
    });
  }, [apiResponse]);

  const filteredGrants = useMemo(() => {
    return grants.filter(
      (grant) =>
        grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grant.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grant.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [grants, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow">
        {/* Hero Section */}
        <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 z-10"></div>

          {/* Animated Background Blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            ></motion.div>
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/20 dark:bg-accent/30 rounded-full blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, 40, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            ></motion.div>
          </div>

          <Image
            alt="Global Research Network"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 dark:opacity-20 z-0"
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920"
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
              <span className="text-accent">Global Opportunities</span>
            </motion.h1>

            <motion.p
              className="max-w-2xl text-lg text-slate-300 leading-relaxed mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Discover and apply for international research funding,
              fellowships, and innovation challenges from global partners and
              organizations.
            </motion.p>

            {/* Search Bar in Hero */}
            <motion.div
              className="w-full max-w-2xl relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Search className="w-5 h-5 text-accent" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, funder, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* LIST SECTION */}
        <section
          ref={sectionRef}
          className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8"
        >
          {/* View Toggle and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mr-4">
                Available Opportunities
              </h2>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-none"
              >
                {filteredGrants.length} Calls
              </Badge>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="h-12 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center gap-1">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1",
            )}
          >
            {isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-slate-500 animate-pulse font-medium">
                  Fetching latest opportunities...
                </p>
              </div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {filteredGrants.map((grant) => (
                    <motion.div
                      layout
                      key={grant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={cn(
                          "group border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 rounded-3xl overflow-hidden cursor-pointer",
                          expandedId === grant.id && "ring-2 ring-primary/20",
                        )}
                        onClick={() =>
                          setExpandedId(
                            expandedId === grant.id ? null : grant.id,
                          )
                        }
                      >
                        <CardContent className="p-0">
                          <div
                            className={cn(
                              "p-6 sm:p-8 flex flex-col gap-6",
                              viewMode === "list" &&
                                "lg:flex-row lg:items-center",
                            )}
                          >
                            <div className="flex-1 space-y-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/5 text-primary border-primary/10 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold"
                                >
                                  {grant.category}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border-none",
                                    grant.status === "Active"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : grant.status === "Upcoming"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full mr-2 inline-block animate-pulse",
                                      grant.status === "Active"
                                        ? "bg-emerald-500"
                                        : grant.status === "Upcoming"
                                          ? "bg-blue-500"
                                          : "bg-slate-500",
                                    )}
                                  />
                                  {grant.status}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                  {grant.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed max-w-3xl">
                                  {grant.description}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-y-3 gap-x-8 pt-2">
                                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <span className="truncate max-w-[200px]">
                                    {grant.agency}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Calendar className="w-4 h-4" />
                                  </div>
                                  {grant.deadline}
                                </div>
                                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <DollarSign className="w-4 h-4" />
                                  </div>
                                  {grant.budget}
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "flex items-center gap-4 shrink-0",
                                viewMode === "list"
                                  ? "lg:flex-col lg:justify-center lg:items-end lg:min-w-[180px]"
                                  : "justify-between pt-4 border-t border-slate-100 dark:border-slate-700",
                              )}
                            >
                              <Button
                                variant="default"
                                className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 transition-all active:scale-95 z-10 w-full sm:w-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(grant.source_url, "_blank");
                                }}
                              >
                                Apply Now
                                <ArrowUpRight className="w-4 h-4 ml-2" />
                              </Button>

                              <Button
                                variant="ghost"
                                className="rounded-2xl h-12 px-4 text-slate-500 hover:text-primary hover:bg-primary/5 transition-all font-bold text-xs uppercase tracking-widest"
                              >
                                {expandedId === grant.id ? "Close" : "Details"}
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 ml-2 transition-transform duration-300",
                                    expandedId === grant.id && "rotate-180",
                                  )}
                                />
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedId === grant.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20"
                              >
                                <div className="p-8 space-y-8">
                                  <div className={cn("grid grid-cols-1 gap-8")}>
                                    <div className="space-y-4">
                                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                        Call Overview
                                      </h4>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                        {grant.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                    <Button
                                      variant="link"
                                      className="text-primary p-0 h-auto font-bold hover:no-underline group text-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(grant.source_url, "_blank");
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4" />
                                        Visit Official Grant Portal
                                        <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                      </div>
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Pagination Controls */}
                {apiResponse?.meta && apiResponse.meta.pages > 1 && (
                  <div className="col-span-full flex items-center justify-between bg-white dark:bg-slate-800/50 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mt-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Showing{" "}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {(page - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {Math.min(page * pageSize, apiResponse.meta.count)}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {apiResponse.meta.count}
                      </span>{" "}
                      results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg h-10 w-10"
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          sectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: apiResponse.meta.pages },
                          (_, i) => i + 1,
                        )
                          .filter(
                            (p) =>
                              p === 1 ||
                              p === apiResponse.meta.pages ||
                              (p >= page - 1 && p <= page + 1),
                          )
                          .map((p, i, arr) => (
                            <div key={p} className="flex items-center">
                              {i > 0 && arr[i - 1] !== p - 1 && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <Button
                                variant={page === p ? "default" : "ghost"}
                                className={cn(
                                  "h-10 w-10 rounded-lg font-bold",
                                  page === p
                                    ? "bg-primary text-white"
                                    : "text-slate-600 dark:text-slate-400",
                                )}
                                onClick={() => {
                                  setPage(p);
                                  sectionRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                  });
                                }}
                              >
                                {p}
                              </Button>
                            </div>
                          ))}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg h-10 w-10"
                        onClick={() => {
                          setPage((p) =>
                            Math.min(apiResponse.meta.pages, p + 1),
                          );
                          sectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }}
                        disabled={page === apiResponse.meta.pages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isLoading && filteredGrants.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700"
              >
                <div className="size-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  We couldn&apos;t find any grants matching your search
                  criteria. Try adjusting your keywords.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-lg"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition z-50"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
