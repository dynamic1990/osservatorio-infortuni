"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { ItalyMap } from "@/components/charts/italy-map";
import { regioneName } from "@/lib/labels";
import { PALETTE } from "@/lib/palette";

interface RegionePoint {
  regione: string; // codice
  casi: number;
}

export function RegioniSection({ data }: { data: RegionePoint[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const values = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of data) map[d.regione] = d.casi;
    return map;
  }, [data]);

  const bars = useMemo(() => {
    return data.map((d) => ({
      code: d.regione,
      label: regioneName(d.regione),
      casi: d.casi,
      highlight: selected === d.regione,
    }));
  }, [data, selected]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)", alignItems: "start" }}>
      <div>
        <ItalyMap regions={values} onSelect={setSelected} selected={selected} title="Mappa Italia" />
        <p className="source-note">
          Intensità del colore = numero di casi 2020-2024. Clicca una regione per evidenziarla anche nel
          grafico. Il confronto diretto tra regioni richiede i denominatori (occupati per territorio).
        </p>
      </div>
      <div>
        <h3 style={{ fontSize: "1rem", marginTop: 0 }}>
          {selected ? regioneName(selected) : "Regioni (2020-2024)"}
        </h3>
        <div style={{ width: "100%", height: 560 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={130} />
              <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString("it-IT")} />
              <Bar dataKey="casi" name="Casi" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                {bars.map((b, i) => (
                  <Cell
                    key={i}
                    fill={b.highlight ? "var(--color-text)" : PALETTE[i % PALETTE.length]}
                    fillOpacity={b.highlight ? 1 : 0.55}
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}