import type { MetadataRoute } from "next";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const baseUrl = "https://www.osservatorioinfortuni.it";

/**
 * lastmod reali: la data di generazione del dataset che alimenta la pagina.
 * Segnale di freshness per Google: solo quando i dati cambiano la pagina è "nuova".
 * Se il file scompare, la pagina resta in sitemap senza lastmod (fallback sicuro).
 */
function lastmodDaFile(percorsoRelativo: string): Date | undefined {
  const p = path.join(process.cwd(), percorsoRelativo);
  if (!existsSync(p)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    const iso = raw?.generatedAt ?? raw?.extractedAt ?? raw?.meta?.generatedAt ?? raw?.stats?.generatoIl;
    if (typeof iso !== "string") return undefined;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/cronaca-infortuni", "/analisi-delle-cause", "/malattie-professionali", "/vigilanza", "/bandi-e-finanziamenti", "/calcolatore-costo-infortunio", "/report", "/report/lavori-piu-pericolosi-in-italia", "/report/malattie-professionali-piu-denunciate", "/report/vigilanza-sul-lavoro", "/report/infortunio-in-itinere", "/report/relazione-annuale-inail-2025", "/report/infortuni-1-semestre-2026", "/fonti", "/progetto"];
  const lastmod: Record<string, () => Date | undefined> = {
    "/": () => lastmodDaFile("src/data/generated/news-infortuni.json"),
    "/cronaca-infortuni": () => lastmodDaFile("src/data/generated/news-infortuni.json"),
    "/analisi-delle-cause": () => lastmodDaFile("public/data/informo-catalogo.json"),
    "/malattie-professionali": () => lastmodDaFile("src/data/generated/inail-infortuni-serie.meta.json"),
    "/vigilanza": () => lastmodDaFile("src/data/generated/inail-multidimensionale.json"),
    "/report/infortuni-1-semestre-2026": () => lastmodDaFile("src/data/generated/inail-congiunturale-pari-perimetro.json"),
  };
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
    ...(lastmod[route]?.() ? { lastModified: lastmod[route]!() } : {}),
  }));
}
