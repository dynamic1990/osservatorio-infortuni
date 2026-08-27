// Loader per l'indice di incidenza (infortuni / 1.000 occupati).
// Fonte: src/data/generated/inail-indice-incidenza.json
// Generato da scripts/etl/inail_indice_incidenza.py (INAIL + ISTAT/Eurostat).

import indiceJson from "@/data/generated/inail-indice-incidenza.json";

export interface IndiceAnno {
  regione: string;
  anno: number;
  casi: number;
  mortali: number;
  occupati: number;
  indice: number; // per 1.000 occupati
  indiceMortali: number;
}

export interface IndiceNazionale {
  anno: number;
  casi: number;
  mortali: number;
  occupati: number;
  indice: number;
  indiceMortali: number;
}

export interface IndiceIncidenza {
  nazionale: IndiceNazionale[];
  perRegione: IndiceAnno[];
}

export function getIndiceIncidenza(): IndiceIncidenza {
  return indiceJson as unknown as IndiceIncidenza;
}