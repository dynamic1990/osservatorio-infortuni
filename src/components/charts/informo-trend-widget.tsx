"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getInformoAnalisi } from "@/lib/informo-casi";

// Trend dei casi mortali analizzati per anno (2020-2024). Un punto per anno,
// non un aggregato multi-anno (RULES.md regola 1). Apre il confronto con il
// trend storico dopo il KPI d'apertura (ordine di lettura regola 2).
export function InformoTrendWidget() {
  const data = useMemo(() => getInformoAnalisi(), []);

  const chartData = useMemo(() => {
    return data.serie.map((s) => ({
      anno: s.anno,
      casi: s.casiAnalizzati,
      copertura: s.copertura ?? 100,
      delta: s.deltaCasi,
      deltaPerc: s.deltaPerc,
    }));
  }, [data]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Casi mortali analizzati per anno (2020 - 2024)
        </div>
      </div>

      <div style={{ width: "100%", height: 330 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 16, bottom: 16, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={52} allowDecimals={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                const delta = p.delta !== undefined && p.delta !== null
                  ? `${p.delta > 0 ? "+" : ""}${p.delta} (${p.deltaPerc > 0 ? "+" : ""}${p.deltaPerc}%)`
                  : "primo anno della serie";
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    <div className="tooltip-row">
                      <span>Casi analizzati:</span>
                      <strong>{p.casi}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Δ vs anno precedente:</span>
                      <strong>{delta}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Copertura dettaglio:</span>
                      <strong>{p.copertura}%</strong>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="casi"
              name="Casi analizzati"
              fill="var(--color-accent)"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Ogni barra è un anno distinto: il confronto corretto è l&apos;anno in
        oggetto contro quello precedente (delta in valore e percentuale nel
        tooltip). Fonte: INAIL Infor.MO, casi con tipoEvento mortale con scheda
        di dettaglio. La copertura è il rapporto tra casi analizzati e denunce
        con esito mortale dell&apos;archivio nello stesso anno; dove è 100%
        l&apos;archivio documenta l&apos;intero periodo.
      </p>
    </div>
  );
}