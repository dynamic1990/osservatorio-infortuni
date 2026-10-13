// Client loader e tipi per il dataset Esiti Malattie Professionali
// (generato da scripts/etl/estrai_esiti_malattie.py dagli open data INAIL
// DatiSemestraliMalattieProfessionaliDataProt: conteggio preciso alla rilevazione)

import data from "@/data/generated/malattie-esiti.json";

export interface EsitoAnno {
  anno: string;
  riconosciute: number;
  rigettate: number;
  inIstruttoria: number;
  riconosciutePerc: number;
  rigettatePerc: number;
}

export interface DatasetEsitiMalattie {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  dataRilevazione: string;
  nota: string;
  denuncePerAnno: EsitoAnno[];
  "2025": {
    anno: string;
    denunce: number;
    riconosciute: number;
    rigettate: number;
    inIstruttoria: number;
    definite: number;
    riconosciutePerc: number;
    rigettatePerc: number;
  } | null;
  istruttoriaPerc2025: number | null;
  lavoratoriCoinvolti: { "2025": number };
  perPatologia: null;
}

export function getEsitiMalattieData(): DatasetEsitiMalattie {
  return data as unknown as DatasetEsitiMalattie;
}