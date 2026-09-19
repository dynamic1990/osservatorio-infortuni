import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Infortuni sul lavoro 2026: i dati INAIL aggiornati (I semestre)",
  description:
    "Quanti infortuni sul lavoro nel 2026? 253.329 denunce nel primo semestre, +5,62% sul 2025, e 429 casi mortali. Dati INAIL per regione, settore, genere ed età, con fonte e metodo.",
  alternates: { canonical: "/report/infortuni-1-semestre-2026" },
};

const faq = [
  { question: "Quanti infortuni sul lavoro ci sono stati in Italia nel primo semestre 2026?", answer: "253.329 denunce all'INAIL, dato provvisorio, +5,62% rispetto al primo semestre 2025." },
  { question: "Quanti sono i morti sul lavoro nel 2026?", answer: "429 denunce con esito mortale nel primo semestre, 4 in meno rispetto al 2025." },
  { question: "Quali sono i settori più colpiti dagli infortuni?", answer: "Nel 2024: manifattura per numero di denunce, costruzioni per morti sul lavoro (220), davanti a trasporti (173) e manifattura (176)." },
  { question: "Quali regioni registrano più infortuni?", answer: "Nel primo semestre 2026: Lombardia, Veneto, Toscana, Piemonte e Lazio. Crescite più forti in Sicilia e Lazio." },
  { question: "Che differenza c'è tra occasione di lavoro e itinere?", answer: "L'occasione di lavoro è l'attività lavorativa in sé. L'itinere è il percorso tra casa e lavoro, o gli spostamenti connessi nei limiti previsti. Nel 2026 H1: 211.332 in occasione, 41.997 in itinere." },
  { question: "Perché i numeri possono cambiare?", answer: "I dati sono provvisori: le denunce vengono integrate e riclassificate nel tempo. I definitivi arrivano con le successive pubblicazioni INAIL." },
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

export default function ReportArticlePage() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-10)" }}>
      <article style={{ maxWidth: "76ch", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
        <header style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxWidth: "62ch" }}>
              <p className="eyebrow" style={{ margin: 0 }}>REPORT · INFORTUNI</p>
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Infortuni sul lavoro, primo semestre 2026: più denunce, meno casi mortali</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}><strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-09-16">16 settembre 2026</time>. Fonte: INAIL, dati congiunturali provvisori.</p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">Dati INAIL congiunturali provvisori (denunce di infortunio) per il confronto semestrale gennaio-giugno 2026 vs 2025. I dati di dettaglio su genere, età, settori, gravità e durata si riferiscono all&apos;ultimo anno consolidato disponibile, il 2024.</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Confronto a pari perimetro:</strong> totale denunce, itinere, esiti mortali, regioni e incidenza sono confrontati a pari perimetro gennaio-giugno 2026 vs 2025, su dati provvisori.</li>
                  <li><strong>Occasione di lavoro / itinere:</strong> l&apos;occasione di lavoro è l&apos;attività lavorativa in sé; l&apos;itinere è il percorso casa-lavoro e gli spostamenti connessi nei limiti previsti.</li>
                  <li><strong>Denunce vs infortuni riconosciuti:</strong> le denunce non coincidono con gli infortuni riconosciuti: il dato statistico è quello delle denunce con esito mortale, riportato in forma divulgativa come &quot;morti sul lavoro&quot;.</li>
                  <li><strong>Carattere provvisorio:</strong> i numeri sono provvisori e vengono integrati e riclassificati nel tempo: i definitivi arrivano con le successive pubblicazioni INAIL.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">La disaggregazione per genere, età, settore, gravità e durata si riferisce al 2024, perché è l&apos;ultimo anno consolidato; il confronto semestrale usa i dati provvisori 2026. I dettagli e il metodo completo sono consultabili nella sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Quanti infortuni sul lavoro in Italia nel 2026?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>Nel primo semestre 2026 sono state denunciate all&apos;INAIL <strong>253.329 infortuni sul lavoro</strong>, contro le 239.856 dello stesso periodo del 2025: 13.473 in più, <strong>+5,62%</strong>. Dati provvisori, riferiti alle denunce e non agli infortuni riconosciuti.</p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}><strong>Quanti morti sul lavoro?</strong> Le denunce con esito mortale sono <strong>429</strong>, contro 433 del primo semestre 2025: 4 in meno, <strong>-0,92%</strong>. Il calo riguarda i casi in occasione di lavoro (311, -2,2%), mentre quelli in itinere salgono (118, +2,61%).</p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>253.329 denunce totali (+5,62%)</li><li>211.332 in occasione di lavoro (+5,16%)</li><li>41.997 in itinere (+7,97%)</li><li>429 denunce con esito mortale (-0,92%)</li><li>Incidenza semestrale: 10,36 → 10,94 per 1.000 occupati</li>
          </ul>
        </section>

        <Section title="Il quadro territoriale">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Lombardia, Veneto, Toscana, Piemonte e Lazio sono le regioni con più denunce nel primo semestre 2026: la Lombardia da sola supera le 60.500. La crescita più marcata è della Sicilia (+10,4%), seguita da Lazio (+8,2%) e Lombardia (+6,9%). Nessuna regione è in calo rispetto al 2025; le crescite più contenute sono Marche (+1,1%) e Veneto (+3,0%). L&apos;incidenza più alta si registra in Veneto (17,3 per 1.000 occupati), davanti a Toscana (15,1) e Lombardia (13,7).</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", margin: 0 }}>Confronto a pari perimetro, gennaio-giugno 2026 vs 2025. Per approfondire le letture territoriali e il metodo, consulta la sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
        </Section>

        <Section title="Genere ed età (dettaglio su ultimo anno consolidato, 2024)">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Gli uomini concentrano circa i due terzi delle denunce (64,2%), le donne il 35,8%. Per età, le fasce più colpite sono quelle centrali: 45-54 anni (22%), 55-64 (18,3%), 25-34 (17,4%) e 35-44 (16,9%). Insieme, i lavoratori tra 45 e 64 anni superano il 40% del totale.</p>
        </Section>

        <Section title="I settori più colpiti dagli infortuni (dettaglio 2024)">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Le attività manifatturiere guidano per numero di denunce (quasi 90.000), seguite da sanità e assistenza sociale (50.281), commercio (46.695), trasporti e magazzinaggio (45.001) e costruzioni (44.755). Sul fronte degli esiti mortali la gerarchia cambia: <strong>le costruzioni sono il settore con più morti sul lavoro (220 nel 2024)</strong>, davanti a manifattura (176) e trasporti (173). In termini di singole attività, spiccano assistenza sanitaria, lavori di costruzione specializzati e commercio al dettaglio.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Le dinamiche delle cause sono approfondite in <Link href="/analisi-delle-cause">Analisi delle cause</Link>; per il quadro dell&apos;azione preventiva si può consultare anche la pagina <Link href="/vigilanza">Vigilanza</Link>.</p>
        </Section>

        <Section title="Gravità del danno e inabilità (dettaglio 2024)">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Nell&apos;88,4% delle denunce non risultano postumi permanenti. Dove il danno è riconosciuto: franchigia nel 6,4% dei casi, capitale nel 4,3%, rendita nell&apos;1,0%. La durata media dell&apos;inabilità temporanea è di <strong>36 giorni</strong>, con circa 69.000 casi con menomazione e un indice di gravità complessivo di 492,7.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Il tema si inserisce nel quadro più ampio delle <Link href="/malattie-professionali">malattie professionali</Link>, che hanno tempi e criteri di lettura differenti.</p>
        </Section>

        <section aria-labelledby="faq" style={{ display: "grid", gap: "var(--space-4)" }}>
          <h2 id="faq" style={{ margin: 0 }}>FAQ</h2>
          {faq.map(({ question, answer }) => <details key={question} style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}><summary style={{ cursor: "pointer", fontWeight: 700, lineHeight: 1.4 }}>{question}</summary><p style={{ margin: "var(--space-2) 0 0", lineHeight: 1.6, color: "var(--color-text-soft)" }}>{answer}</p></details>)}
        </section>

        <p className="source-note">Fonte: INAIL, dati congiunturali provvisori. Ultimo aggiornamento: 16 settembre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}
