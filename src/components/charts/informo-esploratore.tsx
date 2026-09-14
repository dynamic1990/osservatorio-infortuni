"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RotateCcw } from "lucide-react";
import { ANNI_INFORMO, ANNO_DEFAULT } from "@/lib/informo-casi";

interface CatalogoCaso {
  anno: number;
  codice: number;
  data?: string | null;
  settore?: string | null;
  luogo?: string | null;
  mansione?: string | null;
  sesso?: string | null;
  cittadinanza?: string | null;
  rapportoLavoro?: string | null;
  sedeLesione?: string | null;
  naturaLesione?: string | null;
  incidente?: string | null;
  agenteMateriale?: string | null;
  dinamica?: string | null;
  fattori: { tipoFattore?: string | null; testo?: string | null; detMod?: string | null }[];
}

interface Catalogo {
  casi: CatalogoCaso[];
}

type Ordina = "anno-desc" | "anno-asc" | "causa" | "settore";

const PAGE_SIZE = 10;

// Evidenzia la prima occorrenza della query nel testo (ricerca full-text).
function evidenzia(testo: string | null | undefined, query: string): ReactNode {
  const q = query.trim().toLowerCase();
  if (!q || !testo) return testo ?? null;
  const idx = testo.toLowerCase().indexOf(q);
  if (idx === -1) return testo;
  const end = idx + q.length;
  return (
    <>
      {testo.slice(0, idx)}
      <mark style={{ background: "var(--color-warning-soft)", color: "var(--color-text)", padding: "0 2px" }}>
        {testo.slice(idx, end)}
      </mark>
      {testo.slice(end)}
    </>
  );
}

// Finestra di pagine numerate (con ellissi) attorno alla pagina corrente.
function intervalloPagine(corrente: number, totale: number): (number | "…")[] {
  if (totale <= 7) return Array.from({ length: totale }, (_, i) => i + 1);
  const candidati = new Set<number>([1, totale, corrente, corrente - 1, corrente + 1]);
  const validi = [...candidati].filter((p) => p >= 1 && p <= totale).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of validi) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

