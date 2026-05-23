"use client";

import { use } from "react";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  ArrowLeft,
  ShieldAlert,
  Award,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGrantCall } from "@/lib/queries/grant-calls";

function formatBudget(budget?: number | string | null) {
  if (budget === null || budget === undefined || budget === "") return "Budget available";

  const amount = Number(budget);
  if (Number.isNaN(amount)) return String(budget);

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
  }

  return `$${amount.toLocaleString()}`;
}

function getStatusLabel(status?: string) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "closed") return "Closed";
  if (normalized === "closing_soon") return "Closing Soon";
  return normalized === "published" || normalized === "open" ? "Active" : "Active";
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

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full border-white/5 bg-slate-900/20 backdrop-blur-md p-8 text-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto opacity-80" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Call Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The grant call identifier "{id}" does not exist in our active archives.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/calls">
            Back to Grant Calls
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const isClosed = (call.status ?? "").toLowerCase() === "closed";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        
        {/* Navigation Breadcrumb */}
        <Link
          href="/calls"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Grant Calls
        </Link>

        {/* Title Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
              Grant Call Details
            </Badge>
            {isClosed ? (
              <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                Closed
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                Active
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {call.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {call.shortDescription ?? call.description ?? "Open research funding opportunity."}
          </p>
        </div>

        {/* Call Meta Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-white/5 bg-slate-900/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Submission Deadline</span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {call.closeDate ? new Date(call.closeDate).toLocaleDateString() : "Open until filled"}
              </span>
            </div>
          </Card>

          <Card className="border border-white/5 bg-slate-900/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Allocated Funding</span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {formatBudget(call.budget)}
              </span>
            </div>
          </Card>

          <Card className="border border-white/5 bg-slate-900/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Call Identification</span>
              <span className="text-sm font-bold text-foreground font-mono block mt-0.5">
                {call.id}
              </span>
            </div>
          </Card>
        </div>

        {/* Major Overview Details */}
        <div className="space-y-6">
          {/* Card 1: Description */}
          <Card className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-foreground">Call Overview & Objective</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {call.description}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Eligibility */}
          <Card className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-foreground">Eligibility Criteria</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {call.eligibilityCriteria ?? "Eligibility details will be shared in the full call documentation."}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Proposal Types */}
          <Card className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-foreground">Proposal Types</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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

          {/* Card 4: Timeline */}
          <Card className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-foreground">Call Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open Date</p>
                <p className="mt-1 font-semibold text-foreground">{call.openDate ? new Date(call.openDate).toLocaleDateString() : "Not published"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Close Date</p>
                <p className="mt-1 font-semibold text-foreground">{call.closeDate ? new Date(call.closeDate).toLocaleDateString() : "Open until filled"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Year</p>
                <p className="mt-1 font-semibold text-foreground">{call.currentYear ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="mt-1 font-semibold text-foreground">{getStatusLabel(call.status)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Apply Banner Call To Action */}
          <div className="flex flex-wrap gap-4 items-center justify-between p-6 rounded-2xl border border-white/5 bg-primary/5">
            <div>
              <h4 className="text-base font-bold text-foreground">Ready to Submit a Concept Note?</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Please sign in to register research proposals.</p>
            </div>
            
            <div className="flex gap-3">
              {isClosed ? (
                <Button size="lg" disabled className="rounded-xl font-bold">
                  Call Closed
                </Button>
              ) : (
                <Button size="lg" asChild className="rounded-xl font-bold shadow-lg shadow-primary/20">
                  <Link href={`/login?redirect=/calls/${call.id}`}>
                    Login to Apply
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="rounded-xl font-bold border-white/5">
                <Link href="/calls">
                  Back to List
                </Link>
              </Button>
            </div>
          </div>

          {isError ? (
            <div className="py-6 text-center border border-white/5 rounded-2xl bg-slate-900/10">
              <p className="text-sm text-muted-foreground">This call could not be loaded from the API.</p>
            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
}
