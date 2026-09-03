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
  LabelList,
} from "recharts";
import { getVigilanzaData, type TipologieViolazioni } from "@/lib/vigilanza";
import { exactNumber } from "@/lib/format";

const TIPOLOGIE: { key: keyof TipologieViolazioni; nome: string }[] = [
  { key: "violazioniSicurezza", nome: "Violazioni salute e sicurezza (penali)" },
  { key: "violazioniAmministrative", nome: "Violazioni amministrative (altre)" },
  { key: "lavoroNero", nome: "Lavoratori in nero" },
  { key: "interpositori", nome: "Fenomeni interpositori" },
  { key: "violazioniPenaliAltre", nome: "Violazioni penali (altre)" },
  { key: "orarioLavoro", nome: "Violazioni orario di lavoro" },
  { key: "autotrasportoCE", nome: "Autotrasporto (Reg. CE 561/2006)" },
  { key: "riqualificazione", nome: "Riqualificazione rapporti di lavoro" },
  { key: "caporalato", nome: "Caporalato / sfruttamento (art. 603-bis c.p.)" },
  { key: "autotrasporto234", nome: "Autotrasporto (D.Lgs. 234/2007)" },
  { key: "minori", nome: "Violazioni tutela minori" },
  { key: "distacco", nome: "Distacco transnazionale" },
  { key: "madri", nome: "Violazioni lavoratrici madri" },
];

const formatEtichetta = (v: unknown): string => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 0 })} k`;
  return String(n);
};

export function VigilanzaTipologieWidget() {
  const dati = useMemo(() => getVigilanzaData(), []);
  const anni = useMemo(
    () => (dati.tipologie ?? []).map((t) => t.anno).sort((a, b) => b - a),
    [dati]
  );
  const [anno, setAnno] = useState<number>(anni[0] ?? 2025);

  const chartData = useMemo(() => {
    const riga = (dati.tipologie ?? []).find((t) => t.anno === anno);
    if (!riga) return [];
    return TIPOLOGIE.map((t) => ({ nome: t.nome, valore: Number(riga[t.key] ?? 0) }))
      .filter((r) => r.valore > 0)
      .sort((a, b) => b.valore - a.valore);
  }, [dati, anno]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Le violazioni registrate nell&apos;anno {anno}
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {anni.map((a) => (
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "btn-pill-accent active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: Math.max(340, chartData.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 52, bottom: 0, left: 8 }} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatEtichetta} />
            <YAxis
              type="category"
              dataKey="nome"
              width={220}
              tick={{ fontSize: 11.5 }}
              tickFormatter={(v: string) => (v.length > 34 ? `${v.slice(0, 34)}…` : v)}
            />
            <Tooltip
              formatter={(val, name) => [exactNumber(Number(val ?? 0)), String(name)]}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{ maxWidth: 260 }}
            />
            <Bar dataKey="valore" name="Violazioni / illeciti" fill="#1f6fb2" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              <LabelList dataKey="valore" position="right" formatter={formatEtichetta} style={{ fontSize: 10.5, fill: "#57534e" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Fonte: INL, tabella <em>“Principali fenomeni indagati”</em> dei Rapporti annuali sull&apos;attività di vigilanza.
        Le voci <strong>lavoratori in nero</strong>, <strong>caporalato</strong> e <strong>fenomeni interpositori</strong>
        contano i lavoratori cui si riferiscono gli atti ispettivi, le altre contano le violazioni accertate per ciascuna
        disciplina. La voce <em>violazioni salute e sicurezza</em> include le violazioni penali D.Lgs. 81/2008; la crescita
        dal 2023 riflette anche il potenziamento dell&apos;azione ispettiva. Nel 2021 la colonna “orario di lavoro” non era
        rilevata separatamente (valore non disponibile).
      </p>
    </div>
  );
}