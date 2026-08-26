"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { InjuryAggregate } from "@/lib/data/inail-infortuni-contract";

export interface SettorePoint {
  settore: string;
  casi: number;
}

export function buildSettoriSerie(aggregates: InjuryAggregate[]): SettorePoint[] {
  const map = new Map<string, number>();
  for (const row of aggregates) {
    const settore = row.settoreAteco || "ND";
    map.set(settore, (map.get(settore) ?? 0) + row.casi);
  }
  return [...map.entries()]
    .map(([settore, casi]) => ({ settore, casi }))
    .sort((a, b) => b.casi - a.casi)
    .slice(0, 15);
}

export function InfortuniSettoriChart({ data }: { data: SettorePoint[] }) {
  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="settore" tick={{ fontSize: 12 }} width={64} />
          <Tooltip />
          <Bar dataKey="casi" name="Casi" fill="var(--color-accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
