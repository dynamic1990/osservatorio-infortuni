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
import { PALETTE, MODAL_COLORS } from "@/lib/palette";

type Metric = "totale" | "mortali" | "menomati" | "giorni";
type Vue = "annuale" | "mensile";
type Modalita = "lavoro" | "itinere";

const METRICHE: Record<Metric, { label: string }> = {
  totale: { label: "Casi totali" },
  mortali: { label: "Esiti mortali" },
  menomati: { label: "Casi con danno permanente" },
  giorni: { label: "Giornate perse" },
};

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

function fmt(v: number, unit?: string) {
  if (unit === "gg" && v >= 1_000_000)
    return `${(v / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} M gg`;
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
const check: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid var(--color-divider)",
};

export function SerieTemporaleWidget() {
  const t: Temporale = useMemo(() => getTemporale(), []);
  const regioni = useMemo(() => {
    const set = new Set<string>();
    for (const r of t.serieAnnuale) set.add(r.regione);
    return Array.from(set).sort();
  }, [t]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalita, setModalita] = useState<Set<Modalita>>(new Set(["lavoro", "itinere"]));
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
  const toggleModal = (m: Modalita) => {
    setModalita((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const raw = vue === "annuale" ? aggregatoAnnuale(t, attive) : aggregatoMensile(t, attive);

  // Applica filtro modalità: se nessuna selezionata, mostra totale
  const hasLavoro = modalita.has("lavoro");
  const hasItinere = modalita.has("itinere");
  const data = raw.map((r) => ({
    ...r,
    lavoro: hasLavoro ? r.lavoro : 0,
    itinere: hasItinere ? r.itinere : 0,
    totale:
      hasLavoro && hasItinere
        ? r.totale
        : hasLavoro
          ? r.lavoro
          : hasItinere
            ? r.itinere
            : 0,
  }));

  const filtroLabel = !attive
    ? "Tutte le regioni"
    : attive.size === 1
      ? regioneName([...attive][0])
      : `${attive.size} regioni`;

  const xKey = vue === "annuale" ? "anno" : "label";
  const isEmpty = modalita.size === 0;

  return (
    <div>
      {/* vista + regioni filtrate */}
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

      {/* metrica */}
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

      {/* filtro multiselezione modalità */}
      <div style={{ marginBottom: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {([
          ["lavoro", "In occasione di lavoro", MODAL_COLORS.lavoro],
          ["itinere", "In itinere", MODAL_COLORS.itinere],
        ] as [Modalita, string, string][]).map(([m, label, color]) => (
          <label key={m} style={{ ...check, background: modalita.has(m) ? color : "transparent", color: modalita.has(m) ? "#fff" : "inherit", borderColor: color }}>
            <input
              type="checkbox"
              checked={modalita.has(m)}
              onChange={() => toggleModal(m)}
              style={{ margin: 0 }}
            />
            {label}
          </label>
        ))}
        <button onClick={() => setModalita(new Set(["lavoro", "itinere"]))} style={pill}>Tutte</button>
      </div>

      {/* filtri regioni multiselezione */}
      <div style={{ marginBottom: "var(--space-3)", maxHeight: 200, overflowY: "auto", border: "1px solid var(--color-divider)", borderRadius: 8, padding: "var(--space-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
          <strong style={{ fontSize: "0.85rem" }}>Filtra regioni</strong>
          <span style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSelected(new Set(regioni))} style={pill}>Tutte</button>
            <button onClick={() => setSelected(new Set())} style={pill}>Nessuna</button>
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

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => fmt(Number(v))} />
            <Tooltip formatter={(val, name) => [fmt(Number(val ?? 0)), String(name)]} />
            <Legend />
            {metric === "totale" && (
              <>
                <Bar dataKey="lavoro" name="In occasione di lavoro" fill={MODAL_COLORS.lavoro} stackId="a" isAnimationActive={false} />
                <Bar dataKey="itinere" name="In itinere" fill={MODAL_COLORS.itinere} stackId="a" isAnimationActive={false} />
                {!isEmpty && <Line type="monotone" dataKey="totale" name="Totale" stroke="#201e1d" dot={false} isAnimationActive={false} />}
              </>
            )}
            {metric === "mortali" && (
              <>
                <Bar dataKey={vue === "annuale" ? "mortaliLavoro" : "mortali"} name="Mortali (lavoro)" fill={MODAL_COLORS.lavoro} stackId="m" isAnimationActive={false} />
                {vue === "annuale" && <Bar dataKey="mortaliItinere" name="Mortali (itinere)" fill={MODAL_COLORS.itinere} stackId="m" isAnimationActive={false} />}
                <Line type="monotone" dataKey="mortali" name="Totale mortali" stroke="#201e1d" dot={false} isAnimationActive={false} />
              </>
            )}
            {metric === "menomati" && (
              <Bar dataKey="menomati" name="Casi con danno permanente" fill={PALETTE[1]} isAnimationActive={false} />
            )}
            {metric === "giorni" && (
              <Bar dataKey="giorni" name="Giorni di lavoro persi" fill={PALETTE[2]} isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {isEmpty && (
        <p style={{ color: "var(--color-text-soft)", fontSize: "0.9rem" }}>Seleziona almeno una modalità per vedere i dati.</p>
      )}
      <p className="source-note">
        {vue === "annuale"
          ? "Serie consolidata 2020-2024 (cadenza semestrale, tutte le regioni). Mortali, danno permanente e giorni persi derivano dalla cadenza semestrale."
          : "Congiuntura mensile 2025-2026 (finestre gen-giu). Dato non consolidato, non confrontabile con la serie annuale."}
        {" "}Selezionati: {filtroLabel}.
      </p>
    </div>
  );
}