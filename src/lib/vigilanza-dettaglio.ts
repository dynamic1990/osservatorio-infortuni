// Client loader e tipi per il dataset Vigilanza INL dettaglio
// (monitoraggi: irregolarità per settore/ATECO, sospensioni per settore/ATECO, casistiche SSL)

import data from "@/data/generated/vigilanza-dettaglio.json";

export interface RigaIrregolarita {
  settore?: string;
  sezione?: string;
  descrizione?: string;
  anno: number;
  lavoratoriTutelati: number;
  lavoroNero: number;
  extracomunitariSprovvisti: number;
  caporalato: number;
  interpositori: number;
  distacco: number;
  tutelaMinori: number;
  riqualificazione: number;
  lavoratriciMadri: number;
  paritaUomoDonna: number;
  orarioLavoro: number;
  autotrasportoRegCE: number;
  autotrasportoDlgs: number;
  violazioniSicurezza: number;
  violazioniPenali: number;
  violazioniAmministrative: number;
  coperturaAliquote: number;
  [k: string]: unknown;
}

export interface RigaSospensioni {
  settore?: string;
  sezione?: string;
  descrizione?: string;
  anno: number;
  adottateTotale: number;
  adottateInNero: number | null;
  adottateGraviSsl: number | null;
  revocateTotale: number;
  revocateInNero: number | null;
  revocateGraviSsl: number | null;
  pctRevocate: number | null;
  arresti: number;
  sequestri: number;
}

export interface RigaCasisticaSsl {
  settore: string;
  anno: number;
  mancanzaDvr: number;
  mancanzaPee: number;
  mancanzaSspRspp: number;
  mancanzaPos: number;
  mancanzaProtezioniVuoto: number;
  mancanzaArmaturaSostegno: number;
  lavoriVicinoLineeElettriche: number;
  presenzaConduttoriNudi: number;
  protezioneContattiDirettiIndiretti: number;
  omessaVigilanzaDispositiviSicurezza: number;
  mancataNotificaPreventiva: number;
  mancataFormazioneAddestramento: number;
  mancataFornituraDpi: number;
}

export interface DatasetVigilanzaDettaglio {
  schemaVersion: number;
  datasetId: string;
  generatedAt: string;
  periodo: string;
  nota: string;
  fonte: string;
  irregolaritaSettori: RigaIrregolarita[];
  irregolaritaAteco: RigaIrregolarita[];
  sospensioniSettori: RigaSospensioni[];
  sospensioniAteco: RigaSospensioni[];
  casisticheSsl: RigaCasisticaSsl[];
  meta: {
    colonneIrregolarita: string[];
    colonneSospensioni: string[];
    colonneCasisticheSsl: string[];
    sezioniAteco: Record<string, string>;
    macrosettoriAteco: Record<string, string[]>;
  };
}

export const SETTORI_ORDINE = ["Agricoltura", "Industria", "Edilizia", "Terziario"];

export function getVigilanzaDettaglioData(): DatasetVigilanzaDettaglio {
  return data as unknown as DatasetVigilanzaDettaglio;
}

// Etichette leggibili per le motivazioni di sospensione (casistiche SSL)
export const CASISTICHE_SSL_LABEL: Record<string, string> = {
  mancanzaDvr: "Mancanza DVR",
  mancanzaPee: "Mancanza PEE",
  mancanzaSspRspp: "Mancanza SSP e RSPP",
  mancanzaPos: "Mancanza POS",
  mancanzaProtezioniVuoto: "Mancanza protezioni verso il vuoto",
  mancanzaArmaturaSostegno: "Mancanza armatura di sostegno",
  lavoriVicinoLineeElettriche: "Lavori vicino a linee elettriche",
  presenzaConduttoriNudi: "Presenza conduttori nudi",
  protezioneContattiDirettiIndiretti: "Mancanza protezione contatti diretti e indiretti",
  omessaVigilanzaDispositiviSicurezza: "Omessa vigilanza dispositivi di sicurezza",
  mancataNotificaPreventiva: "Mancata notifica preventiva",
  mancataFormazioneAddestramento: "Mancata formazione e addestramento",
  mancataFornituraDpi: "Mancata fornitura DPI",
};

// ordine delle motivazioni per la visualizzazione (dalla più frequente)
export const CASISTICHE_SSL_ORDER = [
  "mancanzaDvr",
  "mancanzaProtezioniVuoto",
  "mancanzaPos",
  "mancanzaSspRspp",
  "protezioneContattiDirettiIndiretti",
  "mancanzaPee",
  "mancataFormazioneAddestramento",
  "omessaVigilanzaDispositiviSicurezza",
  "mancataFornituraDpi",
  "mancanzaArmaturaSostegno",
  "presenzaConduttoriNudi",
  "lavoriVicinoLineeElettriche",
  "mancataNotificaPreventiva",
];