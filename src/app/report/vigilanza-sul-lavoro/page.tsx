import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Vigilanza sul lavoro in Italia: ispezioni, lavoro nero e violazioni (2021-2025)",
  description:
    "112.768 ispezioni definite nel 2025 e il 74% delle aziende irregolari: controlli INL, lavoratori in nero, sospensioni, violazioni sicurezza e patente a crediti, con i dati ufficiali.",
  alternates: { canonical: "/report/vigilanza-sul-lavoro" },
};

const faq = [
  {
    question: "Quante ispezioni sul lavoro ci sono state in Italia nel 2025?",
    answer:
      "112.768 ispezioni definite nel 2025 dall'Ispettorato nazionale del lavoro (INL) insieme a INPS e INAIL, su 157.381 controlli avviati. È il valore più alto del quinquennio: +4,2% rispetto al 2024 e +33% rispetto al 2021.",
  },
  {
    question: "Quante aziende risultano irregolari ai controlli?",
    answer:
      "Nel 2025, 83.488 aziende su 112.768 ispezionate sono risultate irregolari: il 74%. Il tasso di irregolarità è in crescita dal 2021 (69%) e stabile intorno al 74% dal 2023. Significa che circa tre imprese su quattro presentano violazioni.",
  },
  {
    question: "Cos'è la patente a crediti in edilizia?",
    answer:
      "È la patente a crediti prevista dall'art. 27 del D.Lgs. 81/2008, obbligatoria dal 1° gennaio 2025 per i cantieri edili e le opere temporanee (attiva dal 1° ottobre 2024). Ogni impresa parte con 30 crediti, decurtati in caso di violazioni e revocata sotto i 15. Nel primo anno: 479.020 rilasciate, 1.088 sanzioni per assenza, 14 revoche.",
  },
  {
    question: "Quanti lavoratori in nero sono stati trovati nel 2025?",
    answer:
      "22.503 lavoratori in nero nel 2025, in calo del 3,8% rispetto al 2024 ma sopra il livello del 2021 (20.571). I lavoratori irregolari complessivamente rilevati sono 328.524. Il caporalato scende al minimo del quinquennio (895 casi), mentre le interposizioni illecite crescono (14.570).",
  },
  {
    question: "Cosa succede quando un'azienda viene sospesa per sicurezza?",
    answer:
      "Con la sospensione (art. 14 D.Lgs. 81/2008) l'attività imprenditoriale viene fermata per le gravi violazioni in materia di salute e sicurezza o per lavorato nero superiore al 10%. Nel 2025 ci sono state 13.263 sospensioni, di cui 4.949 per gravi violazioni SSL: la maggior parte viene revocata dopo la regolarizzazione.",
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

const SERIE = [
  { anno: 2021, controlli: 117.608, definite: 84.679, irregolari: 58.146, tasso: "69,0%" },
  { anno: 2022, controlli: 100.192, definite: 82.183, irregolari: 59.023, tasso: "72,0%" },
  { anno: 2023, controlli: 111.281, definite: 80.280, irregolari: 59.445, tasso: "74,0%" },
  { anno: 2024, controlli: 158.069, definite: 108.267, irregolari: 80.245, tasso: "74,1%" },
  { anno: 2025, controlli: 157.381, definite: 112.768, irregolari: 83.488, tasso: "74,0%" },
];

const SOMMERSO = [
  { anno: 2021, nero: 20.571, caporalato: 1.352, interposizioni: 13.198, violSicurezza: 17.643, recupero: "1,11 mld €" },
  { anno: 2022, nero: 19.932, caporalato: 1.051, interposizioni: 13.082, violSicurezza: 25.481, recupero: "1,15 mld €" },
  { anno: 2023, nero: 21.170, caporalato: 3.208, interposizioni: 11.448, violSicurezza: 36.680, recupero: "1,22 mld €" },
  { anno: 2024, nero: 23.401, caporalato: 1.226, interposizioni: 13.458, violSicurezza: 83.330, recupero: "1,22 mld €" },
  { anno: 2025, nero: 22.503, caporalato: 895, interposizioni: 14.570, violSicurezza: 89.851, recupero: "1,29 mld €" },
];

const SOSPENSIONI = [
  { anno: 2021, tot: 3.971, sicurezza: 330 },
  { anno: 2022, tot: 8.210, sicurezza: 2.814 },
  { anno: 2023, tot: 11.174, sicurezza: 4.098 },
  { anno: 2024, tot: 15.002, sicurezza: 5.601 },
  { anno: 2025, tot: 13.263, sicurezza: 4.949 },
];

export default function ReportVigilanzaPage() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-10)" }}>
      <article style={{ maxWidth: "76ch", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
        <header style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxWidth: "62ch" }}>
              <p className="eyebrow" style={{ margin: 0 }}>REPORT · VIGILANZA SUL LAVORO</p>
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Vigilanza sul lavoro in Italia: ispezioni, lavoro nero e violazioni</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}>
                <strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-10-17">17 ottobre 2026</time>. Fonte: INL — Rapporti annuali sull&apos;attività di vigilanza.
              </p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">INL — Rapporti annuali sull&apos;attività di vigilanza in materia di lavoro e previdenziale (Ispettorato nazionale del lavoro, con INPS e INAIL) e Monitoraggi periodici dei provvedimenti di sospensione. Periodo 2021-2025.</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Ispezioni definite:</strong> attività concluse, distinte dai controlli avviati (che includono anche verifiche e accertamenti).</li>
                  <li><strong>Tasso di irregolarità:</strong> quota di ispezioni concluse con esito irregolare sul totale delle ispezioni definite.</li>
                  <li><strong>Lavoratori irregolari e in nero:</strong> il lavoro nero è la componente più grave del fenomeno (assenza totale di contratto e contribuzione); gli irregolari includono altre forme di non conformità.</li>
                  <li><strong>Sospensioni:</strong> provvedimenti art. 14 D.Lgs. 81/2008, distinti per lavoro nero e gravi violazioni di salute e sicurezza (SSL).</li>
                  <li><strong>Violazioni sicurezza:</strong> violazioni in materia di salute e sicurezza sul lavoro accertate in sede ispettiva.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">Il dato delle sospensioni distinto tra lavoro nero e gravi violazioni SSL è disponibile dalla rilevazione 2022. Le serie 2021 possono presentare differenze di perimetro rispetto agli anni successivi. I valori dell&apos;app INAIL sono soggetti a riclassificazioni. Metodo completo nella sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Quanto controlla lo Stato il lavoro in Italia?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>
            Nel <strong>2025</strong> l&apos;Ispettorato nazionale del lavoro, con INPS e INAIL, ha definito <strong>112.768 ispezioni</strong>: il valore più alto del quinquennio, con <strong>83.488 aziende irregolari</strong> (il <strong>74%</strong> di quelle ispezionate). Sono stati trovati <strong>22.503 lavoratori in nero</strong> e recuperati <strong>1,29 miliardi di euro</strong>.
          </p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Il dato più netto: dopo lo <strong>scatto del 2024</strong> (controlli +42%), le violazioni in materia di <strong>sicurezza sul lavoro</strong> sono passate da 17.643 a <strong>89.851</strong> in cinque anni, <strong>+409%</strong>.
          </p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>112.768 ispezioni definite nel 2025, record del quinquennio</li>
            <li>74% di aziende irregolari: circa tre su quattro</li>
            <li>22.503 lavoratori in nero trovati nel 2025</li>
            <li>1,29 mld € recuperati nel 2025, ~6 mld € in cinque anni</li>
            <li>Violazioni sicurezza +409% dal 2021 (17.643 → 89.851)</li>
            <li>Patente a crediti: 479.020 rilasciate dal 1/10/2024</li>
          </ul>
        </section>

        <Section title="Lo scatto 2024: i controlli raddoppiano">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            L&apos;attività ispettiva del 2021-2023 era rimasta su livelli stabili intorno alle 100-117 mila controlli l&apos;anno, con un minimo nel 2022 (100.192). Nel <strong>2024</strong> il salto è netto: <strong>158.069 controlli avviati, +42%</strong> sull&apos;anno precedente, e 108.267 ispezioni definite. Il 2025 consolida il nuovo livello: 157.381 controlli e <strong>112.768 ispezioni definite</strong>, il massimo del quinquennio.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Attività di vigilanza 2021-2025, dati INL. Il tasso di irregolarità è la quota di ispezioni con esito irregolare.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)" }}>Controlli avviati</th>
                  <th style={{ padding: "var(--space-2)" }}>Ispezioni definite</th>
                  <th style={{ padding: "var(--space-2)" }}>Irregolari</th>
                  <th style={{ padding: "var(--space-2)" }}>Tasso irregolarità</th>
                </tr>
              </thead>
              <tbody>
                {SERIE.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.controlli.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.definite.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.irregolari.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.tasso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", margin: 0 }}>
            Fonte: INL, Rapporti annuali sull&apos;attività di vigilanza. Il quadro completo è nella sezione <Link href="/vigilanza">vigilanza</Link>.
          </p>
        </Section>

        <Section title="Tre aziende su quattro irregolari: il tasso che non scende">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il tasso di irregolarità è il numero che il report non può edulcorare: nel <strong>2025 il 74%</strong> delle aziende ispezionate presenta violazioni, in crescita dal 69% del 2021 e stabile dal 2023. Il dato va letto con cautela: l&apos;ispettorato concentra le verifiche sui settori a rischio, quindi la percentuale non misura l&apos;irregolarità diffusa nel sistema produttivo, ma testimonia che <strong>dove si guarda, quasi sempre si trova qualcosa</strong>.
          </p>
        </Section>

        <Section title="Lavoro nero e sommerso: capitano in calo, interposizioni in crescita">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            I lavoratori in nero trovati nel 2025 sono <strong>22.503</strong>, in calo del 3,8% sul 2024 ma ancora sopra il livello 2021. Il dato più significativo è la composizione del sommerso: il <strong>caporalato</strong> scende al minimo del quinquennio (<strong>895 casi</strong>, contro i 3.208 del 2023), mentre le <strong>interposizioni illecite</strong> crescono (14.570, massimo della serie). Il fenomeno cambia forma: meno reclutamento organizzato in agricoltura, più appalti e subappalti costruiti per aggirare le regole.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Sommerso, violazioni sicurezza e recuperi 2021-2025, dati INL.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)" }}>Lavoratori in nero</th>
                  <th style={{ padding: "var(--space-2)" }}>Caporalato</th>
                  <th style={{ padding: "var(--space-2)" }}>Interposizioni</th>
                  <th style={{ padding: "var(--space-2)" }}>Violazioni sicurezza</th>
                  <th style={{ padding: "var(--space-2)" }}>Recuperi</th>
                </tr>
              </thead>
              <tbody>
                {SOMMERSO.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.nero.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.caporalato.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.interposizioni.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.violSicurezza.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.recupero}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            I <strong>recuperi</strong> superano il miliardo ogni anno dal 2021: nel 2025 sono 1,29 miliardi di euro, circa <strong>6 miliardi di euro in cinque anni</strong>. Contributi e premi evasi che tornano nelle casse pubbliche, il risultato finanziario diretto della vigilanza.
          </p>
        </Section>

        <Section title="La sicurezza sotto la lente: violazioni +409% in cinque anni">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            La svolta più netta del quinquennio riguarda la <strong>salute e sicurezza sul lavoro</strong>: le violazioni accertate passano da 17.643 (2021) a <strong>89.851 (2025), +409%</strong>. Il salto principale è nel 2024 (+127%), quando la vigilanza ha allargato il perimetro e inasprito i controlli, e prosegue nel 2025. La sicurezza diventa il primo fronte dell&apos;azione ispettiva, anche grazie alla spinta della patente a crediti nel settore edile.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il dettaglio per settore fotografa due mondi diversi: nelle <strong>sospensioni edili</strong> prevalgono le violazioni &quot;fisiche&quot;, le protezioni contro il rischio di caduta (915 casi nel 2025) e la mancanza del POS (530); nel <strong>terziario</strong> dominano le violazioni documentali, come la mancanza del DVR (2.060 casi). La vigilanza colpisce dove il rischio è più immediato: il <strong>cantiere</strong> resta il luogo dove la sicurezza si gioca sulla protezione reale, non sulla carta.
          </p>
        </Section>

        <Section title="Sospensioni e patente a crediti: gli strumenti che funzionano">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Le <strong>sospensioni</strong> (art. 14 D.Lgs. 81/2008) sono il provvedimento più duro: fermano l&apos;attività per gravi violazioni di sicurezza o lavoro nero sopra soglia. Nel 2025 sono state <strong>13.263</strong>, in calo dal picco 2024 (15.002) ma a un livello altissimo; di queste, 4.949 per gravi violazioni SSL. La maggior parte viene revocata dopo la regolarizzazione: la sospensione funziona come deterrente e come meccanismo di messa a norma.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Sospensioni dell&apos;attività imprenditoriale 2021-2025, art. 14 D.Lgs. 81/2008. Il dettaglio per gravi violazioni SSL è disponibile dal 2022.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)" }}>Sospensioni totali</th>
                  <th style={{ padding: "var(--space-2)" }}>di cui per sicurezza</th>
                </tr>
              </thead>
              <tbody>
                {SOSPENSIONI.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.tot.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.sicurezza.toLocaleString("it-IT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            La <strong>patente a crediti</strong> (art. 27 D.Lgs. 81/2008) completa il quadro: obbligatoria dal 1° gennaio 2025 per i cantieri edili, ha visto <strong>479.020 imprese richiederla</strong> nel primo anno, con sole 1.088 sanzioni per assenza e 14 revoche. Un nuovo strumento che responsabilizza le imprese per via amministrativa, senza bisogno dell&apos;ispezione: la gestione dei crediti, decurtati in caso di violazioni, spinge alla prevenzione continua.
          </p>
        </Section>

        <Section title="Perché la vigilanza conta per la sicurezza">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Ispezioni e sanzioni non sono un costo per le imprese: sono la leva che trasforma la sicurezza da dichiarazione a pratica. I dati del quinquennio mostrano che <strong>dove i controlli si intensificano, le violazioni emergono prima di diventare morti</strong>: le violazioni sicurezza crescono perché la vigilanza le intercetta, non perché il sistema peggiora. Il collegamento con gli infortuni è diretto: le stesse imprese che violano la sicurezza alimentano le statistiche degli infortuni, raccontate nel <Link href="/report/lavori-piu-pericolosi-in-italia">report sui lavori più pericolosi</Link>.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il quadro annuale completo di infortuni e malattie professionali è nel <Link href="/report/relazione-annuale-inail-2025">report sulla Relazione annuale INAIL 2025</Link>; per i dati di dettaglio su ispezioni, sospensioni e patente a crediti, la sezione <Link href="/vigilanza">vigilanza</Link>.
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

        <p className="source-note">Fonte: INL — Rapporti annuali sull&apos;attività di vigilanza e Monitoraggi periodici dei provvedimenti di sospensione, 2021-2025. Ultimo aggiornamento: 17 ottobre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto; la pagina Fonti contiene la metodologia completa.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}