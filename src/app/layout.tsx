import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design-system.css";
import { SiteNav } from "@/components/ui/site-nav";

const SITO_URL = "https://damianosalvati.cloud";

export const metadata: Metadata = {
  metadataBase: new URL(SITO_URL),
  title: {
    default:
      "Osservatorio Infortuni sul Lavoro | Dati INAIL, Morti sul Lavoro e Incidenza per Regione",
    template: "%s | Osservatorio Infortuni sul Lavoro",
  },
  description:
    "Piattaforma indipendente di analisi statistica sugli infortuni sul lavoro in Italia: monitoraggio congiunturale, media giornaliera dei morti sul lavoro, serie storica 2014-2024, benchmark europeo Eurostat, mappa del rischio per regione e incidenza per comparto ATECO. Realizzata da Ing. Damiano Salvati.",
  keywords: [
    "infortuni sul lavoro Italia",
    "morti sul lavoro",
    "dati INAIL",
    "statistiche infortuni",
    "sicurezza sul lavoro",
    "osservatorio infortuni",
    "incidenza infortuni regioni",
    "benchmark Eurostat infortuni",
    "infortuni in itinere",
  ],
  authors: [{ name: "Damiano Salvati" }],
  publisher: "Ing. Damiano Salvati",
  applicationName: "Osservatorio Infortuni sul Lavoro",
  category: "statistics",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITO_URL,
    siteName: "Osservatorio Infortuni sul Lavoro",
    title: "Osservatorio Infortuni sul Lavoro | Dati INAIL ed Eurostat",
    description:
      "Monitoraggio indipendente di infortuni e morti sul lavoro in Italia: congiunturale, media giornaliera YTD, serie decennale, benchmark UE e mappa del rischio per regione.",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Osservatorio Infortuni sul Lavoro",
    description:
      "Monitoraggio indipendente degli infortuni sul lavoro in Italia: dati INAIL, media giornaliera dei morti, mappa del rischio e benchmark europeo.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "Italia: avanzamento",
};

export const revalidate = 86_400;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Osservatorio Infortuni sul Lavoro",
              description:
                "Piattaforma indipendente di monitoraggio statistico sugli infortuni sul lavoro in Italia: dati INAIL, Eurostat e ISTAT.",
              publishes: "Ing. Damiano Salvati",
              inLanguage: "it-IT",
            }),
          }}
        />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
