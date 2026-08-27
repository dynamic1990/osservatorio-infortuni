"use client";

import { useMemo, useState } from "react";
import italy from "@svg-maps/italy";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getMultidimensionaleData, RegioneAnnualData } from "@/lib/multidimensionale";
import { regioneName } from "@/lib/labels";
import { MAP_ID_REGIONE } from "@/lib/regioni-map";
import { compactNumber, exactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";

// Scala cromatica per l'indice di incidenza (dal verde chiaro al rosso scuro)
const INCIDENZA_SCALE = [
  "#f7fbff", // molto basso
  "#deebf7",
  "#c6dbef",
  "#9ecae1",
  "#6baed6",
  "#4292c6",
  "#2171b5",
  "#08519c",
  "#08306b",
];

// Scala allerta rischio (giallo -> arancio -> rosso intenso)
const RISK_COLOR_SCALE = [
  "#fef0d9",
  "#fdd49e",
  "#fdbb84",
  "#fc8d59",
  "#e34a33",
  "#b30000",
  "#7f0000",
];

export function RegioniIncidenzaSection() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");
  const [metrica, setMetrica] = useState<"incidenza" | "mortaliInc" | "totale">("incidenza");
  const [selectedReg, setSelectedReg] = useState<string | null>(null);
  const [hoverMapId, setHoverMapId] = useState<string | null>(null);

  // Dati dell'anno selezionato
  const annoData = useMemo(() => {
    return multidim.perAnno[anno] || multidim.consolidatoTotale;
  }, [multidim, anno]);

  // Mappa codice regione -> dati regione
  const regMap = useMemo(() => {
    const map: Record<string, RegioneAnnualData> = {};
    for (const r of annoData.regioni) {
      map[r.regione] = r;
    }
    return map;
  }, [annoData]);

  // Calcolo valori min/max per la scala cromatica
  const { minVal, maxVal, mediaNazionale } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const r of annoData.regioni) {
      const val = metrica === "incidenza" ? r.indiceIncidenza : metrica === "mortaliInc" ? r.indiceMortali : r.totale;
      if (val < min) min = val;
      if (val > max) max = val;
    }
    const media =
      metrica === "incidenza"
        ? annoData.indiceIncidenza
        : metrica === "mortaliInc"
        ? annoData.indiceMortali
        : annoData.totale / 20;
    return { minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 1 : max, mediaNazionale: media };
  }, [annoData, metrica]);

  // Colore per regione sulla mappa
  const colorForRegion = (code?: string): string => {
    if (!code || !regMap[code]) return "#e2e0de";
    const val =
      metrica === "incidenza"
        ? regMap[code].indiceIncidenza
        : metrica === "mortaliInc"
        ? regMap[code].indiceMortali
        : regMap[code].totale;

    const range = maxVal - minVal || 1;
    const ratio = Math.max(0, Math.min(1, (val - minVal) / range));
    const idx = Math.min(RISK_COLOR_SCALE.length - 1, Math.floor(ratio * RISK_COLOR_SCALE.length));
    return RISK_COLOR_SCALE[idx];
  };

  // Dati ordinati per il barchart
  const sortedChartData = useMemo(() => {
    return [...annoData.regioni]
      .sort((a, b) => {
        const valA = metrica === "incidenza" ? a.indiceIncidenza : metrica === "mortaliInc" ? a.indiceMortali : a.totale;
        const valB = metrica === "incidenza" ? b.indiceIncidenza : metrica === "mortaliInc" ? b.indiceMortali : b.totale;
        return valB - valA;
      })
      .map((r, i) => {
        const val = metrica === "incidenza" ? r.indiceIncidenza : metrica === "mortaliInc" ? r.indiceMortali : r.totale;
        return {
          code: r.regione,
          name: regioneName(r.regione),
          valore: val,
          totale: r.totale,
          mortali: r.mortali,
          lavoro: r.lavoro,
          itinere: r.itinere,
          occupati: r.occupati,
          indiceIncidenza: r.indiceIncidenza,
          indiceMortali: r.indiceMortali,
          color: PALETTE[i % PALETTE.length],
        };
      });
  }, [annoData, metrica]);

  const hoverCode = hoverMapId ? MAP_ID_REGIONE[hoverMapId] : undefined;
  const activeRegData = selectedReg ? regMap[selectedReg] : hoverCode ? regMap[hoverCode] : null;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli Filtro: Anno e Metrica */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: "var(--space-3)",
        }}
      >
        {/* Selettore Anno */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Anno:</span>
          {multidim.anniDisponibili.map((a) => (
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Selettore Metrica Visualizzata */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Mappa colorata per:</span>
          <button
            onClick={() => setMetrica("incidenza")}
            className={`btn-pill ${metrica === "incidenza" ? "btn-pill-accent active" : ""}`}
          >
            Incidenza ‰ (Rischio)
          </button>
          <button
            onClick={() => setMetrica("mortaliInc")}
            className={`btn-pill ${metrica === "mortaliInc" ? "btn-pill-accent active" : ""}`}
          >
            Tasso Mortali ‰
          </button>
          <button
            onClick={() => setMetrica("totale")}
            className={`btn-pill ${metrica === "totale" ? "btn-pill-accent active" : ""}`}
          >
            Volume Casi Assoluti
          </button>
        </div>
      </div>

      {/* Griglia a 2 colonne: Mappa SVG interattiva a sinistra, Ranking e Scheda Regione a destra */}
      <div className="grid-map-panel">
        {/* Colonna Mappa */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-divider)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              {metrica === "incidenza"
                ? "Tasso di Incidenza Regionale (infortuni / 1.000 occupati)"
                : metrica === "mortaliInc"
                ? "Tasso Mortali per 1.000 occupati"
                : "Volume totale infortuni denunciati"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
              Media Naz.: <strong>{metrica === "incidenza" ? `${mediaNazionale}‰` : metrica === "mortaliInc" ? `${mediaNazionale}‰` : compactNumber(annoData.totale)}</strong>
            </div>
          </div>

          <svg
            viewBox={italy.viewBox}
            role="img"
            aria-label="Mappa regionale italiana del rischio infortunistico"
            style={{ width: "100%", maxWidth: 440, height: "auto", maxHeight: 460 }}
          >
            {italy.locations.map((loc: { id: string; name: string; path: string }, i: number) => {
              const code = MAP_ID_REGIONE[loc.id];
              const isSelected = selectedReg === code;
              const isHovered = hoverMapId === loc.id;
              return (
                <path
                  key={loc.id + i}
                  d={loc.path}
                  onClick={() => code && setSelectedReg(isSelected ? null : code)}
                  onMouseEnter={() => setHoverMapId(loc.id)}
                  onMouseLeave={() => setHoverMapId(null)}
                  fill={colorForRegion(code)}
                  stroke={isSelected || isHovered ? "var(--color-text)" : "#ffffff"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 0.7}
                  style={{
                    cursor: code ? "pointer" : "default",
                    transition: "fill 0.2s ease, stroke 0.15s ease",
                    opacity: isHovered || isSelected ? 1 : 0.92,
                  }}
                />
              );
            })}
          </svg>

          {/* Scala Legenda Colori */}
          <div style={{ width: "100%", marginTop: "var(--space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--color-text-soft)", marginBottom: 3 }}>
              <span>Min: {minVal}{metrica !== "totale" ? "‰" : ""}</span>
              <span>Rischio crescente</span>
              <span>Max: {maxVal}{metrica !== "totale" ? "‰" : ""}</span>
            </div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
              {RISK_COLOR_SCALE.map((c, i) => (
                <div key={i} style={{ flex: 1, background: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Colonna Ranking e Scheda di dettaglio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Scheda di approfondimento regione attiva */}
          {activeRegData ? (
            <div
              style={{
                background: "var(--color-raised)",
                border: "1.5px solid var(--color-accent)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  {regioneName(activeRegData.regione)} ({anno})
                </span>
                {selectedReg && (
                  <button
                    onClick={() => setSelectedReg(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--color-text-soft)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      textDecoration: "underline",
                    }}
                  >
                    Chiudi dettaglio
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-2)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Tasso Incidenza</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 750, color: "var(--color-accent)" }}>
                    {activeRegData.indiceIncidenza}‰
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {activeRegData.indiceIncidenza > annoData.indiceIncidenza
                      ? `+${(activeRegData.indiceIncidenza - annoData.indiceIncidenza).toFixed(2)} vs media`
                      : `${(activeRegData.indiceIncidenza - annoData.indiceIncidenza).toFixed(2)} vs media`}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Infortuni Totali</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 750 }}>
                    {exactNumber(activeRegData.totale)}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {exactNumber(activeRegData.lavoro)} lav · {exactNumber(activeRegData.itinere)} iti
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Mortali / Gravi</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 750 }}>
                    {exactNumber(activeRegData.mortali)}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {exactNumber(activeRegData.menomati)} con menomazione
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.76rem", color: "var(--color-text-soft)", marginTop: "var(--space-2)", borderTop: "1px dashed var(--color-divider)", paddingTop: 4 }}>
                Occupati regionali di riferimento: <strong>{exactNumber(activeRegData.occupati)}</strong> (fonte ISTAT/Eurostat).
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--color-surface)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3)",
                fontSize: "0.85rem",
                color: "var(--color-text-soft)",
                textAlign: "center",
              }}
            >
              Passa il mouse sulla mappa o seleziona una regione per analizzare i dettagli HSE.
            </div>
          )}

          {/* Ranking orizzontale scrollabile */}
          <div style={{ flex: 1, minHeight: 320 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
              Ranking 20 Regioni ({metrica === "incidenza" ? "Incidenza ‰ occupati" : metrica === "mortaliInc" ? "Tasso mortali ‰" : "Volume casi"})
            </div>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 10 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      const code = state.activePayload[0].payload.code;
                      setSelectedReg(selectedReg === code ? null : code);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="custom-chart-tooltip">
                          <div className="tooltip-title">{p.name} ({anno})</div>
                          <div className="tooltip-row">
                            <span>Tasso di Incidenza:</span>
                            <strong>{p.indiceIncidenza} per 1.000 occ.</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Casi totali denunciati:</span>
                            <strong>{exactNumber(p.totale)}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>In occasione di lavoro:</span>
                            <strong>{exactNumber(p.lavoro)}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>In itinere:</span>
                            <strong>{exactNumber(p.itinere)}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Esiti mortali:</span>
                            <strong>{exactNumber(p.mortali)}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Occupati di riferimento:</span>
                            <strong>{exactNumber(p.occupati)}</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    x={mediaNazionale}
                    stroke="#1d1b1a"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Media Naz. ${mediaNazionale}${metrica !== "totale" ? "‰" : ""}`,
                      position: "insideTopRight",
                      fill: "#1d1b1a",
                      fontSize: 10,
                    }}
                  />
                  <Bar dataKey="valore" name="Valore" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                    {sortedChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={selectedReg === entry.code ? "var(--color-accent)" : colorForRegion(entry.code)}
                        stroke={selectedReg === entry.code ? "#000000" : "none"}
                        strokeWidth={selectedReg === entry.code ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <p className="source-note">
        Metodologia di normalizzazione: l&apos;indice di incidenza regionale misura il numero di infortuni per 1.000 occupati nella fascia 15-64 anni residenti nella regione (dati ISTAT ed Eurostat lfst_r_lfe2emp). Consente di valutare oggettivamente il rischio territoriale eliminando l&apos;effetto distorcente della diversa concentrazione demografica e produttiva.
      </p>
    </div>
  );
}