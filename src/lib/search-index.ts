// Indice di ricerca globale del sito.
// Fonti dell'indice: pagine statiche, report, argomenti trasversali,
// bandi (data/bandi-prevenzione.ts) e fonti (lib/sources.ts).
// Le news della cronaca NON stanno qui: sono 300+ e vengono caricate
// lazy dal componente di ricerca.

import { BANDI_PREVENZIONE } from "@/data/bandi-prevenzione";
import { SOURCES } from "@/lib/sources";

export type SearchEntryType =
  | "pagina"
  | "report"
  | "argomento"
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
      "Analisi dei casi mortali sul lavoro dell'archivio Infor.MO INAIL 2014-2024: dinamica degli eventi, settori e territori a maggior rischio, profilo dei lavoratori e delle aziende coinvolti.",
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
      "Agricoltura e costruzioni in testa alle morti sul lavoro nei casi Infor.MO (2014-2024): 2.617 casi, la caduta dall'alto come prima causa.",
    href: "/report/lavori-piu-pericolosi-in-italia",
    keywords: ["morti sul lavoro", "infor.mo", "lavori pericolosi", "agricoltura", "costruzioni", "caduta dall'alto"],
    meta: "Sicurezza e vigilanza · 16 ottobre 2026",
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

const ARGOMENTI: SearchEntry[] = [
  {
    type: "argomento",
    title: "Tasso di incidenza e gravità per regione",
    description: "Mappa del rischio territoriale e ranking regionale degli infortuni sul lavoro.",
    href: "/",
    keywords: ["incidenza", "gravità", "regioni", "mappa", "ranking", "rischio territoriale", "occupati"],
  },
  {
    type: "argomento",
    title: "Serie storica degli infortuni (2014-2025)",
    description: "Andamento delle denunce di infortunio sul lavoro negli ultimi dodici anni.",
    href: "/",
    keywords: ["serie storica", "storico", "andamento", "trend", "anni", "evoluzione"],
  },
  {
    type: "argomento",
    title: "Benchmark europeo Eurostat",
    description: "Il confronto internazionale degli infortuni sul lavoro con l'Europa.",
    href: "/",
    keywords: ["eurostat", "europa", "benchmark", "internazionale", "confronto", "esaw"],
  },
  {
    type: "argomento",
    title: "Comparti produttivi e attività economiche ATECO",
    description: "Il rischio per settore di attività economica secondo la classificazione ATECO.",
    href: "/",
    keywords: ["ateco", "comparti", "settori", "attività economiche", "industria", "edilizia", "agricoltura"],
  },
  {
    type: "argomento",
    title: "Distribuzione per genere e fasce d'età",
    description: "Chi sono i lavoratori coinvolti negli infortuni: sesso, età e durata dell'inabilità.",
    href: "/",
    keywords: ["genere", "età", "fasce", "demografia", "uomini", "donne", "inabilità", "giovani", "anziani"],
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
  ...ARGOMENTI,
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
  argomento: 90,
  report: 80,
  bando: 60,
  fonte: 50,
};

export function withTypeWeight(scored: ScoredEntry[]): ScoredEntry[] {
  return scored
    .map((s) => ({ ...s, score: s.score + PESO_TIPO[s.entry.type] }))
    .sort((a, b) => b.score - a.score);
}