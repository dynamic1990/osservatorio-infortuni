// Dati e tipi per la pagina "Casi mortali" (Infor.MO INAIL).
// La mappa colore -> canale è dichiarata UNA volta per pagina (RULES.md Regola 4).
import informoMortaliAnalisi from "@/data/generated/informo-mortali-analisi.json";
import { ACCENT, INK, LINK, RISK_SCALE } from "@/lib/palette";

export interface VoceCounter {
  nome: string;
  count: number;
}

export interface AnnoVoci {
  anno: number;
  voci: VoceCounter[];
}

export interface SerieInformo {
  anno: number;
  casiAnalizzati: number;
  totaleFiltri?: number;
  copertura?: number;
  mortaliNazionali?: number;
  deltaCasi?: number;
  deltaPerc?: number;
}

export interface InformoAnalisi {
  serie: SerieInformo[];
  incidenti: AnnoVoci[];
  settori: AnnoVoci[];
  territori: AnnoVoci[];
  popolazioni: AnnoVoci[];
  mansioni: AnnoVoci[];
  profili: Record<string, AnnoVoci[]>;
  fattori: {
    perTipo: AnnoVoci[];
    perRuolo: AnnoVoci[];
    perModulazione: AnnoVoci[];
    perProblemaSicurezza: AnnoVoci[];
    perStandard: AnnoVoci[];
    perValutazione: AnnoVoci[];
  };
  totFattori: number;
  casiConFattori: number;
  totaleMortaliNazionali?: number;
  casiPeriodo?: number;
  quotaQuinquennio?: number;
}

// Colori di pagina: la serie dell'anno corrente usa l'accento rosso semantico,
// la serie dell'anno precedente (overlay/confronto) usa l'inchiostro; i canali
// secondari della pagina (categorie condivise tra piu' widget) usano la palette.
export const INFORM_COLORS = {
  corrente: ACCENT, // serie / primo canale
  confronto: INK, // anno precedente o canale di confronto
  secondario: LINK,
  scalaRischio: RISK_SCALE,
};

export const ANNI_INFORMO = [2020, 2021, 2022, 2023, 2024] as const;
export const ANNO_DEFAULT = 2024;

export function getInformoAnalisi(): InformoAnalisi {
  return informoMortaliAnalisi as unknown as InformoAnalisi;
}

export function serieAnno(data: InformoAnalisi, anno: number): SerieInformo | undefined {
  return data.serie.find((s) => s.anno === anno);
}

export function annoPrecedente(anno: number): number | undefined {
  const i = ANNI_INFORMO.indexOf(anno as (typeof ANNI_INFORMO)[number]);
  return i > 0 ? ANNI_INFORMO[i - 1] : undefined;
}

// Sezione per anno per una vista "anno -> voci" (es. data.incidenti).
export function vociAnno(data: AnnoVoci[] | undefined, anno: number): VoceCounter[] {
  if (!data) return [];
  const found = data.find((s) => s.anno === anno);
  return found ? found.voci : [];
}

// Delta tra due conteggi: {delta, pct} con segno.
export function deltaVoce(prevCount?: number, currCount?: number) {
  if (prevCount === undefined || currCount === undefined || prevCount === 0) {
    return null;
  }
  const delta = currCount - prevCount;
  return { delta, pct: (delta / prevCount) * 100 };
}

export function formattaDelta(d: number | undefined, pct: number | undefined) {
  if (d === undefined || pct === undefined) return "n.d.";
  const segno = d > 0 ? "+" : "";
  return `${segno}${d.toLocaleString("it-IT")} (${segno}${pct.toFixed(1).replace(".", ",")}%)`;
}