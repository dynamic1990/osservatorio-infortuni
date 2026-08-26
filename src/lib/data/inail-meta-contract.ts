import { z } from "zod";

// Metadati dello snapshot: ogni numero pubblico deve avere fonte, data e limiti.

export const InailSnapshotMetaSchema = z.object({
  schemaVersion: z.literal(1),
  datasetId: z.string(),
  source: z.object({
    owner: z.string(),
    landingUrl: z.string(),
    apiUrl: z.string(),
    license: z.string(),
    attribution: z.string(),
  }),
  extractedAt: z.string(),
  period: z.object({
    annoDa: z.number(),
    annoA: z.number(),
    mesi: z.number().nullable(),
  }),
  coverage: z.object({
    regioni: z.number(),
    province: z.number(),
    record: z.number(),
    casi: z.number(),
  }),
  limits: z.array(z.string()),
  methodology: z.array(z.string()),
});

export type InailSnapshotMeta = z.infer<typeof InailSnapshotMetaSchema>;
