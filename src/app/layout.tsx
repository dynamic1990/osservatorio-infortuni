import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Osservatorio Infortuni",
    template: "%s · Osservatorio Infortuni",
  },
  description:
    "Open data INAIL sugli infortuni sul lavoro in Italia, spiegati in modo semplice, verificabile e open source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-4)" }}>
          <a href="/" style={{ textDecoration: "none", fontWeight: 700, fontSize: "1.1rem" }}>
            Osservatorio Infortuni
          </a>
          <span style={{ color: "var(--color-text-soft)", marginLeft: "var(--space-2)" }}>
            open data INAIL, leggibili e verificabili
          </span>
        </header>
        <main className="container">{children}</main>
        <footer className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-6)", color: "var(--color-text-soft)", fontSize: "0.85rem" }}>
          Fonte: INAIL Open Data. Ogni numero ha fonte e data di estrazione. Codice su GitHub.
        </footer>
      </body>
    </html>
  );
}
