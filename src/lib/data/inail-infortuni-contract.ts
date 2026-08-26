import { z } from "zod";

// Contratto dei record INAIL (cadenza mensile).
// I campi sono stringhe come fornite dall'API: la normalizzazione avviene nell'ETL.

export const InailInfortunioRecord = z.object({
  DataRilevazione: z.string(),
  LuogoNascita: z.string(),
  Regione: z.string(),
  Genere: z.enum(["M", "F"]),
  Gestione: z.string(),
  IdentificativoCaso: z.string(),
  DataProtocollo: z.string(),
  DataAccadimento: z.string(),
  DataMorte: z.string().nullable(),
  LuogoAccadimento: z.string(),
  IdentificativoInfortunato: z.string(),
  Eta: z.string(),
  ModalitaAccadimento: z.enum(["S", "N"]), // S = in occasione di lavoro, N = in itinere (da verificare)
  ConSenzaMezzoTrasporto: z.enum(["S", "N"]),
  IdentificativoDatoreLavoro: z.string(),
  PosizioneAssicurativaTerritoriale: z.string(),
  SettoreAttivitaEconomica: z.string(),
  GestioneTariffaria: z.string(),
  GrandeGruppoTariffario: z.string(),
});

export const InailInfortuniResponse = z.object({
  DatiConCadenzaMensileInfortuni: z.array(InailInfortunioRecord),
});

export type InailInfortunioRecord = z.infer<typeof InailInfortunioRecord>;
export type InailInfortuniResponse = z.infer<typeof InailInfortuniResponse>;

// Contratto dello snapshot aggregato pubblicato dal sito.
// L'ETL produce aggregazioni (mai record singoli) per mantenere il sito leggero
// e proteggere la privacy: nessun caso riconducibile nelle pagine pubbliche.

export const InjuryAggregate = z.object({
  key: z.string(),          // es. "2025-01|12|F 41"
  anno: z.number(),
  mese: z.number(),
  regione: z.string(),      // codice ISTAT regione
  provincia: z.string(),    // codice ISTAT provincia
  settoreAteco: z.string(), // es. "F 41"
  grandeGruppo: z.string(), // es. "3"
  gestione: z.string(),     // es. "I"
  genere: z.enum(["M", "F"]),
  eta: z.number(),          // età in anni compiuti; -1 = sconosciuta
  modalita: z.enum(["S", "N"]),
  mezzoTrasporto: z.enum(["S", "N"]),
  esitoMortale: z.boolean(),
  casi: z.number(),
});

export const InailInfortuniSerie = z.object({
  schemaVersion: z.literal(1),
  datasetId: z.literal("inail_infortuni_mensili"),
  period: z.object({
    annoDa: z.number(),
    annoA: z.number(),
    mesi: z.number(),
  }),
  coverage: z.object({
    regioni: z.number(),
    province: z.number(),
    record: z.number(),
    casi: z.number(),
  }),
  aggregates: z.array(InjuryAggregate),
});

export type InjuryAggregate = z.infer<typeof InjuryAggregate>;
export type InailInfortuniSerie = z.infer<typeof InailInfortuniSerie>;
