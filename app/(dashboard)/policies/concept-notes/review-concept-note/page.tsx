"use client";

import { useEffect, useState, useMemo } from "react";
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
import { conceptNoteApi } from "@/lib/api/client";
import { POLICY_TYPES, POLICY_STATUSES } from "@/lib/constants";
import type { ConceptNote, PolicyStatus, PolicyType } from "@/lib/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

const columns: ColumnDef<ConceptNote>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
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
            href={`/policies/concept-notes//${note.id}`}
            className="font-bold text-[15px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {note.title}
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line break-words min-w-[100px]">
  {note.background}
</p>
        </div>
      );
    },
  },
  {
    id: "policy_type",
    accessorKey: "policyType",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Type
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("policyType") as PolicyType;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shadow-sm ring-1 ring-border/50">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-medium text-foreground">
            {POLICY_TYPES[type]?.label}
          </span>
        </div>
      );
    },
  },
  {
    id: "organization",
    accessorKey: "createdBy.institution",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Organization
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const organization = row.original.createdBy?.institution;
      return (
        <div className="flex items-center">
          <span className="text-[13px] font-medium text-foreground">
            {organization || "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "unit",
    accessorKey: "createdBy.department",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Unit
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const unit = row.original.createdBy?.department;
      return (
        <div className="flex items-center">
          <span className="text-[13px] font-medium text-foreground">
            {unit || "—"}
          </span>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Status
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
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
    id: "version",
    accessorKey: "version",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Version
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const version = row.getValue("version") as string;
      return (
        <Badge
          variant="outline"
          className="font-mono text-[10px] bg-muted/50 border-muted-foreground/20"
        >
          {version ? `v${version}` : "v1.0.0"}
        </Badge>
      );
    },
  },
  {
    id: "submitted_by",
    accessorKey: "createdBy",
    header: () => <span className="ml-4">Submitted by</span>,
    cell: ({ row }) => {
      const author = row.original.createdBy;
      const initials =
        `${author.firstName?.[0] || ""}${author.lastName?.[0] || ""}`.toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border/50">
            <AvatarImage
              src={author.image}
              alt={`${author.firstName} ${author.lastName}`}
            />
            <AvatarFallback className="text-[11px] font-bold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">
              {author.firstName} {author.lastName}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Created
        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return (
        <div className="flex items-center gap-2 text-muted-foreground/80">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-[13px] font-medium">
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
  const [notes, setNotes] = useState<ConceptNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await conceptNoteApi.getConceptNotes(
        {},
        { page: 1, pageSize: 100 },
      );
      setNotes(response.data);
    } catch (error) {
      console.error("Failed to load concept notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const stats = useMemo(() => {
    return {
      total: notes.length,
      draft: notes.filter((n) => n.status === "draft").length,
      review: notes.filter((n) =>
        ["submitted", "under_review"].includes(n.status),
      ).length,
      approved: notes.filter((n) => n.status === "approved").length,
    };
  }, [notes]);

  return (
    <PageContainer
      title="Concept Notes"
      description="Develop and refine initial policy ideas before formal drafting."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild className="shadow-sm">
            <Link href="/policies/concept-notes/my-concept-note/new">
              <Plus className="mr-2 h-4 w-4" />
              New Concept Note
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary/80">
              Total Notes
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
              Across all categories
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
              Requiring attention
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100/50 bg-green-50/10">
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
              Ready for next stage
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
                key: "policyType",
                label: "Type",
                options: Object.entries(POLICY_TYPES).map(
                  ([value, { label }]) => ({
                    value,
                    label,
                  }),
                ),
              },
              {
                key: "status",
                label: "Status",
                options: Object.entries(POLICY_STATUSES).map(
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
              <EmptyTitle>No concept notes found</EmptyTitle>
              <EmptyDescription>
                You haven't created any concept notes yet. Get started by
                creating a new one.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/policies/concept-notes/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Note
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
