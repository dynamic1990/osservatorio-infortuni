// Client loader e tipi per il dataset Malattie Professionali INAIL
// (generato da scripts/etl/malattie_professionali_etl.py)

import data from "@/data/generated/malattie-professionali.json";

export interface ConfrontoSemestre {
  anno2025: number;
  anno2026: number;
  delta: number;
  deltaPerc: number | null;
}

export interface SerieMensileItem {
  anno: string;
  mese: number;
  meseNome: string;
  casi: number;
  maschi: number;
  femmine: number;
}

export interface TopCodice {
  codice: string;
  casi: number;
}

export interface CategoriaPatologia {
  key: string;
  nome: string;
  casi: number;
  quota: number;
  anno2025: number;
  anno2026: number;
  maschi: number;
  femmine: number;
  quotaMaschi: number | null;
  topCodici: TopCodice[];
}

export interface RegioneMalattie {
  codice: string;
  nome: string;
  totale: number;
  anno2025: number;
  anno2026: number;
  deltaPerc: number | null;
  maschi: number;
  femmine: number;
  quotaMaschi: number | null;
}

export interface DecessiPerAnno {
  anno: string;
  casi: number;
  silicosiAsbestosi: number;
  maschi: number;
  femmine: number;
}

export interface DecessiPerRegione {
  codice: string;
  nome: string;
  casi: number;
}

export interface DatasetMalattieProfessionali {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  periodo: string;
  nota: string;
  fonte: string;
  nazionale: {
    totale: number;
    perAnno: Record<string, number>;
    perGenere: Record<string, number>;
    confrontoPrimoSemestre: ConfrontoSemestre;
    serieMensile: SerieMensileItem[];
  };
  categorie: CategoriaPatologia[];
  regioni: RegioneMalattie[];
  decessi: {
    totale: number;
    perAnno: DecessiPerAnno[];
    perRegione: DecessiPerRegione[];
    perRegioneAnno: Record<string, DecessiPerRegione[]>;
    perGenere: Record<string, number>;
    etaMedia: number | null;
  };
}

export function getMalattieProfessionaliData(): DatasetMalattieProfessionali {
  return data as unknown as DatasetMalattieProfessionali;
}
