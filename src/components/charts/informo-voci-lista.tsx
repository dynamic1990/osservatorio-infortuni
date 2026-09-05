"use client";

import { useMemo, useState } from "react";
import {
  ANNI_INFORMO,
  ANNO_DEFAULT,
  annoPrecedente,
  vociAnno,
  type AnnoVoci,
} from "@/lib/informo-casi";

interface Props {
  titolo: string;
  sottotitolo?: string;
  serie: AnnoVoci[]; // una voce per ogni anno
  limite?: number; // top N voci da mostrare
  unita?: string; // etichetta del conteggio (es. "casi")
  colore?: string; // colore della barra (token)
  mostraSolo?: (nome: string) => boolean; // filtro voci
  anni?: readonly number[]; // anni da mostrare nel filtro
}

// Lista "barre + delta" per una dimensione di conteggio, anno per anno con
// delta vs anno precedente (RULES.md regola 1 e 2). Ogni riga mostra:
// posizione, nome della voce, valore dell'anno selezionato e variazione
// rispetto all'anno precedente in valore e percentuale, con segno.
export function InformoVociLista({
  titolo,
  sottotitolo,
  serie,
  limite = 10,
  unita = "casi",
  colore = "var(--color-accent)",
  mostraSolo,
  anni = ANNI_INFORMO,
}: Props) {
  const [anno, setAnno] = useState<number>(ANNO_DEFAULT);

  const dati = useMemo(() => {
    const correnti = vociAnno(serie, anno);
    const prevAnno = annoPrecedente(anno);
    const prev = prevAnno !== undefined ? vociAnno(serie, prevAnno) : [];
    const prevMap = new Map(prev.map((v) => [v.nome, v.count]));
    let righe = correnti.map((v) => {
      const pc = prevMap.get(v.nome);
      const delta = pc !== undefined ? v.count - pc : null;
      const deltaPerc =
        delta !== null && pc !== undefined && pc > 0 ? (delta / pc) * 100 : null;
      return { ...v, delta, deltaPerc, nuovo: pc === undefined };
    });
    if (mostraSolo) {
      righe = righe.filter((r) => mostraSolo(r.nome));
    }
    return righe.sort((a, b) => b.count - a.count).slice(0, limite);
  }, [serie, anno, limite, mostraSolo]);

  const max = useMemo(() => Math.max(...dati.map((d) => d.count), 1), [dati]);

  const coloreDelta = (d: number | null) => {
    if (d === null) return "var(--color-text-muted)";
    return d > 0 ? "var(--color-accent)" : d < 0 ? "var(--color-success)" : "var(--color-text-muted)";
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{titolo}</div>
          {sottotitolo && (
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>{sottotitolo}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {anni.map((a) => (
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "active" : ""}`}
              aria-pressed={anno === a}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {dati.map((v, i) => {
          const larghezza = Math.max(2, (v.count / max) * 100);
          return (
            <div key={v.nome} style={{ display: "grid", gap: 4, minWidth: 0, maxWidth: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "var(--space-2)",
                  fontSize: "0.82rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                    minWidth: 0,
                    flex: "1 1 60%",
                    wordBreak: "break-word",
                  }}
                  title={v.nome}
                >
                  <span style={{ color: "var(--color-text-muted)", marginRight: 6 }}>{i + 1}.</span>
                  {v.nome}
                </span>
                <span
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    alignItems: "baseline",
                    flexShrink: 1,
                    flexWrap: "wrap",
                    maxWidth: "100%",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{v.count}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 650, color: coloreDelta(v.delta) }}>
                    {v.nuovo
                      ? "nuovo"
                      : v.delta === null
                        ? "—"
                        : `${v.delta > 0 ? "+" : ""}${v.delta} (${v.delta > 0 ? "+" : ""}${(v.deltaPerc ?? 0).toFixed(1).replace(".", ",")}%)`}
                  </span>
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: "var(--color-surface)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: `${larghezza}%`, height: "100%", background: colore }} />
              </div>
            </div>
          );
        })}
        {dati.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Nessuna voce per l&apos;anno selezionato.
          </div>
        )}
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        Delta in rosso/verde come variazione dell&apos;anno selezionato rispetto
        all&apos;anno precedente; &ldquo;nuovo&rdquo; indica una voce assente dalla
        serie precedente. {unita && `Unità: ${unita}.`}
      </div>
    </div>
  );
}