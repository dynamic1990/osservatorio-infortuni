// Loader per le dimensioni approfondite INAIL 2020-2024 (taglio H&S manager).
// Fonte: src/data/generated/inail-infortuni-approfondimenti.json
// Generato da scripts/etl/inail_analisi_approfondita.py (streaming sui CSV semestrali).

import approfondimentiJson from "@/data/generated/inail-infortuni-approfondimenti.json";

export interface SerieAnno {
  anno: number;
  [categoria: string]: number;
}

export interface Approfondimenti {
  coverage: { regioni: number; recordTotali: number };
  dimensioni: {
    gestione: SerieAnno[];
    esito: SerieAnno[];
    indennizzo: SerieAnno[];
    gravita: SerieAnno[];
    durata: SerieAnno[];
    nascita: SerieAnno[];
    mezzo: SerieAnno[];
  };
  stagionalita: { mese: number; casi: number }[];
}

export function getApprofondimenti(): Approfondimenti {
  return approfondimentiJson as unknown as Approfondimenti;
}

// --- Decodifiche (etichette prudenti, coerenti con la normativa INAIL) ---

export const GESTIONE_LABEL: Record<string, string> = {
  I: "Industria e servizi",
  S: "Conto Stato",
  A: "Agricoltura",
  ND: "Non disponibile",
};

export const ESITO_LABEL: Record<string, string> = {
  P: "Positivo (infortunio riconosciuto)",
  N: "Negativo (non riconosciuto)",
  F: "In fase di definizione",
  I: "Definizione istruttoria",
  ND: "Non disponibile",
};

export const INDENNIZZO_LABEL: Record<string, string> = {
  TE: "Inabilità temporanea",
  NE: "Nessun indennizzo",
  CA: "Indennizzo in capitale",
  RD: "Rendita diretta",
  RS: "Rendita ai superstiti",
  ND: "Non disponibile",
};

export const GRAVITA_LABEL: Record<string, string> = {
  nessuna: "Nessuna menomazione",
  franchigia: "Franchigia (0-5%)",
  capitale: "Indennizzo in capitale (6-15%)",
  rendita: "Rendita permanente (16%+)",
  nda: "Non disponibile",
};

export const DURATA_LABEL: Record<string, string> = {
  nessuna: "Nessun giorno indennizzato",
  zero: "Nessun giorno indennizzato",
  breve: "1-7 giorni",
  media: "8-30 giorni",
  lunga: "31-90 giorni",
  lunga90: "Oltre 90 giorni",
  grave90: "Oltre 90 giorni",
  nda: "Non disponibile",
};

export const NASCITA_LABEL: Record<string, string> = {
  Italia: "Nati in Italia",
  Estero: "Nati all'estero",
  ITAL: "Nati in Italia",
  ESTERO: "Nati all'estero",
  ND: "Non disponibile",
};

export const MEZZO_LABEL: Record<string, string> = {
  "Con mezzo": "Con mezzo di trasporto",
  "Senza mezzo": "Senza mezzo di trasporto",
  CON_MEZZO: "Con mezzo di trasporto",
  SENZA_MEZZO: "Senza mezzo di trasporto",
  ND: "Non disponibile",
};

export function labelOf(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}