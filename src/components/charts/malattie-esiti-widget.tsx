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
import { getEsitiMalattieData } from "@/lib/malattie-esiti";
import { exactNumber } from "@/lib/format";

export function MalattieEsitiWidget() {
  const dati = useMemo(() => getEsitiMalattieData(), []);
  const [annoFiltro, setAnnoFiltro] = useState<string>("2025");

  const anno2025 = dati["2025"];
  const istruttoriaPerc = dati.istruttoriaPerc2025;

  // Serie per il grafico stacked: una riga per anno con le tre componenti
  const serie = dati.denuncePerAnno.map((a) => ({
    anno: a.anno,
    riconosciute: a.riconosciute,
    rigettate: a.rigettate,
    inIstruttoria: a.inIstruttoria,
    riconosciutePerc: a.riconosciutePerc,
    rigettatePerc: a.rigettatePerc,
  }));

  // Patologie per l'anno selezionato (ordinate per tasso decrescente dall'ETL)
  const patologieAnno = (dati.patologiePerAnno?.[annoFiltro] ?? dati.perPatologia)
    .slice()
    .sort((a, b) => b.tassoPerc - a.tassoPerc);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* KPI esiti 2025 */}
      {anno2025 && (
        <div className="grid-kpi">
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-link)",
              minWidth: 0,
            }}
          >
            <div className="metric-label">Denunce {anno2025.anno}</div>
            <div className="metric-value" style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>{exactNumber(anno2025.denunce)}</div>
            <div className="metric-sub">protocollate nell&apos;anno</div>
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-success)",
              minWidth: 0,
            }}
          >
            <div className="metric-label">Riconosciute</div>
            <div className="metric-value" style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
              {exactNumber(anno2025.riconosciute)}{" "}
              <span style={{ fontSize: "0.85em", fontWeight: 600, color: "var(--color-text-soft)" }}>
                ({anno2025.riconosciutePerc.toLocaleString("it-IT")}%)
              </span>
            </div>
            <div className="metric-sub">al {dati.dataRilevazione}</div>
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-accent)",
              minWidth: 0,
            }}
          >
            <div className="metric-label">Rigettate</div>
            <div className="metric-value" style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
              {exactNumber(anno2025.rigettate)}{" "}
              <span style={{ fontSize: "0.85em", fontWeight: 600, color: "var(--color-text-soft)" }}>
                ({anno2025.rigettatePerc.toLocaleString("it-IT")}%)
              </span>
            </div>
            <div className="metric-sub">definite negativamente</div>
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-warning)",
              minWidth: 0,
            }}
          >
            <div className="metric-label">In istruttoria</div>
            <div className="metric-value" style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
              {exactNumber(anno2025.inIstruttoria)}{" "}
              <span style={{ fontSize: "0.85em", fontWeight: 600, color: "var(--color-text-soft)" }}>
                ({istruttoriaPerc != null ? istruttoriaPerc.toLocaleString("it-IT") : ""}%)
              </span>
            </div>
            <div className="metric-sub">
              delle denunce {anno2025.anno}, al {dati.dataRilevazione}
            </div>
          </div>
        </div>
      )}

      {/* Serie storica esiti per anno di protocollo */}
      <div style={{ width: "100%", height: 280, minWidth: 0, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={52} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length || !payload[0].payload) return null;
                const p = payload[0].payload as Record<string, number | string>;
                const denunce = Number(p.riconosciute ?? 0) + Number(p.rigettate ?? 0) + Number(p.inIstruttoria ?? 0);
                const def = Number(p.riconosciute ?? 0) + Number(p.rigettate ?? 0);
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {String(p.anno ?? "")}</div>
                    <div className="tooltip-row">
                      <span>Denunce:</span>
                      <strong>{exactNumber(denunce)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Riconosciute:</span>
                      <strong style={{ color: "var(--color-success)" }}>
                        {exactNumber(p.riconosciute)} ({def ? Math.round((Number(p.riconosciute) * 100) / def) : 0}% dei definiti)
                      </strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Rigettate:</span>
                      <strong style={{ color: "var(--color-accent)" }}>
                        {exactNumber(p.rigettate)} ({def ? Math.round((Number(p.rigettate) * 100) / def) : 0}% dei definiti)
                      </strong>
                    </div>
                    <div className="tooltip-row">
                      <span>In istruttoria:</span>
                      <strong style={{ color: "var(--color-warning)" }}>
                        {exactNumber(p.inIstruttoria)} ({denunce ? Math.round((Number(p.inIstruttoria) * 100) / denunce) : 0}% delle denunce)
                      </strong>
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
            <Bar dataKey="riconosciute" name="Riconosciute" stackId="est" fill="var(--color-success)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="rigettate" name="Rigettate" stackId="est" fill="var(--color-accent)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="inIstruttoria" name="In istruttoria" stackId="est" fill="var(--color-warning)" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Riconoscimento per patologia, con filtro per anno */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Riconoscimento per patologia</div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {["2021", "2022", "2023", "2024", "2025"].map((a) => (
              <button
                key={a}
                type="button"
                className={`btn-pill ${annoFiltro === a ? "active" : ""}`}
                onClick={() => setAnnoFiltro(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", marginBottom: "var(--space-2)" }}>
          Patologie ordinate per tasso di riconoscimento decrescente, anno {annoFiltro}, sui casi definiti
          con patologia accertata.
        </div>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {patologieAnno.length === 0 && (
            <div style={{ fontSize: "0.86rem", color: "var(--color-text-soft)" }}>Nessuna patologia con casi definiti sufficienti per questo anno.</div>
          )}
          {patologieAnno.slice(0, 15).map((p) => {
            const def = p.riconosciute + p.rigettate;
            const colore = p.tassoPerc >= 60 ? "var(--color-success)" : p.tassoPerc >= 45 ? "var(--color-warning)" : "var(--color-accent)";
            return (
              <div
                key={`${annoFiltro}-${p.codice}`}
                className="pat-row"
                style={{ padding: "7px 2px", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap" }}
              >
                <span className="pat-codice" style={{ minWidth: 44, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", background: colore, color: "var(--color-raised)", fontWeight: 750, fontSize: "0.62rem", padding: "0 6px", flexShrink: 0 }}>
                  {p.codice.slice(0, 6)}
                </span>
                <span className="pat-main" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className="pat-nome">
                    {p.nome}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
                    {p.riconosciute.toLocaleString("it-IT")} riconosciute / {def.toLocaleString("it-IT")} definite
                  </span>
                </span>
                <span className="pat-valore" style={{ fontWeight: 750, fontVariantNumeric: "tabular-nums", fontSize: "0.86rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {p.tassoPerc.toLocaleString("it-IT")}%
                </span>
                <span className="pat-bar" style={{ display: "block", height: 5, borderRadius: 3, marginTop: 2, background: `linear-gradient(to right, ${colore} ${Math.min(p.tassoPerc, 100)}%, rgba(0,0,0,0.07) ${Math.min(p.tassoPerc, 100)}%)` }} />
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)", marginTop: "var(--space-2)" }}>
          {dati.notaPatologie} Inoltre {dati.nonDeterminati.rigettatiNonD.toLocaleString("it-IT")} pratiche
          rigettate e {dati.nonDeterminati.riconosciutiNonD.toLocaleString("it-IT")} riconosciute (tutti gli anni)
          hanno ICD non determinato (escluse dal tasso per patologia).
        </div>
      </div>

      {/* Nota metodologica */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", fontSize: "0.84rem", color: "var(--color-text-soft)" }}>
        <strong style={{ color: "var(--color-text)" }}>Come leggere questo numero.</strong>{" "}
        I valori sono il conteggio esatto delle pratiche alla rilevazione del {dati.dataRilevazione}
        (dataset open data INAIL, cadenza semestrale), non stime: ogni denuncia ha un esito
        amministrativo (riconosciuta, rigettata, in istruttoria). Il numero è una fotografia: le
        pratiche ancora in istruttoria ({istruttoriaPerc != null ? istruttoriaPerc : ""}% delle denunce
        2025) saranno definite nella rilevazione successiva e il conteggio verrà aggiornato. Il tasso
        di riconoscimento si calcola sui soli casi definiti (riconosciute / definite). Le denunce
        possono essere plurime: più pratiche per lo stesso lavoratore.
      </div>

      <p className="source-note">
        Fonte: INAIL Open Data, DatiSemestraliMalattieProfessionaliDataProt, rilevazione{" "}
        {dati.dataRilevazione}. Elaborazione Osservatorio.
      </p>
    </div>
  );
}