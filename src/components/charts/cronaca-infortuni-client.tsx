"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Filter, TrendingDown, TrendingUp } from "lucide-react";
import newsRaw from "@/data/generated/news-infortuni.json";
import { ItalyMap } from "@/components/charts/italy-map";
import { REGIONI } from "@/lib/labels";

interface Notizia {
  titolo: string;
  fonte: string;
  link: string;
  data: string;
  categoria: string;
  tipo?: string;
  provincia?: string | null;
  regione?: string | null;
  workAccidentScore: number;
  scoreReasons?: string[];
}

interface StatsPayload {
  finestra: number;
  generatoIl: string;
  ultimi7: { mortali: number; gravi: number; totale: number };
  precedenti7: { mortali: number; gravi: number; totale: number };
  mese: { codice: string; etichetta: string; mortali: number; totale: number };
  mesePrecedente: { codice: string; mortali: number };
}

interface NewsPayload {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  periodo: string;
  stats?: StatsPayload;
  notizie: Notizia[];
}

// Nome regione (ETL) -> codice INAIL (mappa SVG)
const NOME_REGIONE_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(REGIONI).map(([code, nome]) => [nome, code]),
);

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

function KpiCard({
  label,
  valore,
  confronto,
  su,
  unita = "",
}: {
  label: string;
  valore: number;
  confronto?: number;
  su: string;
  unita?: string;
}) {
  const delta = confronto !== undefined ? valore - confronto : null;
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;
  return (
    <div
      style={{
        background: "var(--color-raised)",
        border: "1px solid var(--color-divider)",
        padding: "var(--space-4)",
        display: "grid",
        gap: "var(--space-1)",
      }}
    >
      <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {valore}
        {unita && <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-soft)" }}> {unita}</span>}
      </span>
      <span style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
        {su}
        {delta !== null && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginLeft: 6,
              fontWeight: 700,
              color: up ? "var(--color-accent)" : down ? "#1e7a4e" : "var(--color-text-muted)",
            }}
          >
            {up ? <TrendingUp size={13} /> : down ? <TrendingDown size={13} /> : null}
            {delta > 0 ? `+${delta}` : delta} vs sett. prec.
          </span>
        )}
      </span>
    </div>
  );
}

