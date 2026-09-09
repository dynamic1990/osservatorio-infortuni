import type { Metadata } from "next";
import { CalcolatoreCosto } from "@/components/calcolatore-costo";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Calcolatore del costo di un infortunio per l'azienda",
  description: "Stima orientativa dei costi diretti, operativi, reputazionali e degli eventi gravi di un infortunio sul lavoro, con precompilazione dai dati INAIL per settore e regione.",
  alternates: { canonical: "/calcolatore-costo-infortunio" },
};

export default function CalcolatorePage() {
  return <main className="container" style={{ paddingTop: "var(--space-5)", display: "grid", gap: "var(--space-5)" }}>
    <header style={{ borderLeft: "4px solid var(--color-accent)", paddingLeft: "var(--space-4)" }}>
      <p className="eyebrow">Strumento per HSE e direzione</p>
      <h1 style={{ margin: 0 }}>Quanto costa un infortunio all&apos;azienda?</h1>
      <p className="lead" style={{ maxWidth: "70ch" }}>Una stima trasparente del costo della non sicurezza: assenze, sostituzione, fermo operativo, costi di gestione, danno di immagine e costi di eventi gravi e mortali. Seleziona settore e regione per precompilare i valori con le medie INAIL, poi confronta tre scenari.</p>
    </header>
    <section className="card" aria-label="Calcolatore del costo dell'infortunio"><CalcolatoreCosto /></section>
    <section className="card" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
      <h2 className="card-title">Come leggere il risultato</h2>
      <p>Il calcolatore non produce una tariffa ufficiale e non sostituisce paghe, contabilità, consulenza legale o valutazione del rischio. Serve a rendere visibili componenti che spesso restano disperse: assenza, riorganizzazione del lavoro, sostituzione, fermo, gestione dell&apos;evento, danno di immagine e costi legali.</p>
      <p>I valori di assenza vengono precompilati con la durata media delle assenze del settore ATECO o della regione selezionata, dal dataset INAIL {new Date().getFullYear() === 2026 ? "2024" : "2024"} integrato nell&apos;Osservatorio. Restano sempre modificabili: il CCNL, il ruolo e la mansione incidono sul costo effettivo.</p>
      <p>Il danno di immagine è una stima a bande espressa come quota del fatturato: la correlazione tra eventi gravi e perdita di commesse è documentata, ma non esiste una tariffa univoca, quindi il calcolatore restituisce un intervallo prudenziale. Gli eventi gravi e mortali usano ordini di grandezza per risarcimento, sanzioni e difesa: ogni caso va valutato con legale e consulente tecnico.</p>
    </section>
    <p className="source-note">Metodologia: modello parametrico sviluppato per l&apos;Osservatorio Infortuni, con medie INAIL (dataset multidimensionale, anno 2024) per la precompilazione e bande prudenziali dichiarate per danno di immagine ed eventi gravi. Nessun valore preimpostato rappresenta un dato dovuto; gli importi sanzionatori vanno verificati sulla fonte ufficiale (D.Lgs. 81/08 e aggiornamenti).</p>
  </main>;
}
