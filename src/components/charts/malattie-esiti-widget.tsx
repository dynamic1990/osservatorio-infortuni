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
import { getEsitiMalattieData } from "@/lib/malattie-esiti";
import { exactNumber } from "@/lib/format";

export function MalattieEsitiWidget() {
  const dati = useMemo(() => getEsitiMalattieData(), []);

  const anni = Object.keys(dati.denunce).sort();
  const serieDenunce = anni.map((a) => ({ anno: a, denunce: dati.denunce[a] }));

  const esiti2025 = dati.esiti2025;
  const definiti = dati.casiDefiniti2021_2025;
  const ultimoAnno = anni[anni.length - 1];
  const lavoratori = dati.denuncePlurime.lavoratori2025;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* KPI esiti */}
      <div className="grid-kpi">
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            borderLeft: "3px solid var(--color-link)",
          }}
        >
          <div className="metric-label">Denunce {ultimoAnno}</div>
          <div className="metric-value">{exactNumber(esiti2025.denunce)}</div>
          <div className="metric-sub">{exactNumber(lavoratori)} lavoratori coinvolti (denunce plurime)</div>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            borderLeft: "3px solid var(--color-success)",
          }}
        >
          <div className="metric-label">Riconosciute positivamente</div>
          <div className="metric-value">~{exactNumber(esiti2025.riconosciute)}</div>
          <div className="metric-sub">alla rilevazione del 30/04/2026</div>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            borderLeft: "3px solid var(--color-warning)",
          }}
        >
          <div className="metric-label">Riconoscimento sui casi definiti</div>
          <div className="metric-value">≈{definiti.riconosciutePerc}%</div>
          <div className="metric-sub">resta in istruttoria ~{dati.istruttoriaUltimoAnnoPerc}% delle pratiche 2025</div>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            borderLeft: "3px solid var(--color-divider)",
          }}
        >
          <div className="metric-label">Definite negativamente</div>
          <div className="metric-value">≈{definiti.nonRiconosciutePerc}%</div>
          <div className="metric-sub">mancata prova del nesso causale o patologia non tabellata</div>
        </div>
      </div>

      {/* Serie storica denunce */}
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serieDenunce} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              formatter={(val, name) => [exactNumber(Number(val ?? 0)), String(name)]}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Bar dataKey="denunce" name="Denunce protocollate" fill="var(--color-link)" radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Riconoscimento per patologia */}
      <div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
          Riconoscimento per patologia (casi definiti 2021-2025)
        </div>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {dati.perPatologia.map((p) => (
            <div
              key={p.patologia}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1px solid var(--color-border)",
                padding: "6px 2px",
                fontSize: "0.86rem",
                gap: "var(--space-3)",
              }}
            >
              <span style={{ fontWeight: 550 }}>{p.patologia}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{p.tasso}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nota sul tasso di riconoscimento */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", fontSize: "0.84rem", color: "var(--color-text-soft)" }}>
        <strong style={{ color: "var(--color-text)" }}>Come leggere questo numero.</strong>{" "}
        {definiti.nota} Il dato non va confuso con una quota di denunce 2025: nell&apos;anno più recente
        circa il {dati.istruttoriaUltimoAnnoPerc}% delle pratiche è ancora aperto alla rilevazione del 30/04/2026,
        e il tasso di riconoscimento si calcola sui casi ormai definiti. {dati.denuncePlurime.nota}
      </div>

      <p className="source-note">
        Fonte: INAIL, Relazione Annuale 2025, <em>Focus statistico sulle malattie professionali</em> (pagg. 65-74 del PDF
        ufficiale, presentato alla Camera il 22/09/2026). Dato curato pubblicato una volta l&apos;anno, non open data
        mensile: le denunce protocollate si contano in tempo reale, l&apos;esito di una pratica richiede tempo (istruttoria,
        eventuali ricorsi) e arriva con la Relazione Annuale dell&apos;anno successivo. Percentuali di riconoscimento per
        patologia espresse dalla fonte in forma testuale (&gt;55%, ≈50%, &lt;50%).
      </p>
    </div>
  );
}