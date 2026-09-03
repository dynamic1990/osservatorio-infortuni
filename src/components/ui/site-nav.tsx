"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/", label: "Infortuni" },
  { href: "/malattie-professionali", label: "Malattie professionali" },
  { href: "/vigilanza", label: "Vigilanza" },
  { href: "/fonti", label: "Fonti" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni del sito"
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
          gap: "var(--space-4)",
          paddingTop: "var(--space-2)",
          paddingBottom: "var(--space-2)",
          overflowX: "auto",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: "0.95rem",
            letterSpacing: "-0.01em",
            textDecoration: "none",
            whiteSpace: "nowrap",
            color: "var(--color-text)",
          }}
        >
          Osservatorio <span style={{ color: "var(--color-accent)" }}>Infortuni</span>
        </Link>
        <div style={{ display: "flex", gap: "var(--space-1)", marginLeft: "auto" }}>
          {VOCI.map((v) => {
            const attiva =
              v.href === "/" ? pathname === "/" : pathname.startsWith(v.href);
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
                        background: "var(--color-text)",
                        color: "#ffffff",
                        borderColor: "var(--color-text)",
                        fontWeight: 650,
                      }
                    : {}),
                }}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
