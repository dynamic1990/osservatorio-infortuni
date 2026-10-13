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
      .reduce<Record<string, { anno: string; totale: number; graviSsl: number | null }>>((acc, r) => {
        const key = String(r.anno);
        const cur = acc[key] ?? { anno: key, totale: 0, graviSsl: 0 };
        cur.totale += r.adottateTotale ?? 0;
        cur.graviSsl = (cur.graviSsl ?? 0) + (r.adottateGraviSsl ?? 0);
        acc[key] = cur;
        return acc;
      }, {});
  }, [righe, settore]);

  const serieChart = useMemo(() => {
    return Object.values(serieData)
      .sort((a, b) => Number(a.anno) - Number(b.anno))
      .map((d) => ({
        ...d,
        graviSsl: d.graviSsl !== 0 ? d.graviSsl : null,
      }));
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
                formatter={(val, name) => {
                  if (name === "graviSsl" && (val === null || Number(val) === 0)) return [null, ""];
                  return [exactNumber(Number(val ?? 0)), name === "totale" ? "Totale sospensioni" : "di cui gravi violazioni SSL"];
                }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
              <Bar dataKey="totale" name="Totale" fill="#f36458" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              <Bar dataKey="graviSsl" name="Gravi SSL" fill="#057dbc" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dettaglioData} margin={{ top: 8, right: 8, bottom: 16, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip formatter={(val, name) => [exactNumber(Number(val ?? 0)), String(name)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
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
        è mostrato il totale. La vista "Composizione" con tutti i settori confronta l&apos;ultimo anno disponibile.
      </p>
    </div>
  );
}