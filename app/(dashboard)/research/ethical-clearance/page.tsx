"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import type { EthicalClearance } from "@/types/ethical-clearance";
import { useEthicalClearances } from "@/lib/queries/ethical-clearance";
import { useReviewedWithMarksScreenings } from "@/lib/queries/screenings";

const ALL_VALUE = "all";

const clearanceTypeLabel: Record<string, string> = {
  full_board: "Full Board Review",
  expedited: "Expedited Review",
  exempt: "Exempt",
  informed_consent_waiver: "Informed Consent Waiver",
};

const clearanceTypeOptions = [
  "full_board",
  "expedited",
  "exempt",
  "informed_consent_waiver",
];

const statusConfig: Record<
  EthicalClearance["status"],
  { label: string; className: string; icon: typeof Shield }
> = {
  pending: {
    label: "Pending Review",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  additional_info_required: {
    label: "Additional Information Required",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: AlertCircle,
  },
};

type EthicalClearanceRow = {
  rowKey: string;
  ethicalId: number | null;
  screeningId: number | null;
  proposalId: number | null;
  reference: string;
  proposalTitle: string;
  piName: string;
  clearanceType: string;
  status: EthicalClearance["status"];
  applicationDate: string | null;
  requestFileUrl: string | null;
  clearanceFileUrl: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveFileUrl(filePath?: string | null) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith("/bff")) return filePath;
  if (filePath.startsWith("/")) return `/bff${filePath}`;
  return `/bff/${filePath}`;
}

function firstDefined<T>(...values: Array<T | null | undefined>): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeStatus(value?: string | null): EthicalClearance["status"] {
  if (!value) return "pending";
  const v = String(value).toLowerCase();
  if (v.includes("approved")) return "approved";
  if (v.includes("rejected")) return "rejected";
  if (v.includes("additional") || v.includes("additional_info")) {
    return "additional_info_required";
  }
  return "pending";
}

function mapToRow(item: Record<string, unknown>): EthicalClearanceRow | null {
  const needsIrb = firstDefined(
    item.need_irb_ethical_clearance,
    item.needIrbEthicalClearance,
    (item.proposal as Record<string, unknown> | undefined)?.need_irb_ethical_clearance,
    (item.proposal as Record<string, unknown> | undefined)?.needIrbEthicalClearance,
  );

  if (needsIrb !== true) return null;

  const ethicalId = firstDefined(
    item.id,
    item.ethicalClearanceId,
    item.ethical_clearance_id,
  );
  const screeningId = firstDefined(item.screeningId, item.screening_id);
  const proposalId = firstDefined(
    item.proposalId,
    item.proposal,
    item.proposalReadyForFundingId,
    item.proposal_ready_for_funding_id,
  );

  const statusKey = firstDefined(
    item.ethicalClearanceStatus,
    item.status,
  );

  const clearanceType = String(
    firstDefined(
      item.clearanceType,
      item.ethicalClearanceType,
      item.clearance_type,
    ) ?? "",
  );

  const reference =
    String(
      firstDefined(item.referenceNumber, item.reference_number) ??
        (ethicalId ? `EC-${ethicalId}` : screeningId ? `SCR-${screeningId}` : "—"),
    );

  const pi = item.pi;
  const piName =
    typeof pi === "string"
      ? pi
      : pi && typeof pi === "object"
        ? String(
            firstDefined(
              (pi as Record<string, unknown>).fullName,
              (pi as Record<string, unknown>).name,
              (pi as Record<string, unknown>).first_name,
              (pi as Record<string, unknown>).firstName,
            ) ?? "—",
          )
        : "—";

  const rowKey = String(ethicalId ?? screeningId ?? proposalId ?? reference);

  return {
    rowKey,
    ethicalId: ethicalId != null ? Number(ethicalId) : null,
    screeningId: screeningId != null ? Number(screeningId) : null,
    proposalId: proposalId != null ? Number(proposalId) : null,
    reference,
    proposalTitle: String(
      firstDefined(
        item.proposalTitle,
        item.proposal_title,
        (item.proposal as Record<string, unknown> | undefined)?.title,
      ) ?? "Untitled proposal",
    ),
    piName,
    clearanceType,
    status: normalizeStatus(
      statusKey != null ? String(statusKey) : null,
    ),
    applicationDate: String(
      firstDefined(
        item.applicationDate,
        item.ethicalClearanceApplicationDate,
        item.ethicalClearance_application_date,
        item.application_date,
      ) ?? "",
    ) || null,
    requestFileUrl: resolveFileUrl(
      String(firstDefined(item.requestFile, item.request_file) ?? "") || null,
    ),
    clearanceFileUrl: resolveFileUrl(
      String(firstDefined(item.clearanceFile, item.clearance_file) ?? "") || null,
    ),
  };
}

