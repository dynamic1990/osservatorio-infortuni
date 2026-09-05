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

// Trend dei casi mortali analizzati per anno (2020-2024). Un punto per anno,
// non un aggregato multi-anno (RULES.md regola 1). È la lettura storica
// dell'archivio: ogni barra è un anno distinto. Niente delta anno su anno
// perché il dato è un sottoinsieme (campione) analizzato dell'archivio, non
// la panoramica totale degli eventi: la variazione misurerebbe la copertura
// dell'archivio più che il fenomeno reale.
export function InformoTrendWidget() {
  const data = useMemo(() => getInformoAnalisi(), []);

  const chartData = useMemo(() => {
    return data.serie.map((s) => ({
      anno: s.anno,
      casi: s.casiAnalizzati,
      copertura: s.copertura ?? 100,
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
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    <div className="tooltip-row">
                      <span>Casi analizzati:</span>
                      <strong>{p.casi}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Copertura del dettaglio:</span>
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
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda testuale sotto il grafico (non sovrapposta al plot) */}
      <div
        style={{
          display: "flex",
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
        Casi analizzati per anno (Infor.MO)
      </div>

      <p className="source-note">
        Ogni barra è un anno distinto dell&apos;archivio Infor.MO: la pagina non
        presenta confronti anno su anno perché l&apos;archivio documenta una parte
        dei casi denunciati, quindi una variazione tra anni rifletterebbe la
        copertura dell&apos;archivio più che l&apos;andamento reale degli eventi. La
        copertura del dettaglio è il rapporto tra casi analizzati e denunce con
        esito mortale dell&apos;archivio nello stesso anno; dove è 100%
        l&apos;archivio documenta l&apos;intero periodo.
      </p>
    </div>
  );
}