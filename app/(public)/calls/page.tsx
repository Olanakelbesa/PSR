"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ArrowUpRight, Search, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useGrantCalls } from "@/lib/queries/grant-calls";
import type { GrantCall } from "@/types/grant-call";

function getCallStatus(call: GrantCall) {
  const status = (call.status ?? "").toLowerCase();
  if (status === "closed") return "closed";

  const closeDate = call.closeDate ? new Date(call.closeDate) : null;
  if (closeDate && !Number.isNaN(closeDate.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    closeDate.setHours(23, 59, 59, 999);

    const diffDays = Math.ceil(
      (closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays <= 14) return "closing_soon";
  }

  return status === "published" || status === "open"
    ? "open"
    : status || "open";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, isError } = useGrantCalls({
    limit: 100,
    ordering: "-created_at",
  });

  const calls = data?.data ?? [];

  const filteredCalls = useMemo(() => {
    let result = calls;

    if (statusFilter !== "all") {
      result = result.filter((call) => getCallStatus(call) === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (call) =>
          call.title.toLowerCase().includes(q) ||
          (call.shortDescription ?? "").toLowerCase().includes(q) ||
          (call.description ?? "").toLowerCase().includes(q) ||
          (call.eligibilityCriteria ?? "").toLowerCase().includes(q) ||
          (call.proposalTypes ?? []).some((type) =>
            type.name.toLowerCase().includes(q),
          ),
      );
    }

    return result;
  }, [calls, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
            Open
          </Badge>
        );
      case "closing_soon":
        return (
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
            <Clock className="w-3 h-3 mr-1 inline-block" />
            Closing Soon
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
            Closed
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow w-full py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Open <span className="text-primary">Research Calls</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
              Explore open opportunities for grant funding, academic
              fellowships, and research sponsorships aimed at resolving
              strategic policy questions.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "All Calls", value: "all" },
                { label: "Open", value: "open" },
                { label: "Closing Soon", value: "closing_soon" },
                { label: "Closed", value: "closed" },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={
                    statusFilter === filter.value ? "default" : "outline"
                  }
                  onClick={() => setStatusFilter(filter.value)}
                  className="rounded-full h-9 px-5 text-xs font-bold transition-all duration-300"
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search grant calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Loading / Cards Grid */}
          {isLoading ? (
            <div className="py-24 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground text-sm mt-4">
                Retrieving active calls...
              </p>
            </div>
          ) : isError ? (
            <div className="py-24 text-center border border-border rounded-2xl bg-muted/30">
              <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-55" />
              <h3 className="text-lg font-bold text-foreground mb-1">
                Unable to load calls
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                The grant calls feed could not be loaded right now. Please try
                again shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCalls.map((call) => {
                  return (
                    <motion.div
                      key={call.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between">
                        <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              {getStatusBadge(getCallStatus(call))}
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {call.currentYear ?? ""}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-xl font-bold text-foreground leading-snug hover:text-primary transition-colors">
                                <Link href={`/calls/${call.id}`}>
                                  {call.title}
                                </Link>
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {stripHtml(
                                  call.shortDescription ??
                                    call.description ??
                                    "Open research funding opportunity.",
                                )}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {(call.proposalTypes ?? []).length > 0 ? (
                                call.proposalTypes!.map((type) => (
                                  <Badge
                                    key={type.id}
                                    variant="secondary"
                                    className="bg-primary/5 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                  >
                                    {type.name}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/5 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                >
                                  General Research
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {call.closeDate
                                  ? `Closes ${format(new Date(call.closeDate), "MMM d, yyyy")}`
                                  : "Open until filled"}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              asChild
                              className="rounded-xl h-9 px-4 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                            >
                              <Link href={`/calls/${call.id}`}>
                                View Details
                                <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {!isLoading && filteredCalls.length === 0 && (
                <div className="col-span-2 py-24 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                  <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-55" />
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    No Active Calls
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    No grant opportunities match your search parameters. Please
                    try a different query.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="mt-4"
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
