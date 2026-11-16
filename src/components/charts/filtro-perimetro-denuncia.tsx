import type { CSSProperties } from "react";

/**
 * Perimetro delle denunce: include o esclude i casi in franchigia legale.
 *
 * Distinzione normativa (art. 54 D.Lgs. 81/2008):
 *  - DENUNCIA: obbligatoria quando la prognosi supera i 3 giorni (escluso quello
 *    dell'evento). E' l'atto che apre la pratica assicurativa.
 *  - COMUNICAZIONE: obbligatoria per gli infortuni con assenza di almeno un
 *    giorno (escluso quello dell'evento), a fini statistici e informativi al SINP.
 *    Sotto i 3 giorni resta solo la comunicazione: sono i casi che l'INAIL
 *    classifica in franchigia (codice F).
 *
 * Il totale che l'INAIL pubblica e che l'Osservatorio mostra di default comprende
 * entrambi. Questo filtro permette di leggere i due perimetri separatamente.
 */
export interface PerimetroDenunciaState {
  /** Casi con assenza superiore a 3 giorni: denuncia obbligatoria (esito P, N, I). */
  denunce: boolean;
  /** Casi con assenza fino a 3 giorni: sola comunicazione statistica (esito F). */
  comunicazioni: boolean;
}

interface Props {
  value: PerimetroDenunciaState;
  onChange: (next: PerimetroDenunciaState) => void;
  size?: "sm" | "md";
}

export function FiltroPerimetroDenuncia({ value, onChange, size = "md" }: Props) {
  const fontsize = size === "sm" ? "0.78rem" : "0.85rem";
  const padding = size === "sm" ? "4px 10px" : "6px 14px";
  const nienteAttivo = !value.denunce && !value.comunicazioni;
  const tutti = value.denunce && value.comunicazioni;

  const toggle = (k: keyof PerimetroDenunciaState) => {
    if (tutti) {
      onChange({ ...value, [k]: false });
    } else if (value[k]) {
      const altro: keyof PerimetroDenunciaState = k === "denunce" ? "comunicazioni" : "denunce";
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

  const stile = (attivo: boolean): CSSProperties => ({
    ...base,
    background: attivo ? "var(--color-text)" : "var(--color-raised)",
    color: attivo ? "var(--color-raised)" : "var(--color-text)",
    borderColor: "var(--color-text)",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>
        Perimetro:
      </span>
      <button
        type="button"
        onClick={() => toggle("denunce")}
        style={stile(value.denunce)}
        aria-pressed={value.denunce}
        title="Infortuni con prognosi oltre 3 giorni: denuncia obbligatoria all'INAIL"
      >
        {value.denunce ? "✓ " : ""}Denunce (oltre 3 gg)
      </button>
      <button
        type="button"
        onClick={() => toggle("comunicazioni")}
        style={stile(value.comunicazioni)}
        aria-pressed={value.comunicazioni}
        title="Infortuni con assenza fino a 3 giorni: comunicazione statistica, senza denuncia obbligatoria"
      >
        {value.comunicazioni ? "✓ " : ""}Comunicazioni (fino a 3 gg)
      </button>
      {nienteAttivo ? (
        <span style={{ fontSize: "0.72rem", color: "var(--color-accent)" }}>
          seleziona almeno un perimetro
        </span>
      ) : null}
    </div>
  );
}
