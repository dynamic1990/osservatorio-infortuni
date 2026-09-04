"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { compactNumber, exactNumber } from "@/lib/format";
import { FiltroModalita, ModalitaState } from "./filtro-modalita";

// Scala di rischio per i box: dal rosso tenue al rosso scuro in base all'incidenza
const RISK_START = [243, 204, 200];
const RISK_END = [127, 29, 22];

function riskColor(t: number) {
  const v = Math.max(0, Math.min(1, t));
  const c = RISK_START.map((s, i) => Math.round(s + (RISK_END[i] - s) * v));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

interface DettaglioRiga {
  label: string;
  valore: string;
}

export function AtecoSettoriWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });
  const [aperto, setAperto] = useState<string | null>(null);
  const dettaglioRef = useRef<HTMLDivElement | null>(null);

  // Cambiando anno o modalità chiudi il box aperto
  useEffect(() => {
    setAperto(null);
  }, [anno, modalita]);

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
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>

        <FiltroModalita value={modalita} onChange={setModalita} size="sm" />
      </div>

      {/* Intestazione lista */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--space-2)", fontSize: "0.88rem", fontWeight: 700 }}>
        <span>Tasso di Incidenza per Settore ATECO (Infortuni ogni 1.000 occupati)</span>
        <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", fontWeight: 400 }}>
          Ordinati per incidenza, tocca un settore per il dettaglio
        </span>
      </div>

      {/* Box settori ordinati per indice di incidenza */}
      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {macroData.map((item, idx) => {
          const isOpen = aperto === item.key;
          const t = (item.indiceIncidenza || 0) / maxIncidenza;
          return (
            <div
              key={item.key}
              style={{
                background: "var(--color-surface)",
                borderRadius: "6px",
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
                    borderRadius: 6,
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

      <p className="source-note">
        Classificazione ATECO 2007: l&apos;incidenza settoriale è calcolata rapportando gli infortuni INAIL per macro-sezione (A–U) agli occupati effettivi rilevati da ISTAT (Rilevazione Forze di Lavoro). Il filtro modalità consente di separare gli infortuni in occasione di lavoro da quelli in itinere per ciascun comparto. Casi non attribuiti a specifico settore (ND): {exactNumber(casiND)} ({percND}% del totale {modalita.lavoro && modalita.itinere ? "complessivo" : "della modalità selezionata"}).
      </p>
    </div>
  );
}