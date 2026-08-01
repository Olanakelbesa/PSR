"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, Table } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Clock,
  TrendingUp,
  ShieldCheck,
  Search,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Check,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable, DataTableViewOptions } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useOrganizations,
  useProposalTypes,
  useUnitsWithParams,
} from "@/hooks/useReference";
import { useGrantCalls } from "@/lib/queries/grant-calls";

import {
  readyForFundingService,
  type ReadyForFundingItem,
} from "@/api/services/ready-for-funding.service";

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ReferenceCell({ refNum }: { refNum: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!refNum) return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success(`Reference ${refNum} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-mono text-muted-foreground border border-border/50 cursor-pointer group/ref transition-colors shrink-0"
      onClick={handleCopy}
      title="Click to copy reference number"
    >
      <span className="font-semibold text-foreground/80">{refNum}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground/70 group-hover/ref:text-primary shrink-0" />
      )}
    </div>
  );
}

function PiUserCell({ pi }: { pi: any }) {
  const name = pi?.fullName || [pi?.first_name, pi?.last_name].filter(Boolean).join(" ") || "—";
  const email = pi?.email || "";
  const rawPhoto = pi?.photoUrl || pi?.photo_url || pi?.avatarUrl || pi?.photo || pi?.avatar;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;
  const initials = getInitials(name);

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-8 w-8 border border-border shrink-0 shadow-2xs">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary flex items-center justify-center size-full">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground truncate max-w-[160px]" title={name}>
          {name}
        </span>
        {email && (
          <span className="text-[11px] text-muted-foreground truncate max-w-[160px]" title={email}>
            {email}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Constants
// ============================================================================

const ALL_VALUE = "all";

type StatusFilter = "all" | "pending" | "decided" | "total_funding";

type SortOption = {
  value: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: "-id", label: "Newest" },
  { value: "id", label: "Oldest" },
  { value: "reference_number", label: "Reference (A-Z)" },
  { value: "-reference_number", label: "Reference (Z-A)" },
  { value: "proposal_title", label: "Title (A-Z)" },
  { value: "-proposal_title", label: "Title (Z-A)" },
  { value: "proposal_type", label: "Research Type (A-Z)" },
  { value: "-proposal_type", label: "Research Type (Z-A)" },
  { value: "call", label: "Grant Call (A-Z)" },
  { value: "-call", label: "Grant Call (Z-A)" },
  { value: "-budget_requested", label: "Highest Budget" },
  { value: "budget_requested", label: "Lowest Budget" },
  { value: "-average_score", label: "Highest Score" },
  { value: "average_score", label: "Lowest Score" },
  { value: "funding_decision_status", label: "Decision (A-Z)" },
  { value: "-funding_decision_status", label: "Decision (Z-A)" },
];

// ============================================================================
// Helpers
// ============================================================================

function formatBudget(value: number): string {
  if (value >= 1_000_000) return `ETB ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `ETB ${(value / 1_000).toFixed(0)}K`;
  return `ETB ${value.toLocaleString()}`;
}

// ============================================================================
// Component
// ============================================================================

export default function ReadyForFundingPage() {
  const router = useRouter();

  // --- Filter state ---
  const [search, setSearch] = useState("");
  const [organization, setOrganization] = useState(ALL_VALUE);
  const [unit, setUnit] = useState(ALL_VALUE);
  const [proposalType, setProposalType] = useState(ALL_VALUE);
  const [grantCall, setGrantCall] = useState(ALL_VALUE);
  const [fundingDecisionStatus, setFundingDecisionStatus] = useState(ALL_VALUE);
  const [hasFundingDecision, setHasFundingDecision] = useState(ALL_VALUE);
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [ordering, setOrdering] = useState("-id");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // --- Debounced search ---
  const debouncedSearch = useDebounce(search, 350);

  // --- Reference data ---
  const { data: organizationsResponse } = useOrganizations({ limit: 200 });
  const { data: unitsResponse } = useUnitsWithParams({
    limit: 200,
    organization: organization !== ALL_VALUE ? organization : undefined,
  });
  const { data: proposalTypesResponse } = useProposalTypes();
  const { data: grantCallsResponse } = useGrantCalls({ limit: 200, ordering: "title" });

  const organizations = organizationsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];
  const proposalTypes = proposalTypesResponse?.data ?? [];
  const grantCalls = grantCallsResponse?.data ?? [];

  // --- Compute API params ---
  const queryParams = useMemo(() => {
    return {
      page: 1,
      limit: 100,
      ordering,
    };
  }, [ordering]);

  // --- Fetch data via react-query ---
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ready-for-funding", queryParams],
    queryFn: () => readyForFundingService.list(queryParams as any),
  });

  const rawRows = useMemo(() => data?.data ?? [], [data?.data]);

  const rows = useMemo(() => {
    let list = rawRows;
    if (statusFilter === "pending") {
      list = list.filter((r: any) => !r.has_funding_decision && !r.hasFundingDecision);
    } else if (statusFilter === "decided") {
      list = list.filter((r: any) => r.has_funding_decision || r.hasFundingDecision);
    } else {
      if (fundingDecisionStatus !== ALL_VALUE) {
        list = list.filter((r: any) => (r.funding_decision_status || r.fundingDecisionStatus) === fundingDecisionStatus);
      }
      if (hasFundingDecision !== ALL_VALUE) {
        const boolVal = hasFundingDecision === "true";
        list = list.filter((r: any) => Boolean(r.has_funding_decision || r.hasFundingDecision) === boolVal);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((r: any) => {
        const title = (r.proposal_title || r.proposalTitle || r.title || "").toLowerCase();
        const ref = (r.reference_number || r.referenceNumber || "").toLowerCase();
        const pi = (r.principal_investigator_name || r.piName || "").toLowerCase();
        return title.includes(q) || ref.includes(q) || pi.includes(q);
      });
    }

    return list;
  }, [rawRows, statusFilter, fundingDecisionStatus, hasFundingDecision, search]);
  const statistics = useMemo(
    () =>
      data?.meta?.statistics ?? {
        totalProposals: 0,
        pendingDecisions: 0,
        decisionsCreated: 0,
        totalRequested: 0,
        totalFundedAmount: 0,
        averageScore: 0,
        averageScorePercentage: 0,
      },
    [data?.meta?.statistics],
  );

  // --- Stat card click handler ---
  const applyStatusFilter = useCallback((filter: StatusFilter) => {
    setStatusFilter((current) => (current === filter ? "all" : filter));
    // Reset manual decision filters when clicking a stat card
    setFundingDecisionStatus(ALL_VALUE);
    setHasFundingDecision(ALL_VALUE);
  }, []);

  // --- Clear all filters ---
  const clearFilters = useCallback(() => {
    setSearch("");
    setOrganization(ALL_VALUE);
    setUnit(ALL_VALUE);
    setProposalType(ALL_VALUE);
    setGrantCall(ALL_VALUE);
    setFundingDecisionStatus(ALL_VALUE);
    setHasFundingDecision(ALL_VALUE);
    setMinScore("");
    setMaxScore("");
    setOrdering("-id");
    setStatusFilter("all");
    setAdvancedFiltersOpen(false);
  }, []);

  // --- Active filter count ---
  const activeFilterCount = useMemo(
    () =>
      [
        search.trim(),
        organization !== ALL_VALUE,
        unit !== ALL_VALUE,
        proposalType !== ALL_VALUE,
        grantCall !== ALL_VALUE,
        fundingDecisionStatus !== ALL_VALUE,
        hasFundingDecision !== ALL_VALUE,
        minScore.trim(),
        maxScore.trim(),
        ordering !== "-id",
        statusFilter !== "all",
      ].filter(Boolean).length,
    [
      search,
      organization,
      unit,
      proposalType,
      grantCall,
      fundingDecisionStatus,
      hasFundingDecision,
      minScore,
      maxScore,
      ordering,
      statusFilter,
    ],
  );

  // --- Stat cards config ---
  const statCards: Array<{
    key: StatusFilter;
    label: string;
    value: number | string;
    icon: typeof ShieldCheck;
    color: string;
    bg: string;
    border: string;
    activeRing: string;
    sub: string;
  }> = useMemo(
    () => [
      {
        key: "all",
        label: "Total Proposals",
        value: statistics.totalProposals,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "Approved proposals awaiting funding",
      },
      {
        key: "pending",
        label: "Pending Decisions",
        value: statistics.pendingDecisions,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Funding decisions to complete",
      },
      {
        key: "decided",
        label: "Decisions Made",
        value: statistics.decisionsCreated,
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        activeRing: "ring-green-500/60 border-green-300",
        sub: "Proposals with a decision record",
      },
      {
        key: "total_funding",
        label: "Total Funding",
        value: formatBudget(statistics.totalRequested),
        icon: DollarSign,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Combined requested budget",
      },
    ],
    [statistics],
  );

  // --- Table columns (server-side sorting) ---
  const columns: ColumnDef<ReadyForFundingItem>[] = useMemo(
    () => [
      {
        accessorKey: "referenceNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Reference
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <ReferenceCell refNum={row.original.referenceNumber || "—"} />
        ),
      },
      {
        accessorKey: "proposalTitle",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Proposal
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[380px] py-1">
            <Link
              href={`/research/ready-for-funding/${row.original.screeningId}`}
              className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary transition-colors"
            >
              {row.original.proposalTitle}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "proposalType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Research Type
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold uppercase">
            {row.original.proposalType || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "call",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Grant Call
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.call || "—"}
          </span>
        ),
      },
      {
        accessorKey: "pi",
        header: "PI",
        cell: ({ row }) => <PiUserCell pi={row.original.pi} />,
      },
      {
        accessorKey: "budgetRequested",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Budget
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-sm font-medium text-muted-foreground">
            {formatBudget(row.original.budgetRequested)}
          </span>
        ),
      },
      {
        accessorKey: "averageScorePercentage",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Score
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            {row.original.averageScorePercentage}%
          </Badge>
        ),
      },
      {
        accessorKey: "fundingDecisionStatus",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-0 font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Decision
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.original.fundingDecisionStatus || "pending";
          const isNotAccepted = status === "rejected" || status === "not_accepted";
          return (
            <Badge
              className={cn(
                "text-[10px] font-bold capitalize",
                status === "approved"
                  ? "border border-green-200 bg-green-100 text-green-700 hover:bg-green-100"
                  : isNotAccepted
                    ? "border border-red-200 bg-red-100 text-red-700 hover:bg-red-100"
                    : "border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100",
              )}
            >
              {isNotAccepted ? "Not Accepted" : status.replace(/_/g, " ")}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/research/ready-for-funding/${row.original.screeningId}`)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-emerald-600"
                onClick={() =>
                  router.push(`/research/ready-for-funding/${row.original.screeningId}`)
                }
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Funding Decision
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router],
  );

  // --- Toolbar ---
  const renderToolbar = useCallback(
    (table: Table<ReadyForFundingItem>) => (
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Funding Queue</p>
            <p className="text-xs text-muted-foreground">
              {statusFilter === "pending"
                ? "Showing pending decisions"
                : statusFilter === "decided"
                  ? "Showing decided proposals"
                  : `${rows.length} proposal${rows.length === 1 ? "" : "s"} found`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, reference…"
                className="h-10 w-full pl-9 sm:w-60 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={ordering} onValueChange={setOrdering}>
              <SelectTrigger className="h-10 w-44 focus:ring-primary/20">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={fundingDecisionStatus}
              onValueChange={(v) => {
                setFundingDecisionStatus(v);
                setStatusFilter("all");
              }}
            >
              <SelectTrigger className="h-10 w-36 focus:ring-primary/20">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All decisions</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Not Accepted</SelectItem>
              </SelectContent>
            </Select>

            <DataTableViewOptions table={table} />

            {activeFilterCount > 0 && (
              <>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {activeFilterCount} active
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        <Accordion
          type="single"
          collapsible
          value={advancedFiltersOpen ? "advanced-filters" : ""}
          onValueChange={(value) =>
            setAdvancedFiltersOpen(value === "advanced-filters")
          }
          className="w-full"
        >
          <AccordionItem value="advanced-filters" className="border-0">
            <AccordionTrigger className="py-0 text-xs font-medium text-muted-foreground hover:no-underline">
              Advanced filters
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SearchableSelect
                  value={organization}
                  onValueChange={setOrganization}
                  placeholder="All organizations"
                  searchPlaceholder="Filter organization..."
                  additionalOptions={[{ id: ALL_VALUE, name: "All organizations" }, ...organizations]}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  triggerClassName="h-9 text-xs"
                />

                <SearchableSelect
                  value={unit}
                  onValueChange={setUnit}
                  placeholder="All units"
                  searchPlaceholder="Filter research unit..."
                  additionalOptions={[{ id: ALL_VALUE, name: "All units" }, ...units]}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  triggerClassName="h-9 text-xs"
                />

                <Select value={proposalType} onValueChange={setProposalType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Research Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All research types</SelectItem>
                    {proposalTypes.map((item, idx) => {
                      const itemVal = item.id != null ? String(item.id) : `pt-${idx}`;
                      return (
                        <SelectItem key={`pt-${itemVal}-${idx}`} value={itemVal}>
                          {item.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <SearchableSelect
                  value={grantCall}
                  onValueChange={setGrantCall}
                  placeholder="All grant calls"
                  searchPlaceholder="Filter grant call..."
                  additionalOptions={[{ id: ALL_VALUE, title: "All grant calls" }, ...grantCalls]}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.title}
                  triggerClassName="h-9 text-xs"
                />

                <Select value={hasFundingDecision} onValueChange={setHasFundingDecision}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Funding Record" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Any funding record</SelectItem>
                    <SelectItem value="true">Has funding decision</SelectItem>
                    <SelectItem value="false">No funding decision</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    value={minScore}
                    onChange={(event) => setMinScore(event.target.value)}
                    placeholder="Min score %"
                    type="number"
                    min={0}
                    max={100}
                    className="h-9"
                  />
                  <Input
                    value={maxScore}
                    onChange={(event) => setMaxScore(event.target.value)}
                    placeholder="Max score %"
                    type="number"
                    min={0}
                    max={100}
                    className="h-9"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
    [
      search,
      ordering,
      fundingDecisionStatus,
      statusFilter,
      activeFilterCount,
      advancedFiltersOpen,
      organization,
      unit,
      proposalType,
      grantCall,
      hasFundingDecision,
      minScore,
      maxScore,
      rows.length,
      organizations,
      units,
      proposalTypes,
      grantCalls,
      clearFilters,
    ],
  );

  // --- Render ---
  return (
    <PageContainer
      title="Ready for Funding"
      description="Approved proposals awaiting funding decisions"
    >
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat) => {
                const isActive = statusFilter === stat.key;
                return (
                  <Card
                    key={stat.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => applyStatusFilter(stat.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applyStatusFilter(stat.key);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border shadow-sm transition-all hover:shadow-md",
                      stat.border,
                      isActive && cn("ring-2 shadow-md", stat.activeRing),
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={cn("shrink-0 rounded-xl p-3", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      <div>
                        <div className="text-2xl font-black">{stat.value}</div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {stat.sub}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Error state */}
        {isError ? (
          <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <div className="rounded-full bg-rose-100 p-4 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">Unable to load ready-for-funding data</p>
                <p className="text-sm text-muted-foreground">
                  Check the backend connection and try again.
                </p>
              </div>
              <Button onClick={() => void refetch()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : /* Table */
        isLoading && rows.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            toolbar={renderToolbar}
            initialColumnVisibility={{ referenceNumber: false }}
            onRowClick={(row) =>
              router.push(`/research/ready-for-funding/${row.screeningId}`)
            }
            emptyMessage="No proposals match your criteria"
            emptyDescription="Try adjusting your filters or search term."
          />
        )}
      </div>
    </PageContainer>
  );
}
