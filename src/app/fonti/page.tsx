import type { Metadata } from "next";
import { listSources } from "@/lib/sources";

export const metadata: Metadata = {
  title: "Fonti",
  description: "Registro delle fonti ufficiali integrate in Osservatorio Infortuni.",
};

export default function FontiPage() {
  const fonti = listSources();
  return (
    <div style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-4)" }}>
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
          Ogni numero pubblicato ha una fonte, una data di estrazione e dei limiti dichiarati.
          Questo è il registro delle fonti integrate.
        </p>
      </header>

      {fonti.map((fonte) => (
        <section className="card" key={fonte.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{fonte.area}</h2>
              <div style={{ color: "var(--color-text-soft)", fontSize: "0.85rem" }}>{fonte.owner}</div>
            </div>
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
          </dl>
          {fonte.notes && <p style={{ fontSize: "0.85rem", color: "var(--color-text-soft)", marginBottom: 0 }}>{fonte.notes}</p>}
          <div style={{ marginTop: "var(--space-3)", fontSize: "0.85rem" }}>
            <a href={fonte.landingUrl} target="_blank" rel="noreferrer">Pagina del dataset ↗</a>
            {" · "}
            <a href={fonte.apiUrl} target="_blank" rel="noreferrer">Endpoint API ↗</a>
          </div>
        </section>
      ))}
    </div>
  );
}
