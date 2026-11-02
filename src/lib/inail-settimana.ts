// Dati e tipi per la distribuzione settimanale degli infortuni denunciati (open data INAIL).
// La mappa colore -> anno è dichiarata UNA volta qui e usata da grafico e legenda
// (RULES.md Regola 4).
import settimanaRaw from "@/data/generated/inail-infortuni-settimana.json";
import { ACCENT, LINK } from "@/lib/palette";

export type Modalita = "lavoro" | "itinere";

export interface GiornoSerie {
  giorno: string;
  casi: number;
  giorniCalendario: number;
  mediaPerGiorno: number;
  indiceVsFeriale: number | null;
}

export interface SerieModalita {
  casi: number;
  giorni: GiornoSerie[];
}

export interface AnnoSettimana {
  anno: number;
  copertura: { da: string; a: string; giorni: number; completo: boolean };
  totale: {
    casi: number;
    mortali: number;
    giorni: GiornoSerie[];
    giorniMortali: GiornoSerie[];
    perModalita: Record<Modalita, SerieModalita>;
    mortaliPerModalita: Record<Modalita, SerieModalita>;
  };
}

export interface SettimanaDataset {
  schemaVersion: number;
  generatedAt: string;
  fonte: string;
  periodo: { da: number; a: number };
  metodo: Record<string, string>;
  recordUsati: number;
  recordScartati: number;
  anni: AnnoSettimana[];
}

export const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"] as const;

export function getSettimanaData(): SettimanaDataset {
  return settimanaRaw as unknown as SettimanaDataset;
}

// Un colore stabile per anno, dalla palette di progetto (nessun colore a mano).
// L'anno piu' recente usa l'accento, poi si scende all'indietro: cosi' la serie
// principale della lettura e' sempre quella calda. Il grigio medio e' escluso:
// e' riservato alle serie secondarie (RULES.md Regola 4).
const ANNO_COLORS = [ACCENT, LINK, "#3d5a80", "#0e7c8a", "#7a4d8f", "#a85c3a", "#9a6700", "#1e7a4e"];

export function coloreAnno(indice: number, totaleAnni: number): string {
  const daFine = totaleAnni - 1 - indice;
  return ANNO_COLORS[daFine % ANNO_COLORS.length];
}

/** Serie per giorno di un anno, filtrata per modalità e metrica. */
export function serieGiorni(
  anno: AnnoSettimana,
  modalita: { lavoro: boolean; itinere: boolean },
  tipo: "casi" | "mortali"
): GiornoSerie[] {
  const blocco =
    tipo === "casi"
      ? { tutte: anno.totale.giorni, perModalita: anno.totale.perModalita }
      : { tutte: anno.totale.giorniMortali, perModalita: anno.totale.mortaliPerModalita };

  const soloLavoro = modalita.lavoro && !modalita.itinere;
  const soloItinere = modalita.itinere && !modalita.lavoro;
  if (soloLavoro) return blocco.perModalita.lavoro.giorni;
  if (soloItinere) return blocco.perModalita.itinere.giorni;
  return blocco.tutte;
}
