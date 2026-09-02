"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Treemap,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getMultidimensionaleData, AtecoMacroData } from "@/lib/multidimensionale";
import { atecoLabel, atecoShort } from "@/lib/ateco";
import { compactNumber, exactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";
import { FiltroModalita, ModalitaState } from "./filtro-modalita";

const BLOCK_COLORS = [
  "#2b5b8a",
  "#b3261e",
  "#2f8f5b",
  "#c77d0a",
  "#0e7c8a",
  "#7b4fa6",
  "#d45b2c",
  "#5b6db0",
  "#8a5a2b",
  "#4a7a4a",
  "#b0336b",
  "#3b5f8a",
  "#6c757d",
  "#495057",
  "#343a40",
];

function CustomizedTreemapContent(props: any) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, name = "", casi = 0, mortali = 0, color } = props;

  if (width < 30 || height < 20) return null;

  const isBig = width > 110 && height > 50;
  const isMedium = width > 65 && height > 35;
  const displayName = String(name || "");
  const shortName = displayName.length > 18 ? displayName.slice(0, 16) + "…" : displayName;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color || BLOCK_COLORS[index % BLOCK_COLORS.length],
          stroke: "#ffffff",
          strokeWidth: 2,
          strokeOpacity: 0.9,
          rx: 4,
          ry: 4,
          cursor: "pointer",
        }}
      />
      {isMedium && (
        <text
          x={x + 6}
          y={y + 16}
          fill="#ffffff"
          fontSize={isBig ? 12 : 11}
          fontWeight={650}
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)", pointerEvents: "none" }}
        >
          {shortName}
        </text>
      )}
      {isBig && (
        <text
          x={x + 6}
          y={y + 32}
          fill="rgba(255,255,255,0.95)"
          fontSize={11}
          fontWeight={400}
          style={{ pointerEvents: "none" }}
        >
          {compactNumber(casi)} casi {mortali > 0 ? `(${mortali} mort.)` : ""}
        </text>
      )}
    </g>
  );
}

