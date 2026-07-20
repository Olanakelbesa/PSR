"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
  const [rows, setRows] = useState<ReadyForFundingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [statistics, setStatistics] = useState({
    totalProposals: 0,
    pendingDecisions: 0,
    decisionsCreated: 0,
    totalRequested: 0,
    totalFundedAmount: 0,
    averageScore: 0,
    averageScorePercentage: 0,
  });

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
    const params: Record<string, unknown> = {
      page: 1,
      limit: 100,
      search: debouncedSearch.trim() || undefined,
      ordering,
    };

    if (organization !== ALL_VALUE) params.organization = Number(organization);
    if (unit !== ALL_VALUE) params.unit = Number(unit);
    if (proposalType !== ALL_VALUE) params.proposal_type = Number(proposalType);
    if (grantCall !== ALL_VALUE) params.call = Number(grantCall);
    if (minScore) params.min_score = Number(minScore);
    if (maxScore) params.max_score = Number(maxScore);

    // Status card filter takes priority over manual decision filter
    if (statusFilter === "pending") {
      params.funding_decision_status = "pending";
    } else if (statusFilter === "decided") {
      params.has_funding_decision = true;
    } else {
      if (fundingDecisionStatus !== ALL_VALUE) {
        params.funding_decision_status = fundingDecisionStatus as "pending" | "approved" | "rejected" | "deferred";
      }
      if (hasFundingDecision !== ALL_VALUE) {
        params.has_funding_decision = hasFundingDecision === "true";
      }
    }

    return params;
  }, [
    debouncedSearch,
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
  ]);

  // --- Fetch data ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const res = await readyForFundingService.list(queryParams as any);
        if (cancelled) return;

        setRows(res.data ?? []);
        setStatistics(
          res.meta?.statistics ?? {
            totalProposals: res.data?.length ?? 0,
            pendingDecisions: 0,
            decisionsCreated: 0,
            totalRequested: 0,
            totalFundedAmount: 0,
            averageScore: 0,
            averageScorePercentage: 0,
          },
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load ready-for-funding:", err);
        setRows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [queryParams]);

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
          <span className="font-bold text-primary">
            {row.original.referenceNumber}
          </span>
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
          <div className="min-w-[200px] max-w-[360px] py-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {row.original.proposalTitle}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
              {row.original.organization || "—"}
            </p>
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
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-bold">
              {row.original.pi?.fullName || "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {row.original.pi?.email || ""}
            </span>
          </div>
        ),
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
          return (
            <Badge
              className={cn(
                "text-[10px] font-bold",
                status === "approved"
                  ? "border border-green-200 bg-green-100 text-green-700 hover:bg-green-100"
                  : status === "rejected"
                    ? "border border-red-200 bg-red-100 text-red-700 hover:bg-red-100"
                    : "border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100",
              )}
            >
              {status.replace(/_/g, " ")}
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
  const toolbar = useMemo(
    () => (
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
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="deferred">Deferred</SelectItem>
              </SelectContent>
            </Select>

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
                <Select value={organization} onValueChange={setOrganization}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All organizations</SelectItem>
                    {organizations.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All units</SelectItem>
                    {units.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={proposalType} onValueChange={setProposalType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Research Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All research types</SelectItem>
                    {proposalTypes.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={grantCall} onValueChange={setGrantCall}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Grant Call" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All grant calls</SelectItem>
                    {grantCalls.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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

        {/* Table */}
        {isLoading && rows.length === 0 ? (
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
            toolbar={toolbar}
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
