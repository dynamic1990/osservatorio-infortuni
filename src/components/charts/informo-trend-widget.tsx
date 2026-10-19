"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  getInformoAnalisi,
  getInformoGraviAnalisi,
  type PerimetroInformo,
} from "@/lib/informo-casi";
import { ACCENT } from "@/lib/palette";
import { INFORM_GRAVI_COLOR } from "@/lib/informo-casi";

// Trend per anno degli infortuni analizzati da Infor.MO. Ogni barra è un
// anno distinto (RULES.md regola 1: la serie storica non è un aggregato).
// A seconda del perimetro selezionato la barra compone:
//   - mortali: casi analizzati (rosso) + quota senza scheda (chiaro), sul
//     totale delle denunce INAIL dove la serie nazionale esiste;
//   - gravi: solo i casi analizzati (slate), perché per i gravi non esiste
//     una serie nazionale INAIL comparabile;
//   - entrambi: mortali (rosso) e gravi (slate) in pila, più la quota senza
//     scheda dei mortali dove disponibile.
export function InformoTrendWidget({ perimetro = "mortali" }: { perimetro?: PerimetroInformo }) {
  const mortali = useMemo(() => getInformoAnalisi(), []);
  const gravi = useMemo(() => getInformoGraviAnalisi(), []);

  const chartData = useMemo(() => {
    const serieMortali = new Map(mortali.serie.map((s) => [s.anno, s]));
    const serieGravi = new Map(gravi.serie.map((s) => [s.anno, s]));
    const anni = new Set<number>([...serieMortali.keys(), ...serieGravi.keys()]);
    return Array.from(anni)
      .sort((a, b) => a - b)
      .map((anno) => {
        const m = serieMortali.get(anno);
        const g = serieGravi.get(anno);
        const casiMortali = m?.casiAnalizzati ?? 0;
        const casiGravi = g?.casiAnalizzati ?? 0;
        const totaleNazionale = m?.mortaliNazionali;
        const nonCoperti =
          totaleNazionale !== undefined && totaleNazionale !== null
            ? Math.max(0, totaleNazionale - casiMortali)
            : undefined;
        return {
          anno,
          casiMortali,
          casiGravi,
          totaleNazionale,
          nonCoperti,
        };
      });
  }, [mortali, gravi]);

  // Forma del grafico in base al perimetro: seleziona i dati da comporre.
  const showMortali = perimetro === "mortali" || perimetro === "entrambi";
  const showGravi = perimetro === "gravi" || perimetro === "entrambi";
  const showNonCoperti = perimetro === "mortali" || perimetro === "entrambi";

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
          Casi analizzati dall&apos;archivio Infor.MO per anno
        </div>
      </div>

      <div style={{ width: "100%", height: 330 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 16, bottom: 16, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis dataKey="anno" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={52} allowDecimals={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                const casiMortali = p.casiMortali ?? 0;
                const casiGravi = p.casiGravi ?? 0;
                const totNaz = p.totaleNazionale;
                const nonCoperte = p.nonCoperti;
                const coperturaMortali =
                  totNaz && totNaz > 0 ? Math.round((casiMortali / totNaz) * 1000) / 10 : null;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">Anno {label}</div>
                    {showMortali && (
                      <div className="tooltip-row">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <i aria-hidden="true" style={{ width: 8, height: 8, display: "inline-block", background: ACCENT, borderRadius: 2 }} />
                          Casi mortali analizzati:
                        </span>
                        <strong>{casiMortali}</strong>
                      </div>
                    )}
                    {showGravi && (
                      <div className="tooltip-row">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <i aria-hidden="true" style={{ width: 8, height: 8, display: "inline-block", background: INFORM_GRAVI_COLOR, borderRadius: 2 }} />
                          Casi gravi analizzati:
                        </span>
                        <strong>{casiGravi}</strong>
                      </div>
                    )}
                    {showMortali && totNaz !== undefined && totNaz !== null && (
                      <div className="tooltip-row">
                        <span>Morti denunciati (INAIL):</span>
                        <strong>{totNaz}</strong>
                      </div>
                    )}
                    {showNonCoperti && nonCoperte !== undefined && (
                      <div className="tooltip-row">
                        <span>Morti senza scheda di analisi:</span>
                        <strong>{nonCoperte}</strong>
                      </div>
                    )}
                    {coperturaMortali !== null && showMortali && (
                      <div className="tooltip-row">
                        <span>Copertura mortali sul totale denunciato:</span>
                        <strong>{coperturaMortali}%</strong>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {showMortali && (
              <Bar
                dataKey="casiMortali"
                name="Casi mortali analizzati Infor.MO"
                stackId="informo"
                fill={ACCENT}
                radius={[0, 0, 0, 0]}
                isAnimationActive={false}
              />
            )}
            {showGravi && (
              <Bar
                dataKey="casiGravi"
                name="Casi gravi analizzati Infor.MO"
                stackId="informo"
                fill={INFORM_GRAVI_COLOR}
                radius={[0, 0, 0, 0]}
                isAnimationActive={false}
              />
            )}
            {showNonCoperti && (
              <Bar
                dataKey="nonCoperti"
                name="Morti senza analisi Infor.MO"
                stackId="informo"
                fill="#f5f5f5"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda testuale sotto il grafico */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-2) var(--space-4)",
          fontSize: "0.8rem",
          color: "var(--color-text-soft)",
          paddingTop: "var(--space-1)",
        }}
      >
        {showMortali && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                display: "inline-block",
                background: ACCENT,
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            Casi mortali analizzati nell&apos;archivio Infor.MO
          </span>
        )}
        {showGravi && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                display: "inline-block",
                background: INFORM_GRAVI_COLOR,
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            Casi gravi analizzati nell&apos;archivio Infor.MO
          </span>
        )}
            {showNonCoperti && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    display: "inline-block",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-divider)",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                Morti denunciati senza scheda di analisi
              </span>
            )}
      </div>

      <p className="source-note">
        Ogni barra è un anno distinto (serie storica, non aggregato).{" "}
        {perimetro === "gravi" && (
          <>
            Per gli infortuni gravi INAIL non pubblica una serie nazionale dei
            denunciati con lo stesso perimetro dell&apos;archivio, quindi il grafico
            mostra i casi analizzati senza confronto con un totale nazionale.
          </>
        )}
        {perimetro === "mortali" && (
          <>
            L&apos;altezza della barra è il totale dei morti denunciati da INAIL
            (serie da denunce, disponibile dal 2014), la parte rossa in basso i
            casi con scheda di dettaglio nell&apos;archivio Infor.MO e la parte
            chiara i decessi denunciati senza analisi. Gli anni 2010-2013 non
            hanno il totale nazionale, quindi la barra mostra solo i casi
            analizzati.
          </>
        )}
        {perimetro === "entrambi" && (
          <>
            La pila compone i casi mortali (rosso) e i casi gravi (blu ardesia)
            analizzati dall&apos;archivio Infor.MO. Dove la serie nazionale dei
            decessi esiste (dal 2014), la parte chiara mostra i morti
            denunciati senza scheda di analisi; per i gravi non esiste un
            totale nazionale comparabile.
          </>
        )}
      </p>
    </div>
  );
}
