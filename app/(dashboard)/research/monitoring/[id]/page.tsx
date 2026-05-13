"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Plus,
  Upload,
  BarChart3,
  Users,
  Wallet,
  TrendingUp,
  Search,
  Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/lib/api/client";
import type { ResearchProject, Milestone, ProgressReport } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MonitoringProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await monitoringApi.getProjectById(id as string);
        if (response.success && response.data) {
          setProject(response.data);
        } else {
          setProject(MOCK_PROJECT as any);
        }
      } catch (error) {
        console.error("Error loading project:", error);
        setProject(MOCK_PROJECT as any);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [id]);

  if (isLoading) return <PageContainer title="Loading..."><div className="h-96 flex items-center justify-center">Loading...</div></PageContainer>;
  if (!project) return <PageContainer title="Project Not Found">Not Found</PageContainer>;

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    suspended: "bg-amber-100 text-amber-700 border-amber-200",
    terminated: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <PageContainer
      title={project.proposal.title}
      description={`Contract: ${project.contractNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
             <Plus className="mr-2 h-4 w-4" />
             Submit Progress Report
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="space-y-6">
           {/* Progress Summary */}
           <Card className="shadow-sm border-primary/10 overflow-hidden">
              <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center gap-8">
                 <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center text-sm mb-1">
                       <span className="font-bold text-primary uppercase tracking-wider text-[10px]">Overall Execution Progress</span>
                       <span className="font-black text-primary text-lg">68%</span>
                    </div>
                    <Progress value={68} className="h-3 bg-primary/20" />
                 </div>
                 <div className="h-14 w-px bg-primary/10" />
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time Elapsed</p>
                       <p className="text-xl font-black">7/12 <span className="text-sm font-normal text-muted-foreground">Months</span></p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Budget Spent</p>
                       <p className="text-xl font-black">42%</p>
                    </div>
                 </div>
              </div>

              <Tabs defaultValue="milestones" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8 px-6">
                  <TabsTrigger value="milestones" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Milestones & Gantt</TabsTrigger>
                  <TabsTrigger value="reports" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Progress Reports</TabsTrigger>
                  <TabsTrigger value="outputs" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0">Outputs & Artifacts</TabsTrigger>
                </TabsList>

                <TabsContent value="milestones" className="p-6">
                   <div className="space-y-4">
                      {project.milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="relative pl-8 pb-8 last:pb-0">
                           {idx !== project.milestones.length - 1 && (
                             <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-muted" />
                           )}
                           <div className={cn(
                             "absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center",
                             milestone.status === 'completed' ? "bg-emerald-500" : 
                             milestone.status === 'in_progress' ? "bg-primary animate-pulse" : "bg-muted"
                           )}>
                              {milestone.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-white" />}
                           </div>
                           <div className="bg-muted/30 p-4 rounded-xl border border-muted/50 hover:border-primary/20 transition-all group">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h4 className="text-sm font-bold">{milestone.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                                 </div>
                                 <Badge variant="outline" className={cn(
                                    "text-[10px] font-bold uppercase",
                                    milestone.status === 'completed' ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                    milestone.status === 'in_progress' ? "border-primary/20 bg-primary/5 text-primary" : ""
                                 )}>
                                    {milestone.status.replace('_', ' ')}
                                 </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-muted/50">
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                 </div>
                                 {milestone.completedAt && (
                                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Done: {new Date(milestone.completedAt).toLocaleDateString()}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </TabsContent>

                <TabsContent value="reports" className="p-6">
                   <div className="space-y-4">
                      {project.progressReports.map((report) => (
                        <Card key={report.id} className="shadow-none border-muted/50 hover:bg-muted/20 transition-colors cursor-pointer">
                           <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-primary" />
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-bold">{report.reportingPeriod}</h4>
                                    <p className="text-xs text-muted-foreground">Submitted {new Date(report.submittedAt || '').toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <p className="text-xs font-bold">ETB {report.budgetSpent.toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">Budget Spent</p>
                                 </div>
                                 <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-none uppercase text-[9px] font-bold">Approved</Badge>
                              </div>
                           </CardContent>
                        </Card>
                      ))}
                   </div>
                </TabsContent>

                <TabsContent value="outputs" className="p-6">
                   <div className="grid gap-4 md:grid-cols-2">
                      {project.outputs.map((output) => (
                        <div key={output.id} className="p-4 rounded-xl border border-muted/50 flex flex-col justify-between hover:shadow-md transition-all">
                           <div>
                              <div className="flex items-center justify-between mb-2">
                                 <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest">{output.type}</Badge>
                                 <Clock className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <h4 className="text-sm font-bold line-clamp-1">{output.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{output.description}</p>
                           </div>
                           <Button variant="ghost" className="w-full mt-4 h-8 text-[11px] font-bold hover:bg-primary/5 hover:text-primary">
                              <Download className="h-3 w-3 mr-2" />
                              Download File
                           </Button>
                        </div>
                      ))}
                   </div>
                </TabsContent>
              </Tabs>
           </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Governance</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={cn("px-3 py-1 border shadow-none uppercase text-[10px] font-bold", statusColors[project.status])}>
                       {project.status}
                    </Badge>
                 </div>
                 <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date Range</p>
                    <div className="flex items-center gap-3">
                       <Calendar className="h-4 w-4 text-primary" />
                       <span className="text-xs font-medium">
                          {new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}
                       </span>
                    </div>
                 </div>
                 <div className="pt-4 border-t">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">PI Institutional Contact</p>
                    <div className="flex items-start gap-3">
                       <Users className="h-5 w-5 text-primary mt-0.5" />
                       <div>
                          <p className="text-xs font-bold">{project.proposal.principalInvestigator.firstName} {project.proposal.principalInvestigator.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">{project.proposal.institution}</p>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-4 border-b">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs mb-1">
                       <span className="text-muted-foreground">Spent: ETB 231K</span>
                       <span className="font-bold">Total: ETB 550K</span>
                    </div>
                    <Progress value={42} className="h-2" />
                 </div>
                 
                 <div className="space-y-3 pt-2">
                    {project.budgetUtilization.breakdown.slice(0, 3).map((item) => (
                       <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase font-bold">
                             <span className="text-muted-foreground">{item.category}</span>
                             <span>{Math.round((item.spent / item.allocated) * 100)}%</span>
                          </div>
                          <Progress value={(item.spent / item.allocated) * 100} className="h-1 bg-muted" />
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </aside>
      </div>
    </PageContainer>
  );
}

const MOCK_PROJECT = {
   id: "PROJ-2024-001",
   contractNumber: "MOE/PSR/2024/042",
   startDate: "2024-03-01T00:00:00Z",
   endDate: "2025-02-28T00:00:00Z",
   status: "active",
   proposal: {
      title: "Enhancing Inclusive Education for Students with Special Needs in Primary Schools of Addis Ababa",
      principalInvestigator: { firstName: "Abebe", lastName: "Mekonnen" },
      institution: "Addis Ababa University"
   },
   milestones: [
      { id: "m1", title: "Institutional Ethical Approval", description: "Securing clearance from AAU IRB board.", dueDate: "2024-03-15T00:00:00Z", status: "completed", completedAt: "2024-03-10T00:00:00Z" },
      { id: "m2", title: "Baseline Data Collection", description: "Surveying 20 target primary schools.", dueDate: "2024-05-30T00:00:00Z", status: "completed", completedAt: "2024-06-02T00:00:00Z" },
      { id: "m3", title: "Mid-term Analysis Report", description: "Triangulating qualitative and quantitative findings.", dueDate: "2024-08-15T00:00:00Z", status: "in_progress" },
      { id: "m4", title: "Policy Hub Prototype", description: "Design of the metropolitan inclusion model.", dueDate: "2024-11-01T00:00:00Z", status: "pending" },
      { id: "m5", title: "Final Research Publication", description: "Submission to peer-reviewed journal.", dueDate: "2025-02-15T00:00:00Z", status: "pending" },
   ],
   progressReports: [
      { id: "r1", reportingPeriod: "Quarter 1 (Mar - May 2024)", budgetSpent: 85000, submittedAt: "2024-06-05T10:00:00Z", status: "approved" },
      { id: "r2", reportingPeriod: "Quarter 2 (Jun - Aug 2024)", budgetSpent: 146000, submittedAt: "2024-09-02T14:00:00Z", status: "approved" },
   ],
   budgetUtilization: {
      allocated: 550000,
      spent: 231000,
      remaining: 319000,
      breakdown: [
         { category: "Personnel", allocated: 240000, spent: 120000 },
         { category: "Travel", allocated: 120000, spent: 65000 },
         { category: "Equipment", allocated: 85000, spent: 46000 }
      ]
   },
   outputs: [
      { id: "o1", type: "report", title: "Baseline Survey Dataset", description: "Raw data from 400 primary school teacher surveys.", createdAt: "2024-06-10T00:00:00Z" },
      { id: "o2", type: "presentation", title: "MOE Stakeholder Workshop", description: "Slide deck presented to the Ministry Directorate.", createdAt: "2024-07-22T00:00:00Z" }
   ]
};
