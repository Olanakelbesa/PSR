"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, DollarSign, ArrowLeft, FileText, CheckCircle, ShieldAlert, Award, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockCalls } from "@/lib/api/mock-data";

export default function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const call = mockCalls.find((c) => c.id === id);

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
          <Button onClick={() => router.push("/calls")} className="w-full">
            Back to Grant Calls
          </Button>
        </Card>
      </div>
    );
  }

  const isClosed = call.status === "closed";

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
                {new Date(call.submissionDeadline).toLocaleDateString()}
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
                ${(call.budgetRange.min / 1000).toFixed(0)}k - ${(call.budgetRange.max / 1000).toFixed(0)}k
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
                {call.eligibilityCriteria}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Priority Areas */}
          <Card className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold text-foreground">Priority Sub-Thematic Domains</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {call.priorityAreas.map((area, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary border border-primary/20 text-xs font-semibold px-3 py-1 rounded-full">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Attachments */}
          {call.attachments && call.attachments.length > 0 && (
            <Card className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 p-6">
                <CardTitle className="text-lg font-bold text-foreground">Guideline Attachments & Documentation</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Download templates to draft your proposal dossier.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {call.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{att.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="border border-white/5 rounded-xl text-xs font-bold font-mono">
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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

        </div>

      </div>
    </div>
  );
}
