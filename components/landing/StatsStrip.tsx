"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Overview = {
  publishedPolicies?: number;
  openCalls?: number;
  proposalsSubmitted?: number;
  institutions?: number;
};

interface StatsStripProps {
  overview?: Overview;
  metrics?: Overview;
  isLoading?: boolean;
}

export default function StatsStrip({ overview, metrics, isLoading }: StatsStripProps) {
  const data = overview ?? metrics ?? {};
  const published = data.publishedPolicies ?? 0;
  const openCalls = data.openCalls ?? 0;
  const proposals = data.proposalsSubmitted ?? 0;
  const institutions = data.institutions ?? 0;

  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k+` : n.toString());

  const items = [
    { value: published, label: "Policies Published" },
    { value: openCalls, label: "Open Grant Calls" },
    { value: proposals, label: "Proposals Submitted" },
    { value: institutions, label: "Institutions Using System" },
  ];

  return (
    <section className="py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map(({ value, label }) => (
            <div
              key={label}
              className="bg-card/80 backdrop-blur p-5 rounded-2xl border border-border/70 shadow-xs hover:border-primary/20 transition-all duration-300 text-center"
            >
              {isLoading ? (
                <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
              ) : (
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{fmt(value)}</p>
              )}
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-snug mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
