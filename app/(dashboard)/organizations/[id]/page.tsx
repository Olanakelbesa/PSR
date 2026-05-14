"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Layers, 
  Users, 
  Settings2, 
  Search, 
  MoreVertical,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  Activity,
  History,
  LayoutGrid,
  Download
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Mock Detailed Data
const mockOrgDetail = {
  id: "org-1",
  name: "Ministry of Health",
  type: "Government / Regulatory",
  code: "MOH",
  description: "The Ministry of Health is responsible for the overall health policy of Ethiopia, including research governance and public health surveillance.",
  head: "Dr. Lia Tadesse",
  email: "info@moh.gov.et",
  phone: "+251 11 551 7011",
  address: "Sudan Avenue, Addis Ababa",
  established: "1948",
  status: "Active",
  units: [
    { id: "u-1", name: "Epidemiology Directorate", head: "Dr. Abera Molla", staffCount: 45, projects: 12 },
    { id: "u-2", name: "Policy & Planning", head: "W/ro Selamawit", staffCount: 22, projects: 8 },
    { id: "u-3", name: "Resource Mobilization", head: "Ato Bekele", staffCount: 15, projects: 5 },
    { id: "u-4", name: "Digital Health Directorate", head: "Dr. Solomon", staffCount: 30, projects: 15 },
  ],
  recentUsers: [
    { id: "usr-1", name: "Abebe Bikila", email: "a.bikila@moh.gov.et", role: "Researcher", lastActive: "2 hours ago" },
    { id: "usr-2", name: "Tirunesh Dibaba", email: "t.dibaba@moh.gov.et", role: "Officer", lastActive: "5 hours ago" },
  ]
};

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <PageContainer
      title={mockOrgDetail.name}
      description={`Institutional Management — ${mockOrgDetail.type}`}
      actions={
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
           </Button>
           <Button className="bg-primary hover:bg-primary/90 shadow-lg">
              <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
           </Button>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-8">
           
           {/* Info Cards Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                       <Layers className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Units</p>
                       <p className="text-xl font-black">{mockOrgDetail.units.length}</p>
                    </div>
                 </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                       <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Staff</p>
                       <p className="text-xl font-black">112</p>
                    </div>
                 </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                       <Activity className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Projects</p>
                       <p className="text-xl font-black">40</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <Tabs defaultValue="units" className="space-y-6">
              <div className="flex items-center justify-between">
                 <TabsList className="bg-white border p-1 rounded-xl h-11">
                    <TabsTrigger value="units" className="rounded-lg font-bold text-xs uppercase px-6">Management Units</TabsTrigger>
                    <TabsTrigger value="users" className="rounded-lg font-bold text-xs uppercase px-6">Affiliated Users</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-bold text-xs uppercase px-6">Activity Audit</TabsTrigger>
                 </TabsList>
                 <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-9 rounded-xl border-muted font-bold text-[10px] uppercase">
                       <Download className="h-3.5 w-3.5 mr-2" /> Export Data
                    </Button>
                    <Button size="sm" className="h-9 rounded-xl bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase">
                       <Plus className="h-3.5 w-3.5 mr-2" /> Add Unit
                    </Button>
                 </div>
              </div>

              {/* Units Tab Content */}
              <TabsContent value="units" className="m-0 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockOrgDetail.units.map((unit) => (
                       <Card key={unit.id} className="group border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                          <CardContent className="p-6 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                   <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                   <h4 className="text-sm font-black text-slate-800">{unit.name}</h4>
                                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Head: {unit.head}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <p className="text-xs font-black text-primary leading-none">{unit.staffCount}</p>
                                   <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mt-1">Staff</p>
                                </div>
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                         <MoreVertical className="h-4 w-4" />
                                      </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end" className="w-48 shadow-xl border-primary/10 rounded-xl">
                                      <DropdownMenuItem className="cursor-pointer font-bold text-xs"><Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Unit</DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer font-bold text-xs text-rose-600"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Unit</DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                          </CardContent>
                       </Card>
                    ))}
                 </div>
              </TabsContent>

              {/* Users Tab Content */}
              <TabsContent value="users" className="m-0">
                 <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <Table>
                       <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-muted">
                             <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">User</TableHead>
                             <TableHead className="text-[10px] font-black uppercase tracking-widest">System Role</TableHead>
                             <TableHead className="text-[10px] font-black uppercase tracking-widest text-right py-4">Last Active</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {mockOrgDetail.recentUsers.map((user) => (
                             <TableRow key={user.id} className="border-muted hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{user.name[0]}</div>
                                      <div className="flex flex-col">
                                         <span className="text-xs font-black">{user.name}</span>
                                         <span className="text-[10px] text-muted-foreground font-medium">{user.email}</span>
                                      </div>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">{user.role}</Badge>
                                </TableCell>
                                <TableCell className="text-right text-[10px] font-bold text-muted-foreground uppercase">{user.lastActive}</TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>

        {/* Sidebar Context */}
        <aside className="space-y-6">
           <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 p-8 text-white">
                 <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-6 w-6 opacity-80 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Institutional Profile</p>
                 </div>
                 <CardTitle className="text-xl font-black tracking-tight">{mockOrgDetail.code}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contact Information</p>
                       <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                             <Mail className="h-3.5 w-3.5 text-primary" /> {mockOrgDetail.email}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                             <Phone className="h-3.5 w-3.5 text-primary" /> {mockOrgDetail.phone}
                          </div>
                       </div>
                    </div>
                    <div className="space-y-1 pt-4">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Governance Verification</p>
                       <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase">Verified PSR Partner</span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-primary/5 border-dashed border-primary/20">
              <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Organizational Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    This organization is a primary **Policy Developer** and **Funding Authority** within the national health research framework.
                 </p>
              </CardContent>
           </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
