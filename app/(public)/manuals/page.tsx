"use client";

import { useState, useMemo, useEffect } from "react";
import { BookOpen, Download, Search, ChevronDown, Award, Users, BookOpen as BookIcon, ShieldCheck, HelpCircle, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface DocSection {
  id: string;
  title: string;
  category: "Researcher Guide" | "Reviewer Guide" | "Administrator Guide";
  description: string;
  steps: string[];
  tips?: string;
}

const DOCUMENTATION_SECTIONS: DocSection[] = [
  {
    id: "res-01",
    category: "Researcher Guide",
    title: "1. Drafting and Submitting Concept Notes",
    description: "Learn how to register and pitch your initial research project concept for institutional evaluation.",
    steps: [
      "Navigate to the dashboard and log in with your Researcher account credentials.",
      "Click on 'Concept Notes' from the primary sidebar and select 'Create New Concept Note'.",
      "Select the appropriate Research Call from the active calls list to automatically link the priority framework.",
      "Complete the Title, Rationale, and Methodology fields. Ensure you select the relevant Sub-Thematic Area.",
      "Upload your preliminary project timeline (PDF) and click 'Submit'. Your note status will update to 'Submitted'."
    ],
    tips: "Keep your concept note concise. Focus on the core policy impact and feasibility within the requested budget range."
  },
  {
    id: "res-02",
    category: "Researcher Guide",
    title: "2. Formulating Full Research Proposals",
    description: "Once your Concept Note is approved, compile the comprehensive research budget and milestones.",
    steps: [
      "Access your dashboard under 'Approved Concept Notes' and click 'Proceed to Full Proposal'.",
      "Draft the detailed Literature Review and Research Methodology sections.",
      "Under the 'Budget and Milestones' tab, divide your budget into installments (e.g. Inception, Mid-Term, Draft, Final Report).",
      "Provide bank information and legal letters for co-investigators if applicable.",
      "Attach research ethics clearance forms and click 'Submit Proposal' to initiate formal peer review."
    ],
    tips: "Ensure that each milestone cost matches the institutional standard rates guide available in the Attachments catalog."
  },
  {
    id: "rev-01",
    category: "Reviewer Guide",
    title: "1. Accessing and Auditing Assigned Proposals",
    description: "A step-by-step walkthrough for evaluating research proposals assigned to your domain.",
    steps: [
      "Log in as a Reviewer and click 'Assigned Reviews' on your portal homepage.",
      "Click 'Open Proposal' to review the submitted abstract, methodology, and co-investigator credentials.",
      "Download any supporting attachments directly from the document sidebar.",
      "Use the evaluation rubric to assign grades (1 to 5) across Scientific Merit, Policy Relevance, and Financial Feasibility."
    ],
    tips: "Save draft comments if you need to double-check details before finalizing your evaluation. Comments cannot be edited after final submission."
  },
  {
    id: "rev-02",
    category: "Reviewer Guide",
    title: "2. Submitting Feedback and Funding Recommendations",
    description: "Submit your final scores and decide whether to recommend funding, revisions, or rejection.",
    steps: [
      "Provide a detailed rationale in the 'Review Comments' textbox outlining specific revisions required.",
      "Select one of the recommendation states: Approved, Minor Revisions, Major Revisions, or Rejected.",
      "Click 'Submit Evaluation' to push the proposal back to the PSR Officer review queue."
    ]
  },
  {
    id: "adm-01",
    category: "Administrator Guide",
    title: "1. Orchestrating Active Research Grant Calls",
    description: "Guidelines for Administrators and PSR Officers to set up new institutional funding rounds.",
    steps: [
      "Log in as an Administrator/PSR Officer and navigate to 'Grant Management' > 'Create Grant Call'.",
      "Define the Call Title, Category (e.g., Strategic, Specialized, Thematic), and Description.",
      "Specify key dates: Open Date, Submission Deadline, and Review Completion Date.",
      "Add priority research thematic areas and detail eligibility rules.",
      "Click 'Publish Call' to immediately display it in the public index and open the portal for researcher submissions."
    ]
  },
  {
    id: "adm-02",
    category: "Administrator Guide",
    title: "2. User Registration and Verification Audits",
    description: "Learn how to review, approve, and verify new users registered on the platform.",
    steps: [
      "Go to the 'User Directory' section of the Admin Dashboard.",
      "Filter by 'Pending Verification' to view newly registered accounts.",
      "Inspect uploaded institutional IDs and professional profiles.",
      "Toggle status from 'Inactive' to 'Active' to allow researchers to submit proposals."
    ],
    tips: "Always check that the user's registered institution matches the official list of authorized universities."
  }
];

export default function ManualsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>("res-01");
  const [downloading, setDownloading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredDoc = useMemo(() => {
    let result = DOCUMENTATION_SECTIONS;

    if (selectedCategory !== "All") {
      result = result.filter((doc) => doc.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          doc.steps.some((step) => step.toLowerCase().includes(q))
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Trigger small mock file download representing the guide book
      const element = document.createElement("a");
      const file = new Blob(["RPDMS Full System Documentation Guide Book (PDF Mock)"], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = "PSR_Platform_User_Manual.pdf";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Researcher Guide":
        return <BookIcon className="w-4 h-4" />;
      case "Reviewer Guide":
        return <Award className="w-4 h-4" />;
      default:
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full">
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
            alt="Library interior"
            className="absolute inset-0 w-full h-full object-cover opacity-15 z-0 grayscale"
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1920"
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
                User Manuals & <span className="text-primary">Guides</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-slate-350 leading-relaxed mx-auto">
                Comprehensive step-by-step guides, walkthroughs, and tip sheets to master proposal drafting, reviews, and administration.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Sidebar - Navigation & Search */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              <Card className="border border-white/5 bg-slate-900/30 p-6 rounded-2xl space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Search Guides</h3>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setExpandedId(null);
                      }}
                      className="pl-9 h-10 bg-muted/20 border-white/5 focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Select Profile</h3>
                  <div className="flex flex-col gap-1">
                    {["All", "Researcher Guide", "Reviewer Guide", "Administrator Guide"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setExpandedId(null);
                        }}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                          selectedCategory === cat
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "hover:bg-white/[0.03] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {getCategoryIcon(cat === "All" ? "Researcher Guide" : cat)}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Need Offline Copy?</h4>
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full rounded-xl text-xs font-bold flex items-center justify-center gap-2 h-10"
                  >
                    {downloading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Manual PDF
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Content - Documentation Cards */}
            <div className="flex-grow space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredDoc.map((doc) => {
                  const isExpanded = expandedId === doc.id;
                  
                  return (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card className="border border-white/5 bg-slate-900/30 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                          className="w-full flex items-start justify-between p-6 text-left hover:bg-white/[0.01] transition"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary/5 text-primary border border-primary/20 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded">
                                {doc.category}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-bold text-foreground leading-snug">
                              {doc.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {doc.description}
                            </p>
                          </div>
                          
                          <ChevronDown
                            className={`w-5 h-5 text-muted-foreground shrink-0 ml-4 transition-transform duration-300 ${
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
                              <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-slate-950/20 space-y-6">
                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                                    Step-by-Step Procedure
                                  </h4>
                                  <ol className="space-y-3">
                                    {doc.steps.map((step, idx) => (
                                      <li key={idx} className="flex gap-3 text-xs md:text-sm leading-relaxed text-muted-foreground">
                                        <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                          {idx + 1}
                                        </span>
                                        <span className="pt-0.5">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {doc.tips && (
                                  <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex items-start gap-3">
                                    <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                      <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Quick Pro-Tip</h5>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {doc.tips}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredDoc.length === 0 && (
                <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-bold text-foreground">No Help Articles Found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    No documentation pages match your search for "{searchQuery}". Try select a different user role or keyphrase.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="mt-4 border-white/5"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

          </div>
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