export function CronacaInfortuniClient() {
  const dati = useMemo(() => newsRaw as unknown as NewsPayload, []);
  const stats = dati.stats;

  // Solo eventi di cronaca, ordinati per data desc
  const eventi = useMemo(() => {
    return (dati.notizie || [])
      .filter((n) => n.tipo !== "report")
      .sort((a, b) => {
        const ta = new Date(a.data).getTime() || 0;
        const tb = new Date(b.data).getTime() || 0;
        if (tb !== ta) return tb - ta;
        return (b.workAccidentScore ?? 0) - (a.workAccidentScore ?? 0);
      });
  }, [dati]);

  // Mappa regione -> conteggio eventi (per ItalyMap) e lista regioni presenti
  const regioniEvento = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of eventi) {
      if (n.regione && NOME_REGIONE_TO_CODE[n.regione]) {
        const code = NOME_REGIONE_TO_CODE[n.regione];
        counts[code] = (counts[code] || 0) + 1;
      }
    }
    return counts;
  }, [eventi]);

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
  const [limite, setLimite] = useState<number>(40);

  const filtroPeriodo = (dataStr: string): boolean => {
    const t = new Date(dataStr).getTime();
    if (!Number.isFinite(t)) return true;
    if (periodo === "7") return Date.now() - t <= 7 * 86400_000;
    if (periodo === "30") return Date.now() - t <= 30 * 86400_000;
    return true;
  };

  const filtrate = useMemo(() => {
    return eventi.filter((n) => {
      if (categoria !== "tutte" && n.categoria !== categoria) return false;
      if (regione !== "tutte" && n.regione !== regione) return false;
      if (!filtroPeriodo(n.data)) return false;
      return true;
    });
  }, [eventi, categoria, regione, periodo]);

  const visibili = filtrate.slice(0, limite);

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      {/* 1. KPI di periodo */}
      <section className="card" aria-label="Cronaca degli ultimi 7 giorni">
        <div className="card-header">
          <h2 className="card-title">La settimana in cifre</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Eventi di cronaca rilevati dal radar · confronto con la settimana precedente
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
          <KpiCard
            label="Eventi totali"
            valore={stats?.ultimi7.totale ?? 0}
            confronto={stats?.precedenti7.totale}
            su="ultimi 7 giorni"
          />
          <KpiCard
            label="Mortali"
            valore={stats?.ultimi7.mortali ?? 0}
            confronto={stats?.precedenti7.mortali}
            su="ultimi 7 giorni"
          />
          <KpiCard
            label="Gravi"
            valore={stats?.ultimi7.gravi ?? 0}
            confronto={stats?.precedenti7.gravi}
            su="ultimi 7 giorni"
          />
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-3)" }}>
          {stats?.mese.etichetta
            ? `Contatore mensile: a ${stats.mese.etichetta.toLowerCase()} la cronaca registra ${stats.mese.mortali} morti sul lavoro e ${stats.mese.totale} eventi gravi/mortali.`
            : "Contatore mensile non disponibile."}
          {" "}
          Numeri da rassegna stampa automatica, non da banche dati ufficiali.
        </p>
      </section>

      {/* 2. Mappa regionale */}
      <section className="card" aria-label="Mappa regionale della cronaca">
        <div className="card-header">
          <h2 className="card-title">Dove è successo</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {Object.keys(regioniEvento).length} regioni con almeno un evento negli ultimi 30 giorni
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)", alignItems: "start" }}>
          <ItalyMap regions={regioniEvento} onSelect={() => {}} selected={null} title="Eventi per regione" />
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {regioniLista.map((reg) => {
              const code = NOME_REGIONE_TO_CODE[reg];
              const count = code ? regioniEvento[code] || 0 : 0;
              return (
                <button
                  key={reg}
                  onClick={() => setRegione(regione === reg ? "tutte" : reg)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-2) var(--space-3)",
                    background: regione === reg ? "var(--color-surface-2)" : "var(--color-raised)",
                    border: `1px solid ${regione === reg ? "var(--color-accent)" : "var(--color-divider)"}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.88rem",
                  }}
                >
                  <span>{reg}</span>
                  <span style={{ fontWeight: 700, color: "var(--color-text-soft)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Timeline con filtri */}
      <section className="card" aria-label="Timeline della cronaca">
        <div className="card-header">
          <h2 className="card-title">La cronaca giorno per giorno</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {filtrate.length} eventi{regione !== "tutte" ? ` in ${regione}` : ""}
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
            <option value="tutto">Tutto il periodo (30 giorni)</option>
            <option value="7">Ultimi 7 giorni</option>
            <option value="30">Ultimi 30 giorni</option>
          </select>
        </div>

        {/* Timeline */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          {visibili.map((n, i) => {
            const localitaParts = [n.provincia, n.regione].filter(Boolean);
            const localita = localitaParts.length ? localitaParts.join(" · ") : null;
            const data = new Date(n.data);
            const oggi = new Date();
            const giorniFa = Math.max(0, Math.round((oggi.getTime() - data.getTime()) / 86400_000));
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
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: 8,
                  background: "var(--color-surface-2)",
                  textDecoration: "none",
                  color: "inherit",
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
                <div style={{ fontSize: "0.9rem", lineHeight: 1.35 }}>
                  {n.titolo}
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {localita ? <strong style={{ color: "var(--color-text-soft)" }}>{localita}</strong> : null}
                    {localita ? " · " : ""}
                    {n.fonte} · {formatDataCompleta(n.data)}
                  </span>
                </div>
                <ExternalLink size={15} strokeWidth={1.8} style={{ color: "var(--color-text-muted)" }} />
              </a>
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
      <section className="card" aria-label="Cronaca e dati ufficiali">
        <h2 className="card-title">Cronaca e dati ufficiali: due piani diversi</h2>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-soft)", maxWidth: "78ch", lineHeight: 1.55, margin: 0 }}>
          Questa pagina raccoglie la <strong>rassegna stampa automatica</strong> degli infortuni gravi e mortali
          sul lavoro: ogni voce è un articolo di cronaca locale o nazionale, filtrato e deduplicato dal radar.
          I numeri qui sopra <strong>non sono dati INAIL</strong>: sono un indicatore congiunturale della
          cronaca, soggetto alla copertura delle testate. Per le statistiche ufficiali certificate dell&apos;istituto,
          con serie storiche e incidenze, vai alla pagina{" "}
          <a href="/casi-mortali" style={{ color: "var(--color-link)" }}>Casi mortali e statistiche INAIL</a>.
        </p>
      </section>
    </div>
  );
}