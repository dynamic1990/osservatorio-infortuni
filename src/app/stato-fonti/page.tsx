import type { Metadata } from "next";
import { listSources } from "@/lib/sources";
import { getSourceStatus, SOURCE_STATUS } from "@/lib/source-status";

export const metadata: Metadata = {
  title: "Stato delle fonti",
  description: "Stato dichiarato, periodo, freschezza e snapshot delle fonti dell'Osservatorio Infortuni.",
  alternates: { canonical: "/stato-fonti" },
};

const STATE_STYLE = {
  verified: { color: "var(--color-success)", background: "var(--color-success-soft)", icon: "✓" },
  "manual-review": { color: "var(--color-warning)", background: "var(--color-warning-soft)", icon: "!" },
  planned: { color: "var(--color-text-muted)", background: "var(--color-surface)", icon: "○" },
} as const;

export default function StatoFontiPage() {
  const sources = listSources();
  const verificati = SOURCE_STATUS.filter((item) => item.dataState === "verified").length;
  const revisioni = SOURCE_STATUS.filter((item) => item.dataState === "manual-review").length;
  const pianificati = SOURCE_STATUS.filter((item) => item.dataState === "planned").length;

  return (
    <main className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-4)" }}>
      <header style={{ background: "var(--color-raised)", border: "1px solid var(--color-divider)", padding: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
          <span style={{ background: "var(--color-accent)", color: "var(--color-raised)", fontSize: "0.72rem", fontWeight: 750, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Osservabilità</span>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Stato dichiarato del repository</span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>Stato delle fonti</h1>
        <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
          Qui distinguiamo la salute della fonte dal contenuto pubblicato. Una fonte può essere raggiungibile ma avere dati vecchi; un endpoint può essere temporaneamente non disponibile mentre l&apos;ultimo snapshot verificato resta online.
        </p>
      </header>

      <section className="grid-kpi" aria-label="Riepilogo stato fonti">
        <div className="card" style={{ borderTop: "3px solid var(--color-success)" }}><div className="metric-label">Snapshot verificati</div><div className="metric-value">{verificati}</div><div className="metric-sub">pubblicabili con ricevuta</div></div>
        <div className="card" style={{ borderTop: "3px solid var(--color-warning)" }}><div className="metric-label">Revisione manuale</div><div className="metric-value">{revisioni}</div><div className="metric-sub">attenzione interpretativa</div></div>
        <div className="card" style={{ borderTop: "3px solid var(--color-divider)" }}><div className="metric-label">In pianificazione</div><div className="metric-value">{pianificati}</div><div className="metric-sub">nessun dato pubblicato</div></div>
      </section>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {sources.map((source) => {
          const status = getSourceStatus(source.id);
          if (!status) return null;
          const style = STATE_STYLE[status.dataState];
          return (
            <article className="card" key={source.id} style={{ display: "grid", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div><div style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", fontWeight: 750, letterSpacing: "0.08em", textTransform: "uppercase" }}>{source.area}</div><h2 style={{ margin: "2px 0 0", fontSize: "1.15rem" }}>{source.owner}</h2></div>
                <span style={{ color: style.color, background: style.background, border: "1px solid currentColor", padding: "5px 9px", fontSize: "0.73rem", fontWeight: 750, whiteSpace: "nowrap" }}><span aria-hidden="true">{style.icon}</span> {status.label}</span>
              </div>
              <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", margin: 0 }}>
                <div><dt className="metric-label">Periodo</dt><dd style={{ margin: 0, fontSize: "0.9rem" }}>{status.period}</dd></div>
                <div><dt className="metric-label">Freschezza</dt><dd style={{ margin: 0, fontSize: "0.9rem" }}>{status.freshness}</dd></div>
                <div><dt className="metric-label">Ultimo controllo</dt><dd style={{ margin: 0, fontSize: "0.9rem" }}>{status.checkedAt}</dd></div>
                <div><dt className="metric-label">Ultima estrazione</dt><dd style={{ margin: 0, fontSize: "0.9rem" }}>{status.extractedAt ?? "Non applicabile"}</dd></div>
              </dl>
              <p style={{ margin: 0, color: "var(--color-text-soft)", fontSize: "0.86rem", lineHeight: 1.5 }}>{status.note}</p>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", fontSize: "0.82rem" }}>
                <a href={source.landingUrl} target="_blank" rel="noreferrer">Fonte ufficiale ↗</a>
                {status.snapshotPath && <span style={{ color: "var(--color-text-muted)" }}>Snapshot: <code>{status.snapshotPath}</code></span>}
              </div>
            </article>
          );
        })}
      </div>

      <aside className="card" style={{ background: "var(--color-surface)", borderLeft: "3px solid var(--color-accent)" }}>
        <strong>Limite del monitoraggio</strong>
        <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-soft)", fontSize: "0.88rem", lineHeight: 1.55 }}>
          Questa pagina descrive lo stato versionato nel repository. Non esegue richieste live in fase di rendering e quindi non dichiara la raggiungibilità attuale degli endpoint. Il controllo operativo delle fonti resta affidato all&apos;audit Python e alla revisione prima della pubblicazione.
        </p>
      </aside>
    </main>
  );
}
