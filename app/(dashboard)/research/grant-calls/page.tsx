"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Search,
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
import { useGrantCalls } from "@/lib/queries/grant-calls";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { cn } from "@/lib/utils";
import type { GrantCall } from "@/types/grant-call";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  archived: { label: "Archived", variant: "outline" },
  open: { label: "Open", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
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
    return "";
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
          src={resolveFileUrl(call.thumbnailImage) ?? "/grant-call.png"}
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
          {formatBudget(call.budget) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatBudget(call.budget)}</span>
            </div>
          )}
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
            <Link href={`/research/grant-calls/${call.id}`}>
              View Details
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          {isOpen && (
            <Button className="flex-1" asChild>
              <Link
                href={`/research/proposals/my-proposals/new?callId=${call.id}`}
              >
                Apply Now
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type StatsFilter = "all" | "open" | "closed" | "draft" | "closing_soon";

export default function CallsForProposalsPage() {
  const { data, isLoading, isError } = useGrantCalls({ limit: 100 });
  const [statsFilter, setStatsFilter] = useState<StatsFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const calls: GrantCall[] = data?.data ?? [];

  const applyStatsFilter = (filter: StatsFilter) => {
    setStatsFilter((current) => (current === filter ? "all" : filter));
  };

  const isCallClosingSoon = (call: GrantCall) => {
    if (!isCallOpen(call) || !call.closeDate) return false;
    const deadline = parseISO(call.closeDate);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysRemaining <= 7 && daysRemaining > 0;
  };

  const stats = useMemo(() => {
    const allCalls = calls;
    return {
      total: allCalls.length,
      open: allCalls.filter(isCallOpen).length,
      closed: allCalls.filter((c) => {
        const s = (c.status ?? "").toLowerCase();
        return s === "closed";
      }).length,
      draft: allCalls.filter((c) => (c.status ?? "").toLowerCase() === "draft").length,
      closingSoon: allCalls.filter(isCallClosingSoon).length,
    };
  }, [calls]);

  const filteredCalls = useMemo<GrantCall[]>(() => {
    return calls.filter((call) => {
      if (statsFilter !== "all") {
        switch (statsFilter) {
          case "open":
            if (!isCallOpen(call)) return false;
            break;
          case "closed":
            if ((call.status ?? "").toLowerCase() !== "closed") return false;
            break;
          case "draft":
            if ((call.status ?? "").toLowerCase() !== "draft") return false;
            break;
          case "closing_soon":
            if (!isCallClosingSoon(call)) return false;
            break;
        }
      }

      if (
        statusFilter !== "all" &&
        (call.status ?? "").toLowerCase() !== statusFilter
      ) {
        return false;
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const searchableText = [
        call.title,
        call.shortDescription,
        call.description,
        call.eligibilityCriteria,
        call.currentYear,
        ...(call.proposalTypes ?? []).map((proposalType) => proposalType.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [calls, searchQuery, statusFilter, statsFilter]);

  const availableStatuses = useMemo<string[]>(() => {
    const values = new Set<string>();
    calls.forEach((call) => {
      if (call.status) values.add(call.status.toLowerCase());
    });
    return Array.from(values);
  }, [calls]);

  if (isError) {
    return (
      <PageContainer
        title="Grant Calls"
        description="Browse available funding opportunities"
      >
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
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Grant Calls"
      description="Browse and apply to available research funding opportunities"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              key: "all" as const,
              label: "Total Calls",
              value: stats.total,
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/20",
              activeRing: "ring-primary/50 border-primary/40",
            },
            {
              key: "open" as const,
              label: "Open Calls",
              value: stats.open,
              color: "text-green-600",
              bg: "bg-green-50",
              border: "border-green-200",
              activeRing: "ring-green-500/60 border-green-300",
            },
            {
              key: "closed" as const,
              label: "Closed Calls",
              value: stats.closed,
              color: "text-amber-600",
              bg: "bg-amber-50",
              border: "border-amber-200",
              activeRing: "ring-amber-500/60 border-amber-300",
            },
            {
              key: "draft" as const,
              label: "Draft Calls",
              value: stats.draft,
              color: "text-muted-foreground",
              bg: "bg-muted",
              border: "border-border",
              activeRing: "ring-muted-foreground/50 border-muted-foreground/30",
            },
            {
              key: "closing_soon" as const,
              label: "Closing Soon",
              value: stats.closingSoon,
              color: "text-orange-600",
              bg: "bg-orange-50",
              border: "border-orange-200",
              activeRing: "ring-orange-500/60 border-orange-300",
            },
          ].map((stat) => {
            const isActive = statsFilter === stat.key;
            return (
              <Card
                key={stat.key}
                role="button"
                tabIndex={0}
                onClick={() => applyStatsFilter(stat.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    applyStatsFilter(stat.key);
                  }
                }}
                className={cn(
                  "cursor-pointer border shadow-sm transition-all hover:shadow-md",
                  stat.border,
                  isActive && cn("ring-2 shadow-md", stat.activeRing),
                )}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("shrink-0 rounded-full p-3", stat.bg)}>
                    <FileText className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">
                      {isLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search grant calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading grant calls...
            </CardContent>
          </Card>
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
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "There are no grant calls available at this time"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
