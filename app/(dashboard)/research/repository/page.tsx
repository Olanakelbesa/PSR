"use client";

import { useState } from "react";
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

const mockLibrary = [
  {
    id: "PUB-2023-001",
    title: "Determinants of Vaccine Hesitancy in Rural Pastoralist Communities: A Multi-Region Analysis",
    author: "Dr. Selamawit Tadesse",
    institution: "Armauer Hansen Research Institute (AHRI)",
    year: "2023",
    department: "Epidemiology",
    area: "Public Health",
    type: "Full Report",
    grade: "Good",
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
    grade: "Good",
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
  },
];

export default function ResearchRepositoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <PageContainer
      title="Research Repository"
      description="The official PSR archive of authorized national research findings and policy evidence."
    >
      <div className="space-y-8">
        
        {/* Search & Hero Section */}
        <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 text-white p-12 shadow-2xl">
           <div className="absolute top-0 right-0 p-20 opacity-5">
              <Library className="h-64 w-64" />
           </div>
           <div className="relative z-10 max-w-2xl space-y-6">
              <Badge className="bg-emerald-500 text-white border-none font-black px-3 py-1">AUTHORIZED ARCHIVE</Badge>
              <h2 className="text-4xl font-black tracking-tight leading-tight">Explore the National Evidence Base</h2>
              <p className="text-slate-300 text-lg font-medium">Access over 450 peer-reviewed research portfolios funded by the PSR and our institutional partners.</p>
              <div className="relative pt-4">
                 <Search className="absolute left-4 top-[26px] h-5 w-5 text-slate-400" />
                 <Input 
                   placeholder="Search by title, author, keywords, or institution..." 
                   className="h-16 pl-12 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg focus-visible:ring-emerald-500"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <Badge variant="secondary" className="bg-primary text-white font-black px-4 h-9 cursor-pointer">All Research</Badge>
              <Badge variant="outline" className="px-4 h-9 border-muted hover:bg-muted font-bold cursor-pointer transition-colors">By Year</Badge>
              <Badge variant="outline" className="px-4 h-9 border-muted hover:bg-muted font-bold cursor-pointer transition-colors">By Institution</Badge>
              <Badge variant="outline" className="px-4 h-9 border-muted hover:bg-muted font-bold cursor-pointer transition-colors">By Topic</Badge>
           </div>
           <div className="md:ml-auto flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>SHOWING {mockLibrary.length} AUTHORIZED RESULTS</span>
           </div>
        </div>

        {/* Repository Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {mockLibrary.map((item) => (
             <Card key={item.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden rounded-[1.5rem]">
                <div className="p-8 space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                         <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col items-end">
                         <BadgeCheck className="h-5 w-5 text-emerald-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">PSR Graded</span>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary/70 uppercase tracking-widest">
                         <Tag className="h-3 w-3" />
                         {item.area}
                      </div>
                      <h3 className="text-xl font-black leading-tight text-slate-900 group-hover:text-primary transition-colors line-clamp-3">
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
                         <div>
                            <p className="text-xs font-black text-slate-900">{item.author}</p>
                            <p className="text-[10px] text-muted-foreground font-medium italic">{item.institution}</p>
                         </div>
                      </div>
                      <Button variant="ghost" className="w-full h-11 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary font-black text-xs uppercase tracking-widest group/btn">
                         Explore Research
                         <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                   </div>
                </div>
             </Card>
           ))}
        </div>
      </div>
    </PageContainer>
  );
}
