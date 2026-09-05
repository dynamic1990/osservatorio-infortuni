"use client";

import { useMemo, useState } from "react";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { exactNumber, compactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";
import { FiltroModalita, ModalitaState } from "./filtro-modalita";

// Macro-aree ISTAT (ripartizioni geografiche ufficiali).
// Codici regione come da dataset multidimensionale INAIL.
const MACRO_AREAS: Record<string, string[]> = {
  "Nord-Ovest": ["01", "02", "03", "07"],
  "Nord-Est": ["04", "05", "06", "08"],
  Centro: ["09", "10", "11", "12"],
  "Sud e Isole": ["13", "14", "15", "16", "17", "18", "19", "20"],
};

// Colori delle aree: dalla palette categoriale (escluso l'accento, riservato ai delta).
// Mappa colore -> area dichiarata UNA volta qui (RULES.md Regola 4).
const AREA_COLORS: Record<string, string> = {
  "Nord-Ovest": PALETTE[1], // link blue
  "Nord-Est": PALETTE[3], // verde success
  Centro: PALETTE[6], // blu ardesia
  "Sud e Isole": PALETTE[7], // teal
};

interface AreaAggregato {
  area: string;
  casi: number;
  mortali: number;
  occupati: number;
  indice: number;
  delta?: number;
  deltaPerc?: number;
}

export function MacroAreaWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });

  const ambito: "totale" | "lavoro" | "itinere" =
    modalita.lavoro && modalita.itinere ? "totale" : modalita.lavoro ? "lavoro" : "itinere";

  const agg = (annoKey: string): AreaAggregato[] | null => {
    const data = multidim.perAnno[annoKey];
    if (!data) return null;
    return Object.keys(MACRO_AREAS).map((area) => {
      const regs = data.regioni.filter((r) => MACRO_AREAS[area].includes(r.regione));
      const casi = regs.reduce(
        (acc, r) => acc + (ambito === "lavoro" ? r.lavoro : ambito === "itinere" ? r.itinere : r.totale),
        0
      );
      const mortali = regs.reduce((acc, r) => acc + r.mortali, 0);
      const occupati = regs.reduce((acc, r) => acc + (r.occupati || 0), 0);
      return {
        area,
        casi,
        mortali,
        occupati,
        indice: occupati > 0 ? Number(((casi / occupati) * 1000).toFixed(2)) : 0,
      };
    });
  };

  const cur = useMemo(() => agg(anno), [anno, ambito]);
  const prev = useMemo(() => {
    const prevYear = String(Number(anno) - 1);
    return multidim.perAnno[prevYear] ? agg(prevYear) : null;
  }, [anno, ambito]);

  const rows = useMemo<AreaAggregato[]>(() => {
    if (!cur) return [];
    return cur.map((c) => {
      const p = prev?.find((x) => x.area === c.area);
      return {
        ...c,
        delta: p ? Number((c.indice - p.indice).toFixed(2)) : undefined,
        deltaPerc: p && p.indice > 0 ? Number((((c.indice - p.indice) / p.indice) * 100).toFixed(1)) : undefined,
      };
    });
  }, [cur, prev]);

  const maxIndice = Math.max(...rows.map((r) => r.indice), 0.0001);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli Anno e Modalità */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {multidim.anniDisponibili.map((a) => (
            <button key={a} onClick={() => setAnno(a)} className={`btn-pill ${anno === a ? "active" : ""}`}>
              {a}
            </button>
          ))}
        </div>
        <FiltroModalita value={modalita} onChange={setModalita} size="sm" />
      </div>

      {/* Card macro-aree */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {rows.map((r) => {
          const peggiora = (r.delta ?? 0) > 0;
          return (
            <div
              key={r.area}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-divider)",
                borderTop: `4px solid ${AREA_COLORS[r.area]}`,
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3)",
                display: "grid",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ fontSize: "0.88rem", fontWeight: 750 }}>{r.area}</div>
              <div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                  {r.indice.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-soft)" }}>‰</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--color-text-soft)" }}>incidenza per 1.000 occupati</div>
              </div>
              {r.delta !== undefined && r.deltaPerc !== undefined ? (
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: peggiora ? "var(--color-accent)" : "var(--color-success)",
                  }}
                >
                  {peggiora ? "▲" : "▼"} {r.delta > 0 ? "+" : ""}
                  {r.delta.toLocaleString("it-IT", { maximumFractionDigits: 2 })}‰ vs {Number(anno) - 1} ({r.deltaPerc > 0 ? "+" : ""}
                  {r.deltaPerc.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%)
                </div>
              ) : (
                <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>Serie disponibile dal 2020</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "var(--color-text-soft)", borderTop: "1px dashed var(--color-divider)", paddingTop: "var(--space-2)" }}>
                <span>
                  <strong style={{ color: "var(--color-text)" }}>{exactNumber(r.casi)}</strong> casi
                </span>
                <span>
                  <strong style={{ color: "var(--color-text)" }}>{exactNumber(r.mortali)}</strong> mortali
                </span>
                <span>
                  <strong style={{ color: "var(--color-text)" }}>{compactNumber(r.occupati)}</strong> occ.
                </span>
              </div>
              {/* Barra relativa all'area con incidenza massima */}
              <div style={{ height: 6, background: "var(--color-divider)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.max(4, (r.indice / maxIndice) * 100)}%`,
                    height: "100%",
                    background: AREA_COLORS[r.area],
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="source-note">
        Macro-aree secondo la ripartizione geografica ISTAT. <strong>Tasso di incidenza</strong> = (Infortuni / Occupati residenti) &times; 1.000, con denominatore ISTAT/Eurostat (<code>lfst_r_lfe2emp</code>). Il delta confronta l&apos;anno selezionato con il precedente: aumento in rosso, calo in verde. La disaggregazione per modalità (lavoro/itinere) usa lo stesso denominatore occupazionale totale, come per i settori ATECO.
      </p>
    </div>
  );
}