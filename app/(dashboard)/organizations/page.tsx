"use client";

import { useState, useMemo } from "react";
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
  Network,
  Loader2,
  AlertCircle
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrganizationsList, useOrganizationTypesList } from "@/hooks/useOrganizations";

const orgTypeIconMap: Record<number, { label: string; icon: any; color: string; bg: string }> = {};

export default function OrganizationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: organizationsResponse, isLoading: orgsLoading, error: orgsError } = useOrganizationsList();
  const { data: typesResponse } = useOrganizationTypesList();

  // Build icon map from types
  const typeMap = useMemo(() => {
    if (!typesResponse?.data) return {};
    const map: Record<number, any> = {};
    typesResponse.data.forEach((type, idx) => {
      const icons = [Gavel, GraduationCap, Network, Globe];
      const colors = ["text-blue-600", "text-indigo-600", "text-amber-600", "text-emerald-600"];
      const bgs = ["bg-blue-50", "bg-indigo-50", "bg-amber-50", "bg-emerald-50"];
      map[type.id] = {
        label: type.name,
        icon: icons[idx % icons.length],
        color: colors[idx % colors.length],
        bg: bgs[idx % bgs.length],
      };
    });
    return map;
  }, [typesResponse?.data]);

  const organizations = organizationsResponse?.data ?? [];
  
  const filteredOrgs = useMemo(() =>
    organizations.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeMap[org.orgType]?.label ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [organizations, searchTerm, typeMap]
  );

  // Count organizations by type
  const typeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    organizations.forEach(org => {
      counts[org.orgType] = (counts[org.orgType] ?? 0) + 1;
    });
    return counts;
  }, [organizations]);

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
           {(typesResponse?.data ?? []).map((type) => {
             const meta = typeMap[type.id];
             const Icon = meta?.icon || Building2;
             const count = typeCounts[type.id] ?? 0;
             return (
               <Card key={type.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white">
                  <CardContent className="p-6">
                     <div className={cn("h-10 w-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", meta?.bg ?? "bg-slate-50")}>
                        <Icon className={cn("h-5 w-5", meta?.color ?? "text-slate-600")} />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{type.name}</p>
                     <p className="text-xl font-black mt-1">{count} <span className="text-[10px] text-muted-foreground font-bold lowercase">Entities</span></p>
                  </CardContent>
               </Card>
             );
           })}
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

        {/* Error State */}
        {orgsError && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <h3 className="font-bold text-red-900">Failed to load organizations</h3>
                <p className="text-sm text-red-800">{(orgsError as Error).message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {orgsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Organizations Grid */}
        {!orgsLoading && filteredOrgs.length === 0 && (
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No organizations found</p>
            </CardContent>
          </Card>
        )}

        {!orgsLoading && filteredOrgs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredOrgs.map((org) => {
               const typeMeta = typeMap[org.orgType];
               const createdDate = new Date(org.createdAt).getFullYear();
               return (
                 <Card key={org.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden rounded-[1.5rem]">
                    <CardHeader className="p-8 pb-0">
                       <div className="flex justify-between items-start">
                          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/10">
                             <Building2 className="h-7 w-7 text-primary" />
                          </div>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-widest">{typeMeta?.label ?? "Unknown"}</Badge>
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
                                <Mail className="h-3 w-3" /> Email
                             </p>
                             <p className="text-[10px] font-bold text-slate-700 truncate">{org.organizationEmail || "—"}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                                <Globe className="h-3 w-3" /> Website
                             </p>
                             <p className="text-[10px] font-bold text-slate-700 truncate">{org.organizationWebsite ? "Linked" : "—"}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Address</p>
                          <p className="text-[10px] text-slate-600">{org.address || "Not specified"}</p>
                       </div>

                       <div className="pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">EST. {createdDate}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 group/btn"
                            onClick={() => router.push(`/organizations/${org.id}`)}
                          >
                             Manage <ChevronRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               );
             })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
