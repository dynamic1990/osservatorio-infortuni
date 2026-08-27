"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
import { regioneName } from "@/lib/labels";
import { getTemporale, type Temporale } from "@/lib/temporale";

type Metric = "totale" | "mortali" | "menomati" | "giorni";
type Vue = "annuale" | "mensile";

const METRICHE: Record<Metric, { label: string }> = {
  totale: { label: "Casi totali" },
  mortali: { label: "Esiti mortali" },
  menomati: { label: "Danno permanente" },
  giorni: { label: "Giorni indennizzati" },
};

// Interfaccia comune alle due serie (annuale e mensile).
interface Row {
  anno?: number;
  label?: string;
  totale: number;
  lavoro: number;
  itinere: number;
  mortali: number;
  mortaliLavoro?: number;
  mortaliItinere?: number;
  menomati?: number;
  giorni?: number;
}

function aggregatoAnnuale(t: Temporale, regioni: Set<string> | null): Row[] {
  const map = new Map<number, Row>();
  for (const r of t.serieAnnuale) {
    if (regioni && !regioni.has(r.regione)) continue;
    const m = map.get(r.anno) || { anno: r.anno, totale: 0, lavoro: 0, itinere: 0, mortali: 0, mortaliLavoro: 0, mortaliItinere: 0, menomati: 0, giorni: 0 };
    m.totale += r.totale;
    m.lavoro += r.lavoro;
    m.itinere += r.itinere;
    m.mortali += r.mortali;
    if (m.mortaliLavoro !== undefined) m.mortaliLavoro += r.mortaliLavoro;
    if (m.mortaliItinere !== undefined) m.mortaliItinere += r.mortaliItinere;
    if (m.menomati !== undefined) m.menomati += r.menomati;
    if (m.giorni !== undefined) m.giorni += r.giorni;
    map.set(r.anno, m);
  }
  return Array.from(map.values()).sort((a, b) => (a.anno ?? 0) - (b.anno ?? 0));
}

function aggregatoMensile(t: Temporale, regioni: Set<string> | null): Row[] {
  const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  const map = new Map<string, Row>();
  for (const r of t.serieMensile) {
    if (regioni && !regioni.has(r.regione)) continue;
    const key = `${r.anno}-${String(r.mese).padStart(2, "0")}`;
    const m = map.get(key) || { label: `${MESI[r.mese - 1]} ${r.anno}`, totale: 0, lavoro: 0, itinere: 0, mortali: 0 };
    m.totale += r.totale;
    m.lavoro += r.lavoro;
    m.itinere += r.itinere;
    m.mortali += r.mortali;
    map.set(key, m);
  }
  return Array.from(map.values()).sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""));
}

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} M`;
  if (v >= 1_000) return `${(v / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} k`;
  return v.toLocaleString("it-IT");
}

const pill: CSSProperties = {
  border: "1px solid var(--color-divider)",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: "0.85rem",
  cursor: "pointer",
  background: "transparent",
  color: "inherit",
};
const lnk: CSSProperties = {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: "0.8rem",
  textDecoration: "underline",
  color: "var(--color-accent)",
};

export function SerieTemporaleWidget() {
  const t: Temporale = useMemo(() => getTemporale(), []);
  const regioni = useMemo(() => {
    const set = new Set<string>();
    for (const r of t.serieAnnuale) set.add(r.regione);
    return Array.from(set).sort();
  }, [t]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vue, setVue] = useState<Vue>("annuale");
  const [metric, setMetric] = useState<Metric>("totale");

  const attive: Set<string> | null = selected.size ? selected : null;

  const toggle = (r: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const data: Row[] = vue === "annuale" ? aggregatoAnnuale(t, attive) : aggregatoMensile(t, attive);

  const filtroLabel = !attive
    ? "Tutte le regioni"
    : attive.size === 1
      ? regioneName([...attive][0])
      : `${attive.size} regioni`;

  const xKey = vue === "annuale" ? "anno" : "label";

  return (
    <div>
      <div style={{ marginBottom: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(["annuale", "mensile"] as Vue[]).map((v) => (
            <button
              key={v}
              onClick={() => setVue(v)}
              style={{ ...pill, background: vue === v ? "var(--color-accent)" : "transparent", color: vue === v ? "#fff" : "inherit" }}
            >
              {v === "annuale" ? "Annuale (2020-24)" : "Mensile (2025-26)"}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>{filtroLabel}</span>
      </div>

      <div style={{ marginBottom: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {(Object.keys(METRICHE) as Metric[]).map((k) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            style={{ ...pill, background: metric === k ? "var(--color-accent)" : "transparent", color: metric === k ? "#fff" : "inherit" }}
          >
            {METRICHE[k].label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "var(--space-3)", maxHeight: 210, overflowY: "auto", border: "1px solid var(--color-divider)", borderRadius: 8, padding: "var(--space-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
          <strong style={{ fontSize: "0.85rem" }}>Regioni ({selected.size}/{regioni.length})</strong>
          <span style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSelected(new Set(regioni))} style={lnk}>Tutte</button>
            <button onClick={() => setSelected(new Set())} style={lnk}>Nessuna</button>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 2 }}>
          {regioni.map((r) => (
            <label key={r} style={{ fontSize: "0.85rem", display: "flex", gap: 6, alignItems: "center", cursor: "pointer", padding: "2px 4px" }}>
              <input type="checkbox" checked={selected.has(r)} onChange={() => toggle(r)} />
              {regioneName(r)}
            </label>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => fmt(Number(v))} />
            <Tooltip formatter={(val, name) => [fmt(Number(val ?? 0)), String(name)]} />
            <Legend />
            {metric === "totale" && (
              <>
                <Bar dataKey="lavoro" name="In occasione di lavoro" fill="#b3261e" stackId="a" isAnimationActive={false} />
                <Bar dataKey="itinere" name="In itinere" fill="#e0a96d" stackId="a" isAnimationActive={false} />
                <Line type="monotone" dataKey="totale" name="Totale" stroke="#1f1f1f" dot={false} isAnimationActive={false} />
              </>
            )}
            {metric === "mortali" && (
              <>
                <Bar dataKey={vue === "annuale" ? "mortaliLavoro" : "mortali"} name="Mortali (lavoro)" fill="#7d1c19" stackId="m" isAnimationActive={false} />
                {vue === "annuale" && <Bar dataKey="mortaliItinere" name="Mortali (itinere)" fill="#4a1110" stackId="m" isAnimationActive={false} />}
                <Line type="monotone" dataKey="mortali" name="Totale mortali" stroke="#000" dot={false} isAnimationActive={false} />
              </>
            )}
            {metric === "menomati" && (
              <Bar dataKey="menomati" name="Danno permanente (casi)" fill="#44546a" isAnimationActive={false} />
            )}
            {metric === "giorni" && (
              <Bar dataKey="giorni" name="Giorni indennizzati" fill="#2f5d50" isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="source-note">
        {vue === "annuale"
          ? "Serie consolidata 2020-2024 (cadenza semestrale, tutte le regioni). Mortali, danno permanente e giorni indennizzati derivano dalla cadenza semestrale."
          : "Congiuntura mensile 2025-2026 (finestre gen-giu). Dato non consolidato, non confrontabile con la serie annuale. Mortali solo dove disponibili."}
        {" "}Selezionati: {filtroLabel}.
      </p>
    </div>
  );
}