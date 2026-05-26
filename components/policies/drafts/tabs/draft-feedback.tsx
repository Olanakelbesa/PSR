"use client";

import { useMemo, useState } from "react";
import { 
  Filter, 
  Activity, 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  Calendar 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface DraftFeedbackProps {
  reviews: any[];
}

export function DraftFeedback({ reviews }: DraftFeedbackProps) {
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const versions = useMemo(() => Array.from(new Set(reviews.map((r: any) => r.version))), [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews
      .map((review: any) => {
        const filteredChecklist = (review.checklist || []).filter((item: any) => {
          if (statusFilter === "all") return true;
          if (statusFilter === "yes") return item.passed === true;
          if (statusFilter === "no") return item.passed === false && !item.pending;
          return true;
        });

        return { ...review, checklist: filteredChecklist };
      })
      .filter((review: any) => {
        const matchesVersion = versionFilter === "all" || review.version === versionFilter;
        const hasMatchingChecklist = statusFilter === "all" || review.checklist.length > 0;
        return matchesVersion && hasMatchingChecklist;
      });
  }, [reviews, versionFilter, statusFilter]);

  const groupedReviews = useMemo(() => {
    return filteredReviews.reduce((acc: any, review: any) => {
      const v = review.version || "v1.0.0";
      if (!acc[v]) acc[v] = [];
      acc[v].push(review);
      return acc;
    }, {});
  }, [filteredReviews]);

  const sortedVersionEntries = useMemo(() => {
    return Object.entries(groupedReviews).sort((a, b) =>
      b[0].localeCompare(a[0]),
    );
  }, [groupedReviews]);

  const buildChecklistCategories = (versionReviews: any[]) => {
    const categories = new Set<string>();
    versionReviews.forEach((review) => {
      (review.checklist || []).forEach((item: any) => {
        categories.add(item.category || item.question || "Checklist item");
      });
    });
    return Array.from(categories);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Filters</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Version</label>
                <Select value={versionFilter} onValueChange={setVersionFilter}>
                  <SelectTrigger className="h-9 w-[130px] bg-background">
                    <SelectValue placeholder="All Versions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Versions</SelectItem>
                    {versions.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Checklist Decision</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px] bg-background">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="yes" className="text-green-600 font-bold">Yes / Passed</SelectItem>
                    <SelectItem value="no" className="text-red-600 font-bold">No / Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(versionFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVersionFilter("all");
                    setStatusFilter("all");
                  }}
                  className="text-xs font-bold text-primary hover:text-primary/80"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedVersionEntries.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          defaultValue={sortedVersionEntries[0]?.[0]}
          className="space-y-4"
        >
          {sortedVersionEntries.map(([version, versionReviews]: [string, any]) => {
            const expertReviews = versionReviews.filter((review: any) => !review.isPSRManager);
            const managerResponses = versionReviews.filter((review: any) => review.isPSRManager);
            const completedExpertReviews = expertReviews.filter((review: any) => review.score !== null);
            const avgScore = completedExpertReviews.length
              ? Math.round(
                  completedExpertReviews.reduce((sum: number, r: any) => sum + (r.score || 0), 0) /
                  completedExpertReviews.length
                )
              : 0;
            const expertiseCount = expertReviews.length;
            const categories = buildChecklistCategories(versionReviews);

            return (
              <Card key={version} className="shadow-sm border-primary/10 overflow-hidden">
                <AccordionItem value={version} className="border-none">
                  <AccordionTrigger className="bg-muted/20 border-b px-6 py-5 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Draft Version</p>
                        <h3 className="text-xl font-bold text-foreground">{version}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {expertiseCount} Expert Assessment{expertiseCount !== 1 ? "s" : ""}
                        </p>
                        {managerResponses.length > 0 && (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">
                            <span>PSR Decision:</span>
                            <span>
                              {managerResponses[0].decision === "psr_approved"
                                ? "Approved"
                                : managerResponses[0].decision === "resubmission_required"
                                ? "Revision Requested"
                                : "Final Response"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            "font-mono font-bold text-sm px-3 py-1",
                            avgScore >= 70
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-orange-100 text-orange-700 border-orange-200"
                          )}
                        >
                          Avg. {avgScore}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 py-6">
                    <div className="overflow-x-auto rounded-xl border border-muted/30 bg-white">
                      <table className="min-w-full border-collapse text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border-b border-muted/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Checklist Item
                          </th>
                          {expertReviews.map((review: any) => (
                            <th key={review.id} className="border-b border-muted/20 px-4 py-3 text-left align-top">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-9 w-9 border border-muted/20">
                                    <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                                      {review.reviewer.firstName?.[0]}
                                      {review.reviewer.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      {review.reviewer.firstName} {review.reviewer.lastName}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {review.reviewer.position || "Expert Reviewer"}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  className={cn(
                                    "font-mono text-[10px] font-semibold px-2 py-1",
                                    review.score === null
                                      ? "bg-muted text-muted-foreground"
                                      : review.score >= 70
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-orange-100 text-orange-700 border-orange-200"
                                  )}
                                >
                                  {review.score !== null ? `${review.score}%` : "N/A"}
                                </Badge>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <tr key={category} className="border-b last:border-b-0 border-muted/20">
                              <td className="px-4 py-4 align-top w-48 text-sm font-medium text-foreground">
                                {category}
                              </td>
                              {expertReviews.map((review: any) => {
                                const item = (review.checklist || []).find((check: any) => check.category === category || check.question === category);
                                return (
                                  <td key={`${review.id}-${category}`} className="px-4 py-4 align-top text-sm text-slate-700">
                                    {item ? (
                                      <div className="space-y-2">
                                        <Badge
                                          className={cn(
                                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                                            item.passed
                                              ? "bg-emerald-100 text-emerald-700"
                                              : item.pending
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-rose-100 text-rose-700"
                                          )}
                                        >
                                          {item.passed ? (
                                            <>
                                              <CheckCircle2 className="h-3 w-3" />
                                              Yes
                                            </>
                                          ) : item.pending ? (
                                            <>Pending</>
                                          ) : (
                                            <>
                                              <XCircle className="h-3 w-3" />
                                              No
                                            </>
                                          )}
                                        </Badge>
                                        {item.feedback ? (
                                          <p className="text-xs text-muted-foreground leading-snug">
                                            {item.feedback}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-muted-foreground italic">No comment</p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No response</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={versionReviews.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                              No checklist items available for this version.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {managerResponses.length > 0 && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 mt-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">PSR Manager Decision</p>
                            <p className="text-xs text-muted-foreground">Final institutional response for this version</p>
                          </div>
                          <Badge className="font-mono text-[10px] font-semibold px-2 py-1 bg-orange-100 text-orange-700 border-orange-200">
                            {managerResponses[0].decision === "psr_approved"
                              ? "Approved"
                              : managerResponses[0].decision === "resubmission_required"
                              ? "Revision Requested"
                              : "Final Response"}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-700">
                          {managerResponses[0].comments || "No comments provided."}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-muted/10 border-t px-6 py-4 text-xs text-muted-foreground flex flex-col md:flex-row md:justify-between gap-2">
                    <span>
                      Version {version} contains {expertReviews.length} expert reviewer{expertReviews.length !== 1 ? "s" : ""}.
                    </span>
                    <span>
                      Last reviewed: {new Date(expertReviews[0]?.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
      ) : (
        <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground">
            No Feedback Match
          </h3>
          <p className="text-sm text-muted-foreground">
            Adjust your filters to see evaluation data.
          </p>
        </div>
      )}
    </div>
  );
}
