// Logica pura della mappatura dei codici provinciali sardi.
//
// Questo modulo non importa nulla: riceve l'artefatto come argomento. Serve
// a poter verificare le funzioni di lookup con i test node, che non
// risolvono l'alias `@/` né gli import JSON. Il binding ai dati sta in
// `province-sardegna.ts`.

export interface ProvinciaSarda {
  codice: string;
  nome: string;
  comuni: number;
  provincePrecedenti: string[];
  /** Presente solo per le città metropolitane: ISTAT usa 312 e 318. */
  codiceEnte?: string;
  denominazioneEnte?: string;
}

export interface ProvinciaSardaPrecedente {
  codice: string;
  nome: string;
  comuni: number;
  provinceNuove: string[];
}

export interface AreaConfrontabile {
  id: string;
  nome: string;
  vecchi: string[];
  nuovi: string[];
  comuniNuovi: number;
  comuniVecchi: number;
  /** Comuni che cambiano area: 0 significa territorio identico nei due periodi. */
  comuniSpostati: number;
  nota: string;
}

export interface ProvinciaStorica {
  codice: string;
  nome: string;
  nuovi: string[];
  comuniStorici: number;
  comuniNelContenitoreNuovo: number;
  comuniFuoriusciti: number;
  comuniAcquisiti: number;
  confrontabileNelTempo: boolean;
}

export interface ComuneSardo {
  codiceComune: string;
  nome: string;
  codiceEnte: string;
  denominazioneEnte: string;
  provincia: string;
  codiceComunePrecedente: string;
  provinciaPrecedente: string;
}

export interface MappaturaSardegna {
  schemaVersion: number;
  datasetId: string;
  source: {
    owner: string;
    titolo: string;
    landingUrl: string;
    url: string;
    licenza: string;
    dataRiferimento: string;
    notaNormativa: string;
  };
  extractedAt: string;
  coverage: { comuni: number; provinceNuove: number; provincePrecedenti: number };
  province: { nuove: ProvinciaSarda[]; precedenti: ProvinciaSardaPrecedente[] };
  comuni: ComuneSardo[];
  mappatura: {
    vecchioVersoNuovo: Record<string, string[]>;
    nuovoVersoVecchio: Record<string, string[]>;
    note: string[];
  };
  confronto: { aree: AreaConfrontabile[]; provinceStoriche: ProvinciaStorica[] };
  limiti: string[];
  verifica?: {
    eseguita: boolean;
    motivo?: string;
    anno?: number;
    rapporto?: number;
    aree?: { id: string; nome: string; semestrale2025: number; mensile2025: number; rapporto: number | null }[];
  };
}

/** Province nuove che coprono un vecchio codice. */
export function nuoveDaVecchio(m: MappaturaSardegna, codice: string): string[] {
  return m.mappatura.vecchioVersoNuovo[codice] ?? [];
}

/** Vecchi codici che alimentano una provincia nuova. */
export function vecchieDaNuovo(m: MappaturaSardegna, codice: string): string[] {
  return m.mappatura.nuovoVersoVecchio[codice] ?? [];
}

/** Nome leggibile di una provincia sarda, vecchio o nuovo codice. */
export function nomeProvinciaSarda(m: MappaturaSardegna, codice: string): string {
  const nuova = m.province.nuove.find((p) => p.codice === codice);
  if (nuova) return nuova.nome;
  const vecchia = m.province.precedenti.find((p) => p.codice === codice);
  if (vecchia) return vecchia.nome;
  return codice;
}

/**
 * Area di confronto a cui appartiene un codice provincia, in qualunque
 * archivio compaia. Restituisce null per i codici che non sono sardi.
 */
export function areaDaCodice(m: MappaturaSardegna, codice: string): AreaConfrontabile | null {
  return (
    m.confronto.aree.find(
      (a) => a.vecchi.includes(codice) || a.nuovi.includes(codice),
    ) ?? null
  );
}

/**
 * Riporta un codice al contenitore usato per il confronto nel tempo.
 *
 * Le aree coprono lo stesso territorio in entrambi i periodi, con l'unica
 * eccezione di due comuni (Seui e Seulo) passati al Nuorese: sono il livello
 * da usare quando serve una serie storica omogenea. Per la lettura puntuale
 * del territorio attuale non usare questa funzione, ma il codice così com'è.
 */
export function codiceArea(m: MappaturaSardegna, codice: string): string | null {
  return areaDaCodice(m, codice)?.id ?? null;
}

/**
 * Le province storiche in cui la ricomposizione è esatta: il territorio non
 * è cambiato, cambia solo l'etichetta.
 */
export function provinceStoricheConfrontabili(m: MappaturaSardegna): ProvinciaStorica[] {
  return m.confronto.provinceStoriche.filter((p) => p.confrontabileNelTempo);
}
