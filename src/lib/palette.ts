// Palette categoriale per la dashboard — restyling "editoriale dati"
// Colori ben distinguibili (daltonico-friendly dove possibile) e armonizzati con il tema:
// rosso inchiostro, blu inchiostro, verde bosco, ocra, neutri profondi. Usati da grafici, mappa e legende.

export const PALETTE = [
  "#c8102e", // rosso editoriale
  "#1d4ed8", // blu inchiostro
  "#1e7a4e", // verde bosco
  "#c77d0a", // ocra
  "#7150b8", // viola
  "#0e7c8a", // teal
  "#d45b2c", // arancio
  "#3d5a80", // blu ardesia
  "#a82e6f", // ciclamino
  "#5f7327", // oliva
  "#d89a1e", // ambra
  "#2f6b4f", // pino
  "#b0336b", // cremisi
  "#3b5f8a", // acciaio
];

// Coppie dedicate lavoro/itinere (alta contrasto tra le due serie)
export const MODAL_COLORS = {
  lavoro: "#c8102e",
  itinere: "#e7c353",
};

// Scala continua per la mappa: dal chiaro (basso) allo scuro (alto)
export const MAP_SCALE = ["#fbeae7", "#f0c3bd", "#e39b91", "#d16e60", "#b34535", "#8c2d1f"];