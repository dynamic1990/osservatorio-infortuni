// Regole INAIL sull'indennità giornaliera per inabilità temporanea assoluta.
// Fonte: INAIL, "Indennità giornaliera per inabilità temporanea assoluta"
// https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/indennita-giornaliera-per-inabilita-temporanea-assoluta.html
//
// - Giorno dell'infortunio: retribuzione intera a carico del datore di lavoro.
// - 3 giorni di carenza: 60% della retribuzione a carico del datore (salvo migliori
//   condizioni di CCNL o individuali).
// - Dal 4° giorno al 90°: INAIL eroga il 60% della retribuzione media giornaliera.
// - Dal 91° giorno: INAIL eroga il 75%.
// - Se il CCNL integra al 100%, il datore paga il differenziale: 40% nei primi 90
//   giorni, 25% dal 91°. Questo differenziale è la base della quota a carico azienda
//   usata nel calcolatore per la componente "assenza".

export const INAIL_CARENZA_GIORNI = 3; // giorni di carenza a carico del datore (60%)
export const INAIL_ALIQUOTA_FINO_90 = 0.6; // indennità INAIL dal 4° al 90° giorno
export const INAIL_ALIQUOTA_DAL_91 = 0.75; // indennità INAIL dal 91° giorno

// Differenziale che il datore copre se integra al 100% (caso CCNL standard):
// 100% - 60% = 40% fino al 90° giorno; 100% - 75% = 25% dal 91°.
export const QUOTA_AZIENDA_FINO_90 = 1 - INAIL_ALIQUOTA_FINO_90; // 0.40
export const QUOTA_AZIENDA_DAL_91 = 1 - INAIL_ALIQUOTA_DAL_91; // 0.25

// Soglia giorni dopo la quale cambia l'aliquota INAIL.
export const GIORNO_SOGLIA_ALIQUOTA = 90;

// Funzione per il costo dell'assenza con le regole INAIL: il datore paga l'intera
// retribuzione il giorno dell'infortunio, il 60% nei 3 giorni di carenza, poi copre
// solo il differenziale di integrazione al 100% (40% fino al 90° giorno, 25% dopo)
// se il CCNL prevede l'integrazione. Se il CCNL non integra, il datore non paga
// nulla dopo il 3° giorno (l'indennità INAIL sostituisce la retribuzione).
export function costoAssenzaInail(retribuzioneGiornaliera: number, giorni: number, integraCcnl: boolean): { costoDatore: number; costoDatoreIntegra: number; indennitaInail: number; giorniCarenza: number; giorniInail: number } {
  const giornoEvento = retribuzioneGiornaliera; // giorno infortunio: intera a carico datore
  const carenza = Math.min(giorni, INAIL_CARENZA_GIORNI); // max 3 giorni al 60% datore
  const giorniDopoCarenza = Math.max(0, giorni - INAIL_CARENZA_GIORNI);
  const giorniFino90 = Math.min(giorniDopoCarenza, Math.max(0, GIORNO_SOGLIA_ALIQUOTA - INAIL_CARENZA_GIORNI)); // dal 4° al 90°
  const giorniOltre90 = Math.max(0, giorniDopoCarenza - giorniFino90);

  // Indennità INAIL: 60% fino al 90°, 75% dal 91°.
  const indennitaInail = retribuzioneGiornaliera * (giorniFino90 * INAIL_ALIQUOTA_FINO_90 + giorniOltre90 * INAIL_ALIQUOTA_DAL_91);

  // Costo datore nel caso base: giorno evento + carenza al 60%.
  const costoBase = giornoEvento + carenza * 0.6 * retribuzioneGiornaliera;

  // Se il CCNL integra al 100%, il datore paga anche il differenziale sui giorni coperti INAIL.
  const differenziale = retribuzioneGiornaliera * (giorniFino90 * QUOTA_AZIENDA_FINO_90 + giorniOltre90 * QUOTA_AZIENDA_DAL_91);
  const costoDatoreIntegra = costoBase + (integraCcnl ? differenziale : 0);

  return { costoDatore: costoBase, costoDatoreIntegra, indennitaInail, giorniCarenza: carenza, giorniInail: giorniDopoCarenza };
}

