// Client loader e tipi per il dataset Vigilanza INL
// (serie storica annuale da Rapporti annuali INL 2021-2025)

import data from "@/data/generated/vigilanza-inl.json";

export interface AnnoVigilanza {
  anno: number;
  controlliAvviati: number;
  ispezioniAvviate: number | null;
  verificheAccertamenti: number | null;
  ispezioniDefinite: number;
  ispezioniIrregolari: number;
  tassoIrregolarita: number;
  lavoratoriIrregolari: number | null;
  lavoratoriInNero: number;
  recuperoEuro: number;
  sospensioni: number;
  sospensioniSicurezza: number;
  sospensioniRevocate: number;
  violazioniSicurezza: number;
}

export interface FonteVigilanza {
  anno: number;
  url: string;
  note: string;
}

export interface PatenteCrediti {
  attivaDa: string;
  obbligatoriaDa: string;
  rilasciate: number;
  sanzioniAssenza: number;
  revocate: number;
  sospese: number;
  settore: string;
}

export interface DatasetVigilanza {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  periodo: string;
  nota: string;
  fonte: string;
  serie: AnnoVigilanza[];
  patenteCrediti: PatenteCrediti;
  fonti: FonteVigilanza[];
}

const dataset = data as unknown as DatasetVigilanza;

export function getVigilanzaData(): DatasetVigilanza {
  return dataset;
}

export function getVigilanzaUltimoAnno(): AnnoVigilanza {
  const serie = [...dataset.serie].sort((a, b) => b.anno - a.anno);
  return serie[0];
}

export function getVigilanzaDelta(field: keyof AnnoVigilanza): { delta: number; deltaPerc: number | null } {
  const s = [...dataset.serie].sort((a, b) => a.anno - b.anno);
  if (s.length < 2) return { delta: 0, deltaPerc: null };
  const ultimo = s[s.length - 1];
  const precedente = s[s.length - 2];
  const a = Number(ultimo[field] ?? 0);
  const b = Number(precedente[field] ?? 0);
  if (b === 0) return { delta: a - b, deltaPerc: null };
  return { delta: a - b, deltaPerc: ((a - b) / b) * 100 };
}