"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit,
  FileText,
} from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import Image from "next/image";
import { useGrantCalls } from "@/lib/queries/grant-calls";
import type { GrantCall } from "@/types/grant-call";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  open: { label: "Open", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  archived: { label: "Archived", variant: "outline" },
};

function isCallOpen(call: GrantCall) {
  const status = (call.status ?? "").toLowerCase();
  if (status && status !== "published" && status !== "open") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (call.openDate) {
    const openDate = parseISO(call.openDate);
    openDate.setHours(0, 0, 0, 0);
    if (isBefore(today, openDate)) return false;
  }

  if (call.closeDate) {
    const closeDate = parseISO(call.closeDate);
    closeDate.setHours(23, 59, 59, 999);
    if (isAfter(today, closeDate)) return false;
  }

  return true;
}

function formatBudget(budget: GrantCall["budget"]) {
  if (budget === null || budget === undefined || budget === "")
    return "Not specified";
  const numericBudget = typeof budget === "string" ? Number(budget) : budget;
  if (Number.isNaN(numericBudget)) return String(budget);
  return `ETB ${numericBudget.toLocaleString()}`;
}

function CallCard({ call }: { call: GrantCall }) {
  const isOpen = isCallOpen(call);
  const deadline = call.closeDate ? parseISO(call.closeDate) : null;
  const daysRemaining = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const status = statusConfig[(call.status ?? "").toLowerCase()] ?? {
    label: call.status ?? "Unknown",
    variant: "secondary" as const,
  };
  const proposalTypes = call.proposalTypes ?? [];

  return (
    <Card className="hover:shadow-md transition-shadow border-border/60 h-full flex flex-col overflow-hidden">
      <div className="relative h-60 w-full bg-muted">
        <Image
          src={call.thumbnailImage || "/grant-call.png"}
          alt={call.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {call.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              <HtmlContentRenderer 
                content={
                  call.shortDescription ||
                  call.description ||
                  "No description available"
                }
              />
            </CardDescription>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          {proposalTypes.slice(0, 3).map((proposalType) => (
            <Badge key={proposalType.id} variant="outline" className="text-xs">
              {proposalType.name}
            </Badge>
          ))}
          {proposalTypes.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{proposalTypes.length - 3} more
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {call.currentYear
            ? `Current year: ${call.currentYear}`
            : call.eligibilityCriteria || ""}
        </p>

        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {deadline
                ? `Deadline: ${format(deadline, "MMM d, yyyy")}`
                : "Deadline not set"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatBudget(call.budget)}</span>
          </div>
        </div>

        {isOpen && daysRemaining > 0 && deadline && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Clock
              className={`h-4 w-4 ${daysRemaining <= 7 ? "text-amber-500" : "text-muted-foreground"}`}
            />
            <span
              className={
                daysRemaining <= 7
                  ? "text-amber-500 font-medium"
                  : "text-muted-foreground"
              }
            >
              {daysRemaining} days remaining
            </span>
          </div>
        )}

        <div className="mt-auto flex items-end gap-2 pt-4">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/research/manage-grants/${call.id}`}>
              View Details
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href={`/research/manage-grants/${call.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CallCardSkeleton() {
  return (
    <Card className="border-border/60 h-full flex flex-col overflow-hidden">
      <Skeleton className="h-60 w-full rounded-none" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-2/3" />
            <div className="space-y-1.5 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-1 flex-col">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="grid grid-cols-1 gap-3 mt-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CallsForProposalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentYearFilter, setCurrentYearFilter] = useState("");
  const [proposalTypeFilter, setProposalTypeFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 9;

  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: searchQuery.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      current_year: currentYearFilter.trim() || undefined,
      proposal_types: proposalTypeFilter
        ? Number(proposalTypeFilter)
        : undefined,
      ordering,
    };
  }, [
    currentYearFilter,
    limit,
    ordering,
    page,
    proposalTypeFilter,
    searchQuery,
    statusFilter,
  ]);

  const { data, isLoading, isError } = useGrantCalls(queryParams);
  const calls: GrantCall[] = data?.data ?? [];
  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    currentYearFilter,
    proposalTypeFilter,
    ordering,
    searchQuery,
  ]);

  const openCalls =
    meta?.statistics?.openCalls ?? calls.filter(isCallOpen).length;
  const closedCalls =
    meta?.statistics?.closedCalls ??
    Math.max((meta?.total ?? calls.length) - openCalls, 0);
  const filteredCalls = calls;

  const currentYears = useMemo(() => {
    return Array.from(
      new Set(calls.map((call) => call.currentYear).filter(Boolean)),
    ) as string[];
  }, [calls]);

  const proposalTypeOptions = useMemo(() => {
    const options = new Map<string, string>();
    calls.forEach((call) => {
      (call.proposalTypes ?? []).forEach((proposalType) => {
        options.set(String(proposalType.id), proposalType.name);
      });
    });
    return Array.from(options.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [calls]);

  const handleFilterChange =
    (setter: (value: string) => void) => (value: string) => {
      setter(value);
      setPage(1);
    };

  return (
    <PageContainer
      title="Manage Grant Calls"
      description="Browse, filter, and maintain grant funding opportunities"
      actions={
        <Button asChild>
          <Link href="/research/manage-grants/new">
            <Plus className="h-4 w-4 mr-2" />
            Create New Call
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <div className="text-2xl font-bold h-8 flex items-center mt-1">
                  {isLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    meta?.total ?? calls.length
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Calls</p>
                <div className="text-2xl font-bold h-8 flex items-center mt-1">
                  {isLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    openCalls
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed Calls</p>
                <div className="text-2xl font-bold h-8 flex items-center mt-1">
                  {isLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    closedCalls
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search grant calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={handleFilterChange(setStatusFilter)}
          >
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={currentYearFilter || "all"}
            onValueChange={(value) =>
              handleFilterChange(setCurrentYearFilter)(
                value === "all" ? "" : value,
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {currentYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={proposalTypeFilter || "all"}
            onValueChange={(value) =>
              handleFilterChange(setProposalTypeFilter)(
                value === "all" ? "" : value,
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by proposal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Proposal Types</SelectItem>
              {proposalTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={ordering}
            onValueChange={handleFilterChange(setOrdering)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_at">Newest</SelectItem>
              <SelectItem value="created_at">Oldest</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="-title">Title Z-A</SelectItem>
              <SelectItem value="open_date">Open date ascending</SelectItem>
              <SelectItem value="-open_date">Open date descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calls Grid */}
        {isError ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Unable to load grant calls
              </h3>
              <p className="text-muted-foreground">
                Please try again after the backend connection is restored.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CallCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCalls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalls.map((call) => (
              <CallCard key={call.id} call={call} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No calls found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ||
                statusFilter !== "all" ||
                currentYearFilter ||
                proposalTypeFilter
                  ? "Try adjusting your search or filter criteria"
                  : "There are no grant calls available at this time"}
              </p>
            </CardContent>
          </Card>
        )}

        {meta?.totalPages ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage((current) => Math.min(current + 1, meta.totalPages))
                }
                disabled={page >= meta.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
