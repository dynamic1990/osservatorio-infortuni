"use client";

import { useMemo, useState } from "react";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { ItalyMap } from "@/components/charts/italy-map";
import { exactNumber } from "@/lib/format";
import { MAP_SCALE } from "@/lib/palette";
import { QuotaGenere } from "@/components/charts/quota-genere";

type Vista = "periodo" | "2025" | "2026";

export function MalattieRegioniWidget() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("periodo");

  const valore = (r: { totale: number; anno2025: number; anno2026: number }) =>
    vista === "2025" ? r.anno2025 : vista === "2026" ? r.anno2026 : r.totale;

  const valoriRegioni = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of dati.regioni) map[r.codice] = valore(r);
    return map;
  }, [dati, vista]);

  const ranking = useMemo(() => [...dati.regioni].sort((a, b) => valore(b) - valore(a)), [dati, vista]);
  const sel = selected ? dati.regioni.find((r) => r.codice === selected) : null;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>Denunce per regione (sede INAIL di protocollazione)</div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {([["periodo", "Totale periodo"], ["2025", "I sem 2025"], ["2026", "I sem 2026"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setVista(v)} className={`btn-pill ${vista === v ? "active" : ""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-map-panel">
        <div style={{ minWidth: 0 }}>
          <ItalyMap regions={valoriRegioni} onSelect={setSelected} selected={selected} />
        </div>
        <div style={{ minWidth: 0, display: "grid", gap: "var(--space-3)" }}>
          {sel && (
            <div style={{ background: "var(--color-accent-soft)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", fontSize: "0.85rem" }}>
              <strong>{sel.nome}</strong> · {exactNumber(valore(sel))} denunce
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <div><div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>I sem 2025</div><div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(sel.anno2025)}</div></div>
                <div><div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>I sem 2026</div><div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(sel.anno2026)}</div></div>
              </div>
              {sel.deltaPerc !== null && (
                <div style={{ marginTop: "var(--space-2)", fontSize: "0.8rem" }}>
                  Variazione: <strong style={{ color: (sel.deltaPerc ?? 0) >= 0 ? "var(--color-accent)" : "var(--color-success)" }}>{(sel.deltaPerc ?? 0) >= 0 ? "+" : ""}{(sel.deltaPerc ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</strong>
                </div>
              )}
              <div style={{ marginTop: "var(--space-2)" }}>
                <QuotaGenere maschi={sel.maschi} femmine={sel.femmine} compact />
              </div>
            </div>
          )}
          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}>
            {ranking.map((r, idx) => {
              const maxV = ranking[0] ? valore(ranking[0]) : 1;
              const colorIdx = Math.min(MAP_SCALE.length - 1, Math.floor((valore(r) / maxV) * (MAP_SCALE.length - 1)));
              return (
                <button key={r.codice} type="button" onClick={() => setSelected(selected === r.codice ? null : r.codice)}
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%", padding: "7px 10px", border: "none", borderBottom: "1px solid var(--color-border)", background: selected === r.codice ? "var(--color-accent-soft)" : "transparent", cursor: "pointer", textAlign: "left", font: "inherit", fontSize: "0.82rem", color: "var(--color-text)" }}>
                  <span style={{ minWidth: 18, fontSize: "0.7rem", color: "var(--color-text-soft)", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: MAP_SCALE[colorIdx], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 550 }}>{r.nome}</span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(valore(r))}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="source-note">
        La ripartizione per regione si basa sulla <strong>sede INAIL competente per la protocollazione</strong> della denuncia (dove il caso è gestito amministrativamente), non sul luogo di lavoro o sulla residenza del lavoratore. Il dato va letto come indicatore dell&apos;attività di denuncia, non della distribuzione territoriale del rischio.
      </p>
    </div>
  );
}