// Sanzioni amministrative principali del D.Lgs. 81/08 (importi base, art. 55 ss.,
// già rivalutati con la maggiorazione del 10% prevista dalla L. 145/2018 dove
// applicabile). Importi indicativi da usare come riferimento: ogni caso concreto
// va verificato con la norma vigente e il legale.
export const SANZIONI_81_08 = {
  dvr: { label: "Mancata elaborazione del DVR", min: 2_200, max: 6_600 },
  nominaRspp: { label: "Mancata nomina RSPP", min: 2_200, max: 5_300 },
  formazione: { label: "Mancata formazione/informazione dei lavoratori", min: 2_200, max: 7_400 },
  sorveglianzaSanitaria: { label: "Omessa sorveglianza sanitaria", min: 1_100, max: 5_300 },
  dpi: { label: "Mancata fornitura DPI", min: 1_100, max: 5_300 },
  denunciaInfortunio: { label: "Omessa denuncia infortunio", min: 1_000, max: 4_500 },
  segnaletica: { label: "Mancata segnaletica di sicurezza", min: 100, max: 450 },
} as const;

// Oscillazione del tasso per andamento infortunistico (art. 20 DM 12/12/2000 e
// nuove Modalità di applicazione delle tariffe). Al rinnovo, la sinistrosità della
// PAT è confrontata con quella media del "PAT tipo": il tasso può salire fino a
// +30% (massimo tariffario 110 per mille) o scendere in caso di andamento favorevole.
// L'oscillazione vale per il triennio successivo: è un costo ricorrente, non una tantum.
// Meccanismo di calcolo: l'evento grave/mortale aumenta l'indice di sinistrosità
// (ISAR), che fa salire il tasso medio. In questa sede usiamo un aumento prudenziale
// del 10-30% del tasso medio per 3 anni, come ordine di grandezza.
export const OSCILLAZIONE_PREMIO = {
  aumentoMin: 0.1, // +10% tasso medio, evento grave con poca incidenza
  aumentoMax: 0.3, // +30% tasso medio, evento grave/mortale con impatto ISAR elevato
  anni: 3, // il nuovo tasso vale per il triennio successivo
} as const;

// Tassi medi di tariffa indicativi per classi di rischio (per mille delle retribuzioni
// imponibili). Valori orientativi ordinati per macro-settore, da usare come riferimento:
// il tasso esatto dipende dalla voce tariffaria PAT della singola azienda (delibera
// INAIL tassi applicabili). Edilizia fino a ~110 per mille (massimo tariffario).
export const TASSI_MEDI_PER_MILLE: Record<string, number> = {
  // Terziario a basso rischio
  "I-istruzione": 2, "K-attivita-finanziarie": 3, "M-attivita-professionali": 3,
  "G-commercio": 5, "H-trasporti": 8,
  // Industria
  "C-attivita-manifatturiere": 12,
  "F-costruzioni": 30,
  "A-agricoltura": 15, "B-estrazione": 25,
  "D-energia": 8, "E-acqua-rifiuti": 10,
  // Default
  "default": 8,
} as const;

// Mappa da macro-settore ATECO (chiavi usate nel dataset) a tasso per mille.
// Le chiavi reali del dataset sono codici ATECO (es. "10-11"), qui usiamo un
// fallback per sezione: valore prudenziale medio.
const ATECO_TO_TASSO: Record<string, string | number> = {
  "A": 15, "B": 25, "C": 12, "D": 8, "E": 10, "F": 30, "G": 5, "H": 8,
  "I": 2, "J": 4, "K": 3, "L": 4, "M": 3, "N": 6, "O": 5, "P": 3,
  "Q": 4, "R": 4, "S": 5,
} as const;

export function tassoPerMillePerAteco(atecoKey: string | undefined): number {
  if (!atecoKey) return TASSI_MEDI_PER_MILLE.default;
  // estrai la lettera di sezione all'inizio della chiave (es. "C10-11" -> "C")
  const m = atecoKey.match(/^([A-Z])/);
  if (m && m[1] in ATECO_TO_TASSO) return Number(ATECO_TO_TASSO[m[1]]);
  return TASSI_MEDI_PER_MILLE.default;
}