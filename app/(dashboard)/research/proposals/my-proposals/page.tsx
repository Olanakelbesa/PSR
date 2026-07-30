"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  RefreshCw,
  AlertCircle,
  Building2,
  Copy,
  Check,
  Mail,
  User,
  Users,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared";
import { useProposals, useDeleteProposal } from "@/hooks/useProposals";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Queue filter types ────────────────────────────────────────────────────────
type ManageQueueFilter =
  | "all"
  | "drafts"
  | "submitted"
  | "under_review"
  | "resubmitted"
  | "revision_requested"
  | "approved";

const QUEUE_FILTER_COPY: Record<
  Exclude<ManageQueueFilter, "all">,
  {
    banner: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
  }
> = {
  drafts: {
    banner: "Showing draft proposals that haven't been submitted yet.",
    emptyTitle: "No draft proposals",
    emptyDescription: "You don't have any draft proposals. Start a new one!",
    searchPlaceholder: "Search draft proposals...",
  },
  submitted: {
    banner: "Showing newly submitted proposals awaiting PSR review.",
    emptyTitle: "No submitted proposals",
    emptyDescription:
      "You don't have any submitted proposals waiting for review.",
    searchPlaceholder: "Search submitted proposals...",
  },
  under_review: {
    banner: "Showing proposals currently under review or screening.",
    emptyTitle: "No proposals under review",
    emptyDescription: "You don't have any proposals under review right now.",
    searchPlaceholder: "Search under-review proposals...",
  },
  resubmitted: {
    banner:
      "Showing proposals that were revised and resubmitted for review.",
    emptyTitle: "No resubmitted proposals",
    emptyDescription: "You don't have any resubmitted proposals in the queue.",
    searchPlaceholder: "Search resubmitted proposals...",
  },
  revision_requested: {
    banner:
      "Showing proposals where PSR has requested revisions. Please revise and resubmit.",
    emptyTitle: "No revision requests",
    emptyDescription:
      "There are no proposals awaiting revision right now.",
    searchPlaceholder: "Search revision requests...",
  },
  approved: {
    banner: "Showing your approved proposals ready for the next stage.",
    emptyTitle: "No approved proposals",
    emptyDescription: "You don't have any approved proposals yet.",
    searchPlaceholder: "Search approved proposals...",
  },
};

const VALID_QUEUE_KEYS = Object.keys(QUEUE_FILTER_COPY);

// ── Status display helpers ─────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof FileText;
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  submitted: { label: "Submitted", variant: "default", icon: Clock },
  resubmitted: { label: "Resubmitted", variant: "default", icon: RefreshCw },
  under_review: { label: "Under Review", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Not Accepted", variant: "destructive", icon: XCircle },
  contracted: { label: "Contracted", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "outline", icon: Clock },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  terminated: { label: "Terminated", variant: "destructive", icon: XCircle },
  protocol_stage: {
    label: "Protocol Stage",
    variant: "outline",
    icon: FileText,
  },
  funding_recommendation: {
    label: "Funding Recommendation",
    variant: "default",
    icon: CheckCircle2,
  },
  revision_requested: {
    label: "Revision Requested",
    variant: "outline",
    icon: Edit,
  },
  screening_under_review: {
    label: "Screening",
    variant: "outline",
    icon: Clock,
  },
  screening_approved: {
    label: "Screening Approved",
    variant: "default",
    icon: CheckCircle2,
  },
  screening_rejected: {
    label: "Screening Not Accepted",
    variant: "destructive",
    icon: XCircle,
  },
};

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
        href={`/research/proposals/my-proposals/${id}`}
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

// ── Helper Component: Team Avatars & Info Tooltip ──────────────────────────────
type NormalizedTeamMember = {
  id: string;
  name: string;
  role: string;
  email?: string;
  organization?: string;
  avatarUrl?: string;
};

