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
  Legend,
} from "recharts";
import { getEsitiMalattieData } from "@/lib/malattie-esiti";
import { exactNumber } from "@/lib/format";

export function MalattieEsitiWidget() {
  const dati = useMemo(() => getEsitiMalattieData(), []);

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
            }}
          >
            <div className="metric-label">Denunce {anno2025.anno}</div>
            <div className="metric-value">{exactNumber(anno2025.denunce)}</div>
            <div className="metric-sub">protocollate nell&apos;anno</div>
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-success)",
            }}
          >
            <div className="metric-label">Riconosciute</div>
            <div className="metric-value">{exactNumber(anno2025.riconosciute)}</div>
            <div className="metric-sub">al {dati.dataRilevazione}</div>
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-accent)",
            }}
          >
            <div className="metric-label">Rigettate</div>
            <div className="metric-value">{exactNumber(anno2025.rigettate)}</div>
            <div className="metric-sub">definite negativamente</div>
          </div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--color-warning)",
            }}
          >
            <div className="metric-label">In istruttoria</div>
            <div className="metric-value">{exactNumber(anno2025.inIstruttoria)}</div>
            <div className="metric-sub">
              {istruttoriaPerc != null ? `il ${istruttoriaPerc.toLocaleString("it-IT")}% delle denunce ${anno2025.anno}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* Serie storica esiti per anno di protocollo */}
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={52} />
            <Tooltip
              formatter={(val, name) => [exactNumber(Number(val ?? 0)), String(name)]}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
            <Bar dataKey="riconosciute" name="Riconosciute" stackId="est" fill="var(--color-success)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="rigettate" name="Rigettate" stackId="est" fill="var(--color-accent)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="inIstruttoria" name="In istruttoria" stackId="est" fill="var(--color-warning)" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tasso di riconoscimento per anno */}
      <div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
          Riconoscimento sui casi definiti, per anno di denuncia
        </div>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {serie
            .slice()
            .reverse()
            .map((a) => (
              <div
                key={a.anno}
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
                <span style={{ fontWeight: 550 }}>Denunce {a.anno}</span>
                <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {a.riconosciutePerc.toLocaleString("it-IT")}% riconosciute
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Riconoscimento per patologia specifica (casi definiti) */}
      {dati.perPatologia.length > 0 && (
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
            Riconoscimento per patologia (casi definiti)
          </div>
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {dati.perPatologia.slice(0, 12).map((p) => (
              <div key={p.codice} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 90px", gap: "var(--space-2)", alignItems: "center", fontSize: "0.84rem", borderBottom: "1px solid var(--color-border)", padding: "5px 2px" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {p.nome} <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({p.codice})</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: `${Math.min(p.tassoPerc, 100)}%`, maxWidth: 100, height: 8, background: p.tassoPerc >= 55 ? "var(--color-success)" : p.tassoPerc >= 45 ? "var(--color-warning)" : "var(--color-accent)", borderRadius: 4, display: "inline-block" }} />
                  <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{p.tassoPerc.toLocaleString("it-IT")}%</span>
                </span>
                <span style={{ textAlign: "right", color: "var(--color-text-soft)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {p.riconosciute.toLocaleString("it-IT")} / {(p.riconosciute + p.rigettate).toLocaleString("it-IT")}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)", marginTop: "var(--space-2)" }}>
            {dati.notaPatologie} Inoltre {dati.nonDeterminati.rigettatiNonD.toLocaleString("it-IT")} pratiche
            rigettate e {dati.nonDeterminati.riconosciutiNonD.toLocaleString("it-IT")} riconosciute hanno ICD non determinato
            (escluse dal tasso per patologia).
          </div>
        </div>
      )}

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
        {dati.dataRilevazione}. Elaborazione Osservatorio: {exactNumber(serie.reduce((s, a) => s + a.riconosciute, 0))}{" "}
        pratiche riconosciute, {exactNumber(serie.reduce((s, a) => s + a.rigettate, 0))} rigettate e{" "}
        {exactNumber(serie.reduce((s, a) => s + a.inIstruttoria, 0))} in istruttoria nella serie 2021-2025.
      </p>
    </div>
  );
}