// Esploratore delle dinamiche: ricerca libera (full-text su dinamica e
// fattori) e filtri per anno, settore, causa. Il catalogo è servito come
// file statico in /data e caricato su interazione, per non appesantire il
// bundle. La lista mostra pochi casi per pagina: si sfoglia con la
// paginazione e si apre un caso alla volta.
export function InformoEsploratore() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [query, setQuery] = useState("");
  const [anno, setAnno] = useState<number | "tutti">(ANNO_DEFAULT);
  const [settore, setSettore] = useState<string>("tutti");
  const [causa, setCausa] = useState<string>("tutti");
  const [ordina, setOrdina] = useState<Ordina>("anno-desc");
  const [pagina, setPagina] = useState(0);
  const [aperto, setAperto] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/informo-catalogo.json")
      .then((r) => r.json())
      .then((d) => setCatalogo(d as Catalogo))
      .catch(() => setCatalogo(null));
  }, []);

  // Quando i filtri cambiano, si riparte dalla prima pagina.
  useEffect(() => {
    setPagina(0);
  }, [query, anno, settore, causa, ordina]);

  const settori = useMemo(() => {
    const s = new Set<string>();
    for (const c of catalogo?.casi ?? []) {
      if (c.settore) s.add(c.settore);
    }
    return Array.from(s).sort();
  }, [catalogo]);

  const cause = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of catalogo?.casi ?? []) {
      if (c.incidente) m.set(c.incidente, (m.get(c.incidente) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [catalogo]);

  const risultati = useMemo(() => {
    let righe = catalogo?.casi ?? [];
    if (anno !== "tutti") righe = righe.filter((c) => c.anno === anno);
    if (settore !== "tutti") righe = righe.filter((c) => c.settore === settore);
    if (causa !== "tutti") righe = righe.filter((c) => c.incidente === causa);
    const q = query.trim().toLowerCase();
    if (q) {
      righe = righe.filter((c) => {
        if ((c.dinamica ?? "").toLowerCase().includes(q)) return true;
        if ((c.mansione ?? "").toLowerCase().includes(q)) return true;
        if ((c.luogo ?? "").toLowerCase().includes(q)) return true;
        return (c.fattori ?? []).some((f) => (f.testo ?? "").toLowerCase().includes(q));
      });
    }
    const perAnno =
      ordina === "anno-desc"
        ? (a: CatalogoCaso, b: CatalogoCaso) => b.anno - a.anno || b.codice - a.codice
        : (a: CatalogoCaso, b: CatalogoCaso) => a.anno - b.anno || a.codice - b.codice;
    const perTesto = (key: (c: CatalogoCaso) => string | null | undefined) =>
      (a: CatalogoCaso, b: CatalogoCaso) =>
        (key(a) ?? "").localeCompare(key(b) ?? "", "it") || b.anno - a.anno;
    if (ordina === "causa") righe = righe.sort(perTesto((c) => c.incidente));
    else if (ordina === "settore") righe = righe.sort(perTesto((c) => c.settore));
    else righe = righe.sort(perAnno);
    return righe;
  }, [catalogo, query, anno, settore, causa, ordina]);

  const totaleAnni = useMemo(() => {
    const cnt = new Map<number, number>();
    for (const c of catalogo?.casi ?? []) cnt.set(c.anno, (cnt.get(c.anno) ?? 0) + 1);
    return cnt;
  }, [catalogo]);

  const pagine = Math.max(1, Math.ceil(risultati.length / PAGE_SIZE));
  const paginaCorrente = Math.min(pagina, pagine - 1);
  const visibili = risultati.slice(paginaCorrente * PAGE_SIZE, (paginaCorrente + 1) * PAGE_SIZE);
  const tipoFiltri =
    query.trim() !== "" ||
    anno !== "tutti" ||
    settore !== "tutti" ||
    causa !== "tutti" ||
    ordina !== "anno-desc";

  const azzeraFiltri = () => {
    setQuery("");
    setAnno(ANNO_DEFAULT);
    setSettore("tutti");
    setCausa("tutti");
    setOrdina("anno-desc");
  };

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
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Esplora le singole dinamiche
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
            Ricerca libera nel racconto dei casi: dinamica, mansione, luogo, fattori
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--space-2)",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca nel testo (es. ponteggio, gru, caduta...)"
          aria-label="Cerca nei casi"
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            font: "inherit",
            fontSize: "0.85rem",
            background: "var(--color-raised)",
            color: "var(--color-text)",
          }}
        />
        <select
          aria-label="Filtra per anno"
          value={anno}
          onChange={(e) => setAnno(e.target.value === "tutti" ? "tutti" : Number(e.target.value))}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            font: "inherit",
            fontSize: "0.85rem",
            background: "var(--color-raised)",
            color: "var(--color-text)",
          }}
        >
          <option value="tutti">Tutti gli anni</option>
          {ANNI_INFORMO.map((a) => (
            <option key={a} value={a}>
              {a} ({totaleAnni.get(a) ?? 0})
            </option>
          ))}
        </select>
        <select
          aria-label="Filtra per settore"
          value={settore}
          onChange={(e) => setSettore(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            font: "inherit",
            fontSize: "0.85rem",
            background: "var(--color-raised)",
            color: "var(--color-text)",
          }}
        >
          <option value="tutti">Tutti i settori</option>
          {settori.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtra per causa"
          value={causa}
          onChange={(e) => setCausa(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            font: "inherit",
            fontSize: "0.85rem",
            background: "var(--color-raised)",
            color: "var(--color-text)",
          }}
        >
          <option value="tutti">Tutte le cause</option>
          {cause.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Ordina i risultati"
          value={ordina}
          onChange={(e) => setOrdina(e.target.value as Ordina)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            font: "inherit",
            fontSize: "0.85rem",
            background: "var(--color-raised)",
            color: "var(--color-text)",
          }}
        >
          <option value="anno-desc">Più recenti prima</option>
          <option value="anno-asc">Più vecchi prima</option>
          <option value="causa">Per causa (A-Z)</option>
          <option value="settore">Per settore (A-Z)</option>
        </select>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {catalogo
            ? `${risultati.length} casi su ${catalogo.casi.length} nel catalogo`
            : "Caricamento catalogo..."}
          {tipoFiltri && (
            <button
              type="button"
              onClick={azzeraFiltri}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                fontSize: "0.78rem",
                color: "var(--color-link)",
                cursor: "pointer",
              }}
            >
              <RotateCcw aria-hidden="true" size={13} strokeWidth={1.8} />
              azzera filtri
            </button>
          )}
        </span>
      </div>

      {/* Lista: pochi casi per pagina */}
      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {visibili.map((c) => {
          const apertoId = aperto === c.codice;
          return (
            <div
              key={c.codice}
              style={{
                border: "1px solid var(--color-divider)",
                background: "var(--color-raised)",
                ...(apertoId
                  ? { borderColor: "var(--color-accent)", boxShadow: "0 0 0 1px var(--color-accent)" }
                  : {}),
              }}
            >
              <button
                type="button"
                onClick={() => setAperto(apertoId ? null : c.codice)}
                aria-expanded={apertoId}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left",
                  color: "var(--color-text)",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 70%" }}>
                  <span style={{ fontWeight: 650, fontSize: "0.88rem" }}>
                    Caso {c.codice}
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>
                      {" "}· {c.anno} {c.data ? `· ${c.data}` : ""}
                    </span>
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
                    {c.settore ?? "Settore n.d."}
                    {c.incidente ? ` · ${c.incidente}` : ""}
                  </span>
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {apertoId ? <ChevronUp aria-hidden="true" size={16} strokeWidth={1.8} /> : <ChevronDown aria-hidden="true" size={16} strokeWidth={1.8} />}
                </span>
              </button>
              {apertoId && (
                <div style={{ padding: "0 14px 14px", display: "grid", gap: "var(--space-3)" }}>
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "var(--space-2)",
                      margin: 0,
                      fontSize: "0.8rem",
                    }}
                  >
                    <div>
                      <dt style={{ color: "var(--color-text-muted)" }}>Mansione</dt>
                      <dd style={{ margin: 0 }}>{c.mansione ?? "n.d."}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-text-muted)" }}>Luogo</dt>
                      <dd style={{ margin: 0 }}>{c.luogo ?? "n.d."}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-text-muted)" }}>Sede lesione</dt>
                      <dd style={{ margin: 0 }}>{c.sedeLesione ?? "n.d."}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-text-muted)" }}>Natura lesione</dt>
                      <dd style={{ margin: 0 }}>{c.naturaLesione ?? "n.d."}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-text-muted)" }}>Agente materiale</dt>
                      <dd style={{ margin: 0 }}>{c.agenteMateriale ?? "n.d."}</dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--color-text-muted)" }}>Rapporto di lavoro</dt>
                      <dd style={{ margin: 0 }}>{c.rapportoLavoro ?? "n.d."}</dd>
                    </div>
                  </dl>
                  {c.dinamica && (
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        Dinamica
                      </div>
                      <p style={{ margin: 0, fontSize: "0.87rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                        {evidenzia(c.dinamica, query)}
                      </p>
                    </div>
                  )}
                  {c.fattori?.length > 0 && (
                    <div style={{ display: "grid", gap: "var(--space-2)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        Fattori causali
                      </div>
                      {c.fattori.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "0.83rem",
                            lineHeight: 1.4,
                            paddingLeft: 10,
                            borderLeft: "2px solid var(--color-divider)",
                          }}
                        >
                          <strong>{f.tipoFattore ?? "Fattore"}</strong>
                          {f.detMod ? ` (${f.detMod})` : ""}: {evidenzia(f.testo, query)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {visibili.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Nessun caso corrisponde alla ricerca.
          </div>
        )}
      </div>

      {/* Paginazione */}
      {pagine > 1 && (
        <nav
          aria-label="Pagine dei casi"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            disabled={paginaCorrente === 0}
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            aria-label="Pagina precedente"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              background: "none",
              border: "1px solid var(--color-divider)",
              borderRadius: 2,
              font: "inherit",
              fontSize: "0.82rem",
              color: "var(--color-text)",
              cursor: paginaCorrente === 0 ? "default" : "pointer",
              opacity: paginaCorrente === 0 ? 0.45 : 1,
            }}
          >
            <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
          {intervalloPagine(paginaCorrente + 1, pagine).map((p, i) =>
            p === "…" ? (
              <span key={`ell-${i}`} style={{ color: "var(--color-text-muted)", padding: "0 2px" }}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPagina(p - 1)}
                aria-current={p === paginaCorrente + 1 ? "page" : undefined}
                style={{
                  minWidth: 30,
                  padding: "6px 8px",
                  borderRadius: 2,
                  font: "inherit",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  border: p === paginaCorrente + 1 ? "1px solid var(--color-text)" : "1px solid var(--color-divider)",
                  background: p === paginaCorrente + 1 ? "var(--color-text)" : "var(--color-raised)",
                  color: p === paginaCorrente + 1 ? "var(--color-raised)" : "var(--color-text)",
                  fontWeight: p === paginaCorrente + 1 ? 700 : 500,
                }}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={paginaCorrente === pagine - 1}
            onClick={() => setPagina((p) => Math.min(pagine - 1, p + 1))}
            aria-label="Pagina successiva"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              background: "none",
              border: "1px solid var(--color-divider)",
              borderRadius: 2,
              font: "inherit",
              fontSize: "0.82rem",
              color: "var(--color-text)",
              cursor: paginaCorrente === pagine - 1 ? "default" : "pointer",
              opacity: paginaCorrente === pagine - 1 ? 0.45 : 1,
            }}
          >
            <ChevronRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", width: "100%", textAlign: "center" }}>
            Pagina {paginaCorrente + 1} di {pagine}
          </span>
        </nav>
      )}

      <p className="source-note">
        Il catalogo mostra i casi nella forma sintetica dell&apos;archivio
        Infor.MO: la narrativa è la ricostruzione della dinamica fatta da INAIL,
        non una sentenza. I testi contengono riferimenti a terzi e imprese:
        il loro uso è funzionale alla comprensione dei pattern, mai alla
        identificazione di persone o aziende.
      </p>
    </div>
  );
}