import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Malattie professionali più denunciate in Italia (dati 2025-2026)",
  description:
    "Record di denunce di malattie professionali nel 2025: 98.312 casi, +11,3%, massimo da 26 anni. Le patologie più comuni (rachide, spalla, tunnel carpale), i decessi e perché i numeri crescono, con dati INAIL.",
  alternates: { canonical: "/report/malattie-professionali-piu-denunciate" },
};

const faq = [
  {
    question: "Qual è la malattia professionale più denunciata in Italia?",
    answer:
      "Le malattie dell'apparato muscolo-scheletrico da sovraccarico biomeccanico: ernie e discopatie del rachide (25,3% delle denunce), patologie della spalla o cuffia dei rotatori (21,4%) e sindromi canalicolari come il tunnel carpale (10,6%). Insieme superano il 57% del totale.",
  },
  {
    question: "Quante denunce di malattia professionale ci sono state nel 2025?",
    answer:
      "98.312 denunce, il numero più alto degli ultimi 26 anni: +11,3% rispetto al 2024. La crescita prosegue nel 2026: nel primo semestre le denunce sono 59.394, +16,7% sullo stesso periodo del 2025.",
  },
  {
    question: "Il tunnel carpale è una malattia professionale riconosciuta?",
    answer:
      "Sì, la sindrome del tunnel carpale (codice ICD-10 G56.0) è una delle malattie professionali più denunciate: 11.644 casi nei due semestri osservati, il 10,6% del totale. È tipica dei lavori con movimenti ripetuti di polso e mano; ha la quota femminile più alta tra le principali patologie (36,7%).",
  },
  {
    question: "Perché le malattie professionali aumentano?",
    answer:
      "Per una combinazione di fattori: migliore emersione e cultura della denuncia, invecchiamento della forza lavoro, patologie a lunga latenza (come le malattie da amianto) e la ripresa delle attività dopo il calo del biennio 2020-2021.",
  },
  {
    question: "Che differenza c'è tra malattie denunciate e malattie riconosciute?",
    answer:
      "La denuncia è la segnalazione all'INAIL, il riconoscimento è l'esito dell'istruttoria. Nel 2025 su 98.312 denunce, 36.019 sono state riconosciute (42,0%), 49.803 rigettate (58,0%) e 12.490 erano ancora in istruttoria. I dati statistici INAIL si riferiscono alle denunce.",
  },
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
  return (
    <section style={{ display: "grid", gap: "var(--space-2)" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

// Serie ricostruita dalle denunce totali per anno (riconosciute + rigettate + in istruttoria)
const SERIE_DENUNCE = [
  { anno: 2021, denunce: 55.198, delta: null },
  { anno: 2022, denunce: 60.623, delta: "+9,8%" },
  { anno: 2023, denunce: 72.575, delta: "+19,7%" },
  { anno: 2024, denunce: 88.338, delta: "+21,7%" },
  { anno: 2025, denunce: 98.312, delta: "+11,3%" },
];

const PATOLOGIE = [
  { nome: "Ernie e discopatie del rachide", casi: 27.920, quota: "25,3%", maschi: "75,8%" },
  { nome: "Patologie della spalla (cuffia dei rotatori)", casi: 23.592, quota: "21,4%", maschi: "71,0%" },
  { nome: "Sindromi canalicolari (tunnel carpale)", casi: 11.644, quota: "10,6%", maschi: "63,3%" },
  { nome: "Codice non indicato", casi: 11.186, quota: "10,1%", maschi: "—" },
  { nome: "Epicondiliti e tendinopatie", casi: 8.769, quota: "8,0%", maschi: "70,9%" },
  { nome: "Ipoacusia da rumore", casi: 5.871, quota: "5,3%", maschi: "96,9%" },
];

const DECESSI = [
  { anno: 2021, casi: 1.134, silicosiAsbestosi: 219 },
  { anno: 2022, casi: 1.120, silicosiAsbestosi: 232 },
  { anno: 2023, casi: 1.000, silicosiAsbestosi: 184 },
  { anno: 2024, casi: 877, silicosiAsbestosi: 125 },
  { anno: 2025, casi: 722, silicosiAsbestosi: 100 },
];

export default function ReportMalattieProfessionaliPage() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-10)" }}>
      <article style={{ maxWidth: "76ch", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
        <header style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxWidth: "62ch" }}>
              <p className="eyebrow" style={{ margin: 0 }}>REPORT · MALATTIE PROFESSIONALI</p>
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Malattie professionali più denunciate in Italia</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}>
                <strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-10-17">17 ottobre 2026</time>. Fonte: INAIL, dati consolidati 2021-2025 e dati congiunturali provvisori H1 2026.
              </p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">Open Data INAIL: dataset semestrali delle denunce di malattia professionale (malattie-professionali) e delle definizioni di istruttoria (malattie-esiti). Il dato 2025 (98.312 denunce) è il valore annuale consolidato; il primo semestre 2026 è provvisorio.</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Denunce, non malattie riconosciute:</strong> il dato statistico INAIL è quello delle denunce di malattia professionale, non coincidente con le patologie riconosciute dopo l&apos;istruttoria.</li>
                  <li><strong>Raggruppamento clinico:</strong> le patologie sono aggregate per gruppi ICD-10 (rachide, spalla, canalicolari, ecc.), non per singolo codice.</li>
                  <li><strong>Quote:</strong> calcolate sui 110.279 casi dei due semestri osservati (I 2025 + I 2026), compatibili con la struttura del dataset ufficiale.</li>
                  <li><strong>Decessi:</strong> casi mortali per malattia professionale riconosciuta, con dettaglio silicosi e asbestosi.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">Una quota rilevante di denunce (10,1%) arriva con codice clinico non indicato: le quote per patologia sono quindi una soglia minima. I dati 2026 sono provvisori e verranno riclassificati nel tempo. Metodo completo nella sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Quali sono le malattie professionali più denunciate in Italia?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>
            Nel <strong>2025</strong> le denunce di malattia professionale in Italia sono state <strong>98.312</strong>: il numero più alto degli ultimi 26 anni, <strong>+11,3%</strong> sul 2024. Le patologie più denunciate sono quelle da <strong>sovraccarico biomeccanico</strong>: ernie e discopatie del rachide (25,3%), patologie della spalla (21,4%) e tunnel carpale (10,6%).
          </p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Nel <strong>primo semestre 2026</strong> le denunce sono <strong>59.394</strong>, <strong>+16,7%</strong> sullo stesso periodo del 2025 (50.885): la crescita accelera.
          </p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>98.312 denunce di malattia professionale nel 2025, record da 26 anni (+11,3%)</li>
            <li>H1 2026: 59.394 denunce, +16,7% sullo stesso periodo del 2025</li>
            <li>Ernie e discopatie del rachide in testa: 25,3% delle denunce</li>
            <li>Solo il 42% delle denunce 2025 risulta riconosciuto (36.019 casi)</li>
            <li>4.853 decessi per malattia professionale riconosciuta nel quinquennio 2021-2025, in calo</li>
            <li>63.136 lavoratori coinvolti dalle denunce 2025</li>
          </ul>
        </section>

        <Section title="Un record che non è una buona notizia: 98.312 denunce nel 2025">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le denunce di malattia professionale crescono ogni anno dal 2021: da 55.198 a 98.312 nel 2025, <strong>+78% in quattro anni</strong>. Il balzo più forte è nel biennio 2023-2024 (+19,7% e +21,7%), mentre nel 2025 la crescita rallenta ma resta a doppia cifra (+11,3%). Il dato 2025 è il più alto dal 1999: mai così tante denunce negli ultimi 26 anni.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Denunce di malattia professionale per anno, dati INAIL. Il dato 2025 (98.312) è il record degli ultimi 26 anni.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)" }}>Denunce</th>
                  <th style={{ padding: "var(--space-2)" }}>Δ vs anno prec.</th>
                </tr>
              </thead>
              <tbody>
                {SERIE_DENUNCE.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.denunce.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.delta ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", margin: 0 }}>
            Fonte: INAIL, denunce ricostruite da esiti di istruttoria (riconosciute + rigettate + in istruttoria). Il quadro completo dei dati è nella sezione <Link href="/malattie-professionali">malattie professionali</Link>.
          </p>
        </Section>

        <Section title="Le patologie più denunciate: il sovraccarico biomeccanico domina">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le prime tre patologie sono tutte da <strong>sovraccarico biomeccanico</strong> e insieme coprono il <strong>57,2%</strong> delle denunce: ernie e discopatie del rachide, patologie della spalla e sindromi canalicolari come il tunnel carpale. Sono le malattie legate a movimenti ripetuti, sollevamento di carichi e posture, tipiche di manifattura, logistica, edilizia e agricoltura.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Patologie più denunciate nei due semestri osservati (I 2025 + I 2026), raggruppamento clinico ICD-10. Quota = casi sul totale di 110.279.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Patologia</th>
                  <th style={{ padding: "var(--space-2)" }}>Casi</th>
                  <th style={{ padding: "var(--space-2)" }}>Quota</th>
                  <th style={{ padding: "var(--space-2)" }}>% maschi</th>
                </tr>
              </thead>
              <tbody>
                {PATOLOGIE.map((p) => (
                  <tr key={p.nome} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 600 }}>{p.nome}</td>
                    <td style={{ padding: "var(--space-2)" }}>{p.casi.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{p.quota}</td>
                    <td style={{ padding: "var(--space-2)" }}>{p.maschi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il <strong>tunnel carpale</strong> merita un approfondimento: la sindrome del tunnel carpale (G56.0) è la malattia professionale con la quota femminile più alta tra le principali (36,7% delle denunce), tipica dei lavori ripetitivi di polso e mano. L&apos;<strong>ipoacusia da rumore</strong> è invece quasi esclusivamente maschile (96,9%) e riflette l&apos;esposizione storica in industria e edilizia.
          </p>
        </Section>

        <Section title="Denunce vs riconosciute: solo il 42% delle denunce 2025 è stato accertato">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le denunce non coincidono con le malattie riconosciute: nel 2025, su 98.312 denunce, <strong>36.019 sono state riconosciute</strong> (42,0%), 49.803 rigettate (58,0%) e 12.490 erano ancora in istruttoria. Il tasso di riconoscimento è in calo dal 2021 (52,3%): cresce il volume delle denunce, ma anche la quota di esiti negativi, segno di un sistema sotto pressione e di un&apos;emersione che porta con sé anche infondate.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            I 63.136 lavoratori coinvolti dalle denunce 2025 mostrano un&apos;altra faccia del fenomeno: ogni denuncia è una persona, spesso in età matura, con una patologia cronica che può cambiare la vita lavorativa. Il quadro completo di riconosciute e rigettate per anno è nella sezione <Link href="/malattie-professionali">malattie professionali</Link>.
          </p>
        </Section>

        <Section title="Il costo nascosto: 4.853 decessi in cinque anni">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le malattie professionali uccidono più degli infortuni, ma in silenzio: nel quinquennio 2021-2025 i decessi per malattia professionale riconosciuta sono stati <strong>4.853</strong>, con un trend in calo (da 1.134 nel 2021 a 722 nel 2025). Tra questi, <strong>silicosi e asbestosi</strong> restano una presenza costante: 860 decessi nel quinquennio, ultimo retaggio dell&apos;esposizione all&apos;amianto, con latenze che possono superare i 30 anni.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Decessi per malattia professionale riconosciuta, 2021-2025. Silicosi/asbestosi incluse nel totale.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)" }}>Decessi</th>
                  <th style={{ padding: "var(--space-2)" }}>di cui silicosi/asbestosi</th>
                </tr>
              </thead>
              <tbody>
                {DECESSI.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.casi.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.silicosiAsbestosi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Perché le denunce crescono">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            La crescita delle denunce non significa solo più malattie: è in buona parte il risultato di una <strong>migliore emersione</strong>. Dopo il calo del biennio 2020-2021 (quando visite e diagnosi sono state rallentate dalla pandemia), la ripresa delle attività e la maggiore attenzione al tema hanno fatto riemergere patologie che prima restavano sommerse.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            A questo si aggiungono fattori strutturali: l&apos;<strong>invecchiamento della forza lavoro</strong> (le patologie muscolo-scheletriche e respiratorie emergono con l&apos;età), le <strong>latenze lunghe</strong> delle malattie da amianto e silice, e l&apos;effetto di riconoscimento di malattie professionali storicamente sotto-diagnosticate come i disturbi muscolo-scheletrici.
          </p>
        </Section>

        <Section title="Malattie professionali e infortuni: due mondi da leggere insieme">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le malattie professionali e gli infortuni raccontano due tempi diversi del rischio: l&apos;infortunio è il rischio immediato, la malattia professionale è il rischio che si accumula nel tempo, spesso invisibile per anni. Per questo il sito le tiene separate ma le incrocia: il quadro annuale è nel <Link href="/report/relazione-annuale-inail-2025">rapporto sulla Relazione annuale INAIL 2025</Link>, mentre per gli infortuni in itinere si può leggere il <Link href="/report/infortunio-in-itinere">report dedicato</Link>.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Per le malattie professionali, la sezione <Link href="/malattie-professionali">malattie professionali</Link> offre la dashboard completa: serie mensile, distribuzione territoriale, decessi e dettaglio per patologia.
          </p>
        </Section>

        <section aria-labelledby="faq" style={{ display: "grid", gap: "var(--space-4)" }}>
          <h2 id="faq" style={{ margin: 0 }}>FAQ</h2>
          {faq.map(({ question, answer }) => (
            <details key={question} style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, lineHeight: 1.4 }}>{question}</summary>
              <p style={{ margin: "var(--space-2) 0 0", lineHeight: 1.6, color: "var(--color-text-soft)" }}>{answer}</p>
            </details>
          ))}
        </section>

        <p className="source-note">Fonte: INAIL, dati consolidati 2021-2025 e dati congiunturali provvisori H1 2026. Ultimo aggiornamento: 17 ottobre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto; la pagina Fonti contiene la metodologia completa.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}