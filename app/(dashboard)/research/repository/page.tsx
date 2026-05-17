"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Library, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  User, 
  ArrowUpRight, 
  FileText,
  BadgeCheck,
  Globe,
  Tag,
  BookOpen,
  ArrowRight
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const mockLibrary = [
  {
    id: "PUB-2023-001",
    title: "Determinants of Vaccine Hesitancy in Rural Pastoralist Communities: A Multi-Region Analysis",
    author: "Dr. Selamawit Tadesse",
    institution: "Armauer Hansen Research Institute (AHRI)",
    year: "2023",
    department: "Epidemiology",
    area: "Public Health",
    type: "Full Report",
    grade: "Excellent",
    abstract: "This multi-regional investigation uncovers the behavioral, social, and economic barriers driving vaccine hesitancy within rural pastoralist populations in Ethiopia. Through randomized household cluster evaluations across Afar and Somali regions, the study unmasks major trust deficits, supply-chain delivery challenges, and cultural variables, offering operational recommendations to strengthen PHC outreach campaigns.",
    methodology: "Mixed-methods household cluster survey (n=1200) paired with 24 focus group discussions across four key pastoralist zones.",
    impact: "Formally integrated into the Ministry of Health's 2024 pastoralist immunization outreach directive.",
    doi: "https://doi.org/10.1016/j.jedu.2024.12.004",
    citation: "Tadesse, S. (2023). Determinants of Vaccine Hesitancy in Rural Pastoralist Communities: A Multi-Region Analysis. Ethiopian Journal of Public Health, 15(2), 112-124.",
  },
  {
    id: "PUB-2023-042",
    title: "Mapping the Human Resource for Health (HRH) Gaps in Tertiary Hospitals across Ethiopia",
    author: "Prof. Bekele Gizaw",
    institution: "Addis Ababa University",
    year: "2023",
    department: "Health Policy",
    area: "Governance",
    type: "Manuscript",
    grade: "Excellent",
    abstract: "A comprehensive health workforce census tracking specialized doctor-to-bed ratios, nurse attrition rates, and clinical officer allocations across tertiary referral centers. The study demonstrates severe specialist clustering in urban zones and proposes a national incentive framework to facilitate regional workforce distribution.",
    methodology: "Cross-sectional national hospital personnel registry audit combined with qualitative clinical administrative interviews.",
    impact: "Adopted by the Civil Service Commission as a blueprint for specialized healthcare worker regional allowances.",
    doi: "https://doi.org/10.1111/j.healthpolicy.2023.08.012",
    citation: "Gizaw, B. (2023). Mapping the Human Resource for Health (HRH) Gaps in Tertiary Hospitals across Ethiopia. Journal of Health Workforce Management, 8(4), 45-59.",
  },
  {
    id: "PUB-2022-115",
    title: "Efficacy of Community-Led Total Sanitation (CLTS) in reducing Diarrheal diseases in Tigray",
    author: "Mekonen Hailu",
    institution: "Mekelle University",
    year: "2022",
    department: "Environmental Health",
    area: "WASH",
    type: "Full Report",
    grade: "Good",
    abstract: "Evaluating the five-year community-led total sanitation programs across rural woredas in Tigray. The results identify significant reduction parameters in childhood diarrheal rates where CLTS attained verified open-defecation-free (ODF) statuses, validating the low-cost community mobilization approach.",
    methodology: "Retrospective cohort review comparing health clinic pediatric registries between ODF and non-ODF woredas.",
    impact: "Used to secure UNICEF co-financing for expanding community sanitation models in low-resource settings.",
    doi: "https://doi.org/10.1080/wash.2022.09.001",
    citation: "Hailu, M. (2022). Efficacy of Community-Led Total Sanitation (CLTS) in reducing Diarrheal diseases in Tigray. African Journal of Environmental WASH, 19(3), 204-215.",
  },
];

export default function ResearchRepositoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeArea, setActiveArea] = useState<string>("All");

  const filteredLibrary = mockLibrary.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.area.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = activeArea === "All" || item.area === activeArea;

    return matchesSearch && matchesArea;
  });

  const uniqueAreas = ["All", ...Array.from(new Set(mockLibrary.map((item) => item.area)))];

  return (
    <PageContainer
      title="Research Repository"
      description="The official PSR archive of authorized national research findings and policy evidence."
    >
      <div className="space-y-8">
        
        {/* Search & Filtration Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-muted-foreground/10 shadow-sm">
           {/* Integrated Search Input */}
           <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Search research by title, author, or institution..." 
                className="h-10 pl-10 rounded-xl border-muted-foreground/15 bg-slate-50 focus-visible:ring-primary/20 text-sm placeholder:text-muted-foreground/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           {/* Area Filtration Buttons & Counter */}
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                 {uniqueAreas.map((area) => (
                   <button
                     key={area}
                     type="button"
                     onClick={() => setActiveArea(area)}
                     className={cn(
                       "px-4 h-9 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap",
                       activeArea === area
                         ? "bg-primary text-white shadow-sm"
                         : "border border-muted-foreground/10 hover:border-primary/20 hover:bg-slate-50 text-muted-foreground"
                     )}
                   >
                     {area === "All" ? "All Research" : area}
                   </button>
                 ))}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground border-l border-slate-100 pl-4 hidden sm:flex">
                 <Filter className="h-4 w-4" />
                 <span>{filteredLibrary.length} RESULTS</span>
              </div>
           </div>
        </div>

        {/* Repository Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredLibrary.map((item) => (
             <Card 
               key={item.id} 
               className="group border border-muted-foreground/10 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 bg-white overflow-hidden rounded-[1.5rem]"
             >
                <div className="p-6 md:p-8 space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                         <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col items-end">
                         <BadgeCheck className="h-5 w-5 text-emerald-500" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-1">PSR Graded</span>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                         <Tag className="h-3 w-3" />
                         {item.area}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold leading-snug text-slate-900 group-hover:text-primary transition-colors line-clamp-3 min-h-[3.6rem]">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-2">
                         <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase">{item.year}</Badge>
                         <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase">{item.type}</Badge>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-100 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                            {item.author.split(' ').pop()?.[0]}
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.author}</p>
                            <p className="text-[10px] text-muted-foreground font-medium italic truncate">{item.institution}</p>
                         </div>
                      </div>
                      <Button 
                        asChild
                        variant="ghost" 
                        className="w-full h-11 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary font-bold text-xs uppercase tracking-widest group/btn"
                      >
                         <Link href={`/research/repository/${item.id}`}>
                            Explore Research
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                         </Link>
                      </Button>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {filteredLibrary.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed rounded-3xl">
            <Library className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-foreground">No Research Found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your keywords or selected subject categories.</p>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
