import type { MetadataRoute } from "next";

const baseUrl = "https://www.osservatorioinfortuni.it";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/cronaca-infortuni", "/analisi-delle-cause", "/malattie-professionali", "/vigilanza", "/bandi-e-finanziamenti", "/calcolatore-costo-infortunio", "/report", "/report/lavori-piu-pericolosi-in-italia", "/report/malattie-professionali-piu-denunciate", "/report/vigilanza-sul-lavoro", "/report/infortunio-in-itinere", "/report/relazione-annuale-inail-2025", "/report/infortuni-1-semestre-2026", "/fonti", "/progetto"];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
