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
} from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { compactNumber, exactNumber } from "@/lib/format";
import { FiltroModalita, type ModalitaState } from "./filtro-modalita";

export function TrendDoppiaScalaWidget() {
  const data = useMemo(() => getMultidimensionaleData(), []);
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });

  const chartData = useMemo(() => {
    return data.anniDisponibili.map((anno) => {
      const row = data.perAnno[anno];
      const casi =
        (modalita.lavoro ? row.lavoro : 0) + (modalita.itinere ? row.itinere : 0);

      const incidenza = Number((casi / (row.occupati / 1000)).toFixed(2));
      return {
        anno,
        casi,
        mortali: row.mortali,
        giorniMln: Number((row.giorni / 1_000_000).toFixed(2)),
        incidenza,
        indiceMortali: row.indiceMortali,
        occupatiMln: Number((row.occupati / 1_000_000).toFixed(2)),
      };
    });
  }, [data, modalita]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli e filtri */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Volumi assoluti e Tasso di Incidenza normalizzato (2020 – 2024)
        </div>
        <FiltroModalita value={modalita} onChange={setModalita} size="sm" />
      </div>

      {/* Grafico cartesiano a doppia scala */}
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 12 }} />

            {/* Asse Y Sinistro: Volume Casi */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => compactNumber(v)}
              width={55}
            />

            {/* Asse Y Destro: Indice di Incidenza per 1.000 occupati */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}‰`}
              domain={["auto", "auto"]}
              width={45}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    <div className="tooltip-row">
                      <span>Infortuni denunciati:</span>
                      <strong>{exactNumber(p.casi)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Tasso di incidenza:</span>
                      <strong>{p.incidenza} per 1.000 occ.</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Esiti mortali:</span>
                      <strong>{exactNumber(p.mortali)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Giornate perse:</span>
                      <strong>{p.giorniMln} milioni</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Occupati ISTAT:</span>
                      <strong>{p.occupatiMln} milioni</strong>
                    </div>
                  </div>
                );
              }}
            />

            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 10, fontSize: "0.8rem" }} />

            {/* Barra volume (scala sinistra) */}
            <Bar
              yAxisId="left"
              dataKey="casi"
              name="Volume infortuni (asse sin.)"
              fill="#c8102e"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />

            {/* Linea tasso incidenza (scala destra) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="incidenza"
              name="Incidenza ‰ occ. (asse des.)"
              stroke="var(--color-text)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-text)" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Doppia scala: le barre (asse sinistro) indicano il volume degli eventi per le modalità selezionate (lavoro e/o itinere), mentre la linea (asse destro) rappresenta il tasso di incidenza reale calcolato rapportando i casi a 1.000 lavoratori occupati (fonte ISTAT ed Eurostat). Permette di distinguere la reale variazione del rischio dalle oscillazioni della platea occupazionale.
      </p>
    </div>
  );
}
