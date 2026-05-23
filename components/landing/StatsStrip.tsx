"use client";

import React from "react";

type Overview = {
  publishedPolicies?: number;
  openCalls?: number;
  proposalsSubmitted?: number;
  institutions?: number;
};

export default function StatsStrip({ overview }: { overview?: Overview }) {
  const published = overview?.publishedPolicies ?? 0;
  const openCalls = overview?.openCalls ?? 0;
  const proposals = overview?.proposalsSubmitted ?? 0;
  const institutions = overview?.institutions ?? 0;

  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k+` : n.toString());

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold">{fmt(published)}</p>
            <p className="text-xs uppercase text-muted-foreground mt-2">Policies published</p>
          </div>

          <div className="bg-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold">{fmt(openCalls)}</p>
            <p className="text-xs uppercase text-muted-foreground mt-2">Open grant calls</p>
          </div>

          <div className="bg-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold">{fmt(proposals)}</p>
            <p className="text-xs uppercase text-muted-foreground mt-2">Proposals submitted</p>
          </div>

          <div className="bg-card p-6 rounded-2xl text-center">
            <p className="text-3xl font-bold">{fmt(institutions)}</p>
            <p className="text-xs uppercase text-muted-foreground mt-2">Institutions using system</p>
          </div>
        </div>
      </div>
    </section>
  );
}
