"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  Globe, 
  Users, 
  ChevronRight, 
  ExternalLink,
  Layers,
  LayoutGrid,
  Info,
  Calendar,
  MoreHorizontal,
  Mail,
  GraduationCap,
  Gavel,
  Network
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data based on Organization & Unit models
const mockOrgs = [
  {
    id: "org-1",
    name: "Ministry of Health",
    type: "Government / Regulatory",
    typeCode: "moh",
    description: "The primary regulatory body for healthcare and research in Ethiopia.",
    unitsCount: 14,
    usersCount: 450,
    established: "1948",
    status: "active",
    units: ["Epidemiology Directorate", "Resource Mobilization", "Policy & Planning"]
  },
  {
    id: "org-2",
    name: "Addis Ababa University",
    type: "Academic / Research",
    typeCode: "univ",
    description: "Leading national institution for health sciences and clinical research.",
    unitsCount: 8,
    usersCount: 210,
    established: "1950",
    status: "active",
    units: ["College of Health Sciences", "Tikur Anbessa Hospital", "School of Public Health"]
  },
  {
    id: "org-3",
    name: "Armauer Hansen Research Institute",
    type: "Research Agency",
    typeCode: "agency",
    description: "Specialized laboratory and clinical research hub.",
    unitsCount: 6,
    usersCount: 180,
    established: "1970",
    status: "active",
    units: ["TB Research Unit", "Immunology Lab", "Clinical Trials"]
  },
];

const orgTypes = [
  { label: "Government", icon: Gavel, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Academic", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "NGO / Agency", icon: Network, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "International", icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
];

export default function OrganizationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrgs = mockOrgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.typeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Partner Organizations"
      description="Manage institutional affiliations, research units, and regulatory partners."
      actions={
        <Button 
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-4"
          onClick={() => router.push("/organizations/add")}
        >
           <Plus className="h-4 w-4 mr-2" /> Register Organization
        </Button>
      }
    >
      <div className="space-y-8">
        
        {/* Type Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {orgTypes.map((type, i) => (
             <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white">
                <CardContent className="p-6">
                   <div className={cn("h-10 w-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", type.bg)}>
                      <type.icon className={cn("h-5 w-5", type.color)} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{type.label}</p>
                   <p className="text-xl font-black mt-1">12 <span className="text-[10px] text-muted-foreground font-bold lowercase">Entities</span></p>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search organizations..." 
                className="pl-10 h-11 rounded-xl border-muted bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white border-muted shadow-sm"><LayoutGrid className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white border-muted shadow-sm text-muted-foreground"><Layers className="h-4 w-4" /></Button>
           </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredOrgs.map((org) => (
             <Card key={org.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden rounded-[1.5rem]">
                <CardHeader className="p-8 pb-0">
                   <div className="flex justify-between items-start">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/10">
                         <Building2 className="h-7 w-7 text-primary" />
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-widest">{org.typeCode}</Badge>
                   </div>
                   <div className="pt-6">
                      <h3 className="text-xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">{org.name}</h3>
                      <p className="text-[11px] text-muted-foreground font-medium mt-2 line-clamp-2 leading-relaxed">
                         {org.description}
                      </p>
                   </div>
                </CardHeader>
                
                <CardContent className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                            <Layers className="h-3 w-3" /> Units
                         </p>
                         <p className="text-sm font-black">{org.unitsCount} <span className="text-[10px] text-muted-foreground font-medium">Internal</span></p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-3 w-3" /> Users
                         </p>
                         <p className="text-sm font-black">{org.usersCount} <span className="text-[10px] text-muted-foreground font-medium">Linked</span></p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Primary Research Units</p>
                      <div className="flex flex-wrap gap-1.5">
                         {org.units.map((unit, i) => (
                            <Badge key={i} variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 text-[9px] font-bold px-2 py-0.5">
                               {unit}
                            </Badge>
                         ))}
                      </div>
                   </div>

                   <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">EST. {org.established}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 group/btn"
                        onClick={() => router.push(`/organizations/${org.id}`)}
                      >
                         Manage Org <ChevronRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>
    </PageContainer>
  );
}
