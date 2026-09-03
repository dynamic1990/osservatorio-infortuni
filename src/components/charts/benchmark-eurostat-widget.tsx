"use client";

import { useMemo } from "react";
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
import benchmarkRaw from "@/data/generated/eurostat-benchmark.json";

interface BenchmarkPayload {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  unita: string;
  settori: string;
  ultimoAnno: string;
  rankingUltimoAnno: Array<{
    codice: string;
    nome: string;
    tassoIncidenzaStandardizzato: number;
    isItaly: boolean;
    isEU: boolean;
  }>;
  serieStorica: Record<
    string,
    { codice: string; nome: string; valori: Record<string, number> }
  >;
  anni: string[];
}

const PAESI_FOCUS = ["IT", "EU27_2020", "DE", "FR", "ES"];

export function BenchmarkEurostatWidget() {
  const dati = useMemo(() => benchmarkRaw as unknown as BenchmarkPayload, []);

  const chartData = useMemo(() => {
    return (dati.anni || []).map((anno) => {
      const row: Record<string, string | number> = { anno };
      for (const codice of PAESI_FOCUS) {
        const paese = dati.serieStorica?.[codice];
        const v = paese?.valori?.[anno];
        row[codice] = v ?? null;
      }
      return row;
    });
  }, [dati]);

  const ranking = useMemo(() => {
    return [...(dati.rankingUltimoAnno || [])].sort(
      (a, b) => a.tassoIncidenzaStandardizzato - b.tassoIncidenzaStandardizzato
    );
  }, [dati]);

  const colori: Record<string, string> = {
    IT: "#c8102e",
    EU27_2020: "#1d1b1a",
    DE: "#1d4ed8",
    FR: "#1e7a4e",
    ES: "#c77d0a",
  };

  const nomi: Record<string, string> = {
    IT: "Italia",
    EU27_2020: "Media UE-27",
    DE: "Germania",
    FR: "Francia",
    ES: "Spagna",
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
        Benchmark europeo: infortuni mortali ogni 100.000 occupati (ESAW, anno {dati.ultimoAnno})
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
        {ranking.map((p) => (
          <div
            key={p.codice}
            style={{
              padding: "var(--space-3)",
              borderRadius: "8px",
              background: p.isItaly ? "#fbe9e7" : p.isEU ? "#f1efec" : "var(--color-surface-2)",
              border: p.isItaly ? "1.5px solid #c8102e" : "1px solid var(--color-divider)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {p.isItaly ? "🇮🇹 Italia" : p.isEU ? "🇪🇺 UE-27" : p.nome}
              </span>
              <span style={{ fontWeight: 800, fontSize: "1.05rem", color: p.isItaly ? "#c8102e" : "inherit" }}>
                {p.tassoIncidenzaStandardizzato.toLocaleString("it-IT")}
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              morti / 100.000 occupati
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    {payload.map((ent) => (
                      <div className="tooltip-row" key={String(ent.dataKey)}>
                        <span>{nomi[String(ent.dataKey)] || String(ent.dataKey)}:</span>
                        <strong>
                          {ent.value == null ? "n.d." : `${Number(ent.value).toLocaleString("it-IT")} morti / 100k`}
                        </strong>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 10, fontSize: "0.8rem" }} />
            {PAESI_FOCUS.map((codice) => (
              <Line
                key={codice}
                type="monotone"
                dataKey={codice}
                name={nomi[codice] || codice}
                stroke={colori[codice]}
                strokeWidth={codice === "IT" ? 3.5 : 2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Fonte: Eurostat ESAW (European Statistics on Accidents at Work), dataset hsw_mi01.
        Tasso di incidenza standardizzato per 100.000 occupati, infortuni mortali, tutti i settori
        (NACE Rev. 2, Sezioni A, C-N), sesso totale. La standardizzazione elimina l&apos;effetto della
        diversa struttura demografica tra paesi. Ultimo anno consolidato disponibile: {dati.ultimoAnno}.
      </p>
    </div>
  );
}
