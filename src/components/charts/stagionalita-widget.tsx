"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export function StagionalitaWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);

  // Anni 2020-2024: disponibili con dettaglio mensile nel consolidato INAIL
  const anni = useMemo(() => {
    return multidim.anniDisponibili
      .filter((a) => Number(a) >= 2020 && Number(a) <= 2024 && multidim.perAnno[a]?.mensile)
      .sort((a, b) => Number(a) - Number(b));
  }, [multidim]);

  const [annoSel, setAnnoSel] = useState<string>(anni[anni.length - 1] || "2024");

  const data = useMemo(() => {
    const anno = multidim.perAnno[annoSel];
    if (!anno?.mensile) return [];
    return MESI.map((mese, i) => ({
      mese,
      casi: anno.mensile[String(i + 1)] ?? 0,
    }));
  }, [multidim, annoSel]);

  const max = Math.max(...data.map((x) => x.casi), 0);
  const min = Math.min(...data.map((x) => x.casi), 0);
  const totAnno = data.reduce((acc, x) => acc + x.casi, 0);
  const media = totAnno / 12;
  const idxMax = data.findIndex((d) => d.casi === max);
  const meseMax = idxMax >= 0 ? MESI[idxMax] : "";

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Intestazione e selettore anno */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Andamento mensile infortuni ({annoSel})
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Anno:</span>
          {anni.map((a) => (
            <button
              key={a}
              onClick={() => setAnnoSel(a)}
              className={`btn-pill ${annoSel === a ? "btn-pill-accent active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Grafico a linee mensile */}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={54} tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v)} />
            <Tooltip formatter={(val) => [Number(val ?? 0).toLocaleString("it-IT"), "Casi"]} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: "0.82rem" }} />
            <ReferenceLine y={media} stroke="var(--color-text-soft)" strokeDasharray="4 4" label={{ value: "Media anno", position: "insideTopRight", fontSize: 11 }} />
            <Line type="monotone" dataKey="casi" name="Casi denunciati" stroke="#b3261e" strokeWidth={2.5} dot={{ r: 3, fill: "#b3261e" }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="source-note">
        Distribuzione per mese di accadimento nell&apos;anno selezionato, dato consolidato INAIL 2020-2024
        (tutte le regioni). Totale anno: <strong>{totAnno.toLocaleString("it-IT")}</strong> casi, picco mensile{" "}
        <strong>{max.toLocaleString("it-IT")}</strong> ({meseMax}), minimo <strong>{min.toLocaleString("it-IT")}</strong>.
        La stagionalità produttiva (edilizia, agricoltura) spiega gli andamenti: utile per pianificare le
        campagne di prevenzione. Per gli anni 2014-2019 la disaggregazione mensile non è esposta dalle API
        INAIL; resta disponibile la serie annuale consolidata nella sezione dedicata.
      </p>
    </div>
  );
}
