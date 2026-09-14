import type { Metadata } from "next";
import { listSources } from "@/lib/sources";
import { getSourceStatus } from "@/lib/source-status";
import artifactRegistry from "../../../scripts/ci/generated-artifacts.json";

export const metadata: Metadata = {
  title: "Fonti",
  description: "Fonti, stato, freschezza e metodologia di Osservatorio Infortuni.",
  alternates: { canonical: "/fonti" },
};

export default function FontiPage() {
  const fonti = listSources();
  const attive = fonti.filter((fonte) => fonte.status === "active").length;
  const pianificate = fonti.filter((fonte) => fonte.status === "planned").length;
  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-4)" }}>
      <header
        style={{
          background: "var(--color-raised)",
          border: "1px solid var(--color-divider)",
          padding: "var(--space-6)",
        }}
      >
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
            Registro delle fonti
          </span>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            Open Data &middot; Istituzioni &middot; Report ufficiali
          </span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
          Fonti
        </h1>
        <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
          Ogni numero pubblicato ha una fonte, una data di estrazione, uno stato e dei limiti dichiarati.
          Qui trovi il registro completo e lo stato di ciascuna fonte.
        </p>
      </header>

      <section className="grid-kpi" aria-label="Stato del registro">
        <div className="card" style={{ borderTop: "3px solid var(--color-success)" }}>
          <div className="metric-label">Fonti attive</div>
          <div className="metric-value">{attive}</div>
          <div className="metric-sub">con integrazione nel sito</div>
        </div>
        <div className="card" style={{ borderTop: "3px solid var(--color-warning)" }}>
          <div className="metric-label">In pianificazione</div>
          <div className="metric-value">{pianificate}</div>
          <div className="metric-sub">non ancora pubblicate</div>
        </div>
        <div className="card" style={{ borderTop: "3px solid var(--color-link)" }}>
          <div className="metric-label">Artifact verificati</div>
          <div className="metric-value">{artifactRegistry.artifacts.length}</div>
          <div className="metric-sub">snapshot controllati con SHA-256</div>
        </div>
      </section>

      <aside className="card" style={{ background: "var(--color-surface)", borderLeft: "3px solid var(--color-accent)" }}>
        <strong>Come leggere questo registro</strong>
        <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-soft)", fontSize: "0.88rem", lineHeight: 1.55 }}>
          Una fonte attiva non significa che il dato sia aggiornato in tempo reale. Le pagine pubblicano snapshot verificati; data di riferimento, data di estrazione e limiti restano distinti. I controlli automatici bloccano la pubblicazione se gli artifact cambiano in modo inatteso.
        </p>
      </aside>

      {fonti.map((fonte) => {
        const status = getSourceStatus(fonte.id);
        return (
        <section className="card" key={fonte.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{fonte.area}</h2>
              <div style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>{fonte.owner}</div>
            </div>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--color-divider)",
              padding: "4px 8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: fonte.status === "active" ? "var(--color-success)" : "var(--color-warning)",
              background: "var(--color-raised)",
            }}>
              <span aria-hidden="true">●</span>
              {status?.label ?? (fonte.status === "active" ? "INTEGRATA" : "IN PIANIFICAZIONE")}
            </span>
          </div>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)", margin: "var(--space-4) 0 0" }}>
            <div>
              <dt style={{ fontWeight: 600, fontSize: "0.8rem" }}>Formato</dt>
              <dd style={{ margin: 0 }}>{fonte.format}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 600, fontSize: "0.8rem" }}>Cadenza</dt>
              <dd style={{ margin: 0 }}>{fonte.frequency}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 600, fontSize: "0.8rem" }}>Copertura</dt>
              <dd style={{ margin: 0 }}>{fonte.coverage}</dd>
            </div>
            {status && <div>
              <dt style={{ fontWeight: 600, fontSize: "0.8rem" }}>Periodo pubblicato</dt>
              <dd style={{ margin: 0 }}>{status.period}</dd>
            </div>}
            {status && <div>
              <dt style={{ fontWeight: 600, fontSize: "0.8rem" }}>Freschezza</dt>
              <dd style={{ margin: 0 }}>{status.freshness}</dd>
            </div>}
          </dl>
          {fonte.notes && <p style={{ fontSize: "0.85rem", color: "var(--color-text-soft)", marginBottom: 0 }}>{fonte.notes}</p>}
          {status?.note && <p style={{ fontSize: "0.85rem", color: "var(--color-text-soft)", marginBottom: 0 }}>{status.note}</p>}
          <div style={{ marginTop: "var(--space-3)", fontSize: "0.85rem" }}>
            <a href={fonte.landingUrl} target="_blank" rel="noreferrer">Pagina del dataset ↗</a>
            {" · "}
            <a href={fonte.apiUrl} target="_blank" rel="noreferrer">Endpoint API ↗</a>
          </div>
        </section>
        );
      })}
    </div>
  );
}
