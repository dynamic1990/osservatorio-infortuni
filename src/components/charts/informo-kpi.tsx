"use client";

import { useMemo } from "react";
import { getInformoAnalisi, serieAnno } from "@/lib/informo-casi";

// KPI d'apertura della pagina Casi mortali: il dato più recente (2024) senza
// confronti anno su anno. Il confronto non ha senso qui perché l'archivio
// Infor.MO non è una panoramica totale degli eventi, ma un campione
// analizzato: la variazione tra anni misurerebbe più la copertura
// dell'archivio che il fenomeno reale. Si mostrano quindi il numero di casi
// analizzati, la copertura del dettaglio e la quota sul totale nazionale.
export function InformoKpi() {
  const data = useMemo(() => getInformoAnalisi(), []);
  const corrente = serieAnno(data, 2024);

  if (!corrente) return null;
  const totale = corrente.totaleFiltri ?? corrente.casiAnalizzati;

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
            Archivio INAIL · casi mortali · 2024
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
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            analizzati nell&apos;anno, sul totale dell&apos;archivio
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