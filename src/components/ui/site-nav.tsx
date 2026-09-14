"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CircleDollarSign, Cross, ExternalLink, FileText, Home, Menu, ScanSearch, SearchCheck, X } from "lucide-react";
import { GitHubIcon } from "./social-icons";

const VOCI = [
  { href: "/", label: "Quadro generale", icon: Home, group: "Esplora" },
  { href: "/casi-mortali", label: "Analisi delle cause", icon: ScanSearch, group: "Esplora" },
  { href: "/malattie-professionali", label: "Malattie professionali", icon: Cross, group: "Esplora" },
  { href: "/vigilanza", label: "Vigilanza", icon: SearchCheck, group: "Esplora" },
  { href: "/calcolatore-costo-infortunio", label: "Costo dell'infortunio", icon: CircleDollarSign, group: "Strumenti" },
  { href: "/fonti", label: "Fonti e metodo", icon: BookOpen, group: "Trasparenza" },
  { href: "/progetto", label: "Il progetto", icon: FileText, group: "Trasparenza" },
];

export function SiteNav({ variant = "top" }: { variant?: "top" | "bottom" }) {
  const pathname = usePathname();
  const [aperto, setAperto] = useState(false);

  const attiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Footer: link semplici, niente hamburger
  if (variant === "bottom") {
    return (
      <nav
        aria-label="Sezioni del sito"
        style={{
          background: "var(--color-raised)",
          borderTop: "1px solid var(--color-divider)",
          marginTop: "var(--space-8)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "var(--space-1)",
            paddingTop: "var(--space-3)",
            paddingBottom: "var(--space-3)",
          }}
        >
          {VOCI.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="btn-pill"
              aria-current={attiva(v.href) ? "page" : undefined}
              style={{
                textDecoration: "none",
                whiteSpace: "nowrap",
                ...(attiva(v.href)
                  ? {
                      background: "var(--color-text)",
                      color: "var(--color-raised)",
                      borderColor: "var(--color-text)",
                      fontWeight: 650,
                    }
                  : {
                      background: "var(--color-raised)",
                      color: "var(--color-text)",
                      borderColor: "var(--color-text)",
                    }),
              }}
            >
              <v.icon aria-hidden="true" size={17} strokeWidth={1.8} style={{ width: 20 }} />
              {v.label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  // Header: logo + hamburger, drawer laterale con le voci
  return (
    <header
      style={{
        background: "var(--color-raised)",
        borderBottom: "1px solid var(--color-divider)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          paddingTop: "var(--space-3)",
          paddingBottom: "var(--space-3)",
        }}
      >
        <Link
          href="/"
          onClick={() => setAperto(false)}
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            letterSpacing: "-0.01em",
            textDecoration: "none",
            whiteSpace: "nowrap",
            color: "var(--color-text)",
          }}
        >
          Osservatorio <span style={{ color: "var(--color-accent)" }}>Infortuni</span>
        </Link>
        <button
          type="button"
          aria-label={aperto ? "Chiudi il menu" : "Apri il menu"}
          aria-expanded={aperto}
          onClick={() => setAperto((a) => !a)}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            width: 38,
            height: 38,
            borderRadius: 10,
            border: "1px solid var(--color-divider)",
            background: "var(--color-surface)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
        </button>
      </div>

      {aperto && (
        <>
          <div
            onClick={() => setAperto(false)}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(26, 24, 23, 0.4)",
              zIndex: 90,
            }}
          />
          <nav
            aria-label="Sezioni del sito"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(320px, 86vw)",
              background: "var(--color-raised)",
              zIndex: 100,
              borderLeft: "1px solid var(--color-divider)",
              boxShadow: "-16px 0 36px rgba(0,0,0,0.14)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid var(--color-divider)",
              }}
            >
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", display: "block" }}>Esplora l&apos;osservatorio</span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Dati, strumenti e metodo</span>
              </div>
              <button
                type="button"
                aria-label="Chiudi il menu"
                onClick={() => setAperto(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "1.2rem", color: "var(--color-text)", padding: 4 }}
              >
                <X aria-hidden="true" size={20} strokeWidth={1.8} />
              </button>
            </div>
            <div style={{ display: "grid", gap: "var(--space-4)", padding: "var(--space-4) var(--space-3)" }}>
              {["Esplora", "Strumenti", "Trasparenza"].map((group) => (
                <div key={group}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.68rem", fontWeight: 750, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 14px 6px" }}>{group}</div>
                  {VOCI.filter((v) => v.group === group).map((v) => (
                <Link
                  key={v.href}
                  href={v.href}
                  onClick={() => setAperto(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    color: attiva(v.href) ? "var(--color-raised)" : "var(--color-text)",
                    background: attiva(v.href) ? "var(--color-text)" : "transparent",
                    fontWeight: attiva(v.href) ? 700 : 550,
                    padding: "12px 14px",
                    borderRadius: 8,
                    fontSize: "0.95rem",
                  }}
                >
                  <v.icon aria-hidden="true" size={18} strokeWidth={1.8} style={{ width: 22, opacity: attiva(v.href) ? 1 : 0.65 }} />
                  {v.label}
                </Link>
                  ))}
                </div>
              ))}
              <a
                href="https://github.com/dynamic1990/osservatorio-infortuni"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAperto(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, margin: "var(--space-2) 14px 0", padding: "11px 12px", border: "1px solid var(--color-text)", color: "var(--color-text)", textDecoration: "none", fontWeight: 700, fontSize: "0.88rem" }}
              >
                <GitHubIcon size={19} /> Codice sorgente su GitHub <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} style={{ marginLeft: "auto" }} />
              </a>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
