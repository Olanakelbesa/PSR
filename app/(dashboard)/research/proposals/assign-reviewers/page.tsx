"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  UserPlus,
  Clock,
  CheckCircle2
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { proposalsApi } from "@/lib/api/client";
import type { ResearchProposal } from "@/lib/types";
import { format } from "date-fns";

export default function AssignReviewersPage() {
  const [proposals, setProposals] = useState<ResearchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const response = await proposalsApi.getProposals({ 
        // In a real app, we'd filter by status 'submitted' or those passing screening
      });
      // For this view, we filter for proposals that need assignment
      // Typically those with 'submitted' status or 'under_review' with few reviewers
      const pendingAssignment = response.data.filter(p => 
        p.status === "submitted" || p.status === "under_review"
      );
      setProposals(pendingAssignment);
    } catch (error) {
      console.error("Failed to load proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "id",
      header: "Reference",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs font-medium">
          {row.original.id.replace("prop-", "PRP-").toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Proposal Title",
      cell: ({ row }: any) => (
        <div className="max-w-[400px]">
          <div className="font-medium truncate">{row.original.title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {row.original.researchArea}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "principalInvestigator",
      header: "PI",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {row.original.principalInvestigator.firstName[0]}
            {row.original.principalInvestigator.lastName[0]}
          </div>
          <span className="text-sm">
            {row.original.principalInvestigator.firstName} {row.original.principalInvestigator.lastName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.submittedAt ? format(new Date(row.original.submittedAt), "MMM dd, yyyy") : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "reviews",
      header: "Reviewers",
      cell: ({ row }: any) => {
        const count = row.original.reviews?.length || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className={`text-sm font-medium ${count < 2 ? "text-amber-600" : "text-emerald-600"}`}>
              {count} Assigned
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <StatusBadge type="proposal" status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/research/proposals/assign-reviewers/${row.original.id}/assign`} className="flex items-center gap-2">
                <UserPlus className="size-4" />
                Assign Reviewers
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/research/proposals/${row.original.id}`} className="flex items-center gap-2">
                <Eye className="size-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description="Select and assign subject matter experts to evaluate research proposals."
    >
      <div className="space-y-6">
        <DataTable 
          columns={columns} 
          data={proposals.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.principalInvestigator.firstName.toLowerCase().includes(searchQuery.toLowerCase())
          )} 
          toolbar={
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search proposals..." 
                  className="pl-9 bg-muted/50 border-none ring-offset-background focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="size-4" />
                  Filter
                </Button>
              </div>
            </div>
          }
        />
      </div>
    </PageContainer>
  );
}
