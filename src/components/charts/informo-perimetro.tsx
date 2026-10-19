"use client";

import type { CSSProperties } from "react";
import { ACCENT } from "@/lib/palette";
import { INFORM_GRAVI_COLOR, type PerimetroInformo } from "@/lib/informo-casi";

interface Props {
  value: PerimetroInformo;
  onChange: (next: PerimetroInformo) => void;
}

// Colore del pulsante attivo = colore della serie che controlla (RULES.md Regola 4).
// "Solo infortuni mortali" usa l'accento rosso semantico, "Solo infortuni gravi"
// il canale secondario slate; "Mortali e gravi" li affianca (entrambe le serie).
const PERIMETRO_COLORS: Record<PerimetroInformo, string> = {
  mortali: ACCENT,
  gravi: INFORM_GRAVI_COLOR,
  entrambi: "#1a1a1a",
};

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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      {(
        [
          { id: "mortali", label: "Solo infortuni mortali" },
          { id: "gravi", label: "Solo infortuni gravi" },
          { id: "entrambi", label: "Mortali e gravi" },
        ] as { id: PerimetroInformo; label: string }[]
      ).map((op) => (
        <button
          key={op.id}
          type="button"
          onClick={() => onChange(op.id)}
          style={stile(value === op.id, PERIMETRO_COLORS[op.id])}
          aria-pressed={value === op.id}
        >
          {value === op.id ? "✓ " : ""}
          {op.label}
        </button>
      ))}
    </div>
  );
}
