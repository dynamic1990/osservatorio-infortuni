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
} from "recharts";
import { getInformoAnalisi } from "@/lib/informo-casi";

// Trend quinquennale (2020-2024) degli infortuni mortali: ogni barra mostra il
// totale dei morti denunciati (serie INAIL) e, dentro, la quota dei casi con
// scheda di dettaglio nell'archivio Infor.MO. È un grafico a pile: la parte
// alta (colore testo) è la differenza tra le denunce e i casi analizzati.
// Un punto per anno, nessun aggregato multi-anno (RULES.md regola 1) e nessun
// confronto anno su anno: serve a leggere la copertura dell'archivio sul
// totale degli eventi, non a misurare variazioni tra anni.
export function InformoTrendWidget() {
  const data = useMemo(() => getInformoAnalisi(), []);

  const chartData = useMemo(() => {
    return data.serie.map((s) => {
      const totale = s.mortaliNazionali ?? s.casiAnalizzati;
      const casi = s.casiAnalizzati;
      return {
        anno: s.anno,
        casi,
        totale,
        nonCoperti: Math.max(0, totale - casi),
      };
    });
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
          Infortuni mortali per anno: totale denunciato e casi analizzati
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
                const copertura =
                  p.totale > 0 ? Math.round((p.casi / p.totale) * 1000) / 10 : 0;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    <div className="tooltip-row">
                      <span>Morti denunciati:</span>
                      <strong>{p.totale}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Casi analizzati Infor.MO:</span>
                      <strong>{p.casi}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Copertura dell&apos;archivio:</span>
                      <strong>{copertura}%</strong>
                    </div>
                  </div>
                );
              }}
            />
            {/* parte senza scheda: sotto (colore neutro) */}
            <Bar
              dataKey="nonCoperti"
              name="Morti senza analisi Infor.MO"
              stackId="mortali"
              fill="var(--color-surface)"
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            />
            {/* casi analizzati: sopra (accento) */}
            <Bar
              dataKey="casi"
              name="Casi analizzati Infor.MO"
              stackId="mortali"
              fill="var(--color-accent)"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda testuale sotto il grafico (non sovrapposta al plot) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-2)",
          fontSize: "0.8rem",
          color: "var(--color-text-soft)",
          paddingTop: "var(--space-1)",
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            display: "inline-block",
            background: "var(--color-accent)",
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        Casi analizzati nell&apos;archivio Infor.MO
        <span
          style={{
            width: 12,
            height: 12,
            display: "inline-block",
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            borderRadius: 2,
            flexShrink: 0,
            marginLeft: "var(--space-3)",
          }}
        />
        Morti denunciati senza scheda di analisi
      </div>

      <p className="source-note">
        Ogni barra è un anno distinto: l&apos;altezza totale è il numero di infortuni
        mortali denunciati da INAIL (serie da denunce), la parte rossa sono i
        casi con scheda di dettaglio nell&apos;archivio Infor.MO e la parte chiara la
        differenza, cioè i decessi denunciati senza analisi Infor.MO. La pagina
        non presenta confronti anno su anno perché l&apos;archivio documenta una
        parte dei casi: una variazione tra anni rifletterebbe la copertura
        dell&apos;archivio, non l&apos;andamento reale degli eventi.
      </p>
    </div>
  );
}