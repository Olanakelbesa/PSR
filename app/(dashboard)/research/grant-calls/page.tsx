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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { useGrantCalls } from "@/lib/queries/grant-calls";
import type { GrantCall } from "@/types/grant-call";

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
              {call.shortDescription ||
                call.description ||
                "No description available"}
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

export default function CallsForProposalsPage() {
  const { data, isLoading, isError } = useGrantCalls({ limit: 100 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const calls: GrantCall[] = data?.data ?? [];

  const filteredCalls = useMemo<GrantCall[]>(() => {
    return calls.filter((call) => {
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
  }, [calls, searchQuery, statusFilter]);

  const openCalls = calls.filter(isCallOpen).length;
  const closedCalls = calls.length - openCalls;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "-" : calls.length}
                </p>
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
                <p className="text-2xl font-bold">
                  {isLoading ? "-" : openCalls}
                </p>
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
                <p className="text-2xl font-bold">
                  {isLoading ? "-" : closedCalls}
                </p>
              </div>
            </CardContent>
          </Card>
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
