import type { SerieCount } from "@/lib/data/inail-viste-contract";

export interface SeriePoint {
  label: string;
  totale: number;
}

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export function buildMonthlySerie(serie: SerieCount[]): SeriePoint[] {
  return serie
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((p) => ({
      label: `${MESI[Number(p.key.slice(5, 7)) - 1]} ${p.key.slice(0, 4)}`,
      totale: p.casi,
    }));
}
