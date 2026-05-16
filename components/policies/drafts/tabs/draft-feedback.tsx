"use client";

import { useState } from "react";
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
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraftFeedbackProps {
  reviews: any[];
}

export function DraftFeedback({ reviews }: DraftFeedbackProps) {
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const versions = Array.from(new Set(reviews.map((r: any) => r.version)));

  const filteredReviews = reviews.map((review: any) => {
    const filteredChecklist = review.checklist.filter((item: any) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "yes") return item.passed === true;
      if (statusFilter === "no") return item.passed === false;
      return true;
    });

    return { ...review, checklist: filteredChecklist };
  }).filter((review: any) => {
    const matchesVersion = versionFilter === "all" || review.version === versionFilter;
    const hasMatchingChecklist = statusFilter === "all" || review.checklist.length > 0;
    return matchesVersion && hasMatchingChecklist;
  });

  const groupedReviews = filteredReviews.reduce((acc: any, review: any) => {
    const v = review.version || "v1.0.0";
    if (!acc[v]) acc[v] = [];
    acc[v].push(review);
    return acc;
  }, {});

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
                    {versions.map(v => (
                      <SelectItem key={v as string} value={v as string}>{v as string}</SelectItem>
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
                  onClick={() => { setVersionFilter("all"); setStatusFilter("all"); }}
                  className="text-xs font-bold text-primary hover:text-primary/80"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredReviews.length > 0 ? (
        <Accordion 
          type="multiple" 
          defaultValue={Object.keys(groupedReviews).sort((a, b) => b.localeCompare(a))}
          className="space-y-6"
        >
          {Object.entries(groupedReviews)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([version, reviews]: [string, any]) => {
              const avgScore = Math.round(reviews.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / reviews.filter((r: any) => r.score !== null).length || 0);
              
              return (
                <Card key={version} className="shadow-sm border-primary/10 overflow-hidden">
                  <AccordionItem value={version} className="border-none">
                    <AccordionTrigger className="hover:no-underline p-6 bg-muted/20 group data-[state=open]:bg-muted/40 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full text-left">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[state=closed]:bg-muted group-data-[state=closed]:text-muted-foreground transition-all duration-300">
                            <Activity className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              Draft <span className="text-primary">{version}</span>
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                              {reviews.length} Expert Assessment{reviews.length !== 1 ? "s" : ""} recorded
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 md:border-l md:pl-6 border-muted-foreground/20">
                          <div className="flex flex-col items-end">
                            <Badge 
                              className={cn(
                                "font-mono font-bold text-sm px-3 py-1",
                                avgScore >= 70 ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"
                              )}
                            >
                              Avg. {avgScore}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-6 pb-6 pt-8">
                      <div className="grid gap-8 pl-4 border-l-2 border-primary/10 ml-4">
                        {reviews.map((review: any) => (
                          <Card
                            key={review.id}
                            className="shadow-sm border-primary/5 bg-background overflow-hidden hover:shadow-md transition-shadow duration-300"
                          >
                            <CardHeader className="bg-muted/30 border-b py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border-2 border-background">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                      {review.reviewer.firstName[0]}
                                      {review.reviewer.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">
                                      {review.reviewer.firstName} {review.reviewer.lastName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {review.reviewer.position || "Expert Reviewer"} · {review.reviewer.institution || "PSR Council"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Score</span>
                                    <Badge 
                                      className={cn(
                                        "font-mono font-bold text-xs px-2 py-0.5",
                                        review.score === null ? "bg-muted text-muted-foreground" :
                                        review.score >= 70 ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"
                                      )}
                                    >
                                      {review.score !== null ? `${review.score}%` : "N/A"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-5 pb-6">
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Expert Feedback
                                  </h4>
                                  <p className="text-sm leading-relaxed text-slate-700 italic border-l-4 border-muted pl-4">
                                    {review.comments || "Review in progress..."}
                                  </p>
                                </div>

                                {review.checklist && review.checklist.length > 0 && (
                                  <div className="pt-2">
                                    <Accordion type="single" collapsible className="w-full">
                                      <AccordionItem value="checklist" className="border-none">
                                        <AccordionTrigger className="flex items-center gap-2 py-2 hover:no-underline group">
                                          <div className="flex items-center gap-2">
                                            <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                                              Checklist Breakdown
                                            </h4>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-0">
                                          <div className="grid gap-3 pl-4 border-l-2 border-muted/50">
                                            {review.checklist.map((item: any) => (
                                              <div key={item.category} className="flex items-start justify-between gap-4 py-1">
                                                <div className="space-y-1">
                                                  <p className="text-sm font-medium text-foreground">{item.category}</p>
                                                  {item.feedback && (
                                                    <p className="text-xs text-muted-foreground italic">
                                                      {item.feedback}
                                                    </p>
                                                  )}
                                                </div>
                                                <Badge 
                                                  variant="outline"
                                                  className={cn(
                                                    "h-6 px-2 text-[10px] font-bold uppercase tracking-wider gap-1 shrink-0",
                                                    item.passed 
                                                      ? "bg-green-50 text-green-700 border-green-200" 
                                                      : "bg-red-50 text-red-700 border-red-200"
                                                  )}
                                                >
                                                  {item.passed ? (
                                                    <>
                                                      <CheckCircle2 className="h-3 w-3" />
                                                      Yes
                                                    </>
                                                  ) : (
                                                    <>
                                                      <XCircle className="h-3 w-3" />
                                                      No
                                                    </>
                                                  )}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <div className="bg-muted/10 border-t py-2 px-4 flex justify-between items-center">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/60">
                                {review.id}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              );
            })
          }
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
