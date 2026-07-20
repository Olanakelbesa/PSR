"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { ResearchProposal } from "@/lib/types";
import { PROPOSAL_STATUSES, THEMATIC_AREAS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProposalRow = ResearchProposal & {
  referenceNumber: string;
  thematicArea: string;
  statusLabel?: string;
};

const FLOW_STATUS_TO_UI_STATUS: Record<string, ResearchProposal["status"]> = {
  screening_under_review: "under_review",
  screening_approved: "approved",
  screening_rejected: "rejected",
  revision_required: "revision_requested",
};

function normalizeProposalStatus(proposal: any): ResearchProposal["status"] {
  const backendStatus = String(
    proposal.workflowState ??
      proposal.workflow_state ??
      proposal.status ??
      "draft",
  ).toLowerCase();

  if (backendStatus === "resubmitted") {
    return "resubmitted" as ResearchProposal["status"];
  }

  const mappedStatus = FLOW_STATUS_TO_UI_STATUS[backendStatus] ?? backendStatus;
  return mappedStatus as ResearchProposal["status"];
}

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
  resubmitted: { label: "Resubmitted", variant: "default", icon: Clock },
  under_review: { label: "Under Review", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  contracted: { label: "Contracted", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "outline", icon: Clock },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  terminated: { label: "Terminated", variant: "destructive", icon: XCircle },
  protocol_stage: {
    label: "Protocol Stage",
    variant: "outline",
    icon: FileText,
  },
  funding_recommendation: {
    label: "Funding Recommendation",
    variant: "default",
    icon: CheckCircle2,
  },
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
        href={`/research/proposals/my-proposals/${row.original.id}`}
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
      <div className="max-w-xs w-[250px]">
        <p className="font-medium whitespace-normal break-words">
          {row.original.title}
        </p>
        <p className="text-xs text-muted-foreground truncate ">
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
          {row.original.statusLabel || config.label}
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
          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/research/proposals/my-proposals/${row.original.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          {row.original.status === "draft" && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/research/proposals/my-proposals/${row.original.id}/edit`}
                >
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
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapToProposalRow = (proposal: any): ProposalRow => {
    const thematicArea =
      proposal.thematicAreas && proposal.thematicAreas.length > 0
        ? proposal.thematicAreas.map((ta: any) => ta.name).join(", ")
        : "N/A";

    const firstName = proposal.createdBy?.firstName || "";
    const lastName = proposal.createdBy?.lastName || "";

    return {
      ...proposal,
      id: String(proposal.id),
      referenceNumber: proposal.referenceNumber || `PRP-${proposal.id}`,
      title: proposal.title || "Untitled Proposal",
      abstract: proposal.shortAbstract || "",
      background: "",
      objectives: "",
      methodology: "",
      expectedOutcomes: "",
      ethicalConsiderations: "",
      principalInvestigator: {
        id: String(proposal.createdBy?.id || ""),
        email: proposal.createdBy?.email || "",
        firstName,
        lastName,
        role: "user",
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
      coInvestigators: [],
      institution: proposal.Organization?.name || "N/A",
      researchArea: thematicArea,
      budget: {
        personnel: 0,
        equipment: 0,
        consumables: 0,
        travel: 0,
        other: 0,
        total: 0,
      },
      timeline: [],
      status: normalizeProposalStatus(proposal),
      statusLabel: proposal.statusDisplay || proposal.status_display,
      attachments: [],
      reviews: [],
      submittedAt: proposal.submittedAt || undefined,
      createdAt: proposal.createdAt || "",
      updatedAt: proposal.updatedAt || "",
      thematicArea,
    };
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProposals() {
      setIsLoading(true);
      try {
        const response = await proposalsApi.getProposals({
          limit: 100,
        });
        const proposalsData = response.data || [];
        if (!isMounted) {
          return;
        }
        setProposals(proposalsData.map(mapToProposalRow));
      } catch (error) {
        console.error("Failed to load proposals:", error);
        if (!isMounted) {
          return;
        }
        setProposals([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProposals();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Total Proposals",
      value: proposals.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    {
      label: "Approved",
      value: proposals.filter((p) => p.status === "approved").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
    },
    {
      label: "Under Review",
      value: proposals.filter(
        (p) => p.status === "under_review" || p.status === "submitted",
      ).length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50/50",
    },
    {
      label: "Drafts",
      value: proposals.filter((p) => p.status === "draft").length,
      icon: Edit,
      color: "text-slate-600",
      bg: "bg-slate-50/50",
    },
  ];

  const statusOptions = Object.entries(PROPOSAL_STATUSES).map(
    ([key, value]) => ({
      value: key,
      label: value.label,
    }),
  );

  return (
    <PageContainer
      title="My Proposals"
      description="Manage your research proposals and submissions"
      actions={
        <Button asChild className="shadow-sm">
          <Link href="/research/proposals/my-proposals/new">
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden border-none shadow-md transition-all hover:shadow-lg"
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-1 transition-all group-hover:w-1.5",
                      stat.bg.replace("/50", ""),
                    )}
                  />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="space-y-4">
          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={proposals}
              searchKey="title"
              onRowClick={(row) => {
                router.push(`/research/proposals/my-proposals/${row.id}`);
              }}
              searchPlaceholder="Search proposals by title..."
              filterOptions={[
                {
                  key: "status",
                  label: "Status",
                  options: statusOptions,
                },
              ]}
              emptyMessage="No proposals found"
              emptyDescription="Try adjusting your filters or create a new proposal"
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
