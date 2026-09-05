import type { Metadata } from "next";
import { HeroCongiunturaleKpi } from "@/components/charts/hero-congiunturale-kpi";
import { TrendDoppiaScalaWidget } from "@/components/charts/trend-doppia-scala-widget";
import { RegioniIncidenzaSection } from "@/components/charts/regioni-incidenza-section";
import { MacroAreaWidget } from "@/components/charts/macro-area-widget";
import { AtecoSettoriWidget } from "@/components/charts/ateco-settori-widget";
import { DemografiaAnnualeWidget } from "@/components/charts/demografia-annuale-widget";
import { GravitaDurataWidget } from "@/components/charts/gravita-durata-widget";
import { DimensioniWidget } from "@/components/charts/dimensioni-widget";
import { StagionalitaWidget } from "@/components/charts/stagionalita-widget";
import { SerieDecennaleWidget } from "@/components/charts/serie-decennale-widget";
import { NewsInfortuniWidget } from "@/components/charts/news-infortuni-widget";
import { BenchmarkEurostatWidget } from "@/components/charts/benchmark-eurostat-widget";
import { InfoModalButton } from "@/components/ui/info-modal";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Osservatorio Infortuni sul Lavoro | Dati e Indicatori Statistici INAIL",
  description:
    "Piattaforma di analisi statistica indipendente sugli infortuni sul lavoro in Italia: cronaca quotidiana degli infortuni mortali e gravi, serie storica decennale 2014-2024, benchmark europeo Eurostat, monitoraggio congiunturale 2026 vs 2025, indici di incidenza, mappe del rischio, gravità e comparti ATECO.",
};

export default function HomePage() {
  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* 1. Header Istituzionale */}
      <header
        style={{
          background: "var(--color-raised)",
          border: "1px solid var(--color-divider)",
          padding: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
              <span
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-raised)",
                  fontSize: "0.72rem",
                  fontWeight: 750,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Statistiche pubbliche
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Open Data INAIL &middot; ISTAT &middot; Eurostat
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Osservatorio Infortuni sul Lavoro
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
              Piattaforma indipendente di trasparenza e monitoraggio statistico: dati congiunturali
              a parita di periodo (2026 vs 2025), media giornaliera dei morti sul lavoro, tassi di
              incidenza e gravita normalizzati sugli occupati, serie storica 2014-2024, benchmark
              europeo, mappa del rischio territoriale e comparti produttivi ATECO.
            </p>
            <div style={{ marginTop: "var(--space-2)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              Progetto a cura di{" "}
              <strong style={{ color: "var(--color-text)" }}>Ing. Damiano Salvati</strong> &middot;
              aggiornamento automatico giornaliero
            </div>
          </div>
          <InfoModalButton />
        </div>
      </header>

      {/* 2. Sezione Apertura: Monitoraggio Congiunturale 2026 vs 2025 a Pari Perimetro */}
      <section className="card" aria-label="Monitoraggio Congiunturale 2026 vs 2025">
        <HeroCongiunturaleKpi />
      </section>

      {/* 3. Serie Storica Decennale 2014-2024 */}
      <section className="card" aria-label="Serie Storica Decennale">
        <div className="card-header">
          <h2 className="card-title">Serie Storica Decennale (2014 – 2024)</h2>
          <p className="card-desc">
            Dieci anni di denunce INAIL e casi mortali confrontati con gli <strong>occupati ISTAT/Eurostat</strong>:
            una lettura del rischio separata dalle oscillazioni della platea occupazionale, dal picco
            COVID del 2020 al consolidamento post-pandemia.
          </p>
        </div>
        <SerieDecennaleWidget />
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

      {/* 2bis. Notizie e Cronaca: infortuni mortali e gravi (aggiornamento 06:00) */}
      <section className="card" aria-label="Notizie sugli Infortuni sul Lavoro">
        <div className="card-header">
          <h2 className="card-title">Cronaca: infortuni mortali e gravi in Italia</h2>
          <p className="card-desc">
            Aggiornamento automatico giornaliero alle <strong>06:00</strong> attraverso aggregazione RSS:
            le notizie più rilevanti sugli infortuni sul lavoro nel nostro paese, con classificazione
            automatica della gravità. Ogni voce rimanda alla fonte originale.
          </p>
        </div>
        <NewsInfortuniWidget />
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

      {/* 5. Macro-aree: Tasso di Incidenza per ripartizione geografica */}
      <section className="card" aria-label="Macro-aree geografiche">
        <div className="card-header">
          <h2 className="card-title">Macro-aree: il rischio per ripartizione geografica</h2>
          <p className="card-desc">
            Sintesi per le quattro ripartizioni ISTAT (Nord-Ovest, Nord-Est, Centro, Sud e Isole):
            tasso di incidenza su 1.000 occupati con confronto anno su anno. Il delta è in rosso
            quando l&apos;incidenza aumenta, in verde quando cala.
          </p>
        </div>
        <MacroAreaWidget />
      </section>

      {/* 6. Comparti Produttivi ATECO: Incidenza e Gravità */}
      <section className="card" aria-label="Comparti Produttivi ATECO">
        <div className="card-header">
          <h2 className="card-title">Comparti Produttivi e Attività Economiche (Classificazione ATECO)</h2>
          <p className="card-desc">
            Analisi comparativa per macro-settori (Sezioni A–U) con <strong>tasso di incidenza su 1.000 occupati</strong>,
            <strong>indice di gravità</strong> (giornate di assenza perse su occupati) e filtro annuale. I settori sono ordinati per
            incidenza: tocca un box per aprire il dettaglio completo.
          </p>
        </div>
        <AtecoSettoriWidget />
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

      {/* 7bis. Benchmark Internazionale Eurostat */}
      <section className="card" aria-label="Benchmark Internazionale">
        <div className="card-header">
          <h2 className="card-title">Benchmark Internazionale: il confronto con l&apos;Europa</h2>
          <p className="card-desc">
            Dove si colloca l&apos;Italia nella sicurezza sul lavoro rispetto agli altri grandi paesi europei?
            Il tasso standardizzato Eurostat (ESAW) permette un confronto equo tra paesi, depurato dalle
            differenze demografiche.
          </p>
        </div>
        <BenchmarkEurostatWidget />
      </section>

    </div>
  );
}
