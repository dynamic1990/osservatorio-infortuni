// Loader tipizzato per i dati multidimensionali INAIL (2020-2024 per singolo anno)
// Fonte: src/data/generated/inail-multidimensionale.json

import multidimJson from "@/data/generated/inail-multidimensionale.json";
import congiunturaleJson from "@/data/generated/inail-congiunturale-pari-perimetro.json";

export interface RegioneAnnualData {
  regione: string;
  totale: number;
  lavoro: number;
  itinere: number;
  mortali: number;
  menomati: number;
  giorni: number;
  occupati: number;
  indiceIncidenza: number;
  indiceMortali: number;
}

export interface AtecoItem {
  key: string;
  casi: number;
  mortali?: number;
}

export interface AnnoMultidimensionale {
  anno: string;
  totale: number;
  mortali: number;
  lavoro: number;
  itinere: number;
  giorni: number;
  menomati: number;
  occupati: number;
  indiceIncidenza: number;
  indiceMortali: number;
  generi: Record<string, number>;
  generiMortali?: Record<string, number>;
  fasceEta: Record<string, number>;
  fasceEtaMortali?: Record<string, number>;
  modalita: Record<string, number>;
  gestione: Record<string, number>;
  esito: Record<string, number>;
  indennizzo: Record<string, number>;
  gravita: Record<string, number>;
  durata: Record<string, number>;
  nascita: Record<string, number>;
  mezzo: Record<string, number>;
  mensile: Record<string, number>;
  atecoMacro: AtecoItem[];
  atecoDivisioni: AtecoItem[];
  regioni: RegioneAnnualData[];
}

export interface MultidimensionaleData {
  schemaVersion: number;
  anniDisponibili: string[];
  perAnno: Record<string, AnnoMultidimensionale>;
  consolidatoTotale: AnnoMultidimensionale;
}

export interface CongiunturalePariPerimetro {
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

export function getMultidimensionaleData(): MultidimensionaleData {
  return multidimJson as unknown as MultidimensionaleData;
}

export function getCongiunturaleData(): CongiunturalePariPerimetro {
  return congiunturaleJson as unknown as CongiunturalePariPerimetro;
}