function TeamCell({ team }: { team: NormalizedTeamMember[] }) {
  const displayMembers = team.slice(0, 3);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarStyles = [
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2 overflow-hidden py-1">
        {displayMembers.map((member, idx) => {
          const colorStyle = avatarStyles[idx % avatarStyles.length];
          const initials = getInitials(member.name);
          const resolvedAvatar = member.avatarUrl
            ? (resolveFileUrl(member.avatarUrl) ?? member.avatarUrl)
            : undefined;

          return (
            <TooltipProvider key={member.id || idx}>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border shrink-0 shadow-xs cursor-pointer hover:z-10 transition-transform hover:scale-110">
                    {resolvedAvatar ? (
                      <AvatarImage src={resolvedAvatar} alt={member.name} />
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
                        <AvatarImage src={resolvedAvatar} alt={member.name} />
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
                        {member.name}
                      </p>
                      {member.role && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0.5 px-2 font-medium bg-primary/10 text-primary border-0 block w-fit truncate"
                        >
                          {member.role}
                        </Badge>
                      )}
                      {member.email && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span className="truncate">{member.email}</span>
                        </p>
                      )}
                      {member.organization && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span className="truncate">{member.organization}</span>
                        </p>
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
        {team.length} {team.length === 1 ? "member" : "members"}
      </Badge>
    </div>
  );
}

// ── Proposal row type for the table ────────────────────────────────────────────
type ProposalRow = {
  id: string;
  referenceNumber: string;
  title: string;
  thematicAreas: string;
  status: string;
  statusLabel: string;
  submittedAt?: string;
  submittedTo?: string;
  organization?: string;
  unit?: string;
  team: NormalizedTeamMember[];
  totalTeamCount: number;
  isOwner: boolean;
  userRoleLabel: "Owner" | "Member";
};

function getColumns(onDelete: (proposal: ProposalRow) => void): ColumnDef<ProposalRow>[] {
  return [
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
      accessorKey: "title",
      header: "Proposal Title",
      cell: ({ row }) => (
        <div className="max-w-[320px] min-w-[160px] py-1 space-y-1">
          <Link
            href={`/research/proposals/my-proposals/${row.original.id}`}
            className="font-semibold text-sm line-clamp-2 text-foreground hover:text-primary transition-colors block leading-snug"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.title}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "userRoleLabel",
      header: "Your Role",
      cell: ({ row }) => {
        const isOwner = row.original.isOwner;
        return isOwner ? (
          <Badge
            variant="outline"
            className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1 whitespace-nowrap"
          >
            <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Owner
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 gap-1 whitespace-nowrap"
          >
            <Users className="h-3 w-3 text-sky-600 dark:text-sky-400" />
            Member
          </Badge>
        );
      },
    },
    {
      accessorKey: "team",
      header: "Team",
      cell: ({ row }) => <TeamCell team={row.original.team} />,
    },
    {
      accessorKey: "submittedTo",
      header: "Submitted To",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
          <span className="truncate max-w-[160px]">
            {row.original.submittedTo || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "thematicAreas",
      header: "Thematic Area",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.thematicAreas || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config =
          statusConfig[row.original.status] || statusConfig.draft;
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {row.original.statusLabel || config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.submittedAt
            ? new Date(row.original.submittedAt).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/research/proposals/my-proposals/${row.original.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            {row.original.status === "draft" && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/research/proposals/my-proposals/${row.original.id}/edit`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {row.original.isOwner && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row.original);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

// ── Page Component ─────────────────────────────────────────────────────────────
export default function ProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useCurrentUser();
  const [proposalToDelete, setProposalToDelete] = useState<ProposalRow | null>(
    null,
  );
  const deleteProposalMutation = useDeleteProposal();

  type RoleScopeFilter = "all" | "owned" | "team";
  const [roleScopeFilter, setRoleScopeFilter] = useState<RoleScopeFilter>("all");

  const columns = useMemo(
    () => getColumns((proposal) => setProposalToDelete(proposal)),
    [],
  );

  const initialQueue = ((): ManageQueueFilter => {
    const param = searchParams?.get("queue");
    if (
      param &&
      VALID_QUEUE_KEYS.includes(param)
    ) {
      return param as ManageQueueFilter;
    }
    return "all";
  })();

  const [queueFilter, setQueueFilter] =
    useState<ManageQueueFilter>(initialQueue);

  const { data, isLoading, isError, refetch, isFetching } = useProposals({
    limit: 20,
    ...(queueFilter !== "all" ? { queue: queueFilter } : {}),
  });

  const proposals = data?.data ?? [];
  const meta = data?.meta as any;
  const statistics = meta?.statistics ?? {};

  // ── Stats (prefer API stats, fallback to client-side) ──────────────────────
  const stats = {
    total: statistics.totalProposals ?? proposals.length,
    drafts:
      statistics.drafts ??
      proposals.filter((p) => p.status === "draft").length,
    submitted:
      statistics.submitted ??
      proposals.filter((p) => p.status === "submitted").length,
    underReview:
      statistics.underReview ??
      proposals.filter(
        (p) => p.status === "screening_under_review",
      ).length,
    resubmitted:
      statistics.resubmitted ??
      proposals.filter((p) => p.status === "resubmitted").length,
    revisionRequested:
      statistics.revisionRequested ??
      proposals.filter(
        (p) =>
          p.status === "screening_rejected" ||
          p.status === "revision_required",
      ).length,
    approved:
      statistics.approved ??
      proposals.filter(
        (p) => p.status === "screening_approved",
      ).length,
  };

  const applyQueueFilter = (filter: ManageQueueFilter) => {
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const activeFilterCopy =
    queueFilter === "all" ? null : QUEUE_FILTER_COPY[queueFilter];

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards: Array<{
    key: ManageQueueFilter;
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
        label: "Total Proposals",
        value: stats.total,
        icon: <FileText className="h-4 w-4 text-primary" />,
        iconBg: "bg-primary/10",
        border: "border-primary/10",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "Across all categories",
      },
      {
        key: "drafts",
        label: "Drafts",
        value: stats.drafts,
        icon: <Edit className="h-4 w-4 text-slate-600" />,
        iconBg: "bg-slate-100",
        border: "border-slate-200/70 bg-slate-50/20",
        activeRing: "ring-slate-500/60 border-slate-300",
        sub: "Not yet submitted",
      },
      {
        key: "submitted",
        label: "Submitted",
        value: stats.submitted,
        icon: <Inbox className="h-4 w-4 text-violet-600" />,
        iconBg: "bg-violet-100",
        border: "border-violet-200/70 bg-violet-50/20",
        activeRing: "ring-violet-500/60 border-violet-300",
        sub: "Awaiting PSR review",
      },
      {
        key: "under_review",
        label: "Under Review",
        value: stats.underReview,
        icon: <Clock className="h-4 w-4 text-blue-500" />,
        iconBg: "bg-blue-100",
        border: "border-blue-100/50 bg-blue-50/10",
        activeRing: "ring-blue-500/60 border-blue-300",
        sub: "Being evaluated",
      },
      {
        key: "resubmitted",
        label: "Resubmitted",
        value: stats.resubmitted,
        icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
        iconBg: "bg-purple-100",
        border: "border-purple-200/70 bg-purple-50/20",
        activeRing: "ring-purple-500/60 border-purple-300",
        sub: "Revised and resent",
      },
      {
        key: "revision_requested",
        label: "Revision Required",
        value: stats.revisionRequested,
        icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
        iconBg: "bg-amber-100",
        border: "border-amber-100/50 bg-amber-50/10",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Needs your updates",
      },
      {
        key: "approved",
        label: "Approved",
        value: stats.approved,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        iconBg: "bg-green-100",
        border: "border-green-100/50 bg-green-50/10",
        activeRing: "ring-green-500/60 border-green-300",
        sub: "Ready for next stage",
      },
    ];

  // ── Table row data mapping ─────────────────────────────────────────────────
  const tableData: ProposalRow[] = useMemo(() => {
    return proposals.map((p: any) => {
      const teamList: NormalizedTeamMember[] = [];
      const seenEmails = new Set<string>();

      // Track owner email/id to exclude owner from team members list
      const ownerCreator = (p.createdBy || p.created_by) as any;
      const ownerPi = (p.principalInvestigator || p.principal_investigator) as any;
      const ownerEmails = new Set<string>();
      const ownerIds = new Set<string>();

      if (ownerCreator) {
        if (ownerCreator.email) ownerEmails.add(String(ownerCreator.email).toLowerCase());
        if (ownerCreator.id) ownerIds.add(String(ownerCreator.id));
      }
      if (ownerPi) {
        if (ownerPi.email) ownerEmails.add(String(ownerPi.email).toLowerCase());
        if (ownerPi.id) ownerIds.add(String(ownerPi.id));
      }

      const currentUserId = String(currentUser?.id ?? "");
      const currentUserEmail = (currentUser?.email ?? "").toLowerCase();
      const isOwner = Boolean(
        (currentUserId && ownerIds.has(currentUserId)) ||
        (currentUserEmail && ownerEmails.has(currentUserEmail)) ||
        p.isOwner ||
        p.is_owner
      );
      const userRoleLabel: "Owner" | "Member" = isOwner ? "Owner" : "Member";

      // Process teamMembers, coInvestigators, externalTeamMembers, and stakeholders
      const rawMembers = [
        ...(p.teamMembers || p.team_members || []),
        ...(p.coInvestigators || p.co_investigators || []),
        ...(p.externalTeamMembers || p.external_team_members || []),
        ...(p.stakeholders || []),
      ];

      rawMembers.forEach((m: any, idx: number) => {
        const email = (m.memberEmail || m.member_email || m.email || m.user?.email || "").toLowerCase();
        const memberUserId = String(m.member?.id || m.member || m.user?.id || m.userId || "");

        const isExternal =
          m.member_type === "external" ||
          m.memberType === "external" ||
          m.user_type === "external" ||
          m.userType === "external" ||
          Boolean(m.stakeholder_name || m.stakeholderName);

        // Exclude internal proposal owner / Principal Investigator from team avatars
        const isMemberOwner =
          !isExternal &&
          ((email && ownerEmails.has(email)) ||
            (memberUserId && ownerIds.has(memberUserId)) ||
            m.is_pi ||
            m.isPi ||
            m.role_name === "Principal Investigator" ||
            m.roleName === "Principal Investigator");

        if (isMemberOwner) return;

        const name =
          m.stakeholderName ||
          m.stakeholder_name ||
          m.memberName ||
          m.member_name ||
          [m.user?.firstName || m.user?.first_name, m.user?.lastName || m.user?.last_name].filter(Boolean).join(" ") ||
          m.email ||
          m.memberEmail ||
          m.member_email ||
          (isExternal ? "External Stakeholder" : `Team Member ${idx + 1}`);

        const role =
          m.position ||
          m.roleName ||
          m.role_name ||
          m.memberType ||
          m.member_type ||
          (isExternal ? "External Stakeholder" : "Co-Investigator");

        const org =
          m.organizationName ||
          m.organization_name ||
          m.organization ||
          p.Organization?.name ||
          p.organization?.name;

        const rawPhoto =
          m.photo_url ||
          m.photoUrl ||
          m.avatarUrl ||
          m.avatar ||
          m.photo ||
          m.user?.photo_url ||
          m.user?.photoUrl ||
          m.user?.avatarUrl ||
          m.user?.avatar ||
          m.user?.photo;
        const avatarUrl = resolveFileUrl(rawPhoto) || undefined;

        const key = email ? email : `${name}-${idx}`;
        if (!seenEmails.has(key)) {
          seenEmails.add(key);
          teamList.push({
            id: String(m.id || idx),
            name,
            role,
            email: email || undefined,
            organization: org,
            avatarUrl,
          });
        }
      });

      const submittedTo =
        p.receivingOffice?.name ||
        p.receiving_office?.name ||
        p.receivingOfficeName ||
        p.receiving_office_name ||
        p.Organization?.name ||
        p.organization?.name ||
        "";

      return {
        id: String(p.id),
        referenceNumber: p.referenceNumber || p.reference_number || `PRP-${p.id}`,
        title: p.title || "Untitled Proposal",
        thematicAreas:
          p.thematicAreas && p.thematicAreas.length > 0
            ? p.thematicAreas.map((ta: any) => ta.name).join(", ")
            : "N/A",
        status: p.status || "draft",
        statusLabel: p.statusDisplay || p.status_display || "",
        submittedAt: p.submittedAt || p.lastSubmittedAt || undefined,
        submittedTo,
        organization: p.Organization?.name || p.organization?.name || "",
        unit: p.Unit?.name || p.unit?.name || "",
        team: teamList,
        totalTeamCount: teamList.length,
        isOwner,
        userRoleLabel,
      };
    });
  }, [proposals, currentUser]);

  const filteredTableData = useMemo(() => {
    if (roleScopeFilter === "owned") return tableData.filter((r) => r.isOwner);
    if (roleScopeFilter === "team") return tableData.filter((r) => !r.isOwner);
    return tableData;
  }, [tableData, roleScopeFilter]);

  const statusOptions = Object.entries(statusConfig).map(
    ([value, { label }]) => ({
      value,
      label,
    }),
  );

  return (
    <PageContainer
      title="My Proposals"
      description="Manage your research proposals and submissions"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/research/proposals/my-proposals/new">
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Link>
          </Button>
        </div>
      }
    >
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
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
            ({
              key,
              label,
              value,
              icon,
              iconBg,
              border,
              activeRing,
              sub,
            }) => {
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
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
                    >
                      {icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        value
                      )}
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

      {/* ── Filter banner ─────────────────────────────────────────────────── */}
      {activeFilterCopy && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-muted/40 px-4 py-3">
          <p className="text-sm text-foreground">
            {activeFilterCopy.banner}
          </p>
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
              Failed to load proposals
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please try again later.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : tableData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 rounded-xl border border-border/60 shadow-2xs">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
                <Button
                  variant={roleScopeFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs font-semibold rounded-md"
                  onClick={() => setRoleScopeFilter("all")}
                >
                  All ({tableData.length})
                </Button>
                <Button
                  variant={roleScopeFilter === "owned" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs font-semibold rounded-md gap-1.5"
                  onClick={() => setRoleScopeFilter("owned")}
                >
                  <User className="h-3.5 w-3.5 text-emerald-500" />
                  Created by Me ({tableData.filter((r) => r.isOwner).length})
                </Button>
                <Button
                  variant={roleScopeFilter === "team" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs font-semibold rounded-md gap-1.5"
                  onClick={() => setRoleScopeFilter("team")}
                >
                  <Users className="h-3.5 w-3.5 text-sky-500" />
                  Shared with Me ({tableData.filter((r) => !r.isOwner).length})
                </Button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredTableData}
              initialColumnVisibility={{ referenceNumber: false }}
              searchKey="title"
              searchPlaceholder={
                activeFilterCopy?.searchPlaceholder ??
                "Search proposals by title..."
              }
              onRowClick={(row) => {
                router.push(`/research/proposals/my-proposals/${row.id}`);
              }}
              filterOptions={
                queueFilter === "all"
                  ? [
                    {
                      key: "status",
                      label: "Status",
                      options: statusOptions,
                    },
                  ]
                  : []
              }
              emptyMessage="No proposals found"
              emptyDescription="Try adjusting your filters or create a new proposal"
            />
          </div>
        ) : (
          <Empty className="border-dashed py-24">
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {activeFilterCopy?.emptyTitle ?? "No proposals found"}
              </EmptyTitle>
              <EmptyDescription>
                {activeFilterCopy?.emptyDescription ??
                  "No proposals have been created yet. Start by creating a new proposal."}
              </EmptyDescription>
            </EmptyHeader>
            {queueFilter !== "all" ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueueFilter("all")}
                >
                  Show all proposals
                </Button>
              </EmptyContent>
            ) : (
              <EmptyContent>
                <Button asChild size="sm">
                  <Link href="/research/proposals/my-proposals/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Proposal
                  </Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>

      <ConfirmDialog
        open={!!proposalToDelete}
        onOpenChange={(open) => {
          if (!open) setProposalToDelete(null);
        }}
        title="Delete Proposal"
        description={`Are you sure you want to delete "${proposalToDelete?.title || "this proposal"}"? This action cannot be undone.`}
        confirmLabel="Delete Proposal"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteProposalMutation.isPending}
        onConfirm={async () => {
          if (!proposalToDelete) return;
          try {
            await deleteProposalMutation.mutateAsync(proposalToDelete.id);
            toast.success(
              `Proposal "${proposalToDelete.title}" deleted successfully.`,
            );
            setProposalToDelete(null);
          } catch (error: any) {
            const message =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to delete proposal. Please try again.";
            toast.error(message);
          }
        }}
      />
    </PageContainer>
  );
}
