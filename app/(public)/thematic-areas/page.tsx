"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowUp, ChevronDown, BookMarked } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/landing/Footer";
import Image from "next/image";
import { useThematicHierarchical } from "@/lib/queries/thematic-hierarchical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ThematicAreasPage() {
  const [expandedArea, setExpandedArea] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: thematicAreas = [], isLoading, isError, refetch } = useThematicHierarchical({
    page_size: 200,
  });

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return thematicAreas;
    const q = searchQuery.toLowerCase();
    return thematicAreas.filter(
      (area) =>
        area.name.toLowerCase().includes(q) ||
        (area.sub_thematic_areas ?? []).some((s) =>
          s.name.toLowerCase().includes(q),
        ),
    );
  }, [thematicAreas, searchQuery]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow">
        <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 z-10" />
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl"
              animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/20 dark:bg-accent/30 rounded-full blur-3xl"
              animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>
          <Image
            alt="University Campus"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 dark:opacity-20 z-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6WXl7KgjS5FzKpmYyc5yv_CUi46C0c4cWxQ4tMk31YaH2sfw9uP_Dc_2ArDDKYyHYng0EvR8G3UMpZHF_a-2I7KyjNboYFYblse3SenObmVjFifU2t3l1S3Fs9010g1wJgYQQd_YkGn3OLVYyAbmgUAQyt1vfevluODH_QKygfpHYHOfh5HQ24CA3EIk_Cs72A--B_GRDt4nqayh5XOxcUPRlyytJf3TjbEDRQX2sX6JF6nQuGUnpGh89LZZmj8X7cgwhoDYVPLg"
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
              <span className="text-accent">Thematic Areas</span>
            </motion.h1>
            <motion.p
              className="max-w-2xl text-lg text-slate-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Explore our research focus areas and discover opportunities across
              diverse thematic domains. Find research collaborations and
              resources aligned with your interests.
            </motion.p>
          </div>
        </section>

        <section
          ref={sectionRef}
          className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Thematic Research Areas
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Browse priority domains and expand to explore focus areas.
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              Loading thematic areas…
            </div>
          ) : isError ? (
            <div className="py-16 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Unable to load thematic areas.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 max-w-sm">
                <Input
                  type="search"
                  placeholder="Search by name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-6">
                {filteredAreas.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                    {thematicAreas.length === 0
                      ? "No thematic areas available."
                      : "No thematic areas match your search."}
                  </div>
                ) : (
                  filteredAreas.map((area) => {
                    const isExpanded = expandedArea === area.id;
                    const subs = area.sub_thematic_areas ?? [];

                    return (
                      <Card
                        key={area.id}
                        className="border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedArea(isExpanded ? null : area.id)
                          }
                          className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-slate-50 dark:hover:bg-gray-700/40 transition"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-12 bg-primary rounded-lg flex items-center justify-center shadow-md">
                              <BookMarked className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                {area.name}
                              </h3>
                              {subs.length > 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                  {subs.length} sub-thematic
                                  {subs.length !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-accent transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-8">
                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700">
                                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-800/70">
                                      <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                          Sub-Thematic Areas
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-200 dark:divide-slate-700">
                                      {subs.length > 0 ? (
                                        subs.map((sub) => (
                                          <tr
                                            key={sub.id}
                                            className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors"
                                          >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                                              {sub.name}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={1}
                                            className="px-6 py-8 text-center text-sm text-slate-500 italic"
                                          >
                                            No sub-thematic areas listed.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition z-50"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
