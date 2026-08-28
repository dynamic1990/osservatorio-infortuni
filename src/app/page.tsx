import type { Metadata } from "next";
import { HeroCongiunturaleKpi } from "@/components/charts/hero-congiunturale-kpi";
import { TrendDoppiaScalaWidget } from "@/components/charts/trend-doppia-scala-widget";
import { RegioniIncidenzaSection } from "@/components/charts/regioni-incidenza-section";
import { AtecoTreemapWidget } from "@/components/charts/ateco-treemap-widget";
import { DemografiaAnnualeWidget } from "@/components/charts/demografia-annuale-widget";
import { GravitaDurataWidget } from "@/components/charts/gravita-durata-widget";
import { DimensioniWidget } from "@/components/charts/dimensioni-widget";
import { StagionalitaWidget } from "@/components/charts/stagionalita-widget";
import { SerieTemporaleWidget } from "@/components/charts/serie-temporale-widget";
import { InfoModalButton } from "@/components/ui/info-modal";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Osservatorio Infortuni sul Lavoro | Dati e Indicatori Statistici INAIL",
  description:
    "Piattaforma di analisi statistica indipendente sugli infortuni sul lavoro in Italia: monitoraggio congiunturale a pari perimetro 2026 vs 2025, indici di incidenza per occupati, mappe del rischio, gravità, comparti ATECO e serie storiche consolidate.",
};

export default function HomePage() {
  return (
    <div style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* 1. Header Istituzionale */}
      <header>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <div>
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
                Statistiche Ufficiali
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Open Data INAIL &middot; ISTAT &middot; Eurostat
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Osservatorio Infortuni sul Lavoro
            </h1>
          </div>
          
          <InfoModalButton />
        </div>

        <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "80ch", fontSize: "0.95rem" }}>
          Piattaforma di trasparenza e monitoraggio statistico: dati ufficiali congiunturali a pari perimetro (2026 vs 2025),
          tassi di incidenza e indici di gravità normalizzati sugli occupati residenti, mappe territoriali, durata delle assenze indennizzate e comparti produttivi ATECO.
        </p>
      </header>

      {/* 2. Sezione Apertura: Monitoraggio Congiunturale 2026 vs 2025 a Pari Perimetro */}
      <section className="card" aria-label="Monitoraggio Congiunturale 2026 vs 2025">
        <HeroCongiunturaleKpi />
      </section>

      {/* 3. Trend Storico a Doppia Scala: Volumi Assoluti vs Tasso di Incidenza */}
      <section className="card" aria-label="Evoluzione e Indice di Incidenza">
        <div className="card-header">
          <h2 className="card-title">Evoluzione Temporale e Tasso di Incidenza (2020 – 2024)</h2>
          <p className="card-desc">
            Rappresentazione cartesiana su <strong>doppia scala</strong>: i volumi assoluti di denunce
            (barre, asse sinistro) vengono confrontati con il <strong>tasso di incidenza</strong> (linea, asse destro)
            espresso come <em>infortuni ogni 1.000 occupati</em>.
          </p>
        </div>
        <TrendDoppiaScalaWidget />
      </section>

      {/* 4. Mappa Territoriale Interattiva: Colore = Tasso di Incidenza */}
      <section className="card" aria-label="Mappa Territoriale del Rischio">
        <div className="card-header">
          <h2 className="card-title">Mappa Territoriale e Ranking Regionale: Tasso di Incidenza e Gravità</h2>
          <p className="card-desc">
            Visualizzazione comparata per regione con possibilità di dettagliare le <strong>Province Autonome di Bolzano e Trento</strong>.
            Le barre del ranking includono scorrimento dedicato per una lettura nitida delle etichette e del benchmark nazionale.
          </p>
        </div>
        <RegioniIncidenzaSection />
      </section>

      {/* 5. Comparti Produttivi ATECO: Incidenza, Gravità e Treemap */}
      <section className="card" aria-label="Comparti Produttivi ATECO">
        <div className="card-header">
          <h2 className="card-title">Comparti Produttivi e Attività Economiche (Classificazione ATECO)</h2>
          <p className="card-desc">
            Analisi comparativa per macro-settori (Sezioni A–U) con <strong>tasso di incidenza su 1.000 occupati</strong>,
            <strong>indice di gravità</strong> (giornate di assenza perse su occupati) e visualizzazione volumetrica Treemap con filtro annuale.
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
            Seleziona l&apos;anno per osservare l&apos;evoluzione demografica della popolazione infortunata.
          </p>
        </div>
        <DemografiaAnnualeWidget />
      </section>

      {/* 7. Analisi Qualitativa: Gravità del Danno, Durata delle Assenze e Stagionalità */}
      <section className="card" aria-label="Analisi di Gravità e Durata Assenze">
        <div className="card-header">
          <h2 className="card-title">Analisi di Gravità del Danno e Durata dell&apos;Inabilità Temporanea</h2>
          <p className="card-desc">
            Distribuzione per grado di menomazione accertato (franchigia 0–5%, indennizzo in capitale 6–15%, rendita diretta 16%+),
            classi di durata in giorni dell&apos;inabilità temporanea indennizzata, gestione tariffaria e andamento mensile.
          </p>
        </div>
        <GravitaDurataWidget />
        <div style={{ height: "var(--space-6)" }} />
        <DimensioniWidget />
        <div style={{ height: "var(--space-6)" }} />
        <StagionalitaWidget />
      </section>

      {/* 8. Serie Storica Multivariata Dettagliata con Filtri */}
      <section className="card" aria-label="Serie Storica Multivariata">
        <div className="card-header">
          <h2 className="card-title">Esplorazione Multivariata Territoriale e Tipologia Infortunistica</h2>
          <p className="card-desc">
            Confronto storico per verificare l&apos;andamento di infortuni in occasione di lavoro vs in itinere,
            esiti mortali, eventi con menomazione permanente e giornate perse su scala nazionale e regionale.
          </p>
        </div>
        <SerieTemporaleWidget />
      </section>
    </div>
  );
}
