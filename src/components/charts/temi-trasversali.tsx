"use client";

import { useEffect, useMemo, useState } from "react";

interface TemaSerie {
  anno: number;
  mortali: number;
  gravi: number;
  totale: number;
  quotaMortali?: number | null;
  quotaGravi?: number | null;
}

interface TemaSettore {
  sezione: string;
  casi: number;
  quota: number;
}

interface TemaIncidente {
  incidente: string;
  casi: number;
  quota: number;
}

interface TemaFattore {
  tipo: string;
  n: number;
  quota: number;
}

interface TemaProblema {
  problema: string;
  n: number;
}

interface TemaEsempio {
  anno?: number;
  codice?: number;
  esito?: string;
  settore?: string | null;
  dinamica: string;
}

interface Tema {
  label: string;
  nota: string;
  periodo: string;
  totale: number;
  mortali: number;
  gravi: number;
  serie: TemaSerie[];
  settori: TemaSettore[];
  incidenti: TemaIncidente[];
  fattori: TemaFattore[];
  problemi: TemaProblema[];
  esempi: TemaEsempio[];
}

interface TemiData {
  meta?: { nota?: string; periodo?: string; fonte?: string };
  temi: Record<string, Tema>;
}

const SEZIONI_ATECO: Record<string, string> = {
  A: "Agricoltura e pesca",
  B: "Estrattive",
  C: "Manifatturiero",
  D: "Energia",
  E: "Acqua e rifiuti",
  F: "Costruzioni",
  G: "Commercio",
  H: "Trasporti e logistica",
  I: "Alloggio e ristorazione",
  K: "Finanza",
  M: "Attività professionali",
  O: "PA e difesa",
  P: "Istruzione",
  Q: "Sanità",
  S: "Altri servizi",
  T: "Famiglie",
  U: "Extraterritoriali",
};

// Palette fissa per i tipi di fattore (coerente con il resto del sito).
const COLORE_TIPO: Record<string, string> = {
  "Attività dell'infortunato": "var(--color-accent)",
  "Attività di terzi": "var(--color-secondary)",
  "Utensili, macchine, impianti": "var(--color-chart-3, #8ab4f8)",
  "Ambiente": "var(--color-success)",
  "Dispositivi di protezione individuale e abbigliamento": "var(--color-warning, #fbbf24)",
  "Materiali": "var(--color-danger, #f87171)",
};

