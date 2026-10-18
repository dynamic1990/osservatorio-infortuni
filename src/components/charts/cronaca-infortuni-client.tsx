"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Filter } from "lucide-react";
import newsRaw from "@/data/generated/news-infortuni.json";

interface FonteExtra {
  titolo: string;
  data: string;
  fonte: string;
  link: string;
  score?: number;
}

interface Notizia {
  titolo: string;
  fonte: string;
  link: string;
  data: string;
  categoria: string;
  tipo?: string;
  sintesi?: string;
  provincia?: string | null;
  regione?: string | null;
  workAccidentScore: number;
  scoreReasons?: string[];
  fonti?: FonteExtra[];
}

interface NewsPayload {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  periodo: string;
  notizie: Notizia[];
}

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

function formatDataCompleta(dataStr: string): string {
  try {
    return new Date(dataStr).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dataStr;
  }
}

function numFontiPerEvento(n: Notizia): number {
  return (n.fonti?.length ?? 0) + 1;
}

function badgeFor(categoria: string): { label: string; bg: string; border: string; fg: string } {
  if (categoria === "mortale") {
    return { label: "mortale", bg: "var(--color-accent-soft)", border: "var(--color-accent)", fg: "var(--color-accent-strong)" };
  }
  if (categoria === "grave") {
    return { label: "grave", bg: "var(--color-warning-soft)", border: "var(--color-warning)", fg: "var(--color-warning)" };
  }
  return { label: "analisi", bg: "var(--color-surface-1)", border: "var(--color-divider)", fg: "var(--color-text-muted)" };
}

