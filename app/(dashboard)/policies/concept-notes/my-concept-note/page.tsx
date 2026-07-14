"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useConceptNotes,
  type ConceptNoteItem,
  useDeleteConceptNote,
  useSubmitConceptNote,
  useResubmitConceptNote,
} from "@/lib/queries/concept-notes";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ── Current Status config ─────────────────────────────────────────────────────
type ActionFilter = "all" | "needs_action" | "under_review" | "completed";

const ACTION_FILTER_COPY: Record<
  Exclude<ActionFilter, "all">,
  { banner: string; emptyTitle: string; emptyDescription: string; searchPlaceholder: string }
> = {
  needs_action: {
    banner: "Showing concept notes that need your action — drafts to submit or revisions to address.",
    emptyTitle: "No concept notes need action",
    emptyDescription: "All your concept notes are either submitted or completed.",
    searchPlaceholder: "Search concept notes needing action...",
  },
  under_review: {
    banner: "Showing concept notes waiting on reviewer or PSR decisions.",
    emptyTitle: "No concept notes under review",
    emptyDescription: "You have no concept notes currently in the review pipeline.",
    searchPlaceholder: "Search concept notes under review...",
  },
  completed: {
    banner: "Showing concept notes with final decisions — accepted, partially accepted, or policy draft ready.",
    emptyTitle: "No completed concept notes",
    emptyDescription: "You have no completed concept notes yet.",
    searchPlaceholder: "Search completed concept notes...",
  },
};

