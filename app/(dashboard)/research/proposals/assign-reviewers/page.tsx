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
  CheckCircle2,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { getScreenings, type Screening } from "@/api/services";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type ScreeningRow = Screening & {
  proposalId: string;
  referenceNumber: string;
  proposalTitle: string;
  organizationName: string;
  unitName: string;
  officeName: string;
  createdByName: string;
  thematicAreaLabel: string;
  shortAbstractText: string;
  submittedAt?: string;
};

export default function AssignReviewersPage() {
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { hasPermission } = useCurrentUser();

  const formatProposalReference = (id: string | number) =>
    String(id)
      .replace(/^prop-/i, "PRP-")
      .toUpperCase();

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const getCreatedByName = (proposal: ScreeningRow["proposal"]) => {
    const createdBy = proposal.createdBy;
    if (!createdBy) return "—";
    return (
      [createdBy.firstName, createdBy.lastName].filter(Boolean).join(" ") ||
      createdBy.email ||
      "—"
    );
  };

  const stats = [
    {
      label: "Ready for Assignment",
      value: screenings.length,
      icon: CheckCircle2,
      color: "text-amber-600",
      bg: "bg-amber-50/50",
    },
    {
      label: "With Reviewers",
      value: screenings.filter(
        (screening) => screening.assignedReviewersPresent,
      ).length,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    {
      label: "Awaiting Reviewers",
      value: screenings.filter(
        (screening) =>
          !screening.assignedReviewersPresent ||
          screening.assignedReviewersCount === 0,
      ).length,
      icon: UserPlus,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
    },
    {
      label: "Total Assigned",
      value: screenings.reduce(
        (total, screening) => total + (screening.assignedReviewersCount || 0),
        0,
      ),
      icon: Users,
      color: "text-slate-600",
      bg: "bg-slate-50/50",
    },
  ];

  useEffect(() => {
    loadScreenings();
  }, []);

  const loadScreenings = async () => {
    setLoading(true);
    try {
      const response = await getScreenings({
        status: "screening_approved",
        limit: 100,
      });

      const readyForAssignment = response.data
        .filter((screening) => screening.status === "screening_approved")
        .map((screening) => {
          const proposal = screening.proposal as any;
          return {
            ...screening,
            proposalId: String(proposal?.id ?? screening.id),
            referenceNumber:
              proposal?.referenceNumber ||
              formatProposalReference(proposal?.id ?? screening.id),
            proposalTitle: proposal?.title || "Untitled Proposal",
            organizationName: proposal?.Organization?.name || "—",
            unitName: proposal?.Unit?.name || "—",
            officeName: proposal?.receivingOffice?.name || "—",
            createdByName: getCreatedByName(proposal),
            thematicAreaLabel: proposal?.thematicAreas?.[0]?.name || "—",
            shortAbstractText: stripHtml(proposal?.shortAbstract || ""),
            submittedAt:
              proposal?.submittedAt || screening.createdAt || undefined,
          } satisfies ScreeningRow;
        });

      setScreenings(readyForAssignment);
    } catch (error) {
      console.error("Failed to load screenings:", error);
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
          {row.original.referenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Proposal Title",
      cell: ({ row }: any) => (
        <div className="max-w-100">
          <div className="font-medium truncate">
            {row.original.proposalTitle}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {row.original.shortAbstractText || row.original.thematicAreaLabel}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdByName",
      header: "Submitted By",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {row.original.createdByName
              .split(" ")
              .filter(Boolean)
              .map((part: string) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "U"}
          </div>
          <span className="text-sm">{row.original.createdByName}</span>
        </div>
      ),
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      cell: ({ row }: any) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.organizationName}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.unitName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "assignedReviewersCount",
      header: "Reviewers",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span
            className={`text-sm font-medium ${row.original.assignedReviewersCount < 2 ? "text-amber-600" : "text-emerald-600"}`}
          >
            {row.original.assignedReviewersCount} Assigned
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <StatusBadge type="proposal" status={row.original.status} />
      ),
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
                  {hasPermission("policy_proposals.assign_reviewer") && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/research/proposals/assign-reviewers/${String(row.original.id)}/assign`}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="size-4" />
                        Assign Reviewers
                      </Link>
                    </DropdownMenuItem>
                  )}
            <DropdownMenuItem asChild>
              <Link
                href={`/research/proposals/${String(row.original.proposalId)}`}
                className="flex items-center gap-2"
              >
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
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="group relative overflow-hidden border-none shadow-md"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-slate-200" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all"
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      stat.bg.replace("/50", ""),
                    )}
                  />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs tracking-widest text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={cn("size-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="space-y-6">
          <DataTable
            columns={columns}
            onRowClick={(row) => {
              router.push(
                `/research/proposals/assign-reviewers/${String(row.id)}`,
              );
            }}
            data={screenings.filter(
              (p) =>
                p.proposalTitle
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                p.createdByName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()),
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
      </div>
    </PageContainer>
  );
}
