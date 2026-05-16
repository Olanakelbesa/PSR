"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  Globe,
  ChevronRight,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Network,
  Cpu,
  Layers,
  MessageSquare,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

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
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 h-20",
          isScrolled
            ? "border-b bg-background/80 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div
              className={cn(
                "rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-300 h-10 w-10",
              )}
            >
              <FileText
                className={cn(
                  "text-primary-foreground transition-all h-5 w-5",
                )}
              />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span
                className={cn(
                  "font-bold tracking-tighter uppercase transition-all text-xl",
                )}
              >
                PSR <span className="text-primary">Global</span>
              </span>
              {!isScrolled && (
                <span className="text-[8px] font-bold text-muted-foreground tracking-[0.2em] uppercase">
                  Intelligence Platform
                </span>
              )}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-muted-foreground/70">
            {["Modules", "Workflow", "Impact", "Support"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex font-bold hover:bg-primary/5 rounded-full px-4 text-sm h-9"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-9 px-6 font-bold shadow-md shadow-primary/10 hover:scale-105 active:scale-95 transition-all text-sm"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden">
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

          <div className="container mx-auto px-4 pt-20 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                Data{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-purple-700 bg-300%  animate-gradient">
                  Driven
                </span>{" "}
                Decision Intelligence.
              </h1>

              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 opacity-90">
                The unified operating system for policy repositories and
                research lifecycle management. Built for institutions that
                prioritize transparency and efficiency.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Button
                  size="lg"
                  className=" text-sm font-bold gap-2 group shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  asChild
                >
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className=" text-sm font-bold gap-2 border-2 hover:bg-muted/50 transition-all backdrop-blur-sm active:scale-95"
                  asChild
                >
                  <Link href="#modules">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Dashboard Showcase */}
            <RevealOnScroll className="mt-20 max-w-5xl mx-auto">
              <div className="relative p-1.5 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-white/5 to-purple-500/20 shadow-xl ring-1 ring-white/10">
                <div className="rounded-[2rem] border-4 border-background bg-card shadow-2xl overflow-hidden aspect-[16/10] relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent z-10 pointer-events-none" />
                  <Image
                    src="/psr_landing_hero.png"
                    alt="PSR Platform Dashboard Preview"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-[20s] ease-linear"
                    priority
                  />
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* Features / Modules Section */}
        <section id="modules" className="p-24 bg-background relative">
          <div className="container mx-auto px-4">
            <RevealOnScroll className="max-w-3xl mx-auto text-center space-y-4 mb-20">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase">
                Modules
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                The Infrastructure for <span className="text-primary">Research & Policy</span>
              </h2>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                A unified ecosystem designed to streamline institutional workflows, ensuring transparency, compliance, and impact tracking across every stage.
              </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Policy Repository",
                  description: "Centralized management of institutional policies with intelligent neural search and versioning.",
                  icon: FileText,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  image: "/workflow_ingestion.png",
                  delay: 0,
                },
                {
                  title: "Research Proposals",
                  description: "Full-lifecycle grant management from call publication to automated funding disbursement.",
                  icon: BarChart3,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                  image: "/workflow_execution.png",
                  delay: 100,
                },
                {
                  title: "Ethics Clearance",
                  description: "Rigorous ethical review workflows with multi-tier approval boards and audit trails.",
                  icon: ShieldCheck,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  image: "/workflow_governance.png",
                  delay: 200,
                },
                {
                  title: "Impact Analysis",
                  description: "AI-driven monitoring of policy implementation and community-wide research outcomes.",
                  icon: Users,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                  image: "/psr_spotlight.png",
                  delay: 300,
                },
              ].map((feature, i) => (
                <RevealOnScroll key={i} delay={feature.delay}>
                  <div className="group h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500">
                    <div className="h-40 relative overflow-hidden">
                      <Image 
                        src={feature.image} 
                        alt={feature.title} 
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                      <div className={cn("absolute bottom-4 left-4 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10", feature.bg, feature.color)}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                        {feature.description}
                      </p>
                      <div className="pt-6 border-t border-border/50">
                        <Link 
                          href="#" 
                          className="inline-flex items-center text-xs font-bold text-primary hover:gap-2 transition-all"
                        >
                          Learn more <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Spotlight */}
        <section className="p-24 bg-muted/20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <RevealOnScroll className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                    Document Intelligence <br />
                    <span className="text-primary underline decoration-primary/10">
                      Redefined.
                    </span>
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-md">
                    PSR Global maps semantic relationships across your entire
                    institutional memory.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      title: "Smart Linking",
                      desc: "Connect related policies and results.",
                      icon: Network,
                    },
                    {
                      title: "Board Portals",
                      desc: "Dedicated interfaces for reviewers.",
                      icon: Users,
                    },
                    {
                      title: "Compliance Guard",
                      desc: "Real-time auditing engine.",
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

              <RevealOnScroll className="relative rotate-6 hover:rotate-3 transition-all duration-700" delay={200}>
                <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full -z-10" />
                <div className="rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700 group">
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

        {/* Impact Section */}
        <section
          id="impact"
          className="p-20 border-y border-white/5 relative bg-primary"
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {[
                { value: "500+", label: "Governments" },
                { value: "1.2k+", label: "Research Centers" },
                { value: "50M", label: "Grants Tracked" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat, i) => (
                <RevealOnScroll key={i} delay={i * 50} className="space-y-2">
                  <p className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
                    {stat.value}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">
                    {stat.label}
                  </p>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="support" className="py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <RevealOnScroll className="text-center space-y-4 mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Support & Governance.
              </h2>
              <p className="text-base text-muted-foreground font-medium max-w-lg mx-auto">
                Everything you need to know about the PSR operating system.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  {
                    q: "What is PSR Global?",
                    a: "An enterprise-grade operating system designed to centralize and analyze institutional memory and grant lifecycles.",
                  },
                  {
                    q: "Is the platform secure?",
                    a: "Yes. We implement bank-grade encryption and zero-trust architecture for every deployment.",
                  },
                  {
                    q: "Does it support grant tracking?",
                    a: "Absolutely. The platform manages the entire lifecycle from initial call to final reporting.",
                  },
                  {
                    q: "Can we use our own reviewers?",
                    a: "Yes. The platform provides dedicated portals for your technical and ethical review boards.",
                  },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-none rounded-2xl bg-muted/20 px-6 py-1 overflow-hidden hover:bg-muted/30 transition-all duration-300"
                  >
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-5 tracking-tight">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground font-medium pb-6 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </RevealOnScroll>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 container mx-auto px-4">
          <RevealOnScroll className="rounded-[3rem] bg-primary px-8 py-20 text-center text-background relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="max-w-3xl mx-auto space-y-10 relative z-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                Join the New Standard.
              </h2>
              <p className="text-base md:text-lg opacity-80 leading-relaxed font-medium max-w-xl mx-auto">
                Modernize your institutional infrastructure with PSR Global.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-10 text-base font-bold rounded-2xl shadow-xl hover:scale-105 transition-all"
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-base font-bold rounded-2xl bg-transparent text-background border-background/20 hover:bg-background hover:text-foreground transition-all"
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
      <footer className="bg-background border-t border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
            <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tighter uppercase">
                  PSR <span className="text-primary">Global</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed font-bold max-w-xs">
                The world's most advanced operating system for policy
                intelligence and research lifecycles.
              </p>
              <div className="flex items-center gap-4">
                {[Globe, Users, Lock, BookOpen].map((Icon, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all duration-300"
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  title: "Platform",
                  links: [
                    "Repository",
                    "Grant Calls",
                    "Review System",
                    "Impact Labs",
                  ],
                },
                {
                  title: "Solutions",
                  links: ["Government", "Education", "Health", "Enterprise"],
                },
                {
                  title: "Resources",
                  links: ["Docs", "Case Studies", "API", "Status"],
                },
                {
                  title: "Company",
                  links: ["About", "Contact", "Privacy", "Audits"],
                },
              ].map((col, i) => (
                <div key={i} className="space-y-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                    {col.title}
                  </h4>
                  <ul className="space-y-4">
                    {col.links.map((link, j) => (
                      <li key={j}>
                        <Link
                          href="#"
                          className="text-xs text-muted-foreground font-bold hover:text-primary transition-all flex items-center group"
                        >
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
            <p>© 2026 PSR Global Intelligence.</p>
            <div className="flex items-center gap-10">
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
