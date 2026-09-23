import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Relazione annuale INAIL 2025: 1.198 morti sul lavoro e 98.312 malattie professionali",
  description:
    "Presentata alla Camera la Relazione annuale INAIL 2025: calano i decessi (-3,3%, 1.198 vittime), salgono denunce di infortunio (+1,2%) e malattie professionali (+11,3%, record 26 anni). Dati, settori a rischio e PDF ufficiale.",
  alternates: { canonical: "/report/relazione-annuale-inail-2025" },
};

const faq = [
  { question: "Quanti morti sul lavoro in Italia nel 2025?", answer: "1.198 denunce con esito mortale: 1.189 lavoratori e 9 studenti. È un calo del 3,3% rispetto alle 1.239 del 2024, ma resta una media di circa 3 vittime al giorno." },
  { question: "Quante denunce di infortunio sono state registrate nel 2025?", answer: "600.000 denunce complessive, +1,2% rispetto al 2024: 519.334 di lavoratori (+0,8%) e 81.000 di studenti (+3,4%). Di queste, 104.417 riguardano infortuni in itinere, il tragitto casa-lavoro." },
  { question: "Quante sono le malattie professionali denunciate nel 2025?", answer: "98.312 denunce, +11,3% rispetto alle 88.338 del 2024: il valore più alto degli ultimi 26 anni. La crescita è interpretata come emersione del sommerso, non come peggioramento generalizzato delle condizioni di lavoro." },
  { question: "Quali sono i settori con più morti sul lavoro?", answer: "Costruzioni (175 decessi), manifatturiero (129) e trasporto e magazzinaggio (126) concentrano oltre il 60% dei decessi in occasione di lavoro della gestione Industria e servizi." },
  { question: "Che cosa sono gli infortuni in itinere e come sono cambiati?", answer: "Sono gli infortuni nel tragitto tra casa e luogo di lavoro. Nel 2025 le denunce sono 104.417, +2,4%, sopra i livelli pre-pandemia del 2019 (103.492)." },
  { question: "Dove posso scaricare la Relazione annuale INAIL 2025 in PDF?", answer: "Sul sito ufficiale INAIL sono disponibili la Relazione completa (PDF, 1,8 MB), il volume dei Grafici e la Sintesi dell'andamento infortunistico e tecnopatico, con download gratuito. I link sono nella sezione dedicata di questo report." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ display: "grid", gap: "var(--space-2)" }}><h2 style={{ margin: 0 }}>{title}</h2>{children}</section>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
      {children}
    </a>
  );
}

