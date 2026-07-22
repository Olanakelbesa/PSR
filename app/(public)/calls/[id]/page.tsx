"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ArrowLeft, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGrantCall } from "@/lib/queries/grant-calls";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

function isCallOpen(call: { status?: string; openDate?: string | null; closeDate?: string | null }) {
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: call, isLoading, isError } = useGrantCall(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground text-sm">Retrieving call documents...</p>
        </div>
      </div>
    );
  }

  if (isError || !call) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto opacity-80" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Call Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The grant call you are looking for does not exist or is no longer available.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/calls">Back to Grant Calls</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const isOpen = isCallOpen(call);
  const descriptionText = stripHtml(call.description ?? call.shortDescription ?? "");
  const imageSrc = resolveFileUrl(call.bannerImage || call.thumbnailImage);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 bg-muted overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={call.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <Image
            src="/grant-banner.png"
            alt={call.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 max-w-4xl pb-8">
            <Link
              href="/calls"
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Grant Calls
            </Link>
            <div className="flex items-center gap-3 mb-3">
              {isOpen ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
                  Active
                </Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                  Closed
                </Badge>
              )}
              {call.currentYear && (
                <Badge variant="secondary" className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                  {call.currentYear}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {call.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-8">
        {/* Meta Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Open Date</span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {call.openDate ? format(new Date(call.openDate), "MMM d, yyyy") : "Not published"}
              </span>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Close Date</span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {call.closeDate ? format(new Date(call.closeDate), "MMM d, yyyy") : "Open until filled"}
              </span>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {isOpen ? "Accepting submissions" : "Closed"}
              </span>
            </div>
          </Card>
        </div>

        {/* Description */}
        <Card className="overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-bold text-foreground">Call Overview & Objective</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-sm leading-relaxed text-muted-foreground">
              <HtmlContentRenderer
                content={call.description || "No description provided."}
                showFullContent
              />
            </div>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card className="overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-bold text-foreground">Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-sm leading-relaxed text-muted-foreground">
              <HtmlContentRenderer
                content={call.eligibilityCriteria || "Eligibility details will be shared in the full call documentation."}
                showFullContent
              />
            </div>
          </CardContent>
        </Card>

        {/* Proposal Types */}
        <Card className="overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-bold text-foreground">Proposal Types</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {(call.proposalTypes ?? []).length > 0 ? (
                call.proposalTypes!.map((type) => (
                  <Badge key={type.id} variant="secondary" className="bg-primary/5 text-primary border border-primary/20 text-xs font-semibold px-3 py-1 rounded-full">
                    {type.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No proposal type restrictions were published.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Apply CTA */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-6 rounded-2xl border border-border bg-card">
          <div>
            <h4 className="text-base font-bold text-foreground">Ready to Submit a Proposal?</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Please sign in to register research proposals.</p>
          </div>
          <div className="flex gap-3">
            {isOpen ? (
              <Button size="lg" asChild className="rounded-xl font-bold shadow-lg shadow-primary/20">
                <Link href={`/login?redirect=/calls/${call.id}`}>Login to Apply</Link>
              </Button>
            ) : (
              <Button size="lg" disabled className="rounded-xl font-bold">
                Call Closed
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="rounded-xl font-bold">
              <Link href="/calls">Back to List</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
