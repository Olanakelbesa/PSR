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
  Plus,
  Activity,
  AlertCircle,
  CheckCircle2,
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
import { cn } from "@/lib/utils";
import { usePolicyDrafts, type PolicyDraftItem } from "@/lib/queries/policy-drafts";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { useAuth } from "@/hooks/useAuth";

const columns: ColumnDef<PolicyDraftItem>[] = [
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
        <div className="flex flex-col gap-1 py-2 min-w-[280px] max-w-[400px]">
          <Link
            href={`/policies/drafts/my-drafts/${policy.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-2"
            onClick={(e) => e.stopPropagation()}
          >
            {policy.title}
          </Link>
          {policy.conceptNote && (
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              Source CN: {policy.conceptNote.title}
            </p>
          )}
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
        className="h-8 font-semibold hover:bg-transparent"
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
          className="text-[11px] font-medium bg-muted/50 text-muted-foreground"
        >
          {docType?.name || "Strategy/Framework"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedBy",
    header: () => <span className="ml-4 font-semibold">Proposer</span>,
    cell: ({ row }) => {
      const author = row.original.submittedBy;
      if (!author) {
        return <span className="text-muted-foreground text-[12px] ml-4 font-medium italic">Pending</span>;
      }
      return (
        <div className="flex items-center gap-2 ml-4">
          <Avatar className="h-8 w-8 border shadow-sm">
            {author.photoUrl && (
              <AvatarImage src={resolveFileUrl(author.photoUrl) ?? undefined} alt={author.fullName} />
            )}
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {author.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden max-w-[120px]">
            <span className="text-xs font-semibold text-foreground truncate">{author.fullName}</span>
            <span className="text-[9px] text-muted-foreground truncate">{row.original.organization?.name || "PSR Council"}</span>
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
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent px-0"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.currentStatus;
      const display = row.original.currentStatusDisplay || status;
      
      const badgeStyles: Record<string, string> = {
        draft: "bg-slate-100 text-slate-700 border-slate-200",
        submitted: "bg-blue-100 text-blue-700 border-blue-200",
        under_review: "bg-amber-100 text-amber-700 border-amber-200",
        review_completed: "bg-purple-100 text-purple-700 border-purple-200",
        psr_approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        repository_registered: "bg-green-100 text-green-700 border-green-200",
        resubmission_required: "bg-yellow-100 text-yellow-700 border-yellow-200",
        resubmitted: "bg-indigo-100 text-indigo-700 border-indigo-200",
      };

      const classes = badgeStyles[status] || "bg-slate-100 text-slate-700 border-slate-200";

      return (
        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 whitespace-nowrap", classes)}>
          {display}
        </Badge>
      );
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
                  href={`/policies/drafts/my-drafts/${policy.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/drafts/my-drafts/${policy.id}/edit`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted/50" />
              <DropdownMenuItem className="text-destructive font-medium flex items-center px-2 py-2 text-sm rounded-md focus:bg-destructive/10">
                <Trash className="h-4 w-4 mr-2 text-destructive " />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

const typeOptions = [
  { value: "Strategy/Framework", label: "Strategy/Framework" },
  { value: "Guideline/Manual", label: "Guideline/Manual" },
  { value: "Policy Brief", label: "Policy Brief" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "review_completed", label: "Review Completed" },
  { value: "psr_approved", label: "PSR Approved" },
  { value: "repository_registered", label: "Registered in Repository" },
  { value: "resubmission_required", label: "Resubmission Required" },
  { value: "resubmitted", label: "Resubmitted" },
];

export default function PolicyDraftsPage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const { data: policies = [], isLoading } = usePolicyDrafts(
    undefined,
    backendToken,
  );

  const stats = useMemo(() => {
    return {
      total: policies.length,
      inReview: policies.filter((p) => p.currentStatus === "under_review").length,
      revisions: policies.filter((p) => p.currentStatus === "resubmission_required").length,
      approved: policies.filter((p) => ["psr_approved", "repository_registered"].includes(p.currentStatus)).length,
    };
  }, [policies]);

  return (
    <PageContainer
      title="Policy Drafts"
      description="Manage comprehensive policy drafts, assign expert reviewers, and monitor checklist scoring."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild className="shadow-sm">
            <Link href="/policies/drafts/my-drafts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Draft
            </Link>
          </Button>
        </div>
      }
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
            onRowClick={(policy) => router.push(`/policies/drafts/my-drafts/${policy.id}`)}
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
              <EmptyTitle>No drafts found</EmptyTitle>
              <EmptyDescription>
                There are no policy drafts in the development pipeline.
              </EmptyDescription>
              <Button asChild className="mt-4 w-full">
                <Link href="/policies/drafts/my-drafts/new">
                  Create a new draft
                </Link>
              </Button>
            </EmptyHeader>  
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
