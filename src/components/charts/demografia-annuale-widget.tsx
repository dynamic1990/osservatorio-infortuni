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
} from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { compactNumber, exactNumber } from "@/lib/format";
import { PALETTE } from "@/lib/palette";
import { FiltroModalita, type ModalitaState } from "./filtro-modalita";

export function DemografiaAnnualeWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });

  const annoData = useMemo(() => {
    return multidim.perAnno[anno] || multidim.consolidatoTotale;
  }, [multidim, anno]);

  // Dati Genere (split per modalità: generiLavoro + generiItinere)
  const genereData = useMemo(() => {
    const casiM =
      (modalita.lavoro ? annoData.generiLavoro?.["M"] || 0 : 0) +
      (modalita.itinere ? annoData.generiItinere?.["M"] || 0 : 0);
    const casiF =
      (modalita.lavoro ? annoData.generiLavoro?.["F"] || 0 : 0) +
      (modalita.itinere ? annoData.generiItinere?.["F"] || 0 : 0);
    const totalGen = casiM + casiF;
    // Nota: gli esiti mortali non sono splittati per modalità nel dataset multidimensionale
    const mortaliM = annoData.generiMortali?.["M"] || 0;
    const mortaliF = annoData.generiMortali?.["F"] || 0;

    return [
      {
        key: "M",
        name: "Uomini",
        casi: casiM,
        mortali: mortaliM,
        quota: totalGen > 0 ? (casiM / totalGen) * 100 : 0,
        fill: "#1f6fb2",
      },
      {
        key: "F",
        name: "Donne",
        casi: casiF,
        mortali: mortaliF,
        quota: totalGen > 0 ? (casiF / totalGen) * 100 : 0,
        fill: "#b0336b",
      },
    ];
  }, [annoData, modalita]);

  // Dati Fasce d'Età (fasce ETA reali: 0-14, 15-24, 25-34, 35-44, 45-54, 55-64, 65+)
  const etaData = useMemo(() => {
    const order = ["0-14", "15-24", "25-34", "35-44", "45-54", "55-64", "65+"];
    const casiFascia = (f: string) =>
      (modalita.lavoro ? annoData.fasceEtaLavoro?.[f] || 0 : 0) +
      (modalita.itinere ? annoData.fasceEtaItinere?.[f] || 0 : 0);
    // Nota: gli esiti mortali per fascia non sono splittati per modalità
    const totalEta = order.reduce((a, f) => a + casiFascia(f), 0);

    return order.map((f, i) => {
      const casi = casiFascia(f);
      const mort = annoData.fasceEtaMortali?.[f] || 0;
      return {
        fascia: f,
        casi,
        mortali: mort,
        quota: totalEta > 0 ? (casi / totalEta) * 100 : 0,
        fill: PALETTE[i % PALETTE.length],
      };
    });
  }, [anno, modalita, annoData]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Selettore Anno e Modalità */}
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
          <FiltroModalita value={modalita} onChange={setModalita} size="sm" label="Modalità" />
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
                    <Cell key={`cell-gen-${index}`} fill={entry.fill} />
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
            La concentrazione maggiore si registra nelle fasce centrali (35-44, 45-54 e 55-64 anni), coerentemente con la composizione anagrafica della forza lavoro italiana.
          </div>
        </div>
      </div>

      {/*
        TODO: Incidenza per 1.000 occupati per genere/età non disponibile.
        Non esiste un file `occupati-demografia.json` (né una fonte ISTAT/Eurostat
        per occupati per genere × fascia d'età importata nel progetto). Non
        inventare denominatori: se serve l'incidenza, va prima aggiunta una fonte
        dati approvata (nessuna chiamata API senza consenso).
      */}
      <p className="source-note">
        Dati demografici consolidati INAIL anno {anno} (sono la somma delle modalità lavoro e itinere selezionate). Gli esiti mortali non sono splittati per modalità nel dataset multidimensionale. La lettura corretta della frequenza infortunistica richiederebbe il confronto con la popolazione occupata per genere ed età censita da ISTAT.
      </p>
    </div>
  );
}
