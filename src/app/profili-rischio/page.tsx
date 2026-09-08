import type { Metadata } from "next";
import { ProfiliRischio } from "@/components/profili-rischio";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Profili di rischio per settore",
  description: "Esplora gli infortuni sul lavoro per settore e codice ATECO, con ricerca testuale e confronto anno su anno.",
  alternates: { canonical: "/profili-rischio" },
};

export default function ProfiliRischioPage() {
  return <main className="container" style={{ paddingTop: "var(--space-5)", display: "grid", gap: "var(--space-5)" }}>
    <header style={{ borderLeft: "4px solid var(--color-link)", paddingLeft: "var(--space-4)" }}>
      <p className="eyebrow">Esploratore settoriale</p>
      <h1 style={{ margin: 0 }}>Profili di rischio per settore</h1>
      <p className="lead" style={{ maxWidth: "70ch" }}>Cerca un comparto per nome o codice ATECO. Il profilo parte dal dato osservato e mantiene visibile il limite di granularità della fonte.</p>
    </header>
    <section className="card" aria-label="Ricerca dei profili di rischio"><ProfiliRischio /></section>
  </main>;
}
