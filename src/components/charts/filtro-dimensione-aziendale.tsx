"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Tipi del dataset precalcolato (informo-cluster-dimensionali.json)
interface VoceQuota {
  nome: string;
  count: number;
  quota: number;
}

interface ClusterAnno {
  anno: number;
  casi: number;
  viste: {
    incidenti: VoceQuota[];
    settori: VoceQuota[];
    territori: VoceQuota[];
    fattoriTipo: VoceQuota[];
    problemiSicurezza: VoceQuota[];
  };
}

interface ClusterDim {
  id: string;
  nome: string;
  casi: number;
  perAnno: ClusterAnno[];
}

interface ClusterDataset {
  meta?: { nota?: string; criteri?: Record<string, unknown> };
  cluster: ClusterDim[];
}

const ANNI = [2020, 2021, 2022, 2023, 2024];

// Viste mostrate: solo dinamiche e settori (tipi di fattore e problemi di sicurezza rimossi)
type Vista = "incidenti" | "settori";
const VISTE: { id: Vista; label: string }[] = [
  { id: "incidenti", label: "Dinamiche" },
  { id: "settori", label: "Settori" },
];

// Ordine delle card: micro, piccole, medie, grandi, non dichiarata
const ORDINE = ["micro", "piccola", "media", "grande", "nd"];

const stileSelect = {
  font: "inherit",
  fontSize: "0.82rem",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid var(--color-divider)",
  background: "var(--color-raised)",
  color: "var(--color-text)",
};

// Delta % tra due conteggi, con segno e colore (migliora = verde, peggiora = accent)
function Delta({ prev, curr }: { prev?: number; curr?: number }) {
  if (prev === undefined || curr === undefined || prev === 0) {
    return <span style={{ fontSize: "0.72rem", color: "var(--color-text-soft)" }}>n.d.</span>;
  }
  const pct = ((curr - prev) / prev) * 100;
  const segno = pct > 0 ? "+" : "";
  const colore = pct > 0 ? "var(--color-accent)" : "var(--color-success)";
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: colore, flexShrink: 0 }}>
      {segno}{pct.toFixed(1).replace(".", ",")}%
    </span>
  );
}

