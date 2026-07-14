"use client";

import React from "react";
import { FileText, BookOpen, DollarSign, Target, Layers, Download } from "lucide-react";

type Trust = {
  publishedPolicies?: number;
  totalResearchOutputs?: number;
  totalGrantCalls?: number;
  totalStrategicObjectives?: number;
  totalThematicAreas?: number;
  totalPolicyDownloads?: number;
  totalResearchDownloads?: number;
};

const formatCompact = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1000)}k+` : n.toLocaleString();

export default function TrustBand({ trust }: { trust?: Trust }) {
  const stats = [
    { value: trust?.publishedPolicies ?? 0, label: "Policy Documents", icon: FileText },
    { value: trust?.totalResearchOutputs ?? 0, label: "Research Outputs", icon: BookOpen },
    { value: trust?.totalGrantCalls ?? 0, label: "Grant Calls", icon: DollarSign },
    { value: trust?.totalStrategicObjectives ?? 0, label: "Strategic Objectives", icon: Target },
    { value: trust?.totalThematicAreas ?? 0, label: "Thematic Areas", icon: Layers },
    { value: trust?.totalPolicyDownloads ?? 0, label: "Policy Downloads", icon: Download },
    { value: trust?.totalResearchDownloads ?? 0, label: "Research Downloads", icon: Download },
  ];

  return (
    <section className="py-4 md:py-8">
      <div className="bg-background/40 border border-border rounded-2xl p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
        {stats.map(({ value, label, icon: Icon }) => (
          <div key={label} className="text-center flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatCompact(value)}
            </p>
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
