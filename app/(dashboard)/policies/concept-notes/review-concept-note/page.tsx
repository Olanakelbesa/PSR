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
  Clock,
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
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared";
import { useAuth } from "@/hooks/useAuth";
import { useMyReviews } from "@/lib/queries/concept-notes";
import type { ConceptNoteItem } from "@/lib/queries/concept-notes";
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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:              { label: "Draft",               className: "bg-slate-100 text-slate-600 border-slate-200" },
  submitted:          { label: "Submitted",           className: "bg-blue-100 text-blue-700 border-blue-200" },
  under_review:       { label: "Under Review",        className: "bg-amber-100 text-amber-700 border-amber-200" },
  accepted:           { label: "Accepted",            className: "bg-green-100 text-green-700 border-green-200" },
  partially_accepted: { label: "Partially Accepted",  className: "bg-orange-100 text-orange-700 border-orange-200" },
  not_accepted:       { label: "Not Accepted",        className: "bg-red-100 text-red-700 border-red-200" },
  revision_required:  { label: "Revision Required",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  resubmitted:        { label: "Resubmitted",         className: "bg-purple-100 text-purple-700 border-purple-200" },
  policy_draft_ready: { label: "Policy Draft Ready",  className: "bg-teal-100 text-teal-700 border-teal-200" },
};

const columns: ColumnDef<ConceptNoteItem>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const note = row.original;
      return (
        <div className="flex flex-col gap-1 py-2 min-w-[100px]">
          <Link
            href={`/policies/concept-notes/review-concept-note/${note.id}`}
            className="font-bold text-[15px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {note.title}
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-sm">
            {note.executiveSummary || "No summary provided."}
          </p>
        </div>
      );
    },
  },
  {
    id: "doc_type",
    accessorKey: "docType.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Type
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const docType = row.original.docType;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shadow-sm ring-1 ring-border/50">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-medium text-foreground">
            {docType?.name || "Concept Note"}
          </span>
        </div>
      );
    },
  },
  {
    id: "organization",
    accessorKey: "organization.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Organization
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const organization = row.original.organization;
      return (
        <div className="flex items-center">
          <span className="text-[13px] font-medium text-foreground">
            {organization?.name || "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "unit",
    accessorKey: "unit.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Unit
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const unit = row.original.unit;
      return (
        <div className="flex items-center">
          <span className="text-[13px] font-medium text-foreground">
            {unit?.name || "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "currentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Status
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.currentStatus;
      const cfg = STATUS_CONFIG[status || ""] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
      return (
        <div className="flex items-center">
          <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 ${cfg.className}`}>
            {cfg.label}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "version",
    accessorKey: "versionNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Version
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const version = row.original.versionNumber;
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20"
        >
          {version || "v1.0.0"}
        </Badge>
      );
    },
  },
  {
    id: "submitted_by",
    accessorKey: "submittedBy.fullName",
    header: () => <span className="ml-4">Submitted by</span>,
    cell: ({ row }) => {
      const author = row.original.submittedBy;
      if (!author) return <span className="text-muted-foreground">—</span>;
      const initials = author.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border/50">
            {author.photoUrl && (
              <AvatarImage
                src={author.photoUrl}
                alt={author.fullName}
              />
            )}
            <AvatarFallback className="text-[11px] font-bold bg-muted text-muted-foreground">
              {initials || "CN"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">
              {author.fullName}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "submissionDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent"
      >
        Created
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.submissionDate;
      return (
        <div className="flex items-center gap-2 text-muted-foreground/80">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-[13px] font-medium">
            {date ? new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) : "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const note = row.original;

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
                  href={`/policies/concept-notes/review-concept-note/${note.id}`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/policies/concept-notes/review-concept-note/${note.id}/review`}
                  className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                >
                  Review
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function ConceptNotesPage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  
  const { data, isLoading } = useMyReviews({}, backendToken);
  
  const notes = useMemo(() => data?.data || [], [data]);

  const stats = useMemo(() => {
    return {
      total: notes.length,
      draft: notes.filter((n) => n.currentStatus === "draft").length,
      review: notes.filter((n) =>
        ["submitted", "under_review"].includes(n.currentStatus || ""),
      ).length,
      approved: notes.filter((n) =>
        ["accepted", "partially_accepted", "policy_draft_ready"].includes(n.currentStatus || ""),
      ).length,
    };
  }, [notes]);

  return (
    <PageContainer
      title="My Reviews"
      description="Access and evaluate policy concept notes assigned to you for technical review."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary/80">
              Total Assigned
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              In your evaluation pool
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-100/50 bg-orange-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600/80">
              In Draft
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.draft}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Pending submission
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-100/50 bg-blue-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600/80">
              Under Review
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stats.review}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Active evaluation
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100/50 bg-green-50/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600/80">
              Approved / Draft Ready
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
              Completed assessments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 w-full max-w-full overflow-hidden">
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
        ) : notes.length > 0 ? (
          <DataTable
            columns={columns}
            data={notes}
            searchKey="title"
            searchPlaceholder="Search concept notes..."
            onRowClick={(note) =>
              router.push(`/policies/concept-notes/review-concept-note/${note.id}`)
            }
            filterOptions={[
              {
                key: "docType.name",
                label: "Type",
                options: Array.from(new Set(notes.map((n) => n.docType?.name).filter(Boolean))).map(
                  (name) => ({
                    value: name as string,
                    label: name as string,
                  })
                ),
              },
              {
                key: "currentStatus",
                label: "Status",
                options: Object.entries(STATUS_CONFIG).map(
                  ([value, { label }]) => ({
                    value,
                    label,
                  }),
                ),
              },
            ]}
          />
        ) : (
          <Empty className="py-24 border-dashed">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No assigned reviews</EmptyTitle>
              <EmptyDescription>
                You do not currently have any policy concept notes assigned to you for technical review.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