const STATUS_CONFIG: Record<
  ConceptNoteItem["currentStatus"],
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  under_review: {
    label: "Under Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  partially_accepted: {
    label: "Partially Accepted",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  not_accepted: {
    label: "Not Accepted",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  revision_required: {
    label: "Revision Required",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  policy_draft_ready: {
    label: "Policy Draft Ready",
    className: "bg-green-50 text-green-700 border-green-200",
  },
};

// columns are created inside the page component so hooks can be used in actions

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConceptNotesPage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useConceptNotes(
    { limit: 100 },
    backendToken,
  );

  const submitMutation = useSubmitConceptNote(backendToken);
  const resubmitMutation = useResubmitConceptNote(backendToken);
  const deleteMutation = useDeleteConceptNote();
  const [deleteCandidate, setDeleteCandidate] = useState<ConceptNoteItem | null>(null);

  const columns: ColumnDef<ConceptNoteItem>[] = useMemo(() => [
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
          <div className="flex flex-col gap-1 py-2  min-w-[160px] max-w-[340px]">
            <Link
              href={`/policies/concept-notes/my-concept-note/${note.id}`}
              className="font-bold text-[15px] leading-tight text-foreground hover:text-primary transition-colors whitespace-pre-wrap break-words"
              onClick={(e) => e.stopPropagation()}
            >
              {note.title}
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {note.executiveSummary}
            </p>
          </div>
        );
      },
    },
    {
      id: "docType",
      accessorFn: (row) => row.docType?.name ?? "",
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shadow-sm ring-1 ring-border/50">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-medium text-foreground">
            {row.original.docType?.name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "organization",
      accessorFn: (row) => row.organization?.name ?? "",
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
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <span className="text-[13px] font-medium text-foreground whitespace-pre-wrap break-words ">
            {row.original.organization?.name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "unit",
      accessorFn: (row) => row.unit?.name ?? "",
      header: "Unit",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <span className="text-[13px] font-medium text-foreground whitespace-pre-wrap break-words ">
            {row.original.unit?.name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "currentStatus",
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
        const s = row.original.currentStatus;
        const cfg = STATUS_CONFIG[s] ?? { label: s, className: "" };
        return (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold capitalize whitespace-nowrap",
              cfg.className,
            )}
          >
            {cfg.label}
          </Badge>
        );
      },
      filterFn: (row, _id, value) => row.original.currentStatus === value,
    },
    {
      id: "documentCategory",
      accessorKey: "documentCategory",
      header: "Category",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] capitalize",
            row.original.documentCategory === "revision"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-sky-50 text-sky-700 border-sky-200",
          )}
        >
          {row.original.documentCategory}
        </Badge>
      ),
    },
    {
      id: "version",
      accessorKey: "version",
      header: () => <span className="ml-4">Version</span>,
      cell: ({ row }) => {
        const version = row.original.versionNumber;
        if (!version)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">
                {version}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "submissionDate",
      accessorKey: "submissionDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 font-semibold hover:bg-transparent"
        >
          Submitted At
          <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.original.submissionDate;
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

        const handleSubmitClick = async () => {
          try {
            if (note.currentStatus === "revision_required" || note.documentCategory === "revision") {
              await resubmitMutation.mutateAsync({ id: note.id });
              toast.success("Concept note resubmitted for review.");
            } else {
              await submitMutation.mutateAsync(note.id);
              toast.success("Concept note submitted for review.");
            }
          } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to submit concept note.");
          }
        };

        const actionLabel =
          note.currentStatus === "revision_required" || note.documentCategory === "revision"
            ? "Resubmit for Review"
            : "Submit for Review";

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
                    href={`/policies/concept-notes/my-concept-note/${note.id}`}
                    className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                  >
                    View details
                  </Link>
                </DropdownMenuItem>
                {(note.currentStatus === "draft" || note.currentStatus === "revision_required") && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/policies/concept-notes/my-concept-note/edit/${note.id}`}
                      className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
                    >
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {note.currentStatus === "draft" && (
                  <>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    <DropdownMenuItem onClick={handleSubmitClick} className="text-primary font-semibold flex items-center px-2 py-2 text-sm rounded-md focus:bg-primary/10">
                      {actionLabel}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-muted/50" />
                <DropdownMenuItem
                  className="text-destructive font-medium flex items-center px-2 py-2 text-sm rounded-md focus:bg-destructive/10"
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteCandidate(note);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [resubmitMutation, submitMutation]);

  const notes = data?.data ?? [];
  const meta = data?.meta;

  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const backendStats = (meta as any)?.statistics;
  const stats = useMemo(
    () => ({
      total: backendStats?.totalConceptNote ?? meta?.total ?? notes.length,
      needsAction: backendStats?.needsAction ?? notes.filter((n) =>
        ["draft", "revision_required"].includes(n.currentStatus),
      ).length,
      underReview: (backendStats
        ? backendStats.newSubmissions + backendStats.underReview + backendStats.resubmitted
        : null) ?? notes.filter((n) =>
        ["submitted", "under_review", "resubmitted"].includes(n.currentStatus),
      ).length,
      completed: (backendStats?.approved ?? 0) + (backendStats?.notAccepted ?? 0) || notes.filter((n) =>
        ["accepted", "partially_accepted", "not_accepted", "policy_draft_ready"].includes(n.currentStatus),
      ).length,
    }),
    [backendStats, notes, meta],
  );

  const filteredNotes = useMemo(() => {
    if (actionFilter === "all") return notes;

    const filterMap: Record<string, string[]> = {
      needs_action: ["draft", "revision_required"],
      under_review: ["submitted", "under_review", "resubmitted"],
      completed: ["accepted", "partially_accepted", "not_accepted", "policy_draft_ready"],
    };

    const allowedStatuses = filterMap[actionFilter] || [];
    return notes.filter((n) => allowedStatuses.includes(n.currentStatus));
  }, [notes, actionFilter]);

  const applyActionFilter = (filter: ActionFilter) => {
    setActionFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    actionFilter === "all" ? null : ACTION_FILTER_COPY[actionFilter];

  const statusFilterOptions = Object.entries(STATUS_CONFIG).map(
    ([value, { label }]) => ({
      value,
      label,
    }),
  );

  const statCards: Array<{
    key: ActionFilter;
    label: string;
    value: number;
    icon: React.ReactNode;
    iconBg: string;
    border: string;
    activeRing: string;
    sub: string;
  }> = [
    {
      key: "all",
      label: "Total Concept Notes",
      value: stats.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "Across all categories",
    },
    {
      key: "needs_action",
      label: "Needs Action",
      value: stats.needsAction,
      icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
      iconBg: "bg-orange-100",
      border: "border-orange-100/50 bg-orange-50/10",
      activeRing: "ring-orange-500/60 border-orange-300",
      sub: "Drafts to submit or revisions to address",
    },
    {
      key: "under_review",
      label: "Under Review",
      value: stats.underReview,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Waiting on reviewer decisions",
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completed,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "Accepted or policy draft ready",
    },
  ];

  return (
    <PageContainer
      title="Concept Notes"
      description="Develop and refine initial policy ideas before formal drafting."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/policies/concept-notes/my-concept-note/new">
              <Plus className="mr-2 h-4 w-4" />
              New Concept Note
            </Link>
          </Button>
        </div>
      }
    >
      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete concept note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive {deleteCandidate ? `"${deleteCandidate.title}"` : "this concept note"} and remove it from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteCandidate) return;
                try {
                  await deleteMutation.mutateAsync(deleteCandidate.id);
                  toast.success("Concept note deleted successfully.");
                  setDeleteCandidate(null);
                } catch (error: any) {
                  console.error(error);
                  toast.error(error?.message || "Failed to delete concept note.");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(
          ({ key, label, value, icon, iconBg, border, activeRing, sub }) => {
            const isActive = actionFilter === key;

            return (
              <Card
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => applyActionFilter(key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    applyActionFilter(key);
                  }
                }}
                className={cn(
                  border,
                  "cursor-pointer transition-all hover:shadow-md",
                  isActive && cn("ring-2 shadow-md", activeRing),
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
                  >
                    {icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : value}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {sub}
                  </p>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {activeFilterCopy && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">{activeFilterCopy.banner}</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-background"
            onClick={() => setActionFilter("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="mt-8 w-full max-w-full">
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
        ) : isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="font-semibold text-foreground">
              Failed to load concept notes
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please check your connection and try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : filteredNotes.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredNotes}
            searchKey="title"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ?? "Search concept notes..."
            }
            onRowClick={(note) =>
              router.push(`/policies/concept-notes/my-concept-note/${note.id}`)
            }
            filterOptions={
              actionFilter === "all"
                ? [
                    {
                      key: "currentStatus",
                      label: "Status",
                      options: statusFilterOptions,
                    },
                    {
                      key: "documentCategory",
                      label: "Category",
                      options: [
                        { value: "new", label: "New" },
                        { value: "revision", label: "Revision" },
                      ],
                    },
                  ]
                : [
                    {
                      key: "currentStatus",
                      label: "Status",
                      options: statusFilterOptions,
                    },
                  ]
            }
          />
        ) : (
          <Empty className="py-24 border-dashed">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No concept notes found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "You haven't created any concept notes yet. Get started by creating a new one."}
              </EmptyDescription>
            </EmptyHeader>
            {actionFilter !== "all" ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionFilter("all")}
                >
                  Show all concept notes
                </Button>
              </EmptyContent>
            ) : (
              <EmptyContent>
                <Button asChild>
                  <Link href="/policies/concept-notes/my-concept-note/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Note
                  </Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
