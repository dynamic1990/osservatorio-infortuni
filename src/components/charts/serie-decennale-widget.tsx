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
import { longDate } from "@/lib/format";

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
          Serie storica consolidata (2014 – 2025)
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

      <div style={{ width: "100%", height: 354 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serieCorrente} margin={{ top: 12, right: 16, bottom: 16, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
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
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
            {modalita === "totale" ? (
              <>
                <Bar yAxisId="left" dataKey="casi" name="Denunce (asse sin.)" fill="#f36458" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="incidenza" name="Incidenza ‰ (asse des.)" stroke="#057dbc" strokeWidth={3} dot={{ r: 4, fill: "#057dbc" }} isAnimationActive={false} />
              </>
            ) : (
              <>
                <Bar yAxisId="left" dataKey="mortali" name="Casi mortali (asse sin.)" fill="#f36458" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="indiceMortali" name="Incidenza mortalità ‰ (asse des.)" stroke="#057dbc" strokeWidth={3} dot={{ r: 4, fill: "#057dbc" }} isAnimationActive={false} />
              </>
            )}
            <Brush
              dataKey="anno"
              height={28}
              stroke="#9e9e9e"
              fill="#f5f5f5"
              travellerWidth={2}
              startIndex={0}
              endIndex={chartData.length - 1}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Slider di esplorazione: trascinare per zoomare/sfogliare gli anni */}
        <div style={{ marginTop: "var(--space-1)", fontSize: "0.78rem", color: "var(--color-text-muted)", textAlign: "center" }}>
          Usa lo slider per esplorare il periodo con più dettaglio (trascina le maniglie o la barra).
        </div>
      </div>

      <p className="source-note">
        Dati estratti il {longDate(dati.generatedAt)}. Il periodo 2014-2019 deriva dalla serie storica ufficiale INAIL, che pubblica il dato
        complessivo delle denunce senza distinguere tra infortuni in occasione di lavoro e in
        itinere. Per questi anni la ripartizione tra le due modalità non è disponibile. Dal 2020
        la serie si basa sui microdati Open Data INAIL, che consentono la distinzione tra lavoro
        e itinere: i filtri della dashboard su questa modalità si applicano quindi al periodo
        2020-2025. Il denominatore occupati 15-64 è ISTAT/Eurostat (lfst_r_lfe2emp). Il dato 2020
        include i casi COVID riconosciuti come infortunio (picco dei casi mortali). La serie
        consente di leggere il rischio reale separandolo dalle oscillazioni della platea occupazionale.
      </p>

      <p className="source-note">
        <strong>Il picco del 2022 non è un peggioramento della sicurezza.</strong> Le denunce passano da
        564.418 a 703.535 (+24,6%) e l&apos;anno successivo scendono a 590.316: nessuna serie reale si muove
        così. La spiegazione è nei contagi da Covid-19 denunciati come infortunio sul lavoro, che secondo
        l&apos;INAIL passano da circa 49.000 nel 2021 a 120.000 nel 2022 (una denuncia su sei, contro una su
        dodici l&apos;anno prima). Al netto dei contagi la crescita si riduce dal +24,6% al +13,2%. La
        concentrazione anomala si vede anche nei dati: il settore Sanità e assistenza sociale cresce del
        +90,3%, da solo spiega quasi metà dell&apos;incremento nazionale (66.858 denunce su 139.117), e il
        59,8% dell&apos;aumento complessivo riguarda personale femminile. Sono proporzioni compatibili con la
        composizione dei contagi, non con un cambiamento delle modalità di accadimento degli infortuni
        tradizionali. Il picco del 2020 nei casi mortali ha la stessa natura. Fonte della spiegazione:
        INAIL, Dati Inail dell&apos;11 ottobre 2023.
      </p>
    </div>
  );
}
