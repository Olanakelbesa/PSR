"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MoreHorizontal,
  Eye,
  Upload,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Target,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/lib/api/client";
import { mockProjects } from "@/lib/api/mock-data";
import type { ResearchProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Active", color: "text-blue-600", bg: "bg-blue-600", icon: Activity },
  on_track: { label: "On Track", color: "text-emerald-600", bg: "bg-emerald-600", icon: CheckCircle2 },
  at_risk: { label: "At Risk", color: "text-amber-600", bg: "bg-amber-600", icon: Clock },
  delayed: { label: "Delayed", color: "text-rose-600", bg: "bg-rose-600", icon: AlertCircle },
  completed: { label: "Completed", color: "text-indigo-600", bg: "bg-indigo-600", icon: Target },
};

function ProjectCard({ project }: { project: ResearchProject }) {
  const router = useRouter();
  const status = statusConfig[project.status] || statusConfig.active;
  
  // Calculate progress based on milestones
  const completedMilestones = project.milestones?.filter(m => m.status === "completed").length || 0;
  const totalMilestones = project.milestones?.length || 0;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  
  // Budget calculations
  const budget = project.budgetUtilization;
  const budgetSpentPercent = budget ? Math.round((budget.spent / budget.allocated) * 100) : 0;

  return (
    <Card className="group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white">
      <div className={cn("absolute inset-y-0 left-0 w-1 opacity-80 group-hover:opacity-100 transition-opacity", status.bg)} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">{project.contractNumber}</span>
              <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0", status.color, "border-" + status.color.split("-")[1] + "-200")}>
                {status.label}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {project.proposal.title}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-medium italic">
              PI: {project.proposal.principalInvestigator.firstName} {project.proposal.principalInvestigator.lastName}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 shadow-xl border-primary/10">
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/research/monitoring/${project.id}`)}>
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                View Full Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-primary font-bold">
                <Upload className="h-4 w-4 mr-2" />
                Submit Progress Report
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                Update Milestones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {/* Progress Bars Section */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Overall Progress</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-primary/10" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Budget Utilization</span>
              <span className={cn(budgetSpentPercent > 90 ? "text-rose-600" : "text-emerald-600")}>{budgetSpentPercent}%</span>
            </div>
            <Progress value={budgetSpentPercent} className={cn("h-1.5", budgetSpentPercent > 90 ? "bg-rose-100" : "bg-emerald-100")} />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 border-t border-muted/30 pt-4">
          <div className="text-center">
            <p className="text-sm font-black tracking-tight">{completedMilestones}/{totalMilestones}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Milestones</p>
          </div>
          <div className="text-center border-x border-muted/30 px-2">
            <p className="text-sm font-black tracking-tight">{project.progressReports?.length || 0}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Reports</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-black tracking-tight">
              {Math.max(0, Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Days Left</p>
          </div>
        </div>

        {/* Footer Action */}
        <Button 
          variant="secondary" 
          className="w-full bg-primary/5 hover:bg-primary/10 text-primary border-none shadow-none group/btn h-9"
          asChild
        >
          <Link href={`/research/monitoring/${project.id}`}>
            Monitor Execution
            <ChevronRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MonitoringPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      try {
        const response = await monitoringApi.getProjects();
        // PaginatedResponse has data directly, not wrapped in success
        if (response && response.data) {
          setProjects(response.data);
        } else {
          setProjects(mockProjects);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects(mockProjects);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  const stats = [
    {
      label: "Active Projects",
      value: projects.length,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-600",
      desc: "Currently executing"
    },
    {
      label: "On Track",
      value: projects.filter(p => p.status === "on_track" || p.status === "active").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-600",
      desc: "Meeting milestones"
    },
    {
      label: "At Risk / Delayed",
      value: projects.filter(p => p.status === "at_risk" || p.status === "delayed").length,
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-600",
      desc: "Attention required"
    },
    {
      label: "Total Budget Managed",
      value: `ETB ${(projects.reduce((sum, p) => sum + (p.budgetUtilization?.allocated || 0), 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary",
      desc: "Active grants"
    },
  ];

  return (
    <PageContainer
      title="Research Monitoring"
      description="Track execution, milestone delivery, and financial utilization for approved research projects."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                </Card>
              ))
            : stats.map((stat, i) => (
                <Card key={i} className="group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
                  <div className={cn("absolute inset-y-0 left-0 w-1 opacity-80 group-hover:opacity-100 transition-opacity", stat.bg)} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={cn("p-1.5 rounded-lg opacity-80", stat.bg.replace("bg-", "bg-") + "/10")}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black tracking-tight">{stat.value}</div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.desc}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Active Portfolios
              </h2>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-black px-2">
                {projects.length} PROJECTS
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest h-8">
                Export Summary
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-none shadow-sm h-[320px]">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted/50 bg-muted/5">
              <CardContent className="p-20 text-center">
                <Activity className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
                <h3 className="text-lg font-bold mb-2">No research portfolios under monitoring</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Once proposals are authorized for funding and research contracts are signed, projects will automatically appear here for tracking.
                </p>
                <Button className="mt-8 shadow-lg shadow-primary/20" asChild>
                  <Link href="/research/ready-for-funding">
                    Check Authorized Proposals
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
