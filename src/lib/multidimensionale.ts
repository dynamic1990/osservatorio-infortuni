// Client loader e interfacce per i dati multidimensionali INAIL consolidati

export interface RegioneAnnualData {
  regione: string;
  totale: number;
  lavoro: number;
  itinere: number;
  mortali: number;
  menomati: number;
  giorni: number;
  casiConGiorni?: number;
  durataMedia?: number;
  indiceGravita?: number;
  occupati: number;
  indiceIncidenza: number;
  indiceMortali: number;
}

export interface ProvinciaAutonomaData {
  codice: string;
  nome: string;
  totale: number;
  lavoro: number;
  itinere: number;
  mortali: number;
  menomati: number;
  giorni: number;
  casiConGiorni?: number;
  durataMedia?: number;
  indiceGravita?: number;
  occupati: number;
  indiceIncidenza: number;
  indiceMortali: number;
}

export interface AtecoMacroData {
  key: string;
  nome: string;
  casi: number;
  mortali: number;
  lavoro: number;
  itinere: number;
  menomati: number;
  giorni: number;
  durataMedia?: number;
  indiceGravita?: number;
  occupati: number;
  indiceIncidenza: number;
  indiceMortali: number;
}

export interface AnnualMultidimData {
  anno: string;
  totale: number;
  mortali: number;
  lavoro: number;
  itinere: number;
  giorni: number;
  casiConGiorni?: number;
  durataMedia?: number;
  indiceGravita?: number;
  menomati: number;
  occupati: number;
  indiceIncidenza: number;
  indiceMortali: number;
  generi: Record<string, number>;
  generiMortali: Record<string, number>;
  fasceEta: Record<string, number>;
  fasceEtaMortali: Record<string, number>;
  modalita: Record<string, number>;
  gestione: Record<string, number>;
  esito: Record<string, number>;
  indennizzo: Record<string, number>;
  gravita: Record<string, number>;
  durata: Record<string, number>;
  nascita: Record<string, number>;
  mezzo: Record<string, number>;
  mensile: Record<string, number>;
  atecoMacro: AtecoMacroData[];
  atecoDivisioni: { key: string; casi: number }[];
  regioni: RegioneAnnualData[];
  provinceAutonome?: ProvinciaAutonomaData[];
}

export interface MultidimensionaleDataset {
  schemaVersion: number;
  anniDisponibili: string[];
  perAnno: Record<string, AnnualMultidimData>;
  consolidatoTotale: AnnualMultidimData;
}

export interface CongiunturaleDataset {
  periodo: string;
  mesi: number[];
  nazionale: {
    totale: { anno2025: number; anno2026: number; delta: number; deltaPerc: number };
    lavoro: { anno2025: number; anno2026: number; delta: number; deltaPerc: number };
    itinere: { anno2025: number; anno2026: number; delta: number; deltaPerc: number };
    mortali: { anno2025: number; anno2026: number; delta: number; deltaPerc: number };
    occupati2024: number;
    incidenzaSemestrale2025: number;
    incidenzaSemestrale2026: number;
  };
  perMese: Array<{
    mese: number;
    tot2025: number;
    tot2026: number;
    lav2025: number;
    lav2026: number;
    iti2025: number;
    iti2026: number;
    mor2025: number;
    mor2026: number;
  }>;
  perRegione: Record<string, {
    tot2025: number;
    tot2026: number;
    lav2025: number;
    lav2026: number;
    iti2025: number;
    iti2026: number;
    mor2025: number;
    mor2026: number;
    occupati2024: number;
    incidenza2025: number;
    incidenza2026: number;
    deltaTotalePerc: number;
  }>;
}

import multidimRaw from "@/data/generated/inail-multidimensionale.json";
import congiunturaleRaw from "@/data/generated/inail-congiunturale-pari-perimetro.json";

export function getMultidimensionaleData(): MultidimensionaleDataset {
  return multidimRaw as unknown as MultidimensionaleDataset;
}

export function getCongiunturaleData(): CongiunturaleDataset {
  return congiunturaleRaw as unknown as CongiunturaleDataset;
}
