"use client";

import { useMemo, useState, useRef } from "react";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { exactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";
import { QuotaGenere } from "@/components/charts/quota-genere";

interface RigaDettaglio {
  label: string;
  valore: string;
}

export function MalattiePatologieWidget() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);
  const [aperto, setAperto] = useState<string | null>(null);
  const dettaglioRef = useRef<HTMLDivElement | null>(null);

  const categorie = useMemo(() => {
    return dati.categorie.filter((c) => c.key !== "ND" && c.key !== "ALTRO");
  }, [dati]);

  const maxCasi = Math.max(...categorie.map((c) => c.anno2026), 1);

  const colorFor = (idx: number) => PALETTE[idx % PALETTE.length];

  const righeDettaglio = (c: (typeof categorie)[number]): RigaDettaglio[] => {
    const delta = c.anno2026 - c.anno2025;
    const deltaPerc = c.anno2025 > 0 ? (delta / c.anno2025) * 100 : null;
    const righe: RigaDettaglio[] = [];
    righe.push({ label: "Denunce I semestre", valore: `${exactNumber(c.anno2025)} (2025) · ${exactNumber(c.anno2026)} (2026)` });
    righe.push({
      label: "Variazione vs I sem 2025",
      valore: `${delta >= 0 ? "+" : ""}${exactNumber(delta)} (${deltaPerc !== null ? (deltaPerc >= 0 ? "+" : "") + deltaPerc.toFixed(1) + "%" : "n.d."})`,
    });
    righe.push({ label: "Quota sul totale", valore: `${(c.quota ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%` });
    righe.push({ label: "Codici ICD-10 più frequenti", valore: c.topCodici.map((t) => `${t.codice} (${exactNumber(t.casi)})`).join(" · ") || "n.d." });
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
      <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>
        Patologie denunciate per gruppo clinico (ICD-10): I semestre 2026, variazione vs I sem 2025
      </div>

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {categorie.map((c, idx) => {
          const isOpen = aperto === c.key;
          const v = c.anno2026;
          const delta = c.anno2026 - c.anno2025;
          const deltaPerc = c.anno2025 > 0 ? (delta / c.anno2025) * 100 : null;
          const deltaPos = delta >= 0;
          const larghezza = Math.max(6, Math.round((v / maxCasi) * 100));
          return (
            <div key={c.key} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-divider)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => toggle(c.key)}
                aria-expanded={isOpen}
                className="pat-row"
                style={{ padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", font: "inherit", color: "var(--color-text)" }}
              >
                <span className="pat-num" style={{ minWidth: 22, fontSize: "0.72rem", fontWeight: 650, color: "var(--color-text-soft)", fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
                <span className="pat-codice" style={{ minWidth: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-md)", background: colorFor(idx), color: "var(--color-raised)", fontWeight: 750, fontSize: "0.6rem", padding: "0 5px", flexShrink: 0 }}>{c.key.slice(0, 6)}</span>
                <span className="pat-main">
                  <span className="pat-nome">{c.nome}</span>
                  <span className="pat-bar" style={{ display: "block", height: 4, borderRadius: 2, marginTop: 5, background: `linear-gradient(to right, ${colorFor(idx)} ${larghezza}%, rgba(0,0,0,0.07) ${larghezza}%)` }} />
                </span>
                <span className="pat-valore" style={{ fontWeight: 750, fontVariantNumeric: "tabular-nums", fontSize: "0.88rem", whiteSpace: "nowrap", flexShrink: 0 }}>{exactNumber(v)}</span>
                <span
                  className="pat-delta"
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    color: deltaPos ? "var(--color-accent)" : "var(--color-success)",
                    background: deltaPos ? "var(--color-accent-soft)" : "var(--color-success-soft)",
                    border: "1px solid transparent",
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {deltaPos ? "+" : ""}{exactNumber(Math.abs(delta))} ({deltaPerc !== null ? (deltaPos ? "+" : "") + deltaPerc.toFixed(1) + "%" : "n.d."})
                </span>
                <span className="pat-freccia" style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }} aria-hidden="true">▾</span>
              </button>

              {isOpen && (
                <div ref={dettaglioRef} style={{ borderTop: "1px solid var(--color-divider)", padding: "var(--space-3) var(--space-4)", background: "var(--color-raised)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                    <span style={{ color: "var(--color-accent)" }}>{c.key}</span> · {c.nome}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-2)" }}>
                    {righeDettaglio(c).map((r) => (
                      <div key={r.label} style={{ fontSize: "0.82rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{r.label}</div>
                        <div style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{r.valore}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: "0.82rem", gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Ripartizione di genere</div>
                      <div style={{ marginTop: 4 }}><QuotaGenere maschi={c.maschi} femmine={c.femmine} /></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="source-note">
        Raggruppamento clinico dei codici ICD-10 presenti nel dataset INAIL delle denunce protocollate. Le barre
        mostrano le denunce del I semestre 2026; il badge accanto riporta la variazione assoluta e percentuale
        rispetto allo stesso semestre del 2025. Le patologie muscolo-scheletriche (capitolo M) dominano il quadro;
        i tumori professionali e le patologie da polveri emergono per gravità anche se numericamente minori.
      </p>
    </div>
  );
}