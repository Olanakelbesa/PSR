"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Eye,
  FileText,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Check,
  X,
  FileCheck2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { ResearchProject, ProgressReport } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Enrich mock data to contain pending reports for approvals tab
const enrichedProjects = mockProjects.map((p) => {
  if (p.id === "proj-001") {
    return {
      ...p,
      progressReports: [
        {
          id: "pr-pending-1",
          projectId: "proj-001",
          reportingPeriod: "Q2 2024 Progress Report",
          activitiesCompleted:
            "Phase 2 clinical screenings are active. We have recruited over 400 subjects. Core databases are being cleaned and indexed for the review committee.",
          challenges: "Severe weather events delayed field data aggregation in several sub-regions.",
          nextSteps: "Execute mid-term evaluations and prepare draft report summaries.",
          budgetSpent: 124500.00,
          attachments: [
            {
              id: "att-q2-1",
              name: "Q2_Progress_Report_Complete.pdf",
              type: "application/pdf",
              size: 2450000,
              url: "#",
              uploadedAt: "2024-05-15T09:30:00Z"
            }
          ],
          status: "submitted" as const,
          submittedAt: "2024-05-15T09:30:00Z",
          createdAt: "2024-05-10T08:00:00Z",
        },
        ...p.progressReports,
      ],
    };
  }
  if (p.id === "proj-002") {
    return {
      ...p,
      progressReports: [
        {
          id: "pr-pending-2",
          projectId: "proj-002",
          reportingPeriod: "Q2 2024 Architecture Audit",
          activitiesCompleted:
            "Finalized geographic models, coordinated structural and municipal zoning filings, and held core alignment meetups with Addis Ababa housing bureaus.",
          challenges: "Delays in zoning authorizations from municipal bodies due to legislative updates.",
          nextSteps: "Kick off physical core excavations and material supply distributions.",
          budgetSpent: 310000.00,
          attachments: [
            {
              id: "att-q2-2",
              name: "Bole_Villa_Structural_Report.pdf",
              type: "application/pdf",
              size: 4890000,
              url: "#",
              uploadedAt: "2024-05-16T14:15:00Z"
            }
          ],
          status: "submitted" as const,
          submittedAt: "2024-05-16T14:15:00Z",
          createdAt: "2024-05-12T11:00:00Z",
        },
        ...p.progressReports,
      ],
    };
  }
  return p;
});

export default function ProgressReportApprovalListPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      try {
        const response = await monitoringApi.getProjects();
        if (response && response.data) {
          // Add pending reports dynamically if not present
          const apiProjects = response.data.map((p) => {
            const enriched = enrichedProjects.find((ep) => ep.id === p.id);
            return enriched ? enriched : p;
          });
          setProjects(apiProjects);
        } else {
          setProjects(enrichedProjects);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects(enrichedProjects);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Extract all progress reports that are pending approval ("submitted" or "pending")
  const pendingApprovals = projects.flatMap((p) => {
    return (p.progressReports || [])
      .filter((r) => r.status === "submitted" || (r.status as string) === "pending")
      .map((r) => ({
        ...r,
        project: p,
      }));
  });

  const columns = [
    {
      accessorKey: "project.contractNumber",
      header: "Reference",
      cell: ({ row }: any) => (
        <span className="font-mono text-[10px] font-bold tracking-widest text-primary/70">
          {row.original.project.contractNumber}
        </span>
      ),
    },
    {
      id: "projectTitle",
      accessorKey: "project.proposal.title",
      header: "Research Project / PI",
      cell: ({ row }: any) => (
        <div className="max-w-[280px] lg:max-w-[380px]">
          <div className="font-bold text-sm leading-tight text-foreground truncate">
            {row.original.project.proposal.title}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 font-medium">
            PI: {row.original.project.proposal.principalInvestigator.firstName}{" "}
            {row.original.project.proposal.principalInvestigator.lastName} ({row.original.project.proposal.institution})
          </div>
        </div>
      ),
    },
    {
      accessorKey: "reportingPeriod",
      header: "Reporting Period",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {row.original.reportingPeriod}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "budgetSpent",
      header: "Budget Spent",
      cell: ({ row }: any) => (
        <span className="font-mono text-sm font-bold text-foreground">
          ETB {row.original.budgetSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted Date",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {row.original.submittedAt
              ? new Date(row.original.submittedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200/60 font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5"
        >
          Pending Approval
        </Badge>
      ),
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
              <Link
                href={`/research/monitoring/progress-report-approval/${row.original.project.id}`}
                className="cursor-pointer font-bold text-primary"
              >
                <FileCheck2 className="h-4 w-4 mr-2" />
                Review & Decide
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/research/monitoring/progress-report/${row.original.project.id}`}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                View Project Dashboard
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const stats = [
    {
      label: "Pending Approvals",
      value: pendingApprovals.length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      desc: "Requires review action"
    },
    {
      label: "Total Budget Requested",
      value: `ETB ${(pendingApprovals.reduce((sum, p) => sum + p.budgetSpent, 0) / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "Pending release claims"
    },
    {
      label: "Active Reviewers Assigned",
      value: 3,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      desc: "Evaluating reports"
    },
    {
      label: "Review SLA Compliance",
      value: "98.2%",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      desc: "Avg. turnaround: 4 days"
    },
  ];

  return (
    <PageContainer
      title="Progress Report Approval Portal"
      description="Evaluate research achievements, track budget utilization claims, and record formal approval decisions."
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
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.desc}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Portfolio Table */}
        <div className="space-y-4">

          <DataTable 
            columns={columns} 
            data={pendingApprovals} 
            searchKey="projectTitle" 
            searchPlaceholder="Search submitted reports..."
            emptyMessage="No pending progress reports found"
            emptyDescription="All submitted research reports have been evaluated and approved!"
          />
        </div>
      </div>
    </PageContainer>
  );
}
