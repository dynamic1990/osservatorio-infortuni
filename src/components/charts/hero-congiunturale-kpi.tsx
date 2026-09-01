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
  Legend,
} from "recharts";
import { getCongiunturaleData } from "@/lib/multidimensionale";
import { compactNumber, exactNumber, percent } from "@/lib/format";
import { MODAL_COLORS } from "@/lib/palette";

const MESI_NOMI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"];

export function HeroCongiunturaleKpi() {
  const data = useMemo(() => getCongiunturaleData(), []);
  const [filtroMod, setFiltroMod] = useState<"totale" | "lavoro" | "itinere">("totale");

  // Calcolo KPI in base alla modalita selezionata
  const kpiMod = useMemo(() => {
    if (filtroMod === "lavoro") return data.nazionale.lavoro;
    if (filtroMod === "itinere") return data.nazionale.itinere;
    return data.nazionale.totale;
  }, [data, filtroMod]);

  // Esiti mortali coerenti con l'ambito selezionato
  const mortali = useMemo(() => {
    if (filtroMod === "lavoro") return data.nazionale.mortaliLavoro;
    if (filtroMod === "itinere") return data.nazionale.mortaliItinere;
    return data.nazionale.mortali;
  }, [data, filtroMod]);
  const occMln = (data.nazionale.occupati2024 / 1_000_000).toFixed(1);

  // Calcolo incidenza semestrale per la modalita
  const occMigliaia = data.nazionale.occupati2024 / 1000;
  const inc25 = (kpiMod.anno2025 / occMigliaia).toFixed(2);
  const inc26 = (kpiMod.anno2026 / occMigliaia).toFixed(2);
  const deltaInc = (Number(inc26) - Number(inc25)).toFixed(2);

  // Serie mensile a confronto
  const chartData = useMemo(() => {
    return data.perMese.map((m) => {
      let v25 = m.tot2025;
      let v26 = m.tot2026;
      if (filtroMod === "lavoro") {
        v25 = m.lav2025;
        v26 = m.lav2026;
      } else if (filtroMod === "itinere") {
        v25 = m.iti2025;
        v26 = m.iti2026;
      }
      return {
        mese: MESI_NOMI[m.mese - 1] || `M${m.mese}`,
        "2025": v25,
        "2026": v26,
        deltaPerc: v25 > 0 ? (((v26 - v25) / v25) * 100).toFixed(1) : "0.0",
      };
    });
  }, [data, filtroMod]);

  const modLabel =
    filtroMod === "lavoro"
      ? "In occasione di lavoro"
      : filtroMod === "itinere"
      ? "In itinere"
      : "Tutti gli infortuni";

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Intestazione e Controlli filtro */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-3)",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: "var(--space-3)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-accent)", fontWeight: 650, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Monitoraggio Congiunturale a Pari Perimetro
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            I Semestre 2026 vs I Semestre 2025 (Gennaio – Giugno)
          </div>
        </div>

        {/* Filtro Tipo Infortunio */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Ambito:</span>
          {(["totale", "lavoro", "itinere"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFiltroMod(mode)}
              style={{
                border: "1px solid var(--color-divider)",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "0.82rem",
                fontWeight: filtroMod === mode ? 650 : 500,
                cursor: "pointer",
                background: filtroMod === mode ? "var(--color-text)" : "var(--color-surface)",
                color: filtroMod === mode ? "#ffffff" : "var(--color-text)",
                transition: "all 0.15s ease",
              }}
            >
              {mode === "totale" ? "Tutti i casi" : mode === "lavoro" ? "Occasione di lavoro" : "In itinere"}
            </button>
          ))}
        </div>
      </div>

      {/* Griglia KPI Principali */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {/* KPI 1: Numero Infortuni congiunturali */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-3)",
            borderRadius: "6px",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div className="metric-label">{modLabel} (6 mesi)</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
            <span className="metric" style={{ fontSize: "1.7rem" }}>{exactNumber(kpiMod.anno2026)}</span>
            <span style={{ fontSize: "0.88rem", color: "var(--color-text-soft)" }}>nel 2026</span>
          </div>
          <div style={{ fontSize: "0.82rem", marginTop: "var(--space-1)", color: "var(--color-text-soft)" }}>
            vs {exactNumber(kpiMod.anno2025)} nel 2025 (
            <span
              style={{
                fontWeight: 700,
                color: kpiMod.delta > 0 ? "var(--color-accent)" : "#1a6b34",
              }}
            >
              {kpiMod.delta > 0 ? `+${exactNumber(kpiMod.delta)}` : exactNumber(kpiMod.delta)} casi,{" "}
              {kpiMod.deltaPerc > 0 ? `+${kpiMod.deltaPerc}%` : `${kpiMod.deltaPerc}%`}
            </span>
            )
          </div>
        </div>

        {/* KPI 2: Infortuni Mortali */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-3)",
            borderRadius: "6px",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div className="metric-label">Esiti mortali denunciati</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
            <span className="metric" style={{ fontSize: "1.7rem", color: "var(--color-accent)" }}>
              {exactNumber(mortali.anno2026)}
            </span>
            <span style={{ fontSize: "0.88rem", color: "var(--color-text-soft)" }}>nel 2026</span>
          </div>
          <div style={{ fontSize: "0.82rem", marginTop: "var(--space-1)", color: "var(--color-text-soft)" }}>
            vs {exactNumber(mortali.anno2025)} nel 2025 (
            <span
              style={{
                fontWeight: 700,
                color: mortali.delta <= 0 ? "#1a6b34" : "var(--color-accent)",
              }}
            >
              {mortali.delta > 0 ? `+${mortali.delta}` : mortali.delta} casi,{" "}
              {mortali.deltaPerc > 0 ? `+${mortali.deltaPerc}%` : `${mortali.deltaPerc}%`}
            </span>
            )
          </div>
        </div>

        {/* KPI 3: Incidenza semestrale per 1.000 occupati */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-3)",
            borderRadius: "6px",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div className="metric-label">Incidenza semestrale</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
            <span className="metric" style={{ fontSize: "1.7rem" }}>{inc26}</span>
            <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)" }}>per 1.000 occ.</span>
          </div>
          <div style={{ fontSize: "0.82rem", marginTop: "var(--space-1)", color: "var(--color-text-soft)" }}>
            vs {inc25} nel 2025 (
            <span style={{ fontWeight: 700, color: Number(deltaInc) > 0 ? "var(--color-accent)" : "#1a6b34" }}>
              {Number(deltaInc) > 0 ? `+${deltaInc}` : deltaInc} per mille
            </span>
            )
          </div>
        </div>

        {/* KPI 4: Base occupazionale / Denominatore */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-3)",
            borderRadius: "6px",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div className="metric-label">Base Occupati (Denominatore)</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
            <span className="metric" style={{ fontSize: "1.7rem" }}>{occMln}M</span>
            <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)" }}>occupati 15-64</span>
          </div>
          <div style={{ fontSize: "0.78rem", marginTop: "var(--space-1)", color: "var(--color-text-soft)" }}>
            Fonte: <strong>Eurostat lfst_r_lfe2emp / ISTAT RCFL</strong>
          </div>
        </div>
      </div>

      {/* Grafico a barre mensile a confronto 2025 vs 2026 */}
      <div style={{ marginTop: "var(--space-2)" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 650, marginBottom: "var(--space-2)" }}>
          Andamento mensile a confronto: Gennaio – Giugno ({modLabel.toLowerCase()})
        </div>
        <div style={{ width: "100%", height: 230 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
              <XAxis dataKey="mese" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => compactNumber(v)} width={50} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${exactNumber(Number(val))} casi`,
                  `Anno ${name}`,
                ]}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 6, fontSize: "0.82rem" }} />
              <Bar dataKey="2025" name="I Sem. 2025" fill="#8c8884" isAnimationActive={false} radius={[2, 2, 0, 0]} />
              <Bar dataKey="2026" name="I Sem. 2026" fill={MODAL_COLORS.lavoro} isAnimationActive={false} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="source-note" style={{ marginTop: "var(--space-2)" }}>
          Nota metodologica di confronto: rilevazione a parità di finestra temporale (primi 6 mesi). I dati 2025 e 2026 sono di natura congiunturale (denunce mensili provvisorie soggette a consolidamento) e non sono sommati alle serie storiche consolidate 2020-2024.
        </div>
      </div>
    </div>
  );
}
