"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardCheck,
  FileText,
  AlertCircle,
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
import {
  getManagedProposals,
  type ScreeningStatus,
  type ManagedProposalQueueItem,
} from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

type ProposalRow = Omit<ManagedProposalQueueItem, "status"> & {
  status: ScreeningStatus;
  organizationName: string;
  unitName: string;
  officeName: string;
  createdByName: string;
  thematicAreaLabel: string;
  shortAbstractText: string;
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: any;
  }
> = {
  submitted: { label: "Awaiting Screening", variant: "default", icon: Clock },
  screening_under_review: {
    label: "In Review",
    variant: "outline",
    icon: ClipboardCheck,
  },
  screening_approved: {
    label: "Screening Approved",
    variant: "secondary",
    icon: CheckCircle2,
  },
  screening_rejected: {
    label: "Screening Rejected",
    variant: "destructive",
    icon: XCircle,
  },
  under_review: {
    label: "In Review",
    variant: "outline",
    icon: ClipboardCheck,
  },
  approved: { label: "Approved", variant: "secondary", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  revision_requested: {
    label: "Revision Requested",
    variant: "outline",
    icon: AlertCircle,
  },
};

export default function ScreeningReviewsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [statistics, setStatistics] = useState({
    totalProposals: 0,
    approved: 0,
    underReview: 0,
    drafts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const mapToProposalRow = (
    proposal: ManagedProposalQueueItem,
  ): ProposalRow => ({
    ...proposal,
    organizationName: proposal.Organization?.name || "—",
    unitName: proposal.Unit?.name || "—",
    officeName: proposal.receivingOffice?.name || "—",
    createdByName: proposal.createdBy
      ? [proposal.createdBy.firstName, proposal.createdBy.lastName]
          .filter(Boolean)
          .join(" ") ||
        proposal.createdBy.email ||
        "—"
      : "—",
    thematicAreaLabel: proposal.thematicAreas?.[0]?.name || "—",
    shortAbstractText: proposal.shortAbstract
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  });

  useEffect(() => {
    async function loadProposals() {
      setIsLoading(true);
      try {
        const response = await getManagedProposals({
          page: 1,
          limit: 100,
        });

        setProposals(response.data.map(mapToProposalRow));
        setStatistics({
          totalProposals:
            response.meta?.statistics?.totalProposals ??
            response.meta?.total ??
            response.data.length,
          approved: response.meta?.statistics?.approved ?? 0,
          underReview: response.meta?.statistics?.underReview ?? 0,
          drafts: response.meta?.statistics?.drafts ?? 0,
        });
      } catch (error) {
        console.error("Failed to load proposals for screening:", error);
        setProposals([]);
        setStatistics({
          totalProposals: 0,
          approved: 0,
          underReview: 0,
          drafts: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProposals();
  }, []);

  const stats = [
    {
      label: "Total Proposals",
      value: statistics.totalProposals,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50/50",
    },
    {
      label: "Approved",
      value: statistics.approved,
      icon: ClipboardCheck,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    {
      label: "Under Review",
      value: statistics.underReview,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
    },
    {
      label: "Drafts",
      value: statistics.drafts,
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
        <span className="font-bold text-primary">
          {row.original.referenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Proposal Title",
      cell: ({ row }) => (
        <div className="max-w-100">
          <p className="font-semibold text-sm line-clamp-1">
            {row.original.title}
          </p>
          <div className="flex items-center gap-2 mt-1  ">
            <span className="text-[10px] text-muted-foreground whitespace-pre-line break-word ">
              <HtmlContentRenderer content={row.original.shortAbstract} />
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdByName",
      header: "Submitted By",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.createdByName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "receivingOffice",
      header: "Receiving Office",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground  whitespace-pre-line break-word">
          {row.original.officeName}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config =
          statusConfig[row.original.status] || statusConfig.submitted;
        const Icon = config.icon;
        return (
          <Badge
            variant={config.variant}
            className="gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase"
          >
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
          {row.original.submittedAt
            ? new Date(row.original.submittedAt).toLocaleDateString()
            : "Pending"}
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
              <Link
                href={`/research/proposals/screening-reviews/${row.original.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Proposal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-emerald-600 font-medium">
              <Link
                href={`/research/proposals/screening-reviews/${row.original.id}/review`}
              >
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
      description="Perform initial administrative screening and compliance checks on the manager queue."
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
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      stat.bg.replace("/50", ""),
                    )}
                  />
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
            <Skeleton className="h-125 w-full rounded-xl" />
          ) : (
            <DataTable
              columns={columns}
              data={proposals}
              searchKey="title"
              searchPlaceholder="Search by proposal title, office, or organization..."
              filterOptions={[
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { value: "submitted", label: "Awaiting Screening" },
                    { value: "screening_under_review", label: "In Review" },
                    {
                      value: "screening_approved",
                      label: "Screening Approved",
                    },
                    {
                      value: "screening_rejected",
                      label: "Screening Rejected",
                    },
                  ],
                },
              ]}
              onRowClick={(row) =>
                router.push(`/research/proposals/screening-reviews/${row.id}`)
              }
              emptyMessage="No proposals found for screening"
              emptyDescription="All submitted proposals have been processed."
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
