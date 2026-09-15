import type { MetadataRoute } from "next";

const baseUrl = "https://www.osservatorioinfortuni.it";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/analisi-delle-cause", "/malattie-professionali", "/vigilanza", "/calcolatore-costo-infortunio", "/fonti", "/progetto"];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
