"use client";

import { usePathname } from "next/navigation";
import { LinkedInIcon } from "./social-icons";

export function Footer() {
  const pathname = usePathname();
  const mostraAutore = pathname === "/";

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
        {mostraAutore && (
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
        )}
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            margin: 0,
            paddingTop: "var(--space-2)",
          }}
        >
          Per domande, segnalazioni o collaborazioni, scrivimi su LinkedIn:
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
              fontWeight: 600,
            }}
          >
            <LinkedInIcon size={20} />
            linkedin.com/in/damiano-salvati
          </a>
        </div>
        <span style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--color-text-muted)", display: "grid", gap: "2px" }}>
          <span>Codice rilasciato sotto licenza GNU AGPL-3.0: uso, modifica e riuso liberi, con l&apos;obbligo di condividere le modifiche.</span>
          <span>I dati provengono dalle fonti pubbliche citate (vedi Fonti) e restano soggetti alle licenze degli enti proprietari.</span>
        </span>
      </div>
    </footer>
  );
}