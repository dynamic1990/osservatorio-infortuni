// Indice di ricerca globale del sito.
// Fonti dell'indice: pagine statiche, report, grafici (sezioni con anchor),
// bandi (data/bandi-prevenzione.ts) e fonti (lib/sources.ts).
// Le news della cronaca NON stanno qui: sono 300+ e vengono caricate
// lazy dal componente di ricerca.

import { BANDI_PREVENZIONE } from "@/data/bandi-prevenzione";
import { SOURCES } from "@/lib/sources";

export type SearchEntryType =
  | "pagina"
  | "report"
  | "grafico"
  | "bando"
  | "fonte";

export interface SearchEntry {
  type: SearchEntryType;
  title: string;
  description: string;
  href: string;
  keywords: string[];
  meta?: string;
}

const PAGINE: SearchEntry[] = [
  {
    type: "pagina",
    title: "Quadro generale",
    description:
      "I dati INAIL in sintesi: congiunturale a parità di periodo, media giornaliera dei morti sul lavoro, tassi di incidenza e gravità, serie storica, mappa territoriale, comparti ATECO e benchmark europeo.",
    href: "/",
    keywords: [
      "infortuni",
      "dati inail",
      "congiunturale",
      "media giornaliera morti",
      "incidenza",
      "gravità",
      "serie storica",
      "regioni",
      "mappa",
      "ateco",
      "settori",
      "eurostat",
      "benchmark",
      "europa",
      "macroaree",
      "genere",
      "età",
      "inabilità",
    ],
  },
  {
    type: "pagina",
    title: "Cronaca di infortuni",
    description:
      "Rassegna stampa automatica degli infortuni gravi e mortali sul lavoro in Italia: archivio a 365 giorni, KPI di periodo, mappa regionale e timeline filtrabile per categoria, regione e parole chiave.",
    href: "/cronaca-infortuni",
    keywords: [
      "cronaca",
      "notizie",
      "news",
      "rassegna stampa",
      "mortali",
      "infortuni gravi",
      "timeline",
      "fatti di cronaca",
    ],
  },
  {
    type: "pagina",
    title: "Analisi delle cause",
    description:
      "Analisi dei casi mortali e gravi sul lavoro dell'archivio Infor.MO INAIL 2010-2024: dinamica degli eventi, settori e territori a maggior rischio, profilo dei lavoratori e delle aziende coinvolti. Consulta solo i mortali, solo i gravi o entrambi.",
    href: "/analisi-delle-cause",
    keywords: [
      "cause",
      "morti sul lavoro",
      "decessi",
      "infor.mo",
      "caduta dall'alto",
      "dinamica",
      "vittime",
      "profili",
      "casi mortali",
    ],
  },
  {
    type: "pagina",
    title: "Malattie professionali",
    description:
      "Le malattie professionali denunciate in Italia: denunce mensili, patologie più comuni (rachide, spalla, tunnel carpale), distribuzione territoriale, decessi e tasso di riconoscimento.",
    href: "/malattie-professionali",
    keywords: [
      "malattie professionali",
      "denunce",
      "tecnopatie",
      "rachide",
      "spalla",
      "tunnel carpale",
      "sovraccarico biomeccanico",
      "patologie",
      "riconoscimento",
      "decessi per malattia",
    ],
  },
  {
    type: "pagina",
    title: "Vigilanza",
    description:
      "L'attività di vigilanza sul lavoro in Italia: ispezioni INL, violazioni accertate, lavoro nero, sospensioni, recuperi contributivi e patente a crediti.",
    href: "/vigilanza",
    keywords: [
      "vigilanza",
      "ispezioni",
      "inl",
      "ispettorato",
      "lavoro nero",
      "sommerso",
      "violazioni",
      "sospensioni",
      "recuperi",
      "patente a crediti",
      "controlli",
      "sicurezza",
    ],
  },
  {
    type: "pagina",
    title: "Bandi e finanziamenti",
    description:
      "Bandi e finanziamenti per le imprese che investono in prevenzione e sicurezza sul lavoro: INAIL ISI, fondi interprofessionali, regioni. Scadenze, importi e link ufficiali.",
    href: "/bandi-e-finanziamenti",
    keywords: [
      "bandi",
      "finanziamenti",
      "incentivi",
      "contributi",
      "isi",
      "fondi interprofessionali",
      "fondimpresa",
      "prevenzione",
      "scadenze",
      "ammiato",
      "robotica",
      "macchinari",
    ],
  },
  {
    type: "pagina",
    title: "Costo dell'infortunio",
    description:
      "Stima orientativa dei costi di un infortunio sul lavoro con metodologia e parametri ufficiali INAIL, componenti di costo attivabili e precompilazione per settore e regione.",
    href: "/calcolatore-costo-infortunio",
    keywords: [
      "costo",
      "costi",
      "calcolatore",
      "stima",
      "azienda",
      "danni da lavoro",
      "indennizzo",
      "oneri",
    ],
  },
  {
    type: "pagina",
    title: "Report",
    description:
      "Report brevi sui dati INAIL: infortuni, morti sul lavoro, malattie professionali, vigilanza e cause, con fonti e metodo. Organizzati per aree tematiche con ricerca.",
    href: "/report",
    keywords: [
      "report",
      "approfondimenti",
      "articoli",
      "analisi",
      "dossier",
    ],
  },
  {
    type: "pagina",
    title: "Fonti e metodo",
    description:
      "Registro completo delle fonti: ogni numero pubblicato ha una fonte, una data di estrazione, uno stato e dei limiti dichiarati. Open data di istituzioni e report ufficiali.",
    href: "/fonti",
    keywords: [
      "fonti",
      "fonte",
      "open data",
      "metodologia",
      "registro",
      "stato fonti",
      "istituzioni",
      "dati ufficiali",
    ],
  },
  {
    type: "pagina",
    title: "Il progetto",
    description:
      "Metodologia, architettura, fonti e limiti dell'Osservatorio Infortuni sul Lavoro: come è costruito, chi lo mantiene e come vengono monitorati e verificati i dati.",
    href: "/progetto",
    keywords: [
      "progetto",
      "chi siamo",
      "metodo",
      "architettura",
      "team",
      "agenti",
      "pipeline",
      "controllo qualità",
      "open source",
      "trasparenza",
    ],
  },
];

