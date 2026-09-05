"use client";

import { useEffect, useMemo, useState } from "react";
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
  incidente?: string | null;
  agenteMateriale?: string | null;
  sedeLesione?: string | null;
  naturaLesione?: string | null;
  dinamica?: string | null;
  fattori: { tipoFattore?: string | null; testo?: string | null; detMod?: string | null }[];
}

interface Catalogo {
  casi: CatalogoCaso[];
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
  const [aperto, setAperto] = useState<number | null>(null);
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    fetch("/data/informo-catalogo.json")
      .then((r) => r.json())
      .then((d) => setCatalogo(d as Catalogo))
      .catch(() => setCatalogo(null));
  }, []);

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
    return righe.sort((a, b) => b.anno - a.anno || a.codice - b.codice);
  }, [catalogo, query, anno, settore, causa]);

  const totaleAnni = useMemo(() => {
    const cnt = new Map<number, number>();
    for (const c of catalogo?.casi ?? []) cnt.set(c.anno, (cnt.get(c.anno) ?? 0) + 1);
    return cnt;
  }, [catalogo]);

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
            Ricerca libera nel racconto dei 1.212 casi: dinamica, mansione, luogo, fattori
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
      </div>

      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
        {catalogo
          ? `${risultati.length} casi su ${catalogo.casi.length} nel catalogo`
          : "Caricamento catalogo..."}
      </div>

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        {risultati.slice(0, 50).map((c) => {
          const apertoId = aperto === c.codice;
          return (
            <div
              key={c.codice}
              style={{
                border: "1px solid var(--color-divider)",
                background: "var(--color-raised)",
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
                }}
              >
                <span style={{ display: "grid", gap: 2 }}>
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
                  {apertoId ? "▲" : "▼"}
                </span>
              </button>
              {apertoId && (
                <div style={{ padding: "0 14px 14px", display: "grid", gap: "var(--space-2)" }}>
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
                    <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>{c.dinamica}</p>
                  )}
                  {c.fattori?.length > 0 && (
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        Fattori causali
                      </div>
                      {c.fattori.map((f, i) => (
                        <div key={i} style={{ fontSize: "0.83rem", lineHeight: 1.4 }}>
                          <strong>{f.tipoFattore ?? "Fattore"}</strong>
                          {f.detMod ? ` (${f.detMod})` : ""}: {f.testo ?? ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {risultati.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Nessun caso corrisponde alla ricerca.
          </div>
        )}
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