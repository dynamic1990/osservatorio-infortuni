"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export interface AnnoPoint {
  anno: number;
  casi: number;
}

export function InfortuniAnnualeChart({ data }: { data: AnnoPoint[] }) {
  const max = Math.max(...data.map((d) => d.casi), 1);
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
          <XAxis dataKey="anno" tick={{ fontSize: 13 }} />
          <YAxis tick={{ fontSize: 12 }} width={60} domain={[0, max]} />
          <Tooltip />
          <Bar dataKey="casi" name="Casi" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
