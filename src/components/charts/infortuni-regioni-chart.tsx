 "use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { regioneName } from "@/lib/labels";

export interface RegionePoint {
  regione: string; // codice ISTAT
  casi: number;
}

export function InfortuniRegioniChart({ data }: { data: RegionePoint[] }) {
  const labelled = data.map((d) => ({ label: regioneName(d.regione), casi: d.casi }));
  return (
    <div style={{ width: "100%", height: 560 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={labelled} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={150} />
          <Tooltip />
          <Bar dataKey="casi" name="Casi" fill="var(--color-accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
