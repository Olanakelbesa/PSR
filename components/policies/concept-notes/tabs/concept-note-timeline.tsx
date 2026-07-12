"use client";

import { Calendar, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConceptNoteTimelineProps {
  note: any;
}

function replaceManagerWithPsr(value?: string | null) {
  if (!value) return value ?? "";
  return value
    .replace(/\bPSR\s+manager\b/gi, "PSR")
    .replace(/\bManager\b/g, "PSR")
    .replace(/\bmanager\b/g, "PSR");
}

export function ConceptNoteTimeline({ note }: ConceptNoteTimelineProps) {
  const timeline = note.timeline ?? [];

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
          {timeline.length > 0 ? (
            timeline.map((event: any, index: number) => (
              <div
                key={`${event.eventType}-${event.timestamp}-${index}`}
                className="flex gap-4 pb-6 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 mt-1 bg-primary/30" />
                  )}
                </div>
                <div className="pt-1 pb-2">
                  <p className="text-sm font-semibold">
                    {replaceManagerWithPsr(event.title)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {replaceManagerWithPsr(event.actor)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{" "}
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-primary border-primary text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="pt-1 pb-2">
                <p className="text-sm font-semibold">Concept note submitted</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{" "}
                  {new Date(
                    note.submittedBy?.submittedAt ?? note.createdAt,
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
