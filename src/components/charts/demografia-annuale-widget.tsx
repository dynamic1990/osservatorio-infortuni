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
} from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { genereName } from "@/lib/labels";
import { compactNumber, exactNumber, percent } from "@/lib/format";
import { PALETTE } from "@/lib/palette";

export function DemografiaAnnualeWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");

  const annoData = useMemo(() => {
    return multidim.perAnno[anno] || multidim.consolidatoTotale;
  }, [multidim, anno]);

  // Dati Genere
  const genereData = useMemo(() => {
    const totalGen = (annoData.generi["M"] || 0) + (annoData.generi["F"] || 0);
    const mortaliM = annoData.generiMortali?.["M"] || 0;
    const mortaliF = annoData.generiMortali?.["F"] || 0;
    
    return [
      {
        key: "M",
        name: "Uomini",
        casi: annoData.generi["M"] || 0,
        mortali: mortaliM,
        quota: totalGen > 0 ? ((annoData.generi["M"] || 0) / totalGen) * 100 : 0,
        fill: "#1f6fb2",
      },
      {
        key: "F",
        name: "Donne",
        casi: annoData.generi["F"] || 0,
        mortali: mortaliF,
        quota: totalGen > 0 ? ((annoData.generi["F"] || 0) / totalGen) * 100 : 0,
        fill: "#b0336b",
      },
    ];
  }, [annoData]);

  // Dati Fasce d'Età
  const etaData = useMemo(() => {
    const order = ["0-14", "15-24", "25-34", "35-49", "50-64", "65+"];
    const totalEta = Object.values(annoData.fasceEta).reduce((a, b) => a + b, 0);

    return order.map((f, i) => {
      const casi = annoData.fasceEta[f] || 0;
      const mort = annoData.fasceEtaMortali?.[f] || 0;
      return {
        fascia: f,
        casi,
        mortali: mort,
        quota: totalEta > 0 ? (casi / totalEta) * 100 : 0,
        fill: PALETTE[i % PALETTE.length],
      };
    });
  }, [annoData]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Selettore Anno */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: "var(--space-3)",
        }}
      >
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Distribuzione per Genere e Classi Anagrafiche ({anno})
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Anno:</span>
          {multidim.anniDisponibili.map((a) => (
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

      {/* Griglia a 2 colonne per Genere e Fasce d'età */}
      <div className="grid-split">
        {/* Blocco Genere */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
            Genere dell&apos;infortunato ({anno})
          </div>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genereData}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 4, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => compactNumber(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} width={65} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="custom-chart-tooltip">
                        <div className="tooltip-title">{p.name} ({anno})</div>
                        <div className="tooltip-row">
                          <span>Infortuni:</span>
                          <strong>{exactNumber(p.casi)} ({p.quota.toFixed(1)}%)</strong>
                        </div>
                        <div className="tooltip-row">
                          <span>Esiti mortali:</span>
                          <strong style={{ color: "#ff8b80" }}>{exactNumber(p.mortali)}</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="casi" name="Infortuni" isAnimationActive={false} radius={[0, 4, 4, 0]}>
                  {genereData.map((entry, index) => (
                    <Bar key={`bar-gen-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dettaglio quote */}
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", fontSize: "0.82rem" }}>
            {genereData.map((g) => (
              <div key={g.key} style={{ flex: 1, padding: "6px 10px", background: "var(--color-raised)", borderRadius: 4, borderLeft: `3px solid ${g.fill}` }}>
                <div style={{ fontWeight: 650 }}>{g.name}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 750, color: "var(--color-text)" }}>
                  {exactNumber(g.casi)} <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>({g.quota.toFixed(1)}%)</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                  {g.mortali} decessi
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blocco Fasce d'Età */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "var(--space-2)" }}>
            Fasce d&apos;età all&apos;accadimento ({anno})
          </div>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={etaData}
                margin={{ top: 8, right: 12, bottom: 4, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
                <XAxis dataKey="fascia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => compactNumber(v)} width={45} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="custom-chart-tooltip">
                        <div className="tooltip-title">Età {label} anni ({anno})</div>
                        <div className="tooltip-row">
                          <span>Infortuni:</span>
                          <strong>{exactNumber(p.casi)} ({p.quota.toFixed(1)}%)</strong>
                        </div>
                        <div className="tooltip-row">
                          <span>Esiti mortali:</span>
                          <strong style={{ color: "#ff8b80" }}>{exactNumber(p.mortali)}</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="casi" name="Infortuni" fill="#0e7c8a" isAnimationActive={false} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", marginTop: "var(--space-2)" }}>
            La concentrazione maggiore si registra nelle fasce centrali (35-49 e 50-64 anni), coerentemente con la composizione anagrafica della forza lavoro italiana.
          </div>
        </div>
      </div>

      <p className="source-note">
        Dati demografici consolidati INAIL anno {anno}. La lettura corretta della frequenza infortunistica richiede il confronto con la popolazione occupata per genere ed età censita da ISTAT.
      </p>
    </div>
  );
}