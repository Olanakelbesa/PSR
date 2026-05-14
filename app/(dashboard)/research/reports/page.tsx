"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  MessageSquare,
  FileText,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { monitoringApi } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const reportStatuses = {
  pending_review: { label: "Pending Review", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  revision_requested: { label: "Revision Requested", color: "text-rose-600", bg: "bg-rose-100", icon: AlertCircle },
  approved: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle2 },
};

export default function FinalReportsDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      // Mocking the reports list based on monitoring projects that have submitted
      const response = await monitoringApi.getProjects();
      if (response && response.data) {
        // Map projects to a "Reports" view for this dashboard
        const reportsList = response.data.map((p: any, idx: number) => ({
          id: `rep-${p.id}`,
          projectId: p.id,
          title: p.proposal.title,
          pi: `${p.proposal.principalInvestigator.firstName} ${p.proposal.principalInvestigator.lastName}`,
          institution: p.proposal.institution,
          submissionDate: new Date().toLocaleDateString(),
          status: idx === 0 ? "pending_review" : idx === 1 ? "revision_requested" : "approved",
          grade: idx === 2 ? 88 : null
        }));
        setReports(reportsList);
      }
      setIsLoading(false);
    }
    loadReports();
  }, []);

  return (
    <PageContainer
      title="Final Research Reports"
      description="Manage Step 12 administrative reviews, technical grading, and final approvals."
    >
      <div className="space-y-8">
        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { label: "Total Submissions", value: reports.length, icon: FileText, color: "text-primary" },
             { label: "Pending ROC Review", value: reports.filter(r => r.status === "pending_review").length, icon: Clock, color: "text-amber-600" },
             { label: "Revisions Active", value: reports.filter(r => r.status === "revision_requested").length, icon: AlertCircle, color: "text-rose-600" },
             { label: "Authorized This Month", value: 12, icon: ShieldCheck, color: "text-emerald-600" },
           ].map((stat, i) => (
             <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-black">{stat.value}</p>
                   </div>
                   <stat.icon className={cn("h-8 w-8 opacity-20", stat.color)} />
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-primary/5">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports by title or PI..." className="pl-10 h-10 rounded-xl border-muted" />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold text-xs uppercase tracking-widest border-muted">
                <Filter className="h-3 w-3 mr-2" /> Filter By Year
             </Button>
          </div>
        </div>

        {/* Reports Table/List */}
        <div className="space-y-4">
           {isLoading ? (
             <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Loading final reports...</div>
           ) : (
             reports.map((report) => (
               <Card key={report.id} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
                  <CardContent className="p-0">
                     <div className="flex flex-col md:flex-row items-stretch">
                        <div className={cn("w-1.5", 
                          report.status === 'pending_review' ? "bg-amber-500" :
                          report.status === 'revision_requested' ? "bg-rose-500" : "bg-emerald-500"
                        )} />
                        
                        <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="text-[9px] font-black tracking-tighter uppercase px-1.5 py-0">
                                    {report.id}
                                 </Badge>
                                 <span className="text-[10px] text-muted-foreground font-bold uppercase">{report.submissionDate}</span>
                              </div>
                              <h3 className="text-base font-black leading-tight group-hover:text-primary transition-colors line-clamp-1">{report.title}</h3>
                              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                 <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {report.pi}</span>
                                 <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {report.institution}</span>
                              </div>
                           </div>

                           <div className="flex items-center gap-8 shrink-0">
                              {report.grade && (
                                <div className="text-center">
                                   <p className="text-lg font-black text-primary leading-none">{report.grade}</p>
                                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Grade</p>
                                </div>
                              )}
                              
                              <div className="text-right min-w-[140px]">
                                 <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
                                   reportStatuses[report.status as keyof typeof reportStatuses].bg,
                                   reportStatuses[report.status as keyof typeof reportStatuses].color
                                 )}>
                                    <Clock className="h-3 w-3" />
                                    {reportStatuses[report.status as keyof typeof reportStatuses].label}
                                 </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 shadow-xl border-primary/10 rounded-xl">
                                  <DropdownMenuItem 
                                    className="cursor-pointer font-bold text-primary"
                                    onClick={() => router.push(`/research/monitoring/${report.projectId}/review-policy-brief`)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Grade Policy Brief
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="cursor-pointer font-bold"
                                    onClick={() => router.push(`/research/monitoring/${report.projectId}/final-approval`)}
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Authorize Final Approval
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                                    View Monitoring Log
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))
           )}
        </div>
      </div>
    </PageContainer>
  );
}

function Building2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
