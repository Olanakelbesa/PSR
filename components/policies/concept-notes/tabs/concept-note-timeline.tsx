"use client";

import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConceptNoteTimelineProps {
  note: any;
}

export function ConceptNoteTimeline({ note }: ConceptNoteTimelineProps) {
  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="text-base">
          Document Lifecycle Audit Trail
        </CardTitle>
        <CardDescription>
          Complete traceability from submission to review
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <div className="flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
            </div>
            <div className="pt-1 pb-2">
              <p className="text-sm font-semibold">
                Concept Note Created
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />{" "}
                {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {note.reviews?.filter((r: any) => r.decision === "Accepted" || r.recommendation === "approve").map((review: any) => (
            <div key={review.id} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
              </div>
              <div className="pt-1 pb-2">
                <p className="text-sm font-semibold">
                  Review Completed by {review.reviewer.firstName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {note.status === "submitted" && (
            <div className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-amber-100 border-amber-400 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="pt-1 pb-2">
                <p className="text-sm font-semibold text-amber-700">
                  Awaiting Expert Review
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Under evaluation by PSR Council
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
