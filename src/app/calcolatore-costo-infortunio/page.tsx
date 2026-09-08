import type { Metadata } from "next";
import { CalcolatoreCosto } from "@/components/calcolatore-costo";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Calcolatore del costo di un infortunio per l'azienda",
  description: "Stima orientativa dei costi diretti, operativi e organizzativi di un infortunio sul lavoro per l'azienda.",
  alternates: { canonical: "/calcolatore-costo-infortunio" },
};

export default function CalcolatorePage() {
  return <main className="container" style={{ paddingTop: "var(--space-5)", display: "grid", gap: "var(--space-5)" }}>
    <header style={{ borderLeft: "4px solid var(--color-accent)", paddingLeft: "var(--space-4)" }}>
      <p className="eyebrow">Strumento per HSE e direzione</p>
      <h1 style={{ margin: 0 }}>Quanto costa un infortunio all&apos;azienda?</h1>
      <p className="lead" style={{ maxWidth: "70ch" }}>Una stima trasparente del costo della non sicurezza, costruita su assenze, sostituzione, fermo operativo e costi di gestione. Inserisci i tuoi parametri e confronta tre scenari.</p>
    </header>
    <section className="card" aria-label="Calcolatore del costo dell'infortunio"><CalcolatoreCosto /></section>
    <section className="card" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
      <h2 className="card-title">Come leggere il risultato</h2>
      <p>Il calcolatore non produce una tariffa ufficiale e non sostituisce paghe, contabilità, consulenza legale o valutazione del rischio. Serve a rendere visibili componenti che spesso restano disperse: assenza, riorganizzazione del lavoro, sostituzione, fermo e gestione dell&apos;evento.</p>
      <p>Il CCNL può incidere sul costo effettivo dell&apos;assenza. In questa prima versione il trattamento economico viene rappresentato attraverso la quota a carico dell&apos;azienda, modificabile dall&apos;utente. Un archivio puntuale dei CCNL sarà valutato in una fase successiva, per evitare automatismi non verificati.</p>
    </section>
    <p className="source-note">Metodologia: modello parametrico sviluppato per l&apos;Osservatorio Infortuni. Nessun valore preimpostato rappresenta un dato ufficiale INAIL.</p>
  </main>;
}
