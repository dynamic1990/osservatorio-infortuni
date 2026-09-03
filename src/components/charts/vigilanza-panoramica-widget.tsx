"use client";

import { useMemo } from "react";
import { getVigilanzaData } from "@/lib/vigilanza";
import { exactNumber } from "@/lib/format";

function formatEuro(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} mld €`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 0 })} mln €`;
  return `${v.toLocaleString("it-IT")} €`;
}

export function VigilanzaPanoramicaWidget() {
  const dati = useMemo(() => getVigilanzaData(), []);
  const serie = [...dati.serie].sort((a, b) => a.anno - b.anno);
  const ultimo = serie[serie.length - 1];
  const primo = serie[0];
  const p = dati.patenteCrediti;

  const riquadri = [
    {
      titolo: "Recupero contributi e premi evasi",
      valore: formatEuro(ultimo.recuperoEuro),
      dettaglio: `Nel ${ultimo.anno} il personale ispettivo ha recuperato ${exactNumber(ultimo.recuperoEuro)} euro tra contributi previdenziali INPS e premi assicurativi INAIL non versati. Nel 2023 il recupero era ${formatEuro(serie.find((s) => s.anno === 2023)?.recuperoEuro ?? 0)}; la crescita riflette anche la maggiore capacità di accertamento dell&apos;azione di vigilanza.`,
      colore: "#2f8f5b",
    },
    {
      titolo: "Lavoratori irregolari e sommerso",
      valore: exactNumber(ultimo.lavoratoriIrregolari ?? 0),
      dettaglio: `Sono i lavoratori cui si riferiscono gli atti ispettivi definiti nell&apos;anno: ${exactNumber(ultimo.lavoratoriIrregolari ?? 0)} nel ${ultimo.anno}, con ${exactNumber(ultimo.lavoratoriInNero)} lavoratori totalmente in nero. Nel ${primo.anno} i lavoratori in nero erano ${exactNumber(primo.lavoratoriInNero)}. Il dato fotografa l&apos;attività accertata, non la stima del sommerso.`,
      colore: "#c77d0a",
    },
    {
      titolo: "Sospensioni: massimo storico nel 2024",
      valore: `${exactNumber(serie.reduce((m, s) => (s.sospensioni > m ? s.sospensioni : m), 0))} provvedimenti`,
      dettaglio: `Nel 2024 i provvedimenti di sospensione dell&apos;attività imprenditoriale hanno toccato il record di ${exactNumber(15002)}, di cui ${exactNumber(5601)} per gravi violazioni in materia di sicurezza. Nel 2025 sono stati ${exactNumber(ultimo.sospensioni)}, secondo valore storico, con ${exactNumber(ultimo.sospensioniSicurezza)} legati alla sicurezza dei luoghi di lavoro.`,
      colore: "#b3261e",
    },
  ];

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div className="grid-kpi">
        {riquadri.map((r) => (
          <div
            key={r.titolo}
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderTop: `3px solid ${r.colore}`,
            }}
          >
            <div className="metric-label">{r.titolo}</div>
            <div className="metric-value" style={{ color: "var(--color-text)", fontSize: "1.35rem" }}>
              {r.valore}
            </div>
            <div className="metric-sub" style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
              {r.dettaglio}
            </div>
          </div>
        ))}
      </div>

      {/* Patente a crediti */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          border: "1px solid var(--color-divider)",
        }}
      >
        <div style={{ fontSize: "0.85rem", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-text-soft)", marginBottom: "var(--space-2)" }}>
          Patente a crediti nei cantieri (art. 27 D.Lgs. 81/2008)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
          {[
            { label: "Patenti rilasciate", value: exactNumber(p.rilasciate), sub: `dal ${p.attivaDa}` },
            { label: "Sanzioni per assenza", value: exactNumber(p.sanzioniAssenza), sub: "elevate dall'INL" },
            { label: "Patenti revocate", value: exactNumber(p.revocate), sub: "dal 1° ottobre 2024" },
            { label: "Patenti sospese", value: exactNumber(p.sospese), sub: "provvedimenti 2025" },
          ].map((c) => (
            <div key={c.label}>
              <div className="metric-label">{c.label}</div>
              <div className="metric-value" style={{ fontSize: "1.3rem" }}>{c.value}</div>
              <div className="metric-sub">{c.sub}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "var(--space-3) 0 0", maxWidth: "72ch", lineHeight: 1.55 }}>
          La patente a crediti, introdotta dalla riforma del 2024, è obbligatoria dal 1° gennaio 2025 per imprese e
          lavoratori autonomi operanti nei cantieri temporanei o mobili. Ogni infortunio grave o violazione in materia
          di sicurezza comporta una decurtazione dei crediti, con sospensione o revoca al di sotto della soglia minima.
          Dato aggiornato al rapporto annuale INL 2025 (pubblicato 2026).
        </p>
      </div>
    </div>
  );
}