"use client";

import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getApprofondimenti } from "@/lib/approfondimenti";

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export function StagionalitaWidget() {
  const d = useMemo(() => getApprofondimenti(), []);
  const data = d.stagionalita.map((s) => ({
    mese: MESI[s.mese - 1],
    casi: s.casi,
  }));

  const max = Math.max(...data.map((x) => x.casi));
  const min = Math.min(...data.map((x) => x.casi));
  const diff = max - min;

  return (
    <div>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v)} />
            <Tooltip formatter={(val) => [Number(val ?? 0).toLocaleString("it-IT"), "Casi"]} />
            <Area
              type="monotone"
              dataKey="casi"
              name="Casi"
              stroke="#b3261e"
              fill="#b3261e"
              fillOpacity={0.18}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="source-note">
        Distribuzione per mese di accadimento, consolidato 2020-2024 (tutte le regioni).
        Il picco estivo (max {max.toLocaleString("it-IT")} casi, min {min.toLocaleString("it-IT")}) riflette la
        stagionalità produttiva di agricoltura ed edilizia: utile per pianificare le campagne di prevenzione.
      </p>
    </div>
  );
}