const REPORT: SearchEntry[] = [
  {
    type: "report",
    title: "Vigilanza sul lavoro in Italia: ispezioni, lavoro nero e violazioni (2021-2025)",
    description:
      "112.768 ispezioni definite nel 2025 e il 74% delle aziende irregolari: controlli INL, lavoratori in nero, sospensioni, violazioni sicurezza e patente a crediti.",
    href: "/report/vigilanza-sul-lavoro",
    keywords: ["vigilanza", "lavoro nero", "ispezioni", "inl", "patente a crediti", "violazioni", "sospensioni"],
    meta: "Sicurezza e vigilanza · 17 ottobre 2026",
  },
  {
    type: "report",
    title: "Malattie professionali più denunciate in Italia (dati 2025-2026)",
    description:
      "98.312 denunce nel 2025, record da 26 anni: le patologie più comuni (rachide, spalla, tunnel carpale), i decessi e perché i numeri crescono.",
    href: "/report/malattie-professionali-piu-denunciate",
    keywords: ["malattie professionali", "denunce", "rachide", "spalla", "tunnel carpale", "record"],
    meta: "Dati e tendenze · 17 ottobre 2026",
  },
  {
    type: "report",
    title: "Lavori più pericolosi in Italia: settori e cause delle morti sul lavoro",
    description:
      "Costruzioni e agricoltura in testa alle morti sul lavoro nei casi Infor.MO (2010-2024): 3.766 casi, la caduta dall'alto come prima causa.",
    href: "/report/lavori-piu-pericolosi-in-italia",
    keywords: ["morti sul lavoro", "infor.mo", "lavori pericolosi", "agricoltura", "costruzioni", "caduta dall'alto"],
    meta: "Sicurezza e vigilanza · 19 ottobre 2026",
  },
  {
    type: "report",
    title: "Infortunio in itinere: cos'è, quando è riconosciuto, quanti casi in Italia",
    description:
      "106.581 denunce in itinere nel 2025. La normativa (art. 12 D.Lgs. 38/2000), i requisiti di riconoscimento e la classifica per regione.",
    href: "/report/infortunio-in-itinere",
    keywords: ["infortunio in itinere", "itinerario", "casa lavoro", "normativa", "d.lgs. 38/2000", "riconoscimento"],
    meta: "Normativa e tutele · 16 ottobre 2026",
  },
  {
    type: "report",
    title: "Relazione annuale INAIL 2025: meno morti sul lavoro, boom di malattie professionali",
    description:
      "1.198 morti sul lavoro (-3,3%), 600.000 denunce di infortunio e 98.312 malattie professionali, record degli ultimi 26 anni. Il PDF ufficiale.",
    href: "/report/relazione-annuale-inail-2025",
    keywords: ["relazione annuale", "inail", "pdf", "camera", "morti", "malattie professionali"],
    meta: "Dati e tendenze · 23 settembre 2026",
  },
  {
    type: "report",
    title: "Infortuni sul lavoro, primo semestre 2026: più denunce, meno casi mortali",
    description:
      "Quanti infortuni sono stati denunciati nei primi sei mesi del 2026? Il confronto con il 2025, la crescita dell'itinere e il calo dei casi mortali.",
    href: "/report/infortuni-1-semestre-2026",
    keywords: ["infortuni", "semestre", "2026", "denunce", "casi mortali", "confronto"],
    meta: "Dati e tendenze · 16 settembre 2026",
  },
];

