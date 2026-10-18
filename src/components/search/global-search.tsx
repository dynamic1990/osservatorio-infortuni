"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  CornerDownLeft,
  Home,
  Landmark,
  Newspaper,
  Search,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SEARCH_INDEX,
  fold,
  scoreEntries,
  withTypeWeight,
  type SearchEntry,
  type SearchEntryType,
} from "@/lib/search-index";

// ---------------------------------------------------------------------------
// News della cronaca: caricate lazy (chunk separato) solo quando serve.
// ---------------------------------------------------------------------------

interface NewsLite {
  titolo: string;
  fonte: string;
  link: string;
  data: string;
  categoria: string;
  regione?: string | null;
  provincia?: string | null;
}

let newsCache: NewsLite[] | null = null;

async function caricaNews(): Promise<NewsLite[]> {
  if (newsCache) return newsCache;
  const mod = await import("@/data/generated/news-infortuni.json");
  const raw = (mod.default as { notizie?: NewsLite[] }).notizie ?? [];
  newsCache = raw;
  return newsCache;
}

const APRI_RICERCA = "osservatorio:apri-ricerca";

const ETICHETTE_TIPO: Record<SearchEntryType, string> = {
  pagina: "Pagina",
  report: "Report",
  grafico: "Grafico",
  bando: "Bando",
  fonte: "Fonte",
};

const ICONE_TIPO: Record<SearchEntryType, LucideIcon> = {
  pagina: Home,
  report: Newspaper,
  grafico: BarChart3,
  bando: Landmark,
  fonte: BookOpen,
};

interface Riga {
  entry?: SearchEntry;
  news?: NewsLite;
}

