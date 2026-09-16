import type { MetadataRoute } from "next";

const baseUrl = "https://www.osservatorioinfortuni.it";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/analisi-delle-cause", "/malattie-professionali", "/vigilanza", "/calcolatore-costo-infortunio", "/report", "/report/infortuni-1-semestre-2026", "/fonti", "/progetto"];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