export function CronacaInfortuniClient() {
  const dati = useMemo(() => newsRaw as unknown as NewsPayload, []);

  // Tutte le voci (eventi imminenti + analisi), ordinate per data desc
  const eventi = useMemo(() => {
    return (dati.notizie || [])
      .sort((a, b) => {
        const ta = new Date(a.data).getTime() || 0;
        const tb = new Date(b.data).getTime() || 0;
        if (tb !== ta) return tb - ta;
        return (b.workAccidentScore ?? 0) - (a.workAccidentScore ?? 0);
      });
  }, [dati]);

  // Lista regioni presenti (per il filtro a tendina)
  const regioniLista = useMemo(() => {
    const set = new Set<string>();
    for (const n of eventi) {
      if (n.regione) set.add(n.regione);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it"));
  }, [eventi]);

  // Filtri
  const [categoria, setCategoria] = useState<string>("tutte");
  const [regione, setRegione] = useState<string>("tutte");
  const [periodo, setPeriodo] = useState<string>("tutto");
  const [ricerca, setRicerca] = useState<string>("");
  const [limite, setLimite] = useState<number>(40);
  const [popupFonti, setPopupFonti] = useState<Notizia | null>(null);

  // Esc chiude il popup delle fonti
  useEffect(() => {
    if (!popupFonti) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopupFonti(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupFonti]);

  const filtroPeriodo = (dataStr: string): boolean => {
    const t = new Date(dataStr).getTime();
    if (!Number.isFinite(t)) return true;
    if (periodo === "7") return Date.now() - t <= 7 * 86400_000;
    if (periodo === "30") return Date.now() - t <= 30 * 86400_000;
    if (periodo === "90") return Date.now() - t <= 90 * 86400_000;
    if (periodo === "180") return Date.now() - t <= 180 * 86400_000;
    return true;
  };

  // Filtro per parole chiave (titolo, fonte, luogo, sintesi)
  const matchRicerca = (n: Notizia): boolean => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return true;
    const testo = [
      n.titolo,
      n.fonte,
      n.provincia || "",
      n.regione || "",
      n.sintesi || "",
      ...(n.fonti || []).map((f) => f.titolo),
    ].join(" ").toLowerCase();
    // supporta più parole: tutte devono comparire (AND)
    return q.split(/\s+/).every((term) => testo.includes(term));
  };

  const filtrate = useMemo(() => {
    return eventi.filter((n) => {
      if (categoria !== "tutte" && n.categoria !== categoria) return false;
      if (regione !== "tutte" && n.regione !== regione) return false;
      if (!filtroPeriodo(n.data)) return false;
      if (!matchRicerca(n)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventi, categoria, regione, periodo, ricerca]);

  const visibili = filtrate.slice(0, limite);

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      {/* Timeline con filtri */}
      <section className="card" aria-label="Timeline della cronaca" id="cronaca-giorno">
        <div className="card-header">
          <h2 className="card-title">La cronaca giorno per giorno</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {filtrate.length} voci{regione !== "tutte" ? ` in ${regione}` : ""}
          </span>
        </div>

        {/* Filtri */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            marginBottom: "var(--space-4)",
            alignItems: "center",
          }}
        >
          <Filter size={15} style={{ color: "var(--color-text-muted)" }} />
          <select
            aria-label="Filtra per categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-divider)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: "0.85rem",
              color: "inherit",
            }}
          >
            <option value="tutte">Tutte le categorie</option>
            <option value="mortale">Mortali</option>
            <option value="grave">Gravi</option>
            <option value="analisi">Analisi e approfondimenti</option>
          </select>
          <select
            aria-label="Filtra per regione"
            value={regione}
            onChange={(e) => setRegione(e.target.value)}
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-divider)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: "0.85rem",
              color: "inherit",
            }}
          >
            <option value="tutte">Tutte le regioni</option>
            {regioniLista.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            aria-label="Filtra per periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-divider)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: "0.85rem",
              color: "inherit",
            }}
          >
            <option value="tutto">Tutto il periodo (365 giorni)</option>
            <option value="7">Ultimi 7 giorni</option>
            <option value="30">Ultimo mese</option>
            <option value="90">Ultimi 3 mesi</option>
            <option value="180">Ultimi 6 mesi</option>
          </select>
          <input
            type="search"
            aria-label="Cerca nelle notizie"
            placeholder="Cerca per parola chiave…"
            value={ricerca}
            onChange={(e) => {
              setRicerca(e.target.value);
              setLimite(40);
            }}
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-divider)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: "0.85rem",
              color: "inherit",
              minWidth: 200,
              flex: "1 1 200px",
            }}
          />
        </div>

        {/* Timeline */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {visibili.map((n, i) => {
            const data = new Date(n.data);
            const badge = badgeFor(n.categoria);
            const oggi = new Date();
            const giorniFa = Math.max(0, Math.round((oggi.getTime() - data.getTime()) / 86400_000));
            const numFonti = (n.fonti?.length ?? 0) + 1;
            return (
              <div
                key={`${n.link}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: 8,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-divider)",
                }}
              >
                <div style={{ textAlign: "center", minWidth: 52 }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                    {giorniFa === 0 ? "oggi" : giorniFa === 1 ? "ieri" : formatData(n.data).replace(/\d+ /, "")}
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: n.categoria === "mortale" ? "var(--color-accent)" : "var(--color-text)",
                    }}
                  >
                    {formatData(n.data).split(" ")[0]}
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "0.9rem", lineHeight: 1.35, color: "inherit", textDecoration: "none" }}
                    >
                      {n.titolo}
                    </a>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 7px",
                        borderRadius: "var(--radius-sm)",
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.fg,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  {n.sintesi && n.sintesi !== "Infortunio sul lavoro" && (
                    <span style={{ display: "block", fontSize: "0.78rem", color: "var(--color-text-soft)", fontStyle: "italic", marginTop: 4 }}>
                      {n.sintesi}
                    </span>
                  )}
                  <span style={{ display: "block", fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {n.provincia ? <strong style={{ color: "var(--color-text-soft)" }}>{n.provincia}</strong> : null}
                    {n.provincia && n.regione ? " · " : ""}
                    {n.regione || ""}
                    <span style={{ color: "var(--color-text-muted)" }}> · {n.fonte} · {formatDataCompleta(n.data)}</span>
                  </span>
                  {numFonti > 1 && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "var(--color-text-soft)",
                            background: "var(--color-surface-1)",
                            border: "1px solid var(--color-divider)",
                            borderRadius: "var(--radius-md)",
                            padding: "2px 8px",
                          }}
                        >
                          {numFonti} testate raccontano questo evento
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setPopupFonti(n);
                          }}
                          aria-haspopup="dialog"
                          style={{
                            padding: "2px 10px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-divider)",
                            background: "transparent",
                            color: "inherit",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                          }}
                        >
                          Vedi le {numFonti} testate →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {visibili.length === 0 && (
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Nessun evento corrisponde ai filtri selezionati.
            </div>
          )}
        </div>

        {filtrate.length > limite && (
          <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
            <button
              onClick={() => setLimite((l) => l + 40)}
              className="btn-pill"
              style={{ cursor: "pointer" }}
            >
              Mostra altri ({Math.min(40, filtrate.length - limite)})
            </button>
          </div>
        )}
      </section>

      {/* 4. Distinzione cronaca vs dati ufficiali */}
      <section className="card" aria-label="Cronaca e dati ufficiali" id="cronaca-dati-ufficiali">
        <h2 className="card-title">Cronaca e dati ufficiali: due piani diversi</h2>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-soft)", lineHeight: 1.6, margin: 0 }}>
          Questa pagina raccoglie la <strong>rassegna stampa automatica</strong> degli infortuni gravi e mortali
          sul lavoro: gli articoli dello stesso infortunio vengono <strong>raggruppati in un unico evento</strong>
          (quando più testate raccontano lo stesso fatto, si contano una volta sola).
          I numeri qui sopra <strong>non sono dati INAIL</strong>: sono un indicatore congiunturale della
          cronaca, soggetto alla copertura delle testate. Per le statistiche ufficiali certificate dell&apos;istituto,
          con serie storiche e incidenze, vai alla pagina{" "}
          <a href="/casi-mortali" style={{ color: "var(--color-link)" }}>Casi mortali e statistiche INAIL</a>.
        </p>
      </section>

      {/* Popup fonti: tutte le testate sullo stesso evento */}
      {popupFonti && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fonti su ${popupFonti.titolo}`}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-6)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPopupFonti(null);
          }}
        >
          <div
            role="document"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              maxWidth: 560,
              maxHeight: "80vh",
              overflowY: "auto",
              width: "100%",
              padding: "var(--space-5)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>{popupFonti.titolo}</h3>
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                  {numFontiPerEvento(popupFonti)} testate raccontano questo evento · {formatDataCompleta(popupFonti.data)}
                </span>
              </div>
              <button
                onClick={() => setPopupFonti(null)}
                aria-label="Chiudi popup"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: "var(--space-1) var(--space-2)",
                }}
              >
                ×
              </button>
            </div>

            <ul style={{ display: "grid", gap: "var(--space-2)", margin: "var(--space-4) 0 0", padding: 0, listStyle: "none" }}>
              <li>
                <a
                  href={popupFonti.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-surface-1)",
                    textDecoration: "none",
                    color: "var(--color-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-raised)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-surface-1)";
                  }}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--color-text-soft)", whiteSpace: "nowrap" }}>
                    {popupFonti.fonte}
                  </span>
                  <span style={{ flex: 1, fontSize: "0.82rem", lineHeight: 1.3 }}>{popupFonti.titolo}</span>
                  <ExternalLink size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                </a>
              </li>
              {(popupFonti.fonti || []).map((f, j) => (
                <li key={`${f.link}-${j}`}>
                  <a
                    href={f.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface-1)",
                      textDecoration: "none",
                      color: "var(--color-text)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-raised)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--color-surface-1)";
                    }}
                  >
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--color-text-soft)", whiteSpace: "nowrap" }}>
                      {f.fonte}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.82rem", lineHeight: 1.3 }}>{f.titolo}</span>
                    <ExternalLink size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}