"use client";

import { Clock, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DraftTimelineProps {
  draft: any;
  mode?: "draft" | "repository";
}

export function DraftTimeline({ draft, mode }: DraftTimelineProps) {
  const isRepository = mode === "repository";
  const timelineData = draft.timeline || [];

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="text-base">{isRepository ? "Policy Lifecycle Audit Trail" : "Policy Development Timeline"}</CardTitle>
        <CardDescription>
          {isRepository 
            ? "Complete traceability from submission to registration" 
            : "Complete traceability from submission to review"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          {isRepository ? (
            timelineData.length > 0 ? (
            timelineData.map((event: any, index: number) => (
              <div key={index} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10",
                    event.status === "done" 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-amber-50 border-amber-200 text-amber-600"
                  )}>
                    {event.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  {index < timelineData.length - 1 && (
                    <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                  )}
                </div>
                <div className="pt-1 pb-2">
                  <p className={cn(
                    "text-sm font-semibold",
                    event.status === "upcoming" && "text-amber-700"
                  )}>{event.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(event.date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No lifecycle dates recorded for this policy yet.
              </p>
            )
          ) : (
            <>
              <div className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                </div>
                <div className="pt-1 pb-2">
                  <p className="text-sm font-semibold">Draft Document Created</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(draft.submissionDate || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {draft.reviews?.filter((r: any) => r.status === "completed").map((review: any, index: number) => (
                <div key={review.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                  </div>
                  <div className="pt-1 pb-2">
                    <p className="text-sm font-semibold">Expert Review Completed by {review.reviewer.firstName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {draft.reviews?.some((r: any) => r.status === "pending") && (
                  <div className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-amber-100 border-amber-400 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="pt-1 pb-2">
                    <p className="text-sm font-semibold text-amber-700">Awaiting Expert Review</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Under evaluation by assigned PSR experts</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
