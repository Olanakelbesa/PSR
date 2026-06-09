"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowUp, ChevronDown, BookMarked, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useThematicAreas } from "@/lib/queries/thematic-area";
import { useSubThematicAreas } from "@/lib/queries/sub-thematic-area";

export default function ThematicAreasPage() {
  const [expandedArea, setExpandedArea] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: thematicAreasResponse, isLoading: isLoadingThematicAreas } =
    useThematicAreas();
  const {
    data: subThematicAreasResponse,
    isLoading: isLoadingSubThematicAreas,
  } = useSubThematicAreas({ limit: 200 }); // Grouped by thematic area — 200 covers all sub-areas in practice

  const thematicAreas = useMemo(() => {
    const areas = thematicAreasResponse?.data ?? [];
    const subAreas = subThematicAreasResponse?.data ?? [];

    return areas.map((area) => ({
      ...area,
      sub_thematic_areas: subAreas.filter(
        (sub) => String(sub.thematic_area) === String(area.id),
      ),
    }));
  }, [subThematicAreasResponse?.data, thematicAreasResponse?.data]);

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return thematicAreas;
    const q = searchQuery.toLowerCase();
    return thematicAreas.filter(
      (area) =>
        area.name.toLowerCase().includes(q) ||
        (area.description ?? "").toLowerCase().includes(q) ||
        area.sub_thematic_areas.some(
          (sub) =>
            sub.name.toLowerCase().includes(q) ||
            (sub.description ?? "").toLowerCase().includes(q),
        ),
    );
  }, [searchQuery, thematicAreas]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow">
        {/* Hero Showcase */}
        <section className="relative w-full h-[380px] md:h-[480px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-10 opacity-90" />

          {/* Animated Background Glows */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl"
              animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </div>

          <Image
            alt="University Campus"
            className="absolute inset-0 w-full h-full object-cover opacity-20 z-0 grayscale"
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
                Research <span className="text-primary">Thematic Areas</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-white leading-relaxed mx-auto">
                The Research and Policy Document Management System supports the organization, management, and accessibility of research and policy documents across key health and institutional focus areas.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section
          ref={sectionRef}
          className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Priority Fields
              </h2>
              <p className="text-sm text-muted-foreground">
                Select a category below to explore specific sub-thematics.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search thematic areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-muted/30 border-white/5 focus-visible:ring-primary rounded-xl"
              />
            </div>
          </div>

          {isLoadingThematicAreas || isLoadingSubThematicAreas ? (
            <div className="py-24 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground text-sm mt-4 animate-pulse">
                Loading priority framework...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredAreas.map((area) => {
                  const isExpanded = expandedArea === area.id;

                  return (
                    <motion.div
                      key={area.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedArea(isExpanded ? null : area.id)
                          }
                          className="w-full flex items-start sm:items-center justify-between p-6 text-left hover:bg-white/[0.02] transition"
                        >
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="size-12 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                              <BookMarked className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-foreground">
                                {area.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                                {area.description}
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ml-4 mt-1 sm:mt-0",
                              isExpanded && "rotate-180 text-primary",
                            )}
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
                              <div className="px-6 pb-6 pt-2 border-t border-white/5 ">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {area.sub_thematic_areas.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="p-4 rounded-xl border border-white/[0.03]  hover:bg-white/[0.03] hover:border-primary/10 transition duration-200 flex flex-col justify-between"
                                    >
                                      <div>
                                        <h4 className="text-sm font-bold text-foreground">
                                          {sub.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                          {sub.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
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

              {!isLoadingThematicAreas &&
                !isLoadingSubThematicAreas &&
                filteredAreas.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                    <BookMarked className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      No Results Found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      We couldn't find any thematic areas matching "
                      {searchQuery}". Try a different keyword.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="mt-4 border-white/5 hover:bg-muted"
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
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
