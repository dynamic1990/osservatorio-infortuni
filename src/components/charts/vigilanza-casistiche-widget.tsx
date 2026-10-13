"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  getVigilanzaDettaglioData,
  CASISTICHE_SSL_LABEL,
  CASISTICHE_SSL_ORDER,
  SETTORI_ORDINE,
} from "@/lib/vigilanza-dettaglio";
import { exactNumber } from "@/lib/format";

/** Perché si sospende: casistiche delle gravi violazioni SSL (art. 14). */
export function VigilanzaCasisticheWidget() {
  const dati = useMemo(() => getVigilanzaDettaglioData(), []);
  const [settore, setSettore] = useState<string>("Tutti i settori");

  const ambient = useMemo(() => {
    const righe = dati.casisticheSsl; // solo 2025
    const settori = ["Tutti i settori", ...SETTORI_ORDINE];
    return { righe, settori };
  }, [dati]);

  const chartData = useMemo(() => {
    const righe =
      settore === "Tutti i settori"
        ? ambient.righe
        : ambient.righe.filter((r) => r.settore === settore);
    const agg: Record<string, number> = {};
    for (const r of righe) {
      for (const k of CASISTICHE_SSL_ORDER) {
        agg[k] = (agg[k] ?? 0) + (r[k as keyof typeof r] as number);
      }
    }
    return CASISTICHE_SSL_ORDER.map((k) => ({
      chiave: k,
      nome: CASISTICHE_SSL_LABEL[k],
      casi: agg[k] ?? 0,
    })).sort((a, b) => b.casi - a.casi);
  }, [ambient.righe, settore]);

  const totale = useMemo(
    () => chartData.reduce((acc, d) => acc + d.casi, 0),
    [chartData]
  );

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Le carenze che fanno scattare la sospensione (2025)
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
            {settore === "Tutti i settori"
              ? "Motivazioni delle 3.708 sospensioni per gravi violazioni SSL (art. 14, D.Lgs. 81/2008)"
              : `Motivazioni nel settore ${settore}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {ambient.settori.map((s) => (
            <button
              key={s}
              onClick={() => setSettore(s)}
              className={`btn-pill ${settore === s ? "active" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="nome" width={236} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload as Record<string, unknown>;
                const casi = Number(row.casi ?? 0);
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">{String(row.nome ?? "")} (2025)</div>
                    <div className="tooltip-row">
                      <span>Sospensioni con questa carenza:</span>
                      <strong>
                        {exactNumber(casi)}{" "}
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 550 }}>
                          ({totale > 0 ? Math.round((casi * 100) / totale) : 0}%)
                        </span>
                      </strong>
                    </div>
                    <div
                      className="tooltip-row"
                      style={{ marginTop: 4, borderTop: "1px solid var(--color-divider)", paddingTop: 4 }}
                    >
                      <span>Totale motivazioni (2025):</span>
                      <strong>{exactNumber(totale)}</strong>
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Bar dataKey="casi" name="Motivazioni" fill="#057dbc" radius={[0, 3, 3, 0]} maxBarSize={22} isAnimationActive={false}>
              <LabelList dataKey="casi" position="right" formatter={(v: unknown) => exactNumber(Number(v ?? 0))} style={{ fontSize: 11, fill: "#757575" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          {exactNumber(totale)} motivazioni
        </div>
        <p className="source-note" style={{ margin: 0 }}>
          Fonte: INL, Monitoraggio periodico dei provvedimenti di sospensione (art. 14, D.Lgs. 81/2008),
          anno 2025, casistiche per gravi violazioni in materia di salute e sicurezza. Un provvedimento può
          riportare più motivazioni. Il filtro mostra la composizione per settore.
        </p>
      </div>
    </div>
  );
}