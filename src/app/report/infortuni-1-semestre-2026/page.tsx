import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Infortuni sul lavoro 2026: i dati INAIL aggiornati (gennaio-settembre)",
  description:
    "Quanti infortuni sul lavoro nel 2026? 457.879 denunce nei primi nove mesi, +5,05% sul 2025, e 823 casi mortali (+4,97%). Dati INAIL su tutte le 20 regioni, con fonte e metodo.",
  alternates: { canonical: "/report/infortuni-1-semestre-2026" },
};

const faq = [
  { question: "Quanti infortuni sul lavoro ci sono stati in Italia nel 2026?", answer: "457.879 denunce all'INAIL nei primi nove mesi (gennaio-settembre), dato provvisorio, +5,05% rispetto allo stesso periodo del 2025." },
  { question: "Quanti sono i morti sul lavoro nel 2026?", answer: "823 denunce con esito mortale da gennaio a settembre, 39 in più rispetto allo stesso periodo del 2025 (+4,97%)." },
  { question: "Quali sono i settori più colpiti dagli infortuni?", answer: "Nel 2024: manifattura per numero di denunce, costruzioni per morti sul lavoro (220), davanti a trasporti (173) e manifattura (176)." },
  { question: "Quali regioni registrano più infortuni?", answer: "Nei primi nove mesi del 2026: Lombardia (85.070), Emilia-Romagna (60.070), Veneto (53.873), Toscana (35.859) e Lazio (34.471). La crescita più forte è della Sicilia (+8,4%)." },
  { question: "Che differenza c'è tra occasione di lavoro e itinere?", answer: "L'occasione di lavoro è l'attività lavorativa in sé. L'itinere è il percorso tra casa e lavoro, o gli spostamenti connessi nei limiti previsti. Nel 2026, gennaio-settembre: 380.337 in occasione, 77.542 in itinere." },
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
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Infortuni sul lavoro 2026: più denunce e, da agosto, più casi mortali</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}><strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-11-11">11 novembre 2026</time>. Periodo: gennaio-settembre 2026. Fonte: INAIL, dati congiunturali provvisori, vintage 30/09/2026.</p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">Dati INAIL congiunturali provvisori (denunce di infortunio) per il confronto a pari periodo gennaio-settembre 2026 vs 2025, su tutte e 20 le regioni, lette dai CSV mensili regionali (vintage 30/09/2026). I dati di dettaglio su genere, età, settori, gravità e durata si riferiscono all&apos;ultimo anno consolidato disponibile, il 2024.</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Confronto a pari periodo:</strong> totale denunce, itinere, esiti mortali, regioni e incidenza sono confrontati sullo stesso intervallo gennaio-settembre 2026 vs 2025, su dati provvisori e su tutte e 20 le regioni.</li>
                  <li><strong>Perché si ferma a settembre:</strong> la cadenza mensile INAIL pubblica una vintage per anno di accadimento. Al 30/09/2026 la finestra è gennaio-settembre per entrambi gli anni: ottobre-dicembre 2025 non sono presenti in questa cadenza e il confronto non si estende oltre.</li>
                  <li><strong>Maturità del dato:</strong> ogni anno è letto alla propria rilevazione (2025 al 30/09/2025, 2026 al 30/09/2026), quindi il confronto è a pari ritardo dalla fine del periodo e non su dati definitivi. Gli esiti mortali risultano invece stabili tra rilevazioni.</li>
                  <li><strong>Occasione di lavoro / itinere:</strong> l&apos;occasione di lavoro è l&apos;attività lavorativa in sé; l&apos;itinere è il percorso casa-lavoro e gli spostamenti connessi nei limiti previsti.</li>
                  <li><strong>Denunce vs infortuni riconosciuti:</strong> le denunce non coincidono con gli infortuni riconosciuti: il dato statistico è quello delle denunce con esito mortale, riportato in forma divulgativa come &quot;morti sul lavoro&quot;.</li>
                  <li><strong>Carattere provvisorio:</strong> i numeri sono provvisori e vengono integrati e riclassificati nel tempo: i definitivi arrivano con le successive pubblicazioni INAIL.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">La disaggregazione per genere, età, settore, gravità e durata si riferisce al 2024, perché è l&apos;ultimo anno consolidato; il confronto a pari periodo usa i dati provvisori 2026. I dettagli e il metodo completo sono consultabili nella sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Quanti infortuni sul lavoro in Italia nel 2026?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>Nei primi nove mesi del 2026 sono state denunciate all&apos;INAIL <strong>457.879 infortuni sul lavoro</strong>, contro i 435.883 dello stesso periodo del 2025: 21.996 in più, <strong>+5,05%</strong>. Dati provvisori, riferiti alle denunce e non agli infortuni riconosciuti, su tutte e 20 le regioni.</p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}><strong>Quanti morti sul lavoro?</strong> Le denunce con esito mortale sono <strong>823</strong>, contro 784 del 2025: 39 in più, <strong>+4,97%</strong>. Il dato ribalta la lettura del primo semestre, quando i mortali erano sostanzialmente stabili (+0,53%): l&apos;aumento si concentra tra agosto e settembre, e riguarda soprattutto l&apos;itinere (228 casi, +9,09%).</p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>457.879 denunce totali (+5,05%)</li>
            <li>380.337 in occasione di lavoro (+4,78%)</li>
            <li>77.542 in itinere (+6,36%)</li>
            <li>823 denunce con esito mortale (+4,97%): 595 in occasione di lavoro, 228 in itinere</li>
            <li>Incidenza nel periodo: 18,83 → 19,78 denunce per 1.000 occupati</li>
            <li>Nel solo terzo trimestre: 137.372 denunce (+4,43%) e 250 mortali (+16,82%)</li>
          </ul>
        </section>

        <Section title="Il quadro territoriale">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Lombardia (85.070 denunce), Emilia-Romagna (60.070), Veneto (53.873), Toscana (35.859), Lazio (34.471) e Piemonte (33.500) guidano la classifica dei primi nove mesi del 2026. La crescita più marcata è della Sicilia (+8,4%), seguita da Lazio (+7,2%), Emilia-Romagna (+7,1%) e Lombardia (+6,7%). Il Trentino-Alto Adige è l&apos;unica regione in calo (-1,0%); le crescite più contenute sono Marche (+1,2%) e Veneto (+2,2%).</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Sul fronte della mortalità, Lombardia (109 → 120), Sicilia (66 → 76), Lazio (62 → 73) e Piemonte (63 → 73) registrano gli aumenti più netti, mentre la Campania scende da 72 a 69. L&apos;incidenza più alta resta in Trentino-Alto Adige (36,3 denunce per 1.000 occupati), davanti a Emilia-Romagna (30,6) e Veneto (25,0): sono territori con una forte presenza di manifattura e costruzioni, ma il dato va letto con cautela perché il denominatore è il totale degli occupati, non quello delle sole attività assicurate.</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", margin: 0 }}>Confronto a pari periodo, gennaio-settembre 2026 vs 2025, tutte le 20 regioni. Per approfondire le letture territoriali e il metodo, consulta la sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
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

        <Section title="Il terzo trimestre cambia il quadro">
          <p style={{ margin: 0, lineHeight: 1.7 }}>Luglio, agosto e settembre 2026 hanno fatto registrare <strong>137.372 denunce</strong> contro 131.547 dello stesso trimestre 2025 (+4,43%). Il dato sulle denunce non è drammatico: la crescita è in linea con il resto dell&apos;anno. Il punto è la mortalità, che nello stesso trimestre passa da <strong>214 a 250 casi (+16,82%)</strong>, il valore più alto di qualsiasi trimestre del 2025.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Il dettaglio mensile mostra che il fenomeno non è estivo: luglio è quasi piatto (91 → 94), mentre agosto (62 → 79) e settembre (61 → 77) spiegano quasi tutto l&apos;aumento. Un&apos;ipotesi da verificare, non ancora dimostrata dai dati, è che si tratti di una ripresa dell&apos;attività dopo la pausa estiva più intensa del solito, ma la cadenza mensile non contiene informazioni sulle cause: per quelle serve l&apos;analisi dei casi con scheda Infor.MO, che al momento si ferma al 2024.</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>Un secondo elemento di attenzione riguarda l&apos;itinere, che nel trimestre è sostanzialmente fermo sulle denunce (+0,06%) ma cresce del 9,09% sugli esiti mortali sull&apos;intero periodo gennaio-settembre. È un segnale coerente con il peso crescente degli spostamenti: la pagina <Link href="/report/infortunio-in-itinere">Infortunio in itinere</Link> approfondisce normativa e serie storica.</p>
        </Section>

        <section aria-labelledby="faq" style={{ display: "grid", gap: "var(--space-4)" }}>
          <h2 id="faq" style={{ margin: 0 }}>FAQ</h2>
          {faq.map(({ question, answer }) => <details key={question} style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}><summary style={{ cursor: "pointer", fontWeight: 700, lineHeight: 1.4 }}>{question}</summary><p style={{ margin: "var(--space-2) 0 0", lineHeight: 1.6, color: "var(--color-text-soft)" }}>{answer}</p></details>)}
        </section>

        <p className="source-note">Fonte: INAIL Open Data, cadenza mensile, CSV regionali (19 archivi regionali + Valle d&apos;Aosta), vintage 30/09/2026, tutte le 20 regioni. Ultimo aggiornamento: 11 novembre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}
