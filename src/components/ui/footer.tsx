"use client";

import Link from "next/link";
import { LinkedInIcon } from "./social-icons";

const SEZIONI = [
  { href: "/", label: "Quadro generale" },
  { href: "/cronaca-infortuni", label: "Cronaca di infortuni" },
  { href: "/analisi-delle-cause", label: "Analisi delle cause" },
  { href: "/malattie-professionali", label: "Malattie professionali" },
  { href: "/vigilanza", label: "Vigilanza" },
  { href: "/bandi-e-finanziamenti", label: "Bandi e finanziamenti" },
  { href: "/calcolatore-costo-infortunio", label: "Costo dell'infortunio" },
  { href: "/report", label: "Report" },
  { href: "/fonti", label: "Fonti e metodo" },
  { href: "/progetto", label: "Il progetto" },
];

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
        <nav aria-label="Sezioni del sito">
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-1) var(--space-3)",
              fontSize: "0.9rem",
            }}
          >
            {SEZIONI.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  style={{
                    color: "var(--color-link)",
                    textDecoration: "none",
                    fontWeight: 550,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            margin: 0,
            paddingTop: "var(--space-2)",
          }}
        >
          Per domande, segnalazioni o collaborazioni, contattami su:
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
        <span style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--color-text-muted)", display: "block" }}>
          Codice rilasciato sotto licenza GNU AGPL-3.0: uso, modifica e riuso liberi, con l&apos;obbligo di condividere le modifiche. I dati provengono dalle fonti pubbliche citate (vedi Fonti) e restano soggetti alle licenze degli enti proprietari.
        </span>
      </div>
    </footer>
  );
}