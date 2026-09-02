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
  Brush,
} from "recharts";
import serieDecennale from "@/data/generated/inail-serie-decennale.json";

interface SerieDecennalePayload {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  periodo: string;
  fonte: string;
  serie: Array<{
    anno: number;
    totale: number;
    lavoro: number | null;
    itinere: number | null;
    mortali: number;
    mortaliLavoro: number | null;
    mortaliItinere: number | null;
    occupati: number;
    indice: number | null;
    indiceMortali: number | null;
    nota: string;
  }>;
}

export function SerieDecennaleWidget() {
  const dati = useMemo(() => serieDecennale as unknown as SerieDecennalePayload, []);
  const [modalita, setModalita] = useState<"totale" | "mortali">("totale");

  const chartData = useMemo(() => {
    return dati.serie.map((s) => ({
      anno: s.anno,
      casi: s.totale,
      mortali: s.mortali,
      incidenza: s.indice ?? 0,
      indiceMortali: s.indiceMortali ?? 0,
      occupatiMln: Number((s.occupati / 1_000_000).toFixed(2)),
    }));
  }, [dati]);

  const serieCorrente = modalita === "totale" ? chartData : chartData;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Serie storica decennale consolidata (2014 – 2024)
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {(["totale", "mortali"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModalita(m)}
              className={`btn-pill ${modalita === m ? "active" : ""}`}
            >
              {m === "totale" ? "Denunce totali" : "Casi mortali"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serieCorrente} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v)}
              width={60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}‰`}
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    <div className="tooltip-row">
                      <span>Denunce totali:</span>
                      <strong>{Number(p.casi).toLocaleString("it-IT")}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Casi mortali:</span>
                      <strong>{Number(p.mortali).toLocaleString("it-IT")}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Incidenza (‰ occ.):</span>
                      <strong>{p.incidenza}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Occupati ISTAT:</span>
                      <strong>{p.occupatiMln} milioni</strong>
                    </div>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: "0.82rem" }} />
            {modalita === "totale" ? (
              <>
                <Bar yAxisId="left" dataKey="casi" name="Denunce (asse sin.)" fill="#b3261e" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="incidenza" name="Incidenza ‰ (asse des.)" stroke="#1d1b1a" strokeWidth={3} dot={{ r: 4, fill: "#1d1b1a" }} isAnimationActive={false} />
              </>
            ) : (
              <>
                <Bar yAxisId="left" dataKey="mortali" name="Casi mortali (asse sin.)" fill="#7f1d16" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="indiceMortali" name="Incidenza mortalità ‰ (asse des.)" stroke="#1d1b1a" strokeWidth={3} dot={{ r: 4, fill: "#1d1b1a" }} isAnimationActive={false} />
              </>
            )}
            <Brush
              dataKey="anno"
              height={26}
              stroke="#b3261e"
              fill="var(--color-surface-2)"
              travellerWidth={12}
              startIndex={0}
              endIndex={Math.min(chartData.length - 1, 6)}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Slider di esplorazione: trascinare per zoomare/sfogliare gli anni */}
        <div style={{ marginTop: "var(--space-1)", fontSize: "0.78rem", color: "var(--color-text-muted)", textAlign: "center" }}>
          Usa lo slider per esplorare il periodo con più dettaglio (trascina le maniglie o la barra).
        </div>
      </div>

      <p className="source-note">
        Il periodo 2014-2019 deriva dalla serie storica ufficiale INAIL, che pubblica il dato
        complessivo delle denunce senza distinguere tra infortuni in occasione di lavoro e in
        itinere. Per questi anni la ripartizione tra le due modalità non è disponibile. Dal 2020
        la serie si basa sui microdati Open Data INAIL, che consentono la distinzione tra lavoro
        e itinere: i filtri della dashboard su questa modalità si applicano quindi al solo periodo
        2020-2024. Il denominatore occupati 15-64 è ISTAT/Eurostat (lfst_r_lfe2emp). Il dato 2020
        include i casi COVID riconosciuti come infortunio (picco dei casi mortali). La serie
        consente di leggere il rischio reale separandolo dalle oscillazioni della platea occupazionale.
      </p>
    </div>
  );
}
