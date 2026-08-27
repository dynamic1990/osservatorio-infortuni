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
import {
  getApprofondimenti,
  GESTIONE_LABEL,
  ESITO_LABEL,
  INDENNIZZO_LABEL,
  NASCITA_LABEL,
  MEZZO_LABEL,
  labelOf,
} from "@/lib/approfondimenti";
import { PALETTE } from "@/lib/palette";

type Dim = "gestione" | "esito" | "indennizzo" | "nascita" | "mezzo";

const DIM_LABEL: Record<Dim, string> = {
  gestione: "Gestione assicurativa",
  esito: "Esito amministrativo",
  indennizzo: "Tipo di indennizzo",
  nascita: "Luogo di nascita",
  mezzo: "Mezzo di trasporto",
};

const DIM_MAP: Record<Dim, { label: Record<string, string>; ordine: string[] }> = {
  gestione: { label: GESTIONE_LABEL, ordine: ["I", "S", "A"] },
  esito: { label: ESITO_LABEL, ordine: ["P", "N", "F", "I"] },
  indennizzo: { label: INDENNIZZO_LABEL, ordine: ["TE", "NE", "CA", "RD", "RS"] },
  nascita: { label: NASCITA_LABEL, ordine: ["Italia", "Estero"] },
  mezzo: { label: MEZZO_LABEL, ordine: ["Con mezzo", "Senza mezzo"] },
};

export function DimensioniWidget() {
  const d = useMemo(() => getApprofondimenti(), []);
  const [dim, setDim] = useState<Dim>("gestione");

  const { label, ordine } = DIM_MAP[dim];
  const data = useMemo(() => {
    return d.dimensioni[dim].map((r) => {
      const out: Record<string, number | string> = { anno: r.anno };
      for (const k of ordine) out[k] = r[k] ?? 0;
      return out;
    });
  }, [d, dim, ordine]);

  const conTotale = data.map((r) => {
    let tot = 0;
    for (const k of ordine) tot += Number(r[k] ?? 0);
    return { ...r, totale: tot };
  });

  return (
    <div>
      <div style={{ marginBottom: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {(Object.keys(DIM_LABEL) as Dim[]).map((k) => (
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

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={conTotale} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v)} />
            <Tooltip formatter={(val, name) => [Number(val ?? 0).toLocaleString("it-IT"), String(name)]} />
            <Legend />
            {ordine.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={labelOf(label, k)}
                fill={PALETTE[i % PALETTE.length]}
                stackId="a"
                isAnimationActive={false}
              />
            ))}
            <Line type="monotone" dataKey="totale" name="Totale" stroke="#201e1d" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        {dim === "gestione" && "Gestione assicurativa INAIL: Industria e servizi (dipendenti privati), Conto Stato (dipendenti pubblici), Agricoltura."}
        {dim === "esito" && "Esito della pratica amministrativa: positivo = infortunio riconosciuto; negativo = non riconosciuto; in fase di definizione = ancora aperto."}
        {dim === "indennizzo" && "Tipo di prestazione erogata: inabilità temporanea, nessun indennizzo, capitale (danno biologico 6-15%), rendita diretta, rendita ai superstiti."}
        {dim === "nascita" && "Luogo di nascita dell'infortunato (fonte: campo LuogoNascita). Italia = nati in Italia; Estero = nati all'estero (aree ISTAT Z)."}
        {dim === "mezzo" && "Presenza di mezzo di trasporto nell'infortunio (fonte: campo ConSenzaMezzoTrasporto). Utile per leggere la componente stradale degli infortuni in itinere."}
      </p>
    </div>
  );
}