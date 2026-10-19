import type { Metadata } from "next";
import Link from "next/link";
import { InfoModalButton } from "@/components/ui/info-modal";

export const metadata: Metadata = {
  title: "Lavori più pericolosi in Italia: settori e cause delle morti sul lavoro",
  description:
    "Costruzioni e agricoltura in testa alle morti sul lavoro nei casi analizzati da Infor.MO (2010-2024): 3.766 casi, le cause più frequenti e i settori a rischio, con dati INAIL.",
  alternates: { canonical: "/report/lavori-piu-pericolosi-in-italia" },
};

const faq = [
  {
    question: "Quali sono i lavori più pericolosi in Italia?",
    answer:
      "Nei casi mortali analizzati dall'archivio Infor.MO (2010-2024) guidano costruzioni (1.084 casi) e agricoltura (1.043), davanti a trasporti e magazzinaggio (282). Dal 2021 le costruzioni sono il settore con più casi ogni anno.",
  },
  {
    question: "Qual è la causa più frequente di morte sul lavoro?",
    answer:
      "La caduta dall'alto di persona: 1.217 casi su 3.844 con dinamica registrata (31,7%). Seguono il ribaltamento di veicoli o mezzi di trasporto (17,7%) e la caduta dall'alto di gravi (14,3%). Le prime tre dinamiche coprono il 63,7% dei casi.",
  },
  {
    question: "Quanti morti sul lavoro ci sono stati in Italia?",
    answer:
      "Le denunce con esito mortale all'INAIL: 1.228 nel 2024, 1.208 nel 2023, con punte di 1.742 nel 2020 e 1.472 nel 2021. Il numero è altalenante, senza un calo strutturale netto negli ultimi dieci anni.",
  },
  {
    question: "L'agricoltura o l'edilizia è più pericolosa?",
    answer:
      "Dipende dal periodo: l'agricoltura ha più casi analizzati fino al 2018, le costruzioni dal 2021 sono in testa ogni anno. Sul totale 2010-2024 sono quasi appaiate: costruzioni 1.084, agricoltura 1.043.",
  },
  {
    question: "Chi muore di più sul lavoro?",
    answer:
      "Nel 2024, sui casi analizzati: lavoratori con oltre 3 anni di esperienza (63%), dipendenti a tempo indeterminato (93 casi) ma con presenza marcata di autonomi e irregolari (21); tra i casi con dimensione aziendale indicata, quasi la metà riguarda imprese da 2 a 9 addetti.",
  },
  {
    question: "Cosa dice Infor.MO? È affidabile?",
    answer:
      "Infor.MO è il database pubblico INAIL degli infortuni mortali analizzati con un modello di indagine su dinamica, fattori causali e profili. Copre una parte dei decessi denunciati (24,7% nel 2010-2024): è un campione di approfondimento, non il censimento di tutte le morti sul lavoro.",
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

// Dati verificati: src/data/generated/informo-mortali-analisi.json (Infor.MO INAIL 2010-2024).
// Quote calcolate sulle voci registrate: 3.489 settori / 3.844 dinamiche / 7.360 fattori.
const SETTORI = [
  { nome: "Costruzioni", casi: 1084, quota: "31,1%" },
  { nome: "Agricoltura, caccia e silvicoltura", casi: 1043, quota: "29,9%" },
  { nome: "Altri comparti", casi: 447, quota: "12,8%" },
  { nome: "Trasporti, magazzinaggio e comunicazioni", casi: 282, quota: "8,1%" },
  { nome: "Metallurgia, fabbricazione prodotti in metallo", casi: 221, quota: "6,3%" },
  { nome: "Commercio all'ingrosso e al dettaglio; riparazioni", casi: 122, quota: "3,5%" },
  { nome: "Altri servizi pubblici, sociali e personali", casi: 102, quota: "2,9%" },
  { nome: "Fabbricazione di macchine ed apparecchi meccanici", casi: 67, quota: "1,9%" },
  { nome: "Prodotti della lavorazione di minerali non metalliferi", casi: 60, quota: "1,7%" },
  { nome: "Industria del legno e dei prodotti in legno", casi: 48, quota: "1,4%" },
];

const TREND_COS_AGR = [
  { anno: 2014, costruzioni: 62, agricoltura: 79 },
  { anno: 2015, costruzioni: 75, agricoltura: 79 },
  { anno: 2016, costruzioni: 72, agricoltura: 82 },
  { anno: 2017, costruzioni: 57, agricoltura: 74 },
  { anno: 2018, costruzioni: 61, agricoltura: 69 },
  { anno: 2019, costruzioni: 53, agricoltura: 45 },
  { anno: 2020, costruzioni: 49, agricoltura: 66 },
  { anno: 2021, costruzioni: 79, agricoltura: 73 },
  { anno: 2022, costruzioni: 60, agricoltura: 62 },
  { anno: 2023, costruzioni: 69, agricoltura: 54 },
  { anno: 2024, costruzioni: 68, agricoltura: 52 },
];

const DINAMICHE = [
  { nome: "Caduta di persona dall'alto", casi: 1217, quota: "31,7%" },
  { nome: "Variazione della marcia veicolo/mezzo di trasporto (ribaltamento)", casi: 680, quota: "17,7%" },
  { nome: "Caduta dall'alto di gravi", casi: 548, quota: "14,3%" },
  { nome: "Contatto con oggetti/mezzi in movimento (nella sede abituale)", casi: 307, quota: "8,0%" },
  { nome: "Altri incidenti", casi: 297, quota: "7,7%" },
  { nome: "Avviamento intempestivo di veicolo, macchina, attrezzatura", casi: 252, quota: "6,6%" },
  { nome: "Contatto con organi lavoratori in movimento", casi: 211, quota: "5,5%" },
  { nome: "Contatto elettrico diretto", casi: 143, quota: "3,7%" },
  { nome: "Proiezione di solidi", casi: 122, quota: "3,2%" },
];

const FATTORI = [
  { nome: "Attività dell'infortunato", fattori: 3349, quota: "45,5%" },
  { nome: "Utensili, macchine, impianti", fattori: 1391, quota: "18,9%" },
  { nome: "Ambiente", fattori: 1115, quota: "15,1%" },
  { nome: "Attività di terzi", fattori: 717, quota: "9,7%" },
  { nome: "Dispositivi di protezione individuale e abbigliamento", fattori: 552, quota: "7,5%" },
  { nome: "Materiali", fattori: 236, quota: "3,2%" },
];

const PROFILO_2024 = {
  casi: 249,
  anzianita: [
    { nome: "Oltre 3 anni di esperienza", casi: 156, quota: "63%" },
    { nome: "Oltre 1 anno e fino a 3", casi: 21, quota: "8%" },
    { nome: "Da 6 a 12 mesi", casi: 10, quota: "4%" },
    { nome: "Fino a 7 giorni", casi: 8, quota: "3%" },
    { nome: "Non indicata", casi: 43, quota: "17%" },
  ],
  rapporto: [
    { nome: "Dipendente a tempo indeterminato", casi: 93 },
    { nome: "Dipendente a tempo determinato", casi: 36 },
    { nome: "Autonomo o titolare senza dipendenti", casi: 27 },
    { nome: "Irregolare", casi: 21 },
    { nome: "Autonomo o titolare con dipendenti", casi: 17 },
    { nome: "Pensionato", casi: 15 },
    { nome: "Coadiuvante familiare", casi: 13 },
    { nome: "Socio (anche di cooperative)", casi: 12 },
    { nome: "Non indicato / altro", casi: 15 },
  ],
  classeAddetti: [
    { nome: "Da 2 a 9 addetti", casi: 60, quota: "48%" },
    { nome: "Da 10 a 49 addetti", casi: 25, quota: "20%" },
    { nome: "1 addetto", casi: 16, quota: "13%" },
    { nome: "Da 50 a 249 addetti", casi: 13, quota: "10%" },
    { nome: "250 addetti e oltre", casi: 10, quota: "8%" },
  ],
};

export default function ReportLavoriPericolosiPage() {
  return (
    <main className="container" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-10)" }}>
      <article style={{ maxWidth: "76ch", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
        <header style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxWidth: "62ch" }}>
              <p className="eyebrow" style={{ margin: 0 }}>REPORT · MORTI SUL LAVORO</p>
              <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.06, margin: "var(--space-2) 0 var(--space-3)" }}>Lavori più pericolosi in Italia: settori e cause delle morti sul lavoro</h1>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.86rem" }}>
                <strong style={{ color: "var(--color-text-soft)" }}>Ultimo aggiornamento:</strong> <time dateTime="2026-10-19">19 ottobre 2026</time>. Fonte: INAIL, archivio Infor.MO, casi mortali analizzati 2010-2024.
              </p>
            </div>
            <InfoModalButton>
              <section className="modal-section">
                <h3 className="modal-section-title">1. Fonti dei dati</h3>
                <p className="modal-text">Archivio <strong>Infor.MO</strong> di INAIL (InformoWeb), database pubblico degli infortuni sul lavoro analizzati con il modello Infor.MO: dinamica degli eventi, fattori causali, profili di lavoratori e aziende. Periodo 2010-2024, tipoEvento=1 (casi mortali). I dati sono quelli serviti dalle pagine dell&apos;Osservatorio (dataset <code>informo-mortali-analisi.json</code>, generato da pipeline deterministica).</p>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">2. Metodo e perimetro</h3>
                <ul className="modal-list">
                  <li><strong>Campione, non censimento:</strong> i 3.766 casi analizzati coprono il 24,7% delle 15.268 denunce con esito mortale INAIL del periodo. Le classi emerse valgono per i casi analizzati, non per tutti i decessi.</li>
                  <li><strong>Quote calcolate sulle voci registrate:</strong> settori 3.489 voci su 3.766 casi (93%), dinamiche 3.844 voci, fattori 7.360. La differenza (casi senza attribuzione) è dichiarata e non viene nascosta.</li>
                  <li><strong>Serie annuali:</strong> ogni confronto conserva l&apos;anno di riferimento. I totali di periodo (2010-2024) sono riportati solo con perimetro esplicito e affiancati dalle serie per anno.</li>
                  <li><strong>Morti denunciati:</strong> serie INAIL ufficiale delle denunce con esito mortale, usata per il contesto generale.</li>
                </ul>
              </section>
              <section className="modal-section">
                <h3 className="modal-section-title">3. Limitazioni</h3>
                <p className="modal-text">L&apos;archivio Infor.MO non copre tutte le morti sul lavoro: l&apos;analisi approfondita dei casi richiede tempo e il database si popola con il ritardo delle indagini. La lettura di settori, cause e profili è quella dell&apos;archivio, non una statistica completa. Dettagli e metodo sono nella sezione <Link href="/fonti">Fonti e metodo</Link>.</p>
              </section>
            </InfoModalButton>
          </div>
        </header>

        <section aria-labelledby="risposta-diretta" style={{ borderLeft: "4px solid var(--color-accent)", padding: "var(--space-4)", background: "var(--color-accent-soft)" }}>
          <h2 id="risposta-diretta" style={{ margin: "0 0 var(--space-2)", fontSize: "1.2rem" }}>Quali sono i lavori più pericolosi in Italia?</h2>
          <p style={{ margin: 0, fontSize: "1.12rem", lineHeight: 1.6 }}>
            Nei casi mortali analizzati da <strong>Infor.MO 2010-2024</strong> (3.766 casi) i settori in testa sono <strong>costruzioni</strong> (1.084 casi) e <strong>agricoltura</strong> (1.043), quasi appaiate sul periodo. Dal <strong>2021</strong>, però, le costruzioni sono il settore con più casi ogni anno. La causa singola più frequente è la <strong>caduta dall&apos;alto</strong>: 1.217 casi, quasi un caso su tre.
          </p>
          <p style={{ margin: "var(--space-4) 0 0", fontSize: "1.05rem", lineHeight: 1.6 }}>
            <strong>Attenzione al perimetro:</strong> l&apos;archivio Infor.MO approfondisce 3.766 casi sul totale di 15.268 denunce con esito mortale del periodo (<strong>24,7%</strong>). È il campione più ricco disponibile su cause e dinamiche, non il censimento di tutte le morti sul lavoro.
          </p>
        </section>

        <section aria-labelledby="in-breve" className="card" style={{ background: "var(--color-surface)" }}>
          <h2 id="in-breve" style={{ margin: "0 0 var(--space-3)" }}>In breve</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "var(--space-2)", lineHeight: 1.5 }}>
            <li>3.766 casi mortali analizzati da Infor.MO nel 2010-2024, su 15.268 denunce (24,7%)</li>
            <li>Costruzioni (1.084) e agricoltura (1.043) davanti a tutti; costruzioni in testa dal 2021</li>
            <li>Caduta dall&apos;alto di persona: 1.217 casi, 31,7% delle dinamiche registrate</li>
            <li>Le prime tre dinamiche (caduta di persona, ribaltamento, caduta di gravi) coprono il 63,7%</li>
            <li>45,5% dei fattori causali riconduce all&apos;attività dell&apos;infortunato; dominano gli errori procedurali estemporanei</li>
            <li>Nel 2024: 63% delle vittime aveva oltre 3 anni di esperienza; 21 casi su 249 riguardano lavoratori irregolari</li>
          </ul>
        </section>

        <Section title="Che cos'è Infor.MO e perché questi numeri non sono tutti i morti sul lavoro">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Infor.MO è l&apos;archivio pubblico di INAIL che raccoglie gli infortuni sul lavoro analizzati in profondità: per ogni caso vengono ricostruiti dinamica, fattori causali, profilo del lavoratore e dell&apos;azienda. Non tutti i decessi denunciati entrano nell&apos;archivio: l&apos;analisi è lunga e il database si popola con il ritardo delle indagini. Nel periodo 2010-2024 i casi analizzati sono 3.766 su 15.268 denunce (24,7%), con una copertura che si aggira intorno ai 190-320 casi l&apos;anno.
          </p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Questo report usa l&apos;archivio perché è la fonte che dice <strong>perché</strong> si muore, non solo quante volte: settori, cause e profili. I totali nazionali INAIL restano il riferimento per il quadro generale.
          </p>
        </Section>

        <Section title="I settori più pericolosi: agricoltura e costruzioni in testa">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Sul totale 2010-2024 costruzioni e agricoltura sono quasi appaiate: 1.084 contro 1.043 casi, insieme quasi il 61% delle voci con settore registrato. Molto più staccati trasporti (282) e metallurgia (221). L&apos;andamento nel tempo, però, racconta un cambio di passo: l&apos;agricoltura è in testa fino al 2018, poi cala; dal 2021 le costruzioni la superano e non la lasciano più indietro.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Settori per casi mortali analizzati, periodo 2010-2024. Quote calcolate sulle 3.489 voci con settore registrato (93% dei casi); per 277 casi il settore non è attribuito.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Settore</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Casi</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Quota</th>
                </tr>
              </thead>
              <tbody>
                {SETTORI.map((r) => (
                  <tr key={r.nome} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.nome}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.casi.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Costruzioni vs agricoltura, casi per anno: l&apos;agricoltura guida fino al 2018, le costruzioni dal 2021.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Anno</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Costruzioni</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Agricoltura</th>
                </tr>
              </thead>
              <tbody>
                {TREND_COS_AGR.map((r) => (
                  <tr key={r.anno} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.anno}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.costruzioni}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.agricoltura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Le cause: cosa uccide di più">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            La <strong>caduta dall&apos;alto di persona</strong> è la dinamica più frequente: 1.217 casi, quasi un terzo delle 3.844 voci registrate. Insieme al <strong>ribaltamento di veicoli o mezzi</strong> (680) e alla <strong>caduta dall&apos;alto di gravi</strong> (548) copre il 63,7% del totale. Sono eventi concentrati nei luoghi di lavoro con lavori in quota o movimentazione di mezzi: cantieri, agricoltura, trasporti.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Dinamiche più frequenti nei casi mortali analizzati, 2010-2024. Quote sulle 3.844 voci con dinamica registrata.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Dinamica</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Casi</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Quota</th>
                </tr>
              </thead>
              <tbody>
                {DINAMICHE.map((r) => (
                  <tr key={r.nome} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.nome}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.casi.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il confronto con l&apos;anno precedente aiuta a leggere la direzione: nel 2024 la caduta di persona è calata (97 casi nel 2023, 74 nel 2024) mentre crescono il contatto con organi lavoratori in movimento (8 → 17) e il contatto elettrico diretto (1 → 10). Sono variazioni su numeri piccoli, da seguire nel tempo, non ancora trend consolidati.
          </p>
        </Section>

        <Section title="I fattori causali e i problemi di sicurezza">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Nei 7.360 fattori causali registrati, il 45,5% riconduce all&apos;<strong>attività dell&apos;infortunato</strong>: non la fatalità, ma ciò che la persona stava facendo e come. Seguono utensili, macchine e impianti (18,9%) e ambiente (15,1%). Tra i problemi di sicurezza più citati nel 2024 dominano gli <strong>errori procedurali estemporanei</strong> (decisioni prese sul momento, senza procedura seguita) e le <strong>carenze di formazione o addestramento</strong>, più delle mancanze strutturali come barriere o parapetti assenti.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Tipologie di fattori causali, 2010-2024. Totale: 7.360 fattori.</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Tipologia</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Fattori</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Quota</th>
                </tr>
              </thead>
              <tbody>
                {FATTORI.map((r) => (
                  <tr key={r.nome} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.nome}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.fattori.toLocaleString("it-IT")}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            I problemi di sicurezza più citati nel 2024: uso errato di attrezzatura come azione estemporanea (66 casi), altri errori di procedura estemporanei (60), uso errato di attrezzatura legato a formazione o addestramento (23) e assenza di barriere, protezioni o parapetti (23).
          </p>
        </Section>

        <Section title="Il profilo delle vittime: chi muore sul lavoro">
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il profilo dei 249 casi del 2024 smentisce un luogo comune: non muoiono soprattutto i neoassunti. Il <strong>63% delle vittime aveva oltre tre anni di esperienza</strong> nel ruolo. Tra i rapporti di lavoro prevalgono i dipendenti a tempo indeterminato (93 casi), ma il peso di autonomi, coadiuvanti familiari e <strong>lavoratori irregolari</strong> (21 casi) è molto più alto della loro incidenza sull&apos;occupazione complessiva. Dove la dimensione dell&apos;azienda è indicata, quasi la metà dei casi (60 su 124) riguarda imprese da 2 a 9 addetti: le microimprese, quelle con meno risorse dedicate alla prevenzione.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <caption style={{ textAlign: "left", color: "var(--color-text-soft)", fontSize: "0.82rem", marginBottom: "var(--space-2)" }}>Dimensione aziendale dei casi 2024, quote sui 124 casi con dato indicato (per 125 il dato non è presente).</caption>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Dimensione azienda</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Casi</th>
                  <th style={{ padding: "var(--space-2)", color: "var(--color-text-soft)" }}>Quota</th>
                </tr>
              </thead>
              <tbody>
                {PROFILO_2024.classeAddetti.map((r) => (
                  <tr key={r.nome} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "var(--space-2)", fontWeight: 700 }}>{r.nome}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.casi}</td>
                    <td style={{ padding: "var(--space-2)" }}>{r.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Il dettaglio completo per anzianità, rapporto di lavoro, sesso e territorio è esplorabile nella pagina <Link href="/analisi-delle-cause">Analisi delle cause</Link>, dove ogni dimensione è selezionabile per anno.
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

        <p className="source-note">Fonte: INAIL, archivio Infor.MO (InformoWeb), casi mortali analizzati 2010-2024; serie INAIL delle denunce con esito mortale. Ultimo aggiornamento: 19 ottobre 2026. Metodo e limiti nel pulsante &quot;Metodologia, Formule e Fonti&quot; in alto; la pagina <Link href="/fonti">Fonti e metodo</Link> contiene la metodologia completa.</p>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}
