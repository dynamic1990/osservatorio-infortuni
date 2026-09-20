"use client";

import { useMemo, useState } from "react";
import {
  ANNI_INFORMO,
  ANNO_DEFAULT,
  annoPrecedente,
  vociAnno,
  sommaVociPerNome,
  totalePeriodo,
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
  multiAnno?: boolean; // selezione multipla: somma per periodo (Regola 1: etichetta perimetro)
  casiAnno?: { anno: number; casi: number }[]; // casi reali per anno (per etichetta corretta del periodo)
}

// Riga unificata: i campi delta/quota/nuovo sono opzionali perché la vista
// singolo anno e la vista aggregata hanno forme diverse (si escludono a vicenda).
interface Riga {
  nome: string;
  count: number;
  delta?: number | null;
  deltaPerc?: number | null;
  quota?: number;
  nuovo?: boolean;
}

// Lista "barre + delta" per una dimensione di conteggio, per singolo anno con
// delta vs anno precedente (RULES.md regola 1 e 2). Con multiAnno l'utente può
// selezionare più anni e la lista mostra la somma di periodo, con quote sul
// totale del periodo e perimetro dichiarato (eccezione ammessa dalla Regola 1:
// totale di periodo solo con selezione esplicita ed etichetta chiara).
// Selezione di un solo anno = vista classica con delta (nessuna regressione).
export function InformoVociLista({
  titolo,
  sottotitolo,
  serie,
  limite = 10,
  unita = "casi",
  colore = "var(--color-accent)",
  mostraSolo,
  anni = ANNI_INFORMO,
  multiAnno = false,
  casiAnno,
}: Props) {
  const [anno, setAnno] = useState<number>(ANNO_DEFAULT);
  const [selezionati, setSelezionati] = useState<readonly number[]>([ANNO_DEFAULT]);

  // Riferimento stabile per useMemo: in vista singola è [anno], in multi è la selezione.
  const attivi = useMemo(
    () => (multiAnno ? selezionati : ([anno] as const)),
    [multiAnno, selezionati, anno]
  );
  const aggregato = attivi.length > 1;

  const dati = useMemo(() => {
    if (!aggregato) {
      const a = attivi[0];
      const correnti = vociAnno(serie, a);
      const prevAnno = annoPrecedente(a);
      const prev = prevAnno !== undefined ? vociAnno(serie, prevAnno) : [];
      const prevMap = new Map(prev.map((v) => [v.nome, v.count]));
      let righe: Riga[] = correnti.map((v) => {
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
    }
    const tot = totalePeriodo(serie, attivi);
    let righe: Riga[] = sommaVociPerNome(serie, attivi).map((v) => ({
      ...v,
      quota: tot > 0 ? (v.count / tot) * 100 : 0,
    }));
    if (mostraSolo) {
      righe = righe.filter((r) => mostraSolo(r.nome));
    }
    return righe.sort((a, b) => b.count - a.count).slice(0, limite);
  }, [serie, attivi, aggregato, limite, mostraSolo]);

  const max = useMemo(() => Math.max(...dati.map((d) => d.count), 1), [dati]);

  const totalePeriodoVisibile = useMemo(
    () => (aggregato ? totalePeriodo(serie, attivi) : null),
    [aggregato, serie, attivi]
  );

  const casiPeriodoVisibili = useMemo(() => {
    if (!aggregato || !casiAnno) return null;
    const mappa = new Map(casiAnno.map((c) => [c.anno, c.casi]));
    return attivi.reduce((acc, a) => acc + (mappa.get(a) ?? 0), 0);
  }, [aggregato, casiAnno, attivi]);

  const coloreDelta = (d: number | null | undefined) => {
    if (d === null || d === undefined) return "var(--color-text-muted)";
    return d > 0 ? "var(--color-accent)" : d < 0 ? "var(--color-success)" : "var(--color-text-muted)";
  };

  const toggleAnno = (a: number) => {
    if (!multiAnno) {
      setAnno(a);
      return;
    }
    setSelezionati((prev) => {
      const has = prev.includes(a);
      if (has && prev.length === 1) return prev; // mai zero anni
      return has ? prev.filter((x) => x !== a) : [...prev, a].sort((x, y) => x - y);
    });
  };

  const etichettaPeriodo = aggregato
    ? `${attivi[0]}-${attivi[attivi.length - 1]} · ${attivi.length} anni · ${totalePeriodoVisibile?.toLocaleString("it-IT") ?? "—"} ${unita}`
    : null;

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
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", alignItems: "center" }}>
          {multiAnno && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--color-text-soft)",
                marginRight: "var(--space-1)",
                whiteSpace: "nowrap",
              }}
            >
              Seleziona uno o più anni
            </span>
          )}
          {anni.map((a) => (
            <button
              key={a}
              onClick={() => toggleAnno(a)}
              className={`btn-pill ${attivi.includes(a) ? "active" : ""}`}
              aria-pressed={attivi.includes(a)}
              title={multiAnno ? (attivi.includes(a) ? "Rimuovi dalla selezione" : "Aggiungi alla selezione") : undefined}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {etichettaPeriodo && (
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 650,
            color: "var(--color-accent)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            borderRadius: "6px",
            padding: "6px 10px",
            width: "fit-content",
          }}
        >
          Totale di periodo: {etichettaPeriodo}
          {casiPeriodoVisibili !== null && (
            <span style={{ fontWeight: 400, marginLeft: 8 }}>
              {casiPeriodoVisibili.toLocaleString("it-IT")} casi analizzati
              {totalePeriodoVisibile !== null &&
                totalePeriodoVisibile > casiPeriodoVisibili && (
                  <> · {totalePeriodoVisibile.toLocaleString("it-IT")} voci classificate</>
                )}
            </span>
          )}
        </div>
      )}

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
                  <span style={{ fontWeight: 700 }}>{v.count.toLocaleString("it-IT")}</span>
                  {aggregato ? (
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
                      {(v.quota ?? 0).toFixed(1).replace(".", ",")}%
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.78rem", fontWeight: 650, color: coloreDelta(v.delta) }}>
                      {v.nuovo === true
                        ? "nuovo"
                        : v.delta === null || v.delta === undefined
                          ? "—"
                          : `${v.delta > 0 ? "+" : ""}${v.delta} (${v.delta > 0 ? "+" : ""}${(v.deltaPerc ?? 0).toFixed(1).replace(".", ",")}%)`}
                    </span>
                  )}
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
            Nessuna voce per gli anni selezionati.
          </div>
        )}
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        {aggregato ? (
          <>Somma dei conteggi sugli anni selezionati, con quota sul totale delle voci del periodo. Un caso può avere più voci classificate, quindi il numero di voci può superare quello dei casi. Unità: {unita}.</>
        ) : (
          <>Delta in rosso/verde come variazione dell&apos;anno selezionato rispetto
            all&apos;anno precedente; &ldquo;nuovo&rdquo; indica una voce assente dalla
            serie precedente. {unita && `Unità: ${unita}.`}</>
        )}
      </div>
    </div>
  );
}