// Titoli reali delle sezioni/grafici delle pagine, con anchor per andare
// direttamente al grafico. Gli id corrispondono alle sezioni delle pagine.
const GRAFICI: SearchEntry[] = [
  {
    type: "grafico",
    title: "Serie Storica (2014 – 2025)",
    description:
      "Dodici anni di denunce INAIL e casi mortali confrontati con gli occupati ISTAT/Eurostat, dal picco COVID del 2020 al consolidamento post-pandemia.",
    href: "/#serie-storica",
    keywords: ["serie storica", "storico", "andamento", "trend", "dodici anni", "evoluzione", "occupati"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Evoluzione Temporale e Tasso di Incidenza (2020 – 2025)",
    description:
      "L'evoluzione degli infortuni con il tasso di incidenza normalizzato sugli occupati.",
    href: "/#evoluzione-incidenza",
    keywords: ["incidenza", "evoluzione", "tasso", "indice", "normalizzato", "occupati"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Mappa Territoriale e Ranking Regionale: Tasso di Incidenza e Gravità",
    description:
      "La mappa del rischio per regione con incidenza e gravità normalizzate sugli occupati, per confrontare territori di dimensioni diverse.",
    href: "/#mappa-regioni",
    keywords: ["mappa", "regioni", "ranking", "incidenza", "gravità", "territoriale", "rischio", "ranking regionale"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Macro-aree: il rischio per ripartizione geografica",
    description:
      "Il confronto per ripartizione geografica: Nord-Ovest, Nord-Est, Centro, Sud e Isole.",
    href: "/#macro-aree",
    keywords: ["macroaree", "macro-aree", "nord", "sud", "centro", "isole", "ripartizione geografica"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Comparti Produttivi e Attività Economiche (Classificazione ATECO)",
    description:
      "Il rischio per comparto produttivo e attività economica secondo la classificazione ATECO.",
    href: "/#comparti-ateco",
    keywords: ["ateco", "comparti", "settori", "attività economiche", "industria", "edilizia", "agricoltura", "manifattura"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Distribuzione Demografica: Genere e Fasce d'Età",
    description:
      "Chi sono i lavoratori coinvolti negli infortuni: distribuzione per sesso e classi di età.",
    href: "/#distribuzione-demografica",
    keywords: ["genere", "età", "fasce", "demografia", "sesso", "uomini", "donne", "giovani", "anziani", "classi"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Analisi di Gravità del Danno e Durata dell'Inabilità Temporanea",
    description:
      "La gravità media del danno e la durata dell'inabilità temporanea per evento.",
    href: "/#gravita-inabilita",
    keywords: ["gravità", "danno", "inabilità", "durata", "giorni", "assenze", "indennizzo"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Benchmark Internazionale: il confronto con l'Europa",
    description:
      "Il confronto degli infortuni sul lavoro con i paesi europei, dai dati Eurostat ESAW.",
    href: "/#benchmark-europa",
    keywords: ["eurostat", "europa", "benchmark", "internazionale", "confronto", "esaw", "paesi"],
    meta: "Quadro generale",
  },
  {
    type: "grafico",
    title: "Denunce mensili: I semestre 2025 vs 2026",
    description:
      "L'andamento mensile delle denunce di malattie professionali nel confronto tra i primi semestri 2025 e 2026.",
    href: "/malattie-professionali#denunce-mensili",
    keywords: ["denunce mensili", "semestre", "mensile", "2025", "2026", "confronto", "andamento"],
    meta: "Malattie professionali",
  },
  {
    type: "grafico",
    title: "Le patologie più denunciate",
    description:
      "Le malattie professionali più frequenti: rachide, spalla, tunnel carpale e altre patologie muscolo-scheletriche.",
    href: "/malattie-professionali#patologie-comuni",
    keywords: ["patologie", "rachide", "spalla", "tunnel carpale", "muscolo-scheletriche", "denunciate", "più frequenti"],
    meta: "Malattie professionali",
  },
  {
    type: "grafico",
    title: "Distribuzione territoriale delle denunce",
    description:
      "Le denunce di malattie professionali per regione e territorio.",
    href: "/malattie-professionali#distribuzione-territoriale",
    keywords: ["territoriale", "regioni", "territorio", "distribuzione", "denunce"],
    meta: "Malattie professionali",
  },
  {
    type: "grafico",
    title: "Decessi per malattia professionale riconosciuta",
    description:
      "I decessi riconosciuti come conseguenza di malattia professionale.",
    href: "/malattie-professionali#decessi-malattia",
    keywords: ["decessi", "morti", "malattia professionale", "riconosciuta", "esiti mortali"],
    meta: "Malattie professionali",
  },
  {
    type: "grafico",
    title: "Quante denunce vengono riconosciute?",
    description:
      "L'esito delle denunce di malattia professionale: quante vengono riconosciute e quante no.",
    href: "/malattie-professionali#riconoscimento-denunce",
    keywords: ["riconoscimento", "esiti", "denunce", "percentuale", "definite", "riconosciute"],
    meta: "Malattie professionali",
  },
  {
    type: "grafico",
    title: "L'attività di vigilanza in numeri",
    description:
      "La sintesi dell'attività di vigilanza INL: ispezioni, personale e indicatori principali.",
    href: "/vigilanza#vigilanza-in-numeri",
    keywords: ["vigilanza", "ispezioni", "numeri", "sintesi", "kpi", "inl"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Serie Storica quinquennio (2021 – 2025)",
    description:
      "L'andamento quinquennale dell'attività di vigilanza: ispezioni, violazioni e sanzioni dal 2021 al 2025.",
    href: "/vigilanza#serie-vigilanza",
    keywords: ["serie storica", "quinquennio", "vigilanza", "2021", "2025", "andamento"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Violazioni accertate e lavoro sommerso",
    description:
      "Le violazioni accertate, i lavoratori irregolari e il lavoro nero emersi dalle ispezioni.",
    href: "/vigilanza#violazioni-sommerso",
    keywords: ["violazioni", "lavoro nero", "sommerso", "irregolari", "accertate"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Le tipologie di violazioni registrate",
    description:
      "Le diverse tipologie di violazioni della sicurezza sul lavoro registrate dagli ispettori.",
    href: "/vigilanza#tipologie-violazioni",
    keywords: ["tipologie", "violazioni", "sicurezza", "registrate", "classificazione"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Recuperi, sommerso e patente a crediti",
    description:
      "I recuperi contributivi e premi evasi, il lavoro sommerso e l'andamento della patente a crediti.",
    href: "/vigilanza#recuperi-patente",
    keywords: ["recuperi", "contributi", "premi evasi", "sommerso", "patente a crediti", "rilasciate", "revocate"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Sospensioni per settore: la serie completa",
    description:
      "Le sospensioni dell'attività imprenditoriale per settore, con il massimo storico del 2024.",
    href: "/vigilanza#sospensioni-settore",
    keywords: ["sospensioni", "settore", "serie", "attività imprenditoriale"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Perché si sospende: le casistiche delle gravi violazioni SSL",
    description:
      "Le casistiche delle gravi violazioni di salute e sicurezza sul lavoro che portano alla sospensione.",
    href: "/vigilanza#casistiche-sospensioni",
    keywords: ["casistiche", "sospensioni", "violazioni", "ssl", "gravi", "salute e sicurezza"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Dove si viola di più la sicurezza",
    description:
      "Le violazioni della sicurezza per settore e codice ATECO.",
    href: "/vigilanza#violazioni-per-settore",
    keywords: ["violazioni", "sicurezza", "settori", "ateco", "dove"],
    meta: "Vigilanza",
  },
  {
    type: "grafico",
    title: "Infortuni mortali: totale denunciato e casi analizzati",
    description:
      "La copertura dell'archivio Infor.MO: il totale dei casi mortali denunciati e quelli analizzati con la scheda di dettaglio.",
    href: "/analisi-delle-cause#copertura-archivio",
    keywords: ["infortuni mortali", "casi analizzati", "copertura", "archivio", "denunciati", "totale"],
    meta: "Analisi delle cause",
  },
  {
    type: "grafico",
    title: "Perché si muore: tipologie di incidente",
    description:
      "La classificazione INAIL della dinamica degli incidenti mortali: la caduta dall'alto come prima causa.",
    href: "/analisi-delle-cause#tipologie-incidente",
    keywords: ["incidente", "dinamica", "cause", "tipologie", "caduta dall'alto", "perché si muore"],
    meta: "Analisi delle cause",
  },
  {
    type: "grafico",
    title: "Dove avvengono i casi mortali",
    description:
      "I settori e le attività economiche in cui avvengono i casi mortali, classificazione INAIL.",
    href: "/analisi-delle-cause#settori-casi-mortali",
    keywords: ["settori", "attività economica", "casi mortali", "dove avvengono", "classificazione"],
    meta: "Analisi delle cause · I settori",
  },
  {
    type: "grafico",
    title: "Dove avvengono i casi mortali: il territorio",
    description:
      "La localizzazione dei casi mortali per macro-area: Nord-Ovest, Nord-Est, Centro, Sud e Isole.",
    href: "/analisi-delle-cause#territorio-casi-mortali",
    keywords: ["territorio", "macro-aree", "nord-ovest", "nord-est", "isole", "localizzazione", "casi mortali"],
    meta: "Analisi delle cause · Il territorio",
  },
  {
    type: "grafico",
    title: "Profilo di chi muore",
    description:
      "Le popolazioni a rischio e le mansioni più coinvolte nei casi mortali: anziani, stranieri, irregolari, giovani.",
    href: "/analisi-delle-cause#profilo-vittime",
    keywords: ["profilo", "vittime", "popolazioni a rischio", "anziani", "stranieri", "irregolari", "mansioni", "lavoratori"],
    meta: "Analisi delle cause",
  },
  {
    type: "grafico",
    title: "Analisi per dimensione aziendale",
    description:
      "Microimprese, piccole, medie e grandi aziende hanno profili di rischio diversi: dinamiche e settori per anno.",
    href: "/analisi-delle-cause#dimensione-aziendale",
    keywords: ["dimensione aziendale", "microimprese", "piccole", "medie", "grandi", "aziende", "profilo di rischio"],
    meta: "Analisi delle cause",
  },
  {
    type: "grafico",
    title: "Cerca nella dinamica",
    description:
      "La lettura caso per caso dei casi mortali: cerca nella dinamica dell'evento.",
    href: "/analisi-delle-cause#cerca-dinamica",
    keywords: ["cerca", "dinamica", "casi", "esplora", "lettura", "caso per caso"],
    meta: "Analisi delle cause",
  },
  {
    type: "grafico",
    title: "Il costo di un infortunio: azienda, Stato e collettività",
    description:
      "I KPI ufficiali INAIL del costo di un infortunio sul lavoro per l'azienda, lo Stato e la collettività.",
    href: "/calcolatore-costo-infortunio#costo-infortunio",
    keywords: ["costo", "kpi", "azienda", "stato", "collettività", "danni da lavoro"],
    meta: "Costo dell'infortunio",
  },
  {
    type: "grafico",
    title: "Come usarlo",
    description:
      "Le istruzioni per usare il calcolatore del costo dell'infortunio.",
    href: "/calcolatore-costo-infortunio#come-usarlo",
    keywords: ["come usare", "istruzioni", "calcolatore", "guida"],
    meta: "Costo dell'infortunio",
  },
  {
    type: "grafico",
    title: "Come leggere il risultato",
    description:
      "Come interpretare il risultato del calcolo del costo di un infortunio.",
    href: "/calcolatore-costo-infortunio#come-leggere",
    keywords: ["leggere", "risultato", "interpretazione", "spiegazione"],
    meta: "Costo dell'infortunio",
  },
  {
    type: "grafico",
    title: "Bandi in evidenza",
    description:
      "L'elenco dei bandi e finanziamenti in evidenza per la prevenzione e sicurezza sul lavoro.",
    href: "/bandi-e-finanziamenti#bandi-in-evidenza",
    keywords: ["bandi", "evidenza", "elenco", "isi", "finanziamenti", "attivi"],
    meta: "Bandi e finanziamenti",
  },
  {
    type: "grafico",
    title: "La cronaca giorno per giorno",
    description:
      "La timeline della cronaca degli infortuni gravi e mortali, filtrabile per categoria, regione e periodo.",
    href: "/cronaca-infortuni#cronaca-giorno",
    keywords: ["timeline", "cronaca", "giorno", "eventi", "rassegna"],
    meta: "Cronaca di infortuni",
  },
  {
    type: "grafico",
    title: "Cronaca e dati ufficiali: due piani diversi",
    description:
      "Perché i numeri della cronaca non sostituiscono i dati ufficiali INAIL: la distinzione tra i due piani.",
    href: "/cronaca-infortuni#cronaca-dati-ufficiali",
    keywords: ["cronaca", "dati ufficiali", "inail", "differenza", "distinzione", "metodo"],
    meta: "Cronaca di infortuni",
  },
];

function buildBandi(): SearchEntry[] {
  return BANDI_PREVENZIONE.map((b) => ({
    type: "bando" as const,
    title: b.titolo,
    description: b.descrizione,
    href: "/bandi-e-finanziamenti",
    keywords: [b.ente, b.regione, b.stato, b.dotazione ?? "", b.note ?? ""]
      .filter((k) => k.length > 2)
      .map((k) => k.toLowerCase()),
    meta: `${b.ente} · ${b.regione} · ${b.stato}`,
  }));
}

function buildFonti(): SearchEntry[] {
  return Object.values(SOURCES).map((f) => ({
    type: "fonte" as const,
    title: f.owner,
    description: f.coverage,
    href: "/fonti",
    keywords: [f.area, f.format, f.frequency, f.owner]
      .filter((k) => k.length > 2)
      .map((k) => k.toLowerCase()),
    meta: f.area,
  }));
}

export const SEARCH_INDEX: SearchEntry[] = [
  ...PAGINE,
  ...REPORT,
  ...GRAFICI,
  ...buildBandi(),
  ...buildFonti(),
];

/** Normalizza per la ricerca: minuscole e senza accenti. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface ScoredEntry {
  entry: SearchEntry;
  score: number;
}

/** Punteggio di rilevanza: AND sui termini, peso maggiore su titolo e keyword. */
export function scoreEntries(query: string, entries = SEARCH_INDEX): ScoredEntry[] {
  const terms = fold(query)
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (terms.length === 0) return [];

  const out: ScoredEntry[] = [];
  for (const entry of entries) {
    const title = fold(entry.title);
    const desc = fold(entry.description);
    const kw = fold(entry.keywords.join(" "));
    const meta = fold(entry.meta ?? "");
    let total = 0;
    let ok = true;
    for (const t of terms) {
      let s = 0;
      if (title.includes(t)) s = 80 + (title.startsWith(t) ? 20 : 0);
      else if (kw.includes(t)) s = 60;
      else if (desc.includes(t)) s = 30;
      else if (meta.includes(t)) s = 15;
      if (s === 0) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok && total > 0) out.push({ entry, score: total });
  }
  return out.sort((a, b) => b.score - a.score);
}

const PESO_TIPO: Record<SearchEntryType, number> = {
  pagina: 100,
  grafico: 95,
  report: 80,
  bando: 60,
  fonte: 50,
};

export function withTypeWeight(scored: ScoredEntry[]): ScoredEntry[] {
  return scored
    .map((s) => ({ ...s, score: s.score + PESO_TIPO[s.entry.type] }))
    .sort((a, b) => b.score - a.score);
}