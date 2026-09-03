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
  LabelList,
} from "recharts";
import { getMalattieProfessionaliData } from "@/lib/malattie-professionali";
import { exactNumber } from "@/lib/format";

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"];

const formatEtichetta = (v: unknown): string => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
};

type Vista = "totale" | "maschi" | "femmine";

export function MalattieAndamentoWidget() {
  const dati = useMemo(() => getMalattieProfessionaliData(), []);
  const [vista, setVista] = useState<Vista>("totale");

  const chartData = useMemo(() => {
    const serie = dati.nazionale.serieMensile;
    const perMese: Record<string, { anno2025: number; anno2026: number }> = {};
    for (const m of serie) {
      if (!perMese[m.meseNome]) perMese[m.meseNome] = { anno2025: 0, anno2026: 0 };
      const val = vista === "maschi" ? m.maschi : vista === "femmine" ? m.femmine : m.casi;
      perMese[m.meseNome][m.anno === "2025" ? "anno2025" : "anno2026"] = val;
    }
    return MESI.map((nome) => ({ mese: nome, ...perMese[nome] }));
  }, [dati, vista]);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Denunce di malattia professionale: I semestre 2025 vs 2026
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {(["totale", "maschi", "femmine"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`btn-pill ${vista === v ? "btn-pill-accent active" : ""}`}
            >
              {v === "totale" ? "Totale" : v === "maschi" ? "Maschi" : "Femmine"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 18, right: 8, bottom: 0, left: 4 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={52} tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : String(v))} />
            <Tooltip formatter={(val, name) => [exactNumber(Number(val ?? 0)), String(name)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: "0.82rem" }} />
            <Bar dataKey="anno2025" name="I sem 2025" fill="#c4bfba" radius={[3, 3, 0, 0]} maxBarSize={38} isAnimationActive={false}>
              <LabelList dataKey="anno2025" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "#78716c" }} />
            </Bar>
            <Bar dataKey="anno2026" name="I sem 2026" fill="#b3261e" radius={[3, 3, 0, 0]} maxBarSize={38} isAnimationActive={false}>
              <LabelList dataKey="anno2026" position="top" formatter={formatEtichetta} style={{ fontSize: 10, fill: "#b3261e", fontWeight: 650 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Fonte: INAIL Open Data, dataset <em>DatiMensiliMalattieProfessionaliDataProt</em> (denunce protocollate nel
        mese). I CSV ufficiali coprono i primi due semestri: gennaio-giugno 2025 e gennaio-giugno 2026. Il confronto
        è a pari periodo e non va esteso all&apos;intero anno. Il toggle consente di isolare la componente di genere.
      </p>
    </div>
  );
}
