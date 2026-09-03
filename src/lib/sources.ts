// Source registry: descrive ogni fonte integrata.
// È il punto di partenza per provenienza e monitoring (vedi docs/ARCHITECTURE.md).

export type SourceId =
  | "inail-infortuni-mensile"
  | "inail-infortuni-semestrale"
  | "inail-malattie-mensile"
  | "inail-malattie-semestrale"
  | "inail-serie-storica"
  | "eurostat-esaw"
  | "google-news-rss"
  | "istat-eurostat-occupati"
  | "inl-rapporti-vigilanza";

export interface SourceInfo {
  id: SourceId;
  owner: string;
  area: string;
  landingUrl: string;
  apiUrl: string;
  format: string;
  coverage: string;
  frequency: string;
  status: "active" | "planned";
  notes?: string;
}

export const SOURCES: Record<SourceId, SourceInfo> = {
  "inail-infortuni-mensile": {
    id: "inail-infortuni-mensile",
    owner: "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
    area: "Infortuni sul lavoro",
    landingUrl: "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-mensile.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni",
    format: "JSON (REST)",
    coverage: "Record singoli pseudonimizzati; Regione, AnnoAccadimento, MeseAccadimento obbligatori",
    frequency: "Mensile",
    status: "active",
    notes: "Esclude definizione amministrativa, indennizzo e giorni indennizzati (solo semestrale)",
  },
  "inail-infortuni-semestrale": {
    id: "inail-infortuni-semestrale",
    owner: "INAIL",
    area: "Infortuni sul lavoro",
    landingUrl: "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-semestrale.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni",
    format: "JSON (REST)",
    coverage: "Come mensile + definizione amministrativa, esito mortale, indennizzo",
    frequency: "Semestrale",
    status: "planned",
    notes: "Parametro Regione accetta valori particolari; da testare",
  },
  "inail-malattie-mensile": {
    id: "inail-malattie-mensile",
    owner: "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
    area: "Malattie professionali",
    landingUrl: "https://dati.inail.it/portale/it/dataset/malattie-professionali/dati-con-cadenza-mensile.html",
    apiUrl: "https://dati.inail.it/opendata/downloads/datimensilimalattieprofessionali/csv/DatiMensiliMalattieProfessionaliDataProt<Regione>.csv",
    format: "CSV (download diretto per regione)",
    coverage: "Denunce protocollate per regione; copertura gen-giu 2025 e gen-giu 2026 (finestra semestrale)",
    frequency: "Semestrale",
    status: "active",
    notes: "La regione è la sede INAIL di protocollazione, non il luogo di lavoro. Tre regioni composte non sono interrogabili via API ma hanno il CSV dedicato.",
  },
  "inail-malattie-semestrale": {
    id: "inail-malattie-semestrale",
    owner: "INAIL",
    area: "Malattie professionali",
    landingUrl: "https://dati.inail.it/portale/it/dataset/malattie-professionali/dati-con-cadenza-semestrale.html",
    apiUrl: "https://dati.inail.it/opendata/downloads/datisemestralimalattieprofessionali/csv/DatiSemestraliMalattieProfessionaliDataDec<Regione>.csv",
    format: "CSV (download diretto per regione)",
    coverage: "Decessi per malattia professionale riconosciuta (DataDec), per anno di morte 2020-2024",
    frequency: "Semestrale",
    status: "active",
    notes: "Dataset DataDec (decisione): decessi con età, genere e indicatore silicosi/asbestosi. Usato per la sezione decessi della pagina Malattie Professionali.",
  },
  "inail-serie-storica": {
    id: "inail-serie-storica",
    owner: "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
    area: "Serie storica infortuni (2014-2024)",
    landingUrl: "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni",
    format: "PDF pubblicazioni + JSON (REST)",
    coverage: "Denunce totali e casi mortali nazionali 2014-2019 (serie storica ufficiale); microdati 2020-2024",
    frequency: "Annuale",
    status: "active",
    notes: "Serie consolidata per la vista decennale; il dato 2020 include i casi COVID riconosciuti come infortunio",
  },
  "eurostat-esaw": {
    id: "eurostat-esaw",
    owner: "Eurostat – European Statistics on Accidents at Work (ESAW)",
    area: "Benchmark internazionale infortuni mortali",
    landingUrl: "https://ec.europa.eu/eurostat/databrowser/view/hsw_mi01/default/table?lang=it",
    apiUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hsw_mi01",
    format: "JSON (JSON-stat API)",
    coverage: "Tasso di incidenza standardizzato per 100.000 occupati, infortuni mortali, EU-27 e stati membri",
    frequency: "Annuale",
    status: "active",
    notes: "La standardizzazione elimina l'effetto della struttura demografica: confronto equo tra paesi",
  },
  "google-news-rss": {
    id: "google-news-rss",
    owner: "Google News RSS (aggregazione automatica)",
    area: "Cronaca infortuni mortali e gravi",
    landingUrl: "https://news.google.com/",
    apiUrl: "https://news.google.com/rss/search",
    format: "XML (RSS)",
    coverage: "Ultimi 7 giorni, query su infortuni sul lavoro in Italia",
    frequency: "Giornaliero (06:00)",
    status: "active",
    notes: "Classificazione automatica per parole chiave; ogni voce rimanda alla fonte originale. Non sostituisce i dati ufficiali INAIL.",
  },
  "istat-eurostat-occupati": {
    id: "istat-eurostat-occupati",
    owner: "ISTAT / Eurostat – Labour Force Survey",
    area: "Denominatori occupati 15-64",
    landingUrl: "https://ec.europa.eu/eurostat/databrowser/view/lfst_r_lfe2emp/default/table?lang=it",
    apiUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/lfst_r_lfe2emp",
    format: "JSON (JSON-stat API)",
    coverage: "Occupati 15-64 Italia 2014-2024 (migliaia)",
    frequency: "Trimestrale/annuale",
    status: "active",
    notes: "Usati come denominatore per indici di incidenza e serie storica",
  },
  "inl-rapporti-vigilanza": {
    id: "inl-rapporti-vigilanza",
    owner: "INL – Ispettorato Nazionale del Lavoro",
    area: "Vigilanza sul lavoro e previdenziale",
    landingUrl: "https://www.ispettorato.gov.it/attivita-studi-e-statistiche/monitoraggio-e-report/rapporti-annuali-sullattivita-di-vigilanza-in-materia-di-lavoro-e-previdenziale/",
    apiUrl: "https://www.ispettorato.gov.it/files/2026/04/INL-Relazione-annuale-e-rapporto-vigilanza-2025.pdf",
    format: "PDF (rapporti annuali)",
    coverage: "Controlli avviati INL/INPS/INAIL, ispezioni definite, tasso di irregolarità, lavoratori irregolari e in nero, sospensioni art. 14, violazioni sicurezza, recupero contributi 2021-2025",
    frequency: "Annuale",
    status: "active",
    notes: "Rapporti redatti ai sensi dell'art. 20 Convenzione OIL n. 81 e art. 13 co. 7-bis D.Lgs. 81/2008. Il potenziamento della vigilanza dal 2023 incide sui volumi accertati.",
  },
};

export function listSources(): SourceInfo[] {
  return Object.values(SOURCES);
}
