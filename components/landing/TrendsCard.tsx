"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type TrendItem = { month: string | null; month_key: string | null; count: number };

export default function TrendsCard({ data, title = "Monthly proposals" }: { data?: TrendItem[]; title?: string }) {
  const points = (data || []).map((d) => ({ name: d.month ?? "", value: d.count }));

  return (
    <div className="bg-card rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className="text-xs text-muted-foreground">Last 12 months</span>
      </div>
      <div className="mt-4 h-40 flex items-center">
        {points.length ? (
          <ResponsiveContainer>
            <AreaChart data={points}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full text-center text-muted-foreground">
            <div className="text-3xl font-bold">0</div>
            <div className="text-xs mt-2">No submissions in the last 12 months</div>
          </div>
        )}
      </div>
    </div>
  );
}
