"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowUp,
  Lightbulb,
  Rocket,
  History,
  FileText,
  Handshake,
  Gavel,
  DollarSign,
  Lightbulb as Innovation,
  Users,
  Globe2,
  Scale,
  GraduationCap,
  Cpu,
  Factory,
  BookOpen,
  Handshake as HandshakeIcon,

} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { publicApi } from "@/api/legacy-apis";

export default function AboutPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const visionRef = useRef<HTMLDivElement>(null);
  const prioritiesRef = useRef<HTMLDivElement>(null);
  const achievementsRef = useRef<HTMLDivElement>(null);

  const sectionRefs = useMemo(
    () => ({
      vision: visionRef,
      priorities: prioritiesRef,
      achievements: achievementsRef,
    }),
    [],
  );

  const [overview, setOverview] = useState<any | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({
    vision: false,
    priorities: false,
    achievements: false,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchOverview() {
      setLoadingOverview(true);
      try {
        const res = await publicApi.getOverview();
        let payload = res ?? null;
        if (payload && payload.data !== undefined) payload = payload.data;
        if (payload && payload.data !== undefined) payload = payload.data;
        if (!mounted) return;
        setOverview(payload ?? null);
      } catch (err) {
        if (!mounted) return;
        setOverview(null);
      } finally {
        if (!mounted) return;
        setLoadingOverview(false);
      }
    }

    fetchOverview();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    Object.entries(sectionRefs).forEach(([key, ref]) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [key]: true }));
          }
        },
        { threshold: 0.25 },
      );

      if (ref.current) {
        observer.observe(ref.current);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sectionRefs]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  const metrics = overview?.metrics ?? {};
  const stats = [
    {
      icon: Globe2,
      value: metrics.institutionsUsingSystem ?? 0,
      label: "Total repository files",
      colorClass: "bg-primary/10 text-primary",
    },
    {
      icon: Users,
      value: metrics.researchCenters ?? 0,
      label: "Research Centers",
      colorClass: "bg-primary/10 text-primary",
    },
    {
      icon: FileText,
      value: metrics.publishedPolicies ?? 0,
      label: "Published Policies",
      colorClass: "bg-primary/10 text-primary",
    },
    {
      icon: GraduationCap,
      value: metrics.totalResearchProposalsSubmitted ?? 0,
      label: "Research Proposals Submitted",
      colorClass: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col">
      <main className="grow w-full">
        {/* Hero Section */}
        <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
          {/* Background Image */}
          <Image
            alt="AASTU Campus"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6WXl7KgjS5FzKpmYyc5yv_CUi46C0c4cWxQ4tMk31YaH2sfw9uP_Dc_2ArDDKYyHYng0EvR8G3UMpZHF_a-2I7KyjNboYFYblse3SenObmVjFifU2t3l1S3Fs9010g1wJgYQQd_YkGn3OLVYyAbmgUAQyt1vfevluODH_QKygfpHYHOfh5HQ24CA3EIk_Cs72A--B_GRDt4nqayh5XOxcUPRlyytJf3TjbEDRQX2sX6JF6nQuGUnpGh89LZZmj8X7cgwhoDYVPLg"
            fill
            className="object-cover grayscale opacity-30 dark:opacity-20 z-0"
            priority
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 z-10"></div>

          {/* Animated Blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl"
              animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
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

          {/* Hero Content */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-accent">About Us</span>
            </motion.h1>

            <motion.p
              className="max-w-3xl text-lg text-slate-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              The Research and Policy Document Management System is a centralized platform for managing research and policy documents, streamlining workflows, and supporting evidence-based decision-making across health institutions.
            </motion.p>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section
          ref={sectionRefs.vision}
          className="relative w-full py-16 lg:py-24 overflow-hidden bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-gray-900 dark:via-primary/10 dark:to-accent/10"
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              <div className="lg:col-span-7 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={
                    isVisible.vision
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -30 }
                  }
                  transition={{ duration: 0.6 }}
                >
                  <Card className="group border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8">
                    <CardContent className="relative z-10 p-0">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-white mb-6">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">
                        Our Research and Policy Focus
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        We enable efficient research and policy document management, review workflows, collaboration, and institutional coordination through a unified digital platform aligned with national health and development priorities.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={
                    isVisible.vision
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -30 }
                  }
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="group border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8">
                    <CardContent className="relative z-10 p-0">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-white mb-6">
                        <Rocket className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                      <p className="text-muted-foreground leading-relaxed">
                       To strengthen evidence-based decision-making by streamlining the management, submission, review, approval, and tracking of research and policy documents through a centralized digital Research and Policy Management System.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="lg:col-span-5">
                <motion.h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <History className="w-6 h-6 text-accent" />
                  Institution Journey
                </motion.h3>
                <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-10">
                  {[
                    {
                      year: "2026",
                      title: "Foundation",
                      description:
                        "Established as a centralized digital platform for managing research and policy documents within the Ministry of Health.",
                    },
                    {
                      year: "Growth",
                      title: "Platform Expansion",
                      description:
                        "Expanded capabilities to support research documentation, policy development, review workflows, and institutional knowledge management.",
                    },
                    {
                      year: "Partnerships",
                      title: "Collaborative Reach",
                      description:
                        "Connecting government institutions, healthcare professionals, researchers, and partners through a unified digital management system.",
                    },
                    {
                      year: "Today",
                      title: "Integrated Delivery",
                      description:
                        "Operating as an integrated platform for research and policy document management, collaboration, tracking, and decision support.",
                      present: true,
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="relative"
                      initial={{ opacity: 0, x: 20 }}
                      animate={
                        isVisible.vision
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: 20 }
                      }
                      transition={{ delay: idx * 0.1 }}
                    >
                      <span className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800 ring-4 ring-slate-100 dark:ring-slate-800">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${item.present ? "bg-accent animate-pulse" : "bg-slate-300"}`}
                        ></span>
                      </span>
                      <h4 className="text-lg font-bold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Priorities Section */}
        <section
          ref={sectionRefs.priorities}
          className="relative w-full py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/50"
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={
                isVisible.priorities
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
            >
              <span className="text-accent font-semibold tracking-wider uppercase text-sm">
                Key Focus Areas
              </span>
              <h2 className="text-3xl font-bold mt-2">Pillars of the Research and Policy Document Management System</h2>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate={isVisible.priorities ? "visible" : "hidden"}
            >
              {[
                {
                  icon: BookOpen,
                  title: "Research Management",
                  description:
                    "Streamlining the submission, review, approval, and tracking of research documents across institutions and departments.",
                  colorClass: "bg-accent/10 text-accent",
                },
                {
                  icon: Gavel,
                  title: "Policy Development",
                  description:
                    "Supporting the creation, evaluation, revision, and management of evidence-based health policies and strategic documents.",
                  colorClass: "bg-accent/10 text-accent",
                },
                {
                  icon: Handshake,
                  title: "Knowledge & Document Management",
                  description:
                    "Providing centralized access to research outputs, policy documents, reports, and institutional records for informed decision-making.",
                  colorClass: "bg-accent/10 text-accent",
                },
              ].map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="border-0 shadow-lg h-full p-6 text-center">
                    <div
                      className={`w-14 h-14 rounded-full ${item.colorClass} flex items-center justify-center mx-auto mb-4`}
                    >
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Achievements Section */}
        <section
          ref={sectionRefs.achievements}
          className="relative w-full py-16 lg:py-24"
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={
                isVisible.achievements
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
            >
              <h2 className="text-3xl font-bold">Research and Policy System by the Numbers</h2>
              <p className="mt-4 text-muted-foreground">
               Impactful statistics supporting health research, policy development, institutional collaboration, and evidence-based decision-making.
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={isVisible.achievements ? "visible" : "hidden"}
            >
              {stats.map((stat, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="border-0 shadow-md p-8 text-center hover:shadow-xl transition-shadow">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.colorClass} mb-4`}
                    >
                      <stat.icon className="w-8 h-8" />
                    </div>
                    <div className="text-4xl font-bold mb-1">
                      {loadingOverview ? "--" : stat.value}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground uppercase">
                      {stat.label}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-white shadow-lg z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
