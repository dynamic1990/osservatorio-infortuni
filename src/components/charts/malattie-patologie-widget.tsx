"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
  const [anno, setAnno] = useState<"2025" | "2026">("2026");
  const dettaglioRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAperto(null);
  }, [anno]);

  const categorie = useMemo(() => {
    return dati.categorie.filter((c) => c.key !== "ND" && c.key !== "ALTRO");
  }, [dati]);

  const maxCasi = Math.max(...categorie.map((c) => c[anno === "2025" ? "anno2025" : "anno2026"]), 1);

  const colorFor = (idx: number) => PALETTE[idx % PALETTE.length];

  const righeDettaglio = (c: (typeof categorie)[number]): RigaDettaglio[] => {
    const righe: RigaDettaglio[] = [];
    righe.push({ label: "Denunce I semestre", valore: `${exactNumber(c.anno2025)} (2025) · ${exactNumber(c.anno2026)} (2026)` });
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>Patologie denunciate per gruppo clinico (ICD-10)</div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {(["2025", "2026"] as const).map((a) => (
            <button key={a} onClick={() => setAnno(a)} className={`btn-pill ${anno === a ? "btn-pill-accent active" : ""}`}>
              I sem {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {categorie.map((c, idx) => {
          const isOpen = aperto === c.key;
          const v = c[anno === "2025" ? "anno2025" : "anno2026"];
          const larghezza = Math.max(6, Math.round((v / maxCasi) * 100));
          return (
            <div key={c.key} style={{ background: "var(--color-surface)", borderRadius: "6px", border: "1px solid var(--color-divider)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => toggle(c.key)}
                aria-expanded={isOpen}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", font: "inherit", color: "var(--color-text)" }}
              >
                <span style={{ minWidth: 22, fontSize: "0.72rem", fontWeight: 650, color: "var(--color-text-soft)", fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
                <span style={{ minWidth: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: colorFor(idx), color: "#ffffff", fontWeight: 750, fontSize: "0.6rem", padding: "0 4px" }}>{c.key.slice(0, 6)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 650, fontSize: "0.82rem" }}>{c.nome}</span>
                  <span style={{ display: "block", height: 4, borderRadius: 2, marginTop: 5, background: `linear-gradient(to right, ${colorFor(idx)} ${larghezza}%, rgba(0,0,0,0.07) ${larghezza}%)` }} />
                </span>
                <span style={{ fontWeight: 750, fontVariantNumeric: "tabular-nums", fontSize: "0.88rem", whiteSpace: "nowrap" }}>{exactNumber(v)}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} aria-hidden="true">▾</span>
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
        Raggruppamento clinico dei codici ICD-10 presenti nel dataset INAIL delle denunce protocollate. Le patologie
        muscolo-scheletriche (capitolo M) dominano il quadro; i tumori professionali e le patologie da polveri emergono
        per gravità anche se numericamente minori. I valori mostrati nelle barre si riferiscono al semestre selezionato.
      </p>
    </div>
  );
}