export function TemiTrasversali() {
  const [dati, setDati] = useState<TemiData | null>(null);
  const [temaAttivo, setTemaAttivo] = useState<string>("manutenzione");
  const [annoVista, setAnnoVista] = useState<number | "periodo">("periodo");

  useEffect(() => {
    fetch("/data/informo-temi.json")
      .then((r) => r.json())
      .then((d) => setDati(d as TemiData))
      .catch(() => setDati(null));
  }, []);

  const tema = useMemo(() => dati?.temi[temaAttivo], [dati, temaAttivo]);

  const anniDisponibili = useMemo(
    () => [...(tema?.serie ?? [])].sort((a, b) => a.anno - b.anno).map((s) => s.anno),
    [tema]
  );

  // Vista periodo (somma di tutti gli anni) o singolo anno
  const serieVista = useMemo(() => {
    if (!tema) {
      return { label: "", totale: 0, mortali: 0, gravi: 0 };
    }
    if (annoVista === "periodo") {
      const tot = tema.serie.reduce((acc, s) => acc + s.totale, 0);
      const m = tema.serie.reduce((acc, s) => acc + s.mortali, 0);
      const g = tema.serie.reduce((acc, s) => acc + s.gravi, 0);
      return {
        label: `${tema.periodo} · intero periodo`,
        totale: tot,
        mortali: m,
        gravi: g,
      };
    }
    const s = tema.serie.find((x) => x.anno === annoVista);
    return {
      label: `Anno ${annoVista}`,
      totale: s?.totale ?? 0,
      mortali: s?.mortali ?? 0,
      gravi: s?.gravi ?? 0,
    };
  }, [tema, annoVista]);

  const maxSerie = useMemo(
    () => Math.max(1, ...(tema?.serie ?? []).map((s) => s.totale)),
    [tema]
  );

  if (!dati || !tema) {
    return (
      <p className="source-note" aria-live="polite">
        Caricamento analisi tematiche&hellip;
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      {/* Selettore temi */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {Object.entries(dati.temi).map(([id, t]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTemaAttivo(id); setAnnoVista("periodo"); }}
            style={{
              background: id === temaAttivo ? "var(--color-text)" : "transparent",
              color: id === temaAttivo ? "var(--color-raised)" : "var(--color-text)",
              border: "1px solid var(--color-divider)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.85rem",
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            {t.label}
            <span style={{ opacity: 0.7, marginLeft: 6, fontWeight: 500 }}>
              {t.totale.toLocaleString("it-IT")}
            </span>
          </button>
        ))}
      </div>

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
            Totale casi
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {serieVista.totale.toLocaleString("it-IT")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>{serieVista.label}</div>
        </div>
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
            Mortali
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-danger, #f87171)" }}>
            {serieVista.mortali.toLocaleString("it-IT")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            {serieVista.totale > 0 ? Math.round((serieVista.mortali / serieVista.totale) * 100) : 0}% del totale
          </div>
        </div>
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
            Gravi
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {serieVista.gravi.toLocaleString("it-IT")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            {serieVista.totale > 0 ? Math.round((serieVista.gravi / serieVista.totale) * 100) : 0}% del totale
          </div>
        </div>
      </div>

      {/* Serie storica */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Serie per anno</h2>
          <p className="card-desc">
            Casi riconducibili al tema per anno di accadimento, distinti tra mortali e gravi. Il grafico
            mostra il totale; seleziona un anno sotto per il dettaglio.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
          <button
            type="button"
            onClick={() => setAnnoVista("periodo")}
            style={{
              background: annoVista === "periodo" ? "var(--color-text)" : "transparent",
              color: annoVista === "periodo" ? "var(--color-raised)" : "var(--color-text)",
              border: "1px solid var(--color-divider)",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tutti
          </button>
          {anniDisponibili.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAnnoVista(a)}
              style={{
                background: annoVista === a ? "var(--color-text)" : "transparent",
                color: annoVista === a ? "var(--color-raised)" : "var(--color-text)",
                border: "1px solid var(--color-divider)",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            height: 180,
            borderBottom: "1px solid var(--color-divider)",
            backgroundImage: "linear-gradient(to top, color-mix(in srgb, var(--color-divider) 50%, transparent) 1px, transparent 1px)",
            backgroundSize: "100% 60px",
          }}
        >
          {tema.serie.map((s) => (
            <div
              key={s.anno}
              title={`${s.anno}: ${s.totale} casi (${s.mortali} mortali, ${s.gravi} gravi)`}
              style={{
                flex: 1,
                height: `${Math.max(3, (s.totale / maxSerie) * 100)}%`,
                background: annoVista === s.anno || annoVista === "periodo" ? "var(--color-accent)" : "color-mix(in srgb, var(--color-accent) 55%, transparent)",
                borderRadius: "3px 3px 0 0",
                minWidth: 0,
                position: "relative",
                cursor: "pointer",
              }}
              onClick={() => setAnnoVista(s.anno)}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 4 }}>
          <span>{anniDisponibili[0]}</span>
          <span>{anniDisponibili[anniDisponibili.length - 1]}</span>
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-3)", marginBottom: 0 }}>
          La selezione per parola chiave sulla dinamica è metodologica e la quota annuale si riferisce ai casi
          dell&apos;archivio Infor.MO analizzati, non al totale nazionale degli infortuni.
        </p>
      </div>

      {/* Settori + Incidenti */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Settori (sezione Ateco)</h2>
            <p className="card-desc">Distribuzione dei casi per macro-settore, dalla mappatura Ateco.</p>
          </div>
          {tema.settori.map((s) => (
            <div key={s.sezione} style={{ display: "grid", gap: 2, marginBottom: "var(--space-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span>
                  <strong>{s.sezione}</strong> · {SEZIONI_ATECO[s.sezione] ?? s.sezione}
                </span>
                <span style={{ color: "var(--color-text-soft)" }}>
                  {s.casi.toLocaleString("it-IT")} ({s.quota}%)
                </span>
              </div>
              <div style={{ height: 6, background: "var(--color-divider)", borderRadius: 3 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${s.quota}%`,
                    background: "var(--color-accent)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Modalità di accadimento</h2>
            <p className="card-desc">Le dinamiche incidentali più frequenti nel tema.</p>
          </div>
          {tema.incidenti.map((i) => (
            <div key={i.incidente} style={{ display: "grid", gap: 2, marginBottom: "var(--space-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span>{i.incidente}</span>
                <span style={{ color: "var(--color-text-soft)" }}>
                  {i.casi.toLocaleString("it-IT")} ({i.quota}%)
                </span>
              </div>
              <div style={{ height: 6, background: "var(--color-divider)", borderRadius: 3 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${i.quota}%`,
                    background: "var(--color-secondary)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fattori causali */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Fattori causali (classificazione Infor.MO)</h2>
          <p className="card-desc">
            La distribuzione dei fattori di rischio per tipo: attività dell&apos;infortunato, attività di terzi,
            utensili/macchine/impianti, ambiente, DPI, materiali.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
          {tema.fattori.map((f) => (
            <div key={f.tipo} style={{ padding: "var(--space-3)", background: "var(--color-raised)", borderRadius: 6, border: "1px solid var(--color-divider)" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: COLORE_TIPO[f.tipo] ?? "var(--color-text)" }}>
                {f.quota}%
              </div>
              <div style={{ fontSize: "0.75rem", lineHeight: 1.35, color: "var(--color-text-soft)" }}>
                {f.tipo} · {f.n} fattori
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Problemi di sicurezza */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">I problemi di sicurezza più frequenti</h2>
          <p className="card-desc">Dalla classificazione degli analisti INAIL sui singoli fattori.</p>
        </div>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {tema.problemi.map((p, idx) => (
            <div key={p.problema} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "0.85rem" }}>
              <span style={{ width: 24, textAlign: "right", color: "var(--color-text-muted)", fontWeight: 650 }}>{idx + 1}</span>
              <span style={{ flex: 1 }}>{p.problema}</span>
              <strong>{p.n}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Esempi di casi */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Casi reali dall&apos;archivio</h2>
          <p className="card-desc">
            Una selezione di casi (mortali e gravi) riconducibili al tema, con dinamica abbreviata. Il codice
            identifica il record nell&apos;archivio Infor.MO.
          </p>
        </div>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {tema.esempi.map((e, idx) => (
            <details key={idx} style={{ border: "1px solid var(--color-divider)", borderRadius: 6, padding: "var(--space-2) var(--space-3)" }}>
              <summary style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                {e.anno} · {e.esito === "mortale" ? "Mortale" : "Grave"} · {e.settore ?? "Settore n.d."}
                {e.anno ? <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 8 }}>cod. {e.codice}</span> : null}
              </summary>
              <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--color-text-soft)", marginTop: "var(--space-2)", marginBottom: 0 }}>
                {e.dinamica}
              </p>
            </details>
          ))}
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-3)", marginBottom: 0 }}>
          Esempi estratti dall&apos;archivio Infor.MO (InformoWeb). Dinamiche abbreviate alla descrizione
          originale; i testi integrali sono consultabili nell&apos;esploratore dei casi.
        </p>
      </div>
    </div>
  );
}