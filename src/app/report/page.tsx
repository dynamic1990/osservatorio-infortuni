import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Report | Osservatorio Infortuni sul Lavoro",
  description:
    "Report brevi sui dati INAIL: infortuni, morti sul lavoro, malattie professionali, vigilanza e cause, con fonti e metodo.",
  alternates: { canonical: "/report" },
};

const REPORT = [
  {
    href: "/report/infortuni-1-semestre-2026",
    title: "Infortuni sul lavoro, primo semestre 2026: più denunce, meno casi mortali",
    date: "16 settembre 2026",
    description:
      "Quanti infortuni sono stati denunciati nei primi sei mesi del 2026? Il confronto con il 2025, la crescita dell'itinere e il calo dei casi mortali.",
    tags: ["Infortuni", "Morti sul lavoro", "Dati INAIL"],
  },
];

export default function ReportIndexPage() {
  return (
    <main className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-5)", paddingBottom: "var(--space-8)" }}>
      <header style={{ borderLeft: "4px solid var(--color-accent)", paddingLeft: "var(--space-4)", maxWidth: "78ch" }}>
        <p className="eyebrow" style={{ margin: 0 }}>REPORT · DATI E CONTESTO</p>
        <h1 style={{ margin: "var(--space-2) 0 var(--space-2)" }}>Report</h1>
        <p className="lead" style={{ margin: 0 }}>
          Report brevi per chi vuole i numeri senza navigare l&apos;intera app. Ogni report parte da una domanda frequente, risponde con i dati aggiornati e incrocia le fonti dell&apos;Osservatorio: infortuni, malattie professionali, vigilanza, cause e casi mortali. Lettura in cinque minuti, ogni numero con la sua fonte.
        </p>
      </header>

      <section aria-labelledby="report-disponibili">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <Newspaper aria-hidden="true" size={22} strokeWidth={1.8} />
          <h2 id="report-disponibili" style={{ margin: 0, fontSize: "1.45rem" }}>Report disponibili</h2>
        </div>
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {REPORT.map((report) => (
            <article key={report.href} className="card" style={{ display: "grid", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "var(--space-2)", alignItems: "center" }}>
                <span className="eyebrow" style={{ margin: 0 }}>Report · {report.date}</span>
                <time dateTime="2026-09-16" style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>{report.date}</time>
              </div>
              <h2 style={{ margin: 0, fontSize: "clamp(1.45rem, 4vw, 2rem)", maxWidth: "28ch" }}>
                <Link href={report.href} style={{ color: "var(--color-text)", textDecoration: "none" }}>{report.title}</Link>
              </h2>
              <p style={{ margin: 0, color: "var(--color-text-soft)", maxWidth: "72ch", lineHeight: 1.6 }}>{report.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }} aria-label="Argomenti del report">
                {report.tags.map((tag) => <span key={tag} className="btn-pill" style={{ cursor: "default", fontSize: "0.76rem", minHeight: 30 }}>{tag}</span>)}
                <Link href={report.href} className="btn-pill" style={{ marginLeft: "auto", textDecoration: "none" }}>
                  Leggi il report <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
