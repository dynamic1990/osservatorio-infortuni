"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";
import { getVigilanzaData } from "@/lib/vigilanza";
import { exactNumber } from "@/lib/format";

const formatEtichetta = (v: unknown): string => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 0 })} k`;
  return String(n);
};

type Vista = "controlli" | "sospensioni";

export function VigilanzaTrendWidget() {
  const dati = useMemo(() => getVigilanzaData(), []);
  const [vista, setVista] = useState<Vista>("controlli");

  const chartData = useMemo(() => {
    const serie = [...dati.serie].sort((a, b) => a.anno - b.anno);
    return serie.map((s) => ({
      anno: String(s.anno),
      controlli: s.controlliAvviati,
      sospensioni: s.sospensioni,
      sospensioniSicurezza: s.sospensioniSicurezza,
      // resto = sospensioni non per gravi violazioni SSL (per la pila)
      sospensioniResto:
        s.sospensioni - (s.sospensioniSicurezza ?? 0) >= 0
          ? s.sospensioni - (s.sospensioniSicurezza ?? 0)
          : 0,
      tassoIrregolarita: s.tassoIrregolarita,
    }));
  }, [dati]);

  const isSospensioni = vista === "sospensioni";

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          {isSospensioni ? "Provvedimenti di sospensione dell'attività imprenditoriale" : "Controlli avviati e tasso di irregolarità"}
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {(["controlli", "sospensioni"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`btn-pill ${vista === v ? "active" : ""}`}
            >
              {v === "controlli" ? "Controlli" : "Sospensioni"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 18, right: 8, bottom: 16, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="bar" tick={{ fontSize: 11 }} width={54} tickFormatter={formatEtichetta} />
            <YAxis yAxisId="line" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} width={42} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload as Record<string, unknown>;
                const v = Number(row[isSospensioni ? "sospensioni" : "controlli"] ?? 0);
                const tasso = row.tassoIrregolarita;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    {isSospensioni ? (
                      <>
                        <div className="tooltip-row">
                          <span>Sospensioni totali:</span>
                          <strong>{exactNumber(v)}</strong>
                        </div>
                        <div className="tooltip-row">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <i aria-hidden="true" style={{ width: 8, height: 8, display: "inline-block", background: "#f36458", borderRadius: 2 }} />
                            di cui gravi violazioni SSL:
                          </span>
                          <strong>
                            {exactNumber(Number(row.sospensioniSicurezza ?? 0))}{" "}
                            <span style={{ color: "var(--color-text-muted)", fontWeight: 550 }}>
                              ({v > 0 ? Math.round((Number(row.sospensioniSicurezza ?? 0) * 100) / v) : 0}%)
                            </span>
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="tooltip-row">
                          <span>Controlli avviati:</span>
                          <strong>{exactNumber(v)}</strong>
                        </div>
                        <div className="tooltip-row">
                          <span>Tasso di irregolarità:</span>
                          <strong>{String(tasso ?? "")}%</strong>
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
            {isSospensioni ? (
              <>
                {/* pila: in basso il "di cui" in evidenza, sopra il resto (neutro) */}
                <Bar yAxisId="bar" dataKey="sospensioniSicurezza" name="di cui gravi violazioni SSL" stackId="sosp" fill="#f36458" radius={[0, 0, 0, 0]} maxBarSize={46} isAnimationActive={false} />
                <Bar yAxisId="bar" dataKey="sospensioniResto" name="Altre sospensioni" stackId="sosp" fill="#057dbc" radius={[3, 3, 0, 0]} maxBarSize={46} isAnimationActive={false}>
                  <LabelList dataKey="sospensioni" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "#757575" }} />
                </Bar>
              </>
            ) : (
              <>
                <Bar yAxisId="bar" dataKey="controlli" name="Controlli avviati (INL+INPS+INAIL)" fill="#057dbc" radius={[3, 3, 0, 0]} maxBarSize={46} isAnimationActive={false}>
                  <LabelList dataKey="controlli" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "#757575" }} />
                </Bar>
                <Line yAxisId="line" type="monotone" dataKey="tassoIrregolarita" name="Tasso di irregolarità" stroke="#f36458" strokeWidth={2.5} dot={{ r: 4, fill: "#f36458" }} isAnimationActive={false} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Fonte: INL, <em>Rapporti annuali sull&apos;attività di vigilanza in materia di lavoro e previdenziale</em> (2021-2025).
        I controlli avviati includono le ispezioni del personale INL (compresi i Carabinieri per la Tutela del Lavoro),
        INPS e INAIL, oltre a verifiche e accertamenti tecnici. Il tasso di irregolarità è il rapporto tra ispezioni
        definite con esito irregolare e totale delle ispezioni definite. Le sospensioni sono i provvedimenti adottati
        ai sensi dell&apos;art. 14 D.Lgs. 81/2008; la quota per gravi violazioni in materia di sicurezza segue l&apos;allegato I
        del Testo Unico.
      </p>
    </div>
  );
}