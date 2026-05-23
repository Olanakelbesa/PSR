"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  RefreshCcw,
  Search,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { EthicalClearance } from "@/types/ethical-clearance";
import { useEthicalClearances } from "@/lib/queries/ethical-clearance";
import { useReviewedWithMarksScreenings } from "@/lib/queries/screenings";

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
  if (filePath.startsWith("/api/proxy")) return filePath;
  if (filePath.startsWith("/")) return `/api/proxy${filePath}`;
  return `/api/proxy/${filePath}`;
}

function firstDefined<T>(...values: Array<T | null | undefined>): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeStatus(value?: string | null) {
  if (!value) return "pending";
  const v = String(value).toLowerCase();
  if (v.includes("approved")) return "approved";
  if (v.includes("rejected")) return "rejected";
  if (v.includes("additional") || v.includes("additional_info")) return "additional_info_required";
  return "pending";
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  icon: typeof FileText;
  accent: string;
}) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <div/>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-[0.22em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div className="text-3xl font-black">{value}</div>
        <div className={cn("rounded-full p-3", accent)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-9 w-full max-w-sm" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EthicalClearancePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EthicalClearance["status"] | "">("");
  const [clearanceType, setClearanceType] = useState("");
  const [proposal, setProposal] = useState("");
  const [ordering, setOrdering] = useState("");

  const parsedProposal = proposal.trim() ? Number(proposal) : undefined;

  const ethicalFilters = {
    search: search.trim() || undefined,
    status: status || undefined,
    clearance_type: clearanceType || undefined,
    proposal:
      parsedProposal !== undefined && Number.isNaN(parsedProposal)
        ? undefined
        : parsedProposal,
    ordering: ordering || undefined,
    need_irb_ethical_clearance: true,
  };

  const reviewedFilters = {
    search: search.trim() || undefined,
    ethical_clearance_status: status || undefined,
    ethical_clearance_type: clearanceType || undefined,
    proposal:
      parsedProposal !== undefined && Number.isNaN(parsedProposal)
        ? undefined
        : parsedProposal,
    ordering: ordering || undefined,
    need_irb_ethical_clearance: true,
  };

  const [source, setSource] = useState<"reviewed" | "ethical">("reviewed");

  const reviewedQuery = useReviewedWithMarksScreenings(reviewedFilters as any);
  const ethicalQuery = useEthicalClearances(ethicalFilters as any);

  const { data, isLoading, error, refetch, isFetching } =
    source === "reviewed" ? reviewedQuery : ethicalQuery;

  const clearances = (data as any)?.data ?? [];
  const visibleClearances = clearances.filter((item: any) => {
    return (
      firstDefined(
        item?.need_irb_ethical_clearance,
        item?.needIrbEthicalClearance,
        item?.proposal?.need_irb_ethical_clearance,
        item?.proposal?.needIrbEthicalClearance,
      ) === true
    );
  });

  const stats = [
    {
      title: "Total Applications",
      value: clearances.length,
      icon: FileText,
      accent: "bg-slate-700",
    },
    {
      title: "Pending Review",
      value: clearances.filter((item: any) => {
          const s = normalizeStatus(firstDefined(item.ethicalClearanceStatus, item.status));
          return s === "pending";
        }).length,
      icon: Clock,
      accent: "bg-blue-600",
    },
    {
      title: "Approved",
      value: clearances.filter((item: any) => {
          const s = normalizeStatus(firstDefined(item.ethicalClearanceStatus, item.status));
          return s === "approved";
        }).length,
      icon: ShieldCheck,
      accent: "bg-emerald-600",
    },
    {
      title: "Action Required",
      value: clearances.filter((item: any) => {
          const s = normalizeStatus(firstDefined(item.ethicalClearanceStatus, item.status));
          return s === "additional_info_required";
        }).length,
      icon: AlertCircle,
      accent: "bg-amber-600",
    },
  ];

  const showEmptyState = !isLoading && !error && clearances.length === 0;

  return (
    <PageContainer
      title="Ethical Clearance"
      description="Track ethics review applications, decisions and supporting files from the backend."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))
            : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
        </div>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-primary" />
                  Filters
                </CardTitle>
                <CardDescription>
                  Search and narrow ethical clearance applications using backend
                  query parameters.
                </CardDescription>
              </div>

              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, reference, PI or organization"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <Select
                value={status || "__all__"}
                onValueChange={(value) =>
                  setStatus(
                    value === "__all__"
                      ? ""
                      : (value as EthicalClearance["status"]),
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Clearance Type
              </label>
              <Select
                value={clearanceType || "__all__"}
                onValueChange={(value) =>
                  setClearanceType(value === "__all__" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  {clearanceTypeOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {clearanceTypeLabel[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Source
              </label>
              <Select value={source} onValueChange={(v) => setSource(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewed">Reviewed (screenings)</SelectItem>
                  <SelectItem value="ethical">Ethical Clearances</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Proposal
              </label>
              <Input
                type="number"
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Proposal ID"
              />
            </div>

            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Ordering
              </label>
              <Select value={ordering} onValueChange={setOrdering}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-application_date">
                    Newest first
                  </SelectItem>
                  <SelectItem value="application_date">Oldest first</SelectItem>
                  <SelectItem value="reference_number">
                    Reference A-Z
                  </SelectItem>
                  <SelectItem value="-reference_number">
                    Reference Z-A
                  </SelectItem>
                  <SelectItem value="status">Status A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-between gap-3 xl:col-span-3">
              <p className="text-xs text-muted-foreground">
                {isFetching
                  ? "Refreshing results..."
                  : `${visibleClearances.length} record(s) loaded`}
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setClearanceType("");
                  setProposal("");
                  setOrdering("-application_date");
                }}
              >
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <div className="rounded-full bg-rose-100 p-4 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  Unable to load ethical clearances
                </p>
                <p className="text-sm text-muted-foreground">
                  Check the backend connection and try again.
                </p>
              </div>
              <Button onClick={() => refetch()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : showEmptyState ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-muted p-4 text-muted-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  No ethical clearance applications found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try widening your filters or search term.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Proposal</th>
                    <th className="px-4 py-3">PI</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Applied</th>
                    <th className="px-4 py-3">Files</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClearances.map((item: any) => {
                    const statusKey = firstDefined(
                      item.ethicalClearanceStatus,
                      item.status,
                    );
                    const normalizedStatus = normalizeStatus(statusKey);
                    const statusCfg = statusConfig[normalizedStatus as EthicalClearance["status"]];
                    const StatusIcon = statusCfg.icon;

                    const requestFileUrl = resolveFileUrl(
                      firstDefined(item.requestFile, item.request_file),
                    );
                    const clearanceFileUrl = resolveFileUrl(
                      firstDefined(item.clearanceFile, item.clearance_file),
                    );

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

                    const id = ethicalId ?? screeningId ?? null;
                    const reference = firstDefined(item.referenceNumber, item.reference_number) ||
                      (ethicalId ? `EC-${ethicalId}` : screeningId ? `SCR-${screeningId}` : "—");
                    const proposalTitle = firstDefined(
                      item.proposalTitle,
                      item.proposal_title,
                      item.proposal?.title,
                    ) || "Untitled proposal";
                    const clearanceType = firstDefined(
                      item.clearanceType,
                      item.ethicalClearanceType,
                      item.clearance_type,
                    );
                    const applicationDate = firstDefined(
                      item.applicationDate,
                      item.ethicalClearanceApplicationDate,
                      item.ethicalClearance_application_date,
                      item.application_date,
                    );

                    return (
                      <tr
                        key={id ?? Math.random()}
                        className="border-b last:border-b-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => {
                              if (ethicalId) {
                                router.push(`/research/ethical-clearance/${ethicalId}`);
                              } else if (proposalId) {
                                router.push(`/research/proposals/${proposalId}`);
                              } else if (screeningId) {
                                router.push(`/research/ethical-clearance/${screeningId}`);
                              }
                            }}
                            className="font-bold text-primary hover:underline"
                          >
                            {reference}
                          </button>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="max-w-[320px] space-y-1">
                            <p className="line-clamp-1 font-semibold">
                              {proposalTitle}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                              Proposal ID {proposalId}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-muted-foreground">
                          {typeof item.pi === "string"
                            ? item.pi
                            : item.pi?.fullName || item.pi?.name || item.pi?.first_name || item.pi?.firstName || "—"}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Badge
                            variant="outline"
                            className="font-bold capitalize"
                          >
                            {clearanceTypeLabel[clearanceType] || clearanceType || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Badge
                            className={cn(
                              "border text-[10px] font-bold uppercase shadow-none gap-1 px-2",
                              statusCfg.className,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 align-top text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(applicationDate)}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide">
                            <a
                              href={requestFileUrl || undefined}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "inline-flex items-center gap-1 text-primary hover:underline",
                                !requestFileUrl &&
                                  "pointer-events-none text-muted-foreground/50",
                              )}
                            >
                              <FileText className="h-3 w-3" />
                              Request file
                            </a>
                            <a
                              href={clearanceFileUrl || undefined}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "inline-flex items-center gap-1 text-emerald-600 hover:underline",
                                !clearanceFileUrl &&
                                  "pointer-events-none text-muted-foreground/50",
                              )}
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Clearance file
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (ethicalId) {
                                router.push(`/research/ethical-clearance/${ethicalId}`);
                              } else if (proposalId) {
                                router.push(`/research/proposals/${proposalId}`);
                              } else if (screeningId) {
                                router.push(`/research/ethical-clearance/${screeningId}`);
                              }
                            }}
                          >
                            View
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
