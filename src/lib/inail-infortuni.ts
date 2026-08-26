import snapshotJson from "@/data/generated/inail-infortuni-serie.json";
import metaJson from "@/data/generated/inail-infortuni-serie.meta.json";
import { parseInailInfortuniSerie, type InailInfortuniSerie } from "@/lib/data/inail-infortuni-contract";
import { type InailSnapshotMeta } from "@/lib/data/inail-meta-contract";

let cachedSnapshot: InailInfortuniSerie | undefined;

export class InailContractError extends Error {
  constructor(cause: unknown) {
    super("Lo snapshot INAIL non supera il contratto dati", { cause });
    this.name = "InailContractError";
  }
}

export function getInailSnapshot(): InailInfortuniSerie {
  if (cachedSnapshot) return cachedSnapshot;
  try {
    cachedSnapshot = parseInailInfortuniSerie(snapshotJson);
    return cachedSnapshot;
  } catch (error) {
    throw new InailContractError(error);
  }
}

export function getInailMeta(): InailSnapshotMeta {
  return metaJson as InailSnapshotMeta;
}

export function getInailView(now = new Date()) {
  const snapshot = getInailSnapshot();
  const meta = getInailMeta();
  const ageDays = Math.floor((now.getTime() - Date.parse(meta.extractedAt)) / 86_400_000);
  return {
    snapshot,
    meta,
    freshness: {
      extractedAt: meta.extractedAt,
      ageDays,
      state: ageDays > 35 ? ("stale" as const) : ("fresh" as const),
    },
  };
}
