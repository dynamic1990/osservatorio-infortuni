import type { MetadataRoute } from "next";

const baseUrl = "https://damianosalvati.cloud";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/casi-mortali", "/malattie-professionali", "/vigilanza", "/profili-rischio", "/calcolatore-costo-infortunio", "/fonti"];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
