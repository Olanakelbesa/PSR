"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowUp, ChevronDown, BookMarked, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SubThematicArea {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface ThematicArea {
  id: number;
  name: string;
  description: string;
  sub_thematic_areas: SubThematicArea[];
}

const MOCK_THEMATIC_AREAS: ThematicArea[] = [
  {
    id: 1,
    name: "Health Systems & Policy Research",
    description: "Strengthening healthcare governance, health financing, and strategic policy implementation across regional bureaus.",
    sub_thematic_areas: [
      { id: 101, name: "Health Financing Reforms & Community Health Insurance", code: "HSPR-01", description: "Evaluating community-based health insurance schemes." },
      { id: 102, name: "Human Resources for Health Retention Strategies", code: "HSPR-02", description: "Methods to recruit and retain health workers in remote rural regions." },
      { id: 103, name: "Decentralized Healthcare Delivery & Quality Audits", code: "HSPR-03", description: "Measuring efficacy of primary health care devolution." },
      { id: 104, name: "Essential Medicines Supply Chain and Logistics", code: "HSPR-04", description: "AI-driven stockout prevention and cold chain storage solutions." },
    ],
  },
  {
    id: 2,
    name: "Infectious & Communicable Diseases",
    description: "Surveillance, treatment efficacy, and prevention frameworks for major epidemiology challenges.",
    sub_thematic_areas: [
      { id: 201, name: "Epidemiological Surveillance & Early Warning Systems", code: "ICD-01", description: "Predicting outbreaks using meteorological and demographic variables." },
      { id: 202, name: "Malaria Elimination Pathways in High-Transmission Areas", code: "ICD-02", description: "Assessing efficacy of next-generation bed nets and vector control." },
      { id: 203, name: "Tuberculosis Diagnostics and Multi-Drug Resistance Tracking", code: "ICD-03", description: "Evaluating point-of-care rapid molecular diagnosis methods." },
      { id: 204, name: "Socioeconomic and Long-Term Impact of COVID-19", code: "ICD-04", description: "Post-pandemic resilience mapping in community healthcare." },
    ],
  },
  {
    id: 3,
    name: "Non-Communicable Diseases (NCD) Prevention",
    description: "Strategies to address growing metabolic, cardiovascular, oncological, and mental health burdens.",
    sub_thematic_areas: [
      { id: 301, name: "Hypertension & Cardiovascular Intervention Frameworks", code: "NCD-01", description: "Assessing sodium reduction campaigns and rural blood pressure tracking." },
      { id: 302, name: "Oncology Screening Protocols in Primary Care Centers", code: "NCD-02", description: "Deploying low-cost visual inspection (VIA) tools for cervical cancer." },
      { id: 303, name: "Mental Health Integration in District General Clinics", code: "NCD-03", description: "Training nurses in basic psychiatric screening and pharmacotherapy." },
      { id: 304, name: "Pediatric Diabetes Standards of Care and Registry Setup", code: "NCD-04", description: "Setting up national registries for Type 1 Diabetes in youth." },
    ],
  },
  {
    id: 4,
    name: "Digital Health & Clinical Innovation",
    description: "Utilizing modern software engineering, data science, and telemedicine to link healthcare providers.",
    sub_thematic_areas: [
      { id: 401, name: "Electronic Medical Records (EMR) Interoperability Standards", code: "DH-01", description: "Establishing FHIR standards for interoperable patient records." },
      { id: 402, name: "Telehealth Networks for Rural and Remote Consultations", code: "DH-02", description: "Evaluating satellite-linked tele-consults for regional hospitals." },
      { id: 403, name: "Machine Learning & AI-based Diagnostic Assist Tools", code: "DH-03", description: "Deploying cloud-based image analysis for chest X-rays in TB screeners." },
      { id: 404, name: "mHealth Interventions for Adherence Support", code: "DH-04", description: "Text-message programs to improve prenatal appointment compliance." },
    ],
  },
  {
    id: 5,
    name: "Maternal, Neonatal & Child Health (MNCH)",
    description: "Mitigating risks across prenatal, birth, and early childhood lifecycles.",
    sub_thematic_areas: [
      { id: 501, name: "Referral Networks for Obstetric Emergencies", code: "MNCH-01", description: "Improving rural ambulance dispatch and waiting homes for mothers." },
      { id: 502, name: "Neonatal Intensive Care Unit (NICU) Quality Protocols", code: "MNCH-02", description: "Standardizing low-birth-weight incubator care protocols." },
      { id: 503, name: "Nutritional Interventions to Prevent Chronic Stunting", code: "MNCH-03", description: "Evaluating fortified food distributions during pregnancy." },
      { id: 504, name: "GIS Mapping of Child Immunization Gaps", code: "MNCH-04", description: "Using geospatial mapping to locate under-vaccinated communities." },
    ],
  },
];

export default function ThematicAreasPage() {
  const [expandedArea, setExpandedArea] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_THEMATIC_AREAS;
    const q = searchQuery.toLowerCase();
    return MOCK_THEMATIC_AREAS.filter(
      (area) =>
        area.name.toLowerCase().includes(q) ||
        area.description.toLowerCase().includes(q) ||
        area.sub_thematic_areas.some(
          (sub) =>
            sub.name.toLowerCase().includes(q) ||
            sub.code.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

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
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
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
              <p className="max-w-2xl text-base md:text-lg text-slate-350 leading-relaxed mx-auto">
                Explore our research priority domains and discover opportunities aligned with national health initiatives, technological integration, and policy intelligence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section ref={sectionRef} className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Priority Fields</h2>
              <p className="text-sm text-muted-foreground">Select a category below to explore specific sub-thematics.</p>
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

          {isLoading ? (
            <div className="py-24 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground text-sm mt-4 animate-pulse">Loading priority framework...</p>
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
                      <Card className="border border-white/5 bg-slate-900/30 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                        <button
                          type="button"
                          onClick={() => setExpandedArea(isExpanded ? null : area.id)}
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
                              isExpanded && "rotate-180 text-primary"
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
                              <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-slate-950/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {area.sub_thematic_areas.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-primary/10 transition duration-200 flex flex-col justify-between"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                          <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider">
                                            {sub.code}
                                          </span>
                                        </div>
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

              {!isLoading && filteredAreas.length === 0 && (
                <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                  <BookMarked className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-foreground mb-1">No Results Found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We couldn't find any thematic areas matching "{searchQuery}". Try a different keyword.
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
