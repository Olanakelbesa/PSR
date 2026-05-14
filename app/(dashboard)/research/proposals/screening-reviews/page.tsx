"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardCheck,
  FileText,
  AlertCircle
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { proposalsApi } from "@/lib/api/client";
import { mockProposals } from "@/lib/api/mock-data";
import type { ResearchProposal } from "@/lib/types";
import { PROPOSAL_STATUSES, THEMATIC_AREAS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProposalRow = ResearchProposal & {
  referenceNumber: string;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  submitted: { label: "Awaiting Screening", variant: "default", icon: Clock },
  under_review: { label: "In Review", variant: "outline", icon: ClipboardCheck },
  approved: { label: "Approved", variant: "secondary", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  revision_requested: { label: "Revision Requested", variant: "outline", icon: AlertCircle },
};

export default function ScreeningReviewsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapToProposalRow = (proposal: ResearchProposal): ProposalRow => ({
    ...proposal,
    referenceNumber: proposal.id.replace("prop-", "PRP-").toUpperCase(),
  });

  useEffect(() => {
    async function loadProposals() {
      setIsLoading(true);
      try {
        // In a real app, we would filter by 'submitted' status on the backend
        const response = await proposalsApi.getProposals(
          { status: "submitted" },
          { page: 1, pageSize: 100 }
        );

        if (response.data.length > 0) {
          setProposals(response.data.map(mapToProposalRow));
        } else {
          // Fallback to mock data filtered by submitted status
          const filteredMock = mockProposals
            .filter(p => p.status === "submitted" || p.status === "under_review")
            .map(mapToProposalRow);
          setProposals(filteredMock);
        }
      } catch (error) {
        console.error("Failed to load proposals for screening:", error);
        setProposals(mockProposals.filter(p => p.status === "submitted").map(mapToProposalRow));
      } finally {
        setIsLoading(false);
      }
    }
    loadProposals();
  }, []);

  const stats = [
    {
      label: "Pending Screening",
      value: proposals.filter(p => p.status === "submitted").length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50/50",
    },
    {
      label: "Under Review",
      value: proposals.filter(p => p.status === "under_review").length,
      icon: ClipboardCheck,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    {
      label: "Completed Today",
      value: 12, // Mock stat
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
    },
    {
      label: "Total Screened",
      value: 148, // Mock stat
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-slate-50/50",
    },
  ];

  const columns: ColumnDef<ProposalRow>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference #",
      cell: ({ row }) => (
        <span className="font-bold text-primary">{row.original.referenceNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Proposal Title",
      cell: ({ row }) => (
        <div className="max-w-[400px]">
          <p className="font-semibold text-sm line-clamp-1">{row.original.title}</p>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.original.institution}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "principalInvestigator",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.principalInvestigator.firstName} {row.original.principalInvestigator.lastName}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase">{row.original.researchArea}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status] || statusConfig.submitted;
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted Date",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.original.submittedAt ? new Date(row.original.submittedAt).toLocaleDateString() : "Pending"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/research/proposals/screening-reviews/${row.original.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Proposal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-emerald-600 font-medium">
              <Link href={`/research/proposals/screening-reviews/${row.original.id}/review`}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Review
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Screening Reviews"
      description="Perform initial administrative screening and compliance checks on submitted research proposals."
    >
      <div className="space-y-8">
        {/* Reviewer Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all"
                >
                  <div className={cn("absolute inset-y-0 left-0 w-1", stat.bg.replace("/50", ""))} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="space-y-4">
          {/* Table */}
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <DataTable
              columns={columns}
              data={proposals}
              searchKey="title"
              searchPlaceholder="Search by proposal title or PI..."
              filterOptions={[
                {
                  key: "status",
                  label: "Phase",
                  options: [
                    { value: "submitted", label: "Awaiting Screening" },
                    { value: "under_review", label: "In Review" },
                  ],
                },
              ]}
              onRowClick={(row) => router.push(`/research/proposals/screening-reviews/${row.id}`)}
              emptyMessage="No proposals found for screening"
              emptyDescription="All submitted proposals have been processed."
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
