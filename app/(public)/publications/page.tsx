"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Globe,
  Lock,
  Search,
  Shield,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { usePolicyRepository, type PolicyRepositoryItem } from "@/lib/queries/policy-repository";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";

const PAGE_SIZE = 100;

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? dateValue : parsed.toLocaleDateString();
}

function getAccessIcon(accessLevel?: string) {
  return accessLevel === "restricted" ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
}

function getAccessBadgeClass(accessLevel?: string) {
  return accessLevel === "restricted"
    ? "bg-red-500/10 text-red-500 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
}

function getStatusBadgeClass(status?: string) {
  return status === "Published"
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

function buildCategories(items: PolicyRepositoryItem[]) {
  return ["All", ...Array.from(new Set(items.map((item) => item.docType).filter(Boolean)))];
}

export default function PublicPublicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeSearch = searchParams.get("search") ?? "";
  const routeSelected = searchParams.get("selected") ?? null;
  const [searchQuery, setSearchQuery] = useState(routeSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(routeSearch);
  }, [routeSearch]);

  const { data, isLoading, isError } = usePolicyRepository({
    access_level: "public",
    search: routeSearch,
    limit: PAGE_SIZE,
    ordering: sortBy === "newest" ? "-effective_date" : "effective_date",
  });

  const policies = data?.data ?? [];
  const categories = useMemo(() => buildCategories(policies), [policies]);

  const filteredPublications = useMemo(() => {
    let result = policies;

    // Filter by Category
    if (categoryFilter !== "All") {
      result = result.filter((pub) => pub.docType === categoryFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (pub) =>
          pub.draftPolicy.toLowerCase().includes(q) ||
          pub.docType.toLowerCase().includes(q) ||
          pub.organizationName.toLowerCase().includes(q) ||
          pub.serialNumber.toLowerCase().includes(q) ||
          pub.versionCode.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const left = new Date(a.effectiveDate).getTime();
      const right = new Date(b.effectiveDate).getTime();
      return sortBy === "newest" ? right - left : left - right;
    });

    return result;
  }, [policies, searchQuery, categoryFilter, sortBy]);

  // If the route includes `selected`, expand that item once the data is available.
  useEffect(() => {
    if (!routeSelected) return;
    // Wait until policies are loaded
    if (!data) return;

    const exists = policies.find((p) => String(p.id) === String(routeSelected));
    if (exists) {
      setExpandedId(String(routeSelected));
      // Scroll the item into view after a short delay to allow layout to settle
      setTimeout(() => {
        const el = document.getElementById(`pub-${routeSelected}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  }, [routeSelected, data]);

  const handleDownload = (pub: PolicyRepositoryItem) => {
    setDownloadingId(String(pub.id));
    window.setTimeout(() => {
      setDownloadingId(null);
    }, 800);
  };

  const stats = useMemo(() => {
    const published = policies.filter((item) => item.status === "Published").length;
    const organizations = new Set(policies.map((item) => item.organizationName)).size;
    const types = new Set(policies.map((item) => item.docType)).size;

    return {
      total: policies.length,
      published,
      organizations,
      types,
    };
  }, [policies]);

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
                Publications & <span className="text-primary">Policy Repository</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-white leading-relaxed mx-auto">
                A centralized repository for accessing research publications, policy documents, reports, guidelines, and institutional resources.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col gap-8">

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "Public Records", value: stats.total, icon: Globe },
                { label: "Published", value: stats.published, icon: Shield },
                { label: "Organizations", value: stats.organizations, icon: Building2 },
                { label: "Document Types", value: stats.types, icon: FileText },
              ].map((stat) => (
                <Card key={stat.label} className="border border-white/5 backdrop-blur-md rounded-2xl">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{stat.value}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Filter and Sorting Header */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
              {/* Category tags */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
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

                <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const query = searchQuery.trim();
                  router.push(`/publications?search=${encodeURIComponent(query)}`);
                }}
                className="relative w-full sm:w-64 group"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search titles, serials, organizations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setExpandedId(null);
                  }}
                  className="pl-9 h-10 bg-muted/30 border-white/5 focus-visible:ring-primary rounded-xl"
                />
              </form>
              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground text-sm mt-4">Indexing publication database...</p>
              </div>
            ) : isError ? (
              <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground">Unable to load the repository</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                  The public policy repository could not be loaded right now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredPublications.map((pub) => {
                    const isExpanded = expandedId === String(pub.id);
                    return (
                      <motion.div
                        id={`pub-${pub.id}`}
                        key={pub.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : String(pub.id))}
                            className="w-full text-left p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.01] transition"
                          >
                            <div className="space-y-2 flex-grow">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                                  {pub.docType}
                                </Badge>
                                <Badge className={`border text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${getAccessBadgeClass(pub.accessLevel)}`}>
                                  {pub.accessLevel}
                                </Badge>
                                <Badge className={`border text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${getStatusBadgeClass(pub.status)}`}>
                                  {pub.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(pub.effectiveDate)}
                                </span>
                              </div>
                              <h3 className="text-base md:text-lg font-bold text-foreground leading-snug">
                                {pub.draftPolicy}
                              </h3>
                              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="line-clamp-1">{pub.organizationName}</span>
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
                                        Registry Summary
                                      </h4>
                                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                        {pub.draftPolicy} is registered under serial {pub.serialNumber} with version {pub.versionCode}.
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Draft Policy ID</p>
                                      <p className="mt-1 font-semibold text-foreground">{pub.draftPolicyId}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Effective Date</p>
                                      <p className="mt-1 font-semibold text-foreground">{formatDate(pub.effectiveDate)}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organization</p>
                                      <p className="mt-1 font-semibold text-foreground">{pub.organizationName}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access</p>
                                      <p className="mt-1 font-semibold text-foreground">{pub.accessLevel}</p>
                                    </div>
                                  </div>

                                  {/* Action */}
                                  <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <Button
                                      asChild
                                      disabled={downloadingId !== null}
                                      className="rounded-xl font-bold text-xs tracking-wider uppercase h-10 px-6 gap-2"
                                    >
                                      <a
                                        href={resolveFileUrl(pub.draftFile) ?? "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={extractFileName(pub.draftFile)}
                                        onClick={() => handleDownload(pub)}
                                      >
                                        {downloadingId === String(pub.id) ? (
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
                                      </a>
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
