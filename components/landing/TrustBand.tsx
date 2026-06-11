"use client";

import React from "react";

type Trust = {
  institutions?: number;
  researchCenters?: number;
  grantCalls?: number;
  approvedPolicies?: number;
};

export default function TrustBand({ trust }: { trust?: Trust }) {
  const institutions = trust?.institutions ?? 0;
  const centers = trust?.researchCenters ?? 0;
  const grants = trust?.grantCalls ?? 0;
  const approved = trust?.approvedPolicies ?? 0;

  const item = (value: number | string, label: string) => (
    <div className="text-center">
      <p className="text-2xl font-bold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs uppercase text-muted-foreground mt-1">{label}</p>
    </div>
  );

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="bg-background/40 border border-border rounded-2xl p-4 flex items-center justify-around gap-6">
          {item(institutions >= 1000 ? `${Math.round(institutions / 1000)}k+` : institutions, "Institutions")}
          {item(centers >= 1000 ? `${Math.round(centers / 1000)}k+` : centers, "Strategic Objectives")}
          {item(grants >= 1000 ? `${Math.round(grants / 1000)}k+` : grants, "Grant calls")}
          {item(approved >= 1000 ? `${Math.round(approved / 1000)}k+` : approved, "Approved policies")}
        </div>
      </div>
    </section>
  );
}
