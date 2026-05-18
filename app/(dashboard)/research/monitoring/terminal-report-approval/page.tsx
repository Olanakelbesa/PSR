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
  Globe,
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
import { monitoringApi } from "@/api/client";
import { mockProjects } from "@/lib/api/mock-data";
import type { ResearchProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Define local high-fidelity interface for mock terminal reports matching Django model
interface MockTerminalReport {
  id: string;
  projectId: string;
  reportName: string;
  terminalTypes: string[];
  mainDeliverables: string;
  attachmentName?: string;
  attachmentSize?: number;
  isPublished: boolean;
  publicationLink?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

// Enrich mock data to contain submitted terminal reports
const mockTerminalReports: MockTerminalReport[] = [
  {
    id: "tr-pending-1",
    projectId: "proj-001",
    reportName: "Final Terminal Report - Special Needs Education",
    terminalTypes: ["technical", "policy", "outputs"],
    mainDeliverables:
      "Successfully established special needs learning infrastructure across 12 designated pilot schools. Distributed adaptive curricula guidelines, enrolled 450+ students in trial cohorts, and developed comprehensive policy briefs for the Ministry of Education.",
    attachmentName: "Addis_Special_Needs_Final_Terminal.pdf",
    attachmentSize: 8450000,
    isPublished: true,
    publicationLink: "https://doi.org/10.1016/j.jedu.2024.12.004",
    status: "pending",
    submittedAt: "2024-05-14T10:00:00Z",
  },
  {
    id: "tr-pending-2",
    projectId: "proj-002",
    reportName:
      "Final Terminal Report - Bole Villa Structural Feasibility Study",
    terminalTypes: ["technical", "financial"],
    mainDeliverables:
      "Finalized complete urban density evaluations, cost benefit ratios, and architectural zoning blueprints. Delivered full ledger balances and financial audit receipts corresponding to Phase 1 and 2 execution releases.",
    attachmentName: "Bole_Villa_Zoning_Final_Financials.pdf",
    attachmentSize: 11200000,
    isPublished: false,
    status: "pending",
    submittedAt: "2024-05-16T16:45:00Z",
  },
];

export default function TerminalReportApprovalListPage() {
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

  // Map pending terminal reports to their respective projects
  const pendingApprovals = mockTerminalReports.map((tr) => {
    const proj = projects.find((p) => p.id === tr.projectId) || mockProjects[0];
    return {
      ...tr,
      project: proj,
    };
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
            {row.original.project.proposal.principalInvestigator.lastName} (
            {row.original.project.proposal.institution})
          </div>
        </div>
      ),
    },
    {
      accessorKey: "reportName",
      header: "Report Title",
      cell: ({ row }: any) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground truncate max-w-[250px]">
            {row.original.reportName}
          </span>
          <div className="flex flex-wrap gap-1">
            {row.original.terminalTypes.map((t: string) => (
              <Badge
                key={t}
                variant="secondary"
                className="bg-primary/5 text-primary border-primary/10 text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Published",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          {row.original.isPublished ? (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200/50 text-[9px] font-bold py-0.5 px-2"
            >
              <Globe className="h-3 w-3 mr-1 shrink-0" />
              Journal
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-muted/30 text-muted-foreground border-muted-foreground/10 text-[9px] font-bold py-0.5 px-2"
            >
              Internal
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted Date",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(row.original.submittedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
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
          className="bg-indigo-50 text-indigo-700 border-indigo-200/60 font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5"
        >
          Pending Review
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/5"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 shadow-xl border-primary/10"
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/research/monitoring/terminal-report-approval/${row.original.projectId}`}
                className="cursor-pointer font-bold text-primary"
              >
                <FileCheck2 className="h-4 w-4 mr-2" />
                Evaluate Final Report
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/research/monitoring/progress-report/${row.original.projectId}`}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                View Project History
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const stats = [
    {
      label: "Pending Final Reports",
      value: pendingApprovals.length,
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-500/10",
      desc: "Awaiting final clearance",
    },
    {
      label: "Closed Projects YTD",
      value: 14,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      desc: "Successfully finished",
    },
    {
      label: "Average Project Life",
      value: "11.6 Mos",
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      desc: "From contract to closeout",
    },
    {
      label: "Open Research Output",
      value: "84.3%",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "Published results ratio",
    },
  ];

  return (
    <PageContainer
      title="Terminal Report Approval Portal"
      description="Evaluate terminal research deliverables, confirm institutional outputs, and finalize closeout approvals."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {stat.desc}
                    </p>
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
            searchPlaceholder="Search final reports..."
            emptyMessage="No pending terminal reports found"
            emptyDescription="All completed research projects have successfully been approved and archived!"
          />
        </div>
      </div>
    </PageContainer>
  );
}
