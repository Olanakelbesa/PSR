"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Calendar, ArrowLeft, FileText, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGrantCall } from "@/lib/queries/grant-calls";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import type { GrantCall } from "@/types/grant-call";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

function formatBudget(budget: GrantCall["budget"]) {
  if (budget === null || budget === undefined || budget === "")
    return "Not specified";
  const numericBudget = typeof budget === "string" ? Number(budget) : budget;
  if (Number.isNaN(numericBudget)) return String(budget);
  return `ETB ${numericBudget.toLocaleString()}`;
}

function isCallOpen(call: GrantCall) {
  const status = (call.status ?? "").toLowerCase();
  if (status && status !== "published" && status !== "open") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (call.openDate) {
    const openDate = new Date(call.openDate);
    openDate.setHours(0, 0, 0, 0);
    if (today < openDate) return false;
  }

  if (call.closeDate) {
    const closeDate = new Date(call.closeDate);
    closeDate.setHours(23, 59, 59, 999);
    if (today > closeDate) return false;
  }

  return true;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: call, isLoading, isError } = useGrantCall(id);

  if (isLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading grant call details...
      </div>
    );
  }

  if (isError || !call) {
    return (
      <div className="space-y-6">
        <Link href="/research/grant-calls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grant Calls
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Grant call not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOpen = isCallOpen(call);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href="/research/grant-calls"
                className="text-foreground hover:text-foreground/50 active:bg-accent/15 focus-visible:ring-accent/30 p-2 rounded-sm"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight wrap-break-word">
                {call.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 ml-12">
              <Badge variant={isOpen ? "default" : "secondary"}>
                {(call.status ?? "Unknown").charAt(0).toUpperCase() +
                  (call.status ?? "Unknown").slice(1)}
              </Badge>
              {(call.proposalTypes ?? []).length > 0 && (
                <span className="text-sm text-muted-foreground">
                  • {(call.proposalTypes ?? []).length} proposal types
                </span>
              )}
              {call.currentYear && (
                <span className="text-sm text-muted-foreground">
                  • {call.currentYear}
                </span>
              )}
            </div>
          </div>
          <Button
            size="lg"
            disabled={!isOpen}
            onClick={() => {
              router.push(
                `/research/proposals/my-proposals/new?callId=${call.id}`,
              );
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
            src={resolveFileUrl(call.bannerImage || call.thumbnailImage) ?? "/grant-banner.png"}
            alt={call.title}
            fill
            className="object-fill"
            sizes="100vw"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed text-muted-foreground">
                <HtmlContentRenderer
                  content={
                    call.description ||
                    call.shortDescription ||
                    "No description provided."
                  }
                  showFullContent
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Proposal Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-lg">
                  Eligibility Criteria
                </h4>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <HtmlContentRenderer
                    content={call.eligibilityCriteria || "Not specified."}
                    showFullContent
                  />
                </div>
              </div>
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3 text-lg">Proposal Types</h4>
                <div className="flex flex-wrap gap-2">
                  {(call.proposalTypes ?? []).length > 0 ? (
                    call.proposalTypes!.map((proposalType) => (
                      <Badge key={proposalType.id} variant="outline">
                        {proposalType.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No proposal types linked to this call.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Open Date</p>
                  <p className="text-xs text-muted-foreground">
                    {call.openDate
                      ? format(new Date(call.openDate), "MMMM d, yyyy")
                      : "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Close Date</p>
                  <p className="text-xs text-muted-foreground">
                    {call.closeDate
                      ? format(new Date(call.closeDate), "MMMM d, yyyy")
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
