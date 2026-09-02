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
import { getMultidimensionaleData, RegioneAnnualData, ProvinciaAutonomaData } from "@/lib/multidimensionale";
import { regioneName } from "@/lib/labels";
import { getTemporale } from "@/lib/temporale";
import { MAP_ID_REGIONE } from "@/lib/regioni-map";
import { compactNumber, exactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";
import { FiltroModalita, type ModalitaState } from "@/components/charts/filtro-modalita";

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
  const [metrica, setMetrica] = useState<"incidenza" | "mortaliInc" | "gravita" | "totale">("incidenza");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });
  const [selectedReg, setSelectedReg] = useState<string | null>(null);
  const [hoverMapId, setHoverMapId] = useState<string | null>(null);
  const [mostraProvincePA, setMostraProvincePA] = useState<boolean>(true);
  const temporale = useMemo(() => getTemporale(), []);

  const ambito: "totale" | "lavoro" | "itinere" =
    modalita.lavoro && modalita.itinere ? "totale" : modalita.lavoro ? "lavoro" : "itinere";

  // Casi in base all'ambito selezionato
  const casiAmbito = (r: { totale: number; lavoro: number; itinere: number }) =>
    ambito === "lavoro" ? r.lavoro : ambito === "itinere" ? r.itinere : r.totale;

  // Incidenza per 1.000 occupati ricalcolata sull'ambito
  const incidenzaAmbito = (r: { occupati: number; totale: number; lavoro: number; itinere: number }) =>
    r.occupati > 0 ? Number(((casiAmbito(r) / r.occupati) * 1000).toFixed(2)) : 0;

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
      const val =
        metrica === "incidenza"
          ? incidenzaAmbito(r)
          : metrica === "mortaliInc"
          ? r.indiceMortali
          : metrica === "gravita"
          ? (r.indiceGravita ?? 0)
          : casiAmbito(r);
      if (val < min) min = val;
      if (val > max) max = val;
    }
    const media =
      metrica === "incidenza"
        ? incidenzaAmbito(annoData)
        : metrica === "mortaliInc"
        ? annoData.indiceMortali
        : metrica === "gravita"
        ? (annoData.indiceGravita ?? 0)
        : Math.round(casiAmbito(annoData) / 20);
    return { minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 1 : max, mediaNazionale: media };
  }, [annoData, metrica, ambito]);

  // Colore per regione sulla mappa
  const colorForRegion = (code?: string): string => {
    if (!code || !regMap[code]) return "#e2e0de";
    const val =
      metrica === "incidenza"
        ? incidenzaAmbito(regMap[code])
        : metrica === "mortaliInc"
        ? regMap[code].indiceMortali
        : metrica === "gravita"
        ? (regMap[code].indiceGravita ?? 0)
        : casiAmbito(regMap[code]);

    const range = maxVal - minVal || 1;
    const ratio = Math.max(0, Math.min(1, (val - minVal) / range));
    const idx = Math.min(RISK_COLOR_SCALE.length - 1, Math.floor(ratio * RISK_COLOR_SCALE.length));
    return RISK_COLOR_SCALE[idx];
  };

  // Dati ordinati per il barchart con eventuale dettaglio Province Autonome Bolzano/Trento
  const sortedChartData = useMemo(() => {
    let items: Array<{
      code: string;
      name: string;
      isProvincia?: boolean;
      valore: number;
      totale: number;
      mortali: number;
      lavoro: number;
      itinere: number;
      giorni: number;
      durataMedia?: number;
      indiceGravita?: number;
      occupati: number;
      indiceIncidenza: number;
      indiceMortali: number;
      color?: string;
    }> = [];

    for (const r of annoData.regioni) {
      if (r.regione === "04" && mostraProvincePA && annoData.provinceAutonome) {
        // Mostra le 2 province autonome separate
        for (const pa of annoData.provinceAutonome) {
          const val =
            metrica === "incidenza"
              ? incidenzaAmbito(pa)
              : metrica === "mortaliInc"
              ? pa.indiceMortali
              : metrica === "gravita"
              ? (pa.indiceGravita ?? 0)
              : casiAmbito(pa);
          items.push({
            code: pa.codice,
            name: pa.nome,
            isProvincia: true,
            valore: val,
            totale: pa.totale,
            mortali: pa.mortali,
            lavoro: pa.lavoro,
            itinere: pa.itinere,
            giorni: pa.giorni,
            durataMedia: pa.durataMedia,
            indiceGravita: pa.indiceGravita,
            occupati: pa.occupati,
            indiceIncidenza: pa.indiceIncidenza,
            indiceMortali: pa.indiceMortali,
          });
        }
      } else {
        const val =
          metrica === "incidenza"
            ? incidenzaAmbito(r)
            : metrica === "mortaliInc"
            ? r.indiceMortali
            : metrica === "gravita"
            ? (r.indiceGravita ?? 0)
            : casiAmbito(r);
        items.push({
          code: r.regione,
          name: regioneName(r.regione),
          valore: val,
          totale: r.totale,
          mortali: r.mortali,
          lavoro: r.lavoro,
          itinere: r.itinere,
          giorni: r.giorni,
          durataMedia: r.durataMedia,
          indiceGravita: r.indiceGravita,
          occupati: r.occupati,
          indiceIncidenza: r.indiceIncidenza,
          indiceMortali: r.indiceMortali,
        });
      }
    }

    return items
      .sort((a, b) => b.valore - a.valore)
      .map((entry, i) => ({
        ...entry,
        color: PALETTE[i % PALETTE.length],
      }));
  }, [annoData, metrica, mostraProvincePA]);

  const hoverCode = hoverMapId ? MAP_ID_REGIONE[hoverMapId] : undefined;
  const activeRegData = selectedReg ? regMap[selectedReg] : hoverCode ? regMap[hoverCode] : null;

  // Dettagli Bolzano e Trento se selezionato Trentino
  const provDetails = useMemo(() => {
    if (!annoData.provinceAutonome) return null;
    return {
      bolzano: annoData.provinceAutonome.find((p) => p.codice === "021"),
      trento: annoData.provinceAutonome.find((p) => p.codice === "022"),
    };
  }, [annoData]);

  // Serie storica annuale 2020-2024 della regione attiva (per l'andamento nella scheda dettaglio)
  const serieRegione = useMemo(() => {
    if (!activeRegData) return [];
    const reg = activeRegData.regione;
    return temporale.serieAnnuale
      .filter((r) => r.regione === reg)
      .sort((a, b) => a.anno - b.anno);
  }, [temporale, activeRegData]);

  // Riga della serie dell'anno selezionato (per dettagli mortali per modalità)
  const rigaSerieAnno = useMemo(() => {
    if (!serieRegione.length) return null;
    return serieRegione.find((r) => r.anno === Number(anno)) || serieRegione[serieRegione.length - 1];
  }, [serieRegione, anno]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli Filtro: Anno, Metrica e Toggle Province */}
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

        {/* Filtro multiselezione modalità */}
        <FiltroModalita value={modalita} onChange={setModalita} />

        {/* Selettore Metrica Visualizzata */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Visualizza per:</span>
          <button
            onClick={() => setMetrica("incidenza")}
            className={`btn-pill ${metrica === "incidenza" ? "btn-pill-accent active" : ""}`}
          >
            Incidenza (infortuni / 1.000 occ.)
          </button>
          <button
            onClick={() => setMetrica("gravita")}
            className={`btn-pill ${metrica === "gravita" ? "btn-pill-accent active" : ""}`}
          >
            Indice Gravità (gg / 1.000 occ.)
          </button>
          <button
            onClick={() => setMetrica("mortaliInc")}
            className={`btn-pill ${metrica === "mortaliInc" ? "btn-pill-accent active" : ""}`}
          >
            Tasso Mortali
          </button>
          <button
            onClick={() => setMetrica("totale")}
            className={`btn-pill ${metrica === "totale" ? "btn-pill-accent active" : ""}`}
          >
            Volume Casi
          </button>
        </div>
      </div>

      {/* Griglia a 2 colonne: Mappa a sinistra, Ranking a destra */}
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
                ? "Tasso di Incidenza (infortuni / 1.000 occupati)"
                : metrica === "gravita"
                ? "Indice di Gravità (giornate perse / 1.000 occupati)"
                : metrica === "mortaliInc"
                ? "Tasso Infortuni Mortali (per 1.000 occupati)"
                : ambito === "lavoro"
                ? "Volume infortuni in occasione di lavoro"
                : ambito === "itinere"
                ? "Volume infortuni in itinere"
                : "Volume totale infortuni denunciati"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text)", background: "var(--color-raised)", padding: "2px 8px", borderRadius: "4px", border: "1px solid var(--color-divider)" }}>
              Media Nazionale: <strong>{metrica === "incidenza" ? `${mediaNazionale}‰` : metrica === "gravita" ? `${mediaNazionale} gg` : metrica === "mortaliInc" ? `${mediaNazionale}‰` : compactNumber(casiAmbito(annoData))}</strong>
            </div>
          </div>

          <svg
            viewBox={italy.viewBox}
            role="img"
            aria-label="Mappa regionale del rischio infortunistico"
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
              <span>Min: {minVal}{metrica === "incidenza" || metrica === "mortaliInc" ? "‰" : metrica === "gravita" ? " gg" : ""}</span>
              <span>Intensità crescente</span>
              <span>Max: {maxVal}{metrica === "incidenza" || metrica === "mortaliInc" ? "‰" : metrica === "gravita" ? " gg" : ""}</span>
            </div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
              {RISK_COLOR_SCALE.map((c, i) => (
                <div key={i} style={{ flex: 1, background: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Colonna Ranking e Scheda Regione */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Scheda di dettaglio regione attiva */}
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
                <span style={{ fontSize: "1.05rem", fontWeight: 750 }}>
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
                  <div style={{ fontSize: "1.25rem", fontWeight: 750, color: "var(--color-accent)" }}>
                    {activeRegData.indiceIncidenza}‰
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {activeRegData.indiceIncidenza > annoData.indiceIncidenza
                      ? `+${(activeRegData.indiceIncidenza - annoData.indiceIncidenza).toFixed(2)} vs media naz.`
                      : `${(activeRegData.indiceIncidenza - annoData.indiceIncidenza).toFixed(2)} vs media naz.`}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Infortuni Totali</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 750 }}>
                    {exactNumber(activeRegData.totale)}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {exactNumber(activeRegData.lavoro)} lav &middot; {exactNumber(activeRegData.itinere)} iti
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Giornate Perse</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 750 }}>
                    {compactNumber(activeRegData.giorni)}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    Media: {activeRegData.durataMedia || 0} gg / caso
                  </div>
                </div>
              </div>

              {/* Riga esiti: mortali e danno permanente (dettaglio per modalità se il filtro lo consente) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-2)",
                  paddingTop: "var(--space-2)",
                  borderTop: "1px dashed var(--color-divider)",
                  fontSize: "0.8rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Esiti Mortali</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 750, color: "var(--color-accent)" }}>
                    {exactNumber(ambito === "lavoro" ? (rigaSerieAnno?.mortaliLavoro ?? activeRegData.mortali) : ambito === "itinere" ? (rigaSerieAnno?.mortaliItinere ?? activeRegData.mortali) : activeRegData.mortali)}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {ambito === "totale" && rigaSerieAnno
                      ? `${exactNumber(rigaSerieAnno.mortaliLavoro)} lav · ${exactNumber(rigaSerieAnno.mortaliItinere)} iti`
                      : ambito === "lavoro" && rigaSerieAnno
                      ? `${exactNumber(rigaSerieAnno.mortaliLavoro)} in occasione di lavoro`
                      : ambito === "itinere" && rigaSerieAnno
                      ? `${exactNumber(rigaSerieAnno.mortaliItinere)} in itinere`
                      : "anno di riferimento"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>Danno Permanente</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 750 }}>
                    {exactNumber(activeRegData.menomati)}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    casi con menomazione ≥ 6%{ambito !== "totale" ? " (totale)" : ""}
                  </div>
                </div>
              </div>

              {/* Andamento annuale 2020-2024 della regione */}
              {serieRegione.length > 0 && (
                <div style={{ marginTop: "var(--space-2)", paddingTop: "var(--space-2)", borderTop: "1px dashed var(--color-divider)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)", textTransform: "uppercase", marginBottom: 4 }}>
                    Andamento denunce {serieRegione[0].anno} – {serieRegione[serieRegione.length - 1].anno}
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    {serieRegione.map((r) => (
                      <div
                        key={r.anno}
                        style={{
                          background: r.anno === Number(anno) ? "var(--color-accent)" : "var(--color-surface)",
                          color: r.anno === Number(anno) ? "#fff" : "inherit",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: "0.78rem",
                          textAlign: "center",
                          minWidth: 58,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{r.anno}</div>
                        <div>{compactNumber(r.totale)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dettaglio Province Autonome se è Trentino-Alto Adige */}
              {activeRegData.regione === "04" && provDetails && provDetails.bolzano && provDetails.trento && (
                <div style={{ marginTop: "var(--space-2)", paddingTop: "var(--space-2)", borderTop: "1px dashed var(--color-divider)" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-text-soft)", marginBottom: 4 }}>
                    Dettaglio per Provincia Autonoma ({anno}):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", fontSize: "0.78rem" }}>
                    <div style={{ background: "var(--color-surface)", padding: "4px 8px", borderRadius: "4px" }}>
                      <strong>P.A. Bolzano / Bozen:</strong><br />
                      Incidenza: <strong>{provDetails.bolzano.indiceIncidenza}‰</strong> ({exactNumber(provDetails.bolzano.totale)} casi su {compactNumber(provDetails.bolzano.occupati)} occ.)<br />
                      Giornate perse: {compactNumber(provDetails.bolzano.giorni)} (media {provDetails.bolzano.durataMedia} gg)
                    </div>
                    <div style={{ background: "var(--color-surface)", padding: "4px 8px", borderRadius: "4px" }}>
                      <strong>P.A. Trento:</strong><br />
                      Incidenza: <strong>{provDetails.trento.indiceIncidenza}‰</strong> ({exactNumber(provDetails.trento.totale)} casi su {compactNumber(provDetails.trento.occupati)} occ.)<br />
                      Giornate perse: {compactNumber(provDetails.trento.giorni)} (media {provDetails.trento.durataMedia} gg)
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: "0.75rem", color: "var(--color-text-soft)", marginTop: "var(--space-2)", borderTop: "1px dashed var(--color-divider)", paddingTop: 4 }}>
                Lavoratori occupati di riferimento: <strong>{exactNumber(activeRegData.occupati)}</strong> (fonte ISTAT / Eurostat).
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
              Passa il mouse sulla mappa o seleziona una regione per analizzare i dettagli territoriali e di gravità.
            </div>
          )}

          {/* Ranking scrollabile con slider e controlli */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>
                Ranking Territoriale ({metrica === "incidenza" ? "Incidenza ‰ occupati" : metrica === "gravita" ? "Indice Gravità (gg / 1.000 occ.)" : metrica === "mortaliInc" ? "Tasso mortali ‰" : "Volume casi"})
              </div>
              <label style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "var(--color-text-soft)" }}>
                <input
                  type="checkbox"
                  checked={mostraProvincePA}
                  onChange={(e) => setMostraProvincePA(e.target.checked)}
                />
                Dettaglia Bolzano e Trento
              </label>
            </div>

            {/* Scroll Viewport con altezza fissa per garantire leggibilità asse Y */}
            <div className="chart-scroll-wrapper" style={{ height: 360 }}>
              <div style={{ width: "100%", height: sortedChartData.length * 25 + 40 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedChartData}
                    layout="vertical"
                    margin={{ top: 8, right: 24, bottom: 4, left: 20 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length) {
                        const code = state.activePayload[0].payload.code;
                        if (code === "021" || code === "022") {
                          setSelectedReg("04");
                        } else {
                          setSelectedReg(selectedReg === code ? null : code);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={140}
                      interval={0}
                    />
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
                              <span>Indice di Gravità:</span>
                              <strong>{p.indiceGravita || 0} gg per 1.000 occ.</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Giornate di inabilità:</span>
                              <strong>{compactNumber(p.giorni)} gg (media {p.durataMedia || 0} gg/caso)</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Casi totali denunciati:</span>
                              <strong>{exactNumber(p.totale)}</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Infortuni mortali:</span>
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
                      stroke="#b3261e"
                      strokeDasharray="4 4"
                      strokeWidth={1.8}
                    />
                    <Bar dataKey="valore" name="Valore" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                      {sortedChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={selectedReg === entry.code ? "var(--color-accent)" : colorForRegion(entry.code === "021" || entry.code === "022" ? "04" : entry.code)}
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
      </div>

      <p className="source-note">
        Metodologia di calcolo: <strong>Tasso di Incidenza</strong> = (Infortuni / Occupati residenti) &times; 1.000. <strong>Indice di Gravità</strong> = (Giornate di inabilità temporanea indennizzate / Occupati residenti) &times; 1.000. Denominatori occupazionali: ISTAT ed Eurostat NUTS2 (<code>lfst_r_lfe2emp</code>). La linea tratteggiata rossa indica il benchmark della media nazionale ponderata.
      </p>
    </div>
  );
}
