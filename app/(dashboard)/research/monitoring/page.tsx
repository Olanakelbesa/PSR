"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Eye,
  Upload,
  AlertCircle,
  DollarSign,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DataTable } from "@/components/shared/data-table";
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

export default function MonitoringPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      try {
        const response = await monitoringApi.getProjects();
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

  const columns = [
    {
      accessorKey: "contractNumber",
      header: "Reference",
      cell: ({ row }: any) => (
        <span className="font-mono text-[10px] font-black tracking-widest text-primary/70">
          {row.original.contractNumber}
        </span>
      ),
    },
    {
      id: "title",
      accessorKey: "proposal.title",
      header: "Project Title",
      cell: ({ row }: any) => (
        <div className="max-w-[300px] lg:max-w-[400px]">
          <div className="font-bold text-sm leading-tight truncate">
            {row.original.proposal.title}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 font-medium">
            PI: {row.original.proposal.principalInvestigator.firstName} {row.original.proposal.principalInvestigator.lastName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }: any) => {
        const completedMilestones = row.original.milestones?.filter((m: any) => m.status === "completed").length || 0;
        const totalMilestones = row.original.milestones?.length || 0;
        const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
        
        return (
          <div className="w-32 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
              <span className="text-muted-foreground">{completedMilestones}/{totalMilestones} MS</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-primary/10" />
          </div>
        );
      },
    },
    {
      accessorKey: "budget",
      header: "Utilization",
      cell: ({ row }: any) => {
        const budget = row.original.budgetUtilization;
        const budgetSpentPercent = budget ? Math.round((budget.spent / budget.allocated) * 100) : 0;
        
        return (
          <div className="w-32 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
              <span className="text-muted-foreground">ETB {(budget.spent / 1000).toFixed(1)}K</span>
              <span className={cn(budgetSpentPercent > 90 ? "text-rose-600" : "text-emerald-600")}>
                {budgetSpentPercent}%
              </span>
            </div>
            <Progress 
              value={budgetSpentPercent} 
              className={cn("h-1.5", budgetSpentPercent > 90 ? "bg-rose-100" : "bg-emerald-100")} 
            />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = statusConfig[row.original.status] || statusConfig.active;
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5", 
              status.color, 
              "border-current/20"
            )}
          >
            {status.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-xl border-primary/10">
            <DropdownMenuItem asChild>
              <Link href={`/research/monitoring/${row.original.id}`} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                View Full Details
              </Link>
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
      ),
    },
  ];

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
                <Card key={i} className="group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white">
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

        {/* Portfolio Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Active Portfolio
              </h2>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-black px-2">
                {projects.length} PROJECTS
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest h-8 shadow-sm">
                Export Summary
              </Button>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={projects} 
            searchKey="title" 
            searchPlaceholder="Search portfolios..."
            emptyMessage="No research portfolios under monitoring"
            emptyDescription="Active research projects will appear here for tracking."
          />
        </div>
      </div>
    </PageContainer>
  );
}
