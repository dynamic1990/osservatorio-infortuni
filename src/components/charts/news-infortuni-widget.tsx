"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import newsRaw from "@/data/generated/news-infortuni.json";

interface Notizia {
  titolo: string;
  fonte: string;
  link: string;
  data: string;
  categoria: string;
  provincia?: string | null;
  regione?: string | null;
  workAccidentScore: number;
  scoreReasons?: string[];
}

interface NewsPayload {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  periodo: string;
  notizie: Notizia[];
}

const ITEMS_PER_SLIDE = 5;

function formatData(dataStr: string): string {
  try {
    return new Date(dataStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dataStr;
  }
}

export function NewsInfortuniWidget() {
  const dati = useMemo(() => newsRaw as unknown as NewsPayload, []);
  const notizie = useMemo(() => {
    return (dati.notizie || [])
      .filter((n) => (n.workAccidentScore ?? 0) >= 40)
      .sort((a, b) => {
        const ta = new Date(a.data).getTime() || 0;
        const tb = new Date(b.data).getTime() || 0;
        const dateDelta = tb - ta;
        if (dateDelta !== 0) return dateDelta;
        return (b.workAccidentScore ?? 0) - (a.workAccidentScore ?? 0);
      })
  }, [dati]);

  const [slide, setSlide] = useState(0);
  const totaleSlides = Math.max(1, Math.ceil(notizie.length / ITEMS_PER_SLIDE));
  const slideSicura = Math.min(slide, totaleSlides - 1);
  const visibili = notizie.slice(
    slideSicura * ITEMS_PER_SLIDE,
    slideSicura * ITEMS_PER_SLIDE + ITEMS_PER_SLIDE
  );

  const prev = () => setSlide((s) => (s <= 0 ? totaleSlides - 1 : s - 1));
  const next = () => setSlide((s) => (s >= totaleSlides - 1 ? 0 : s + 1));

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      {/* Intestazione compatta con contatore e navigazione */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)" }}>
          <strong>{notizie.length}</strong> segnalazioni pertinenti sul lavoro negli ultimi 7 giorni
          <span style={{ color: "var(--color-text-muted)" }}>
            {" · Aggiornato: "}
            {formatData(dati.generatedAt)}
          </span>
        </span>

        {/* Navigazione carosello */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button
            aria-label="Scorri indietro"
            onClick={prev}
            style={{
              border: "1px solid var(--color-divider)",
              background: "var(--color-surface-2)",
              borderRadius: "999px",
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: "0.95rem",
              lineHeight: 1,
            }}
          >
            {"\u25C0"}
          </button>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
            {slideSicura + 1} / {totaleSlides}
          </span>
          <button
            aria-label="Scorri avanti"
            onClick={next}
            style={{
              border: "1px solid var(--color-divider)",
              background: "var(--color-surface-2)",
              borderRadius: "999px",
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: "0.95rem",
              lineHeight: 1,
            }}
          >
            {"\u25B6"}
          </button>
        </div>
      </div>

      {/* Elenco della slide corrente */}
      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {visibili.map((n, i) => {
          const localitaParts = [n.provincia, n.regione].filter(Boolean);
          const localita = localitaParts.length ? localitaParts.join(" · ") : null;
          return (
            <a
              key={`${n.link}-${slideSicura}-${i}`}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "var(--space-3)",
                alignItems: "center",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "8px",
                background: "var(--color-surface-2)",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--color-divider)",
              }}
            >
              <span style={{ fontSize: "0.9rem", lineHeight: 1.35 }}>
                {n.titolo}
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginTop: 2,
                  }}
                >
                  {localita ? (
                    <>
                      <strong style={{ color: "var(--color-text-soft)" }}>{localita}</strong>
                      {" · "}
                    </>
                  ) : null}
                  {n.fonte} · {formatData(n.data)}
                </span>
              </span>
              <ExternalLink aria-hidden="true" size={15} strokeWidth={1.8} style={{ color: "var(--color-text-muted)" }} />
            </a>
          );
        })}
        {visibili.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Nessuna segnalazione pertinente rilevata negli ultimi 7 giorni.
          </div>
        )}
      </div>

      <p className="source-note">
        Radar automatico da Google News RSS. Un punteggio interno di rilevanza combina
        contesto lavorativo, evento, esito, luogo e penalità per sport, incidenti stradali
        non lavorativi ed eventi non professionali. Ogni voce rimanda all&apos;articolo originale;
        i dati ufficiali restano quelli INAIL.
      </p>
    </div>
  );
}
