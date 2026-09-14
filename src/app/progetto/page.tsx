import type { Metadata } from "next";
import { LinkedInIcon } from "@/components/ui/social-icons";

export const metadata: Metadata = {
  title: "Il progetto",
  description:
    "Metodologia, architettura, fonti e limiti dell'Osservatorio Infortuni sul Lavoro.",
  alternates: { canonical: "/progetto" },
};

const sections = [
  {
    title: "Un progetto di lettura dei dati",
    body: "Osservatorio Infortuni raccoglie e rende leggibili dati pubblici sugli infortuni sul lavoro in Italia. Non sostituisce INAIL, Eurostat, ISTAT o INL: collega le fonti, esplicita il perimetro delle misure e riduce il lavoro necessario per passare dal dato alla sua interpretazione.",
  },
  {
    title: "Come arrivano i numeri sul sito",
    body: "Le fonti ufficiali vengono acquisite da endpoint o pubblicazioni pubbliche, trasformate con script riproducibili e salvate in snapshot verificati. Il sito legge gli snapshot, non interroga le API in tempo reale mentre una persona naviga. In questo modo una pagina resta stabile anche quando una fonte è temporaneamente indisponibile.",
  },
  {
    title: "Che cosa significa aggiornato",
    body: "Aggiornato non significa in tempo reale. Ogni fonte ha una propria cadenza e una propria definizione: mensile, semestrale o annuale. La data di riferimento e i limiti sono riportati nelle pagine e nel registro delle fonti. Un nuovo file non viene pubblicato automaticamente: prima controlliamo definizioni, copertura e compatibilità con la serie esistente.",
  },
  {
    title: "Il Radar degli infortuni sul lavoro",
    body: "Il Radar è una rassegna quotidiana costruita da Google News RSS. Un filtro interno valuta la pertinenza al lavoro e penalizza, tra gli altri casi, gli articoli sportivi e gli incidenti non professionali. È uno strumento editoriale per orientarsi nella cronaca, non un archivio statistico e non sostituisce i dati INAIL.",
  },
  {
    title: "Un controllo mensile, senza import automatici",
    body: "Il 15 di ogni mese un audit separato dal Radar controlla gli endpoint delle fonti ufficiali e confronta la loro impronta con la baseline precedente. Se rileva una variazione, invia una segnalazione. Non modifica dataset e non integra nuove annualità senza una decisione e una verifica manuale.",
  },
];

export default function ProgettoPage() {
  return (
    <main className="container" style={{ display: "grid", gap: "var(--space-5)", paddingTop: "var(--space-4)" }}>
      <header className="card" style={{ borderTop: "4px solid var(--color-accent)" }}>
        <p className="eyebrow" style={{ margin: 0 }}>METODO · DATI · TRASPARENZA</p>
        <h1 style={{ margin: "var(--space-2) 0 var(--space-2)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.03em" }}>
          Il progetto
        </h1>
        <p style={{ margin: 0, maxWidth: "72ch", color: "var(--color-text-soft)", fontSize: "1.05rem", lineHeight: 1.6 }}>
          Un osservatorio indipendente per leggere gli infortuni sul lavoro con numeri verificabili,
          fonti visibili e limiti dichiarati.
        </p>
      </header>

      {sections.map((section, index) => (
        <section className="card" key={section.title}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-3)", alignItems: "start" }}>
            <span aria-hidden="true" style={{ color: "var(--color-accent)", fontWeight: 800, fontSize: "0.82rem", paddingTop: 3 }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="card-title" style={{ marginTop: 0 }}>{section.title}</h2>
              <p style={{ margin: 0, maxWidth: "75ch", color: "var(--color-text-soft)", lineHeight: 1.65 }}>{section.body}</p>
            </div>
          </div>
        </section>
      ))}

      <section className="card" style={{ background: "var(--color-surface-2)" }}>
        <h2 className="card-title" style={{ marginTop: 0 }}>Chi cura il progetto</h2>
        <p style={{ margin: 0, color: "var(--color-text-soft)", lineHeight: 1.65 }}>
          Sono Damiano Salvati, ingegnere della sicurezza, RSPP e lead auditor dei sistemi di gestione.
          Mi occupo di salute e sicurezza sul lavoro, analisi dei dati e progettazione di strumenti che
          rendano le informazioni pubbliche più leggibili e verificabili.
        </p>
        <a
          href="https://www.linkedin.com/in/damiano-salvati"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5em", marginTop: "var(--space-3)", color: "var(--color-link)", textDecoration: "none", fontWeight: 600 }}
        >
          <LinkedInIcon size={22} />
          Per domande o collaborazioni, scrivimi su LinkedIn ↗
        </a>
      </section>

      <section className="card" style={{ background: "var(--color-surface-2)" }}>
        <h2 className="card-title" style={{ marginTop: 0 }}>Documentazione per chi vuole verificare</h2>
        <p style={{ color: "var(--color-text-soft)", lineHeight: 1.6 }}>
          Il repository contiene il codice, gli script ETL, i contratti dei dati e la documentazione
          delle scelte metodologiche. Le istruzioni per eseguire il progetto e il controllo leggero
          delle fonti sono nel README.
        </p>
        <a href="https://github.com/dynamic1990/osservatorio-infortuni" target="_blank" rel="noreferrer">
          Apri il repository open source ↗
        </a>
      </section>

    </main>
  );
}
