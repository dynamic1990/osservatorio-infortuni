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
  LabelList,
} from "recharts";
import {
  getVigilanzaDettaglioData,
  SETTORI_ORDINE,
} from "@/lib/vigilanza-dettaglio";
import { exactNumber } from "@/lib/format";

/** Violazioni in materia di salute e sicurezza: per settore (2021-2025) e per sezione ATECO (2021-2024). */
export function VigilanzaViolazioniDettaglioWidget() {
  const dati = useMemo(() => getVigilanzaDettaglioData(), []);
  const [vista, setVista] = useState<"settori" | "ateco">("settori");

  const anniSettori = useMemo(
    () => [...new Set(dati.irregolaritaSettori.map((r) => r.anno))].sort(),
    [dati]
  );
  const anniAteco = useMemo(
    () => [...new Set(dati.irregolaritaAteco.map((r) => r.anno))].sort(),
    [dati]
  );

  const [anno, setAnno] = useState<number>(Math.max(...anniSettori));

  const chartData = useMemo(() => {
    if (vista === "settori") {
      return SETTORI_ORDINE.map((s) => {
        const r = dati.irregolaritaSettori.find((x) => x.anno === anno && x.settore === s);
        const viol = r?.violazioniSicurezza ?? 0;
        const pen = r?.violazioniPenali ?? 0;
        return {
          nome: s,
          violazioni: viol,
          penali: pen,
          nonPenali: viol - pen >= 0 ? viol - pen : 0,
        };
      });
    }
    const righe = dati.irregolaritaAteco
      .filter((r) => r.anno === anno && r.sezione)
      .map((r) => {
        const viol = r.violazioniSicurezza ?? 0;
        const pen = r.violazioniPenali ?? 0;
        return {
          nome: `${r.sezione} — ${(r.descrizione ?? "").split(";")[0].slice(0, 32)}`,
          violazioni: viol,
          penali: pen,
          nonPenali: viol - pen >= 0 ? viol - pen : 0,
        };
      })
      .sort((a, b) => b.violazioni - a.violazioni);
    return righe.slice(0, 12);
  }, [dati, vista, anno]);

  const anni = vista === "settori" ? anniSettori : anniAteco;

  const maxViolazioni = useMemo(() => Math.max(...chartData.map((d) => d.violazioni), 1), [chartData]);
  const totaleAnno = useMemo(() => chartData.reduce((a, d) => a + d.violazioni, 0), [chartData]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Violazioni accertate in materia di salute e sicurezza
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
            {vista === "settori"
              ? `Per settore produttivo, anno ${anno}`
              : `Per sezione ATECO (primi 12), anno ${anno}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", alignItems: "center" }}>
          {(["settori", "ateco"] as const).map((v) => (
            <button key={v} onClick={() => { setVista(v); setAnno(v === "ateco" ? Math.max(...anniAteco) : Math.max(...anniSettori)); }} className={`btn-pill ${vista === v ? "active" : ""}`}>
              {v === "settori" ? "Per settore" : "Per ATECO"}
            </button>
          ))}
          <span style={{ width: 8 }} />
          {anni.map((a) => (
            <button key={a} onClick={() => setAnno(a)} className={`btn-pill ${anno === a ? "active" : ""}`}>{a}</button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 16, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={vista === "settori" ? 0 : -18} textAnchor={vista === "settori" ? "middle" : "end"} height={vista === "settori" ? 40 : 70} />
            <YAxis tick={{ fontSize: 11 }} width={52} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload as Record<string, unknown>;
                const viol = Number(row.violazioni ?? 0);
                const pen = Number(row.penali ?? 0);
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">{String(row.nome ?? "")} ({anno})</div>
                    <div className="tooltip-row">
                      <span>Violazioni SSL:</span>
                      <strong>{exactNumber(viol)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <i aria-hidden="true" style={{ width: 8, height: 8, display: "inline-block", background: "#f36458", borderRadius: 2 }} />
                        di cui con rilevanza penale:
                      </span>
                      <strong>
                        {exactNumber(pen)}{" "}
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 550 }}>
                          ({viol > 0 ? Math.round((pen * 100) / viol) : 0}%)
                        </span>
                      </strong>
                    </div>
                    {viol - pen > 0 ? (
                      <div className="tooltip-row">
                        <span>Violazioni non penali:</span>
                        <strong>{exactNumber(viol - pen)}</strong>
                      </div>
                    ) : null}
                  </div>
                );
              }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            {/* pila: in basso il "di cui" con rilevanza penale (accento), sopra il resto */}
            <Bar dataKey="penali" name="di cui penali" stackId="v" fill="#f36458" radius={[0, 0, 0, 0]} maxBarSize={44} isAnimationActive={false} />
            <Bar dataKey="nonPenali" name="Violazioni senza rilevanza penale" stackId="v" fill="#057dbc" radius={[3, 3, 0, 0]} maxBarSize={44} isAnimationActive={false}>
              {vista === "settori" && (
                <LabelList dataKey="violazioni" position="top" formatter={(v: unknown) => exactNumber(Number(v ?? 0))} style={{ fontSize: 10, fill: "#757575" }} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{exactNumber(totaleAnno)} violazioni SSL</div>
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
          {vista === "settori"
            ? "Quota massima nel grafico: " + exactNumber(maxViolazioni) + " violazioni."
            : "ATECO arriva al 2024 (ultimo monitoraggio pubblicato per sezione)."}
        </div>
      </div>

      <p className="source-note" style={{ margin: 0 }}>
        Fonte: INL, Monitoraggio attività di vigilanza, Irregolarità accertate per settore produttivo (2021-2025)
        e per sezione ATECO (2021-2024). Le violazioni in materia di salute e sicurezza si riferiscono al
        D.Lgs. 81/2008; la serie &quot;penali&quot; è la quota con rilevanza penale.
      </p>
    </div>
  );
}