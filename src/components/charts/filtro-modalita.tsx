import type { CSSProperties } from "react";
import { MODAL_COLORS } from "@/lib/palette";

export interface ModalitaState {
  lavoro: boolean;
  itinere: boolean;
}

interface Props {
  value: ModalitaState;
  onChange: (next: ModalitaState) => void;
  size?: "sm" | "md";
}

// Il colore del pulsante attivo è lo stesso della serie che controlla (RULES.md Regola 4).
// "In occasione di lavoro" usa MODAL_COLORS.lavoro, "In itinere" MODAL_COLORS.itinere.
export function FiltroModalita({ value, onChange, size = "md" }: Props) {
  const fontsize = size === "sm" ? "0.78rem" : "0.85rem";
  const padding = size === "sm" ? "4px 10px" : "6px 14px";
  const nienteAttivo = !value.lavoro && !value.itinere;

  const toggle = (k: "lavoro" | "itinere") => {
    if (value.lavoro && value.itinere) {
      onChange({ ...value, [k]: false });
    } else if (value[k]) {
      const altro = k === "lavoro" ? "itinere" : "lavoro";
      onChange({ ...value, [k]: false, [altro]: true });
    } else {
      onChange({ ...value, [k]: true });
    }
  };

  const base: CSSProperties = {
    border: "1px solid var(--color-text)",
    borderRadius: 2,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 600,
    fontSize: fontsize,
    padding,
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
      <button
        type="button"
        onClick={() => toggle("lavoro")}
        style={stile(value.lavoro, MODAL_COLORS.lavoro)}
        aria-pressed={value.lavoro}
      >
        {value.lavoro ? "✓ " : ""}In occasione di lavoro
      </button>
      <button
        type="button"
        onClick={() => toggle("itinere")}
        style={stile(value.itinere, MODAL_COLORS.itinere)}
        aria-pressed={value.itinere}
      >
        {value.itinere ? "✓ " : ""}In itinere
      </button>
      {nienteAttivo ? (
        <span style={{ fontSize: "0.72rem", color: "var(--color-accent)" }}>
          seleziona almeno una modalità
        </span>
      ) : null}
    </div>
  );
}
