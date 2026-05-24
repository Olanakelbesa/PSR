"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ArrowUp,
  ChevronDown,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  Badge,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
}

const MOCK_EXTERNAL_GRANTS: ExternalGrant[] = [
  {
    id: "ext-01",
    title: "Horizon Europe: Health Systems & Bio-Innovation Grants",
    agency: "European Research Council",
    deadline: "2024-11-30",
    budget: "$2,500,000",
    status: "Active",
    category: "Research & Innovation",
    description: "Funding for breakthrough research projects targeting health system resilience, diagnostic integrations, and clinical care innovations in emerging markets.",
    source_url: "https://ec.europa.eu/info/research-and-innovation_en",
    eligibility: "Accredited academic institutions and consortiums with local regional partners.",
  },
  {
    id: "ext-02",
    title: "Grand Challenges: AI-driven Diagnostics for Community Health Workers",
    agency: "Bill & Melinda Gates Foundation",
    deadline: "2024-09-15",
    budget: "$400,000",
    status: "Active",
    category: "Digital Health",
    description: "Supporting research projects developing and validating low-cost, offline-first artificial intelligence models to assist screening of tuberculosis and malaria.",
    source_url: "https://gcgh.grandchallenges.org",
    eligibility: "Researchers in Low-to-Middle Income Countries (LMICs) with verified institutional backing.",
  },
  {
    id: "ext-03",
    title: "Wellcome Trust: Climate Shifts and Vector-borne Epidemic Dynamics",
    agency: "Wellcome Trust",
    deadline: "2024-10-05",
    budget: "$1,200,000",
    status: "Active",
    category: "Global Health",
    description: "Research grants focused on analyzing geospatial transmission patterns of vector-borne illnesses under fluctuating temperature and humidity conditions.",
    source_url: "https://wellcome.org/grant-funding",
    eligibility: "Multi-disciplinary cohorts covering epidemiology, meteorology, and public health systems.",
  },
  {
    id: "ext-04",
    title: "USAID: Maternal & Neonatal Health Strategic Action Grants",
    agency: "USAID",
    deadline: "2024-08-20",
    budget: "$850,000",
    status: "Active",
    category: "Maternal Health",
    description: "Funding support for regional pilot programs evaluating referral transport systems and maternity waiting home integrations to reduce infant mortality.",
    source_url: "https://www.usaid.gov/grants",
    eligibility: "Public universities and health research bureaus in sub-Saharan African regions.",
  },
  {
    id: "ext-05",
    title: "WHO: Health Finance Reforms Policy Review Scholarships",
    agency: "World Health Organization",
    deadline: "2024-06-01",
    budget: "Competitive",
    status: "Closed",
    category: "Policy Research",
    description: "Evaluative research funding for policy scholars to compile lessons learned from national insurance schemes and decentralized health financing models.",
    source_url: "https://www.who.int/careers/fellowships",
    eligibility: "Post-doctoral health economists and policy analysts.",
  }
];

export default function ExternalGrantsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredGrants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return MOCK_EXTERNAL_GRANTS;
    return MOCK_EXTERNAL_GRANTS.filter(
      (grant) =>
        grant.title.toLowerCase().includes(q) ||
        grant.agency.toLowerCase().includes(q) ||
        grant.description.toLowerCase().includes(q) ||
        grant.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow">
        {/* Hero Section */}
        <section className="relative w-full h-[380px] md:h-[480px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-10 opacity-90" />
          
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
              animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl"
              animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          <Image
            alt="Global Research Network"
            className="absolute inset-0 w-full h-full object-cover opacity-15 z-0 grayscale"
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920"
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
                Global Grant <span className="text-primary">Opportunities</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-slate-350 leading-relaxed mx-auto">
                Discover and apply for international funding schemes, research partnerships, and innovation challenges curated from global donor portals.
              </p>
            </motion.div>
          </div>
        </section>

        {/* List Section */}
        <section ref={sectionRef} className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">Available Grants</h2>
              <span className="text-xs bg-primary/15 text-primary border border-primary/25 font-bold uppercase px-2.5 py-0.5 rounded-md">
                {filteredGrants.length} Found
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* View toggle */}
              <div className="h-10 p-1 bg-muted/20 border border-white/5 rounded-xl flex items-center gap-1">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search agency, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-muted/30 border-white/5 focus-visible:ring-primary rounded-xl"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-24 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground text-sm mt-4 animate-pulse">Syncing donor portals...</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-6",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}
            >
              <AnimatePresence mode="popLayout">
                {filteredGrants.map((grant) => (
                  <motion.div
                    key={grant.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card
                      className={cn(
                        "border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between"
                      )}
                      onClick={() => setExpandedId(expandedId === grant.id ? null : grant.id)}
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <Badge className="bg-primary/5 text-primary border border-primary/20 text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                            {grant.category}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-white/5",
                              grant.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-slate-500/10 text-slate-500"
                            )}
                          >
                            {grant.status}
                          </Badge>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-lg font-bold text-foreground leading-snug hover:text-primary transition-colors">
                            {grant.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {grant.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-y-2 gap-x-6 text-xs text-muted-foreground font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span>{grant.agency}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>Deadline: {grant.deadline}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-primary" />
                            <span>{grant.budget}</span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedId === grant.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden pt-4 border-t border-white/5 space-y-4"
                            >
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Eligibility Criteria</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{grant.eligibility}</p>
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(grant.source_url, "_blank");
                                  }}
                                  className="rounded-xl font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-lg shadow-primary/10"
                                >
                                  Apply on Donor Site
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!isLoading && filteredGrants.length === 0 && (
            <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground">No Opportunities Found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                No external grant directories match your search for "{searchQuery}". Try a different keyword.
              </p>
            </div>
          )}
        </section>
      </main>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-white shadow-lg hover:scale-105 transition-all duration-200 z-50 hover:bg-primary/95"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
