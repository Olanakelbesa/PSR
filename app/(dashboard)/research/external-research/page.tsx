"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  BookOpen, 
  Globe, 
  Building2, 
  Database, 
  FileText, 
  ArrowUpRight,
  Search,
  Users,
  Layers,
  Plus,
  Scale,
  Calendar,
  CheckCircle2,
  XCircle,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const mockExternalResearch = [
  {
    id: "EXT-2024-001",
    title: "Global Trends in Antimicrobial Resistance: Implications for Sub-Saharan Africa",
    authors: "Smith et al.",
    institution: "World Health Organization",
    year: "2024",
    type: "Review Article",
    grade: "good",
    keywords: ["AMR", "Policy", "Global Health"]
  },
  {
    id: "EXT-2023-089",
    title: "Impact of Urbanization on NCD Prevalence in Rapidly Developing Cities",
    authors: "Chen, J., & Patel, R.",
    institution: "Johns Hopkins University",
    year: "2023",
    type: "Study Report",
    grade: "good",
    keywords: ["NCD", "Urban Health", "Prevention"]
  },
  {
    id: "EXT-2022-045",
    title: "Evaluation of Small-Scale Agricultural Interventions on Nutritional Outcomes",
    authors: "Anonymous",
    institution: "Regional Agricultural Board",
    year: "2022",
    type: "Field Report",
    grade: "bad",
    keywords: ["Nutrition", "Agriculture"]
  }
];

export default function ExternalResearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    {
      title: "Global Health Repositories",
      description: "Access international health data and research findings.",
      resources: [
        { name: "WHO Global Health Observatory", type: "Database", url: "https://www.who.int/data/gho" },
        { name: "Global Burden of Disease (IHME)", type: "Statistics", url: "https://www.healthdata.org/gbd" },
      ]
    },
    {
      title: "National Research Partners",
      description: "Local institutions and regulatory research bodies.",
      resources: [
        { name: "Ethiopian Public Health Institute", type: "National", url: "https://www.ephi.gov.et" },
        { name: "AAU Institutional Repository", type: "Academic", url: "http://etd.aau.edu.et" },
      ]
    }
  ];

  return (
    <PageContainer
      title="External Research"
      description="Curated international findings and external repository access for evidence-based policy making."
      actions={
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => router.push("/research/external-research/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Research Entry
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Search and Quick Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search title, authors or keywords..." 
              className="pl-10 h-10 border-primary/10 shadow-sm focus-visible:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 cursor-pointer">Step 12 Graded</Badge>
          </div>
        </div>

        {/* Manually Ingested External Research List */}
        <div className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Ingested Research Findings</h3>
           {mockExternalResearch.map((item) => (
             <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
                <CardContent className="p-0">
                   <div className="flex flex-col md:flex-row items-stretch">
                      <div className={cn("w-1.5", item.grade === 'good' ? "bg-emerald-500" : "bg-rose-500")} />
                      <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                               <Badge variant="outline" className="text-[9px] font-black tracking-tighter uppercase px-1.5 py-0">{item.type}</Badge>
                               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.year}</span>
                            </div>
                            <h4 className="text-sm font-black leading-tight text-slate-800">{item.title}</h4>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                               <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {item.authors}</span>
                               <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {item.institution}</span>
                            </div>
                         </div>

                         <div className="flex items-center gap-6 shrink-0">
                            <div className="flex flex-col items-center gap-1 min-w-[100px]">
                               {item.grade === 'good' ? (
                                 <>
                                   <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Evidence: Good</span>
                                 </>
                               ) : (
                                 <>
                                   <XCircle className="h-4 w-4 text-rose-500" />
                                   <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Evidence: Poor</span>
                                 </>
                               )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5 text-primary">
                               <Download className="h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Global Repositories Grid */}
        <div className="pt-8">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Global & National Partners</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, idx) => (
              <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {idx === 0 ? <Globe className="h-5 w-5 text-blue-600" /> : <Building2 className="h-5 w-5 text-amber-600" />}
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {category.resources.map((resource, rIdx) => (
                    <a 
                      key={rIdx} 
                      href={resource.url}
                      target="_blank"
                      className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all group/item"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold group-hover/item:text-primary transition-colors">{resource.name}</span>
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{resource.type}</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover/item:text-primary transition-all" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
