import type { Metadata } from "next";
import { CalcolatoreCosto } from "@/components/calcolatore-costo";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Calcolatore del costo di un infortunio per l'azienda",
  description: "Stima orientativa dei costi diretti, operativi, reputazionali e degli eventi gravi di un infortunio sul lavoro, con KPI e metodologia INAIL (Il costo dei danni da lavoro per l'azienda Italia, 2026) e precompilazione dai dati INAIL per settore e regione.",
  alternates: { canonical: "/calcolatore-costo-infortunio" },
};

const KPI_INAIL_2023 = [
  { valore: "≈ 33.000 €", label: "Costo medio per infortunio sul lavoro (eventi con prestazione INAIL)" },
  { valore: "≈ 61.000 €", label: "Costo medio per malattia professionale" },
  { valore: "49,2 mld €", label: "Costo complessivo nazionale di infortuni e malattie professionali nel 2023" },
  { valore: "2,31%", label: "del PIL italiano nel 2023" },
];

export default function CalcolatorePage() {
  return <main className="container" style={{ paddingTop: "var(--space-5)", display: "grid", gap: "var(--space-5)" }}>
    <header style={{ borderLeft: "4px solid var(--color-accent)", paddingLeft: "var(--space-4)" }}>
      <p className="eyebrow">Strumento per HSE e direzione</p>
      <h1 style={{ margin: 0 }}>Quanto costa un infortunio all&apos;azienda?</h1>
      <p className="lead" style={{ maxWidth: "70ch" }}>Una stima trasparente del costo della non sicurezza: assenze, sostituzione, fermo operativo, costi di gestione, danno di immagine e costi di eventi gravi e mortali. Seleziona settore e regione per precompilare i valori con le medie INAIL, oppure inserisci i tuoi dati, poi confronta tre scenari.</p>
    </header>

    <section className="card" aria-label="KPI ufficiali INAIL">
      <h2 className="card-title">I numeri ufficiali INAIL</h2>
      <p>Dal più recente studio dell&apos;INAIL sul costo sociale ed economico di infortuni e malattie professionali in Italia (dati 2023):</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--space-3)" }}>
        {KPI_INAIL_2023.map((kpi) => (
          <div key={kpi.label} style={{ padding: "var(--space-3)", background: "var(--color-surface)", border: "1px solid var(--color-divider)" }}>
            <strong style={{ display: "block", fontSize: "1.35rem" }}>{kpi.valore}</strong>
            <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)" }}>{kpi.label}</span>
          </div>
        ))}
      </div>
      <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
        Fonte: INAIL, Consulenza statistico attuariale, <em>Il costo dei danni da lavoro per l&apos;azienda Italia</em>, 2026, dati 2023. <a href="https://www.inail.it/portale/it/inail-comunica/pubblicazioni/catalogo-generale/catalogo-generale-dettaglio.2026.09.pubbl-il-costo-dei-danni-da-lavoro-per-azienda-italia.html">Pubblicazione ufficiale</a>. Sono medie nazionali macroeconomiche: il costo di un singolo evento aziendale dipende da gravità, settore, assenze e organizzazione del lavoro.
      </p>
    </section>

    <section className="card" aria-label="Calcolatore del costo dell'infortunio"><CalcolatoreCosto /></section>

    <section className="card" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
      <h2 className="card-title">La metodologia applicata dal calcolatore</h2>
      <p>Il calcolatore adatta a livello aziendale la metodologia della Consulenza statistico attuariale INAIL, che distingue tre componenti di costo: <strong>costo assicurativo</strong>, <strong>costo prevenzionale</strong> e <strong>costo conseguente non assicurativo</strong>. Quest&apos;ultima è la componente più vicina ai costi realmente sostenuti da un&apos;impresa dopo un evento: retribuzione durante l&apos;assenza, perdita di produttività, sostituzione del lavoratore, danni materiali, gestione amministrativa e legale, danno di immagine.</p>
      <details style={{ marginTop: "var(--space-3)" }}>
        <summary style={{ fontWeight: 700, cursor: "pointer" }}>Come si calcola (passaggi e formule)</summary>
        <div style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <div><strong>1. Assenza</strong>: infortunati × giorni di assenza × costo giornaliero × quota a carico azienda. I giorni vengono precompilati con la durata media del settore ATECO o della regione selezionata.</div>
          <div><strong>2. Sostituzione</strong>: costo giornaliero del sostituto (interno o esterno, con maggiorazione per l&apos;esterno) moltiplicato per gli stessi giorni di assenza.</div>
          <div><strong>3. Fermo operativo</strong>: ore di interruzione × valore operativo medio orario dell&apos;attività.</div>
          <div><strong>4. Gestione e sanzioni</strong>: costi extra di gestione (ore interne, pratiche, consulenze) più eventuali sanzioni inserite.</div>
          <div><strong>5. Danno di immagine</strong>: bande prudenziali espresse come quota del fatturato, in base a gravità, esposizione mediatica e mercato (B2B/B2C).</div>
          <div><strong>6. Eventi gravi e mortali</strong>: intervalli prudenziali per risarcimento, sanzioni D.Lgs. 81/08 e difesa legale.</div>
          <div><strong>Scenari</strong>: minimo (solo costi documentati), probabile (tutte le componenti al valore centrale) e grave (componenti maggiorate e bande massime). Il costo medio per infortunio del risultato è confrontato con la media nazionale INAIL 2023.</div>
        </div>
      </details>
      <p>Il calcolatore non produce una tariffa ufficiale e non sostituisce paghe, contabilità, consulenza legale o valutazione del rischio. Serve a rendere visibili componenti che spesso restano disperse: assenza, riorganizzazione del lavoro, sostituzione, fermo, gestione dell&apos;evento, danno di immagine e costi legali.</p>
      <p>I valori di assenza vengono precompilati con la durata media delle assenze del settore ATECO o della regione selezionata, dal dataset INAIL {new Date().getFullYear() === 2026 ? "2024" : "2024"} integrato nell&apos;Osservatorio. Restano sempre modificabili: il CCNL, il ruolo e la mansione incidono sul costo effettivo.</p>
      <p>Il danno di immagine è una stima a bande espressa come quota del fatturato: la correlazione tra eventi gravi e perdita di commesse è documentata, ma non esiste una tariffa univoca, quindi il calcolatore restituisce un intervallo prudenziale. Gli eventi gravi e mortali usano ordini di grandezza per risarcimento, sanzioni e difesa: ogni caso va valutato con legale e consulente tecnico.</p>
    </section>

    <p className="source-note">Metodologia: modello parametrico sviluppato per l&apos;Osservatorio Infortuni, con struttura a componenti ispirata a INAIL, <em>Il costo dei danni da lavoro per l&apos;azienda Italia</em> (Consulenza statistico attuariale, 2026, dati 2023), medie INAIL (dataset multidimensionale, anno 2024) per la precompilazione e bande prudenziali dichiarate per danno di immagine ed eventi gravi. Nessun valore preimpostato rappresenta un dato dovuto; gli importi sanzionatori vanno verificati sulla fonte ufficiale (D.Lgs. 81/08 e aggiornamenti).</p>
  </main>;
}