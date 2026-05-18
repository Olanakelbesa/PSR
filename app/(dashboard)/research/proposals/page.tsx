"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PROPOSAL_STATUSES, THEMATIC_AREAS } from "@/lib/constants";

type ProposalRow = ResearchProposal & {
  referenceNumber: string;
  thematicArea: string;
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof FileText;
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  submitted: { label: "Submitted", variant: "default", icon: Clock },
  under_review: { label: "Under Review", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  contracted: { label: "Contracted", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "outline", icon: Clock },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  terminated: { label: "Terminated", variant: "destructive", icon: XCircle },
  revision_requested: {
    label: "Revision Requested",
    variant: "outline",
    icon: Edit,
  },
};

const columns: ColumnDef<ProposalRow>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
    cell: ({ row }) => (
      <Link
        href={`/research/proposals/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.referenceNumber}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-xs">
        <p className="font-medium truncate">{row.original.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {row.original.principalInvestigator?.firstName}{" "}
          {row.original.principalInvestigator?.lastName}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "thematicArea",
    header: "Thematic Area",
    cell: ({ row }) => {
      const area = THEMATIC_AREAS.find(
        (t) => t.value === row.original.thematicArea,
      );
      return (
        <Badge variant="outline" className="text-xs">
          {area?.label || row.original.thematicArea}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = statusConfig[row.original.status] || statusConfig.draft;
      const Icon = config.icon;
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.submittedAt
          ? new Date(row.original.submittedAt).toLocaleDateString()
          : "-"}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/research/proposals/${row.original.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          {row.original.status === "draft" && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/research/proposals/${row.original.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const mapToProposalRow = (proposal: ResearchProposal): ProposalRow => ({
    ...proposal,
    referenceNumber: proposal.id.replace("prop-", "PRP-").toUpperCase(),
    thematicArea: proposal.researchArea,
  });

  useEffect(() => {
    async function loadProposals() {
      try {
        const response = await proposalsApi.getProposals(
          {},
          { page: 1, pageSize: 100 },
        );

        if (response.data.length > 0) {
          setProposals(response.data.map(mapToProposalRow));
        } else {
          setProposals(mockProposals.map(mapToProposalRow));
        }
      } catch (error) {
        console.error("Failed to load proposals:", error);
        setProposals(mockProposals.map(mapToProposalRow));
      } finally {
        setIsLoading(false);
      }
    }
    loadProposals();
  }, []);

  const filteredProposals = proposals.filter((proposal) => {
    if (statusFilter !== "all" && proposal.status !== statusFilter)
      return false;
    if (
      searchQuery &&
      !proposal.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <PageContainer
      title="My Proposals"
      description="Manage your research proposals and submissions"
      actions={
        <Button asChild>
          <Link href="/research/proposals/new">
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(PROPOSAL_STATUSES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredProposals}
          emptyMessage="No proposals found"
          emptyDescription="Create your first proposal to get started"
        />
      </div>
    </PageContainer>
  );
}
