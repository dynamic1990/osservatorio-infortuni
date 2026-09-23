import type { SourceId } from "./sources";

export type SourceDataState = "verified" | "manual-review" | "planned";

export interface SourceStatus {
  sourceId: SourceId;
  dataState: SourceDataState;
  label: string;
  period: string;
  extractedAt?: string;
  checkedAt: string;
  freshness: string;
  snapshotPath?: string;
  note: string;
}

// Stato dichiarativo del repository, non probe live. Le date sono aggiornate
// insieme allo snapshot o all'audit, mai inventate durante il rendering.
export const SOURCE_STATUS: SourceStatus[] = [
  {
    sourceId: "inail-infortuni-mensile",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "Gennaio–giugno 2026, confronto omogeneo con 2025",
    extractedAt: "2026-08-27T00:30:00+00:00",
    checkedAt: "2026-09-14",
    freshness: "18 giorni dall'ultima estrazione",
    snapshotPath: "src/data/generated/inail-congiunturale-pari-perimetro.json",
    note: "La pubblicazione usa aggregazioni, non record individuali.",
  },
  {
    sourceId: "inail-serie-storica",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2020–2025, serie consolidata",
    extractedAt: "2026-08-27T00:30:00+00:00",
    checkedAt: "2026-09-14",
    freshness: "18 giorni dall'ultima estrazione",
    snapshotPath: "src/data/generated/inail-infortuni-serie.meta.json",
    note: "Il periodo di riferimento è distinto dalla data di estrazione.",
  },
  {
    sourceId: "inail-malattie-mensile",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "Gennaio–giugno 2025 e 2026",
    extractedAt: "2026-08-27T00:30:00+00:00",
    checkedAt: "2026-09-14",
    freshness: "18 giorni dall'ultima estrazione",
    snapshotPath: "src/data/generated/malattie-professionali.json",
    note: "La regione indica la sede di protocollazione INAIL, non il luogo di lavoro.",
  },
  {
    sourceId: "inail-infortuni-semestrale",
    dataState: "planned",
    label: "In pianificazione",
    period: "Non ancora pubblicato come vista dedicata",
    checkedAt: "2026-09-14",
    freshness: "Nessuno snapshot pubblicato",
    note: "La fonte è registrata, ma il parametro Regione richiede ancora una verifica dedicata.",
  },
  {
    sourceId: "inail-infor-mo-mortali",
    dataState: "manual-review",
    label: "Revisione manuale",
    period: "Archivio Informo, casi con scheda di analisi",
    checkedAt: "2026-09-14",
    freshness: "Aggiornamento continuo, senza snapshot temporale unico",
    note: "Non è l'anagrafe ufficiale delle denunce e non copre i casi privi di scheda.",
  },
  {
    sourceId: "eurostat-esaw",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2014–2024, benchmark europeo",
    checkedAt: "2026-09-14",
    freshness: "Cadenza annuale",
    snapshotPath: "src/data/generated/eurostat-benchmark.json",
    note: "Tasso standardizzato per 100.000 occupati, non confrontabile con i conteggi assoluti INAIL.",
  },
  {
    sourceId: "istat-eurostat-occupati",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2014–2024, occupati 15–64",
    checkedAt: "2026-09-14",
    freshness: "Cadenza trimestrale/annuale",
    snapshotPath: "src/data/generated/occupati-regione.json",
    note: "Usato come denominatore per gli indici di incidenza.",
  },
  {
    sourceId: "inl-rapporti-vigilanza",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2021–2025, rapporto annuale",
    checkedAt: "2026-09-14",
    freshness: "Cadenza annuale",
    snapshotPath: "src/data/generated/vigilanza-inl.json",
    note: "Il potenziamento della vigilanza dal 2023 incide sui volumi accertati.",
  },
  {
    sourceId: "google-news-rss",
    dataState: "manual-review",
    label: "Radar automatico",
    period: "Ultimi 7 giorni dalla raccolta",
    checkedAt: "2026-09-14",
    freshness: "Aggiornamento quotidiano",
    snapshotPath: "src/data/generated/news-infortuni.json",
    note: "È escluso dall'audit mensile delle fonti ufficiali e non sostituisce le statistiche INAIL.",
  },
];

export function getSourceStatus(sourceId: SourceId): SourceStatus | undefined {
  return SOURCE_STATUS.find((status) => status.sourceId === sourceId);
}
