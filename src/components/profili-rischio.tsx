"use client";

import { useMemo, useState } from "react";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { exactNumber } from "@/lib/format";
import { atecoLabel } from "@/lib/ateco";

export function ProfiliRischio() {
  const data = getMultidimensionaleData();
  const [anno, setAnno] = useState(data.anniDisponibili.at(-1) ?? "2024");
  const [query, setQuery] = useState("");
  const current = data.perAnno[anno];
  const previous = data.perAnno[String(Number(anno) - 1)];
  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it-IT");
    return (current?.atecoDivisioni ?? []).filter((item) => !q || item.key.toLocaleLowerCase().includes(q) || atecoLabel(item.key).toLocaleLowerCase().includes(q)).sort((a, b) => b.casi - a.casi);
  }, [current, query]);
  const ferroviario = query.trim().length > 0 && items.some((x) => x.key.startsWith("H 49"));

  return <div style={{ display: "grid", gap: "var(--space-4)" }}>
    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
      {data.anniDisponibili.map((a) => <button key={a} className={`btn-pill ${anno === a ? "active" : ""}`} onClick={() => setAnno(a)}>{a}</button>)}
      <label style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", border: "1px solid var(--color-divider)", background: "var(--color-raised)" }}><span aria-hidden="true" style={{ paddingLeft: 10 }}>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca settore, ATECO o trasporto..." aria-label="Cerca un settore" style={{ width: "100%", border: 0, padding: "10px", background: "transparent", color: "var(--color-text)", font: "inherit" }} /></label>
    </div>
    {ferroviario && <div style={{ padding: "var(--space-3)", background: "var(--color-surface)", borderLeft: "3px solid var(--color-link)", fontSize: "0.84rem" }}>Il dataset INAIL disponibile aggrega il trasporto ferroviario nella divisione <strong>H 49, Trasporto terrestre</strong>. Il risultato è quindi un profilo del comparto aggregato, non una stima esclusiva del trasporto ferroviario.</div>}
    <div style={{ display: "grid", gap: "var(--space-2)" }}>
      {items.map((item) => {
        const old = previous?.atecoDivisioni.find((x) => x.key === item.key)?.casi;
        const delta = old ? item.casi - old : null;
        return <article key={item.key} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", border: "1px solid var(--color-divider)", background: "var(--color-surface)" }}>
          <strong style={{ color: "var(--color-accent)" }}>{item.key}</strong><div><strong>{atecoLabel(item.key)}</strong><div style={{ fontSize: "0.76rem", color: "var(--color-text-soft)", marginTop: 3 }}>Infortuni denunciati nel {anno}{delta !== null && <> · Δ vs {Number(anno) - 1}: {delta >= 0 ? "+" : ""}{exactNumber(delta)}</>}</div></div><strong style={{ fontVariantNumeric: "tabular-nums" }}>{exactNumber(item.casi)}</strong>
        </article>;
      })}
      {items.length === 0 && <p style={{ color: "var(--color-text-soft)" }}>Nessun settore trovato. Prova con “trasporto”, “H 49” o “costruzioni”.</p>}
    </div>
    <p className="source-note">Profilo esplorativo basato sulle divisioni ATECO disponibili nel dataset INAIL. Il dato è riferito a un singolo anno e il confronto mostra la variazione assoluta rispetto all&apos;anno precedente. La ricerca non crea una granularità maggiore di quella presente nella fonte.</p>
  </div>;
}