function resolveDetailPath(row: EthicalClearanceRow) {
  if (row.ethicalId) return `/research/ethical-clearance/${row.ethicalId}`;
  if (row.proposalId) return `/research/proposals/${row.proposalId}`;
  if (row.screeningId) return `/research/ethical-clearance/${row.screeningId}`;
  return null;
}

export default function EthicalClearancePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_VALUE);
  const [clearanceType, setClearanceType] = useState(ALL_VALUE);
  const [proposal, setProposal] = useState("");
  const [ordering, setOrdering] = useState("-application_date");
  const [source, setSource] = useState<"reviewed" | "ethical">("ethical");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const parsedProposal = proposal.trim() ? Number(proposal) : undefined;
  const proposalFilter =
    parsedProposal !== undefined && Number.isNaN(parsedProposal)
      ? undefined
      : parsedProposal;

  const ethicalFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status:
        status !== ALL_VALUE
          ? (status as EthicalClearance["status"])
          : undefined,
      clearance_type: clearanceType !== ALL_VALUE ? clearanceType : undefined,
      proposal: proposalFilter,
      ordering: ordering || undefined,
      need_irb_ethical_clearance: true,
    }),
    [debouncedSearch, status, clearanceType, proposalFilter, ordering],
  );

  const reviewedFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      ethical_clearance_status:
        status !== ALL_VALUE ? status : undefined,
      ethical_clearance_type:
        clearanceType !== ALL_VALUE ? clearanceType : undefined,
      proposal: proposalFilter,
      ordering: ordering || undefined,
      need_irb_ethical_clearance: true,
    }),
    [debouncedSearch, status, clearanceType, proposalFilter, ordering],
  );

  const reviewedQuery = useReviewedWithMarksScreenings(reviewedFilters);
  const ethicalQuery = useEthicalClearances(ethicalFilters);

  const { data, isLoading, error, isFetching } =
    source === "reviewed" ? reviewedQuery : ethicalQuery;

  const rows = useMemo(() => {
    const clearances = (data as { data?: unknown[] } | undefined)?.data ?? [];
    return clearances
      .map((item) => mapToRow(item as Record<string, unknown>))
      .filter((row): row is EthicalClearanceRow => row !== null);
  }, [data]);

  const stats = useMemo(
    () => [
      {
        label: "Total Applications",
        value: rows.length,
        icon: FileText,
        color: "text-slate-700",
        bg: "bg-slate-700",
      },
      {
        label: "Pending Review",
        value: rows.filter((row) => row.status === "pending").length,
        icon: Clock,
        color: "text-blue-600",
        bg: "bg-blue-600",
      },
      {
        label: "Approved",
        value: rows.filter((row) => row.status === "approved").length,
        icon: ShieldCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-600",
      },
      {
        label: "Action Required",
        value: rows.filter((row) => row.status === "additional_info_required")
          .length,
        icon: AlertCircle,
        color: "text-amber-600",
        bg: "bg-amber-600",
      },
    ],
    [rows],
  );

  const activeFilterCount = [
    search.trim(),
    status !== ALL_VALUE,
    clearanceType !== ALL_VALUE,
    proposal.trim(),
    ordering !== "-application_date",
    source !== "ethical",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setStatus(ALL_VALUE);
    setClearanceType(ALL_VALUE);
    setProposal("");
    setOrdering("-application_date");
    setSource("ethical");
    setAdvancedFiltersOpen(false);
  };

  const columns: ColumnDef<EthicalClearanceRow>[] = [
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">{row.original.reference}</span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-[320px] space-y-1">
          <p className="line-clamp-1 font-semibold text-sm">
            {row.original.proposalTitle}
          </p>
          {row.original.proposalId ? (
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Proposal ID {row.original.proposalId}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "piName",
      header: "PI",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.piName}
        </span>
      ),
    },
    {
      accessorKey: "clearanceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-bold capitalize">
          {clearanceTypeLabel[row.original.clearanceType] ||
            row.original.clearanceType ||
            "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusCfg = statusConfig[row.original.status];
        const StatusIcon = statusCfg.icon;

        return (
          <Badge
            className={cn(
              "gap-1 border px-2 text-[10px] font-bold uppercase shadow-none",
              statusCfg.className,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "applicationDate",
      header: "Applied",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(row.original.applicationDate)}
        </div>
      ),
    },
    {
      id: "files",
      header: "Files",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide">
          <a
            href={row.original.requestFileUrl || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1 text-primary hover:underline",
              !row.original.requestFileUrl &&
                "pointer-events-none text-muted-foreground/50",
            )}
          >
            <FileText className="h-3 w-3" />
            Request
          </a>
          <a
            href={row.original.clearanceFileUrl || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1 text-emerald-600 hover:underline",
              !row.original.clearanceFileUrl &&
                "pointer-events-none text-muted-foreground/50",
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            Clearance
          </a>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const detailPath = resolveDetailPath(row.original);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!detailPath}
                onClick={() => {
                  if (detailPath) router.push(detailPath);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Ethical Clearance"
      description="Track ethics review applications, decisions, and supporting files."
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="group relative overflow-hidden border-none shadow-md transition-all hover:shadow-lg"
                >
                  <div className={cn("absolute inset-y-0 left-0 w-1", stat.bg)} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {error ? (
          <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Shield className="h-8 w-8 text-rose-600" />
              <div className="space-y-1">
                <p className="font-semibold">Unable to load ethical clearances</p>
                <p className="text-sm text-muted-foreground">
                  Check the backend connection and try again.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            toolbar={
              <div className="rounded-2xl border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 overflow-hidden">
                <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_160px] xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title, reference, PI, or organization..."
                        className="h-9"
                      />

                      <Select value={ordering} onValueChange={setOrdering}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-application_date">
                            Newest first
                          </SelectItem>
                          <SelectItem value="application_date">
                            Oldest first
                          </SelectItem>
                          <SelectItem value="reference_number">
                            Reference A-Z
                          </SelectItem>
                          <SelectItem value="-reference_number">
                            Reference Z-A
                          </SelectItem>
                          <SelectItem value="status">Status A-Z</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                          {Object.entries(statusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={clearanceType}
                        onValueChange={setClearanceType}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Clearance type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_VALUE}>All types</SelectItem>
                          {clearanceTypeOptions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {clearanceTypeLabel[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-auto">
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
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <Select
                            value={source}
                            onValueChange={(value) =>
                              setSource(value as "reviewed" | "ethical")
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Data source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ethical">
                                Ethical clearances
                              </SelectItem>
                              <SelectItem value="reviewed">
                                Reviewed screenings
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            value={proposal}
                            onChange={(event) => setProposal(event.target.value)}
                            placeholder="Proposal ID"
                            className="h-9"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            }
            onRowClick={(row) => {
              const detailPath = resolveDetailPath(row);
              if (detailPath) router.push(detailPath);
            }}
            emptyMessage="No ethical clearance applications found"
            emptyDescription="Try widening your filters or search term."
          />
        )}
      </div>
    </PageContainer>
  );
}
