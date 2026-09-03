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
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { exactNumber } from "@/lib/format";

export function MalattieDecessiWidget() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);

  const decessi = dati.decessi;
  const chartData = decessi.perAnno.map((d) => ({
    anno: d.anno,
    casi: d.casi,
    silicosi: d.silicosiAsbestosi,
  }));

  const etaMedia = decessi.etaMedia ?? null;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Decessi per malattia professionale riconosciuta (2020 – 2024)
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          {exactNumber(decessi.totale)} decessi nel quinquennio
          {etaMedia !== null && <> · età media {String(etaMedia).replace(".", ",")} anni</>}
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip
              formatter={(val, name) => [exactNumber(Number(val ?? 0)), name === "casi" ? "Decessi totali" : "Silicosi/asbestosi"]}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: "0.82rem" }} />
            <Bar dataKey="casi" name="Decessi totali" fill="#b3261e" radius={[3, 3, 0, 0]} maxBarSize={44} isAnimationActive={false} />
            <Line type="monotone" dataKey="silicosi" name="Silicosi/asbestosi" stroke="#1f6fb2" strokeWidth={2.5} dot={{ r: 3, fill: "#1f6fb2" }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
        {decessi.perRegione.slice(0, 8).map((r) => (
          <div
            key={r.codice}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: "1px solid var(--color-border)",
              padding: "6px 2px",
              fontSize: "0.84rem",
            }}
          >
            <span style={{ fontWeight: 550 }}>{r.nome}</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{exactNumber(r.casi)}</span>
          </div>
        ))}
      </div>

      <p className="source-note">
        Fonte: INAIL Open Data, dataset <em>DatiSemestraliMalattieProfessionaliDataDec</em> (decessi per malattia
        professionale riconosciuta, esiti di casi protocollati). La serie è per anno di morte e include i decessi
        riconosciuti nel quinquennio 2020-2024; {exactNumber(decessi.perAnno.reduce((a, d) => a + d.silicosiAsbestosi, 0))} decessi
        (19%) sono riconducibili a silicosi e asbestosi, le malattie da amianto che continuano a mietere vittime a
        distanza di decenni dall&apos;esposizione. La prevalenza maschile è schiacciante ({exactNumber(decessi.perGenere.M ?? 0)} decessi su {exactNumber(decessi.totale)}).
      </p>
    </div>
  );
}
