"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

type Vista = "violazioni" | "nero" | "irregolari";

const VISTE: Record<Vista, { label: string; dataKey: string; nome: string; colore: string }> = {
  violazioni: { label: "Violazioni sicurezza", dataKey: "violazioniSicurezza", nome: "Violazioni penali salute e sicurezza", colore: "var(--color-accent)" },
  nero: { label: "Lavoro nero", dataKey: "lavoratoriInNero", nome: "Lavoratori totalmente in nero", colore: "var(--color-warning)" },
  irregolari: { label: "Lavoratori irregolari", dataKey: "lavoratoriIrregolari", nome: "Lavoratori irregolari (INL+INPS+INAIL)", colore: "var(--color-link)" },
};

export function VigilanzaViolazioniWidget() {
  const dati = useMemo(() => getVigilanzaData(), []);
  const [vista, setVista] = useState<Vista>("violazioni");

  const chartData = useMemo(() => {
    const serie = [...dati.serie].sort((a, b) => a.anno - b.anno);
    return serie.map((s) => ({
      anno: String(s.anno),
      valore: Number(s[vista === "violazioni" ? "violazioniSicurezza" : vista === "nero" ? "lavoratoriInNero" : "lavoratoriIrregolari"] ?? 0),
    }));
  }, [dati, vista]);

  const v = VISTE[vista];

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{v.nome}</div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {(Object.keys(VISTE) as Vista[]).map((k) => (
            <button
              key={k}
              onClick={() => setVista(k)}
              className={`btn-pill ${vista === k ? "active" : ""}`}
              style={vista === k ? { background: VISTE[k].colore, borderColor: VISTE[k].colore, color: "var(--color-raised)" } : undefined}
            >
              {VISTE[k].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 18, right: 8, bottom: 16, left: 4 }} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={54} tickFormatter={formatEtichetta} />
            <Tooltip formatter={(val, name) => [exactNumber(Number(val ?? 0)), String(name)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
            <Bar dataKey="valore" name={v.nome} fill={v.colore} radius={[3, 3, 0, 0]} maxBarSize={64} isAnimationActive={false}>
              <LabelList dataKey="valore" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "var(--color-text-soft)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Fonte: INL, <em>Rapporti annuali sull&apos;attività di vigilanza</em> (2021-2025). Le <strong>violazioni penali in materia
        di salute e sicurezza</strong> sono quelle accertate dal personale ispettivo nell&apos;ambito del D.Lgs. 81/2008 (la serie
        2021-2022 si riferisce alle violazioni penali contestate, da confrontare con le note metodologiche di ciascun rapporto).
        I <strong>lavoratori totalmente in nero</strong> sono quelli privi di qualsivoglia documentazione obbligatoria; i
        <strong>lavoratori irregolari</strong> sono il totale complessivo INL+INPS+INAIL (dal 2022; per il 2021 il dato non è
        pubblicato in forma aggregata). I valori riflettono l&apos;attività ispettiva svolta e la programmazione dei controlli:
        non sono misure della diffusione assoluta del fenomeno.
      </p>
    </div>
  );
}