"use client";

import Link from "next/link";
import { LinkedInIcon } from "./social-icons";

const COLONNE: { titolo: string; link: { href: string; label: string }[] }[] = [
  {
    titolo: "Esplora",
    link: [
      { href: "/", label: "Quadro generale" },
      { href: "/cronaca-infortuni", label: "Cronaca di infortuni" },
      { href: "/analisi-delle-cause", label: "Analisi delle cause" },
      { href: "/malattie-professionali", label: "Malattie professionali" },
      { href: "/vigilanza", label: "Vigilanza" },
    ],
  },
  {
    titolo: "Strumenti",
    link: [
      { href: "/bandi-e-finanziamenti", label: "Bandi e finanziamenti" },
      { href: "/calcolatore-costo-infortunio", label: "Costo dell'infortunio" },
      { href: "/report", label: "Report" },
    ],
  },
  {
    titolo: "Trasparenza",
    link: [
      { href: "/fonti", label: "Fonti e metodo" },
      { href: "/progetto", label: "Il progetto" },
    ],
  },
];

const BLU_LINKEDIN = "#0A66C2";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-raised)",
        borderTop: "1px solid var(--color-divider)",
        marginTop: "var(--space-6)",
        paddingTop: "var(--space-8)",
        paddingBottom: "var(--space-6)",
      }}
    >
      <div className="container">
        <div className="footer-grid">
          {/* Colonna brand */}
          <div style={{ alignContent: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              <img src="/icon.png" alt="Logo Osservatorio Infortuni" width={40} height={40} style={{ borderRadius: 8, display: "block", flex: "0 0 auto" }} />
              <span>
                Osservatorio <span style={{ color: "var(--color-accent)" }}>Infortuni</span>
              </span>
            </div>
          </div>

          {/* Colonne link */}
          {COLONNE.map((col) => (
            <nav key={col.titolo} aria-label={col.titolo} style={{ display: "grid", gap: "var(--space-2)", alignContent: "start" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 750,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                {col.titolo}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-1)" }}>
                {col.link.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      style={{
                        color: "var(--color-text)",
                        textDecoration: "none",
                        fontSize: "0.92rem",
                        fontWeight: 500,
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Colonna contatti */}
          <div style={{ display: "grid", gap: "var(--space-2)", alignContent: "start" }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 750,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              Contatti
            </div>
            <a
              href="https://www.linkedin.com/in/damiano-salvati"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5em",
                width: "fit-content",
                color: BLU_LINKEDIN,
                textDecoration: "none",
                fontSize: "0.92rem",
                fontWeight: 600,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#004182";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = BLU_LINKEDIN;
              }}
            >
              <LinkedInIcon size={18} />
              linkedin.com/in/damiano-salvati
            </a>
            <a
              href="mailto:salvati.damiano@gmail.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5em",
                width: "fit-content",
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: "0.92rem",
                fontWeight: 500,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
              }}
            >
              salvati.damiano@gmail.com
            </a>
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", lineHeight: 1.55, color: "var(--color-text-muted)", margin: "var(--space-6) 0 0", padding: "var(--space-4) 0 0", borderTop: "1px solid var(--color-divider)", width: "100%" }}>
          Codice rilasciato sotto licenza GNU AGPL-3.0. I dati provengono dalle fonti pubbliche citate (vedi Fonti) e restano soggetti alle licenze degli enti proprietari.
        </p>
      </div>
    </footer>
  );
}