export default function ReportRelazioneAnnualePage() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-10)" }}>
      <article style={{ maxWidth: "76ch", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
        <header style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxWidth: "62ch" }}>
              <p className="eyebrow" style={{ margin: 0 }}>REPORT · RELAZIONE ANNUALE INAIL</p>
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Relazione annuale INAIL 2025: meno morti sul lavoro, boom di malattie professionali</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}><strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-09-23">23 settembre 2026</time>. Fonte: Relazione annuale INAIL 2025, presentata alla Camera dei deputati il 22 settembre 2026.</p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">Dati della Relazione annuale INAIL 2025, illustrata il 22 settembre 2026 nell&apos;Aula dei Gruppi parlamentari della Camera dei deputati dal presidente Fabrizio D&apos;Ascenzo. I confronti internazionali usano i dati Eurostat 2023, gli ultimi disponibili per le statistiche armonizzate sugli infortuni sul lavoro.</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Denunce vs infortuni riconosciuti:</strong> i numeri riferiti sono denunce protocollate dall&apos;INAIL, non infortuni riconosciuti. Il dato statistico delle denunce con esito mortale è riportato in forma divulgativa come &quot;morti sul lavoro&quot;.</li>
                  <li><strong>Occasione di lavoro / itinere:</strong> l&apos;occasione di lavoro è l&apos;attività lavorativa in sé e gli eventi che la caratterizzano; l&apos;itinere è il percorso casa-lavoro e gli spostamenti connessi nei limiti previsti.</li>
                  <li><strong>Confronto europeo:</strong> i tassi Eurostat 2023 si riferiscono ai soli casi indennizzati in occasione di lavoro, escludendo gli infortuni in itinere, non rilevati da tutti gli Stati membri.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">La crescita delle denunce di malattie professionali riflette anche l&apos;emersione di casi prima sommersi, l&apos;azione di patronati e medici certificatori e l&apos;ampliamento delle patologie riconoscibili: non va letta solo come peggioramento delle condizioni di lavoro. Solo Italia, Spagna e Slovenia hanno riconosciuto i contagi da Covid-19 come infortuni sul lavoro, influenzando i dati nazionali del biennio 2020-2021.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Quanti morti sul lavoro in Italia nel 2025?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>Nel 2025 le denunce di infortunio con esito mortale sono state <strong>1.198</strong>, in calo del 3,3% rispetto alle 1.239 del 2024: 1.189 lavoratori e 9 studenti. Resta però una media di circa <strong>3 vittime al giorno</strong>.</p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}><strong>Quante denunce?</strong> Le denunce complessive di infortunio sono <strong>600.000</strong>, +1,2% sul 2024. Il dato più eclatante è quello delle <strong>malattie professionali: 98.312 denunce</strong>, +11,3%, il picco più alto degli ultimi 26 anni.</p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>1.198 denunce con esito mortale (-3,3% rispetto al 2024)</li>
            <li>600.000 denunce di infortunio complessive (+1,2%)</li>
            <li>104.417 infortuni in itinere (+2,4%), sopra i livelli 2019</li>
            <li>98.312 denunce di malattie professionali (+11,3%), record degli ultimi 26 anni</li>
            <li>Costruzioni (175), manifatturiero (129) e trasporti (126) i settori con più decessi</li>
          </ul>
        </section>

        <Section title="Infortuni 2025: più denunce, meno decessi">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Nel corso del 2025 le denunce di infortunio protocollate dall&apos;INAIL sono state 600.000, l&apos;1,2% in più rispetto al 2024. La quota principale riguarda i lavoratori: 519.334 denunce, +0,8%, di cui circa 415.000 in occasione di lavoro e 104.417 in itinere. Le restanti 81.000 denunce riguardano gli studenti, +3,4%, in crescita anche grazie all&apos;estensione strutturale della tutela al mondo della scuola introdotta dal decreto-legge 90/2025.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Sul fronte degli esiti mortali il totale si attesta a 1.198 vittime: 1.189 lavoratori, -3,02% rispetto alle 1.226 del 2024, e 9 studenti, contro i 13 dell&apos;anno precedente. I decessi avvenuti in occasione di lavoro calano del 4,1%, mentre le denunce relative al tragitto casa-lavoro aumentano.</p>
        </Section>

        <Section title="Malattie professionali: il picco degli ultimi 26 anni">
          <p style={{ margin: 0, lineHeight: 1.7 }}>È il dato statisticamente più rilevante del report. Le denunce di malattie professionali hanno raggiunto quota 98.312, con un incremento dell&apos;11,3% rispetto alle 88.338 del 2024 e oltre il +60% rispetto al 2019: il valore più alto degli ultimi 26 anni, che quadruplica i numeri del 2000.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Come sottolineato dal presidente D&apos;Ascenzo, questa crescita non riflette necessariamente un peggioramento delle condizioni di lavoro, ma un&apos;efficace emersione del sommerso: più informazione e consapevolezza dei lavoratori, azione dei patronati, diagnosi più puntuali dei medici certificatori e ampliamento delle patologie riconoscibili.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Circa tre denunce su quattro (70.000) riguardano patologie muscolo-scheletriche da sovraccarico biomeccanico, seguite da malattie del sistema nervoso, come la sindrome del tunnel carpale, e disturbi dell&apos;udito. I tumori professionali, circa 2.400 denunce, restano numericamente inferiori ma rappresentano la prima causa di morte tra i tecnopatici e nella maggior parte dei casi sono collegati all&apos;amianto. Per il quadro completo si veda la pagina dedicata alle <Link href="/malattie-professionali">malattie professionali</Link>.</p>
        </Section>

        <Section title="Gli infortuni in itinere superano i livelli 2019">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Mentre i decessi in occasione di lavoro calano del 4,1%, le denunce per infortuni in itinere aumentano del 2,4%, arrivando a 104.417 casi: un valore superiore ai 103.492 registrati nel 2019, prima della pandemia. Il tragitto casa-lavoro si conferma la componente più difficile da presidiare, perché dipende solo in parte dalle condizioni del luogo di lavoro. Le donne rappresentano quasi la metà delle denunce in itinere (48,2%) e il 18,1% dei decessi in questo ambito.</p>
        </Section>

        <Section title="Settori, età, genere e lavoratori stranieri">
          <p style={{ margin: 0, lineHeight: 1.7 }}>I settori più esposti sono sempre gli stessi. L&apos;89,7% delle denunce in occasione di lavoro riguarda la gestione Industria e servizi, il 5,8% l&apos;Agricoltura e il 4,5% il conto Stato. Oltre il 60% dei decessi in occasione di lavoro della gestione Industria e servizi si concentra in tre ambiti:</p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-1)", lineHeight: 1.6 }}>
            <li><strong>Costruzioni:</strong> 175 morti</li>
            <li><strong>Manifatturiero:</strong> 129 morti</li>
            <li><strong>Trasporto e magazzinaggio:</strong> 126 morti</li>
          </ul>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Sull&apos;anagrafica dei decessi pesano età e genere: oltre la metà delle vittime in occasione di lavoro ha tra i 50 e i 64 anni (54,3%) e due vittime su tre hanno più di 50 anni. Gli uomini rappresentano il 93,9% dei decessi in occasione di lavoro; le donne pesano per il 32,1% delle denunce complessive. I dettagli sui singoli comparti e sui casi mortali sono nella pagina <Link href="/casi-mortali">Casi mortali</Link>.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Cresce infine la quota dei lavoratori stranieri: dal 19,4% del 2021 al 24,3% del 2025. Nel 2025 un infortunio in occasione di lavoro su quattro ha coinvolto persone nate all&apos;estero, con denunce in aumento del 3,7% contro il -0,5% degli italiani. Anche sui casi mortali il trend è simile: calano i decessi dei lavoratori italiani (-5,8%, 42 in meno), salgono quelli degli stranieri da 200 a 204, pari al 22,9% del totale, contro il 15,0% del 2021.</p>
        </Section>

        <Section title="Il confronto con l'Europa (dati Eurostat 2023)">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Con i dati Eurostat 2023, gli ultimi disponibili per i confronti internazionali, l&apos;Italia registra un tasso di infortuni mortali di 1,20 decessi per 100.000 occupati, in linea con la media UE-27 (1,23) e con la Spagna (1,18), nettamente inferiore alla Francia (3,50) ma superiore alla Germania (0,53). Per gli infortuni non mortali l&apos;Italia è a 991 casi ogni 100.000 occupati, sotto la media europea di 1.300 e lontana da Spagna (2.391), Francia (2.351) e Germania (1.418).</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Va ricordato che il sistema assicurativo italiano tutela il lavoratore anche nel percorso casa-lavoro, a differenza di altri Paesi, e che solo Italia, Spagna e Slovenia hanno riconosciuto i contagi da Covid-19 come infortuni sul lavoro, influenzando i dati nazionali soprattutto nel biennio 2020-2021.</p>
        </Section>

        <Section title="Le novità del 2025: decreto 159, premialità e prevenzione">
          <p style={{ margin: 0, lineHeight: 1.7 }}>La Relazione annuale fa il punto sulle novità normative. Il decreto-legge 159/2025, convertito dalla legge 198/2025, è descritto come l&apos;intervento di più ampia portata dopo il D.Lgs. 81/2008: nuove funzioni per l&apos;INAIL, revisione delle aliquote per premiare le aziende virtuose, incentivi ai dispositivi di protezione individuale intelligenti, rafforzamento della formazione nei settori a maggior rischio, linee guida per il tracciamento dei near miss e consultazione gratuita delle norme tecniche.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Sul fronte della premialità, 30.841 aziende hanno ricevuto sconti per la prevenzione per oltre 211 milioni di euro, mentre la riduzione del 5,07% per le ditte artigiane senza infortuni nel biennio 2023-2024 ha coinvolto circa 459.000 imprese per 27 milioni di euro. In agricoltura la revisione dei contributi ha introdotto dal 1° gennaio 2026 una riduzione strutturale del 35,8% per i dipendenti e del 15,4% per gli autonomi. Per la prevenzione, il bando ISI 2025 conferma 600 milioni di euro a fondo perduto, affiancati da 50 milioni per la formazione aggiuntiva.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Sul piano economico, premi e contributi ammontano a 10,38 miliardi di euro, +6% rispetto al 2024, mentre le prestazioni economiche erogate a infortunati e tecnopatici superano i 5,61 miliardi (+1,70%), di cui oltre 4,91 miliardi destinati alle rendite e 684 milioni alle prestazioni temporanee. Il bilancio 2025 conferma la solidità della situazione finanziaria e patrimoniale dell&apos;Istituto.</p>
        </Section>

        <Section title="Scarica la Relazione annuale INAIL 2025 in PDF">
          <p style={{ margin: 0, lineHeight: 1.7 }}>I documenti ufficiali sono disponibili gratuitamente sul sito INAIL (Casellario Centrale Infortuni). Il PDF non è copiato sul nostro sito: i download puntano direttamente alle fonti ufficiali dell&apos;Istituto.</p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.6 }}>
            <li><strong>Relazione annuale INAIL 2025</strong> (PDF, 1,8 MB): <ExternalLink href="https://casellario.inail.it/content/dam/casellario/documenti/2026/09/Relazione%20annuale%20Inail%202025.pdf">scarica il file</ExternalLink></li>
            <li><strong>Grafici della Relazione</strong> (PDF, 310 KB): <ExternalLink href="https://casellario.inail.it/content/dam/casellario/documenti/2026/09/Grafici.pdf">scarica i grafici</ExternalLink></li>
            <li><strong>Sintesi dell&apos;andamento infortunistico e tecnopatico</strong> (PDF, 149 KB): <ExternalLink href="https://casellario.inail.it/content/dam/casellario/documenti/2026/09/Sintesi%20dell%20andamento%20infortunistico%20e%20tecnopatico.pdf">scarica la sintesi</ExternalLink></li>
            <li>Pagina ufficiale della notizia: <ExternalLink href="https://casellario.inail.it/portale/it/comunicazione/news-ed-eventi/dettaglio-news-ed-eventi.content-fragment.it.news.2026.09.relazione-annuale-inail-2025.html">Relazione annuale Inail 2025 presentata alla Camera</ExternalLink></li>
          </ul>
        </Section>

        <section aria-labelledby="faq" style={{ display: "grid", gap: "var(--space-4)" }}>
          <h2 id="faq" style={{ margin: 0 }}>FAQ</h2>
          {faq.map(({ question, answer }) => <details key={question} style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}><summary style={{ cursor: "pointer", fontWeight: 700, lineHeight: 1.4 }}>{question}</summary><p style={{ margin: "var(--space-2) 0 0", lineHeight: 1.6, color: "var(--color-text-soft)" }}>{answer}</p></details>)}
        </section>

        <p className="source-note">Fonte: Relazione annuale INAIL 2025, presentata alla Camera dei deputati il 22 settembre 2026; dati Eurostat 2023 per i confronti internazionali. Ultimo aggiornamento: 23 settembre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}