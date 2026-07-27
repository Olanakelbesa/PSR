"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import type {
  CategoryGroup,
  ReviewCriteriaResponse,
  ReviewerPoolItem,
  ReviewerPoolListProps,
} from "./types";

const REVIEWER_BORDER_COLORS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
];

function getUserAvatarUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl || photoUrl === "#") return undefined;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `/bff/media/stream/${cleanPath.replace(/^\/media\//, "")}`;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function groupResponsesByCategory(
  responses?: ReviewCriteriaResponse[] | any[],
): CategoryGroup[] {
  if (!Array.isArray(responses)) return [];
  const map = new Map<string, CategoryGroup>();
  for (const resp of responses) {
    const q = resp.question ?? resp.question_detail ?? resp;
    const cat = q?.category ?? q?.question_category ?? resp.category;
    const catId = cat?.id ?? "uncategorized";
    const catName = cat?.name || "Evaluation Criteria";
    const key = String(catId);
    const existing = map.get(key);
    if (existing) {
      existing.responses.push(resp);
    } else {
      map.set(key, { id: catId, name: catName, responses: [resp] });
    }
  }
  return Array.from(map.values());
}

function hasSubmittedReview(reviewer: ReviewerPoolItem): boolean {
  if (reviewer.isCompleted) return true;
  const review = reviewer.reviewData;
  if (!review) return false;
  const responses = review.responses ?? [];
  return Boolean(
    review.hasResponses ||
      (Array.isArray(responses) && responses.length > 0) ||
      (review.totalScore != null && Number(review.totalScore) > 0) ||
      (review.comments && review.comments.trim().length > 0) ||
      review.attachment,
  );
}

