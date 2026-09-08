// Palette categoriale per la dashboard - design system WIRED (registro pubblico)
// Bianco carta, inchiostro, link blue e accento rosso semantico #f36458 (delibera Damiano 04/09/2026).
// I colori delle serie derivano da inchiostro e link: niente colori a mano nei componenti (RULES.md Regola 4/5).

export const ACCENT = "#f36458";

export const INK = "#1a1a1a";

export const LINK = "#057dbc";

export const PALETTE = [
  LINK, // link blue
  ACCENT, // rosso semantico tenue
  "#1e7a4e", // verde success
  "#9a6700", // ambra warning
  "#6e6e6e", // grigio medio (serie secondaria)
  "#3d5a80", // blu ardesia
  "#0e7c8a", // teal
  "#7a4d8f", // viola tenue
  "#a85c3a", // terracotta
];

// Coppie dedicate lavoro/itinere: il canale principale (in occasione di lavoro) usa l'accento
// rosso semantico; il canale secondario (in itinere) usa l'inchiostro. Il filtro e le serie
// condividono la stessa mappa colore -> canale (RULES.md Regola 4).
export const MODAL_COLORS = {
  lavoro: ACCENT,
  itinere: "#3d5a80",
};

// Scala di rischio unica per mappe e box di incidenza: dal chiaro (basso) allo scuro (alto).
// E l'unica scala di rischio dell'app (RULES.md: niente scale duplicate).
export const RISK_SCALE = ["#fbeae7", "#f0c3bd", "#e39b91", "#d16e60", "#b34535", "#8c2d1f"];

// Alias retrocompatibile: MAP_SCALE e RISK_COLOR_SCALE puntano alla stessa scala unica.
export const MAP_SCALE = RISK_SCALE;
