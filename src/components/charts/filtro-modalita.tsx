import type { CSSProperties } from "react";

export interface ModalitaState {
  lavoro: boolean;
  itinere: boolean;
}

interface Props {
  value: ModalitaState;
  onChange: (next: ModalitaState) => void;
  size?: "sm" | "md";
}

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
    border: "1px solid var(--color-divider)",
    borderRadius: 999,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 600,
    fontSize: fontsize,
    padding,
  };

  const activeStyle: CSSProperties = {
    ...base,
    background: "var(--color-text)",
    color: "#ffffff",
    borderColor: "var(--color-text)",
  };
  const inactiveStyle: CSSProperties = {
    ...base,
    background: "var(--color-surface)",
    color: "var(--color-text)",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => toggle("lavoro")}
        style={value.lavoro ? activeStyle : inactiveStyle}
        aria-pressed={value.lavoro}
      >
        {value.lavoro ? "✓ " : ""}In occasione di lavoro
      </button>
      <button
        type="button"
        onClick={() => toggle("itinere")}
        style={value.itinere ? activeStyle : inactiveStyle}
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