"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { regioneName } from "@/lib/labels";
import { RISK_SCALE, ACCENT, LINK } from "@/lib/palette";

// Sezione dedicata ai limiti del dato: tre cose che il sito dichiara invece di
// nascondere, perché cambiano il modo in cui vanno letti tutti gli altri numeri.

const num = (v: number, dec = 1) => v.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0 || n !== ys.length) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

interface PuntoDispersione {
  regione: string;
  nome: string;
  incidenza: number;
  letalita: number;
  casi: number;
  mortali: number;
}

export function LimitiDatoSection() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2025");

  const annoData = useMemo(
    () => multidim.perAnno[anno] || multidim.consolidatoTotale,
    [multidim, anno],
  );

  const punti = useMemo<PuntoDispersione[]>(() => {
    return annoData.regioni.map((r) => ({
      regione: r.regione,
      nome: regioneName(r.regione),
      incidenza: r.indiceIncidenza,
      letalita: r.totale > 0 ? Number(((r.mortali / r.totale) * 100).toFixed(3)) : 0,
      casi: r.totale,
      mortali: r.mortali,
    }));
  }, [annoData]);

  const { mediaIncidenza, mediaLetalita, correlazione } = useMemo(() => {
    const inc = punti.map((p) => p.incidenza);
    const let_ = punti.map((p) => p.letalita);
    return {
      mediaIncidenza: Number((inc.reduce((a, b) => a + b, 0) / (inc.length || 1)).toFixed(2)),
      mediaLetalita: Number((let_.reduce((a, b) => a + b, 0) / (let_.length || 1)).toFixed(3)),
      correlazione: Number(pearson(inc, let_).toFixed(2)),
    };
  }, [punti]);

  // Graduatoria dei casi senza settore attribuito
  const righeSettoreND = useMemo(() => {
    return [...annoData.regioni]
      .map((r) => ({
        regione: r.regione,
        nome: regioneName(r.regione),
        quota: r.quotaSettoreND ?? 0,
        casi: r.settoreND ?? 0,
        totale: r.totale,
      }))
      .sort((a, b) => b.quota - a.quota);
  }, [annoData]);

  const quotaSettoreNDNazionale = useMemo(() => {
    const nd = annoData.regioni.reduce((acc, r) => acc + (r.settoreND ?? 0), 0);
    return annoData.totale > 0 ? Number(((nd / annoData.totale) * 100).toFixed(1)) : 0;
  }, [annoData]);

  const righeRigetto = useMemo(() => {
    return [...annoData.regioni]
      .map((r) => ({
        regione: r.regione,
        nome: regioneName(r.regione),
        tasso: r.tassoRigetto ?? 0,
        negativi: r.esito?.N ?? 0,
        definizione: r.esito?.F ?? 0,
        totale: r.totale,
      }))
      .sort((a, b) => b.tasso - a.tasso);
  }, [annoData]);

  const rigettoNazionale = useMemo(() => {
    const neg = annoData.regioni.reduce((acc, r) => acc + (r.esito?.N ?? 0) + (r.esito?.F ?? 0), 0);
    return annoData.totale > 0 ? Number(((neg / annoData.totale) * 100).toFixed(1)) : 0;
  }, [annoData]);

  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      {/* Selettore anno, comune ai tre blocchi */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: "var(--space-3)",
        }}
      >
        <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Anno:</span>
        {multidim.anniDisponibili.map((a) => (
          <button
            key={a}
            onClick={() => setAnno(a)}
            className={`btn-pill ${anno === a ? "active" : ""}`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* 1. Dispersione incidenza / letalità */}
      <section aria-label="Dispersione tra incidenza e letalità">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 var(--space-1)" }}>
          Dove si denuncia di più non si muore di più
        </h3>
        <p className="card-desc" style={{ marginBottom: "var(--space-3)" }}>
          Ogni punto è una regione: sull&apos;asse orizzontale le denunce ogni 1.000 occupati, su quello
          verticale i morti ogni 100 denunce. Se le due cose andassero nella stessa direzione, i punti
          seguirebbero una linea crescente. Nel {anno} la correlazione tra le due misure è{" "}
          <strong>{num(correlazione, 2).replace("-", "−")}</strong>: più denunce
          significa, se mai, meno letalità. È il segno che le due misure raccontano fenomeni diversi, e che
          confrontare le regioni su una sola delle due produce classifiche opposte.
        </p>

        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, bottom: 26, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                type="number"
                dataKey="incidenza"
                name="Incidenza"
                tick={{ fontSize: 11 }}
                domain={[0, "dataMax + 4"]}
                label={{ value: "Denunce ogni 1.000 occupati", position: "bottom", fontSize: 11, offset: 10 }}
              />
              <YAxis
                type="number"
                dataKey="letalita"
                name="Letalità"
                tick={{ fontSize: 11 }}
                domain={[0, "dataMax + 0.08"]}
                tickFormatter={(v: number) => v.toFixed(2)}
                label={{
                  value: "Morti ogni 100 denunce (%)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  offset: 8,
                  style: { textAnchor: "middle" },
                }}
              />
              <ZAxis type="number" dataKey="casi" range={[50, 420]} />
              <ReferenceLine y={mediaLetalita} stroke={ACCENT} strokeDasharray="4 4" strokeWidth={1.4} />
              <ReferenceLine x={mediaIncidenza} stroke={ACCENT} strokeDasharray="4 4" strokeWidth={1.4} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const p = payload[0].payload as PuntoDispersione;
                  return (
                    <div className="custom-chart-tooltip">
                      <div className="tooltip-title">{p.nome}</div>
                      <div className="tooltip-row">
                        <span>Incidenza:</span>
                        <strong>{num(p.incidenza, 2)}‰</strong>
                      </div>
                      <div className="tooltip-row">
                        <span>Letalità:</span>
                        <strong>{num(p.letalita, 3)}%</strong>
                      </div>
                      <div className="tooltip-row">
                        <span>Morti / denunce:</span>
                        <strong>
                          {p.mortali} su {p.casi.toLocaleString("it-IT")}
                        </strong>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter data={punti} fill={LINK} fillOpacity={0.75} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
          Linee tratteggiate: media semplice delle 20 regioni (incidenza {num(mediaIncidenza, 2)}‰, letalità{" "}
          {num(mediaLetalita, 3)}%). La dimensione del punto è
          proporzionale alle denunce: le regioni piccole sono anche le più instabili, perché pochi casi
          spostano molto il rapporto.
        </p>
      </section>

      {/* 2. Quota di casi senza settore */}
      <section aria-label="Quota di casi senza settore attribuito">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 var(--space-1)" }}>
          Un terzo delle denunce non ha un settore attribuito
        </h3>
        <p className="card-desc" style={{ marginBottom: "var(--space-3)" }}>
          A livello nazionale il <strong>{num(quotaSettoreNDNazionale)}%</strong> dei casi del {anno} non riporta un
          codice ATECO utile. La quota non è distribuita in modo uniforme: si va dal{" "}
          <strong>{num(righeSettoreND[righeSettoreND.length - 1]?.quota ?? 0)}%</strong> di{" "}
          {righeSettoreND[righeSettoreND.length - 1]?.nome} al{" "}
          <strong>{num(righeSettoreND[0]?.quota ?? 0)}%</strong> di {righeSettoreND[0]?.nome}. Finché la quota non è
          dichiarata, ogni confronto settoriale tra regioni confronta in realtà due cose diverse: i casi
          classificati in una regione e una parte più o meno grande di casi non classificati nell&apos;altra.
        </p>

        <div style={{ display: "grid", gap: 4 }}>
          {righeSettoreND.map((r) => (
            <div
              key={r.regione}
              style={{ display: "grid", gridTemplateColumns: "130px 1fr 92px", alignItems: "center", gap: 8 }}
            >
              <span style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.nome}
              </span>
              <div style={{ background: "var(--color-surface)", height: 14, borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, (r.quota / Math.max(1, righeSettoreND[0]?.quota ?? 1)) * 100)}%`,
                    height: "100%",
                    background: RISK_SCALE[3],
                  }}
                />
              </div>
              <span style={{ fontSize: "0.78rem", textAlign: "right", color: "var(--color-text-soft)" }}>
                {num(r.quota)}% · {r.casi.toLocaleString("it-IT")}
              </span>
            </div>
          ))}
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
          Campo <code>SettoreAttivitaEconomica</code> assente o non valido nei record INAIL. La seconda cifra è
          il numero assoluto di casi non classificati: le regioni grandi pesano più di quanto dica la
          percentuale.
        </p>
      </section>

      {/* 3. Tasso di rigetto */}
      <section aria-label="Tasso di rigetto delle denunce">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 var(--space-1)" }}>
          Tre denunce su dieci non arrivano a un riconoscimento
        </h3>
        <p className="card-desc" style={{ marginBottom: "var(--space-3)" }}>
          A livello nazionale il <strong>{num(rigettoNazionale)}%</strong> delle denunce del {anno} ha esito
          negativo o è ancora in fase di definizione. Non è un tasso di frode: comprende i casi respinti per
          motivi tecnici, quelli chiusi senza indennizzo e quelli non ancora decisi. Ma è la ragione per cui
          il numero di denunce non coincide con il numero di infortuni riconosciuti, e va tenuto presente
          prima di leggere qualunque classifica.
        </p>

        <div style={{ display: "grid", gap: 4 }}>
          {righeRigetto.map((r) => (
            <div
              key={r.regione}
              style={{ display: "grid", gridTemplateColumns: "130px 1fr 92px", alignItems: "center", gap: 8 }}
            >
              <span style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.nome}
              </span>
              <div style={{ background: "var(--color-surface)", height: 14, borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, (r.tasso / Math.max(1, righeRigetto[0]?.tasso ?? 1)) * 100)}%`,
                    height: "100%",
                    background: RISK_SCALE[4],
                  }}
                />
              </div>
              <span style={{ fontSize: "0.78rem", textAlign: "right", color: "var(--color-text-soft)" }}>
                {num(r.tasso)}% · {r.totale.toLocaleString("it-IT")}
              </span>
            </div>
          ))}
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
          Esiti «negativo» (N) e «in fase di definizione» (F) sul totale delle denunce della regione. La
          seconda cifra è il totale delle denunce: una percentuale alta su poche denunce pesa meno di una
          percentuale media su centomila.
        </p>
      </section>
    </div>
  );
}
