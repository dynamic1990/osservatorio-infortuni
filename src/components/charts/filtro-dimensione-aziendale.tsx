"use client";

import { useEffect, useMemo, useState } from "react";

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
  meta?: {
    nota?: string;
    cluster?: { id: string; nome: string }[];
    criteri?: Record<string, number>;
  };
  cluster: ClusterDim[];
}

const ANNI = [2020, 2021, 2022, 2023, 2024];

// Viste mostrate come tab nel pannello
type Vista = "incidenti" | "settori" | "fattoriTipo" | "problemiSicurezza";
const VISTE: { id: Vista; label: string }[] = [
  { id: "incidenti", label: "Dinamiche" },
  { id: "settori", label: "Settori" },
  { id: "fattoriTipo", label: "Tipi di fattore" },
  { id: "problemiSicurezza", label: "Problemi di sicurezza" },
];

export function FiltroDimensioneAziendale() {
  const [dati, setDati] = useState<ClusterDataset | null>(null);
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set(["micro"]));
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

  const selezionaTutti = () => {
    setSelezionati(new Set(dati?.cluster.map((c) => c.id) ?? []));
  };

  const clusterVisibili = useMemo(
    () => (dati?.cluster ?? []).filter((c) => selezionati.has(c.id) || c.id === "tutte"),
    [dati, selezionati]
  );

  if (!dati) {
    return (
      <p className="source-note" aria-live="polite">
        Caricamento analisi per dimensione aziendale&hellip;
      </p>
    );
  }

  const totaleCasi = dati.cluster.find((c) => c.id === "tutte")?.casi ?? 0;

  // Prepara righe per anno: per ogni anno, per ogni cluster selezionato, le voci della vista
  const righePerAnno = ANNI.map((anno) => {
    const righe = clusterVisibili
      .filter((c) => c.id !== "tutte")
      .map((c) => {
        const a = c.perAnno.find((p) => p.anno === anno);
        return {
          cluster: c,
          anno,
          casi: a?.casi ?? 0,
          voci: a?.viste[vista] ?? [],
        };
      });
    return { anno, righe };
  });

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Selezione cluster */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
        <button
          type="button"
          onClick={selezionaTutti}
          style={{
            font: "inherit",
            fontSize: "0.8rem",
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid var(--color-divider)",
            background: "var(--color-raised)",
            color: "var(--color-text)",
            cursor: "pointer",
          }}
        >
          Tutte
        </button>
        {dati.cluster
          .filter((c) => c.id !== "tutte")
          .map((c) => {
            const attivo = selezionati.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                aria-pressed={attivo}
                style={{
                  font: "inherit",
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: "1px solid var(--color-divider)",
                  background: attivo ? "var(--color-accent)" : "var(--color-raised)",
                  color: attivo ? "var(--color-raised)" : "var(--color-text)",
                  cursor: "pointer",
                  fontWeight: attivo ? 700 : 500,
                }}
              >
                {c.nome} <span style={{ opacity: 0.8 }}>({c.casi})</span>
              </button>
            );
          })}
      </div>

      {/* Tabs vista */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {VISTE.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            style={{
              font: "inherit",
              fontSize: "0.78rem",
              padding: "5px 12px",
              borderRadius: "6px",
              border: "1px solid var(--color-divider)",
              background: vista === v.id ? "var(--color-ink)" : "var(--color-raised)",
              color: vista === v.id ? "var(--color-raised)" : "var(--color-text)",
              cursor: "pointer",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Nota di copertura */}
      <p className="source-note" style={{ margin: 0 }}>
        Classi dimensionali (raccomandazione UE 2003/361): micro 0-9, piccole 10-49, medie 50-249,
        grandi 250+ addetti. Le quote sono sul totale del cluster e dell&apos;anno.
        Casi totali nel quinquennio: {totaleCasi.toLocaleString("it-IT")} (di cui{" "}
        {dati.cluster.find((c) => c.id === "nd")?.casi ?? 0} con dimensione non dichiarata).
      </p>

      {/* Tabella per anno */}
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {righePerAnno.map(({ anno, righe }) => {
          const casiAnno = righe.reduce((s, r) => s + (r.casi ?? 0), 0);
          return (
            <div key={anno} style={{ display: "grid", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>{anno}</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
                  {casiAnno.toLocaleString("it-IT")} casi nei cluster selezionati
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "var(--space-3)",
                }}
              >
                {righe.map(({ cluster, casi, voci }) => (
                  <div
                    key={cluster.id}
                    style={{
                      border: "1px solid var(--color-divider)",
                      borderRadius: "6px",
                      padding: "var(--space-3)",
                      background: "var(--color-raised)",
                    }}
                  >
                    <div style={{ marginBottom: "var(--space-2)" }}>
                      <strong style={{ fontSize: "0.82rem" }}>{cluster.nome}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-soft)" }}>
                        {casi.toLocaleString("it-IT")} casi
                      </div>
                    </div>
                    {voci.length === 0 ? (
                      <p className="source-note" style={{ margin: 0 }}>Nessun dato per questo anno.</p>
                    ) : (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                        {voci.map((v) => (
                          <li key={v.nome} style={{ display: "grid", gap: 3 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", fontSize: "0.75rem" }}>
                              <span style={{ color: "var(--color-text-soft)" }}>{v.nome}</span>
                              <strong style={{ flexShrink: 0 }}>{v.quota.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</strong>
                            </div>
                            <div style={{ height: 4, borderRadius: 999, background: "var(--color-divider)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(v.quota, 100)}%`, background: "var(--color-accent)" }} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}