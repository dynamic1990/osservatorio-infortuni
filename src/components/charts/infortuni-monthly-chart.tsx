"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { InjuryAggregate } from "@/lib/data/inail-infortuni-contract";

export interface SeriePoint {
  label: string;
  totale: number;
  mortali: number;
}

export function buildMonthlySerie(aggregates: InjuryAggregate[]): SeriePoint[] {
  const map = new Map<string, { totale: number; mortali: number }>();
  // Nota: nel dataset mensile gli esiti mortali sono contati separatamente nel meta;
  // qui la serie mostra i casi totali per mese.
  for (const row of aggregates) {
    const key = `${row.anno}-${String(row.mese).padStart(2, "0")}`;
    const current = map.get(key) ?? { totale: 0, mortali: 0 };
    current.totale += row.casi;
    map.set(key, current);
  }
  const mesi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({
      label: `${mesi[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
      totale: value.totale,
      mortali: value.mortali,
    }));
}

export function InfortuniMonthlyChart({ data }: { data: SeriePoint[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 12 }} width={52} />
          <Tooltip />
          <Line type="monotone" dataKey="totale" name="Casi" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
