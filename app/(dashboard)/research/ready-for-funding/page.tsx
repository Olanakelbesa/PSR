"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Clock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
  readyForFundingService,
  type ReadyForFundingItem,
} from "@/api/services/ready-for-funding.service";

const ALL_VALUE = "all";

export default function ReadyForFundingPage() {
  const router = useRouter();

  const [rows, setRows] = useState<ReadyForFundingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [organization, setOrganization] = useState(ALL_VALUE);
  const [unit, setUnit] = useState(ALL_VALUE);
  const [proposalType, setProposalType] = useState(ALL_VALUE);
  const [fundingDecisionStatus, setFundingDecisionStatus] = useState(ALL_VALUE);
  const [hasFundingDecision, setHasFundingDecision] = useState(ALL_VALUE);
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [ordering, setOrdering] = useState("-id");
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

  const debouncedSearch = useDebounce(search, 350);
  const { data: organizationsResponse } = useOrganizations({ limit: 200 });
  const { data: unitsResponse } = useUnitsWithParams({
    limit: 200,
    organization: organization !== ALL_VALUE ? organization : undefined,
  });
  const { data: proposalTypesResponse } = useProposalTypes();

  const organizations = organizationsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];
  const proposalTypes = proposalTypesResponse?.data ?? [];

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      search: debouncedSearch.trim() || undefined,
      organization:
        organization !== ALL_VALUE ? Number(organization) : undefined,
      unit: unit !== ALL_VALUE ? Number(unit) : undefined,
      proposal_type:
        proposalType !== ALL_VALUE ? Number(proposalType) : undefined,
      has_funding_decision:
        hasFundingDecision === ALL_VALUE
          ? undefined
          : hasFundingDecision === "true",
      funding_decision_status:
        fundingDecisionStatus !== ALL_VALUE
          ? (fundingDecisionStatus as
              | "pending"
              | "approved"
              | "rejected"
              | "deferred")
          : undefined,
      min_score: minScore ? Number(minScore) : undefined,
      max_score: maxScore ? Number(maxScore) : undefined,
      ordering,
    }),
    [
      debouncedSearch,
      organization,
      unit,
      proposalType,
      hasFundingDecision,
      fundingDecisionStatus,
      minScore,
      maxScore,
      ordering,
    ],
  );

  // ==========================================================================
  // Load data from backend
  // ==========================================================================
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await readyForFundingService.list(queryParams);

        setRows(res.data ?? []);
        setStatistics(
          res.meta?.statistics ?? {
            totalProposals: res.data?.length ?? 0,
            pendingDecisions: (res.data ?? []).filter(
              (row) => row.fundingDecisionStatus === "pending" || row.fundingDecisionStatus === null,
            ).length,
            decisionsCreated: (res.data ?? []).filter((row) => row.readyForFundingId !== null).length,
            totalRequested: (res.data ?? []).reduce((sum, row) => sum + (row.budgetRequested || 0), 0),
            totalFundedAmount: (res.data ?? []).reduce(
              (sum, row) => sum + (row.totalFundedAmount || 0),
              0,
            ),
            averageScore:
              (res.data ?? []).length > 0
                ? (res.data ?? []).reduce((sum, row) => sum + (row.averageScore || 0), 0) /
                  (res.data ?? []).length
                : 0,
            averageScorePercentage:
              (res.data ?? []).length > 0
                ? (res.data ?? []).reduce(
                    (sum, row) => sum + (row.averageScorePercentage || 0),
                    0,
                  ) / (res.data ?? []).length
                : 0,
          },
        );
      } catch (err) {
        console.error("Failed to load ready-for-funding:", err);
        setRows([]);
        setStatistics({
          totalProposals: 0,
          pendingDecisions: 0,
          decisionsCreated: 0,
          totalRequested: 0,
          totalFundedAmount: 0,
          averageScore: 0,
          averageScorePercentage: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [queryParams]);

  const clearFilters = () => {
    setSearch("");
    setOrganization(ALL_VALUE);
    setUnit(ALL_VALUE);
    setProposalType(ALL_VALUE);
    setFundingDecisionStatus(ALL_VALUE);
    setHasFundingDecision(ALL_VALUE);
    setMinScore("");
    setMaxScore("");
    setOrdering("-id");
    setAdvancedFiltersOpen(false);
  };

  const activeFilterCount = [
    search.trim(),
    organization !== ALL_VALUE,
    unit !== ALL_VALUE,
    proposalType !== ALL_VALUE,
    fundingDecisionStatus !== ALL_VALUE,
    hasFundingDecision !== ALL_VALUE,
    minScore.trim(),
    maxScore.trim(),
    ordering !== "-id",
  ].filter(Boolean).length;
  // Stats
  const pendingDecisions = statistics.pendingDecisions;
  const totalRequested = statistics.totalRequested;
  const totalFunded = statistics.totalFundedAmount;

  const stats = [
    {
      label: "Ready for Funding",
      value: statistics.totalProposals,
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-600",
      desc: "Approved proposals awaiting funding",
    },
    {
      label: "Pending Decisions",
      value: pendingDecisions,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-600",
      desc: "Funding decisions to complete",
    },
    {
      label: "Total Funding Requested",
      value: `ETB ${(totalRequested / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-600",
      desc: "Combined request",
    },
    {
      label: "Total Funded Amount",
      value: `ETB ${(totalFunded / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-600",
      desc: "Combined awarded",
    },
    {
      label: "Avg Score",
      value: statistics.averageScore.toFixed(1),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary",
      desc: "Screening average",
    },
  ];

  const columns: ColumnDef<ReadyForFundingItem>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.referenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-[420px]">
          <p className="font-bold text-sm line-clamp-2">
            {row.original.proposalTitle}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase mt-1 whitespace-pre-line">
            {row.original.organization}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "pi",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">
            {row.original.pi?.fullName || ""}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.pi?.email || ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "budgetRequested",
      header: "Requested Budget",
      cell: ({ row }) => (
        <div className="font-bold">
          ETB {row.original.budgetRequested?.toLocaleString() || 0}
        </div>
      ),
    },
    {
      accessorKey: "totalFundedAmount",
      header: "Funded",
      cell: ({ row }) => (
        <div className="font-bold text-green-700">
          {row.original.totalFundedAmount ? `ETB ${row.original.totalFundedAmount.toLocaleString()}` : "—"}
        </div>
      ),
    },
    {
      accessorKey: "averageScore",
      header: "Score",
      cell: ({ row }) => (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          {row.original.averageScorePercentage}%
        </Badge>
      ),
    },
    {
      accessorKey: "fundingDecisionStatus",
      header: "Decision",
      cell: ({ row }) => {
        const status = row.original.fundingDecisionStatus || "pending";
        const statusClasses = cn(
          "rounded-full px-2 py-1 text-[11px] font-semibold",
          status === "approved"
            ? "bg-emerald-50 text-emerald-700"
            : status === "rejected"
            ? "bg-red-50 text-red-700"
            : "bg-amber-50 text-amber-700",
        );

        return <span className={statusClasses}>{status.replace(/_/g, " ")}</span>;
      },
    },
    {
      accessorKey: "needIrbEthicalClearance",
      header: "IRB",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-semibold",
            row.original.needIrbEthicalClearance
              ? "bg-slate-100 text-slate-800"
              : "bg-blue-50 text-blue-700",
          )}
        >
          {row.original.needIrbEthicalClearance ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/research/ready-for-funding/${row.original.screeningId}`,
                )
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-emerald-600"
              onClick={() =>
                router.push(
                  `/research/ready-for-funding/${row.original.screeningId}`,
                )
              }
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Funding Decision
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Ready for Funding"
      description="Screened proposals awaiting funding decision"
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : stats.map((s, i) => (
                <Card key={i} className="relative overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xs uppercase">
                      {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <p className="text-[10px] text-muted-foreground">
                      {s.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            toolbar={
              <div className="rounded-2xl border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 overflow-hidden">
                <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_160px] xl:grid-cols-[minmax(0,1fr)_180px_180px]">
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title, reference number, or PI..."
                        className="h-9"
                      />

                      <Select value={ordering} onValueChange={setOrdering}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-id">Newest</SelectItem>
                          <SelectItem value="id">Oldest</SelectItem>
                          <SelectItem value="-average_score_percentage">
                            Highest score
                          </SelectItem>
                          <SelectItem value="average_score_percentage">
                            Lowest score
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={fundingDecisionStatus}
                        onValueChange={setFundingDecisionStatus}
                      >
                        <SelectTrigger className="h-9">
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
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-auto">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {activeFilterCount} active
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        disabled={activeFilterCount === 0}
                        className="h-8"
                      >
                        Clear
                      </Button>
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
                        More filters
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 pt-3">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                              <SelectValue placeholder="Proposal type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ALL_VALUE}>All proposal types</SelectItem>
                              {proposalTypes.map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={hasFundingDecision}
                            onValueChange={setHasFundingDecision}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Funding record" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ALL_VALUE}>Any funding record</SelectItem>
                              <SelectItem value="true">Has funding decision</SelectItem>
                              <SelectItem value="false">No funding decision</SelectItem>
                            </SelectContent>
                          </Select>

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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            }
            onRowClick={(row) =>
              router.push(
                `/research/ready-for-funding/${row.screeningId}`,
              )
            }
            emptyMessage="No proposals ready for funding"
            emptyDescription="No approved proposals found."
          />
        )}
      </div>
    </PageContainer>
  );
}
