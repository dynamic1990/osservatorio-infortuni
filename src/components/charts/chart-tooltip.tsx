"use client";

import type { ReactNode } from "react";
import { exactNumber, percent } from "@/lib/format";

/**
 * Tooltip di default per grafici a barre/aree con distribuzione.
 * Mostra, per ogni voce della serie, il valore assoluto e la % sul totale della
 * riga (composizione). Se `total` non è passato, usa `totalKey` della riga,
 * altrimenti somma i valori del payload visibile.
 *
 * Uso in un grafico Recharts:
 *   <Tooltip content={({ active, payload, label }) => (
 *     <ChartTooltip active={active} payload={payload} label={label}
 *       labelFormatter={(l) => `Anno ${l}`} />
 *   )} />
 *
 * Le prop sono volutamente larghe (unknown) per essere assegnabili ai tipi
 * Recharts senza cast.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  totalKey,
  total,
  formatter,
  extra,
  excludeKeys,
  showPercent = true,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: unknown;
    value?: unknown;
    dataKey?: unknown;
    payload?: Record<string, unknown>;
    color?: unknown;
  }>;
  label?: unknown;
  /** trasforma l'etichetta della riga (es. "Anno 2025") */
  labelFormatter?: (label: unknown, payload: Record<string, unknown>) => ReactNode;
  /** chiave del totale dentro ogni riga (se la riga ha già un totale, es. "totale") */
  totalKey?: string;
  /** denominatore esplicito per le % (default: somma dei payload visibili) */
  total?: number;
  /** formatter per il valore assoluto (default: exactNumber) */
  formatter?: (value: number) => string;
  /** righe extra in fondo al tooltip (es. totale condiviso) */
  extra?: (payload: Record<string, unknown>) => ReactNode;
  /** serie da escludere dall'elenco (es. la linea "totale" già mostrata a parte) */
  excludeKeys?: ReadonlyArray<string>;
  /** mostra la % sul totale accanto al valore (default: true) */
  showPercent?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload as Record<string, unknown> | undefined;
  if (!row) return null;

  const fmt = formatter ?? exactNumber;
  const visible = payload.filter(
    (p) => !excludeKeys?.includes(String(p.dataKey ?? p.name))
  );
  const totale =
    total !== undefined
      ? total
      : totalKey && typeof row[totalKey] === "number"
      ? (row[totalKey] as number)
      : visible.reduce<number>((acc, p) => {
          const v = Number(p.value ?? 0);
          return acc + (Number.isFinite(v) ? v : 0);
        }, 0);

  return (
    <div className="custom-chart-tooltip">
      <div className="tooltip-title">
        {labelFormatter ? labelFormatter(label, row) : String(label ?? "")}
      </div>
      {visible.map((p, i) => {
        const v = Number(p.value ?? 0);
        if (!Number.isFinite(v)) return null;
        const quota = totale > 0 ? (v / totale) * 100 : 0;
        const color = typeof p.color === "string" ? p.color : undefined;
        return (
          <div className="tooltip-row" key={`${String(p.dataKey ?? p.name)}-${i}`}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {color ? (
                <i
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    display: "inline-block",
                    background: color,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
              ) : null}
              {String(p.name ?? "")}
            </span>
            <strong>
              {fmt(v)}
              {showPercent && totale > 0 ? (
                <span style={{ color: "var(--color-text-muted)", fontWeight: 550 }}>
                  {" "}
                  ({percent(quota / 100, 1)})
                </span>
              ) : null}
            </strong>
          </div>
        );
      })}
      {extra ? extra(row) : null}
    </div>
  );
}

/** Versione con riga extra "Totale" in fondo, per le distribuzioni. */
export function ChartTooltipWithTotal({
  active,
  payload,
  label,
  labelFormatter,
  extra,
  excludeKeys,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: unknown;
    value?: unknown;
    dataKey?: unknown;
    payload?: Record<string, unknown>;
    color?: unknown;
  }>;
  label?: unknown;
  labelFormatter?: (label: unknown, payload: Record<string, unknown>) => ReactNode;
  extra?: (payload: Record<string, unknown>) => ReactNode;
  excludeKeys?: ReadonlyArray<string>;
}) {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      labelFormatter={labelFormatter}
      excludeKeys={excludeKeys}
      extra={(row) => {
        const totale = (payload ?? [])
          .filter((p) => !excludeKeys?.includes(String(p.dataKey ?? p.name)))
          .reduce<number>((acc, p) => {
            const v = Number(p.value ?? 0);
            return acc + (Number.isFinite(v) ? v : 0);
          }, 0);
        return (
          <>
            {extra ? extra(row) : null}
            <div
              className="tooltip-row"
              style={{ marginTop: 4, borderTop: "1px solid var(--color-divider)", paddingTop: 4 }}
            >
              <span>Totale</span>
              <strong>{exactNumber(totale)}</strong>
            </div>
          </>
        );
      }}
    />
  );
}