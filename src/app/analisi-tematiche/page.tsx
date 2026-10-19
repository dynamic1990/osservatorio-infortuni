import type { Metadata } from "next";
import { TemiTrasversali } from "@/components/charts/temi-trasversali";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Analisi tematiche | Infor.MO INAIL",
  description:
    "Analisi trasversali sull'archivio Infor.MO INAIL 2010-2024: attività manutentive e altri temi che attraversano tutti i settori, con parole chiave sulla dinamica degli eventi. La stessa metodologia delle schede INAIL DIMEILA (es. Scheda 28 sulle attività manutentive).",
  alternates: { canonical: "/analisi-tematiche" },
};

export default function AnalisiTematichePage() {
  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* Header */}
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
                Analisi tematiche
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Archivio Infor.MO &middot; INAIL &middot; 2010-2024
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Tendenze trasversali degli infortuni
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
              Alcuni pericoli non appartengono a un settore: attraversano tutte le attività produttive.
              La manutenzione, il lavoro in quota, le attività di pulizia. Qui li isoliamo dal racconto
              degli eventi, con la stessa metodologia delle schede INAIL.
            </p>
          </div>
        </div>
      </header>

      {/* Metodologia */}
      <section className="card" aria-label="Metodologia delle analisi tematiche" id="metodologia">
        <div className="card-header">
          <h2 className="card-title">Come funziona l&apos;analisi tematica</h2>
          <p className="card-desc">Parole chiave sulla dinamica, come fanno le schede INAIL.</p>
        </div>
        <div style={{ display: "grid", gap: "var(--space-3)", fontSize: "0.9rem", lineHeight: 1.65, color: "var(--color-text-soft)" }}>
          <p style={{ margin: 0 }}>
            L&apos;archivio <strong>Infor.MO</strong> registra per ogni caso una <strong>dinamica testuale</strong>:
            la descrizione del racconto dell&apos;infortunio scritta dagli analisti. Molti temi importanti non sono
            però una dimensione strutturata del database: un caso di manutenzione può avvenire in un&apos;azienda
            alimentare, in una metalmeccanica o in un cantiere edile. Per isolarli occorre leggere i testi.
          </p>
          <p style={{ margin: 0 }}>
            Le <strong>schede INAIL DIMEILA</strong> (la collana &ldquo;Il sistema di sorveglianza Infor.MO&rdquo;)
            fanno esattamente questo: la <strong>Scheda 28</strong> sulle attività manutentive seleziona i casi con
            parole chiave sulla variabile narrativa. Noi applichiamo la stessa logica all&apos;intero archivio
            2010-2024, con una lista di parole chiave calibrata e documentata, e rendiamo i risultati consultabili.
          </p>
          <p style={{ margin: 0 }}>
            Ogni tema mostra: la serie per anno (mortali e gravi), la distribuzione per sezione Ateco (dalla
            mappatura delle descrizioni settoriali Infor.MO), le modalità di accadimento prevalenti, i fattori
            causali classificati dagli analisti e una selezione di casi reali con la dinamica abbreviata.
          </p>
          <p className="source-note" style={{ margin: 0 }}>
            Limiti dichiarati: la selezione per parole chiave è metodologica e può differire dalle regole interne
            INAIL (la Scheda 28 conta 259 casi su 1.128 del manifatturiero 2014-2023; la nostra selezione
            equivalente ne identifica 282, con lo stesso ordine di grandezza e la stessa distribuzione per
            settore). Il confronto è reso possibile dalla trasparenza delle regole, non dalla identità dei numeri.
          </p>
        </div>
      </section>

      {/* Componente interattivo */}
      <TemiTrasversali />
    </div>
  );
}