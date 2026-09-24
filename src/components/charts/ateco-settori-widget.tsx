"use client";

import { useMemo, useState, useRef } from "react";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { compactNumber, exactNumber } from "@/lib/format";
import { RISK_SCALE } from "@/lib/palette";
import { FiltroModalita, ModalitaState } from "./filtro-modalita";

// Scala di rischio unica dell'app (RULES.md Regola 4): interpolazione continua
// tra il primo e l'ultimo gradino di RISK_SCALE (palette.ts), niente colori locali.
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function riskColor(t: number) {
  const v = Math.max(0, Math.min(1, t));
  const start = hexToRgb(RISK_SCALE[0]);
  const end = hexToRgb(RISK_SCALE[RISK_SCALE.length - 1]);
  const c = start.map((s, i) => Math.round(s + (end[i] - s) * v));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

interface DettaglioRiga {
  label: string;
  valore: string;
}

export function AtecoSettoriWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2025");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });
  const dettaglioRef = useRef<HTMLDivElement | null>(null);

  // Stato: vista macro (A-U) o divisione (2 cifre), ricerca testo, divisione aperta nel trend
  const [vista, setVista] = useState<"macro" | "divisione">("macro");
  const [cerca, setCerca] = useState<string>("");
  const [aperto, setAperto] = useState<string | null>(null);
  const [trendDiv, setTrendDiv] = useState<string | null>(null);

  // Cambiando anno o modalità chiudi i box aperti (reset fatto nelle callback di click)

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

  // Settori macro ordinati per indice di incidenza decrescente
  const macroData = useMemo(() => {
    const items = (annoData.atecoMacro || []).filter((m) => m.key !== "ND").map(filtraItem);
    const totNoti = items.reduce((acc, x) => acc + x.casi, 0);
    return [...items]
      .sort((a, b) => (b.indiceIncidenza || 0) - (a.indiceIncidenza || 0))
      .map((item) => ({
        ...item,
        quota: totNoti > 0 ? (item.casi / totNoti) * 100 : 0,
      }));
  }, [annoData, filtraItem]);

  const ndItem = (annoData.atecoMacro || []).find((m) => m.key === "ND");
  const ndFiltrato = ndItem ? filtraItem(ndItem) : null;
  const casiND = ndFiltrato?.casi || 0;
  const totFiltrato = (modalita.lavoro && modalita.itinere) ? (annoData.totale || 0) : casiND + macroData.reduce((acc, x) => acc + x.casi, 0);
  const percND = ((casiND / (totFiltrato || 1)) * 100).toFixed(1);

  const maxIncidenza = Math.max(...macroData.map((m) => m.indiceIncidenza || 0), 0.0001);

  // ---- Vista divisioni (2 cifre): tutte le 86, con ricerca e trend ----
  const serieTot = multidim.atecoDivisioneSerie || {};
  const serieLavoro = multidim.atecoDivisioneSerieLavoro || {};
  const serieItinere = multidim.atecoDivisioneSerieItinere || {};
  const serieMortali = multidim.atecoDivisioneSerieMortali || {};

  // Divisioni filtrate per testo (codice, nome, sezione) e per modalità selezionata
  const divisioniData = useMemo(() => {
    const lista = (annoData.atecoDivisioni || [])
      .filter((d) => d.key !== "ND")
      .map((d) => {
        const f = filtraItem(d as any);
        return { ...d, casi: f.casi, lavoro: f.lavoro, itinere: f.itinere } as any;
      });
    const query = cerca.trim().toLowerCase();
    if (query) {
      return lista.filter((d) => {
        const key = (d.key || "").toLowerCase();
        const nome = (d.nome || "").toLowerCase();
        const sez = (d.sezioneNome || "").toLowerCase();
        return key.includes(query) || nome.includes(query) || sez.includes(query);
      });
    }
    return lista;
  }, [annoData, filtraItem, cerca]);

  // Ordinamento: se cerco per codice, rilevanza sul codice; altrimenti casi decrescenti
  const divisioniOrdinate = useMemo(() => {
    const query = cerca.trim().toLowerCase();
    const arr = [...divisioniData];
    if (query) {
      arr.sort((a, b) => {
        const ka = (a.key || "").toLowerCase().startsWith(query) ? 0 : 1;
        const kb = (b.key || "").toLowerCase().startsWith(query) ? 0 : 1;
        if (ka !== kb) return ka - kb;
        return (b.casi || 0) - (a.casi || 0);
      });
    } else {
      arr.sort((a, b) => (b.casi || 0) - (a.casi || 0));
    }
    return arr;
  }, [divisioniData, cerca]);

  // Mini-sparkline: serie 2020-2025 della divisione selezionata
  const trendDivisione = useMemo(() => {
    if (!trendDiv) return null;
    const anni = multidim.anniDisponibili || [];
    const serie = modalita.lavoro && modalita.itinere
      ? serieTot[trendDiv]
      : (modalita.lavoro ? serieLavoro[trendDiv] : serieItinere[trendDiv]);
    if (!serie) return null;
    const valori = anni.map((a) => serie[a] || 0);
    if (valori.every((v) => v === 0)) return null;
    const max = Math.max(...valori, 1);
    const min = Math.min(...valori);
    const punti = valori.map((v, i) => ({ anno: anni[i], v, y: v === 0 ? 0 : 30 - ((v - min) / (max - min || 1)) * 28 }));
    return {
      anni,
      valori,
      punti,
      mortali: (serieMortali[trendDiv] || {}) as Record<string, number>,
    };
  }, [trendDiv, modalita, multidim]);

  const righeDettaglio = (p: any): DettaglioRiga[] => {
    const righe: DettaglioRiga[] = [];
    righe.push({ label: "Infortuni denunciati", valore: exactNumber(p.casi) });
    if (modalita.lavoro && modalita.itinere) {
      righe.push({ label: "Ripartizione", valore: `${exactNumber(p.lavoro ?? 0)} in occasione di lavoro · ${exactNumber(p.itinere ?? 0)} in itinere` });
    } else if (modalita.lavoro) {
      righe.push({ label: "Modalità", valore: "Solo in occasione di lavoro" });
    } else {
      righe.push({ label: "Modalità", valore: "Solo in itinere" });
    }
    righe.push({ label: "Esiti mortali", valore: exactNumber(p.mortali ?? 0) });
    if (p.giorni !== undefined) {
      const media = p.durataMedia ? ` (media ${Number(p.durataMedia).toLocaleString("it-IT", { maximumFractionDigits: 1 })} gg/caso)` : "";
      righe.push({ label: "Giornate di inabilità", valore: `${compactNumber(p.giorni)} gg${media}` });
    }
    righe.push({ label: "Incidenza", valore: `${p.indiceIncidenza} per 1.000 occupati` });
    if (p.indiceGravita !== undefined) {
      righe.push({ label: "Indice gravità", valore: `${p.indiceGravita ?? 0} gg per 1.000 occupati` });
    }
    righe.push({ label: "Quota sul totale", valore: `${(p.quota || 0).toFixed(1)}%` });
    if (p.occupati !== undefined) {
      righe.push({ label: "Occupati di comparto", valore: exactNumber(p.occupati) });
    }
    return righe;
  };

  const toggle = (key: string) => {
    setAperto((cur) => {
      const next = cur === key ? null : key;
      if (next) {
        setTimeout(() => {
          dettaglioRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 60);
      }
      return next;
    });
  };

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
            <button
              key={a}
              onClick={() => {
                setAnno(a);
                setAperto(null);
                setTrendDiv(null);
              }}
              className={`btn-pill ${anno === a ? "active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>

        <FiltroModalita
          value={modalita}
          onChange={(m) => {
            setModalita(m);
            setAperto(null);
            setTrendDiv(null);
          }}
          size="sm"
        />
      </div>

      {/* Switch macro/divisioni + ricerca */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", fontSize: "0.8rem" }}>
          <button
            type="button"
            onClick={() => setVista("macro")}
            className={`btn-pill ${vista === "macro" ? "active" : ""}`}
            aria-pressed={vista === "macro"}
          >
            Macro-settori (A–U)
          </button>
          <button
            type="button"
            onClick={() => setVista("divisione")}
            className={`btn-pill ${vista === "divisione" ? "active" : ""}`}
            aria-pressed={vista === "divisione"}
          >
            Divisioni ({annoData.atecoDivisioni?.length || 0})
          </button>
        </div>
        {vista === "divisione" && (
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <input
              type="search"
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
              placeholder="Cerca codice o settore, es. H52, magazzinaggio, costruzioni…"
              aria-label="Cerca codice ATECO o nome del settore"
              style={{
                width: "100%",
                padding: "7px 10px 7px 30px",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "0.82rem",
              }}
            />
            <span style={{ position: "absolute", left: 9, top: 5, fontSize: "0.8rem", color: "var(--color-text-soft)" }} aria-hidden="true">
              🔍
            </span>
          </div>
        )}
      </div>

      {/* Intestazione lista - adatta al tipo di vista */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--space-2)", fontSize: "0.88rem", fontWeight: 700 }}>
        <span>
          {vista === "macro"
            ? "Tasso di Incidenza per Settore ATECO (Infortuni ogni 1.000 occupati)"
            : "Dettaglio per Divisione ATECO (2 cifre)"}
        </span>
        <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", fontWeight: 400 }}>
          {vista === "macro"
            ? "Ordinati per incidenza, tocca un settore per il dettaglio"
            : `${divisioniOrdinate.length} divisioni · tocca una divisione per il dettaglio e il trend`}
        </span>
      </div>

      {vista === "macro" ? (
        /* Box settori ordinati per indice di incidenza */
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {macroData.map((item, idx) => {
            const isOpen = aperto === item.key;
            const t = (item.indiceIncidenza || 0) / maxIncidenza;
            return (
            <div
              key={item.key}
              style={{
                background: "var(--color-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-divider)",
                borderLeft: `4px solid ${riskColor(t)}`,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(item.key)}
                aria-expanded={isOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  font: "inherit",
                  color: "var(--color-text)",
                }}
              >
                <span style={{ minWidth: 22, fontSize: "0.72rem", fontWeight: 650, color: "var(--color-text-soft)", fontVariantNumeric: "tabular-nums" }}>
                  {idx + 1}
                </span>
                <span
                  style={{
                    minWidth: 28,
                    height: 28,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-md)",
                    background: riskColor(t),
                    color: "var(--color-raised)",
                    fontWeight: 750,
                    fontSize: "0.85rem",
                  }}
                >
                  {item.key}
                </span>
                <span style={{ flex: 1, fontWeight: 650, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.nome}
                </span>
                <span style={{ fontWeight: 750, fontVariantNumeric: "tabular-nums", fontSize: "0.88rem", whiteSpace: "nowrap" }}>
                  {item.indiceIncidenza}‰
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-soft)",
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div
                  ref={dettaglioRef}
                  style={{
                    borderTop: "1px solid var(--color-divider)",
                    padding: "var(--space-3) var(--space-4)",
                    background: "var(--color-raised)",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                    <span style={{ color: "var(--color-accent)" }}>{item.key}</span> · {item.nome}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "var(--space-2)",
                    }}
                  >
                    {righeDettaglio(item).map((r) => (
                      <div key={r.label} style={{ fontSize: "0.82rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          {r.label}
                        </div>
                        <div style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{r.valore}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      ) : (
        /* Lista divisioni ATECO (2 cifre) */
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {divisioniOrdinate.length === 0 && (
            <div style={{ padding: "var(--space-4)", color: "var(--color-text-soft)", fontSize: "0.85rem" }}>
              Nessuna divisione corrisponde alla ricerca.
            </div>
          )}
          {divisioniOrdinate.map((item, idx) => {
            const chiave = (item.key || "") as string;
            const isOpen = aperto === chiave;
            const t = Math.min(1, (item.casi || 0) / (divisioniOrdinate[0]?.casi || 1));
            const totSerie = serieTot[chiave] || {};
            const trendPunti = (multidim.anniDisponibili || []).map((a) => totSerie[a] || 0);
            const maxTrend = Math.max(...trendPunti, 1);
            return (
              <div
                key={chiave}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-divider)",
                  borderLeft: `4px solid ${riskColor(t)}`,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(chiave)}
                  aria-expanded={isOpen}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    font: "inherit",
                    color: "var(--color-text)",
                  }}
                >
                  <span style={{ minWidth: 22, fontSize: "0.72rem", fontWeight: 650, color: "var(--color-text-soft)", fontVariantNumeric: "tabular-nums" }}>
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      minWidth: 46,
                      padding: "3px 7px",
                      borderRadius: "var(--radius-md)",
                      background: riskColor(t),
                      color: "var(--color-raised)",
                      fontWeight: 750,
                      fontSize: "0.8rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chiave}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.nome}
                    <span style={{ color: "var(--color-text-soft)", fontSize: "0.68rem" }}> · {item.sezioneNome}</span>
                  </span>
                  <span style={{ fontWeight: 750, fontVariantNumeric: "tabular-nums", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {exactNumber(item.casi)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-text-soft)",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div
                    ref={dettaglioRef}
                    style={{
                      borderTop: "1px solid var(--color-divider)",
                      padding: "var(--space-3) var(--space-4)",
                      background: "var(--color-raised)",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                      <span style={{ color: "var(--color-accent)" }}>{chiave}</span> · {item.nome}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "var(--space-2)",
                      }}
                    >
                      {righeDettaglio(item).map((r) => (
                        <div key={r.label} style={{ fontSize: "0.82rem" }}>
                          <div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {r.label}
                          </div>
                          <div style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{r.valore}</div>
                        </div>
                      ))}
                    </div>
                    {/* Trend della divisione */}
                    {(() => {
                      const conDati = trendPunti.some((v) => v > 0);
                      if (!conDati) return null;
                      return (
                        <div style={{ marginTop: "var(--space-3)" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: "var(--space-1)" }}>
                            Andamento {chiave} ({multidim.anniDisponibili?.[0]} – {multidim.anniDisponibili?.[multidim.anniDisponibili.length - 1]})
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-2)" }}>
                            {multidim.anniDisponibili?.map((a) => (
                              <div key={a} style={{ fontSize: "0.82rem" }}>
                                <div style={{ fontSize: "0.66rem", color: "var(--color-text-soft)" }}>{a}</div>
                                <div style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{exactNumber(totSerie[a] || 0)}</div>
                              </div>
                            ))}
                          </div>
                          <svg
                            role="img"
                            aria-label={`Andamento ${chiave} ${item.nome} dal ${multidim.anniDisponibili?.[0]} al ${multidim.anniDisponibili?.[multidim.anniDisponibili.length - 1]}`}
                            viewBox="0 0 100 30"
                            width="100%"
                            height={40}
                            style={{ marginTop: "var(--space-2)" }}
                          >
                            {trendPunti.map((v, i) => {
                              const x = i * (100 / Math.max(1, trendPunti.length - 1));
                              const y = v === 0 ? 28 : 28 - (v / maxTrend) * 26;
                              return (
                                <circle key={i} cx={x} cy={y} r="1.6" fill="var(--color-accent)" />
                              );
                            })}
                            <polyline
                              fill="none"
                              stroke="var(--color-accent)"
                              strokeWidth="1.4"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              points={trendPunti.map((v, i) => {
                                const x = i * (100 / Math.max(1, trendPunti.length - 1));
                                const y = v === 0 ? 28 : 28 - (v / maxTrend) * 26;
                                return `${x},${y}`;
                              }).join(" ")}
                            />
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="source-note">
        Classificazione ATECO 2007: l&apos;incidenza settoriale è calcolata rapportando gli infortuni INAIL per macro-sezione (A–U) agli occupati effettivi rilevati da ISTAT (Rilevazione Forze di Lavoro). Il dettaglio per divisione (2 cifre) usa la decodifica ufficiale INAIL e mostra il trend 2020 – {multidim.anniDisponibili?.[multidim.anniDisponibili.length - 1]} per ciascuna divisione. Il filtro modalità consente di separare gli infortuni in occasione di lavoro da quelli in itinere per ciascun comparto. Casi non attribuiti a specifico settore (ND): {exactNumber(casiND)} ({percND}% del totale {modalita.lavoro && modalita.itinere ? "complessivo" : "della modalità selezionata"}).
      </p>
    </div>
  );
}