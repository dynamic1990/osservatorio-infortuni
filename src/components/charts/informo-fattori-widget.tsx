"use client";

import { useMemo, useState } from "react";
import { getInformoAnalisi, vociAnno, ANNI_INFORMO, ANNO_DEFAULT } from "@/lib/informo-casi";
import { InformoVociLista } from "./informo-voci-lista";

// Fattori causali secondo il modello Informo: ogni caso è classificato con
// uno o più fattori, ciascuno con un ruolo (determinante/modulatore) e una
// lettura del problema di sicurezza. Qui si leggono i pattern prevalenti,
// anno per anno con delta (RULES.md regola 1 e 2).
export function InformoFattoriWidget() {
  const data = useMemo(() => getInformoAnalisi(), []);
  const [anno, setAnno] = useState<number>(ANNO_DEFAULT);

  const tipo = data.fattori?.perTipo ?? [];
  const problemi = data.fattori?.perProblemaSicurezza ?? [];
  const ruolo = data.fattori?.perRuolo ?? [];
  const modulazione = data.fattori?.perModulazione ?? [];

  const ruoloAnno = useMemo(() => {
    const m = new Map(vociAnno(ruolo, anno).map((v) => [v.nome, v.count]));
    return {
      determinanti: m.get("Determinante") ?? 0,
      modulatori: m.get("Modulatore") ?? 0,
    };
  }, [ruolo, anno]);

  const modAnno = useMemo(() => vociAnno(modulazione, anno), [modulazione, anno]);

  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
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
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Fattori causali secondo il modello Informo
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Ruolo dei fattori e problemi di sicurezza prevalenti, per anno
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {ANNI_INFORMO.map((a) => (
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

      {/* Ruolo: determinante vs modulatore (due card di sintesi) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Fattori determinanti
          </div>
          <div className="metric-value" style={{ color: "var(--color-accent)", fontSize: "1.6rem" }}>
            {ruoloAnno.determinanti}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            il fattore senza cui l&apos;evento non si sarebbe verificato
          </div>
        </div>
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Fattori modulatori
          </div>
          <div className="metric-value" style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            {ruoloAnno.modulatori}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            hanno peggiorato o amplificato le conseguenze
          </div>
        </div>
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Modulazione prevalente
          </div>
          <div className="metric-value" style={{ color: "var(--color-text)", fontSize: "1.6rem" }}>
            {modAnno[0]?.nome ?? "—"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {modAnno[0]?.count ?? 0} fattori nell&apos;anno
          </div>
        </div>
      </div>

      <InformoVociLista
        titolo="Fattori per tipologia"
        sottotitolo="Oggetto del fattore (attività dell'infortunato, di terzi, attrezzature, ambiente...)"
        serie={tipo}
        limite={6}
        colore="var(--color-link)"
      />

      <InformoVociLista
        titolo="Problemi di sicurezza più frequenti"
        sottotitolo="Classificazione del problema come da analisi del caso (uso errato, assenza di protezioni, procedure...)"
        serie={problemi}
        limite={8}
        colore="var(--color-accent)"
      />

      <p className="source-note">
        Fonte: INAIL Infor.MO, analisi dei casi mortali secondo il modello
        Informo. Ogni caso può avere più di un fattore; la somma delle voci di
        tipologia e di problema di sicurezza supera quindi il numero dei casi.
        La classificazione è quella effettuata dagli analisti dell&apos;archivio e
        riflette la ricostruzione a posteriori, non una valutazione giudiziale.
        La fonte non distingue senza un filtro dedicato il canale
        lavoro/itinere: il dato è presentato in forma complessiva.
      </p>
    </div>
  );
}