"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/", label: "Infortuni" },
  { href: "/malattie-professionali", label: "Malattie professionali" },
  { href: "/vigilanza", label: "Vigilanza" },
  { href: "/fonti", label: "Fonti" },
];

export function SiteNav({ variant = "top" }: { variant?: "top" | "bottom" }) {
  const pathname = usePathname();

  const links = VOCI.map((v) => {
    const attiva = v.href === "/" ? pathname === "/" : pathname.startsWith(v.href);
    return (
      <Link
        key={v.href}
        href={v.href}
        className="btn-pill"
        aria-current={attiva ? "page" : undefined}
        style={{
          textDecoration: "none",
          whiteSpace: "nowrap",
          ...(attiva
            ? {
                background: "var(--color-blue)",
                color: "#ffffff",
                borderColor: "var(--color-blue)",
                fontWeight: 650,
              }
            : {
                background: "var(--color-raised)",
                color: "var(--color-text)",
                borderColor: "var(--color-divider)",
              }),
        }}
      >
        {v.label}
      </Link>
    );
  });

  // Footer: solo il menù, senza intestazione
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
          {links}
        </div>
      </nav>
    );
  }

  // Header fisso: nome del sito sopra, menù sotto
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
      <div className="container" style={{ paddingTop: "var(--space-3)", paddingBottom: "var(--space-2)" }}>
        <Link
          href="/"
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
      </div>
      <nav
        aria-label="Sezioni del sito"
        className="container"
        style={{
          display: "flex",
          gap: "var(--space-1)",
          paddingBottom: "var(--space-2)",
          overflowX: "auto",
        }}
      >
        {links}
      </nav>
    </header>
  );
}