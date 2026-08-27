"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SerieCount } from "@/lib/data/inail-viste-contract";

export interface SettorePoint {
  settore: string;
  casi: number;
}

export function buildSettoriSerie(settori: SerieCount[]): SettorePoint[] {
  return settori.map((s) => ({ settore: s.key, casi: s.casi }));
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
          <Bar isAnimationActive={false} dataKey="casi" name="Casi" fill="var(--color-accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
