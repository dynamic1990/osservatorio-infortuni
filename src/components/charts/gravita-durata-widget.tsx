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
} from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { GRAVITA_LABEL, DURATA_LABEL, labelOf } from "@/lib/approfondimenti";
import { PALETTE } from "@/lib/palette";
import { FiltroModalita, type ModalitaState } from "./filtro-modalita";

type Dim = "gravita" | "durata";

const DIM_LABEL: Record<Dim, string> = {
  gravita: "Gravità del danno (grado di menomazione)",
  durata: "Durata dell'assenza (giorni indennizzati)",
};

// Chiavi presenti nei dati multidimensionali (perAnno[anno].gravita* / .durata*)
const ORDINE_GRAVITA = ["nessuna", "franchigia", "capitale", "rendita"];
const ORDINE_DURATA = ["zero", "breve", "media", "lunga", "grave90"];

export function GravitaDurataWidget() {
  const d = useMemo(() => getMultidimensionaleData(), []);
  const [dim, setDim] = useState<Dim>("gravita");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });

  const ordine = dim === "gravita" ? ORDINE_GRAVITA : ORDINE_DURATA;
  const labelMap = dim === "gravita" ? GRAVITA_LABEL : DURATA_LABEL;

  const data = useMemo(() => {
    return d.anniDisponibili.map((anno) => {
      const row = d.perAnno[anno];
      const serieLavoro = dim === "gravita" ? row.gravitaLavoro : row.durataLavoro;
      const serieItinere = dim === "gravita" ? row.gravitaItinere : row.durataItinere;
      const out: Record<string, number | string> = { anno };
      for (const k of ordine) {
        out[k] =
          (modalita.lavoro ? serieLavoro[k] ?? 0 : 0) +
          (modalita.itinere ? serieItinere[k] ?? 0 : 0);
      }
      return out;
    });
  }, [d, dim, modalita, ordine]);

  // totale per anno (per la linea di contesto) = somma delle modalità selezionate
  const conTotale = useMemo(
    () =>
      data.map((r) => {
        let tot = 0;
        for (const k of ordine) tot += Number(r[k] ?? 0);
        return { ...r, totale: tot };
      }),
    [data, ordine]
  );

  const palette =
    dim === "gravita"
      ? PALETTE.slice(0, 4)
      : ["#2f8f5b", "#c77d0a", "#d45b2c", "#b3261e", "#6e1c14"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {(["gravita", "durata"] as Dim[]).map((k) => (
            <button
              key={k}
              onClick={() => setDim(k)}
              style={{
                border: "1px solid var(--color-divider)",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: dim === k ? "var(--color-accent)" : "transparent",
                color: dim === k ? "#fff" : "inherit",
              }}
            >
              {DIM_LABEL[k]}
            </button>
          ))}
        </div>
        <FiltroModalita value={modalita} onChange={setModalita} size="sm" />
      </div>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={conTotale} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v)} />
            <Tooltip formatter={(val, name) => [Number(val ?? 0).toLocaleString("it-IT"), String(name)]} />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 10, fontSize: "0.8rem" }} />
            {ordine.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={labelOf(labelMap, k)}
                fill={palette[i]}
                stackId="a"
                isAnimationActive={false}
              />
            ))}
            <Line type="monotone" dataKey="totale" name="Totale" stroke="#201e1d" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        {dim === "gravita"
          ? "Grado di menomazione accertato a fine pratica (fonte: campo GradoMenomazione, cadenza semestrale). Le soglie seguono la normativa INAIL: franchigia 0-5%, indennizzo in capitale 6-15%, rendita oltre il 15%. La quota 'nessuna menomazione' comprende i casi senza danno biologico permanente."
          : "Giorni di inabilità indennizzati (fonte: campo GiorniIndennizzati, cadenza semestrale). Classi di durata costruite per la lettura del rischio: oltre 90 giorni indica infortuni con impatto produttivo e sanitario prolungato."}
      </p>
    </div>
  );
}
