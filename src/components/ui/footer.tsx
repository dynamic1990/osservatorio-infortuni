import { GitHubIcon, LinkedInIcon } from "./social-icons";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-raised)",
        borderTop: "1px solid var(--color-divider)",
        marginTop: "var(--space-6)",
        paddingTop: "var(--space-6)",
        paddingBottom: "var(--space-6)",
      }}
    >
      <div className="container" style={{ display: "grid", gap: "var(--space-3)" }}>
        <div style={{ fontWeight: 750, fontSize: "1.05rem" }}>
          Osservatorio <span style={{ color: "var(--color-accent)" }}>Infortuni</span> sul Lavoro
        </div>
        <p
          style={{
            maxWidth: 640,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Piattaforma indipendente di analisi statistica sugli infortuni sul lavoro in Italia. I dati
          provengono da fonti pubbliche (INAIL, Eurostat ESAW, ISTAT) e sono elaborati a scopo
          informativo e divulgativo: il presente osservatorio non è affiliato agli enti citati e non
          sostituisce le pubblicazioni ufficiali.
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Progetto a cura di Ing. Damiano Salvati · 2026
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            margin: 0,
            paddingTop: "var(--space-2)",
          }}
        >
          Per domande, segnalazioni o collaborazioni, scrivimi pure su LinkedIn:
        </p>
        <div
          style={{
            display: "grid",
            gap: "var(--space-2)",
            fontSize: "0.92rem",
            color: "var(--color-text-muted)",
          }}
        >
          <a
            href="https://github.com/dynamic1990/osservatorio-infortuni"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5em",
              width: "fit-content",
              color: "var(--color-link)",
              textDecoration: "none",
            }}
          >
            <GitHubIcon size={20} />
            Codice sorgente su GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/damiano-salvati"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5em",
              width: "fit-content",
              color: "var(--color-link)",
              textDecoration: "none",
            }}
          >
            <LinkedInIcon size={20} />
            Profilo LinkedIn
          </a>
        </div>
        <span style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--color-text-muted)" }}>
          Codice AGPL-3.0, dati dalle fonti pubbliche citate (vedi Fonti)
        </span>
      </div>
    </footer>
  );
}