import visteJson from "@/data/generated/inail-infortuni-viste.json";
import metaJson from "@/data/generated/inail-infortuni-serie.meta.json";
import { parseInailInfortuniViste, type InailInfortuniViste } from "@/lib/data/inail-viste-contract";
import { InailSnapshotMetaSchema, type InailSnapshotMeta } from "@/lib/data/inail-meta-contract";

let cachedViste: InailInfortuniViste | undefined;

export class InailContractError extends Error {
  constructor(cause: unknown) {
    super("Le viste INAIL non superano il contratto dati", { cause });
    this.name = "InailContractError";
  }
}

export function getInailViste(): InailInfortuniViste {
  if (cachedViste) return cachedViste;
  try {
    const parsed = parseInailInfortuniViste(visteJson);
    cachedViste = parsed;
    return parsed;
  } catch (error) {
    throw new InailContractError(error);
  }
}

export function getInailMeta(): InailSnapshotMeta {
  return InailSnapshotMetaSchema.parse(metaJson);
}

export function getInailView(now = new Date()) {
  const viste = getInailViste();
  const meta = getInailMeta();
  const ageDays = Math.floor((now.getTime() - Date.parse(meta.extractedAt)) / 86_400_000);
  return {
    viste,
    meta,
    freshness: {
      extractedAt: meta.extractedAt,
      ageDays,
      state: ageDays > 35 ? ("stale" as const) : ("fresh" as const),
    },
  };
}
