"use client";

import { useMemo } from "react";
import newsRaw from "@/data/generated/news-infortuni.json";

interface Notizia {
  titolo: string;
  fonte: string;
  link: string;
  data: string;
  categoria: string;
}

interface NewsPayload {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  periodo: string;
  notizie: Notizia[];
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  mortale: { label: "Mortale", color: "#ffffff", bg: "#b3261e" },
  grave: { label: "Grave", color: "#ffffff", bg: "#c77d0a" },
  altro: { label: "Infortunio", color: "#1d1b1a", bg: "#e8e3de" },
};

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
  const notizie = dati.notizie || [];

  const count = (cat: string) => notizie.filter((n) => n.categoria === cat).length;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
        {(["mortale", "grave", "altro"] as const).map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <span
              key={cat}
              style={{
                background: meta.bg,
                color: meta.color,
                fontSize: "0.78rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              {meta.label}: {count(cat)}
            </span>
          );
        })}
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
          Aggiornato: {formatData(dati.generatedAt)}
        </span>
      </div>

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {notizie.slice(0, 12).map((n, i) => {
          const meta = CATEGORY_META[n.categoria] || CATEGORY_META.altro;
          return (
            <a
              key={`${n.link}-${i}`}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "var(--space-3)",
                alignItems: "center",
                padding: "var(--space-3)",
                borderRadius: "8px",
                background: "var(--color-surface-2)",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--color-divider)",
              }}
            >
              <span
                style={{
                  background: meta.bg,
                  color: meta.color,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {meta.label}
              </span>
              <span style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
                {n.titolo}
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {n.fonte} · {formatData(n.data)}
                </span>
              </span>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>↗</span>
            </a>
          );
        })}
      </div>

      <p className="source-note">
        Aggregazione automatica da Google News RSS (query su infortuni mortali e gravi sul lavoro in Italia,
        ultimi 7 giorni). Ogni titolo rimanda all&apos;articolo originale. La classificazione è automatica
        basata su parole chiave nel titolo: può non cogliere il 100% dei casi. I dati ufficiali restano quelli INAIL.
      </p>
    </div>
  );
}
