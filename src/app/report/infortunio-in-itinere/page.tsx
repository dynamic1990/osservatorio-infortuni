import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Infortunio in itinere: cos'è, quando è riconosciuto, dati INAIL",
  description:
    "Cos'è l'infortunio in itinere, quando INAIL lo riconosce (art. 12 D.Lgs. 38/2000) e quanti casi ci sono in Italia: 106.581 denunce nel 2025, in crescita. Dati per regione e normativa.",
  alternates: { canonical: "/report/infortunio-in-itinere" },
};

const faq = [
  {
    question: "Cos'è l'infortunio in itinere?",
    answer:
      "È l'infortunio che avviene nel percorso tra il luogo di abitazione e il luogo di lavoro, o negli spostamenti connessi al lavoro (come andare in mensa), nei limiti previsti dalla legge. È tutelato dall'INAIL come infortunio sul lavoro.",
  },
  {
    question: "Quando l'INAIL riconosce l'infortunio in itinere?",
    answer:
      "Quando avviene lungo il percorso normale casa-lavoro, cioè il più breve o ragionevolmente percorribile, senza deviazioni non giustificate. L'uso del mezzo di trasporto privato è coperto quando è necessitato (art. 12 D.Lgs. 38/2000, circolare INAIL 14/2016).",
  },
  {
    question: "Quali deviazioni dal percorso casa-lavoro sono coperte?",
    answer:
      "Sono coperte le deviazioni dovute a necessità: l'accompagnamento dei figli a scuola, le esigenze di cura di persone, gli adempimenti costituzionali (come votare). Il percorso deve restare compatibile con il tragitto casa-lavoro.",
  },
  {
    question: "Quanti infortuni in itinere ci sono in Italia?",
    answer:
      "106.581 denunce nel 2025, in crescita costante: +2,5% rispetto al 2024, il 17,7% di tutte le denunce. Nel primo semestre 2026 sono 41.997, +7,97% sullo stesso periodo del 2025.",
  },
  {
    question: "La bicicletta o il monopattino sono coperti dall'assicurazione?",
    answer:
      "Sì, se il mezzo è lecito e il suo uso è congruo o necessitato per il percorso. Vale lo stesso principio del mezzo di trasporto privato: la tutela copre anche chi va al lavoro in bici.",
  },
  {
    question: "Che differenza c'è tra denunce e infortuni riconosciuti?",
    answer:
      "Il dato statistico INAIL si basa sulle denunce di infortunio, che non coincidono con gli infortuni riconosciuti: parte delle denunce viene archiviata dopo l'istruttoria. I numeri del sito seguono la fonte ufficiale e indicano le denunce.",
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

const SERIE_ITINERE = [
  { anno: 2021, denunce: 84.895, delta: null, morti: 282, quota: "15,0%" },
  { anno: 2022, denunce: 95.473, delta: "+12,5%", morti: 345, quota: "13,6%" },
  { anno: 2023, denunce: 100.226, delta: "+5,0%", morti: 277, quota: "17,0%" },
  { anno: 2024, denunce: 104.020, delta: "+3,8%", morti: 303, quota: "17,5%" },
  { anno: 2025, denunce: 106.581, delta: "+2,5%", morti: 301, quota: "17,7%" },
];

const TOP_REGIONI = [
  { regione: "Lombardia", denunce: 21.402, morti: 55 },
  { regione: "Emilia-Romagna", denunce: 12.634, morti: 25 },
  { regione: "Veneto", denunce: 11.909, morti: 38 },
  { regione: "Lazio", denunce: 11.234, morti: 29 },
  { regione: "Toscana", denunce: 8.971, morti: 20 },
  { regione: "Piemonte", denunce: 8.466, morti: 23 },
  { regione: "Sicilia", denunce: 5.028, morti: 27 },
  { regione: "Puglia", denunce: 4.530, morti: 10 },
  { regione: "Liguria", denunce: 4.044, morti: 5 },
  { regione: "Campania", denunce: 3.793, morti: 24 },
];

export default function ReportItinerePage() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-10)" }}>
      <article style={{ maxWidth: "76ch", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
        <header style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxWidth: "62ch" }}>
              <p className="eyebrow" style={{ margin: 0 }}>REPORT · INFORTUNI IN ITINERE</p>
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Infortunio in itinere: cos&apos;è, quando è riconosciuto, quanti casi in Italia</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}>
                <strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-10-16">16 ottobre 2026</time>. Fonte: INAIL, dati consolidati 2021-2025 e dati congiunturali provvisori H1 2026.
              </p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">Dati INAIL: serie storica consolidata 2021-2025 delle denunce (dataset semestrale ufficiale) e dati congiunturali provvisori del primo semestre 2026. La normativa di riferimento è l&apos;art. 12 del D.Lgs. 38/2000 e la circolare INAIL 14/2016.</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Denunce, non infortuni riconosciuti:</strong> il dato statistico INAIL è quello delle denunce di infortunio, non coincidente con gli infortuni riconosciuti dopo l&apos;istruttoria.</li>
                  <li><strong>Occasione di lavoro / itinere:</strong> l&apos;occasione di lavoro è l&apos;attività lavorativa in sé; l&apos;itinere è il percorso casa-lavoro e gli spostamenti connessi nei limiti previsti.</li>
                  <li><strong>Classifica per regione:</strong> usa i dati consolidati 2025, che coprono tutte le 20 regioni. I dati congiunturali H1 2026 coprono 16 regioni (4 hanno solo cadenza semestrale), quindi non sono usati per i confronti territoriali.</li>
                  <li><strong>Delta e quote:</strong> confronto con l&apos;anno precedente in valore assoluto e percentuale; la quota indica il peso dell&apos;itinere sul totale delle denunce.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">I dati 2026 sono provvisori e verranno integrati e riclassificati nel tempo; i consolidati 2025 restano il riferimento per i confronti territoriali. I dettagli e il metodo completo sono consultabili nella sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Cos&apos;è l&apos;infortunio in itinere e quanti casi ci sono?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>
            L&apos;<strong>infortunio in itinere</strong> è l&apos;infortunio che accade nel percorso tra casa e luogo di lavoro, o negli spostamenti connessi al lavoro nei limiti previsti dalla legge. È tutelato dall&apos;INAIL come infortunio sul lavoro. Nel <strong>2025</strong> le denunce in itinere sono state <strong>106.581</strong>, il 17,7% del totale: in costante crescita da anni.
          </p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Nel <strong>primo semestre 2026</strong> le denunce in itinere sono <strong>41.997</strong>, <strong>+7,97%</strong> sullo stesso periodo del 2025, con <strong>118 casi mortali</strong> (+2,61%).
          </p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>106.581 denunce in itinere nel 2025 (+2,5% sul 2024)</li>
            <li>17,7% di tutte le denunce di infortunio sono in itinere</li>
            <li>35.686 denunce in più in 4 anni: da 84.895 (2021) a 106.581 (2025), +25,5%</li>
            <li>301 casi mortali in itinere nel 2025</li>
            <li>H1 2026: 41.997 denunce (+7,97%) e 118 casi mortali (+2,61%)</li>
            <li>Prima regione: Lombardia con 21.402 denunce nel 2025</li>
          </ul>
        </section>

        <Section title="Quando l'INAIL riconosce l'infortunio in itinere">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            La tutela dell&apos;infortunio in itinere è definita dall&apos;<strong>art. 12 del D.Lgs. 38/2000</strong>, che estende l&apos;assicurazione INAIL anche agli eventi occorsi nel percorso di andata e ritorno tra l&apos;abitazione e il luogo di lavoro, e negli spostamenti tra due luoghi di lavoro o tra il luogo di lavoro e quello di consumazione dei pasti. Le condizioni di dettaglio sono precisate nella <strong>circolare INAIL 14/2016</strong>.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Perché il rischio sia coperto, l&apos;evento deve avvenire lungo il <strong>percorso normale</strong>, cioè il più breve o ragionevolmente percorribile, senza deviazioni se non concretamente giustificate da necessità (accompagnamento dei figli a scuola, esigenze di cura, necessità costituzionali). L&apos;uso del <strong>mezzo di trasporto privato</strong> è coperto quando è necessitato: quando manca un mezzo pubblico idoneo, o il percorso o l&apos;orario lo rendono inevitabile, o l&apos;uso del mezzo è comunque più sicuro per il lavoratore.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Un punto importante: le <strong>denunce non coincidono con gli infortuni riconosciuti</strong>. Il dato statistico pubblicato da INAIL è quello delle denunce; una parte viene archiviata dopo l&apos;istruttoria. I numeri di questo report, come quelli del sito, seguono la fonte ufficiale e si riferiscono alle denunce.
          </p>
        </Section>

        <Section title="I numeri in Italia: un fenomeno in crescita costante">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le denunce in itinere crescono ogni anno dal 2021: da 84.895 a 106.581 nel 2025, <strong>+25,5% in quattro anni</strong>. La crescita è più marcata nel biennio 2021-2022 (+12,5%), poi prosegue a ritmo più contenuto ma senza inversioni. Nel frattempo la quota sul totale delle denunce è salita dal 15,0% al 17,7%: l&apos;itinere pesa sempre di più sul complesso degli infortuni.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Denunce in itinere per anno, dati INAIL consolidati. Quota = peso sul totale delle denunce di quell&apos;anno.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)" }}>Denunce itinere</th>
                  <th style={{ padding: "var(--space-2)" }}>Δ vs anno prec.</th>
                  <th style={{ padding: "var(--space-2)" }}>Morti in itinere</th>
                  <th style={{ padding: "var(--space-2)" }}>Quota</th>
                </tr>
              </thead>
              <tbody>
                {SERIE_ITINERE.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.denunce.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.delta ?? "—"}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.morti}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", margin: 0 }}>
            Fonte: INAIL, serie storica consolidata. Il dato congiunturale H1 2026 (41.997 denunce, +7,97%) è aggiornato nel <Link href="/report/infortuni-1-semestre-2026">report sul primo semestre 2026</Link>.
          </p>
        </Section>

        <Section title="Dove accade di più: le regioni con più denunce in itinere (2025)">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            La Lombardia è la regione con il maggior numero di denunce in itinere: 21.402 nel 2025, circa un quinto del totale nazionale. Seguono Emilia-Romagna, Veneto e Lazio, tutte sopra le 11.000. La classifica riflette in parte la dimensione occupazionale dei territori; per confronti corretti tra regioni di diversa dimensione serve il tasso di incidenza (denunce per occupati), disponibile nella sezione <Link href="/">infortuni</Link>.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Top 10 regioni per denunce in itinere nel 2025, dati INAIL consolidati. Le prime cinque regioni coprono il 62% del totale nazionale.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>#</th>
                  <th style={{ padding: "var(--space-2)" }}>Regione</th>
                  <th style={{ padding: "var(--space-2)" }}>Denunce itinere</th>
                  <th style={{ padding: "var(--space-2)" }}>Morti in itinere</th>
                </tr>
              </thead>
              <tbody>
                {TOP_REGIONI.map((r, i) => (
                  <tr key={r.regione} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>{i + 1}</td>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.regione}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.denunce.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.morti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Perché l'itinere va letto separato dall'occasione di lavoro">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Gli infortuni in occasione di lavoro e quelli in itinere hanno cause, dinamiche e leve di prevenzione diverse: l&apos;occasione di lavoro riguarda l&apos;attività lavorativa e i luoghi di lavoro, l&apos;itinere riguarda il traffico, i mezzi di trasporto e la sicurezza stradale. Metterli insieme produce un numero che non parla né agli uni né agli altri. Per questo il sito li tiene separati ovunque la fonte lo consenta.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il quadro completo di serie, regioni e incidenza è nella sezione <Link href="/">infortuni</Link>; per le dinamiche dei casi mortali si può consultare <Link href="/casi-mortali">casi mortali</Link> e per il quadro dell&apos;azione di controllo la pagina <Link href="/vigilanza">vigilanza</Link>.
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

        <p className="source-note">Fonte: INAIL, dati consolidati 2021-2025 e dati congiunturali provvisori H1 2026. Ultimo aggiornamento: 16 ottobre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto; la pagina Fonti contiene la metodologia completa.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}
