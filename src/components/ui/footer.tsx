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
        <p
          style={{
            fontSize: "0.76rem",
            color: "var(--color-text-muted)",
            margin: 0,
            paddingTop: "var(--space-2)",
          }}
        >
          Progetto a cura di Ing. Damiano Salvati · 2026
        </p>
      </div>
    </footer>
  );
}