import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design-system.css";

const SITO_URL = "https://damianosalvati.cloud";

export const metadata: Metadata = {
  metadataBase: new URL(SITO_URL),
  title: {
    default: "Osservatorio Infortuni sul Lavoro | Dati INAIL, Morti sul Lavoro e Incidenza per Regione",
    template: "%s | Osservatorio Infortuni sul Lavoro",
  },
  description:
    "Piattaforma indipendente di analisi statistica sugli infortuni sul lavoro in Italia: monitoraggio congiunturale, media giornaliera dei morti sul lavoro, serie storica 2014-2024, benchmark europeo Eurostat, mappa del rischio per regione e incidenza per comparto produttivo. Realizzata da Ing. Damiano Salvati.",
  keywords: [
    "infortuni sul lavoro",
    "morti sul lavoro",
    "dati INAIL infortuni",
    "statistiche sicurezza sul lavoro",
    "osservatorio infortuni sul lavoro",
    "incidenza infortuni per regione",
    "mappa rischio infortuni",
    "infortuni in itinere",
  ],
  authors: [{ name: "Damiano Salvati" }],
  publisher: "Ing. Damiano Salvati",
  application: "Osservatorio Infortuni sul Lavoro",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITO_URL,
    siteName: "Osservatorio Infortuni sul Lavoro",
    title: "Osservatorio Infortuni sul Lavoro | Dati INAIL ed Eurostat",
    description:
      "Monitoraggio indipendente di infortuni e morti sul lavoro in Italia: confronto 2026 vs 2025, media giornaliera, serie decennale 2014-2024, benchmark UE e mappa del rischio per regione.",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Osservatorio Infortuni sul Lavoro",
    description:
      "Monitoraggio indipendente degli infortuni sul lavoro in Italia: dati INAIL, media giornaliera dei morti, mappa del rischio per regione e benchmark europeo.",
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
  themeColor: "#b3261e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}