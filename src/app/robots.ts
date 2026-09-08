import type { MetadataRoute } from "next";

const baseUrl = "https://damianosalvati.cloud";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
