"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ClipboardList,
  Calendar,
  FileEdit,
  BookOpen,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
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
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const MOCK_ASSIGNED = [
  {
    id: "cn-001",
    title: "Basic Education Quality Improvement Framework",
    type: "concept",
    organization: "MoE – Policy Analysis Directorate",
    assignedDate: "2026-05-06",
    dueDate: "2026-05-14",
    status: "pending",
    priority: "high",
  },
  {
    id: "cn-003",
    title: "Digital Learning Infrastructure Strategy",
    type: "concept",
    organization: "AAU – Educational Technology",
    assignedDate: "2026-05-07",
    dueDate: "2026-05-15",
    status: "in_progress",
    priority: "medium",
  },
  {
    id: "d-002",
    title: "Teacher Professional Development Policy Draft",
    type: "draft",
    organization: "MoE – Teacher Education",
    assignedDate: "2026-05-04",
    dueDate: "2026-05-12",
    status: "in_progress",
    priority: "high",
  },
  {
    id: "d-005",
    title: "Inclusive Education Guideline v2",
    type: "draft",
    organization: "MoE – Special Needs Education",
    assignedDate: "2026-05-08",
    dueDate: "2026-05-17",
    status: "pending",
    priority: "low",
  },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "Medium", className: "bg-orange-100 text-orange-700 border-orange-200" },
  low: { label: "Low", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

const PAGE_SIZE = 5;

export default function AssignedReviewsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_ASSIGNED.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.organization.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
      return matchSearch && matchType && matchStatus && matchPriority;
    });
  }, [search, typeFilter, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setCurrentPage(1);
  }

  return (
    <PageContainer
      title="Assigned Reviews"
      description="All policy documents currently assigned to you for expert evaluation"
      actions={
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/policies/reviews">← Back to Dashboard</Link>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "All Assigned", value: MOCK_ASSIGNED.length, active: typeFilter === "all" },
            { label: "Concept Notes", value: MOCK_ASSIGNED.filter(r => r.type === "concept").length, active: typeFilter === "concept" },
            { label: "Policy Drafts", value: MOCK_ASSIGNED.filter(r => r.type === "draft").length, active: typeFilter === "draft" },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => { setTypeFilter(chip.label === "All Assigned" ? "all" : chip.label === "Concept Notes" ? "concept" : "draft"); resetPage(); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                chip.active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border hover:bg-muted/50"
              )}
            >
              {chip.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                chip.active ? "bg-primary-foreground/20" : "bg-muted"
              )}>{chip.value}</span>
            </button>
          ))}
        </div>

        <Card className="shadow-sm border-primary/10">
          {/* Filters */}
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Review Queue
                </CardTitle>
                <CardDescription>{filtered.length} review{filtered.length !== 1 ? "s" : ""} found</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title or org..."
                    className="pl-9 h-9 w-full sm:w-56"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                  <SelectTrigger className="h-9 w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); resetPage(); }}>
                  <SelectTrigger className="h-9 w-full sm:w-36">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reviews match your filters</p>
                <p className="text-sm mt-1">Try adjusting the search or filter criteria</p>
              </div>
            ) : (
              <>
                <div className="divide-y min-h-[320px]">
                  {paginated.map((review) => {
                    const statusCfg = STATUS_CONFIG[review.status];
                    const priorityCfg = PRIORITY_CONFIG[review.priority];
                    const href = review.type === "concept"
                      ? `/policies/concept-notes/${review.id}/review`
                      : `/policies/drafts/${review.id}/review`;

                    return (
                      <div key={review.id} className="flex items-start justify-between p-5 hover:bg-muted/20 transition-colors gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={cn(
                            "p-2.5 rounded-lg shrink-0",
                            review.type === "concept" ? "bg-blue-50" : "bg-purple-50"
                          )}>
                            {review.type === "concept"
                              ? <FileEdit className="h-4 w-4 text-blue-600" />
                              : <BookOpen className="h-4 w-4 text-purple-600" />
                            }
                          </div>
                          <div className="min-w-0 space-y-1.5">
                            <p className="text-sm font-semibold leading-snug">{review.title}</p>
                            <p className="text-xs text-muted-foreground">{review.organization}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={cn("text-[10px] py-0", statusCfg.className)}>
                                {statusCfg.label}
                              </Badge>
                              <Badge variant="outline" className={cn("text-[10px] py-0", priorityCfg.className)}>
                                {priorityCfg.label} Priority
                              </Badge>
                              <Badge variant="outline" className="text-[10px] py-0">
                                {review.type === "concept" ? "Concept Note" : "Draft"}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due {review.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button size="sm" asChild className="bg-primary hover:bg-primary/90 h-8">
                            <Link href={href}>
                              {review.status === "in_progress" ? "Continue" : "Start Review"}
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{" "}
                      <span className="font-medium">{filtered.length}</span> reviews
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button key={page} variant={currentPage === page ? "default" : "ghost"}
                          size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setCurrentPage(page)}>
                          {page}
                        </Button>
                      ))}
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
