"use client";

import { useMemo } from "react";
import {
  getInformoAnalisi,
  serieAnno,
  formattaDelta,
} from "@/lib/informo-casi";

// KPI d'apertura della pagina Casi mortali: il dato piu' recente (2024) messo
// a confronto con l'anno precedente, con delta in valore e percentuale
// (RULES.md regola 2, ordine di lettura: il primo blocco risponde a
// "come stiamo andando?").
export function InformoKpi() {
  const data = useMemo(() => getInformoAnalisi(), []);
  const corrente = serieAnno(data, 2024);
  const prev = serieAnno(data, 2023);

  if (!corrente) return null;
  const totale = corrente.totaleFiltri ?? corrente.casiAnalizzati;
  const deltaTot = corrente.deltaCasi ?? 0;
  const peggiora = deltaTot > 0;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
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
          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--color-accent)",
              fontWeight: 650,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Casi mortali analizzati (Infor.MO)
          </div>
          <div style={{ fontSize: "0.88rem", color: "var(--color-text-soft)" }}>
            Archivio INAIL · casi mortale · 2024 vs 2023
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>Casi 2024</div>
          <div className="metric-value" style={{ fontSize: "2rem", color: "var(--color-text)" }}>
            {totale?.toLocaleString("it-IT") ?? "—"}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 650,
              color: peggiora ? "var(--color-accent)" : "var(--color-success)",
            }}
          >
            {formattaDelta(corrente.deltaCasi, corrente.deltaPerc)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            vs 2023 ({prev?.casiAnalizzati ?? "—"})
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Dettaglio completo
          </div>
          <div className="metric-value" style={{ color: "var(--color-accent)" }}>
            {corrente.copertura !== undefined
              ? `${corrente.copertura.toLocaleString("it-IT")}%`
              : "—"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            dei casi dell&apos;archivio con dinamica e fattori
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Fattori causali analizzati
          </div>
          <div className="metric-value" style={{ color: "var(--color-text)" }}>
            {data.totFattori?.toLocaleString("it-IT") ?? "—"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            su {data.casiConFattori?.toLocaleString("it-IT") ?? "—"} casi
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Quota sul totale nazionale
          </div>
          <div className="metric-value" style={{ color: "var(--color-text)" }}>
            {data.quotaQuinquennio !== undefined
              ? `${data.quotaQuinquennio.toLocaleString("it-IT")}%`
              : "—"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            dei {data.totaleMortaliNazionali?.toLocaleString("it-IT") ?? "—"} morti
            denunciati 2020-2024 (serie INAIL)
          </div>
        </div>
      </div>

      <p className="source-note">
        Fonte: INAIL, archivio Infor.MO (InformoWeb), casi con tipoEvento mortale
        analizzati con il modello Informo nel periodo 2020-2024. Il campione è
        una parte delle denunce di morte registrate da INAIL nello stesso
        periodo (14.051): la quota è dichiarata perché l&apos;analisi dei fattori
        vale per i casi analizzati, non per tutti i decessi denunciati. La
        copertura "dettaglio completo" misura invece quanti casi dell&apos;archivio
        hanno la scheda di analisi, ed è indipendente dal totale nazionale.
      </p>
    </div>
  );
}