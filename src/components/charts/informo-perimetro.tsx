"use client";

import type { CSSProperties } from "react";
import { ACCENT } from "@/lib/palette";
import { INFORM_GRAVI_COLOR, type PerimetroQuery } from "@/lib/informo-casi";

interface Props {
  value: PerimetroQuery;
  onChange: (next: PerimetroQuery) => void;
}

// Colore del pulsante attivo = colore della serie che controlla (RULES.md Regola 4).
// I due toggle sono indipendenti: selezionabili insieme (entrambi gli archivi)
// o singolarmente. Mai nessuno dei due acceso.
const PERIMETRO_COLORS = {
  mortali: ACCENT,
  gravi: INFORM_GRAVI_COLOR,
} as const;

export function InformoPerimetro({ value, onChange }: Props) {
  const base: CSSProperties = {
    border: "1px solid var(--color-text)",
    borderRadius: 2,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 600,
    fontSize: "0.85rem",
    padding: "6px 14px",
    background: "var(--color-raised)",
  };

  const stile = (attivo: boolean, colore: string): CSSProperties => ({
    ...base,
    background: attivo ? colore : "var(--color-raised)",
    color: attivo ? "var(--color-raised)" : colore,
    borderColor: attivo ? colore : "var(--color-text)",
  });

  // Allo spegnimento dell'unico toggle acceso, riattiva l'altro: il perimetro
  // deve sempre contenere almeno un archivio.
  const toggle = (chiave: "mortali" | "gravi", attivo: boolean) => {
    const next = { ...value, [chiave]: attivo };
    if (!next.mortali && !next.gravi) {
      const altro = chiave === "mortali" ? "gravi" : "mortali";
      next[altro] = true;
    }
    onChange(next);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => toggle("mortali", !value.mortali)}
        style={stile(value.mortali, PERIMETRO_COLORS.mortali)}
        aria-pressed={value.mortali}
      >
        {value.mortali ? "✓ " : ""}
        Infortuni mortali
      </button>
      <button
        type="button"
        onClick={() => toggle("gravi", !value.gravi)}
        style={stile(value.gravi, PERIMETRO_COLORS.gravi)}
        aria-pressed={value.gravi}
      >
        {value.gravi ? "✓ " : ""}
        Infortuni gravi
      </button>
    </div>
  );
}