export function AtecoTreemapWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");
  const [vista, setVista] = useState<"incidenza" | "gravita" | "treemap" | "divisioni">("incidenza");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });

  const annoData = useMemo(() => {
    return multidim.perAnno[anno] || multidim.consolidatoTotale;
  }, [multidim, anno]);

  // Filtro per modalità: se entrambe attive => totale; altrimenti solo la modalità selezionata
  const filtraItem = useMemo(() => {
    return <T extends { casi: number; lavoro?: number; itinere?: number; mortali?: number; mortaliLavoro?: number; mortaliItinere?: number; giorni?: number; giorniLavoro?: number; giorniItinere?: number; casiConGiorni?: number; casiConGiorniLavoro?: number; casiConGiorniItinere?: number; occupati?: number; indiceIncidenza?: number; indiceGravita?: number }>(item: T): T => {
      if (modalita.lavoro && modalita.itinere) return item;
      const soloLavoro = modalita.lavoro;
      const casi = soloLavoro ? item.lavoro ?? item.casi : item.itinere ?? item.casi;
      const mortali = soloLavoro ? item.mortaliLavoro ?? item.mortali ?? 0 : item.mortaliItinere ?? item.mortali ?? 0;
      const giorni = soloLavoro ? item.giorniLavoro ?? item.giorni ?? 0 : item.giorniItinere ?? item.giorni ?? 0;
      const casiConGiorni = soloLavoro ? item.casiConGiorniLavoro ?? item.casiConGiorni ?? 0 : item.casiConGiorniItinere ?? item.casiConGiorni ?? 0;
      const occupati = item.occupati ?? 0;
      return {
        ...item,
        casi,
        mortali,
        giorni,
        casiConGiorni,
        indiceIncidenza: occupati > 0 ? Number(((casi / occupati) * 1000).toFixed(2)) : 0,
        indiceGravita: occupati > 0 ? Number(((giorni / occupati) * 1000).toFixed(1)) : 0,
      };
    };
  }, [modalita]);

  // Dati per i macro-settori ordinati per incidenza o gravità
  const macroData = useMemo(() => {
    const items = (annoData.atecoMacro || []).filter((m) => m.key !== "ND").map(filtraItem);
    return [...items].sort((a, b) => {
      if (vista === "incidenza") return (b.indiceIncidenza || 0) - (a.indiceIncidenza || 0);
      if (vista === "gravita") return (b.indiceGravita || 0) - (a.indiceGravita || 0);
      return b.casi - a.casi;
    }).map((item, idx) => ({
      ...item,
      label: `${item.key} · ${item.nome.length > 25 ? item.nome.slice(0, 23) + "…" : item.nome}`,
      fullName: `${item.key} · ${item.nome}`,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [annoData, vista, filtraItem]);

  // Treemap data
  const treemapData = useMemo(() => {
    if (vista === "divisioni") {
      const items = (annoData.atecoDivisioni || []).filter((d) => d.key !== "ND").map(filtraItem).slice(0, 18);
      const totNoti = items.reduce((acc, curr) => acc + curr.casi, 0);

      return items.map((item, idx) => {
        const desc = atecoShort(item.key);
        return {
          name: desc,
          key: item.key,
          size: item.casi,
          casi: item.casi,
          quota: totNoti > 0 ? (item.casi / totNoti) * 100 : 0,
          color: BLOCK_COLORS[idx % BLOCK_COLORS.length],
        };
      });
    } else {
      const items = (annoData.atecoMacro || []).filter((m) => m.key !== "ND").map(filtraItem);
      const totNoti = items.reduce((acc, curr) => acc + curr.casi, 0);

      return items.map((item, idx) => ({
        name: `${item.key} · ${item.nome}`,
        key: item.key,
        size: item.casi,
        casi: item.casi,
        mortali: item.mortali || 0,
        quota: totNoti > 0 ? (item.casi / totNoti) * 100 : 0,
        color: BLOCK_COLORS[idx % BLOCK_COLORS.length],
      }));
    }
  }, [annoData, vista, filtraItem]);

  const ndItem = (annoData.atecoMacro || []).find((m) => m.key === "ND");
  const ndFiltrato = ndItem ? filtraItem(ndItem) : null;
  const casiND = ndFiltrato?.casi || 0;
  const totFiltrato = (modalita.lavoro && modalita.itinere) ? (annoData.totale || 0) : casiND + macroData.reduce((acc, x) => acc + x.casi, 0);
  const percND = ((casiND / (totFiltrato || 1)) * 100).toFixed(1);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli Anno e Vista */}
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
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>

        <FiltroModalita value={modalita} onChange={setModalita} size="sm" />

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Visualizzazione:</span>
          <button
            onClick={() => setVista("incidenza")}
            className={`btn-pill ${vista === "incidenza" ? "btn-pill-accent active" : ""}`}
          >
            Incidenza per Occupati (‰)
          </button>
          <button
            onClick={() => setVista("gravita")}
            className={`btn-pill ${vista === "gravita" ? "btn-pill-accent active" : ""}`}
          >
            Indice Gravità (gg / 1.000 occ.)
          </button>
          <button
            onClick={() => setVista("treemap")}
            className={`btn-pill ${vista === "treemap" ? "btn-pill-accent active" : ""}`}
          >
            Volumi Macro (Treemap)
          </button>
          <button
            onClick={() => setVista("divisioni")}
            className={`btn-pill ${vista === "divisioni" ? "btn-pill-accent active" : ""}`}
          >
            Top 18 Attività
          </button>
        </div>
      </div>

      {/* Render Grafico: Ranking con Scroll per Incidenza/Gravità, oppure Treemap per Volumi */}
      {vista === "incidenza" || vista === "gravita" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", fontWeight: 700 }}>
            <span>
              {vista === "incidenza"
                ? "Tasso di Incidenza per Settore ATECO (Infortuni ogni 1.000 occupati)"
                : "Indice di Gravità per Settore ATECO (Giornate di inabilità ogni 1.000 occupati)"}
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", fontWeight: 400 }}>
              Scorri l&apos;elenco per visualizzare tutte le categorie
            </span>
          </div>

          <div className="chart-scroll-wrapper ateco-chart-scroll" style={{ height: 380 }}>
            {/* Il grafico resta entro la viewport: solo l'elenco verticale scorre su mobile. */}
            <div className="ateco-chart-inner" style={{ width: "100%", height: macroData.length * 28 + 30 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={macroData}
                  layout="vertical"
                  margin={{ top: 8, right: 30, bottom: 4, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={132} interval={0} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload as AtecoMacroData & { fullName: string };
                      return (
                        <div className="custom-chart-tooltip">
                          <div className="tooltip-title">{p.fullName} ({anno})</div>
                          <div className="tooltip-row">
                            <span>Tasso di Incidenza:</span>
                            <strong>{p.indiceIncidenza} per 1.000 occ.</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Indice di Gravità:</span>
                            <strong>{p.indiceGravita || 0} gg per 1.000 occ.</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Giornate perse totali:</span>
                            <strong>{compactNumber(p.giorni)} gg (media {p.durataMedia || 0} gg/caso)</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Infortuni denunciati:</span>
                            <strong>
                              {exactNumber(p.casi)}
                              {modalita.lavoro && modalita.itinere ? ` (${exactNumber(p.lavoro)} lav · ${exactNumber(p.itinere)} iti)` : modalita.lavoro ? " (in occasione di lavoro)" : " (in itinere)"}
                            </strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Infortuni mortali:</span>
                            <strong>{exactNumber(p.mortali)}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Occupati di comparto:</span>
                            <strong>{exactNumber(p.occupati)}</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey={vista === "incidenza" ? "indiceIncidenza" : "indiceGravita"}
                    name={vista === "incidenza" ? "Incidenza ‰" : "Indice Gravità"}
                    isAnimationActive={false}
                    radius={[0, 3, 3, 0]}
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: 380, background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-2)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#ffffff"
              isAnimationActive={false}
              content={<CustomizedTreemapContent />}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="custom-chart-tooltip">
                      <div className="tooltip-title">{p.name}</div>
                      <div className="tooltip-row">
                        <span>Infortuni ({anno}):</span>
                        <strong>{exactNumber(p.casi)} casi</strong>
                      </div>
                      <div className="tooltip-row">
                        <span>Quota sui settori noti:</span>
                        <strong>{(p.quota || 0).toFixed(1)}%</strong>
                      </div>
                      {modalita.lavoro && modalita.itinere && (
                        <div className="tooltip-row">
                          <span>Ripartizione:</span>
                          <strong>{exactNumber(p.lavoro ?? 0)} lav · {exactNumber(p.itinere ?? 0)} iti</strong>
                        </div>
                      )}
                      {p.mortali > 0 && (
                        <div className="tooltip-row">
                          <span>Esiti mortali:</span>
                          <strong style={{ color: "#ff8b80" }}>{exactNumber(p.mortali)}</strong>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sintesi Settori Chiave */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-2)",
          fontSize: "0.82rem",
        }}
      >
        {macroData.slice(0, 6).map((item) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "var(--color-surface)",
              borderRadius: "4px",
              borderLeft: `4px solid ${item.color}`,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
              {item.key} &middot; {item.nome}
            </span>
            <span style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
              {item.indiceIncidenza}‰ ({compactNumber(item.casi)} casi)
            </span>
          </div>
        ))}
      </div>

      <p className="source-note">
        Classificazione ATECO 2007: l&apos;incidenza settoriale è calcolata rapportando gli infortuni INAIL per macro-sezione (A–U) agli occupati effettivi rilevati da ISTAT (Rilevazione Forze di Lavoro). Il filtro modalità consente di separare gli infortuni in occasione di lavoro da quelli in itinere per ciascun comparto. Casi non attribuiti a specifico settore (ND): {exactNumber(casiND)} ({percND}% del totale {modalita.lavoro && modalita.itinere ? "complessivo" : "della modalità selezionata"}).
      </p>
    </div>
  );
}