export function ReviewerPoolList({
  title = "Assigned Reviewers & Evaluation Scores",
  subtitle = "Manage assigned peer reviewers and track individual score submissions",
  reviewers = [],
  maxPossiblePoints = 0,
  overallAverageScorePct,
  overallAverageScore,
  submittedCount,
  showManageAction = true,
  manageActionLabel = "Manage Reviewers",
  onManageReviewers,
  onReviewerClick,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  emptyTitle = "No Reviewers Assigned",
  emptyDescription = "This proposal currently has no reviewers assigned. Click below to assign qualified technical reviewers.",
  className,
}: ReviewerPoolListProps) {
  const [expandedReviewerIds, setExpandedReviewerIds] = useState<Set<string>>(
    new Set(),
  );

  const completedCount = useMemo(() => {
    if (submittedCount != null) return submittedCount;
    return reviewers.filter(hasSubmittedReview).length;
  }, [reviewers, submittedCount]);

  // Compute calculated overall score percentage if not passed explicitly
  const computedAveragePct = useMemo(() => {
    if (overallAverageScorePct != null) return overallAverageScorePct;
    const completedWithScores = reviewers.filter(
      (r) =>
        r.totalScore != null ||
        r.scorePercentage != null ||
        r.reviewData?.totalScore != null,
    );
    if (completedWithScores.length === 0 || maxPossiblePoints <= 0) return null;

    const totalPct = completedWithScores.reduce((sum, r) => {
      if (r.scorePercentage != null) return sum + r.scorePercentage;
      const score = r.totalScore ?? r.reviewData?.totalScore ?? 0;
      return sum + (score / maxPossiblePoints) * 100;
    }, 0);

    return Math.round(totalPct / completedWithScores.length);
  }, [reviewers, overallAverageScorePct, maxPossiblePoints]);

  // Auto-expand submitted reviewer cards on initial load
  useEffect(() => {
    if (reviewers.length > 0) {
      setExpandedReviewerIds((prev) => {
        if (prev.size > 0) return prev;
        const initial = new Set<string>();
        reviewers.forEach((r) => {
          if (hasSubmittedReview(r)) {
            initial.add(String(r.id));
          }
        });
        if (initial.size === 0 && reviewers[0]?.id != null) {
          initial.add(String(reviewers[0].id));
        }
        return initial;
      });
    }
  }, [reviewers]);

  return (
    <Card className={cn("shadow-xs border-border/60 overflow-hidden", className)}>
      <CardHeader className="border-b bg-muted/40 py-4 px-6 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">{title}</CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {showManageAction && onManageReviewers && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 gap-1.5 font-semibold"
            onClick={onManageReviewers}
          >
            <Users className="h-4 w-4" />
            {manageActionLabel}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Top Aggregate Summary Metrics Banner */}
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-5 shadow-2xs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Review Completion
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-foreground font-mono">
                  {completedCount} / {reviewers.length}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5",
                    completedCount === reviewers.length && reviewers.length > 0
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : completedCount > 0
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {completedCount === reviewers.length && reviewers.length > 0
                    ? "100% Complete"
                    : reviewers.length === 0
                      ? "Unassigned"
                      : `${Math.round((completedCount / (reviewers.length || 1)) * 100)}% Submitted`}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Overall Score Average
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xl font-black font-mono",
                    computedAveragePct != null
                      ? computedAveragePct >= 70
                        ? "text-emerald-600 dark:text-emerald-400"
                        : computedAveragePct >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground",
                  )}
                >
                  {computedAveragePct != null ? `${computedAveragePct}%` : "—"}
                </span>
                {overallAverageScore != null && maxPossiblePoints > 0 && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    ({overallAverageScore.toFixed(1)} / {maxPossiblePoints} pts)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Average Progress
              </p>
              <div className="pt-2">
                <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden border border-border/40">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      (computedAveragePct ?? 0) >= 70
                        ? "bg-emerald-500"
                        : (computedAveragePct ?? 0) >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${Math.min(computedAveragePct ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Reviewer Cards */}
        {reviewers.length > 0 ? (
          <div className="space-y-4">
            {reviewers.map((reviewer, index) => {
              const reviewerKey = String(reviewer.id);
              const borderColor =
                REVIEWER_BORDER_COLORS[index % REVIEWER_BORDER_COLORS.length];
              const submitted = hasSubmittedReview(reviewer);

              const reviewData = reviewer.reviewData;
              const totalScore =
                reviewer.totalScore ?? reviewData?.totalScore ?? null;
              const scorePct =
                reviewer.scorePercentage ??
                (totalScore != null && maxPossiblePoints > 0
                  ? Math.round((Number(totalScore) / maxPossiblePoints) * 100)
                  : null);

              const responses =
                reviewData?.responses ??
                (reviewData as any)?.technical_review_responses ??
                [];
              const categoryGroups = groupResponsesByCategory(responses);

              const isExpanded = expandedReviewerIds.has(reviewerKey);
              const isSelected = selectedIds.map(String).includes(reviewerKey);

              const toggleExpanded = () => {
                setExpandedReviewerIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(reviewerKey)) {
                    next.delete(reviewerKey);
                  } else {
                    next.add(reviewerKey);
                  }
                  return next;
                });
              };

              return (
                <Collapsible
                  key={reviewerKey}
                  open={isExpanded}
                  onOpenChange={toggleExpanded}
                  className={cn(
                    "rounded-2xl border-l-4 border bg-card shadow-2xs transition-all duration-200 hover:shadow-md overflow-hidden",
                    borderColor,
                    isSelected && "ring-2 ring-primary border-primary",
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onReviewerClick?.(reviewer)}
                      className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {selectable && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelect?.(reviewer.id);
                            }}
                            className={cn(
                              "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border/60 bg-background hover:border-primary/40",
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        )}

                        <Avatar className="h-11 w-11 border-2 border-primary/20 shrink-0 shadow-2xs">
                          <AvatarImage
                            src={getUserAvatarUrl(reviewer.photoUrl)}
                            alt={reviewer.fullName || "Reviewer"}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                            {getInitials(reviewer.fullName || "Reviewer")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {reviewer.fullName || "Unknown Reviewer"}
                            </h4>
                            {reviewer.role && (
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-extrabold px-2 py-0.5 bg-muted/40"
                              >
                                {reviewer.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">
                              {reviewer.email || "No email provided"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                        <Badge
                          variant={submitted ? "secondary" : "outline"}
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1",
                            submitted
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
                          )}
                        >
                          {submitted ? "Review Submitted" : "Pending Review"}
                        </Badge>

                        {scorePct != null ? (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span
                                className={cn(
                                  "text-xl font-black font-mono leading-none block",
                                  scorePct >= 70
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : scorePct >= 50
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-rose-600 dark:text-rose-400",
                                )}
                              >
                                {scorePct}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {totalScore != null ? totalScore : "?"}/{maxPossiblePoints || "?"} pts
                              </span>
                            </div>

                            <div className="w-16 hidden md:block">
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/40">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    scorePct >= 70
                                      ? "bg-emerald-500"
                                      : scorePct >= 50
                                        ? "bg-amber-400"
                                        : "bg-rose-500",
                                  )}
                                  style={{ width: `${Math.min(scorePct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground italic">
                            No Score
                          </span>
                        )}

                        <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              isExpanded && "rotate-180 text-primary",
                            )}
                          />
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-5 pb-5 pt-2 border-t border-border/40 space-y-4 bg-muted/10">
                    {reviewData?.comments && (
                      <div className="p-4 rounded-xl bg-card border border-border/50 text-xs space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                            Written Evaluation Remarks & Rationale
                          </div>
                          {reviewData.createdAt && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Submitted: {formatDateTime(reviewData.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed italic pl-5 border-l-2 border-primary/30">
                          &ldquo;{reviewData.comments}&rdquo;
                        </p>
                      </div>
                    )}

                    {reviewData?.attachment && (
                      <div className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            Reviewer Attached Evaluation Document
                          </span>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                        >
                          <a
                            href={
                              resolveFileUrl(reviewData.attachment) ||
                              reviewData.attachment
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" /> View Attachment
                          </a>
                        </Button>
                      </div>
                    )}

                    {categoryGroups.length > 0 ? (
                      <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-2xs">
                        <div className="bg-muted/40 px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Itemized Scoring Criteria Breakdown ({categoryGroups.length} Categories)
                            </p>
                          </div>
                        </div>
                        {categoryGroups.map((group) => {
                          const groupMax = group.responses.reduce(
                            (s, r: any) => {
                              const q = r.question ?? r.question_detail ?? r;
                              return s + Number(q?.maxPoints ?? q?.max_points ?? 0);
                            },
                            0,
                          );
                          const groupEarned = group.responses.reduce(
                            (s, r: any) =>
                              s +
                              Number(
                                r.pointsEarned ?? r.points_earned ?? r.score ?? 0,
                              ),
                            0,
                          );
                          const groupPct =
                            groupMax > 0
                              ? Math.round((groupEarned / groupMax) * 100)
                              : 0;

                          return (
                            <Collapsible key={group.id} defaultOpen>
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors border-b border-border/40 last:border-b-0"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground truncate">
                                      {group.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {group.responses.length} criteria · {groupEarned}/{groupMax} pts
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] font-bold",
                                        groupPct >= 70
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                          : groupPct >= 50
                                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                            : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
                                      )}
                                    >
                                      {groupPct}%
                                    </Badge>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="bg-background">
                                {group.responses.map((resp: any) => {
                                  const q =
                                    resp.question ?? resp.question_detail ?? resp;
                                  const questionText =
                                    q?.text ||
                                    q?.questionText ||
                                    q?.question_text ||
                                    `Criteria Question #${resp.id}`;
                                  const maxPts = Number(
                                    q?.maxPoints ?? q?.max_points ?? 0,
                                  );
                                  const earnedPts = Number(
                                    resp.pointsEarned ??
                                      resp.points_earned ??
                                      resp.score ??
                                      0,
                                  );
                                  const respPct =
                                    maxPts > 0
                                      ? Math.round((earnedPts / maxPts) * 100)
                                      : 0;

                                  return (
                                    <div
                                      key={resp.id}
                                      className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/30 last:border-b-0 text-xs hover:bg-muted/10 transition-colors"
                                    >
                                      <p className="text-foreground min-w-0 truncate flex-1 font-medium leading-normal">
                                        {questionText}
                                      </p>
                                      <div className="flex items-center gap-2.5 shrink-0">
                                        <span className="font-mono text-xs font-bold text-foreground">
                                          {earnedPts} / {maxPts} pts
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-[9px] font-bold font-mono px-1.5 py-0.5",
                                            respPct >= 70
                                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                              : respPct >= 50
                                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                                : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
                                          )}
                                        >
                                          {respPct}%
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    ) : !submitted ? (
                      <div className="p-6 text-center border border-dashed rounded-xl bg-card">
                        <Clock className="h-6 w-6 text-amber-500 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold text-foreground">
                          Evaluation Pending
                        </p>
                        <p className="text-[11px] text-muted-foreground max-w-xs mx-auto mt-0.5">
                          This reviewer has not submitted their score or feedback yet.
                        </p>
                      </div>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center border-2 border-dashed rounded-2xl bg-muted/10">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-foreground text-sm">{emptyTitle}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-4">
              {emptyDescription}
            </p>
            {showManageAction && onManageReviewers && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={onManageReviewers}
              >
                <Users className="mr-2 h-4 w-4" />
                {manageActionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
