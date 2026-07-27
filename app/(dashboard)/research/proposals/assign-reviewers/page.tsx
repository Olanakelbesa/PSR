"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  UserPlus,
  Inbox,
  Clock,
  AlertCircle,
  FileText,
  Users,
  UserCheck,
  RefreshCw,
  Calendar,
  Building2,
  Copy,
  Check,
  Mail,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import {
  getScreenings,
  type Screening,
} from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// ── Queue filter types ────────────────────────────────────────────────────────
type AssignQueueFilter =
  | "all"
  | "awaiting_assignment"
  | "partially_assigned"
  | "fully_assigned"
  | "not_reviewed"
  | "partially_reviewed"
  | "all_reviewed";

const QUEUE_FILTER_COPY: Record<
  Exclude<AssignQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  awaiting_assignment: {
    banner:
      "Showing screenings that have no reviewers assigned yet and need attention.",
    emptyTitle: "No screenings awaiting assignment",
    emptyDescription:
      "All screenings currently have at least one reviewer assigned.",
    searchPlaceholder: "Search awaiting assignment...",
  },
  partially_assigned: {
    banner:
      "Showing screenings with some reviewers assigned but not yet fully staffed.",
    emptyTitle: "No partially assigned screenings",
    emptyDescription:
      "All screenings either have no reviewers or are fully staffed.",
    searchPlaceholder: "Search partially assigned...",
  },
  fully_assigned: {
    banner:
      "Showing screenings that have been fully staffed with 2 or more reviewers.",
    emptyTitle: "No fully assigned screenings",
    emptyDescription: "No screenings have been fully staffed yet.",
    searchPlaceholder: "Search fully assigned...",
  },
  not_reviewed: {
    banner:
      "Showing screenings where no assigned reviewers have submitted their review yet.",
    emptyTitle: "No unreviewed screenings",
    emptyDescription: "All assigned reviewers have submitted their reviews.",
    searchPlaceholder: "Search unreviewed...",
  },
  partially_reviewed: {
    banner:
      "Showing screenings where some but not all assigned reviewers have submitted.",
    emptyTitle: "No partially reviewed screenings",
    emptyDescription:
      "All screenings either have no reviews or all reviews are complete.",
    searchPlaceholder: "Search partially reviewed...",
  },
  all_reviewed: {
    banner:
      "Showing screenings where all assigned reviewers have submitted their reviews.",
    emptyTitle: "No fully reviewed screenings",
    emptyDescription: "No screenings have all reviews completed yet.",
    searchPlaceholder: "Search fully reviewed...",
  },
};

const VALID_QUEUE_KEYS = Object.keys(QUEUE_FILTER_COPY);

// ── Score helpers ────────────────────────────────────────────────────────────
function getScoreColor(pct: number): string {
  if (pct >= 70) return "bg-green-100 text-green-700 border-green-200";
  if (pct >= 50) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-rose-50 text-rose-600 border-rose-200";
}

// ── Helper Component: Copyable Reference Cell ──────────────────────────────────
function ReferenceCell({ refNum, id }: { refNum: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!refNum) return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 transition-colors max-w-fit">
      <Link
        href={`/research/proposals/assign-reviewers/${id}`}
        className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {refNum}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleCopy}
        title="Copy reference number"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

// ── Helper Component: Submitted By User Cell ──────────────────────────────────
function SubmittedByCell({ name, user }: { name: string; user?: any }) {
  const getInitials = (str: string) => {
    if (!str || str === "—") return "U";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  const rawPhoto = user
    ? user.photo_url ||
      user.photoUrl ||
      user.photo ||
      user.avatarUrl ||
      user.avatar ||
      user.profilePhoto ||
      user.user?.photo_url ||
      user.user?.photoUrl ||
      user.user?.avatar
    : undefined;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-7 w-7 border border-border shrink-0 shadow-xs">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary flex items-center justify-center size-full">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
        {name}
      </span>
    </div>
  );
}

