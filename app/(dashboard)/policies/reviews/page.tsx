"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  RefreshCw,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  Eye,
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
import { PageContainer } from "@/components/layout";
import { DataTable, StatusBadge } from "@/components/shared";
import { POLICY_TYPES, POLICY_STATUSES } from "@/lib/constants";
import type { PolicyStatus, PolicyType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PolicyReview {
  id: string;
  title: string;
  type: PolicyType;
  submitter: {
    firstName: string;
    lastName: string;
    image?: string;
  };
  institution: string;
  submissionDate: string;
  deadline: string;
  status: PolicyStatus;
  priority: "low" | "medium" | "high";
  versionNumber?: string;
}

const mockReviews: PolicyReview[] = [
  {
    id: "PR-2024-001",
    title: "National Digital Education Strategy 2024-2030",
    type: "strategy",
    submitter: { firstName: "Solomon", lastName: "Ayele" },
    institution: "MoE - ICT Directorate",
    submissionDate: "2024-05-01",
    deadline: "2024-05-15",
    status: "submitted",
    priority: "high",
    versionNumber: "v1.0.0",
  },
  {
    id: "PR-2024-002",
    title: "Standard Operating Procedures for Rural Schools",
    type: "protocol",
    submitter: { firstName: "Tigist", lastName: "G/Michael" },
    institution: "Regional Education Bureau",
    submissionDate: "2024-04-28",
    deadline: "2024-05-12",
    status: "under_review",
    priority: "medium",
    versionNumber: "v1.2.1",
  },
  {
    id: "PR-2024-003",
    title: "Teacher Professional Development Framework",
    type: "guideline",
    submitter: { firstName: "Kebede", lastName: "Kassaye" },
    institution: "AAU - College of Education",
    submissionDate: "2024-04-25",
    deadline: "2024-05-10",
    status: "approved",
    priority: "medium",
    versionNumber: "v2.0.0",
  },
  {
    id: "PR-2024-004",
    title: "Inclusive Education Policy Amendment",
    type: "policy",
    submitter: { firstName: "Sara", lastName: "Mohammed" },
    institution: "Special Needs Department",
    submissionDate: "2024-04-20",
    deadline: "2024-05-05",
    status: "revision_requested",
    priority: "high",
    versionNumber: "v1.0.3",
  },
];

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600 border-blue-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-600 border-orange-200" },
};

const columns: ColumnDef<PolicyReview>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Policy Document
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const review = row.original;
      return (
        <div className="flex flex-col gap-1.5 py-2 min-w-[280px]">
          <Link
            href={`/policies/reviews/${review.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-2"
            onClick={(e) => e.stopPropagation()}
          >
            {review.title}
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-5 px-2 font-semibold uppercase tracking-wider border",
                priorityConfig[review.priority].color
              )}
            >
              {priorityConfig[review.priority].label} Priority
            </Badge>
          </div>
        </div>
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
  },
  {
    accessorKey: "submitter",
    header: () => <span className="ml-4">Submitter</span>,
    cell: ({ row }) => {
      const author = row.original.submitter;
      const institution = row.original.institution;
      const initials = `${author.firstName?.[0] || ""}${author.lastName?.[0] || ""}`.toUpperCase();
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border/50">
            <AvatarImage src={author.image} alt={`${author.firstName} ${author.lastName}`} />
            <AvatarFallback className="text-[11px] font-bold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">
              {author.firstName} {author.lastName}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 line-clamp-1 max-w-[150px]">
              {institution}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "submissionDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Dates
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const review = row.original;
      return (
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Submitted: {new Date(review.submissionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Due: {new Date(review.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
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
      return (
        <div className="flex items-center">
          <StatusBadge type="policy" status={status} />
        </div>
      );
    },
  },
  {
    accessorKey: "versionNumber",
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
      const version = row.getValue("versionNumber") as string;
      return (
        <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20">
          {version || "v1.0.0"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const review = row.original;

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
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted/50" />
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/reviews/${review.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {review.status !== "approved" && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/policies/reviews/${review.id}`}
                    className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Start Review
                  </Link>
                </DropdownMenuItem>
              )}
              {review.priority === "high" && review.status !== "approved" && (
                <>
                  <DropdownMenuSeparator className="bg-muted/50" />
                  <DropdownMenuItem className="cursor-pointer text-primary font-semibold flex items-center px-2 py-2 text-sm rounded-md focus:bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Fast Track
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function PolicyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PolicyReview[]>(mockReviews);
  const [isLoading, setIsLoading] = useState(false);

  const stats = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter((r) => r.status === "submitted").length,
      inReview: reviews.filter((r) => r.status === "under_review").length,
      completed: reviews.filter((r) => r.status === "approved" || r.status === "published").length,
    };
  }, [reviews]);

  return (
    <PageContainer
      title="Policy Reviews"
      description="Manage and evaluate submitted policy documents and drafts."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary/80">
              Total Reviews
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Assigned to you
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-100/50 bg-orange-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600/80">
              Pending
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.pending}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Awaiting review start
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-100/50 bg-blue-50/10">
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
              Currently evaluating
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100/50 bg-green-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600/80">
              Completed
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.completed}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Successfully reviewed
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
        ) : reviews.length > 0 ? (
          <DataTable
            columns={columns}
            data={reviews}
            searchKey="title"
            searchPlaceholder="Search by ID or title..."
            onRowClick={(review) =>
              router.push(`/policies/reviews/${review.id}`)
            }
            filterOptions={[
              {
                key: "type",
                label: "Type",
                options: Object.entries(POLICY_TYPES).map(([value, { label }]) => ({
                  value,
                  label,
                })),
              },
              {
                key: "status",
                label: "Status",
                options: Object.entries(POLICY_STATUSES).map(([value, { label }]) => ({
                  value,
                  label,
                })),
              },
            ]}
          />
        ) : (
          <Empty className="py-24 border-dashed">
            <EmptyMedia variant="icon">
              <FileCheck className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No reviews found</EmptyTitle>
              <EmptyDescription>
                You don't have any pending policy reviews at the moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
