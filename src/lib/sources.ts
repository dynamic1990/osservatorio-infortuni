// Source registry: descrive ogni fonte integrata.
// È il punto di partenza per provenienza e monitoring (vedi docs/ARCHITECTURE.md).

export type SourceId =
  | "inail-infortuni-mensile"
  | "inail-infortuni-semestrale"
  | "inail-malattie-mensile"
  | "inail-malattie-semestrale";

export interface SourceInfo {
  id: SourceId;
  owner: string;
  area: string;
  landingUrl: string;
  apiUrl: string;
  format: string;
  coverage: string;
  frequency: string;
  status: "active" | "planned";
  notes?: string;
}

export const SOURCES: Record<SourceId, SourceInfo> = {
  "inail-infortuni-mensile": {
    id: "inail-infortuni-mensile",
    owner: "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
    area: "Infortuni sul lavoro",
    landingUrl: "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-mensile.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni",
    format: "JSON (REST)",
    coverage: "Record singoli pseudonimizzati; Regione, AnnoAccadimento, MeseAccadimento obbligatori",
    frequency: "Mensile",
    status: "active",
    notes: "Esclude definizione amministrativa, indennizzo e giorni indennizzati (solo semestrale)",
  },
  "inail-infortuni-semestrale": {
    id: "inail-infortuni-semestrale",
    owner: "INAIL",
    area: "Infortuni sul lavoro",
    landingUrl: "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-semestrale.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni",
    format: "JSON (REST)",
    coverage: "Come mensile + definizione amministrativa, esito mortale, indennizzo",
    frequency: "Semestrale",
    status: "planned",
    notes: "Parametro Regione accetta valori particolari; da testare",
  },
  "inail-malattie-mensile": {
    id: "inail-malattie-mensile",
    owner: "INAIL",
    area: "Malattie professionali",
    landingUrl: "https://dati.inail.it/portale/it/dataset/malattie-professionali/dati-con-cadenza-mensile.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiMensiliMalattieProfessionaliDataProt",
    format: "JSON (REST)",
    coverage: "Data protocollo",
    frequency: "Mensile",
    status: "planned",
  },
  "inail-malattie-semestrale": {
    id: "inail-malattie-semestrale",
    owner: "INAIL",
    area: "Malattie professionali",
    landingUrl: "https://dati.inail.it/portale/it/dataset/malattie-professionali/dati-con-cadenza-semestrale.html",
    apiUrl: "https://dati.inail.it/api/OpenData/DatiSemestraliMalattieProfessionaliDataProt",
    format: "JSON (REST)",
    coverage: "Data protocollo; esiste variante DataDec",
    frequency: "Semestrale",
    status: "planned",
  },
};

export function listSources(): SourceInfo[] {
  return Object.values(SOURCES);
}
