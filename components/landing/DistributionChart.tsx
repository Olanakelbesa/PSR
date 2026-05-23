"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

type Item = { name: string; count: number; percent?: number };

const COLORS = ["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];

export default function DistributionChart({ items }: { items?: Item[] }) {
  const data = items || [];

  const total = data.reduce((s, d) => s + (d.count || 0), 0);

  return (
    <div className="bg-card rounded-2xl p-6 h-full">
      <h3 className="text-lg font-bold">Policies by thematic area</h3>
      <div className="mt-4 h-48 flex items-center">
        {data.length ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie dataKey="count" data={data} cx="50%" cy="50%" outerRadius={70} fill="#8884d8" label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full text-center text-muted-foreground">
            <div className="text-3xl font-bold">0</div>
            <div className="text-xs mt-2">No policies found</div>
          </div>
        )}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">Total: {total}</div>
    </div>
  );
}