export function FiltroDimensioneAziendale() {
  const [dati, setDati] = useState<ClusterDataset | null>(null);
  const [anno, setAnno] = useState(2024);
  const [vista, setVista] = useState<Vista>("incidenti");
  const refCarosello = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/data/informo-cluster-dimensionali.json")
      .then((r) => r.json())
      .then((d) => setDati(d as ClusterDataset))
      .catch(() => setDati(null));
  }, []);

  const clusterOrdinati = useMemo(() => {
    const mappa = new Map((dati?.cluster ?? []).map((c) => [c.id, c]));
    return ORDINE.map((id) => mappa.get(id)).filter((c): c is ClusterDim => Boolean(c));
  }, [dati]);

  const scorri = (dir: 1 | -1) => {
    const el = refCarosello.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (!dati) {
    return (
      <p className="source-note" aria-live="polite">
        Caricamento analisi per dimensione aziendale&hellip;
      </p>
    );
  }

  const clusterNondich = dati.cluster.find((c) => c.id === "nd");
  const clusterTutte = dati.cluster.find((c) => c.id === "tutte");

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Filtri: anno a pulsanti + vista */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
        <div style={{ display: "grid", gap: 4, fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          <span>Anno</span>
          <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
            {ANNI.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAnno(a)}
                className={`btn-pill ${anno === a ? "active" : ""}`}
                aria-pressed={anno === a}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          Analisi
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value as Vista)}
            style={{ ...stileSelect, minWidth: 180 }}
          >
            {VISTE.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Nota di copertura */}
      <p className="source-note" style={{ margin: 0 }}>
        Classi dimensionali (raccomandazione UE 2003/361): micro 0-9, piccole 10-49, medie 50-249,
        grandi 250+ addetti. Le quote sono sul totale del cluster e dell&apos;anno. Delta = variazione
        % dei casi rispetto all&apos;anno precedente. Casi nel quinquennio:{" "}
        {clusterTutte?.casi.toLocaleString("it-IT") ?? "n.d."} (di cui {clusterNondich?.casi ?? 0} con
        dimensione non dichiarata).
      </p>

      {/* Dimensioni: pulsanti che portano alla card corrispondente */}
      <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", marginRight: 4 }}>Dimensione</span>
        {clusterOrdinati.map((cluster) => (
          <button
            key={cluster.id}
            type="button"
            onClick={() => {
              const el = document.getElementById(`cluster-${cluster.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
            }}
            className="btn-pill"
          >
            {cluster.nome.split(" (")[0]}
          </button>
        ))}
      </div>

      {/* Carosello: tutte le card sempre attive, con frecce di scorrimento */}
      <div style={{ position: "relative" }}>
        {/* Frecce ai lati */}
        <button
          type="button"
          onClick={() => scorri(-1)}
          aria-label="Scorri a sinistra"
          style={{
            position: "absolute",
            left: -14,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--color-divider)",
            background: "var(--color-raised)",
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scorri(1)}
          aria-label="Scorri a destra"
          style={{
            position: "absolute",
            right: -14,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--color-divider)",
            background: "var(--color-raised)",
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <ChevronRight size={18} />
        </button>

        <div
          ref={refCarosello}
          className="carosello-cluster"
          style={{
            display: "flex",
            gap: "var(--space-3)",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            padding: "var(--space-1) var(--space-2) var(--space-2)",
            scrollbarWidth: "thin",
          }}
        >
          {clusterOrdinati.map((cluster) => {
            const annoCorrente = cluster.perAnno.find((p) => p.anno === anno);
            const annoPrecedente = cluster.perAnno.find((p) => p.anno === anno - 1);
            const casi = annoCorrente?.casi ?? 0;
            const casiPrev = annoPrecedente?.casi ?? undefined;
            const voci = annoCorrente?.viste[vista] ?? [];
            const vociPrev = annoPrecedente?.viste[vista] ?? [];
            return (
              <div
                key={cluster.id}
                id={`cluster-${cluster.id}`}
                style={{
                  border: "1px solid var(--color-divider)",
                  borderRadius: "6px",
                  padding: "var(--space-3)",
                  background: "var(--color-raised)",
                  scrollSnapAlign: "start",
                  flex: "0 0 clamp(280px, 78vw, 360px)",
                  minWidth: 0,
                  display: "grid",
                  gap: "var(--space-2)",
                  alignContent: "start",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.88rem", display: "block" }}>{cluster.nome}</strong>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontSize: "1.35rem", lineHeight: 1, fontWeight: 800, color: "var(--color-accent)" }}>{casi.toLocaleString("it-IT")}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-soft)" }}>casi nel {anno}</span>
                    <Delta prev={casiPrev} curr={casi} />
                  </div>
                </div>
                {voci.length === 0 ? (
                  <p className="source-note" style={{ margin: 0 }}>Nessun dato per questo anno.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
                    {voci.map((v) => {
                      const prev = vociPrev.find((p) => p.nome === v.nome)?.count;
                      return (
                        <li key={v.nome} style={{ display: "grid", gap: 3 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", fontSize: "0.75rem" }}>
                            <span style={{ color: "var(--color-text-soft)" }}>{v.nome}</span>
                            <span style={{ display: "flex", gap: 6, alignItems: "baseline", flexShrink: 0 }}>
                              <strong>{v.quota.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</strong>
                              <Delta prev={prev} curr={v.count} />
                            </span>
                          </div>
                          <div style={{ height: 4, borderRadius: 999, background: "var(--color-divider)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(v.quota, 100)}%`, background: "var(--color-accent)" }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}