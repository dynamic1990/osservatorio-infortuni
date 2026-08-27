"use client";

import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SerieCount } from "@/lib/data/inail-viste-contract";
import { atecoLabel, atecoShort } from "@/lib/ateco";
import { PALETTE } from "@/lib/palette";

export interface SettorePoint {
  settore: string;
  casi: number;
}

export function buildSettoriSerie(settori: SerieCount[]): SettorePoint[] {
  return settori.map((s) => ({ settore: s.key, casi: s.casi }));
}

export function InfortuniSettoriChart({ data }: { data: SettorePoint[] }) {
  const labelled = data
    .filter((s) => s.settore !== "ND")
    .map((s, i) => ({
      code: s.settore,
      label: atecoLabel(s.settore),
      casi: s.casi,
      color: PALETTE[i % PALETTE.length],
    }));

  return (
    <div style={{ width: "100%", height: Math.max(360, labelled.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={labelled} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12, width: 260 }}
            width={250}
            tickFormatter={(v, i) => {
              const item = labelled[i];
              return item ? `${item.code} · ${v}` : v;
            }}
          />
          <Tooltip
            formatter={(val, _name, item: any) => [Number(val ?? 0).toLocaleString("it-IT"), atecoLabel(item?.payload?.code ?? "")]}
          />
          <Bar dataKey="casi" name="Casi" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {labelled.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