function Evidenzia({ testo, query }: { testo: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{testo}</>;
  const lower = testo.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <>{testo}</>;
  return (
    <>
      {testo.slice(0, idx)}
      <span className="search-hit">{testo.slice(idx, idx + q.length)}</span>
      {testo.slice(idx + q.length)}
    </>
  );
}

function dataBreve(dataStr: string): string {
  const d = new Date(dataStr);
  if (Number.isNaN(d.getTime())) return dataStr;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function categoriaLabel(c: string): string {
  if (c === "mortale") return "Mortale";
  if (c === "grave") return "Grave";
  if (c === "analisi") return "Analisi";
  return c;
}

export function GlobalSearch() {
  const [aperta, setAperta] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [newsCaricate, setNewsCaricate] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const newsCacheRef = useRef<NewsLite[] | null>(null);

  const puntiPartenza = useMemo(
    () => SEARCH_INDEX.filter((e) => e.type === "pagina" || e.type === "report").slice(0, 8),
    []
  );

  const statici = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return withTypeWeight(scoreEntries(q)).slice(0, 8);
  }, [query]);

  // Carica le news solo quando l'utente scrive almeno 2 caratteri
  useEffect(() => {
    let annullato = false;
    const attiva = aperta && query.trim().length >= 2;
    if (attiva && !newsCacheRef.current) {
      caricaNews().then((lista) => {
        if (annullato) return;
        newsCacheRef.current = lista;
        setNewsCaricate(true);
      });
    }
    return () => {
      annullato = true;
    };
  }, [aperta, query]);

  const newsMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lista = newsCache ?? newsCacheRef.current ?? [];
    if (!lista.length || q.length < 2) return [];
    const termini = q.split(/\s+/);
    return lista
      .filter((n) => {
        const testo = fold(
          [n.titolo, n.fonte, n.regione || "", n.provincia || "", n.categoria].join(" ")
        );
        return termini.every((t) => testo.includes(t));
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);
  }, [query, newsCaricate]);

  const righe = useMemo<Riga[]>(() => {
    if (!query.trim()) return puntiPartenza.map((entry) => ({ entry }));
    const r: Riga[] = statici.map((s) => ({ entry: s.entry }));
    if (newsMatch.length) r.push(...newsMatch.map((news) => ({ news })));
    return r;
  }, [puntiPartenza, statici, newsMatch, query]);

  const idxAttivo = Math.min(selected, Math.max(righe.length - 1, 0));

  const chiudi = useCallback(() => {
    setAperta(false);
    setQuery("");
    setSelected(0);
  }, []);

  // Apertura: Ctrl+K / Cmd+K ovunque + evento dal bottone della nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAperta((a) => !a);
        return;
      }
      if (!aperta) return;
      if (e.key === "Escape") {
        e.preventDefault();
        chiudi();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === "INPUT" && target !== inputRef.current) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, Math.max(righe.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        activeRef.current?.click();
      }
    };
    const onApri = () => setAperta(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(APRI_RICERCA, onApri);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(APRI_RICERCA, onApri);
    };
  }, [aperta, righe.length, chiudi]);

  // Reset selezione quando cambia la query
  useEffect(() => {
    setSelected(0);
  }, [query, aperta]);

  // Focus sull'input + blocco scroll quando si apre
  useEffect(() => {
    if (aperta) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [aperta]);

  // Scroll dell'elemento attivo nel pannello
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [idxAttivo, query, aperta]);

  if (!aperta) return null;

  const metaRiga = (entry: SearchEntry) =>
    entry.meta ??
    (entry.description.length > 110
      ? `${entry.description.slice(0, 110)}…`
      : entry.description);

  return (
    <div
      className="modal-backdrop"
      style={{ alignItems: "flex-start", paddingTop: "16vh", zIndex: 10000 }}
      onClick={chiudi}
      role="presentation"
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Cerca nel sito"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, border: "1px solid var(--color-text)", gap: 0 }}
      >
        {/* Barra di ricerca */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            borderBottom: "1px solid var(--color-divider)",
            padding: "10px var(--space-4)",
          }}
        >
          <Search aria-hidden="true" size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca in tutto il sito: dati, report, bandi, fonti, cronaca…"
            aria-label="Cerca in tutto il sito"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--color-text)",
              fontSize: "0.98rem",
              minWidth: 0,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Cancella la ricerca"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                display: "inline-flex",
                padding: 4,
              }}
            >
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </div>

        {/* Risultati */}
        <div style={{ maxHeight: "min(52vh, 480px)", overflowY: "auto", padding: "var(--space-2)" }}>
          {righe.length === 0 ? (
            <div style={{ padding: "var(--space-6) var(--space-4)", textAlign: "center", color: "var(--color-text-muted)" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--color-text)" }}>
                Nessun risultato trovato
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                Prova con un&apos;altra parola chiave: ad esempio &quot;vigilanza&quot;, &quot;malattie&quot;,
                &quot;bandi&quot;, &quot;caduta dall&apos;alto&quot;.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 2 }}>
              {righe.map((riga, i) => {
                const attiva = i === idxAttivo;
                const stileBase = {
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                  padding: "10px var(--space-3)",
                  textDecoration: "none",
                  color: "var(--color-text)",
                  borderRadius: 6,
                  background: attiva ? "var(--color-text)" : "transparent",
                } as const;

                if (riga.news) {
                  const n = riga.news;
                  const Icona = Newspaper;
                  const luogo = [n.regione, n.provincia].filter(Boolean).join(" · ");
                  return (
                    <a
                      key={`news-${n.link}-${i}`}
                      ref={(el) => {
                        if (attiva) activeRef.current = el;
                      }}
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={chiudi}
                      onMouseEnter={() => setSelected(i)}
                      style={{
                        ...stileBase,
                        color: attiva ? "var(--color-raised)" : "inherit",
                        background: attiva ? "var(--color-text)" : "transparent",
                      }}
                    >
                      <Icona
                        aria-hidden="true"
                        size={17}
                        strokeWidth={1.8}
                        style={{
                          flexShrink: 0,
                          marginTop: 2,
                          color: attiva ? "var(--color-raised)" : "var(--color-accent)",
                        }}
                      />
                      <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                        <span style={{ fontWeight: 650, lineHeight: 1.35 }}>
                          <Evidenzia testo={n.titolo} query={query} />
                        </span>
                        <span style={{ fontSize: "0.78rem", opacity: 0.72 }}>
                          Cronaca · {categoriaLabel(n.categoria)}{luogo ? ` · ${luogo}` : ""} ·{" "}
                          {n.fonte} · {dataBreve(n.data)}
                        </span>
                      </span>
                    </a>
                  );
                }

                const entry = riga.entry!;
                const Icona = ICONE_TIPO[entry.type];
                return (
                  <Link
                    key={`${entry.type}-${entry.href}-${i}`}
                    ref={(el) => {
                      if (attiva) activeRef.current = el;
                    }}
                    href={entry.href}
                    onClick={chiudi}
                    onMouseEnter={() => setSelected(i)}
                    style={{
                      ...stileBase,
                      color: attiva ? "var(--color-raised)" : "inherit",
                      background: attiva ? "var(--color-text)" : "transparent",
                    }}
                  >
                    <Icona
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.8}
                      style={{
                        flexShrink: 0,
                        marginTop: 2,
                        color: attiva ? "var(--color-raised)" : "var(--color-accent)",
                      }}
                    />
                    <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                      <span style={{ fontWeight: 650, lineHeight: 1.35 }}>
                        <Evidenzia testo={entry.title} query={query} />
                      </span>
                      <span style={{ fontSize: "0.78rem", opacity: 0.72 }}>
                        {ETICHETTE_TIPO[entry.type]} · <Evidenzia testo={metaRiga(entry)} query={query} />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con scorciatoie */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            alignItems: "center",
            borderTop: "1px solid var(--color-divider)",
            padding: "8px var(--space-4)",
            fontSize: "0.74rem",
            color: "var(--color-text-muted)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowUp aria-hidden="true" size={12} /> <ArrowDown aria-hidden="true" size={12} /> naviga
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <CornerDownLeft aria-hidden="true" size={12} /> apri
          </span>
          <span>Esc chiudi</span>
          <span style={{ marginLeft: "auto" }}>Ctrl+K in ogni pagina</span>
        </div>
      </div>
    </div>
  );
}