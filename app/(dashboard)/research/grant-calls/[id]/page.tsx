"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, ArrowLeft, FileText, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { mockCalls } from "@/lib/api/mock-data";
import type { CallForProposal } from "@/lib/types";

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const call = useMemo(() => {
    return mockCalls.find((c) => c.id === id);
  }, [id]);

  if (!call) {
    return (
      <div className="space-y-6">
        <Link href="/research/calls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Calls
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Call for proposal not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const closeDate = new Date(call.submissionDeadline);
  const isOpen = call.status === "open";

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/research/grant-calls"
                className="text-foreground hover:text-foreground/50 active:bg-accent/15 focus-visible:ring-accent/30 p-2 rounded-sm"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                {call.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 mt-2 ml-12">
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen
                  ? "Open"
                  : call.status.charAt(0).toUpperCase() + call.status.slice(1)}
              </Badge>
              {call.priorityAreas.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  • {call.priorityAreas.length} priority areas
                </span>
              )}
            </div>
          </div>
          <Button
            size="lg"
            disabled={!isOpen}
            onClick={() => {
              router.push(`/research/proposals/new?callId=${call.id}`);
            }}
            className={
              isOpen
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }
          >
            {isOpen ? "Apply Now" : "Closed"}
          </Button>
        </div>
        <div className="relative w-full h-56 rounded-lg overflow-hidden my-4 bg-muted">
          <Image
            src="/grant-banner.png"
            alt={call.title}
            fill
            className="object-fill"
            sizes="100vw"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {call.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Priority Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-lg">
                  Eligibility Criteria
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {call.eligibilityCriteria}
                </p>
              </div>
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3 text-lg">Priority Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {call.priorityAreas.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Submission Deadline</p>
                  <p className="text-xs text-muted-foreground">
                    {format(closeDate, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Minimum</span>
                  <span className="text-lg font-bold">
                    ETB {call.budgetRange.min.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maximum</span>
                  <span className="text-lg font-bold">
                    ETB {call.budgetRange.max.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
