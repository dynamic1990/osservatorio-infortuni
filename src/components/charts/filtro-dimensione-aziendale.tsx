"use client";

import { useEffect, useMemo, useState } from "react";
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

// Viste mostrate come select nel pannello
type Vista = "incidenti" | "settori" | "fattoriTipo" | "problemiSicurezza";
const VISTE: { id: Vista; label: string }[] = [
  { id: "incidenti", label: "Dinamiche" },
  { id: "settori", label: "Settori" },
  { id: "fattoriTipo", label: "Tipi di fattore" },
  { id: "problemiSicurezza", label: "Problemi di sicurezza" },
];

// Stile comune per select
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
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set(["micro"]));
  const [anno, setAnno] = useState(2024);
  const [vista, setVista] = useState<Vista>("incidenti");

  useEffect(() => {
    fetch("/data/informo-cluster-dimensionali.json")
      .then((r) => r.json())
      .then((d) => setDati(d as ClusterDataset))
      .catch(() => setDati(null));
  }, []);

  const toggle = (id: string) => {
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clusterVisibili = useMemo(
    () => (dati?.cluster ?? []).filter((c) => selezionati.has(c.id) && c.id !== "tutte"),
    [dati, selezionati]
  );

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
      {/* Filtri: dimensione (multi-select) + anno + vista */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
        <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          Dimensione aziendale
          <select
            multiple
            size={5}
            aria-label="Seleziona una o più dimensioni aziendali"
            value={[...selezionati]}
            onChange={(e) => {
              const voci = Array.from(e.target.selectedOptions).map((o) => o.value);
              setSelezionati(new Set(voci));
            }}
            style={{ ...stileSelect, minWidth: 260, lineHeight: 1.8 }}
          >
            {dati.cluster
              .filter((c) => c.id !== "tutte")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.casi})
                </option>
              ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          Anno
          <select
            value={anno}
            onChange={(e) => setAnno(Number(e.target.value))}
            style={{ ...stileSelect, minWidth: 120 }}
          >
            {ANNI.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

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

      {/* Carosello di card per cluster */}
      {clusterVisibili.length === 0 ? (
        <p className="source-note">Nessun cluster selezionato: scegli una o più dimensioni.</p>
      ) : (
        <div
          className="carosello-cluster"
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(280px, 1fr)",
            gap: "var(--space-3)",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: "var(--space-2)",
          }}
        >
          {clusterVisibili.map((cluster) => {
            const annoCorrente = cluster.perAnno.find((p) => p.anno === anno);
            const annoPrecedente = cluster.perAnno.find((p) => p.anno === anno - 1);
            const casi = annoCorrente?.casi ?? 0;
            const casiPrev = annoPrecedente?.casi ?? undefined;
            const voci = annoCorrente?.viste[vista] ?? [];
            const vociPrev = annoPrecedente?.viste[vista] ?? [];
            const casiTotVista = voci.reduce((s, v) => s + v.count, 0);
            const casiTotVistaPrev = vociPrev.reduce((s, v) => s + v.count, 0);
            return (
              <div
                key={cluster.id}
                style={{
                  border: "1px solid var(--color-divider)",
                  borderRadius: "6px",
                  padding: "var(--space-3)",
                  background: "var(--color-raised)",
                  scrollSnapAlign: "start",
                  display: "grid",
                  gap: "var(--space-2)",
                  alignContent: "start",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.88rem", display: "block" }}>{cluster.nome}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-soft)", display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span>{casi.toLocaleString("it-IT")} casi nel {anno}</span>
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
                              <Delta prev={casiTotVistaPrev ? prev : undefined} curr={v.count} />
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
      )}
    </div>
  );
}