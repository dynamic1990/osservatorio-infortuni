// Etichette di decodifica per i codici INAIL usati nella dashboard.
// Fonti: documentazione del dataset semestrale (dati.inail.it).

export const REGIONI: Record<string, string> = {
  "01": "Piemonte", "02": "Valle d'Aosta", "03": "Lombardia", "04": "Trentino-Alto Adige",
  "05": "Veneto", "06": "Friuli-Venezia Giulia", "07": "Liguria", "08": "Emilia-Romagna",
  "09": "Toscana", "10": "Umbria", "11": "Marche", "12": "Lazio", "13": "Abruzzo",
  "14": "Molise", "15": "Campania", "16": "Puglia", "17": "Basilicata",
  "18": "Calabria", "19": "Sicilia", "20": "Sardegna",
};

export function regioneName(code: string): string {
  return REGIONI[code] ?? code;
}

export const GENERE: Record<string, string> = { M: "Maschi", F: "Femmine" };

export const MODALITA: Record<string, string> = {
  N: "In occasione di lavoro",
  S: "In itinere",
};

export const GRUPPO_TARIFFARIO: Record<string, string> = {
  "0": "Attività varie", "1": "Lavorazioni agricole e alimenti",
  "2": "Chimica, carta e cuoi", "3": "Costruzioni e impianti",
  "4": "Energia e comunicazioni", "5": "Legno e affini",
  "6": "Metalli e macchinari", "7": "Mineraria, rocce e vetro",
  "8": "Tessile e confezioni", "9": "Trasporti e magazzini",
};

export function gruppoName(code: string): string {
  return GRUPPO_TARIFFARIO[code] ?? `Gruppo ${code}`;
}

export function genereName(code: string): string {
  return GENERE[code] ?? code;
}

export function modalitaName(code: string): string {
  return MODALITA[code] ?? code;
}
