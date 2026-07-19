"use client";

import { useMemo, useState } from "react";
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
  Clock,
  FilePlus,
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyPolicyDrafts, type PolicyDraftItem } from "@/lib/queries/policy-drafts";
import { useConceptNotes } from "@/lib/queries/concept-notes";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { useAuth } from "@/hooks/useAuth";

type ActionFilter = "all" | "needs_action" | "under_review" | "completed";

const ACTION_FILTER_COPY: Record<
  Exclude<ActionFilter, "all">,
  { banner: string; emptyTitle: string; emptyDescription: string; searchPlaceholder: string }
> = {
  needs_action: {
    banner: "Showing drafts that need your action — drafts to write or revisions to address.",
    emptyTitle: "No drafts need action",
    emptyDescription: "All your drafts are either submitted or completed.",
    searchPlaceholder: "Search drafts needing action...",
  },
  under_review: {
    banner: "Showing drafts waiting on reviewer or PSR decisions.",
    emptyTitle: "No drafts under review",
    emptyDescription: "You have no drafts currently in the review pipeline.",
    searchPlaceholder: "Search drafts under review...",
  },
  completed: {
    banner: "Showing drafts that have been PSR approved or registered in the repository.",
    emptyTitle: "No completed drafts",
    emptyDescription: "You have no completed drafts yet.",
    searchPlaceholder: "Search completed drafts...",
  },
};

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
  const { data: manageResponse, isLoading } = useMyPolicyDrafts();
  const policies = manageResponse?.data || [];
  const draftStatistics = manageResponse?.meta?.statistics;

  const { data: draftReadyConceptsRes, isLoading: isLoadingConcepts } =
    useConceptNotes({ current_status: "policy_draft_ready", limit: 1 }, backendToken);
  const draftReadyCount = draftReadyConceptsRes?.meta?.total ?? 0;

  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const stats = useMemo(() => {
    if (draftStatistics) {
      return {
        total: draftStatistics.totalDrafts,
        needsAction: draftStatistics.needsAction,
        underReview: draftStatistics.newSubmissions + draftStatistics.underReview + draftStatistics.reviewCompleted + draftStatistics.resubmitted,
        completed: draftStatistics.approved,
      };
    }
    return {
      total: policies.length,
      needsAction: policies.filter((p) =>
        ["draft", "resubmission_required"].includes(p.currentStatus)
      ).length,
      underReview: policies.filter((p) =>
        ["submitted", "under_review", "review_completed", "resubmitted"].includes(p.currentStatus)
      ).length,
      completed: policies.filter((p) =>
        ["psr_approved", "repository_registered"].includes(p.currentStatus)
      ).length,
    };
  }, [draftStatistics, policies]);

  const filteredPolicies = useMemo(() => {
    if (actionFilter === "all") return policies;

    const filterMap: Record<string, string[]> = {
      needs_action: ["draft", "resubmission_required"],
      under_review: ["submitted", "under_review", "review_completed", "resubmitted"],
      completed: ["psr_approved", "repository_registered"],
    };

    const allowedStatuses = filterMap[actionFilter] || [];
    return policies.filter((p) => allowedStatuses.includes(p.currentStatus));
  }, [policies, actionFilter]);

  const applyActionFilter = (filter: ActionFilter) => {
    setActionFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    actionFilter === "all" ? null : ACTION_FILTER_COPY[actionFilter];

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
      label: "Total Drafts",
      value: stats.total,
      icon: <FileEdit className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "In development pipeline",
    },
    {
      key: "needs_action",
      label: "Needs Action",
      value: stats.needsAction,
      icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
      iconBg: "bg-orange-100",
      border: "border-orange-100/50 bg-orange-50/10",
      activeRing: "ring-orange-500/60 border-orange-300",
      sub: "Revisions to address or resubmissions needed",
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
      sub: "PSR approved or repository registered",
    },
  ];

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

      {draftReadyCount > 0 && (
        <Card
          role="button"
          tabIndex={0}
          onClick={() => router.push("/policies/drafts/my-drafts/new")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push("/policies/drafts/my-drafts/new");
            }
          }}
          className="mt-4 cursor-pointer border-emerald-200 bg-emerald-50/40 transition-all hover:shadow-md hover:border-emerald-300"
        >
          <CardContent className="flex items-center justify-between py-4 px-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <FilePlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {draftReadyCount} concept note{draftReadyCount !== 1 ? "s" : ""} ready to draft
                </p>
                <p className="text-xs text-muted-foreground">
                  Approved concept notes awaiting policy draft registration
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Register Draft
            </Button>
          </CardContent>
        </Card>
      )}

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
        ) : filteredPolicies.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredPolicies}
            searchKey="title"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ?? "Search draft documents..."
            }
            onRowClick={(policy) => router.push(`/policies/drafts/my-drafts/${policy.id}`)}
            filterOptions={
              actionFilter === "all"
                ? [
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
                  ]
                : [
                    {
                      key: "currentStatus",
                      label: "Status",
                      options: statusOptions,
                    },
                  ]
            }
          />
        ) : (
          <Empty className="py-24 border-dashed">
            <EmptyMedia variant="icon">
              <FileEdit className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No drafts found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "There are no policy drafts in the development pipeline."}
              </EmptyDescription>
            </EmptyHeader>
            {actionFilter !== "all" ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionFilter("all")}
                >
                  Show all drafts
                </Button>
              </EmptyContent>
            ) : (
              <EmptyContent>
                <Button asChild>
                  <Link href="/policies/drafts/my-drafts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create a new draft
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
