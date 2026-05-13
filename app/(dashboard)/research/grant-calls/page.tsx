"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Pencil,
  Edit,
} from "lucide-react";

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
import { mockCalls } from "@/lib/api/mock-data";
import type { CallForProposal } from "@/lib/types";
import { PRIORITY_AREAS } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

const statusConfig: Record<
  CallForProposal["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  open: { label: "Open", variant: "default" },
  closing_soon: { label: "Closing Soon", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

function CallCard({ call }: { call: CallForProposal }) {
  const { user } = useAuthStore();
  const isOpen = call.status === "open";
  const isPi = user?.role === "researcher";
  const isAdmin = user?.role === "system_admin";
  const deadline = new Date(call.submissionDeadline);
  const daysRemaining = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const status = statusConfig[call.status];
  const budgetLabel = `ETB ${call.budgetRange.min.toLocaleString()} - ${call.budgetRange.max.toLocaleString()}`;

  return (
    <Card className="hover:shadow-md transition-shadow border-border/60 h-full flex flex-col overflow-hidden">
      <div className="relative h-60 w-full bg-muted">
        <Image
          src="/grant-call.png"
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
              {call.description}
            </CardDescription>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          {call.priorityAreas.slice(0, 3).map((area: string) => (
            <Badge key={area} variant="outline" className="text-xs">
              {PRIORITY_AREAS.includes(area) ? area : area}
            </Badge>
          ))}
          {call.priorityAreas.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{call.priorityAreas.length - 3} more
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {call.eligibilityCriteria}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Deadline: {deadline.toLocaleDateString()}</span>
          </div>
        </div>

        {isOpen && daysRemaining > 0 && (
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
              <Link href={`/research/proposals/new?callId=${call.id}`}>
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
  const [calls] = useState<CallForProposal[]>(mockCalls);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCalls = calls.filter((call) => {
    if (statusFilter !== "all" && call.status !== statusFilter) return false;
    const query = searchQuery.toLowerCase();
    if (
      query &&
      ![
        call.title,
        call.description,
        call.eligibilityCriteria,
        ...call.priorityAreas,
      ].some((value) => value.toLowerCase().includes(query))
    )
      return false;
    return true;
  });

  const openCalls = calls.filter((c) => c.status === "open").length;
  const closedCalls = calls.filter((c) => c.status === "closed").length;

  return (
    <PageContainer
      title="Calls for Proposals"
      description="Browse and apply to open research funding opportunities"
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
                <p className="text-2xl font-bold">{calls.length}</p>
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
                <p className="text-2xl font-bold">{openCalls}</p>
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
                <p className="text-2xl font-bold">{closedCalls}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calls Grid */}
        {filteredCalls.length > 0 ? (
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
                  : "There are no calls for proposals at this time"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
