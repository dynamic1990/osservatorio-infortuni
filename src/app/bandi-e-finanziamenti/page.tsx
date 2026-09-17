import type { Metadata } from "next";
import { AGGIORNATO_AL, BANDI_PREVENZIONE, type BandoPrevenzione, type StatoBando } from "@/data/bandi-prevenzione";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Bandi e Finanziamenti per la Prevenzione | Osservatorio Infortuni sul Lavoro",
  description:
    "Raccolta curata dei bandi e finanziamenti per le imprese che investono in prevenzione e sicurezza sul lavoro: INAIL ISI, fondi interprofessionali, Regioni. Scadenze, importi e link ufficiali.",
  alternates: { canonical: "/bandi-e-finanziamenti" },
};

const STATO_STYLE: Record<StatoBando, { background: string; color: string }> = {
  Aperto: { background: "var(--color-accent)", color: "var(--color-raised)" },
  "In scadenza": { background: "var(--color-accent)", color: "var(--color-raised)" },
  "Prossima apertura": { background: "var(--color-divider)", color: "var(--color-text)" },
  "Da verificare": { background: "var(--color-surface)", color: "var(--color-text-muted)" },
};

function BandoCard({ bando }: { bando: BandoPrevenzione }) {
  const stato = STATO_STYLE[bando.stato];
  return (
    <article className="card" style={{ display: "grid", gap: "var(--space-2)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontWeight: 750,
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {bando.ente} &middot; {bando.regione}
        </span>
        <span
          style={{
            background: stato.background,
            color: stato.color,
            fontSize: "0.72rem",
            fontWeight: 750,
            padding: "2px 8px",
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {bando.stato}
        </span>
      </div>
      <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>{bando.titolo}</h3>
      <p style={{ color: "var(--color-text-soft)", margin: 0, fontSize: "0.92rem" }}>{bando.descrizione}</p>
      {(bando.dotazione || bando.contributo) && (
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-1) var(--space-3)", margin: 0, fontSize: "0.85rem" }}>
          {bando.dotazione && (
            <>
              <dt style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>Dotazione</dt>
              <dd style={{ margin: 0 }}>{bando.dotazione}</dd>
            </>
          )}
          {bando.contributo && (
            <>
              <dt style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>Contributo</dt>
              <dd style={{ margin: 0 }}>{bando.contributo}</dd>
            </>
          )}
        </dl>
      )}
      {bando.scadenzaLabel && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
          <strong>Scadenza:</strong> {bando.scadenzaLabel}
        </p>
      )}
      {bando.note && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{bando.note}</p>}
      <a
        href={bando.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ justifySelf: "start", fontWeight: 700, fontSize: "0.88rem", textDecoration: "underline" }}
      >
        Vai al bando ufficiale &rarr;
      </a>
    </article>
  );
}

export default function BandiPrevenzionePage() {
  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      <header
        style={{
          background: "var(--color-raised)",
          border: "1px solid var(--color-divider)",
          padding: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
              <span
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-raised)",
                  fontSize: "0.72rem",
                  fontWeight: 750,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Opportunità per le imprese
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                INAIL &middot; Fondi interprofessionali &middot; Regioni
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Bandi e Finanziamenti per la Prevenzione
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
              Ogni anno lo Stato e gli enti previdenziali mettono a disposizione delle imprese risorse
              significative per investire in salute e sicurezza. Questo raccoglitore tiene traccia dei bandi
              aperti, delle scadenze e degli importi, a partire dalle fonti che erogano davvero i contributi.
            </p>
            <div style={{ marginTop: "var(--space-2)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              Aggiornato al {AGGIORNATO_AL} &middot; Progetto a cura di{" "}
              <strong style={{ color: "var(--color-text)" }}>Ing. Damiano Salvati</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="card" aria-label="Elenco bandi attivi" style={{ padding: "var(--space-3)" }}>
        <div className="card-header">
          <h2 className="card-title">Bandi in evidenza</h2>
          <p className="card-desc">
            INAIL e i fondi interprofessionali coprono la maggior parte delle risorse disponibili; le Regioni
            aggiungono misure locali. Lo stato &ldquo;Da verificare&rdquo; segnala i bandi la cui scadenza va
            controllata sul portale ufficiale.
          </p>
        </div>
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {BANDI_PREVENZIONE.map((bando) => (
            <BandoCard key={bando.id} bando={bando} />
          ))}
        </div>
      </section>

      <section className="card" aria-label="Note metodologiche" style={{ padding: "var(--space-3)" }}>
        <h2 className="card-title">Come leggere questa pagina</h2>
        <p style={{ color: "var(--color-text-soft)", fontSize: "0.92rem", margin: 0 }}>
          Le informazioni sono curate a mano e verificate sulle fonti ufficiali, ma le condizioni di ogni bando
          cambiano spesso. <strong>Prima di presentare una domanda, verifica sempre i dettagli sul portale
          dell&apos;ente che emette il bando.</strong> L&apos;Ispettorato Nazionale del Lavoro e le ASL non
          pubblicano bandi di finanziamento per le imprese: il loro ruolo è di vigilanza, informazione e
          assistenza, e per questo non compaiono tra le fonti.
        </p>
      </section>
    </div>
  );
}