import type { SourceId } from "./sources";

export type SourceDataState = "verified" | "manual-review" | "planned";

export interface SourceStatus {
  sourceId: SourceId;
  dataState: SourceDataState;
  label: string;
  period: string;
  extractedAt?: string;
  checkedAt: string;
  /**
   * Solo per le fonti senza snapshot datato (es. archivio in aggiornamento
   * continuo). Per tutte le altre la freschezza è calcolata dalla data di
   * estrazione: un testo scritto a mano ("estratto oggi") invecchia da solo e
   * diventa falso il giorno dopo.
   */
  freshnessNote?: string;
  snapshotPath?: string;
  note: string;
}

export interface SourceStatusResolved extends Omit<SourceStatus, "freshnessNote"> {
  freshness: string;
  ageDays: number | null;
}

function giorniDa(iso: string, now: Date): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 86_400_000));
}

function etichettaFreschezza(giorni: number | null): string {
  if (giorni === null) return "data di estrazione non disponibile";
  if (giorni === 0) return "estratto oggi";
  if (giorni === 1) return "estratto ieri";
  if (giorni < 30) return `estratto ${giorni} giorni fa`;
  const mesi = Math.round(giorni / 30);
  return `estratto circa ${mesi} ${mesi === 1 ? "mese" : "mesi"} fa`;
}

// Stato dichiarativo del repository, non probe live. Le date sono aggiornate
// insieme allo snapshot o all'audit, mai inventate durante il rendering.
export const SOURCE_STATUS: SourceStatus[] = [
  {
    sourceId: "inail-infortuni-mensile",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "Gennaio–settembre 2025 e 2026, tutte le 20 regioni",
    extractedAt: "2026-11-11T06:00:00+00:00",
    checkedAt: "2026-11-11",
    freshnessNote: "CSV regionali INAIL, vintage 30/09/2026",
    snapshotPath: "src/data/generated/inail-congiunturale-pari-perimetro.json",
    note: "La pubblicazione usa aggregazioni, non record individuali. Ogni anno è letto alla propria rilevazione: confronto a pari ritardo, non su dati definitivi.",
  },
  {
    sourceId: "inail-serie-storica",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2021–2025 consolidato, più congiuntura 2025-2026",
    extractedAt: "2026-11-11T08:25:25+00:00",
    checkedAt: "2026-11-11",
    snapshotPath: "src/data/generated/inail-infortuni-serie.meta.json",
    note: "Il periodo di riferimento è distinto dalla data di estrazione. La serie ufficiale pre-2020 vive nel dataset decennale.",
  },
  {
    sourceId: "inail-malattie-mensile",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "Gennaio–settembre 2025 e 2026",
    extractedAt: "2026-11-11T07:04:24+00:00",
    checkedAt: "2026-11-11",
    freshnessNote: "denunce protocollate fino a settembre 2026",
    snapshotPath: "src/data/generated/malattie-professionali.json",
    note: "La regione indica la sede di protocollazione INAIL, non il luogo di lavoro.",
  },
  {
    sourceId: "inail-infortuni-semestrale",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2021–2025, tutte le regioni (20/20)",
    extractedAt: "2026-11-02T13:00:00+00:00",
    checkedAt: "2026-11-02",
    freshnessNote: "archivi CSV INAIL, livello record",
    snapshotPath: "src/data/generated/inail-infortuni-settimana.json",
    note: "Archivi CSV regionali, livello record: nessuna regione mancante e data di accadimento completa. Usata per la distribuzione per giorno della settimana; la fonte non espone l'ora.",
  },
  {
    sourceId: "inail-infor-mo-mortali",
    dataState: "manual-review",
    label: "Revisione manuale",
    period: "Archivio Informo, casi con scheda di analisi",
    checkedAt: "2026-10-19",
    freshnessNote: "aggiornamento continuo della fonte, senza snapshot temporale unico",
    note: "Non è l'anagrafe ufficiale delle denunce e non copre i casi privi di scheda. La quota rispetto alle denunce nazionali è calcolata sul solo 2014-2024, l'intervallo in cui esistono entrambi i dati.",
  },
  {
    sourceId: "eurostat-esaw",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2014–2023, benchmark europeo",
    extractedAt: "2026-08-29T09:40:48+00:00",
    checkedAt: "2026-09-14",
    freshnessNote: "cadenza annuale",
    snapshotPath: "src/data/generated/eurostat-benchmark.json",
    note: "Tasso standardizzato per 100.000 occupati, non confrontabile con i conteggi assoluti INAIL.",
  },
  {
    sourceId: "istat-eurostat-occupati",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2020–2025, occupati 15–64",
    checkedAt: "2026-09-23",
    freshnessNote: "cadenza trimestrale e annuale",
    snapshotPath: "src/data/generated/occupati-regione.json",
    note: "Usato come denominatore per gli indici di incidenza.",
  },
  {
    sourceId: "inl-rapporti-vigilanza",
    dataState: "verified",
    label: "Snapshot verificato",
    period: "2021–2025, rapporto annuale",
    extractedAt: "2026-09-03T14:45:00+00:00",
    checkedAt: "2026-09-14",
    freshnessNote: "cadenza annuale",
    snapshotPath: "src/data/generated/vigilanza-inl.json",
    note: "Il potenziamento della vigilanza dal 2023 incide sui volumi accertati.",
  },
  {
    sourceId: "google-news-rss",
    dataState: "manual-review",
    label: "Rassegna stampa automatica",
    period: "Finestra di raccolta 30 giorni, archivio fino a 365",
    extractedAt: "2026-11-11T21:35:00+00:00",
    checkedAt: "2026-11-11",
    freshnessNote: "aggiornamento quotidiano",
    snapshotPath: "src/data/generated/news-infortuni.json",
    note: "È escluso dall'audit mensile delle fonti ufficiali e non sostituisce le statistiche INAIL. La copertura reale dell'archivio è dichiarata nel dataset (campo copertura).",
  },
];

export function getSourceStatus(sourceId: SourceId, now = new Date()): SourceStatusResolved | undefined {
  const base = SOURCE_STATUS.find((status) => status.sourceId === sourceId);
  if (!base) return undefined;
  const ageDays = base.extractedAt ? giorniDa(base.extractedAt, now) : null;
  const parti = [etichettaFreschezza(ageDays)];
  if (base.freshnessNote) parti.push(base.freshnessNote);
  return { ...base, ageDays, freshness: parti.join(" · ") };
}
