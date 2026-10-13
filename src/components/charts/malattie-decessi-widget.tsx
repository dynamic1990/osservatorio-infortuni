"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { exactNumber } from "@/lib/format";
import { QuotaGenere } from "@/components/charts/quota-genere";
import { ChartTooltip } from "./chart-tooltip";

type Vista = "totale" | "silicosi" | "genere";
type AnnoSel = string;

export function MalattieDecessiWidget() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);
  const decessi = dati.decessi;
  const anni = useMemo(() => decessi.perAnno.map((d) => d.anno).sort(), [decessi]);
  const [vista, setVista] = useState<Vista>("totale");
  const [annoSel, setAnnoSel] = useState<AnnoSel>(anni[anni.length - 1] ?? "");

  const etaMedia = decessi.etaMedia ?? null;
  const rigaAnno = useMemo(
    () => decessi.perAnno.find((d) => d.anno === annoSel) ?? null,
    [decessi, annoSel]
  );
  const totM = rigaAnno?.maschi ?? 0;
  const totF = rigaAnno?.femmine ?? 0;
  const totAnno = rigaAnno?.casi ?? 0;

  const chartData = useMemo(() => {
    return decessi.perAnno.map((d) => ({
      anno: d.anno,
      casi: d.casi,
      silicosi: d.silicosiAsbestosi,
      maschi: d.maschi,
      femmine: d.femmine,
      altri: d.casi - d.silicosiAsbestosi,
    }));
  }, [decessi]);

  const regioniVista = useMemo(() => {
    return decessi.perRegioneAnno[annoSel] ?? [];
  }, [decessi, annoSel]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Decessi per malattia professionale riconosciuta ({anni[0]} – {anni[anni.length - 1]})
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          {annoSel}: {exactNumber(totAnno)} decessi
          {etaMedia !== null && <> · età media {String(etaMedia).replace(".", ",")} anni</>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {([
            ["totale", "Serie annuale"],
            ["silicosi", "Amianto"],
            ["genere", "Per genere"],
          ] as const).map(([v, label]) => (
            <button key={v} onClick={() => setVista(v)} className={`btn-pill ${vista === v ? "active" : ""}`}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Ranking regioni:</span>
          {anni.map((a) => (
            <button key={a} onClick={() => setAnnoSel(a)} className={`btn-pill ${annoSel === a ? "active" : ""}`}>{a}</button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 314 }}>
        {vista === "genere" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 16, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    labelFormatter={(l) => `Anno ${l}`}
                  />
                )}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
              <Bar dataKey="maschi" name="Maschi" stackId="g" fill="#057dbc" isAnimationActive={false} />
              <Bar dataKey="femmine" name="Femmine" stackId="g" fill="#f36458" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 16, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    labelFormatter={(l) => `Anno ${l}`}
                    totalKey={vista === "totale" ? "casi" : undefined}
                  />
                )}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: "0.8rem" }} />
              {vista === "totale" ? (
                <>
                  <Bar dataKey="casi" name="Decessi totali" fill="#f36458" radius={[3, 3, 0, 0]} maxBarSize={44} isAnimationActive={false} />
                  <Line type="monotone" dataKey="silicosi" name="Silicosi/asbestosi" stroke="#057dbc" strokeWidth={2.5} dot={{ r: 3, fill: "#057dbc" }} isAnimationActive={false} />
                </>
              ) : (
                <>
                  <Bar dataKey="altri" name="Altri decessi" stackId="a" fill="#9e9e9e" isAnimationActive={false} />
                  <Bar dataKey="silicosi" name="Silicosi/asbestosi" stackId="a" fill="#057dbc" isAnimationActive={false} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
        {regioniVista.slice(0, 8).map((r) => (
          <div key={r.codice} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--color-border)", padding: "6px 2px", fontSize: "0.84rem" }}>
            <span style={{ fontWeight: 550 }}>{r.nome}</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(r.casi)}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
        <QuotaGenere maschi={totM} femmine={totF} compact />
      </div>

      <p className="source-note">
        Fonte: INAIL Open Data, dataset <em>DatiSemestraliMalattieProfessionaliDataDec</em> (decessi per malattia
        professionale riconosciuta, esiti di casi protocollati). Serie per anno di morte nel quinquennio 2021-2025.
        La vista &quot;Amianto&quot; isola i decessi da silicosi e asbestosi, malattie che emergono a distanza di anni
        dall&apos;esposizione. Ranking regionale e dato di genere si riferiscono all&apos;anno selezionato ({annoSel}),
        per seguire l&apos;evoluzione senza appiattirla sull&apos;aggregato quinquennale.
      </p>
    </div>
  );
}
