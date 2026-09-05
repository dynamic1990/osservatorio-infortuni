"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getVigilanzaData, type TipologieViolazioni } from "@/lib/vigilanza";
import { exactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";

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

// Numero massimo di fette mostrate singolarmente: il resto confluisce in "Altre tipologie"
const MAX_FETTE = 6;

export function VigilanzaTipologieWidget() {
  const dati = useMemo(() => getVigilanzaData(), []);
  const anni = useMemo(
    () => (dati.tipologie ?? []).map((t) => t.anno).sort((a, b) => b - a),
    [dati]
  );
  const [anno, setAnno] = useState<number>(anni[0] ?? 2025);

  const { fette, totale } = useMemo(() => {
    const riga = (dati.tipologie ?? []).find((t) => t.anno === anno);
    if (!riga) return { fette: [], totale: 0 };
    const voci = TIPOLOGIE.map((t) => ({
      nome: t.nome,
      valore: Number(riga[t.key] ?? 0),
    }))
      .filter((r) => r.valore > 0)
      .sort((a, b) => b.valore - a.valore);
    const tot = voci.reduce((a, r) => a + r.valore, 0);
    if (voci.length <= MAX_FETTE) return { fette: voci, totale: tot };

    const principali = voci.slice(0, MAX_FETTE - 1);
    const resto = voci.slice(MAX_FETTE - 1).reduce((a, r) => a + r.valore, 0);
    return { fette: [...principali, { nome: "Altre tipologie", valore: resto }], totale: tot };
  }, [dati, anno]);

  const perc = (v: number) => (totale > 0 ? (v / totale) * 100 : 0);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Composizione delle violazioni registrate nell&apos;anno {anno}
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {anni.map((a) => (
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)", alignItems: "center" }}>
        {/* Grafico ad anello */}
        <div style={{ width: "100%", height: 320, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fette}
                dataKey="valore"
                nameKey="nome"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={105}
                paddingAngle={1.5}
                isAnimationActive={false}
                stroke="var(--color-surface)"
                strokeWidth={2}
                labelLine={false}
                label={(entry: any) => {
                  const v = Number(entry?.valore ?? 0);
                  const p = totale > 0 ? (v / totale) * 100 : 0;
                  if (p < 7) return "";
                  return (
                    <text x={entry?.x} y={entry?.y} fill="var(--color-raised)" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">
                      {`${p.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`}
                    </text>
                  );
                }}
              >
                {fette.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [
                  `${exactNumber(Number(val ?? 0))} (${perc(Number(val ?? 0)).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%)`,
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Totale {anno}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)" }}>
              {exactNumber(totale)}
            </div>
          </div>
        </div>

        {/* Legenda con percentuali, fuori dal grafico */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {fette.map((f, i) => (
            <div
              key={f.nome}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontSize: "0.84rem",
                padding: "6px 10px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-divider)",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: PALETTE[i % PALETTE.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontWeight: 550, lineHeight: 1.35 }}>{f.nome}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(f.valore)}</span>
              <span style={{ width: 64, textAlign: "right", color: "var(--color-text-soft)", fontVariantNumeric: "tabular-nums" }}>
                {perc(f.valore).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="source-note">
        Fonte: INL, tabella <em>“Principali fenomeni indagati”</em> dei Rapporti annuali sull&apos;attività di vigilanza.
        Le voci <strong>lavoratori in nero</strong>, <strong>caporalato</strong> e <strong>fenomeni interpositori</strong>
        contano i lavoratori cui si riferiscono gli atti ispettivi, le altre contano le violazioni accertate per
        disciplina. La voce <em>violazioni salute e sicurezza</em> include le violazioni penali D.Lgs. 81/2008; la
        crescita dal 2023 riflette anche il potenziamento dell&apos;azione ispettiva. Nel 2021 la colonna “orario di
        lavoro” non era rilevata separatamente (valore non disponibile). Le tipologie oltre la sesta in ordine di
        grandezza sono aggregate nella voce <em>Altre tipologie</em>.
      </p>
    </div>
  );
}