// ── Helper Component: Assigned Reviewers Avatars & Info Tooltip ────────────────
type ReviewerItem = {
  id?: string | number;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  photoUrl?: string;
  avatarUrl?: string;
};

function ReviewersCell({
  reviewers,
  count,
}: {
  reviewers?: ReviewerItem[];
  count: number;
}) {
  const list = reviewers || [];
  const displayReviewers = list.slice(0, 3);

  const getInitials = (name?: string) => {
    if (!name) return "R";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarStyles = [
    "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  ];

  if (count === 0 && list.length === 0) {
    return (
      <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
        0 reviewers
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2 overflow-hidden py-1">
        {displayReviewers.map((rev, idx) => {
          const revName = rev.fullName || rev.name || `Reviewer ${idx + 1}`;
          const initials = getInitials(revName);
          const rawPhoto =
            rev.photoUrl ||
            rev.avatarUrl ||
            (rev as any).photo_url ||
            (rev as any).photo ||
            (rev as any).avatar;
          const resolvedAvatar = resolveFileUrl(rawPhoto) || undefined;
          const colorStyle = avatarStyles[idx % avatarStyles.length];

          return (
            <TooltipProvider key={rev.id || idx}>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border shrink-0 shadow-xs cursor-pointer hover:z-10 transition-transform hover:scale-110">
                    {resolvedAvatar ? (
                      <AvatarImage src={resolvedAvatar} alt={revName} />
                    ) : null}
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-bold flex items-center justify-center size-full",
                        colorStyle
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="p-3.5 max-w-[270px] z-50 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border-2 border-border/60 shadow-sm">
                      {resolvedAvatar ? (
                        <AvatarImage src={resolvedAvatar} alt={revName} />
                      ) : null}
                      <AvatarFallback
                        className={cn(
                          "text-xs font-bold flex items-center justify-center size-full",
                          colorStyle
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-bold text-xs text-foreground truncate">
                        {revName}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0.5 px-2 font-medium bg-primary/10 text-primary border-0 block w-fit truncate"
                      >
                        {rev.role || "Technical Reviewer"}
                      </Badge>
                      {rev.email && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span className="truncate">{rev.email}</span>
                        </p>
                      )}
                      {(rev as any).score_percentage != null && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 mt-1.5 border block w-fit",
                            getScoreColor((rev as any).score_percentage)
                          )}
                        >
                          Score: {(rev as any).score_percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      <Badge
        variant="secondary"
        className="text-[11px] font-medium px-2 py-0.5 whitespace-nowrap"
      >
        {count || list.length} {count === 1 || list.length === 1 ? "reviewer" : "reviewers"}
      </Badge>
    </div>
  );
}

// ── Helper Component: Review Progress Cell with Individual Scores Tooltip ─────
function ReviewProgressCell({ row }: { row: ScreeningRow }) {
  const assigned = row.assignedReviewersCount || 0;
  const completed = row.reviewsCompletedCount || 0;
  const pct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const list = row.assignedReviewers || [];

  const getInitials = (name?: string) => {
    if (!name) return "R";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const progressContent = (
    <div
      className="space-y-1.5 min-w-[130px] cursor-pointer py-1 group/progress"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground group-hover/progress:text-foreground transition-colors">
          {completed}/{assigned}
        </span>
        <span className="text-[10px] font-bold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden ring-1 ring-border/30">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct === 100
              ? "bg-green-500"
              : pct > 0
                ? "bg-amber-400"
                : "bg-muted-foreground/30",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground group-hover/progress:text-foreground/80 transition-colors">
        {assigned === 0
          ? "No reviewers"
          : pct === 100
            ? "All reviewed"
            : `${completed} of ${assigned} reviewed`}
      </p>
    </div>
  );

  if (list.length === 0) {
    return progressContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          {progressContent}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="p-3.5 min-w-[270px] max-w-[320px] z-50 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-xs font-bold text-foreground">Reviewer Scores</span>
            <Badge variant="outline" className="text-[10px] font-semibold bg-muted/30">
              {completed}/{assigned} Submitted
            </Badge>
          </div>
          <div className="space-y-2">
            {list.map((rev: any, idx: number) => {
              const revName = rev.fullName || rev.name || `Reviewer ${idx + 1}`;
              const initials = getInitials(revName);
              const rawPhoto = rev.photo_url || rev.photoUrl || rev.photo || rev.avatar;
              const resolvedAvatar = resolveFileUrl(rawPhoto) || undefined;

              const scorePct =
                rev.score_percentage !== undefined && rev.score_percentage !== null
                  ? Number(rev.score_percentage)
                  : rev.scorePercentage !== undefined && rev.scorePercentage !== null
                    ? Number(rev.scorePercentage)
                    : rev.score_pct !== undefined && rev.score_pct !== null
                      ? Number(rev.score_pct)
                      : null;

              const isCompleted =
                rev.is_completed ??
                rev.isCompleted ??
                (scorePct !== null);

              return (
                <div key={rev.id || idx} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 border border-border shrink-0">
                      {resolvedAvatar ? <AvatarImage src={resolvedAvatar} alt={revName} /> : null}
                      <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary flex items-center justify-center size-full">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate max-w-[130px]">
                      {revName}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {scorePct !== null ? (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold px-2 py-0.5", getScoreColor(scorePct))}
                      >
                        {scorePct}%
                      </Badge>
                    ) : isCompleted ? (
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/40">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Screening row type ────────────────────────────────────────────────────────
type ScreeningRow = Screening & {
  proposalId: string;
  referenceNumber: string;
  proposalTitle: string;
  organizationName: string;
  unitName: string;
  officeName: string;
  createdByName: string;
  createdByObj?: any;
  thematicAreaLabel: string;
  shortAbstractText: string;
  submittedAt?: string;
};

// ── Columns ────────────────────────────────────────────────────────────────────
const columns: ColumnDef<ScreeningRow>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
    cell: ({ row }) => (
      <ReferenceCell
        refNum={String(row.original.referenceNumber || row.original.id || "")}
        id={String(row.original.id)}
      />
    ),
  },
  {
    accessorKey: "proposalTitle",
    header: "Proposal Title",
    cell: ({ row }) => (
      <div className="max-w-[320px] min-w-[160px] py-1">
        <Link
          href={`/research/proposals/assign-reviewers/${row.original.id}`}
          className="font-semibold text-sm line-clamp-2 text-foreground hover:text-primary transition-colors block leading-snug"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.proposalTitle}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Submitted By",
    cell: ({ row }) => (
      <SubmittedByCell
        name={row.original.createdByName}
        user={row.original.createdByObj}
      />
    ),
  },
  {
    accessorKey: "assignedReviewers",
    header: "Assigned Reviewers",
    cell: ({ row }) => (
      <ReviewersCell
        reviewers={row.original.assignedReviewers}
        count={row.original.assignedReviewersCount || 0}
      />
    ),
  },
  {
    accessorKey: "assignedReviewersCount",
    header: "Review Progress",
    cell: ({ row }) => <ReviewProgressCell row={row.original} />,
  },
  {
    accessorKey: "averageScorePercentage",
    header: "Avg Score",
    cell: ({ row }) => {
      const pct = row.original.averageScorePercentage;
      if (pct == null) {
        return (
          <span className="text-xs text-muted-foreground italic">No scores</span>
        );
      }
      return (
        <Badge
          variant="outline"
          className={cn("text-[10px] font-bold px-2 py-0.5", getScoreColor(pct))}
        >
          {pct.toFixed(0)}%
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted Date",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground/80">
        <Calendar className="h-3 w-3" />
        <span className="text-xs font-medium">
          {row.original.submittedAt
            ? new Date(row.original.submittedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Pending"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted/80 rounded-full"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[180px] p-1 shadow-xl border-muted-foreground/20"
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/research/proposals/assign-reviewers/${row.original.id}`}
                className="cursor-pointer flex items-center px-2 py-2 text-sm font-medium rounded-md focus:bg-primary/10 focus:text-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-muted/50" />
            <DropdownMenuItem asChild className="text-blue-600 font-medium">
              <Link
                href={`/research/proposals/assign-reviewers/${row.original.id}/assign`}
                className="cursor-pointer flex items-center px-2 py-2 text-sm font-semibold rounded-md focus:bg-blue-50 focus:text-blue-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Reviewers
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AssignReviewersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useCurrentUser();

  const initialQueue = ((): AssignQueueFilter => {
    const param = searchParams.get("queue");
    if (param && VALID_QUEUE_KEYS.includes(param)) {
      return param as AssignQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] =
    useState<AssignQueueFilter>(initialQueue);
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const formatProposalReference = (id: string | number) =>
    String(id)
      .replace(/^prop-/i, "PRP-")
      .toUpperCase();

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const getCreatedByName = (proposal: any) => {
    const createdBy = proposal.createdBy;
    if (!createdBy) return "—";
    return (
      [createdBy.firstName, createdBy.lastName].filter(Boolean).join(" ") ||
      createdBy.email ||
      "—"
    );
  };

  const mapToScreeningRow = (screening: Screening): ScreeningRow => {
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
      createdByObj: proposal?.createdBy || proposal?.created_by,
      thematicAreaLabel: proposal?.thematicAreas?.[0]?.name || "—",
      shortAbstractText: stripHtml(proposal?.shortAbstract || ""),
      submittedAt:
        proposal?.submittedAt || screening.createdAt || undefined,
    } satisfies ScreeningRow;
  };

  const loadScreenings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    try {
      const response = await getScreenings({
        status: "screening_approved",
        limit: 100,
      });

      const readyForAssignment = response.data
        .filter((screening) => screening.status === "screening_approved")
        .map(mapToScreeningRow);

      setScreenings(readyForAssignment);
    } catch (error: any) {
      console.error("Failed to load screenings:", error?.message || error);
      setScreenings([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  // ── Statistics derived from screenings ──────────────────────────────────────
  const statistics = useMemo(() => {
    const total = screenings.length;
    const awaiting = screenings.filter(
      (s) => s.assignedReviewersCount === 0,
    ).length;
    const partial = screenings.filter(
      (s) => s.assignedReviewersCount > 0 && s.assignedReviewersCount < 2,
    ).length;
    const full = screenings.filter(
      (s) => s.assignedReviewersCount >= 2,
    ).length;
    // Review completion stats
    const notReviewed = screenings.filter(
      (s) =>
        (s.assignedReviewersCount || 0) > 0 &&
        (s.reviewsCompletedCount || 0) === 0,
    ).length;
    const partiallyReviewed = screenings.filter(
      (s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed > 0 && completed < assigned;
      },
    ).length;
    const allReviewed = screenings.filter(
      (s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed >= assigned;
      },
    ).length;
    return { total, awaiting, partial, full, notReviewed, partiallyReviewed, allReviewed };
  }, [screenings]);

  const applyQueueFilter = (filter: AssignQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards: Array<{
    key: AssignQueueFilter;
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
      label: "Total Ready",
      value: statistics.total,
      icon: <FileText className="h-4 w-4 text-primary" />,
      iconBg: "bg-primary/10",
      border: "border-primary/10",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "All approved screenings",
    },
    {
      key: "awaiting_assignment",
      label: "Awaiting Assignment",
      value: statistics.awaiting,
      icon: <Inbox className="h-4 w-4 text-violet-600" />,
      iconBg: "bg-violet-100",
      border: "border-violet-200/70 bg-violet-50/20",
      activeRing: "ring-violet-500/60 border-violet-300",
      sub: "No reviewers assigned",
    },
    {
      key: "not_reviewed",
      label: "Not Yet Reviewed",
      value: statistics.notReviewed,
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      iconBg: "bg-amber-100",
      border: "border-amber-100/50 bg-amber-50/10",
      activeRing: "ring-amber-500/60 border-amber-300",
      sub: "Assigned but no reviews",
    },
    {
      key: "partially_reviewed",
      label: "Partially Reviewed",
      value: statistics.partiallyReviewed,
      icon: <Users className="h-4 w-4 text-blue-500" />,
      iconBg: "bg-blue-100",
      border: "border-blue-100/50 bg-blue-50/10",
      activeRing: "ring-blue-500/60 border-blue-300",
      sub: "Some reviews pending",
    },
    {
      key: "all_reviewed",
      label: "All Reviewed",
      value: statistics.allReviewed,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-100/50 bg-green-50/10",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "All reviewers submitted",
    },
    {
      key: "fully_assigned",
      label: "Fully Assigned",
      value: statistics.full,
      icon: <UserCheck className="h-4 w-4 text-emerald-500" />,
      iconBg: "bg-emerald-100",
      border: "border-emerald-100/50 bg-emerald-50/10",
      activeRing: "ring-emerald-500/60 border-emerald-300",
      sub: "2+ reviewers assigned",
    },
  ];

  // ── Filtered screenings for table ──────────────────────────────────────────
  const filteredScreenings = useMemo(() => {
    if (queueFilter === "all") return screenings;
    if (queueFilter === "awaiting_assignment")
      return screenings.filter((s) => s.assignedReviewersCount === 0);
    if (queueFilter === "partially_assigned")
      return screenings.filter(
        (s) => s.assignedReviewersCount > 0 && s.assignedReviewersCount < 2,
      );
    if (queueFilter === "fully_assigned")
      return screenings.filter((s) => s.assignedReviewersCount >= 2);
    if (queueFilter === "not_reviewed")
      return screenings.filter(
        (s) =>
          (s.assignedReviewersCount || 0) > 0 &&
          (s.reviewsCompletedCount || 0) === 0,
      );
    if (queueFilter === "partially_reviewed")
      return screenings.filter((s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed > 0 && completed < assigned;
      });
    if (queueFilter === "all_reviewed")
      return screenings.filter((s) => {
        const assigned = s.assignedReviewersCount || 0;
        const completed = s.reviewsCompletedCount || 0;
        return assigned > 0 && completed >= assigned;
      });
    return screenings;
  }, [screenings, queueFilter]);

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description="Select and assign subject matter experts to evaluate research proposals."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadScreenings(true)}
            disabled={isFetching || isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden border-none shadow-md"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : statCards.map(
              ({ key, label, value, icon, iconBg, border, activeRing, sub }) => {
                const isActive = queueFilter === key;

                return (
                  <Card
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => applyQueueFilter(key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applyQueueFilter(key);
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
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          iconBg,
                        )}
                      >
                        {icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{value}</div>
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {sub}
                      </p>
                    </CardContent>
                  </Card>
                );
              },
            )}
      </div>

      {/* ── Filter banner ──────────────────────────────────────────────────── */}
      {activeFilterCopy && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">{activeFilterCopy.banner}</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-background"
            onClick={() => setQueueFilter("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
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
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
            <p className="font-semibold text-destructive">
              Failed to load screenings
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Something went wrong while fetching the data.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => loadScreenings()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filteredScreenings.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredScreenings}
            initialColumnVisibility={{ referenceNumber: false }}
            searchKey="proposalTitle"
            searchPlaceholder={
              activeFilterCopy?.searchPlaceholder ??
              "Search by proposal title, organization, or submitter..."
            }
            filterOptions={
              queueFilter === "all"
                ? [
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        {
                          value: "screening_approved",
                          label: "Screening Approved",
                        },
                      ],
                    },
                  ]
                : []
            }
            onRowClick={(row) =>
              router.push(
                `/research/proposals/assign-reviewers/${String(row.id)}`,
              )
            }
            emptyMessage="No screenings found"
            emptyDescription="All screenings have been processed."
          />
        ) : (
          <Empty className="border-dashed py-24">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No screenings found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "There are no approved screenings ready for reviewer assignment."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all screenings
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
