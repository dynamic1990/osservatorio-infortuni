"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getIndiceIncidenza } from "@/lib/indice-incidenza";
import { regioneName } from "@/lib/labels";
import { PALETTE, MODAL_COLORS } from "@/lib/palette";

export function IndiceIncidenzaWidget() {
  const d = useMemo(() => getIndiceIncidenza(), []);
  const [anno, setAnno] = useState<number>(2024);

  // barre per regione nell'anno selezionato (ordinate per indice)
  const perRegione = useMemo(() => {
    return d.perRegione
      .filter((r) => r.anno === anno)
      .sort((a, b) => a.indice - b.indice)
      .map((r, i) => ({
        label: regioneName(r.regione),
        indice: r.indice,
        casi: r.casi,
        occupati: r.occupati,
        color: PALETTE[i % PALETTE.length],
      }));
  }, [d, anno]);

  const nazionale = d.nazionale.map((n) => ({
    anno: n.anno,
    indice: n.indice,
    mortali: n.indiceMortali,
  }));

  const rigaNaz = d.nazionale.find((n) => n.anno === anno);
  const anni = d.nazionale.map((n) => n.anno);

  return (
    <div>
      {/* KPI dell'anno selezionato */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <div>
          <div className="metric-label">Incidenza nazionale {anno}</div>
          <div className="metric">{rigaNaz?.indice.toLocaleString("it-IT", { maximumFractionDigits: 2 })}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>casi per 1.000 occupati</div>
        </div>
        <div>
          <div className="metric-label">Casi {anno}</div>
          <div className="metric">{rigaNaz?.casi.toLocaleString("it-IT")}</div>
        </div>
        <div>
          <div className="metric-label">Mortali per 1.000</div>
          <div className="metric">{rigaNaz?.indiceMortali.toLocaleString("it-IT", { maximumFractionDigits: 3 })}</div>
        </div>
      </div>

      {/* selettore anno */}
      <div style={{ marginBottom: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {anni.map((a) => (
          <button
            key={a}
            onClick={() => setAnno(a)}
            style={{
              border: "1px solid var(--color-divider)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: "0.85rem",
              cursor: "pointer",
              background: anno === a ? "var(--color-accent)" : "transparent",
              color: anno === a ? "#fff" : "inherit",
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)" }}>
        {/* trend nazionale */}
        <div>
          <h3 style={{ fontSize: "1rem" }}>Andamento nazionale (per 1.000 occupati)</h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={nazionale} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
                <XAxis dataKey="anno" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} domain={["auto", "auto"]} />
                <Tooltip formatter={(val, name) => [Number(val ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 2 }), String(name)]} />
                <Legend />
                <Bar dataKey="indice" name="Casi per 1.000 occ." fill={MODAL_COLORS.lavoro} isAnimationActive={false} />
                <Line type="monotone" dataKey="mortali" name="Mortali per 1.000 occ." stroke="#201e1d" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="source-note">
            Indice di incidenza = casi INAIL / occupati 15-64 (ISTAT/Eurostat) × 1.000. Il calo 2020-21 e il
            picco 2022 riflettono anche la dinamica dell&apos;occupazione e delle denunce post-Covid.
          </p>
        </div>

        {/* ranking regioni */}
        <div>
          <h3 style={{ fontSize: "1rem" }}>Regioni per incidenza ({anno})</h3>
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={perRegione} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(val, _name, item: any) => [
                    `${Number(val ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 2 })} per 1.000 · ${Number(item?.payload?.casi ?? 0).toLocaleString("it-IT")} casi`,
                    item?.payload?.label ?? "",
                  ]}
                />
                <Bar dataKey="indice" name="Indice" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                  {perRegione.map((r, i) => (
                    <Cell key={i} fill={r.color} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="source-note">
            Ranking regionale normalizzato per dimensione (occupati). Permette il confronto del rischio tra
            territori senza il bias dei numeri assoluti. Soglie: media nazionale {rigaNaz?.indice.toLocaleString("it-IT", { maximumFractionDigits: 2 })} per 1.000 nel {anno}.
          </p>
        </div>
      </div>
    </div>
  );
}