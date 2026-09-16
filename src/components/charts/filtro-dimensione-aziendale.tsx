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

// Viste mostrate: solo dinamiche e settori
type Vista = "incidenti" | "settori";
const VISTE: { id: Vista; label: string }[] = [
  { id: "incidenti", label: "Dinamiche" },
  { id: "settori", label: "Settori" },
];

// Ordine delle card: micro, piccole, medie, grandi, non dichiarata
const ORDINE = ["micro", "piccola", "media", "grande", "nd"];

const GAP_CARD = 12;

const stilePulsanteNav = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  font: "inherit",
  fontSize: "0.82rem",
  fontWeight: 600,
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid var(--color-divider)",
  background: "var(--color-raised)",
  color: "var(--color-text)",
  cursor: "pointer",
} as const;

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
  const [indice, setIndice] = useState(0);
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

  const passo = () => {
    const el = refCarosello.current;
    const prima = el?.firstElementChild as HTMLElement | null;
    return prima ? prima.offsetWidth + GAP_CARD : 1;
  };

  // Tiene traccia della card visibile durante lo scroll
  useEffect(() => {
    const el = refCarosello.current;
    if (!el || clusterOrdinati.length === 0) return;
    const onScroll = () => setIndice(Math.round(el.scrollLeft / passo()));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dati, clusterOrdinati.length]);

  const vaiA = (i: number) => {
    const el = refCarosello.current;
    if (!el) return;
    el.scrollTo({ left: i * passo(), behavior: "smooth" });
    setIndice(i);
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
  const totaleCard = clusterOrdinati.length;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)", minWidth: 0, width: "100%", maxWidth: "100%" }}>
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

        <div style={{ display: "grid", gap: 4, fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          <span>Analisi</span>
          <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
            {VISTE.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVista(v.id)}
                className={`btn-pill ${vista === v.id ? "active" : ""}`}
                aria-pressed={vista === v.id}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
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
        {clusterOrdinati.map((cluster, i) => (
          <button
            key={cluster.id}
            type="button"
            onClick={() => vaiA(i)}
            className="btn-pill"
          >
            {cluster.nome.split(" (")[0]}
          </button>
        ))}
      </div>

      {/* Carosello: card a larghezza piena su mobile, scroll a scatto */}
      <div style={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
        <div
          ref={refCarosello}
          className="carosello-cluster"
          style={{
            display: "flex",
            gap: GAP_CARD,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            padding: "var(--space-1) 2px var(--space-2)",
            scrollbarWidth: "thin",
            overscrollBehaviorX: "contain",
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
                style={{
                  border: "1px solid var(--color-divider)",
                  borderRadius: "6px",
                  padding: "var(--space-3)",
                  background: "var(--color-raised)",
                  scrollSnapAlign: "start",
                  flex: "0 0 calc(100% - 12px)",
                  maxWidth: 420,
                  minWidth: 0,
                  boxSizing: "border-box",
                  display: "grid",
                  gap: "var(--space-2)",
                  alignContent: "start",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.88rem", display: "block" }}>{cluster.nome}</strong>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontSize: "1.35rem", lineHeight: 1, fontWeight: 800, color: "var(--color-accent)" }}>
                      {casi.toLocaleString("it-IT")}
                    </span>
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

        {/* Comandi alla base: precedente / indicatore / prossima */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
          <button
            type="button"
            onClick={() => vaiA(Math.max(0, indice - 1))}
            disabled={indice <= 0}
            aria-label="Card precedente"
            style={{ ...stilePulsanteNav, opacity: indice <= 0 ? 0.4 : 1, cursor: indice <= 0 ? "default" : "pointer" }}
          >
            <ChevronLeft size={16} /> Precedente
          </button>
          <button
            type="button"
            onClick={() => vaiA(Math.min(totaleCard - 1, indice + 1))}
            disabled={indice >= totaleCard - 1}
            aria-label="Card successiva"
            style={{ ...stilePulsanteNav, opacity: indice >= totaleCard - 1 ? 0.4 : 1, cursor: indice >= totaleCard - 1 ? "default" : "pointer" }}
          >
            Successiva <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}