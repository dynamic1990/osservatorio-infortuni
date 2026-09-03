"use client";

import { useMemo } from "react";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { exactNumber } from "@/lib/format";

export function MalattieKpi() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);

  const sem = dati.nazionale.confrontoPrimoSemestre;
  const delta = sem.delta;
  const deltaPerc = sem.deltaPerc;
  const trendUp = delta >= 0;
  const genere = dati.nazionale.perGenere;
  const totGenere = (genere.M ?? 0) + (genere.F ?? 0);
  const quotaM = totGenere > 0 ? Math.round(((genere.M ?? 0) / totGenere) * 100) : 0;
  const decessi = dati.decessi;

  const kpi = [
    {
      label: "Denunce nel periodo",
      value: exactNumber(dati.nazionale.totale),
      sub: "gen-giu 2025 e gen-giu 2026 (CSV INAIL)",
    },
    {
      label: "I semestre 2026 vs 2025",
      value: `${deltaPerc !== null && deltaPerc > 0 ? "+" : ""}${(deltaPerc ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`,
      sub: `${trendUp ? "+" : ""}${exactNumber(delta)} denunce`,
      accent: trendUp,
    },
    {
      label: "Quota maschile",
      value: `${quotaM}%`,
      sub: `${exactNumber(genere.M ?? 0)} M · ${exactNumber(genere.F ?? 0)} F`,
    },
    {
      label: "Decessi registrati",
      value: exactNumber(decessi.totale),
      sub: "2020-2024, età media " + (decessi.etaMedia ?? "n.d.").toString().replace(".", ",") + " anni",
    },
  ];

  return (
    <div className="grid-kpi">
      {kpi.map((k) => (
        <div
          key={k.label}
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            borderLeft: k.accent ? "3px solid var(--color-accent)" : "3px solid var(--color-divider)",
          }}
        >
          <div className="metric-label">{k.label}</div>
          <div className="metric-value" style={{ color: k.accent ? "var(--color-accent)" : "var(--color-text)" }}>
            {k.value}
          </div>
          <div className="metric-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
