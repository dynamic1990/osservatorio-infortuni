"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { ItalyMap } from "@/components/charts/italy-map";
import { exactNumber } from "@/lib/format";
import { MAP_SCALE } from "@/lib/palette";

export function MalattieRegioniWidget() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);
  const [selected, setSelected] = useState<string | null>(null);

  const regioni = useMemo(() => {
    return [...dati.regioni].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  }, [dati]);

  const valoriRegioni = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of dati.regioni) map[r.codice] = r.totale;
    return map;
  }, [dati]);

  const sel = selected ? dati.regioni.find((r) => r.codice === selected) : null;

  const ranking = useMemo(() => [...dati.regioni].sort((a, b) => b.totale - a.totale), [dati]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Denunce per regione (sede INAIL di protocollazione)
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          Tocca una regione sulla mappa per il dettaglio
        </div>
      </div>

      <div className="grid-map-panel">
        <div style={{ minWidth: 0 }}>
          <ItalyMap
            regions={valoriRegioni}
            onSelect={setSelected}
            selected={selected}
            title=""
          />
        </div>

        <div style={{ minWidth: 0, display: "grid", gap: "var(--space-3)" }}>
          {sel && (
            <div
              style={{
                background: "var(--color-accent-soft)",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
                fontSize: "0.85rem",
              }}
            >
              <strong>{sel.nome}</strong> · {exactNumber(sel.totale)} denunce nel periodo
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>I sem 2025</div>
                  <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(sel.anno2025)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-soft)", textTransform: "uppercase" }}>I sem 2026</div>
                  <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(sel.anno2026)}</div>
                </div>
              </div>
              {sel.deltaPerc !== null && (
                <div style={{ marginTop: "var(--space-2)", fontSize: "0.8rem" }}>
                  Variazione:{" "}
                  <strong style={{ color: (sel.deltaPerc ?? 0) >= 0 ? "var(--color-accent)" : "var(--color-success)" }}>
                    {(sel.deltaPerc ?? 0) >= 0 ? "+" : ""}{(sel.deltaPerc ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%
                  </strong>
                </div>
              )}
            </div>
          )}

          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}>
            {ranking.map((r, idx) => {
              const colorIdx = Math.min(MAP_SCALE.length - 1, Math.floor((r.totale / (ranking[0]?.totale || 1)) * (MAP_SCALE.length - 1)));
              return (
                <button
                  key={r.codice}
                  type="button"
                  onClick={() => setSelected(selected === r.codice ? null : r.codice)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    width: "100%",
                    padding: "7px 10px",
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    background: selected === r.codice ? "var(--color-accent-soft)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    font: "inherit",
                    fontSize: "0.82rem",
                    color: "var(--color-text)",
                  }}
                >
                  <span style={{ minWidth: 18, fontSize: "0.7rem", color: "var(--color-text-soft)", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: MAP_SCALE[colorIdx],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontWeight: 550 }}>{r.nome}</span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(r.totale)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="source-note">
        La ripartizione per regione si basa sulla <strong>sede INAIL competente per la protocollazione</strong> della
        denuncia (dove il caso è gestito amministrativamente), non sul luogo di lavoro o sulla residenza del lavoratore:
        le regioni con sedi dedicate alla gestione dei grandi volumi (es. Toscana, Puglia, Abruzzo) possono risultare
        sovrarappresentate. Il dato va letto come indicatore dell&apos;attività di denuncia, non della distribuzione
        territoriale del rischio.
      </p>
    </div>
  );
}
