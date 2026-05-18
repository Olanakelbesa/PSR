"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  Eye,
  FileEdit,
  ClipboardCheck,
  Plus,
  Activity,
  AlertCircle,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { DataTable, StatusBadge } from "@/components/shared";
import { policyApi } from "@/api/client";
import { POLICY_TYPES, POLICY_STATUSES } from "@/lib/constants";
import type { PolicyDocument, PolicyStatus, PolicyType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<PolicyDocument>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent px-0"
      >
        Draft Document
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const policy = row.original;
      return (
        <div className="flex flex-col gap-1.5 py-2 min-w-[280px] max-w-[400px]">
          <Link
            href={`/policies/drafts/${policy.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-2"
            onClick={(e) => e.stopPropagation()}
          >
            {policy.title}
          </Link>
          <p className="text-[12px] text-muted-foreground line-clamp-1">
            {policy.description}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "version",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Version
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const version = row.getValue("version") as string;
      return (
        <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20">
          v{version || "1.0.0"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as PolicyType;
      return (
        <Badge
          variant="outline"
          className="text-[11px] font-medium bg-muted/50 text-muted-foreground"
        >
          {POLICY_TYPES[type]?.label || type}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id);
    },
  },
  {
    accessorKey: "assignedReviewers",
    header: () => <span className="ml-4 font-semibold">Expert Reviewers</span>,
    cell: ({ row }) => {
      const reviewers = row.original.assignedReviewers;
      if (!reviewers || reviewers.length === 0) {
        return <span className="text-muted-foreground text-[12px] ml-4 font-medium italic">Pending Assignment</span>;
      }
      return (
        <div className="flex -space-x-2 ml-4">
          {reviewers.slice(0, 3).map((reviewer) => (
            <Avatar key={reviewer.id} className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border/50">
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                {reviewer.firstName?.[0]}
                {reviewer.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          ))}
          {reviewers.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border-2 border-background shadow-sm ring-1 ring-border/50 text-muted-foreground">
              +{reviewers.length - 3}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string;
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as PolicyStatus;
      return <StatusBadge type="policy" status={status} />;
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const policy = row.original;

      return (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted/80 rounded-full"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[180px] p-1 shadow-xl border-muted-foreground/20"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5 font-normal uppercase tracking-wider">
                Draft Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted/50" />
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/drafts/review-draft/${policy.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/drafts/review-draft/${policy.id}/review`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Review
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted/50" />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

const typeOptions = Object.entries(POLICY_TYPES).map(([value, { label }]) => ({
  value,
  label,
}));

const statusOptions = [
  { value: "draft", label: "Drafting" },
  { value: "under_review", label: "Under Review" },
  { value: "revision_requested", label: "Revision Requested" },
  { value: "approved", label: "Approved" },
];

export default function PolicyDraftsPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const response = await policyApi.getPolicies({}, { page: 1, pageSize: 100 });
        // Filter to show drafts and draft review statuses
        const drafts = response.data.filter((p: PolicyDocument) =>
          ["draft", "under_review", "revision_requested", "approved"].includes(p.status)
        );
        setPolicies(drafts);
      } catch (error) {
        console.error("Failed to load policies:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const stats = useMemo(() => {
    return {
      total: policies.length,
      inReview: policies.filter((p) => p.status === "under_review").length,
      revisions: policies.filter((p) => p.status === "revision_requested").length,
      approved: policies.filter((p) => p.status === "approved").length,
    };
  }, [policies]);

  return (
    <PageContainer
      title="Policy Drafts"
      description="Manage comprehensive policy drafts, assign expert reviewers, and monitor checklist scoring."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary/80">
              Total Drafts
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileEdit className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              In development pipeline
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-100/50 bg-blue-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600/80">
              In Review
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.inReview}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Currently scoring
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-100/50 bg-orange-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600/80">
              Needs Revision
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.revisions}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Pending updates from proposer
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100/50 bg-green-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600/80">
              Ratified (Approved)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.approved}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Ready for repository
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-xl border p-6 space-y-6 bg-card">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-[300px]" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-[100px]" />
                <Skeleton className="h-9 w-[100px]" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : policies.length > 0 ? (
          <DataTable
            columns={columns}
            data={policies}
            searchKey="title"
            searchPlaceholder="Search draft documents..."
            onRowClick={(policy) => router.push(`/policies/drafts/review-draft/${policy.id}`)}
            filterOptions={[
              {
                key: "type",
                label: "Type",
                options: typeOptions,
              },
              {
                key: "status",
                label: "Status",
                options: statusOptions,
              },
            ]}
          />
        ) : (
          <Empty className="py-24 border-dashed">
            <EmptyMedia variant="icon">
              <FileEdit className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No drafts found</EmptyTitle>
              <EmptyDescription>
                There are no policy drafts in the development pipeline.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
