import temporaleJson from "@/data/generated/inail-infortuni-temporale.json";

export interface SerieAnnoRegione {
  regione: string;
  anno: number;
  totale: number;
  lavoro: number;
  itinere: number;
  mortali: number;
  mortaliLavoro: number;
  mortaliItinere: number;
  menomati: number;
  giorni: number;
}

export interface SerieMeseRegione {
  regione: string;
  anno: number;
  mese: number;
  totale: number;
  lavoro: number;
  itinere: number;
  mortali: number;
}

export interface Temporale {
  serieAnnuale: SerieAnnoRegione[];
  serieMensile: SerieMeseRegione[];
}

interface TemporaleJson {
  serieAnnuale: SerieAnnoRegione[];
  serieMensile: SerieMeseRegione[];
}
const raw = temporaleJson as unknown as TemporaleJson;
raw.serieAnnuale = raw.serieAnnuale || [];
raw.serieMensile = raw.serieMensile || [];

let cached: Temporale | undefined;

export function getTemporale(): Temporale {
  if (cached) return cached;
  cached = {
    serieAnnuale: raw.serieAnnuale.map((r) => ({ ...r })),
    serieMensile: raw.serieMensile.map((r) => ({ ...r })),
  };
  return cached;
}

export function regioniDisponibili(t: Temporale): string[] {
  const set = new Set<string>();
  for (const r of t.serieAnnuale) set.add(r.regione);
  return Array.from(set).sort();
}