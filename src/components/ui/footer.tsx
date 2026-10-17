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
      { href: "/fonti", label: "Fonti e metodo" },
      { href: "/progetto", label: "Il progetto" },
    ],
  },
];

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          {/* Colonna brand */}
          <div style={{ display: "grid", gap: "var(--space-2)", alignContent: "start" }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
              Osservatorio <span style={{ color: "var(--color-accent)" }}>Infortuni</span> sul Lavoro
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color: "var(--color-text-muted)",
                margin: 0,
                maxWidth: "26ch",
              }}
            >
              Dati INAIL, ISTAT ed Eurostat. Monitoraggio indipendente degli infortuni sul lavoro in Italia.
            </p>
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
                        fontSize: "0.9rem",
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
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <LinkedInIcon size={18} />
              linkedin.com/in/damiano-salvati
            </a>
            <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
              Codice rilasciato sotto licenza GNU AGPL-3.0: uso, modifica e riuso liberi, con l&apos;obbligo di condividere le modifiche. I dati provengono dalle fonti pubbliche citate (vedi Fonti) e restano soggetti alle licenze degli enti proprietari.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}