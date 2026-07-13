"use client";

import { useMemo } from "react";
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
import { DataTable } from "@/components/shared";
import { usePolicyDraftsManage } from "@/lib/queries/policy-drafts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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


const statusOptions = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "review_completed", label: "Review Completed" },
  { value: "psr_approved", label: "PSR Approved" },
  { value: "repository_registered", label: "Registered in Repository" },
  { value: "resubmission_required", label: "Revision Requested" },
  { value: "resubmitted", label: "Resubmitted" },
];

export default function PolicyDraftsPage() {
  const router = useRouter();

  const { data: manageResponse, isLoading } = usePolicyDraftsManage();
  const policies = manageResponse?.data || [];
  const { hasPermission } = useCurrentUser();

  const columns: ColumnDef<any>[] = [
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
              href={`/policies/drafts/manage-drafts/${policy.id}`}
              className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-2"
              onClick={(e) => e.stopPropagation()}
            >
              {policy.title}
            </Link>
            <p className="text-[12px] text-muted-foreground line-clamp-1">
              {policy.organization?.name || "Department of Health Policy"}
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
          className="h-8 font-semibold hover:bg-transparent"
        >
          Version
          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => {
        const versionNumber = row.getValue("versionNumber") as string;
        return (
          <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20">
            {versionNumber || "V1"}
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
            {docType?.name || "Policy"}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === row.original.docType?.name;
      },
    },
    {
      accessorKey: "submittedBy",
      header: () => <span className="ml-4 font-semibold">Submitted By</span>,
      cell: ({ row }) => {
        const submitter = row.original.submittedBy;
        if (!submitter) {
          return <span className="text-muted-foreground text-[12px] ml-4 font-medium italic">Anonymous</span>;
        }
        return (
          <div className="flex items-center gap-2 ml-4">
            <Avatar className="h-8 w-8 border shadow-sm ring-1 ring-border/50">
              <AvatarImage src={submitter.photoUrl || undefined} />
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                {submitter.fullName?.split(" ").map((n: string) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-tight">{submitter.fullName}</span>
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
        const status = row.original.currentStatus;
        const display = row.original.currentStatusDisplay || status;

        let badgeStyles = "bg-slate-100 text-slate-800 border-slate-200/50 hover:bg-slate-100";
        if (["submitted", "resubmitted"].includes(status)) {
          badgeStyles = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
        } else if (["under_review", "review_completed"].includes(status)) {
          badgeStyles = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
        } else if (status === "psr_approved") {
          badgeStyles = "bg-green-50 text-green-700 border-green-200 hover:bg-green-50";
        } else if (status === "repository_registered") {
          badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";
        } else if (status === "resubmission_required") {
          badgeStyles = "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50";
        }

        return (
          <Badge variant="outline" className={`font-semibold text-xs py-0.5 px-2.5 rounded-full ${badgeStyles}`}>
            {display}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === row.original.currentStatus;
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
                    href={`/policies/drafts/manage-drafts/${policy.id}`}
                    className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {hasPermission("policy_development.assign_reviewer") && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/policies/drafts/manage-drafts/${policy.id}/assign`}
                      className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign Reviewers
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/policies/drafts/manage-drafts/${policy.id}/approve`}
                    className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

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
              Accepted
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
            onRowClick={(policy) => router.push(`/policies/drafts/manage-drafts/${policy.id}`)}
            filterOptions={[
              {
                key: "docType",
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
