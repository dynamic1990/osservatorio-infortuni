"use client";

import { useMemo, type ReactNode } from "react";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { exactNumber } from "@/lib/format";
import { QuotaGenere } from "@/components/charts/quota-genere";

interface KpiItem {
  label: string;
  value: string;
  sub?: string;
  split?: ReactNode;
  accent?: boolean;
}

export function MalattieKpi() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);

  const sem = dati.nazionale.confrontoPrimoSemestre;
  const delta = sem.delta;
  const deltaPerc = sem.deltaPerc;
  const trendUp = delta >= 0;
  const genere = dati.nazionale.perGenere;
  const decessi = dati.decessi;

  // Quota malattie muscolo-scheletriche (capitolo M ICD-10)
  const chiaviM = new Set([
    "SPALLA", "RACHIDE", "CANALICOLARI", "TENDINOPATIE", "TENOSINOVITI",
    "MENISCO", "ARTROSI", "SPONDILOSI", "DEFORMITA", "MUSCOLOSCHELETRICO_ALTRO",
  ]);
  const casiM = dati.categorie.filter((c) => chiaviM.has(c.key)).reduce((a, c) => a + c.casi, 0);
  const quotaM = dati.nazionale.totale > 0 ? Math.round((casiM / dati.nazionale.totale) * 100) : 0;

  const decM = decessi.perGenere.M ?? 0;
  const decF = decessi.perGenere.F ?? 0;
  const quotaDecM = decM + decF > 0 ? Math.round((decM / (decM + decF)) * 100) : 0;

  const kpi: KpiItem[] = [
    {
      label: "Denunce nel periodo",
      value: exactNumber(dati.nazionale.totale),
      sub: "gen-giu 2025 e gen-giu 2026 (CSV INAIL)",
      split: <QuotaGenere maschi={genere.M ?? 0} femmine={genere.F ?? 0} compact />,
    },
    {
      label: "I semestre 2026 vs 2025",
      value: `${deltaPerc !== null && deltaPerc > 0 ? "+" : ""}${(deltaPerc ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`,
      sub: `${trendUp ? "+" : ""}${exactNumber(delta)} denunce`,
      accent: trendUp,
    },
    {
      label: "Patologie muscolo-scheletriche",
      value: `${quotaM}%`,
      sub: `${exactNumber(casiM)} denunce su capitolo M ICD-10`,
    },
    {
      label: "Decessi registrati",
      value: exactNumber(decessi.totale),
      sub: `2020-2024 · età media ${(decessi.etaMedia ?? 0).toString().replace(".", ",")} anni · ${quotaDecM}% M`,
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
          {k.split ?? <div className="metric-sub">{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}
