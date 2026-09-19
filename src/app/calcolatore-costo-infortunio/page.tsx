import type { Metadata } from "next";
import { CalcolatoreCosto } from "@/components/calcolatore-costo";
import { InfoModalButton } from "@/components/ui/info-modal";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Calcolatore del costo di un infortunio per l'azienda",
  description: "Stima orientativa dei costi di un infortunio sul lavoro con metodologia e parametri ufficiali INAIL (Il costo dei danni da lavoro per l'azienda Italia, 2026), componenti di costo attivabili e precompilazione dai dati INAIL per settore e regione.",
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
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
      <div style={{ borderLeft: "4px solid var(--color-accent)", paddingLeft: "var(--space-4)", maxWidth: "72ch" }}>
        <p className="eyebrow">Strumento per HSE e direzione</p>
        <h1 style={{ margin: 0 }}>Quanto costa un infortunio all&apos;azienda?</h1>
        <p className="lead" style={{ margin: 0 }}>Una stima trasparente del costo della non sicurezza, costruita sulla metodologia e sui parametri ufficiali INAIL. Seleziona settore e regione per precompilare i valori, oppure inserisci i dati del tuo evento, e confronta tre scenari.</p>
      </div>
      <InfoModalButton>
        <section className="modal-section">
          <h3 className="modal-section-title">1. La metodologia INAIL di riferimento</h3>
          <p className="modal-text">
            La stima riprende la metodologia della Consulenza statistico attuariale INAIL (pubblicazione <em>Il costo dei danni da lavoro per l&apos;azienda Italia</em>, 2026, dati 2023), che articola il costo di un evento lesivo in tre componenti: <strong>costo assicurativo</strong> (premi e prestazioni), <strong>costo prevenzionale</strong> (sicurezza, formazione, dispositivi) e <strong>costo conseguente non assicurativo</strong>, la parte che resta a carico di azienda e vittima: retribuzione durante l&apos;assenza, perdita di produttività, sostituzione del lavoratore, danni materiali, gestione amministrativa e legale, danno di immagine.
          </p>
          <p className="modal-text">
            Il calcolatore adatta a livello aziendale la componente <em>conseguente non assicurativa</em>, quella più vicina ai costi realmente sostenuti da un&apos;impresa, e usa i parametri nazionali INAIL come benchmark di confronto.
          </p>
        </section>
        <section className="modal-section">
          <h3 className="modal-section-title">2. Come si calcola (componenti e formule)</h3>
          <ul className="modal-list">
            <li><strong>Assenza:</strong> infortunati × giorni × costo giornaliero × quota a carico azienda. I giorni sono precompilati con la durata media INAIL del settore ATECO o della regione selezionata.</li>
            <li><strong>Sostituzione:</strong> costo giornaliero del sostituto (interno, o esterno con maggiorazione) per i giorni di assenza.</li>
            <li><strong>Fermo operativo:</strong> ore di interruzione × valore operativo medio orario dell&apos;attività.</li>
            <li><strong>Gestione e sanzioni:</strong> costi amministrativi e di gestione dell&apos;evento, più eventuali sanzioni inserite (D.Lgs. 81/08).</li>
            <li><strong>Danno di immagine:</strong> bande prudenziali espresse come quota del fatturato, in base a gravità, esposizione mediatica e mercato (B2B/B2C).</li>
            <li><strong>Eventi gravi e mortali:</strong> intervalli prudenziali per risarcimento, sanzioni e difesa legale.</li>
          </ul>
          <p className="modal-text">Ogni componente può essere attivata o disattivata: la stima si adatta al caso concreto. Con tutte le componenti attive il risultato è lo scenario <strong>probabile</strong>; lo scenario <strong>minimo</strong> pesa solo i costi documentati, lo scenario <strong>grave</strong> maggiora le componenti e usa le bande massime.</p>
        </section>
        <section className="modal-section">
          <h3 className="modal-section-title">3. Parametri ufficiali INAIL 2023</h3>
          <div className="formula-box">
            <div className="formula-name">Costo medio per infortunio (eventi con prestazione INAIL)</div>
            <div className="formula-math">≈ 33.000 euro</div>
          </div>
          <div className="formula-box">
            <div className="formula-name">Costo medio per malattia professionale</div>
            <div className="formula-math">≈ 61.000 euro</div>
          </div>
          <div className="formula-box">
            <div className="formula-name">Costo complessivo nazionale 2023</div>
            <div className="formula-math">49,2 miliardi di euro, pari al 2,31% del PIL</div>
          </div>
          <p className="modal-text">Sono medie macroeconomiche sul sistema Paese: usate come benchmark di confronto, non come tariffa del singolo evento aziendale.</p>
        </section>
        <section className="modal-section">
          <h3 className="modal-section-title">4. Fonti e limiti</h3>
          <p className="modal-text">
            Fonti: INAIL, <em>Il costo dei danni da lavoro per l&apos;azienda Italia</em> (Consulenza statistico attuariale, 2026, dati 2023); dataset multidimensionale INAIL (anno 2024) per la precompilazione di durata media, casi e incidenza per settore e regione. Il calcolatore non produce una tariffa ufficiale e non determina responsabilità, sanzioni o rimborsi: ogni caso va valutato con legale, consulente del lavoro e medico legale.
          </p>
        </section>
      </InfoModalButton>
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

    <section className="card" aria-label="Come usare il calcolatore" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
      <h2 className="card-title">Come usarlo</h2>
      <ol style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: "var(--space-1)" }}>
        <li>Seleziona settore ATECO e regione (opzionali) per precompilare la durata media delle assenze dai dati INAIL, oppure lascia vuoto e inserisci i tuoi valori.</li>
        <li>Inserisci i dati dell&apos;evento: infortunati, giorni di assenza, costo giornaliero e quota a carico dell&apos;azienda.</li>
        <li>Attiva solo le componenti di costo che riguardano il tuo caso: la stima si adatta.</li>
        <li>Leggi i tre scenari (minimo, probabile, grave) e confronta il costo medio per infortunio con i parametri ufficiali INAIL.</li>
      </ol>
    </section>

    <section className="card" aria-label="Calcolatore del costo dell'infortunio"><CalcolatoreCosto /></section>

    <section className="card" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
      <h2 className="card-title">Come leggere il risultato</h2>
      <p>Il calcolatore non produce una tariffa ufficiale: serve a rendere visibili le componenti di costo che spesso restano disperse. I valori precompilati dai dati INAIL restano modificabili, perché CCNL, ruolo e mansione incidono sul costo effettivo. Danno di immagine ed eventi gravi usano bande prudenziali dichiarate: ogni caso va valutato con legale e consulente del lavoro.</p>
    </section>

    <p className="source-note">Metodologia ispirata a INAIL, <em>Il costo dei danni da lavoro per l&apos;azienda Italia</em> (Consulenza statistico attuariale, 2026, dati 2023); precompilazione dal dataset INAIL 2024; bande prudenziali per danno di immagine ed eventi gravi. Nessun valore preimpostato rappresenta un dato dovuto; gli importi sanzionatori vanno verificati sulla fonte ufficiale (D.Lgs. 81/08 e aggiornamenti).</p>
  </main>;
}