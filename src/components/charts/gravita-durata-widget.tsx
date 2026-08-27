"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getApprofondimenti, GRAVITA_LABEL, DURATA_LABEL, labelOf } from "@/lib/approfondimenti";
import { PALETTE } from "@/lib/palette";

type Dim = "gravita" | "durata";

const DIM_LABEL: Record<Dim, string> = {
  gravita: "Gravità del danno (grado di menomazione)",
  durata: "Durata dell'assenza (giorni indennizzati)",
};

const ORDINE_GRAVITA = ["nessuna", "franchigia", "capitale", "rendita"];
const ORDINE_DURATA = ["nessuna", "breve", "media", "lunga", "lunga90"];

export function GravitaDurataWidget() {
  const d = useMemo(() => getApprofondimenti(), []);
  const [dim, setDim] = useState<Dim>("gravita");

  const ordine = dim === "gravita" ? ORDINE_GRAVITA : ORDINE_DURATA;
  const data = useMemo(() => {
    return d.dimensioni[dim].map((r) => {
      const out: Record<string, number | string> = { anno: r.anno };
      for (const k of ordine) out[k] = r[k] ?? 0;
      return out;
    });
  }, [d, dim, ordine]);

  // totale per anno (per la linea di contesto)
  const conTotale = data.map((r) => {
    let tot = 0;
    for (const k of ordine) tot += Number(r[k] ?? 0);
    return { ...r, totale: tot };
  });

  const palette = dim === "gravita" ? PALETTE.slice(0, 4) : ["#2f8f5b", "#c77d0a", "#d45b2c", "#b3261e", "#6e1c14"];

  return (
    <div>
      <div style={{ marginBottom: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {(["gravita", "durata"] as Dim[]).map((k) => (
          <button
            key={k}
            onClick={() => setDim(k)}
            style={{
              border: "1px solid var(--color-divider)",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: "0.85rem",
              cursor: "pointer",
              background: dim === k ? "var(--color-accent)" : "transparent",
              color: dim === k ? "#fff" : "inherit",
            }}
          >
            {DIM_LABEL[k]}
          </button>
        ))}
      </div>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={conTotale} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v)} />
            <Tooltip formatter={(val, name) => [Number(val ?? 0).toLocaleString("it-IT"), String(name)]} />
            <Legend />
            {ordine.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={labelOf(dim === "gravita" ? GRAVITA_LABEL : DURATA_LABEL, k)}
                fill={palette[i]}
                stackId="a"
                isAnimationActive={false}
              />
            ))}
            <Line type="monotone" dataKey="totale" name="Totale" stroke="#201e1d" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        {dim === "gravita"
          ? "Grado di menomazione accertato a fine pratica (fonte: campo GradoMenomazione, cadenza semestrale). Le soglie seguono la normativa INAIL: franchigia 0-5%, indennizzo in capitale 6-15%, rendita oltre il 15%. La quota 'nessuna menomazione' comprende i casi senza danno biologico permanente."
          : "Giorni di inabilità indennizzati (fonte: campo GiorniIndennizzati, cadenza semestrale). Classi di durata costruite per la lettura del rischio: oltre 90 giorni indica infortuni con impatto produttivo e sanitario prolungato."}
      </p>
    </div>
  );
}