"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  Eye,
  FileEdit,
  ClipboardCheck,
  Activity,
  AlertCircle,
  CheckCircle2,
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
import { DataTable } from "@/components/shared";
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
import { usePolicyDraftsMyReviews } from "@/lib/queries/policy-drafts";
import { cn } from "@/lib/utils";

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent px-0 text-foreground"
      >
        Draft Document
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const policy = row.original;
      return (
        <div className="flex flex-col gap-1 py-1.5 min-w-[280px] max-w-[400px]">
          <Link
            href={`/policies/drafts/review-draft/${policy.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-2"
            onClick={(e) => e.stopPropagation()}
          >
            {policy.title}
          </Link>
          <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
            {policy.organization?.name || "Institution Partner"}
          </p>
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
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Version
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const version = row.getValue("versionNumber") as string;
      return (
        <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20 font-bold">
          {version || "PD-0001-V1"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "docType",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const docType = row.original.docType;
      return (
        <Badge
          variant="outline"
          className="text-[11px] font-semibold bg-primary/5 text-primary border-primary/10"
        >
          {docType?.name || "Policy"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const docTypeName = row.original.docType?.name;
      return docTypeName === value;
    },
  },
  {
    accessorKey: "submittedBy",
    header: () => <span className="font-semibold text-foreground">Proposer</span>,
    cell: ({ row }) => {
      const submitter = row.original.submittedBy;
      if (!submitter) return <span className="text-xs text-muted-foreground">-</span>;
      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 ring-1 ring-border shadow-sm">
            <AvatarImage src={submitter.photoUrl || undefined} />
            <AvatarFallback className="text-[9px] font-bold bg-primary/15 text-primary">
              {submitter.fullName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-none text-foreground">{submitter.fullName}</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{submitter.email}</span>
          </div>
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
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string;
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium font-sans">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/85" />
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
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent text-foreground"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("currentStatus") as string;
      const display = row.original.currentStatusDisplay || status;
      
      let badgeStyle = "bg-muted text-muted-foreground border-muted-foreground/10";
      if (["submitted", "resubmitted"].includes(status)) {
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400";
      } else if (["under_review", "review_completed"].includes(status)) {
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400";
      } else if (status === "psr_approved") {
        badgeStyle = "bg-green-50 text-green-700 border-green-200/60 dark:bg-green-950/30 dark:text-green-400";
      } else if (status === "repository_registered") {
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400";
      } else if (status === "resubmission_required") {
        badgeStyle = "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-400";
      }
      
      return (
        <Badge variant="outline" className={cn("font-semibold text-[11px] px-2.5 py-0.5 rounded-full capitalize shadow-sm", badgeStyle)}>
          {display.replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
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
                Review Actions
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
                  Evaluate Checklist
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

const statusOptions = [
  { value: "under_review", label: "Under Review" },
  { value: "review_completed", label: "Review Completed" },
  { value: "psr_approved", label: "Approved" },
  { value: "repository_registered", label: "Registered in Repository" },
  { value: "resubmission_required", label: "Revision Requested" },
];

export default function PolicyDraftsMyReviewsPage() {
  const router = useRouter();

  const { data: myReviewsResponse, isLoading } = usePolicyDraftsMyReviews();
  const policies = myReviewsResponse?.data || [];

  const typeOptions = useMemo(() => {
    const uniqueTypes = new Set<string>();
    policies.forEach((p: any) => {
      if (p.docType?.name) {
        uniqueTypes.add(p.docType.name);
      }
    });
    return Array.from(uniqueTypes).map((t) => ({
      value: t,
      label: t,
    }));
  }, [policies]);

  const stats = useMemo(() => {
    return {
      total: policies.length,
      inReview: policies.filter((p) => ["under_review", "review_completed"].includes(p.currentStatus)).length,
      revisions: policies.filter((p) => p.currentStatus === "resubmission_required").length,
      approved: policies.filter((p) => ["psr_approved", "repository_registered"].includes(p.currentStatus)).length,
    };
  }, [policies]);

  return (
    <PageContainer
      title="Assigned Policy Reviews"
      description="Evaluate assigned institutional policy drafts, score quality checklists, and submit official feedback."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary/80">
              Total Reviews
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileEdit className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium font-mono">
              Committee Assignment Queue
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-100/50 bg-blue-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600/80">
              In Progress
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
              Checklist under review
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
              Sent back to proposer
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100/50 bg-green-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600/80">
              Approved
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
              Committee evaluation approved
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
                key: "docType",
                label: "Type",
                options: typeOptions,
              },
              {
                key: "currentStatus",
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
              <EmptyTitle>No draft reviews found</EmptyTitle>
              <EmptyDescription>
                You have not been assigned to review any policy drafts at this moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
