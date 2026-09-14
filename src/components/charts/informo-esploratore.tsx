"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
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

// Estratto a capo singolo per la riga di elenco.
function estratto(testo: string | null | undefined, max: number): string {
  const t = (testo ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

// Esploratore delle dinamiche: ricerca libera (full-text su dinamica e
// fattori) e filtri per anno, settore, causa. È la vista qualitativa
// dell'archivio: ogni caso restituisce la narrativa e i fattori secondo il
// modello Informo. Il catalogo è servito come file statico in /data e
// caricato su interazione, per non appesantire il bundle.
export function InformoEsploratore() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [query, setQuery] = useState("");
  const [anno, setAnno] = useState<number | "tutti">(ANNO_DEFAULT);
  const [settore, setSettore] = useState<string>("tutti");
  const [causa, setCausa] = useState<string>("tutti");
  const [ordina, setOrdina] = useState<Ordina>("anno-desc");
  const [aperto, setAperto] = useState<number | null>(null);
  const [caricato, setCaricato] = useState(false);
  const [visibili, setVisibili] = useState(50);

  useEffect(() => {
    fetch("/data/informo-catalogo.json")
      .then((r) => r.json())
      .then((d) => setCatalogo(d as Catalogo))
      .catch(() => setCatalogo(null));
  }, []);

  // Quando i filtri cambiano, riparti dalla prima pagina di risultati.
  useEffect(() => {
    setVisibili(50);
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

  const casoSelezionato = useMemo(
    () => catalogo?.casi.find((c) => c.codice === aperto) ?? null,
    [catalogo, aperto],
  );

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

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
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
            {(query || anno !== "tutti" || settore !== "tutti" || causa !== "tutti" || ordina !== "anno-desc") && (
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
          {catalogo && risultati.length > 0 && (
            <span style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <strong>{risultati.filter((c) => c.dinamica).length}</strong> con narrativa completa
              <span aria-hidden="true">·</span>
              <strong>{risultati.filter((c) => (c.fattori ?? []).length > 0).length}</strong> con fattori causali
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: "var(--space-4)",
          alignItems: "start",
        }}
      >
        {/* Colonna lista */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {risultati.slice(0, visibili).map((c) => {
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
                  {c.dinamica && (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-text-muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                      }}
                    >
                      {evidenzia(estratto(c.dinamica, 220), query)}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {apertoId ? <ChevronUp aria-hidden="true" size={16} strokeWidth={1.8} /> : <ChevronDown aria-hidden="true" size={16} strokeWidth={1.8} />}
                </span>
              </button>
            </div>
          );
          })}
          {risultati.length === 0 && (
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Nessun caso corrisponde alla ricerca.
            </div>
          )}
          {risultati.length > visibili && (
            <button
              type="button"
              onClick={() => setVisibili((v) => v + 50)}
              style={{
                justifySelf: "start",
                padding: "8px 14px",
                background: "none",
                border: "1px solid var(--color-divider)",
                borderRadius: 2,
                font: "inherit",
                fontSize: "0.82rem",
                color: "var(--color-link)",
                cursor: "pointer",
              }}
            >
              Mostra altri ({risultati.length - visibili} rimanenti)
            </button>
          )}
        </div>

        {/* Colonna scheda dettaglio */}
        <div
          style={{
            position: "sticky",
            top: "calc(var(--space-4))",
            border: "1px solid var(--color-divider)",
            background: "var(--color-raised)",
            padding: "var(--space-4)",
            display: "grid",
            gap: "var(--space-3)",
            minWidth: 0,
          }}
        >
          {casoSelezionato ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 750, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                    Scheda del caso {casoSelezionato.codice}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>
                    {casoSelezionato.anno} {casoSelezionato.data ? `· ${casoSelezionato.data}` : ""} · {casoSelezionato.incidente ?? "dinamica n.d."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAperto(null)}
                  aria-label="Chiudi la scheda"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}
                >
                  ✕
                </button>
              </div>

              <dl style={{ display: "grid", gap: "var(--space-2)", margin: 0, fontSize: "0.8rem" }}>
                {[
                  ["Settore", casoSelezionato.settore],
                  ["Mansione", casoSelezionato.mansione],
                  ["Luogo", casoSelezionato.luogo],
                  ["Sesso", casoSelezionato.sesso],
                  ["Cittadinanza", casoSelezionato.cittadinanza],
                  ["Rapporto di lavoro", casoSelezionato.rapportoLavoro],
                  ["Sede lesione", casoSelezionato.sedeLesione],
                  ["Natura lesione", casoSelezionato.naturaLesione],
                  ["Agente materiale", casoSelezionato.agenteMateriale],
                ].map(([label, valore]) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(100px, 1fr) minmax(0, 2fr)", gap: "var(--space-2)" }}>
                    <dt style={{ color: "var(--color-text-muted)" }}>{label}</dt>
                    <dd style={{ margin: 0, wordBreak: "break-word" }}>{valore ?? "n.d."}</dd>
                  </div>
                ))}
              </dl>

              {casoSelezionato.dinamica && (
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                    Dinamica
                  </div>
                  <p style={{ margin: 0, fontSize: "0.87rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {evidenzia(casoSelezionato.dinamica, query)}
                  </p>
                </div>
              )}

              {casoSelezionato.fattori?.length > 0 && (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                    Fattori causali
                  </div>
                  {casoSelezionato.fattori.map((f, i) => (
                    <div key={i} style={{ fontSize: "0.83rem", lineHeight: 1.4, paddingLeft: 10, borderLeft: "2px solid var(--color-divider)" }}>
                      <strong>{f.tipoFattore ?? "Fattore"}</strong>
                      {f.detMod ? ` (${f.detMod})` : ""}: {evidenzia(f.testo, query)}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              Seleziona un caso dall&apos;elenco per leggere la dinamica completa e i fattori causali.
            </div>
          )}
        </div>
      </div>

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