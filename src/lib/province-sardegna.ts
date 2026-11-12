// Mappatura dei codici provinciali della Sardegna: binding ai dati.
//
// Serve a rendere confrontabili i due archivi INAIL: la serie consolidata
// semestrale (2021-2025) usa i codici del riordino 2016 (090, 091, 092, 095,
// 111), la congiuntura mensile (2025-2026) quelli in vigore dal 1 gennaio
// 2026 (112-119). Senza mappatura, aggregare per provincia su anni diversi
// somma territori diversi sotto la stessa etichetta.
//
// Fonte: elenco ISTAT "Codici statistici e denominazioni delle unità
// amministrative della Sardegna", generato da
// scripts/etl/genera_mappatura_sardegna.py.
//
// La logica di lookup sta in `province-sardegna-core.ts` (modulo puro,
// verificabile dai test node): qui c'è il caricamento dei dati e i wrapper
// che legano quella logica all'artefatto.

import mappaturaJson from "@/data/generated/province-sardegna-mappatura.json";
import * as core from "./province-sardegna-core";
import type { AreaConfrontabile, MappaturaSardegna, ProvinciaStorica } from "./province-sardegna-core";

export type {
  AreaConfrontabile,
  ComuneSardo,
  MappaturaSardegna,
  ProvinciaSarda,
  ProvinciaSardaPrecedente,
  ProvinciaStorica,
} from "./province-sardegna-core";

const MAPPATURA = mappaturaJson as unknown as MappaturaSardegna;

export function getMappaturaSardegna(): MappaturaSardegna {
  return MAPPATURA;
}

/** Province nuove che coprono un vecchio codice. */
export function nuoveDaVecchio(codice: string): string[] {
  return core.nuoveDaVecchio(MAPPATURA, codice);
}

/** Vecchi codici che alimentano una provincia nuova. */
export function vecchieDaNuovo(codice: string): string[] {
  return core.vecchieDaNuovo(MAPPATURA, codice);
}

/** Nome leggibile di una provincia sarda, vecchio o nuovo codice. */
export function nomeProvinciaSarda(codice: string): string {
  return core.nomeProvinciaSarda(MAPPATURA, codice);
}

/** Area di confronto di un codice, in qualunque archivio compaia. */
export function areaDaCodice(codice: string): AreaConfrontabile | null {
  return core.areaDaCodice(MAPPATURA, codice);
}

/** Contenitore territoriale omogeneo, per le serie storiche. */
export function codiceArea(codice: string): string | null {
  return core.codiceArea(MAPPATURA, codice);
}

/** Province storiche ricomponibili senza residuo. */
export function provinceStoricheConfrontabili(): ProvinciaStorica[] {
  return core.provinceStoricheConfrontabili(MAPPATURA);
}
