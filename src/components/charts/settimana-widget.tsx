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
} from "recharts";
import {
  coloreAnno,
  getSettimanaData,
  GIORNI_SETTIMANA,
  serieGiorni,
  type AnnoSettimana,
} from "@/lib/inail-settimana";
import { exactNumber, percent } from "@/lib/format";
import { ACCENT, LINK } from "@/lib/palette";
import { FiltroModalita, type ModalitaState } from "./filtro-modalita";

type Tipo = "casi" | "mortali";
type Scala = "assoluto" | "media";

const TIPO_LABEL: Record<Tipo, string> = {
  casi: "Denunce totali",
  mortali: "Denunce mortali",
};

const SCALA_LABEL: Record<Scala, string> = {
  assoluto: "Valori assoluti",
  media: "Media per giorno",
};

// Distribuzione per giorno della settimana delle denunce INAIL (open data, livello
// record). Il grafico affianca un anno per serie: nessun valore aggregato su più
// anni (RULES.md Regola 1). La lettura "media per giorno" normalizza il calendario,
// perché di lunedì ce ne sono ~4,3 volte più che di domenica.
export function SettimanaWidget() {
  const dati = useMemo(() => getSettimanaData(), []);
  const anni = dati.anni;
  const ultimo = anni[anni.length - 1]?.anno;

  const [tipo, setTipo] = useState<Tipo>("casi");
  const [scala, setScala] = useState<Scala>("assoluto");
  const [modalita, setModalita] = useState<ModalitaState>({ lavoro: true, itinere: true });
  const [selezionati, setSelezionati] = useState<number[]>(ultimo ? [ultimo] : []);

  const anniSel = useMemo(
    () => anni.filter((a) => selezionati.includes(a.anno)),
    [anni, selezionati]
  );

  const toggleAnno = (anno: number) => {
    setSelezionati((prev) =>
      prev.includes(anno)
        ? prev.length > 1
          ? prev.filter((a) => a !== anno)
          : prev
        : [...prev, anno].sort((a, b) => a - b)
    );
  };

  // Riga per giorno, una colonna per anno selezionato.
  const data = useMemo(() => {
    return GIORNI_SETTIMANA.map((giorno) => {
      const riga: Record<string, number | string> = { giorno };
      for (const anno of anniSel) {
        const serie = serieGiorni(anno, modalita, tipo);
        const voce = serie.find((g) => g.giorno === giorno);
        riga[String(anno.anno)] =
          scala === "assoluto" ? (voce?.casi ?? 0) : (voce?.mediaPerGiorno ?? 0);
      }
      return riga;
    });
  }, [anniSel, modalita, tipo, scala]);

  // Riferimento: anno più recente selezionato, confrontato con l'anno precedente
  // presente nel dataset (Regola 2: delta sempre, se disponibile).
  const rif = anniSel[anniSel.length - 1];
  const prec = rif ? anni.find((a) => a.anno === rif.anno - 1) : undefined;

  const totaleRif = rif
    ? tipo === "casi"
      ? serieGiorni(rif, modalita, "casi").reduce((acc, g) => acc + g.casi, 0)
      : serieGiorni(rif, modalita, "mortali").reduce((acc, g) => acc + g.casi, 0)
    : 0;
  const totalePrec = prec
    ? tipo === "casi"
      ? serieGiorni(prec, modalita, "casi").reduce((acc, g) => acc + g.casi, 0)
      : serieGiorni(prec, modalita, "mortali").reduce((acc, g) => acc + g.casi, 0)
    : 0;
  const delta = totalePrec ? totaleRif - totalePrec : null;
  const deltaPerc = totalePrec ? (totaleRif - totalePrec) / totalePrec : null;

  const weekendShare = (anno: AnnoSettimana) => {
    const serie = serieGiorni(anno, modalita, tipo);
    const tot = serie.reduce((acc, g) => acc + g.casi, 0);
    const we = serie
      .filter((g) => g.giorno === "Sab" || g.giorno === "Dom")
      .reduce((acc, g) => acc + g.casi, 0);
    return tot ? we / tot : 0;
  };

  const fmtAsse = (v: number) =>
    scala === "assoluto" && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Denunce per giorno della settimana
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Open data INAIL, livello record, 20 regioni · {dati.periodo.da}–{dati.periodo.a}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            {(Object.keys(TIPO_LABEL) as Tipo[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTipo(k)}
                className={`btn-pill ${tipo === k ? "active" : ""}`}
                aria-pressed={tipo === k}
              >
                {TIPO_LABEL[k]}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            {(Object.keys(SCALA_LABEL) as Scala[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setScala(k)}
                className={`btn-pill ${scala === k ? "active" : ""}`}
                aria-pressed={scala === k}
              >
                {SCALA_LABEL[k]}
              </button>
            ))}
          </div>
          <FiltroModalita value={modalita} onChange={setModalita} size="sm" />
        </div>
      </div>

      {/* Selettore anni multiplo */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", marginRight: 4 }}>
          Anni:
        </span>
        {anni.map((a) => {
          const attivo = selezionati.includes(a.anno);
          return (
            <button
              key={a.anno}
              type="button"
              onClick={() => toggleAnno(a.anno)}
              className={`btn-pill ${attivo ? "active" : ""}`}
              aria-pressed={attivo}
              style={
                attivo
                  ? { background: coloreAnno(anni.indexOf(a), anni.length), borderColor: coloreAnno(anni.indexOf(a), anni.length) }
                  : { borderColor: coloreAnno(anni.indexOf(a), anni.length), color: coloreAnno(anni.indexOf(a), anni.length) }
              }
            >
              {a.anno}
            </button>
          );
        })}
      </div>

      {/* Riga di sintesi: anno di riferimento vs anno precedente */}
      {rif ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            alignItems: "baseline",
            borderTop: "1px solid var(--color-divider)",
            borderBottom: "1px solid var(--color-divider)",
            padding: "var(--space-3) 0",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
              {TIPO_LABEL[tipo]} · {rif.anno}
            </div>
            <div className="metric-value" style={{ fontSize: "1.9rem", color: ACCENT }}>
              {exactNumber(totaleRif)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
              Δ vs {rif.anno - 1}
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              {delta === null ? (
                <span style={{ color: "var(--color-text-soft)" }}>serie non disponibile</span>
              ) : (
                <>
                  {delta > 0 ? "+" : ""}
                  {exactNumber(delta)}
                  {deltaPerc !== null ? (
                    <span style={{ fontWeight: 550, fontSize: "0.9rem" }}>
                      {" "}
                      ({delta > 0 ? "+" : ""}
                      {percent(deltaPerc, 1)})
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
              Quota sabato + domenica
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: LINK }}>
              {percent(weekendShare(rif), 1)}
              {prec ? (
                <span style={{ fontWeight: 550, fontSize: "0.88rem", color: "var(--color-text-soft)" }}>
                  {" "}
                  (era {percent(weekendShare(prec), 1)} nel {prec.anno})
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Grafico */}
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 16, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis dataKey="giorno" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={54}
              tickFormatter={(v) => fmtAsse(Number(v))}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const riga = payload[0]?.payload as Record<string, number | string> | undefined;
                if (!riga) return null;
                const giorno = String(riga.giorno ?? label ?? "");
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">
                      {giorno} · {TIPO_LABEL[tipo]} · {SCALA_LABEL[scala]}
                    </div>
                    {payload.map((serie, i) => {
                      const valore = Number(serie.value ?? 0);
                      const annoSerie = Number(serie.dataKey ?? 0);
                      const annoDati = anni.find((a) => a.anno === annoSerie);
                      // Denominatore esplicito: il totale dell'anno per il giorno,
                      // non la somma delle barre visibili (che con una serie sola
                      // darebbe 100%).
                      const totaleAnno = annoDati
                        ? serieGiorni(annoDati, modalita, tipo).reduce(
                            (acc, g) => acc + g.casi,
                            0
                          )
                        : 0;
                      const quota =
                        scala === "assoluto" && totaleAnno > 0 ? valore / totaleAnno : null;
                      return (
                        <div
                          className="tooltip-row"
                          key={`${String(serie.dataKey)}-${i}`}
                        >
                          <span
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <i
                              aria-hidden="true"
                              style={{
                                width: 8,
                                height: 8,
                                display: "inline-block",
                                background: coloreAnno(
                                  anni.findIndex((a) => a.anno === annoSerie),
                                  anni.length
                                ),
                                borderRadius: 2,
                                flexShrink: 0,
                              }}
                            />
                            {String(serie.name ?? annoSerie)}
                          </span>
                          <strong>
                            {scala === "assoluto"
                              ? exactNumber(Math.round(valore))
                              : valore.toLocaleString("it-IT", {
                                  maximumFractionDigits: 0,
                                })}
                            {quota !== null ? (
                              <span
                                style={{
                                  color: "var(--color-text-muted)",
                                  fontWeight: 550,
                                }}
                              >
                                {" "}
                                ({percent(quota, 1)} del totale {annoSerie})
                              </span>
                            ) : null}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 12, fontSize: "0.8rem" }}
            />
            {anniSel.map((a) => {
              const idx = anni.findIndex((x) => x.anno === a.anno);
              return (
                <Bar
                  key={a.anno}
                  dataKey={String(a.anno)}
                  name={String(a.anno)}
                  fill={coloreAnno(idx, anni.length)}
                  isAnimationActive={false}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Equivalente tabellare (RULES.md Regola 6) */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <caption
            style={{
              textAlign: "left",
              fontSize: "0.78rem",
              color: "var(--color-text-soft)",
              marginBottom: "var(--space-2)",
            }}
          >
            Stessi valori in tabella. Sotto ogni conteggio, la quota del giorno sul totale
            dell&apos;anno (le quote di ogni colonna sommano a 100%).
          </caption>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "right" }}>
              <th scope="col" style={{ textAlign: "left", color: "var(--color-text-soft)" }}>
                Giorno
              </th>
              {anniSel.map((a) => (
                <th key={a.anno} scope="col" style={{ textAlign: "right" }}>
                  {a.anno}
                </th>
              ))}
              <th scope="col" style={{ textAlign: "right" }}>
                Media/giorno ({rif?.anno ?? "—"})
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                Indice vs feriale
              </th>
            </tr>
          </thead>
          <tbody>
            {GIORNI_SETTIMANA.map((giorno) => {
              const serieRif = rif ? serieGiorni(rif, modalita, tipo) : [];
              const voce = serieRif.find((g) => g.giorno === giorno);
              return (
                <tr key={giorno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                  <th scope="row" style={{ textAlign: "left", fontWeight: 700 }}>
                    {giorno}
                  </th>
                  {anniSel.map((a) => {
                    const serieAnno = serieGiorni(a, modalita, tipo);
                    const voceAnno = serieAnno.find((g) => g.giorno === giorno);
                    const totAnno = serieAnno.reduce((acc, g) => acc + g.casi, 0);
                    const quota = totAnno > 0 ? (voceAnno?.casi ?? 0) / totAnno : null;
                    return (
                      <td key={a.anno} style={{ textAlign: "right" }}>
                        {exactNumber(voceAnno?.casi ?? 0)}
                        {quota !== null ? (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--color-text-soft)",
                              fontWeight: 550,
                            }}
                          >
                            {percent(quota, 1)}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right" }}>{exactNumber(voce?.mediaPerGiorno ?? 0)}</td>
                  <td style={{ textAlign: "right" }}>
                    {voce?.indiceVsFeriale !== null && voce?.indiceVsFeriale !== undefined
                      ? voce.indiceVsFeriale.toLocaleString("it-IT", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="source-note">
        Fonte: open data INAIL, dataset semestrali per regione con dettaglio record
        (<em>DataAccadimento</em>), 20 regioni, {exactNumber(dati.recordUsati)} denunce elaborate.
        Il giorno della settimana è derivato dalla data di accadimento: nessun record scartato per
        data non valida ({exactNumber(dati.recordScartati)}). Gli infortuni <em>in itinere</em> sono
        inclusi: usa il filtro per separarli.
        <br />
        <strong>Come si legge.</strong> In valori assoluti il grafico riflette il calendario
        lavorativo: di lunedì ce ne sono circa 4,3 volte più che di domenica. La vista{" "}
        <em>media per giorno</em> divide per il numero di giorni di quel tipo nell&apos;anno, quindi
        confronta giorni confrontabili; l&apos;indice in tabella rapporta ogni giorno alla media
        Lun–Ven (1,00 = giorno feriale medio). Non è un tasso di incidenza su occupati: il
        denominatore occupati per singolo giorno non è disponibile nella fonte.
      </p>
    </div>
  );
}
