"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Trust = {
  publishedPolicies?: number;
  totalResearchOutputs?: number;
  totalGrantCalls?: number;
  totalStrategicObjectives?: number;
  totalThematicAreas?: number;
  totalPolicyDownloads?: number;
  totalResearchDownloads?: number;
};

interface TrustBandProps {
  trust?: Trust;
  payload?: Trust;
  isLoading?: boolean;
}

const formatCompact = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1000)}k+` : n.toLocaleString();

export default function TrustBand({ trust, payload, isLoading }: TrustBandProps) {
  const data = trust ?? payload ?? {};
  const stats = [
    { value: data.publishedPolicies ?? 0, label: "Policy Documents" },
    { value: data.totalResearchOutputs ?? 0, label: "Research Outputs" },
    { value: data.totalGrantCalls ?? 0, label: "Grant Calls" },
    { value: data.totalStrategicObjectives ?? 0, label: "Strategic Objectives" },
    { value: data.totalThematicAreas ?? 0, label: "Thematic Areas" },
    { value: data.totalPolicyDownloads ?? 0, label: "Policy Downloads" },
    { value: data.totalResearchDownloads ?? 0, label: "Research Downloads" },
  ];

  return (
    <section className="py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card/70 border border-border/80 backdrop-blur rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center flex flex-col items-center justify-center p-3 rounded-xl hover:bg-muted/40 transition-colors">
                {isLoading ? (
                  <Skeleton className="h-7 w-12 rounded-md mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums text-foreground">
                    {formatCompact(value)}
                  </p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight text-center mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
