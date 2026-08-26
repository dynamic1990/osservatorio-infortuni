import { z } from "zod";

// Contratto delle viste precalcolate (dashboard leggera).
// Serie annuale consolidata 2020-2024 (semestrale, 20 regioni) +
// serie mensile congiunturale 2025-2026.

export const SerieCountSchema = z.object({ key: z.string(), casi: z.number() });
export type SerieCount = z.infer<typeof SerieCountSchema>;

export const AnnoCasiSchema = z.object({ anno: z.number(), casi: z.number() });
export const SerieAnnualeRegioneSchema = z.object({
  regione: z.string(),
  anni: z.array(AnnoCasiSchema),
});

export const InailInfortuniVisteSchema = z.object({
  schemaVersion: z.literal(2),
  datasetId: z.literal("inail_infortuni_viste"),
  period: z.object({ annoDa: z.number(), annoA: z.number(), mesi: z.number().nullable() }),
  coverage: z.object({
    regioni: z.number(),
    record: z.number(),
    casi: z.number(),
    mortali: z.number(),
    casiPerAnno: z.record(z.string(), z.number()),
    notaPeriodo: z.string().optional(),
  }),
  serieAnnuale: z.array(AnnoCasiSchema),
  serieAnnualeRegioni: z.array(SerieAnnualeRegioneSchema),
  serieMensile: z.array(SerieCountSchema),
  settori: z.array(SerieCountSchema),
  regioni: z.array(SerieCountSchema),
  generi: z.array(SerieCountSchema),
  fasceEta: z.array(SerieCountSchema),
  modalita: z.array(SerieCountSchema),
  gestioni: z.array(SerieCountSchema),
  gruppiTariffari: z.array(SerieCountSchema),
});

export type InailInfortuniViste = z.infer<typeof InailInfortuniVisteSchema>;
export type SerieAnnualeRegione = z.infer<typeof SerieAnnualeRegioneSchema>;

export function parseInailInfortuniViste(data: unknown): InailInfortuniViste {
  return InailInfortuniVisteSchema.parse(data);
}
