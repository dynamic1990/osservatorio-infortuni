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
import {
  getVigilanzaDettaglioData,
  SETTORI_ORDINE,
} from "@/lib/vigilanza-dettaglio";
import { exactNumber } from "@/lib/format";
import { ChartTooltip } from "./chart-tooltip";

/** Sospensioni art. 14 per settore: totale e divisione lavoro nero vs gravi violazioni SSL. */
export function VigilanzaSospensioniSettoreWidget() {
  const dati = useMemo(() => getVigilanzaDettaglioData(), []);
  const [settore, setSettore] = useState<string>("Tutti i settori");
  const [vista, setVista] = useState<"serie" | "dettaglio">("serie");

  const righe = useMemo(
    () => [...dati.sospensioniSettori].sort((a, b) => a.anno - b.anno),
    [dati]
  );

  const serieData = useMemo(() => {
    return righe
      .filter((r) => settore === "Tutti i settori" || r.settore === settore)
      .reduce<Record<string, { anno: string; totale: number; graviSsl: number | null; divisibile: boolean }>>((acc, r) => {
        const key = String(r.anno);
        const cur =
          acc[key] ?? { anno: key, totale: 0, graviSsl: 0, divisibile: true };
        cur.totale += r.adottateTotale ?? 0;
        cur.graviSsl = (cur.graviSsl ?? 0) + (r.adottateGraviSsl ?? 0);
        // la divisione è disponibile solo se ogni riga dell'anno espone il campo
        cur.divisibile = cur.divisibile && r.adottateGraviSsl !== null;
        acc[key] = cur;
        return acc;
      }, {});
  }, [righe, settore]);

  const serieChart = useMemo(() => {
    return Object.values(serieData)
      .sort((a, b) => Number(a.anno) - Number(b.anno))
      .map((d) => {
        if (!d.divisibile) {
          // anni pre-2022: solo totale, nessuna pila
          return {
            anno: d.anno,
            totale: d.totale,
            graviSsl: null,
            resto: 0,
            soloTotale: d.totale,
          };
        }
        return {
          anno: d.anno,
          totale: d.totale,
          graviSsl: d.graviSsl !== 0 ? d.graviSsl : null,
          resto:
            d.totale - (d.graviSsl ?? 0) >= 0
              ? d.totale - (d.graviSsl ?? 0)
              : 0,
          soloTotale: 0,
        };
      });
  }, [serieData]);

  const dettaglioData = useMemo(() => {
    if (settore === "Tutti i settori") {
      // composizione per settore nell'anno più recente disponibile con divisione
      const annoMax = Math.max(...righe.map((r) => r.anno));
      return SETTORI_ORDINE.map((s) => {
        const r = righe.find((x) => x.anno === annoMax && x.settore === s);
        return {
          nome: s,
          inNero: r?.adottateInNero ?? 0,
          graviSsl: r?.adottateGraviSsl ?? 0,
          nonSpecificato: (r?.adottateTotale ?? 0) - (r?.adottateInNero ?? 0) - (r?.adottateGraviSsl ?? 0),
        };
      });
    }
    // serie annuale del settore selezionato con divisione (dal 2022)
    return righe
      .filter((r) => r.settore === settore && r.adottateInNero !== null)
      .map((r) => ({
        nome: String(r.anno),
        inNero: r.adottateInNero ?? 0,
        graviSsl: r.adottateGraviSsl ?? 0,
        nonSpecificato: (r.adottateTotale ?? 0) - (r.adottateInNero ?? 0) - (r.adottateGraviSsl ?? 0),
      }));
  }, [righe, settore]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Sospensioni dell&apos;attività imprenditoriale (art. 14)
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
            {settore === "Tutti i settori" ? "Tutti i settori" : settore}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {(["serie", "dettaglio"] as const).map((v) => (
            <button key={v} onClick={() => setVista(v)} className={`btn-pill ${vista === v ? "active" : ""}`}>
              {v === "serie" ? "Serie 2018-2025" : "Composizione"}
            </button>
          ))}
          <span style={{ width: 8 }} />
          {(["Tutti i settori", ...SETTORI_ORDINE] as const).map((s) => (
            <button key={s} onClick={() => setSettore(s)} className={`btn-pill ${settore === s ? "active" : ""}`}>
              {s === "Tutti i settori" ? "Tutti" : s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        {vista === "serie" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serieChart} margin={{ top: 8, right: 8, bottom: 16, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const row = payload[0].payload as Record<string, unknown>;
                  const totale = Number(row.totale ?? 0);
                  // graviSsl è null quando la divisione non è disponibile (anni pre-2022)
                  const gravi =
                    row.graviSsl === null || row.graviSsl === undefined
                      ? null
                      : Number(row.graviSsl);
                  const divisibile = gravi !== null;
                  return (
                    <div className="custom-chart-tooltip">
                      <div className="tooltip-title">Anno {label}</div>
                      <div className="tooltip-row">
                        <span>Sospensioni totali:</span>
                        <strong>{exactNumber(totale)}</strong>
                      </div>
                      {divisibile ? (
                        <>
                          <div className="tooltip-row">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <i aria-hidden="true" style={{ width: 8, height: 8, display: "inline-block", background: "#f36458", borderRadius: 2 }} />
                              di cui gravi violazioni SSL:
                            </span>
                            <strong>
                              {exactNumber(gravi!)}{" "}
                              <span style={{ color: "var(--color-text-muted)", fontWeight: 550 }}>
                                ({totale > 0 ? Math.round((gravi! * 100) / totale) : 0}%)
                              </span>
                            </strong>
                          </div>
                          {totale - gravi! > 0 ? (
                            <div className="tooltip-row">
                              <span>Altre sospensioni:</span>
                              <strong>{exactNumber(totale - gravi!)}</strong>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="tooltip-row">
                          <span>Divisione (nero/gravi SSL):</span>
                          <strong>non disponibile</strong>
                        </div>
                      )}
                    </div>
                  );
                }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
              {/* pila: di cui in basso (accento), resto sopra (neutro); anni pre-2022 = barra unica grigia */}
              <Bar dataKey="soloTotale" name="Totale (dettaglio non disponibile)" stackId="s" fill="#9e9e9e" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              <Bar dataKey="graviSsl" name="di cui gravi violazioni SSL" stackId="s" fill="#f36458" radius={[0, 0, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              <Bar dataKey="resto" name="Altre sospensioni" stackId="s" fill="#057dbc" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dettaglioData} margin={{ top: 8, right: 8, bottom: 16, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip
                content={({ active, payload }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    labelFormatter={() =>
                      settore === "Tutti i settori"
                        ? `Composizione per settore (${Math.max(...righe.map((r) => r.anno))})`
                        : `Serie annuale ${settore}`
                    }
                  />
                )}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
              <Bar dataKey="inNero" name="Lavoro nero" stackId="a" fill="#9e9e9e" isAnimationActive={false} />
              <Bar dataKey="graviSsl" name="Gravi violazioni SSL" stackId="a" fill="#057dbc" isAnimationActive={false} />
              <Bar dataKey="nonSpecificato" name="Solo lavoro nero" stackId="a" fill="#f36458" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="source-note" style={{ margin: 0 }}>
        Fonte: INL, Monitoraggio periodico dei provvedimenti di sospensione (art. 14, D.Lgs. 81/2008).
        La divisione tra lavoro nero e gravi violazioni SSL è disponibile dal 2022; per gli anni precedenti
        è mostrato il totale. La vista &quot;Composizione&quot; con tutti i settori confronta l&apos;ultimo anno disponibile.
      </p>
    </div>
  );
}