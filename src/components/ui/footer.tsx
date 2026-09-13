const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function GitHubIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-raised)",
        borderTop: "1px solid var(--color-divider)",
        marginTop: "var(--space-8)",
        paddingTop: "var(--space-6)",
        paddingBottom: "var(--space-6)",
      }}
    >
      <div className="container" style={{ display: "grid", gap: "var(--space-2)" }}>
        <div style={{ fontWeight: 750, fontSize: "0.95rem" }}>
          Osservatorio <span style={{ color: "var(--color-accent)" }}>Infortuni</span> sul Lavoro
        </div>
        <p
          style={{
            maxWidth: 640,
            fontSize: "0.8rem",
            lineHeight: 1.55,
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Piattaforma indipendente di analisi statistica sugli infortuni sul lavoro in Italia. I dati
          provengono da fonti pubbliche (INAIL, Eurostat ESAW, ISTAT) e sono elaborati a scopo
          informativo e divulgativo: il presente osservatorio non è affiliato agli enti citati e non
          sostituisce le pubblicazioni ufficiali.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--space-3)",
            fontSize: "0.76rem",
            color: "var(--color-text-muted)",
            margin: 0,
            paddingTop: "var(--space-2)",
          }}
        >
          <span>Progetto a cura di Ing. Damiano Salvati · 2026</span>
          <span aria-hidden="true" style={{ color: "var(--color-divider)" }}>·</span>
          <a
            href="https://github.com/dynamic1990/osservatorio-infortuni"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35em",
              color: "var(--color-link)",
              textDecoration: "none",
            }}
          >
            <GitHubIcon />
            Codice sorgente su GitHub
          </a>
          <span aria-hidden="true" style={{ color: "var(--color-divider)" }}>·</span>
          <a
            href="https://www.linkedin.com/in/damiano-salvati"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35em",
              color: "var(--color-link)",
              textDecoration: "none",
            }}
          >
            <LinkedInIcon />
            Profilo LinkedIn
          </a>
          <span aria-hidden="true" style={{ color: "var(--color-divider)" }}>·</span>
          <span>Codice AGPL-3.0, dati dalle fonti pubbliche citate (vedi Fonti)</span>
        </div>
      </div>
    </footer>
  );
}