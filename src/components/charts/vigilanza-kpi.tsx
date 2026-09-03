"use client";

import { useMemo, type ReactNode } from "react";
import { getVigilanzaData } from "@/lib/vigilanza";
import { exactNumber } from "@/lib/format";

interface KpiItem {
  label: string;
  value: string;
  sub?: string;
  split?: ReactNode;
  accent?: boolean;
}

function formatEuro(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} mld €`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 0 })} mln €`;
  return `${v.toLocaleString("it-IT")} €`;
}

export function VigilanzaKpi() {
  const dati = useMemo(() => getVigilanzaData(), []);
  const serie = [...dati.serie].sort((a, b) => b.anno - a.anno);
  const ultimo = serie[0];
  const precedente = serie[1];

  const kpi: KpiItem[] = [
    {
      label: "Controlli avviati 2025",
      value: exactNumber(ultimo.controlliAvviati),
      sub: `INL+INPS+INAIL · € ${formatEuro(ultimo.recuperoEuro)} recuperati`,
    },
    {
      label: "Tasso di irregolarità",
      value: `${ultimo.tassoIrregolarita.toLocaleString("it-IT")}%`,
      sub: `aziende irregolari: ${exactNumber(ultimo.ispezioniIrregolari)} su ${exactNumber(ultimo.ispezioniDefinite)} definite`,
      accent: false,
    },
    {
      label: "Lavoratori in nero",
      value: exactNumber(ultimo.lavoratoriInNero),
      sub: precedente ? `${ultimo.lavoratoriInNero >= precedente.lavoratoriInNero ? "+" : ""}${exactNumber(ultimo.lavoratoriInNero - precedente.lavoratoriInNero)} vs ${precedente.anno}` : undefined,
    },
    {
      label: "Violazioni sicurezza 2025",
      value: exactNumber(ultimo.violazioniSicurezza),
      sub: `penali D.Lgs. 81/2008 · ${precedente ? `+${((ultimo.violazioniSicurezza - precedente.violazioniSicurezza) / precedente.violazioniSicurezza * 100).toLocaleString("it-IT", { maximumFractionDigits: 1 })}% vs ${precedente.anno}` : ""}`,
      accent: true,
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