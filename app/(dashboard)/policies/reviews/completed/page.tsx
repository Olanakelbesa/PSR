"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  FileEdit,
  BookOpen,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
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
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const MOCK_COMPLETED = [
  {
    id: "cn-010",
    title: "Early Childhood Education Policy Framework",
    type: "concept",
    organization: "MoE – Early Childhood Division",
    submittedOn: "2026-05-01",
    score: null,
    recommendation: "complete",
    psrOutcome: "approved",
  },
  {
    id: "d-009",
    title: "TVET Strategy and Curriculum Redesign 2025",
    type: "draft",
    organization: "MoE – Vocational Training",
    submittedOn: "2026-04-27",
    score: 84,
    recommendation: "complete",
    psrOutcome: "approved",
  },
  {
    id: "cn-007",
    title: "Tertiary Education Access Expansion",
    type: "concept",
    organization: "AAU – Higher Education Research",
    submittedOn: "2026-04-22",
    score: null,
    recommendation: "incomplete",
    psrOutcome: "rejected",
  },
  {
    id: "d-006",
    title: "School Safety and Well-being Guideline",
    type: "draft",
    organization: "MoE – Wellbeing Directorate",
    submittedOn: "2026-04-18",
    score: 91,
    recommendation: "complete",
    psrOutcome: "approved",
  },
  {
    id: "cn-004",
    title: "Environmental Education Integration Framework",
    type: "concept",
    organization: "AAU – Science Education",
    submittedOn: "2026-04-10",
    score: null,
    recommendation: "complete",
    psrOutcome: "approved",
  },
  {
    id: "d-003",
    title: "Inclusive Education for Special Needs Policy",
    type: "draft",
    organization: "MoE – Special Needs Education",
    submittedOn: "2026-04-02",
    score: 72,
    recommendation: "incomplete",
    psrOutcome: "rejected",
  },
];

const PSR_CONFIG: Record<string, { label: string; className: string; icon: typeof ThumbsUp }> = {
  approved: { label: "PSR Approved", className: "bg-green-100 text-green-700 border-green-200", icon: ThumbsUp },
  rejected: { label: "PSR Rejected", className: "bg-red-100 text-red-700 border-red-200", icon: ThumbsDown },
};

const RECOMMENDATION_CONFIG: Record<string, { label: string; className: string }> = {
  complete: { label: "Complete", className: "bg-green-100 text-green-700 border-green-200" },
  incomplete: { label: "Incomplete", className: "bg-red-100 text-red-700 border-red-200" },
};

const PAGE_SIZE = 5;

export default function CompletedReviewsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_COMPLETED.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.organization.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchOutcome = outcomeFilter === "all" || r.psrOutcome === outcomeFilter;
      return matchSearch && matchType && matchOutcome;
    });
  }, [search, typeFilter, outcomeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Summary metrics
  const approvedCount = MOCK_COMPLETED.filter(r => r.psrOutcome === "approved").length;
  const draftScores = MOCK_COMPLETED.filter(r => r.score !== null).map(r => r.score as number);
  const avgScore = draftScores.length
    ? Math.round(draftScores.reduce((a, b) => a + b, 0) / draftScores.length)
    : 0;

  return (
    <PageContainer
      title="Completed Reviews"
      description="Archive of all policy evaluations you have submitted"
      actions={
        <Button asChild variant="outline">
          <Link href="/policies/reviews">← Back to Dashboard</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-sm border-green-200 bg-green-50/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black">{MOCK_COMPLETED.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black">{avgScore}%</p>
                <p className="text-xs text-muted-foreground font-medium">Avg. Draft Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-200 bg-blue-50/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black">
                  {Math.round((approvedCount / MOCK_COMPLETED.length) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground font-medium">PSR Approval Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Review History
                </CardTitle>
                <CardDescription>{filtered.length} completed evaluation{filtered.length !== 1 ? "s" : ""}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 h-9 w-full sm:w-52"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-full sm:w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="concept">Concept Note</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={outcomeFilter} onValueChange={(v) => { setOutcomeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-full sm:w-36">
                    <SelectValue placeholder="PSR Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="approved">PSR Approved</SelectItem>
                    <SelectItem value="rejected">PSR Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No completed reviews match your filters</p>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Policy / Organization</span>
                  <span className="text-center w-24">Submitted</span>
                  <span className="text-center w-20">Score</span>
                  <span className="text-center w-28">My Verdict</span>
                  <span className="text-center w-28">PSR Outcome</span>
                </div>

                <div className="divide-y min-h-[320px]">
                  {paginated.map((review) => {
                    const psrCfg = PSR_CONFIG[review.psrOutcome];
                    const recCfg = RECOMMENDATION_CONFIG[review.recommendation];
                    const detailHref = review.type === "concept"
                      ? `/policies/concept-notes/${review.id}`
                      : `/policies/drafts/${review.id}`;

                    return (
                      <div key={review.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center gap-3 sm:gap-4 p-5 hover:bg-muted/20 transition-colors">
                        {/* Title */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={cn(
                            "p-2 rounded-md shrink-0",
                            review.type === "concept" ? "bg-blue-50" : "bg-purple-50"
                          )}>
                            {review.type === "concept"
                              ? <FileEdit className="h-4 w-4 text-blue-600" />
                              : <BookOpen className="h-4 w-4 text-purple-600" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{review.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{review.organization}</p>
                            <Badge variant="outline" className="text-[10px] mt-1 py-0">
                              {review.type === "concept" ? "Concept Note" : "Draft"}
                            </Badge>
                          </div>
                        </div>

                        {/* Submitted date */}
                        <div className="text-xs text-muted-foreground text-center w-24 flex items-center gap-1 sm:justify-center">
                          <Clock className="h-3 w-3" />
                          {review.submittedOn}
                        </div>

                        {/* Score (drafts only) */}
                        <div className="w-20 text-center">
                          {review.score !== null ? (
                            <div className="space-y-1">
                              <p className="text-sm font-bold">{review.score}%</p>
                              <Progress
                                value={review.score}
                                className={cn(
                                  "h-1.5",
                                  review.score >= 70 ? "[&>div]:bg-green-500" :
                                  review.score >= 40 ? "[&>div]:bg-orange-500" : "[&>div]:bg-red-500"
                                )}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>

                        {/* Recommendation */}
                        <div className="w-28 flex justify-center">
                          <Badge variant="outline" className={cn("text-[10px] text-center", recCfg.className)}>
                            {recCfg.label}
                          </Badge>
                        </div>

                        {/* PSR Outcome */}
                        <div className="w-28 flex justify-center">
                          <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1", psrCfg.className)}>
                            <psrCfg.icon className="h-2.5 w-2.5" />
                            {psrCfg.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{" "}
                      <span className="font-medium">{filtered.length}</span>
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
