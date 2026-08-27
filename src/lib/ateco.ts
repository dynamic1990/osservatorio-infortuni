// Decodifica codici ATECO 2007 per i settori mostrati in dashboard.
// Il dataset INAIL usa formato "LETTERA DD" (es. "Q 86", "F 43", "ND").

const SEZIONI: Record<string, string> = {
  A: "Agricoltura, silvicoltura e pesca",
  B: "Estrazione di minerali",
  C: "Attività manifatturiere",
  D: "Energia elettrica e gas",
  E: "Acqua, reti fognarie e rifiuti",
  F: "Costruzioni",
  G: "Commercio",
  H: "Trasporti e magazzinaggio",
  I: "Servizi di alloggio e ristorazione",
  J: "Informazione e comunicazione",
  K: "Attività finanziarie e assicurative",
  L: "Attività immobiliari",
  M: "Attività professionali e tecniche",
  N: "Servizi di supporto alle imprese",
  O: "Pubblica amministrazione e difesa",
  P: "Istruzione",
  Q: "Sanità e assistenza sociale",
  R: "Arte, sport e intrattenimento",
  S: "Altri servizi",
};

// Dettagli per i codici presenti nei dati (primi 15 settori).
const DETTAGLI: Record<string, string> = {
  "Q 86": "Strutture di assistenza sanitaria",
  "Q 87": "Assistenza sociale residenziale",
  "F 43": "Lavori di costruzione specializzati",
  "G 47": "Commercio al dettaglio",
  "I 56": "Ristorazione",
  "H 49": "Trasporti terrestri",
  "C 25": "Fabbricazione prodotti in metallo",
  "N 81": "Servizi per edifici e paesaggio",
  "H 52": "Magazzinaggio e supporto ai trasporti",
  "H 53": "Servizi postali e corriere",
  "C 28": "Fabbricazione macchinari",
  "O 84": "Pubblica amministrazione",
  "G 46": "Commercio all'ingrosso",
  "C 10": "Industrie alimentari",
  "F 41": "Costruzione di edifici",
  "C 29": "Fabbricazione autoveicoli",
  "C 26": "Fabbricazione apparecchi elettronici",
  "E 38": "Raccolta e smaltimento rifiuti",
  "Q 88": "Assistenza sociale non residenziale",
};

export function atecoLabel(code: string): string {
  if (!code || code === "ND") return "Non disponibile";
  const dettaglio = DETTAGLI[code];
  if (dettaglio) return dettaglio;
  const lettera = code.split(" ")[0];
  const sezione = SEZIONI[lettera];
  return sezione ? `${sezione}` : code;
}

export function atecoShort(code: string): string {
  if (!code || code === "ND") return "ND";
  const dettaglio = DETTAGLI[code];
  if (dettaglio) return `${code} · ${dettaglio}`;
  return code;
}
