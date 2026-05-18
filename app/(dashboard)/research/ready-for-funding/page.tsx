"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  DollarSign,
  FileText,
  ClipboardCheck,
  Microscope,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

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
import { proposalsApi } from "@/api/client";
import { mockProposals } from "@/lib/api/mock-data";
import type { ResearchProposal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProposalRow = ResearchProposal & { referenceNumber: string };

export default function ReadyForFundingPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapToRow = (p: ResearchProposal): ProposalRow => ({
    ...p,
    referenceNumber: p.id.replace("prop-", "PRP-").toUpperCase(),
  });

  useEffect(() => {
    async function loadProposals() {
      setIsLoading(true);
      try {
        const response = await proposalsApi.getProposals(
          { status: "approved" },
          { page: 1, pageSize: 100 }
        );
        if (response.data.length > 0) {
          setProposals(response.data.map(mapToRow));
        } else {
          setProposals(mockProposals.filter(p => p.status === "approved").map(mapToRow));
        }
      } catch {
        setProposals(mockProposals.filter(p => p.status === "approved").map(mapToRow));
      } finally {
        setIsLoading(false);
      }
    }
    loadProposals();
  }, []);

  const stats = [
    {
      label: "Ready for Authorization",
      value: proposals.length,
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-600",
      desc: "Passed technical review"
    },
    {
      label: "Pending Funding",
      value: proposals.length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-600",
      desc: "Decision expected this week"
    },
    {
      label: "Total Funding Goal",
      value: `ETB ${(proposals.reduce((sum, p) => sum + (p.budget?.total || 0), 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-600",
      desc: "Combined budget requested"
    },
    {
      label: "ROC Approval Rate",
      value: "68%",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary",
      desc: "Fiscal year average"
    },
  ];

  const columns: ColumnDef<ProposalRow>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference #",
      cell: ({ row }) => (
        <span className="font-bold text-primary tracking-tight">{row.original.referenceNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Proposal Details",
      cell: ({ row }) => (
        <div className="max-w-[420px] py-1">
          <p className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {row.original.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{row.original.institution}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">{row.original.researchArea}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "principalInvestigator",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">
            {row.original.principalInvestigator.firstName} {row.original.principalInvestigator.lastName}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium italic">{row.original.principalInvestigator.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "budget",
      header: "Budget Requested",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900">
            ETB {row.original.budget?.total?.toLocaleString() || "—"}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Full Grant</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Funding Status",
      cell: () => (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[10px] font-black uppercase tracking-wider shadow-none px-2 py-0.5">
          <Clock className="h-3 w-3 mr-1" />
          Pending Auth
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-xl border-primary/10">
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/research/ready-for-funding/${row.original.id}`)}>
              <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
              View Proposal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-emerald-600 font-bold cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50"
              onClick={() => router.push(`/research/ready-for-funding/${row.original.id}/approve`)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Funding Authorization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Ready for Funding"
      description="Technically approved research proposals awaiting final financial authorization and contracting."
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

        {/* Table Section */}

            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={proposals}
                searchKey="title"
                searchPlaceholder="Search approved proposals..."
                onRowClick={(row) => router.push(`/research/ready-for-funding/${row.id}`)}
                emptyMessage="No proposals ready for funding"
                emptyDescription="No proposals have been approved by the ROC board yet."
              />
            )}

      </div>
    </PageContainer>
  );
}

