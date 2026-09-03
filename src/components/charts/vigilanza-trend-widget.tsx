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
              className={`btn-pill ${vista === v ? "btn-pill-accent active" : ""}`}
            >
              {v === "controlli" ? "Controlli" : "Sospensioni"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 18, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="bar" tick={{ fontSize: 11 }} width={54} tickFormatter={formatEtichetta} />
            <YAxis yAxisId="line" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} width={42} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(val, name) => {
                const v = Number(val ?? 0);
                if (name === "Tasso di irregolarità") return [`${v.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`, String(name)];
                return [exactNumber(v), String(name)];
              }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 10, fontSize: "0.8rem" }} />
            {isSospensioni ? (
              <>
                <Bar yAxisId="bar" dataKey="sospensioni" name="Sospensioni totali" fill="#1f6fb2" radius={[3, 3, 0, 0]} maxBarSize={46} isAnimationActive={false}>
                  <LabelList dataKey="sospensioni" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "#78716c" }} />
                </Bar>
                <Bar yAxisId="bar" dataKey="sospensioniSicurezza" name="di cui per gravi violazioni sicurezza" fill="#b3261e" radius={[3, 3, 0, 0]} maxBarSize={46} isAnimationActive={false} />
              </>
            ) : (
              <>
                <Bar yAxisId="bar" dataKey="controlli" name="Controlli avviati (INL+INPS+INAIL)" fill="#1f6fb2" radius={[3, 3, 0, 0]} maxBarSize={46} isAnimationActive={false}>
                  <LabelList dataKey="controlli" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "#78716c" }} />
                </Bar>
                <Line yAxisId="line" type="monotone" dataKey="tassoIrregolarita" name="Tasso di irregolarità" stroke="#b3261e" strokeWidth={2.5} dot={{ r: 4, fill: "#b3261e" }} isAnimationActive={false} />
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