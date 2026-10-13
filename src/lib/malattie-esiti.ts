// Client loader e tipi per il dataset Esiti Malattie Professionali
// (generato da scripts/etl/estrai_esiti_malattie.py dalla Relazione Annuale INAIL)

import data from "@/data/generated/malattie-esiti.json";

export interface EsitiPerPatologia {
  patologia: string;
  tasso: string;
}

export interface DatasetEsitiMalattie {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  fonte: string;
  dataRilevazione: string;
  nota: string;
  denunce: Record<string, number>;
  lavoratoriCoinvolti: Record<string, number>;
  esiti2025: {
    denunce: number;
    riconosciute: number;
    inIstruttoriaNota: string;
  };
  casiDefiniti2021_2025: {
    riconosciutePerc: number;
    nonRiconosciutePerc: number;
    nota: string;
  };
  istruttoriaUltimoAnnoPerc: number;
  perPatologia: EsitiPerPatologia[];
  denuncePlurime: {
    denunce2025: number;
    lavoratori2025: number;
    nota: string;
  };
}

export function getEsitiMalattieData(): DatasetEsitiMalattie {
  return data as unknown as DatasetEsitiMalattie;
}