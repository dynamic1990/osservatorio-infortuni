import type { Metadata } from "next";
import { getCongiunturaleData, getMultidimensionaleData } from "@/lib/multidimensionale";
import { HeroCongiunturaleKpi } from "@/components/charts/hero-congiunturale-kpi";
import { TrendDoppiaScalaWidget } from "@/components/charts/trend-doppia-scala-widget";
import { RegioniIncidenzaSection } from "@/components/charts/regioni-incidenza-section";
import { AtecoTreemapWidget } from "@/components/charts/ateco-treemap-widget";
import { DemografiaAnnualeWidget } from "@/components/charts/demografia-annuale-widget";
import { GravitaDurataWidget } from "@/components/charts/gravita-durata-widget";
import { DimensioniWidget } from "@/components/charts/dimensioni-widget";
import { StagionalitaWidget } from "@/components/charts/stagionalita-widget";
import { SerieTemporaleWidget } from "@/components/charts/serie-temporale-widget";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Osservatorio Infortuni sul Lavoro | Cruscotto HSE e Analisi Dati INAIL",
  description:
    "Piattaforma analitica indipendente per H&S manager, RSPP e professionisti della prevenzione: monitoraggio congiunturale a pari perimetro 2026 vs 2025, indici di incidenza per occupati, mappe del rischio, comparti ATECO e serie consolidate.",
};

export default function HomePage() {
  return (
    <div style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* 1. Header Istituzionale e di Posizionamento */}
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
          <span
            style={{
              background: "var(--color-accent)",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 750,
              padding: "2px 8px",
              borderRadius: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            H&amp;S Intelligence
          </span>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            Open Data INAIL &middot; ISTAT &middot; Eurostat
          </span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-2)", letterSpacing: "-0.02em" }}>
          Osservatorio Infortuni sul Lavoro
        </h1>
        <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "80ch", fontSize: "0.95rem" }}>
          Strumento di intelligence per RSPP, HSE manager e professionisti della sicurezza: dati
          ufficiali congiunturali a pari perimetro (2026 vs 2025), tassi di incidenza normalizzati
          sugli occupati, mappe territoriali del rischio, analisi di gravità e comparti produttivi ATECO.
        </p>
      </header>

      {/* 2. Sezione Apertura: Monitoraggio Congiunturale 2026 vs 2025 a Pari Perimetro */}
      <section className="card" aria-label="Monitoraggio Congiunturale 2026 vs 2025">
        <HeroCongiunturaleKpi />
      </section>

      {/* 3. Trend Storico a Doppia Scala: Volumi Assoluti vs Tasso di Incidenza */}
      <section className="card" aria-label="Evoluzione e Indice di Incidenza">
        <div className="card-header">
          <h2 className="card-title">Evoluzione Temporale e Rischio Reale (2020 – 2024)</h2>
          <p className="card-desc">
            Rappresentazione cartesiana su <strong>doppia scala</strong>: i volumi assoluti di denunce
            (barre, asse sinistro) vengono confrontati direttamente con l&apos;<strong>indice di incidenza</strong> (linea, asse destro)
            normalizzato su 1.000 lavoratori occupati.
          </p>
        </div>
        <TrendDoppiaScalaWidget />
      </section>

      {/* 4. Mappa Territoriale Interattiva: Colore = Tasso di Incidenza */}
      <section className="card" aria-label="Mappa Territoriale del Rischio">
        <div className="card-header">
          <h2 className="card-title">Mappa Territoriale del Rischio: Incidenza per Regione</h2>
          <p className="card-desc">
            La mappa coropletica colora ciascuna regione in base al <strong>tasso di incidenza su 1.000 occupati</strong> (non per volume assoluto,
            evitando distorsioni dimensionali). Seleziona l&apos;anno di indagine per verificare l&apos;evoluzione storica del rischio territoriale.
          </p>
        </div>
        <RegioniIncidenzaSection />
      </section>

      {/* 5. Comparti Produttivi ATECO: Grafico a Blocchi (Treemap) */}
      <section className="card" aria-label="Comparti Produttivi ATECO">
        <div className="card-header">
          <h2 className="card-title">Comparti Produttivi e Attività Economiche (Treemap ATECO)</h2>
          <p className="card-desc">
            Grafico a blocchi proporzionali per macro-settori (Sezioni A–U) e singole attività economiche ATECO 2007.
            Consente di identificare immediatamente il peso relativo di ciascun settore e gli eventi mortali associati con filtro per anno.
          </p>
        </div>
        <AtecoTreemapWidget />
      </section>

      {/* 6. Profilo Demografico: Genere e Fasce d'Età con Selettore Anno */}
      <section className="card" aria-label="Distribuzione Demografica">
        <div className="card-header">
          <h2 className="card-title">Distribuzione Demografica: Genere e Fasce d&apos;Età</h2>
          <p className="card-desc">
            Composizione anagrafica degli infortunati con distinzione di genere e classi d&apos;età all&apos;accadimento.
            Seleziona l&apos;anno per osservare l&apos;invecchiamento della platea e l&apos;incidenza differenziata.
          </p>
        </div>
        <DemografiaAnnualeWidget />
      </section>

      {/* 7. Analisi di Rischio Qualitativa: Gravità, Durata, Gestione, Dinamica e Stagionalità */}
      <section className="card" aria-label="Analisi Qualitativa di Rischio">
        <div className="card-header">
          <h2 className="card-title">Analisi di Gravità, Dinamica e Durata delle Assenze</h2>
          <p className="card-desc">
            Le dimensioni determinanti per la valutazione del rischio e il Documento di Valutazione dei Rischi (DVR):
            grado di menomazione permanente accertata, durata in giorni dell&apos;inabilità temporanea indennizzata, gestione tariffaria e stagionalità.
          </p>
        </div>
        <GravitaDurataWidget />
        <div style={{ height: "var(--space-6)" }} />
        <DimensioniWidget />
        <div style={{ height: "var(--space-6)" }} />
        <StagionalitaWidget />
      </section>

      {/* 8. Serie Storica Multivariata Dettagliata con Filtri Regione & Modalità */}
      <section className="card" aria-label="Serie Storica Multivariata">
        <div className="card-header">
          <h2 className="card-title">Esplorazione Multivariata per Regione e Tipologia</h2>
          <p className="card-desc">
            Selettore combinato per confrontare l&apos;andamento di infortuni in occasione di lavoro vs in itinere,
            esiti mortali, casi con menomazione permanente e giornate perse su una o più regioni selezionate.
          </p>
        </div>
        <SerieTemporaleWidget />
      </section>
    </div>
  );
}