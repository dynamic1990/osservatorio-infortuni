import type { Metadata } from "next";
import { HeroCongiunturaleKpi } from "@/components/charts/hero-congiunturale-kpi";
import { TrendDoppiaScalaWidget } from "@/components/charts/trend-doppia-scala-widget";
import { RegioniIncidenzaSection } from "@/components/charts/regioni-incidenza-section";
import { LimitiDatoSection } from "@/components/charts/limiti-dato-section";
import { MacroAreaWidget } from "@/components/charts/macro-area-widget";
import { AtecoSettoriWidget } from "@/components/charts/ateco-settori-widget";
import { DemografiaAnnualeWidget } from "@/components/charts/demografia-annuale-widget";
import { GravitaDurataWidget } from "@/components/charts/gravita-durata-widget";
import { DimensioniWidget } from "@/components/charts/dimensioni-widget";
import { StagionalitaWidget } from "@/components/charts/stagionalita-widget";
import { SettimanaWidget } from "@/components/charts/settimana-widget";
import { SerieDecennaleWidget } from "@/components/charts/serie-decennale-widget";
import { BenchmarkEurostatWidget } from "@/components/charts/benchmark-eurostat-widget";
import { InfoModalButton } from "@/components/ui/info-modal";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Osservatorio Infortuni sul Lavoro | Dati e Indicatori Statistici INAIL",
  description:
    "Piattaforma indipendente di trasparenza e monitoraggio statistico sugli infortuni sul lavoro in Italia: dati congiunturali a parità di periodo, media giornaliera dei morti sul lavoro, tassi di incidenza e gravità normalizzati sugli occupati, serie storica, benchmark europeo, mappa del rischio territoriale e comparti produttivi ATECO.",
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
            <p style={{ color: "var(--color-text-soft)", margin: 0, lineHeight: 1.6, fontSize: "0.95rem" }}>
              Piattaforma indipendente di trasparenza e monitoraggio statistico: dati congiunturali
              a parità di periodo, media giornaliera dei morti sul lavoro, tassi di incidenza e
              gravità normalizzati sugli occupati, serie storica, benchmark europeo, mappa del
              rischio territoriale e comparti produttivi ATECO.
            </p>
            <div style={{ marginTop: "var(--space-2)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              Progetto a cura di{" "}
              <strong style={{ color: "var(--color-text)" }}>Ing. Damiano Salvati</strong>
            </div>
          </div>
          <InfoModalButton />
        </div>
      </header>

      {/* 2. Sezione Apertura: Monitoraggio Congiunturale 2026 vs 2025 a Pari Perimetro */}
      <section className="card" aria-label="Monitoraggio Congiunturale 2026 vs 2025">
        <HeroCongiunturaleKpi />
      </section>

      {/* 2bis. CTA Cronaca: la rassegna stampa è in pagina dedicata */}
      <section className="card" aria-label="Cronaca di infortuni">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: "var(--space-1)" }}>Cronaca di infortuni</h2>
            <p className="card-desc" style={{ margin: 0 }}>
              La rassegna stampa quotidiana degli infortuni gravi e mortali sul lavoro: i fatti del giorno,
              raggruppati per evento quando più testate raccontano lo stesso infortunio.
            </p>
          </div>
          <a href="/cronaca-infortuni" className="btn-pill" style={{ textDecoration: "none" }}>
            Vai alla cronaca →
          </a>
        </div>
      </section>

      {/* 3. Serie Storica 2014-2025 */}
      <section className="card" aria-label="Serie Storica" id="serie-storica">
        <div className="card-header">
          <h2 className="card-title">Serie Storica (2014 – 2025)</h2>
          <p className="card-desc">
            Dodici anni di denunce INAIL e casi mortali confrontati con gli <strong>occupati ISTAT/Eurostat</strong>:
            una lettura del rischio separata dalle oscillazioni della platea occupazionale, dal picco
            COVID del 2020 al consolidamento post-pandemia.
          </p>
        </div>
        <SerieDecennaleWidget />
      </section>

      {/* 3. Trend Storico a Doppia Scala: Volumi Assoluti vs Tasso di Incidenza */}
      <section className="card" aria-label="Evoluzione e Indice di Incidenza" id="evoluzione-incidenza">
        <div className="card-header">
          <h2 className="card-title">Evoluzione Temporale e Tasso di Incidenza (2020 – 2025)</h2>
          <p className="card-desc">
            Rappresentazione cartesiana su <strong>doppia scala</strong>: i volumi assoluti di denunce
            (barre, asse sinistro) vengono confrontati con il <strong>tasso di incidenza</strong> (linea, asse destro)
            espresso come <em>infortuni ogni 1.000 occupati</em>, dal primo anno dei microdati (2020) all&apos;ultimo consolidato (2025).
          </p>
        </div>
        <TrendDoppiaScalaWidget />
      </section>

      {/* 4. Mappa Territoriale Interattiva: Colore = Tasso di Incidenza */}
      <section className="card" aria-label="Mappa Territoriale del Rischio" id="mappa-regioni">
        <div className="card-header">
          <h2 className="card-title">Mappa Territoriale e Ranking Regionale: Incidenza, Letalità e Impatto</h2>
          <p className="card-desc">
            Visualizzazione comparata per regione con possibilità di dettagliare le <strong>Province Autonome di Bolzano e Trento</strong>.
            Le barre del ranking includono scorrimento dedicato per una lettura nitida delle etichette e del benchmark nazionale.
          </p>
        </div>
        <RegioniIncidenzaSection />
      </section>

      {/* 4b. Limiti del dato dichiarati: dispersione, copertura settoriale, rigetto */}
      <section className="card" aria-label="Dove il dato va letto con cautela" id="limiti-del-dato">
        <div className="card-header">
          <h2 className="card-title">Dove il dato va letto con cautela</h2>
          <p className="card-desc">
            Tre cose che questi numeri non dicono da soli. La prima: incidenza e letalità vanno in
            direzioni opposte, quindi una classifica regionale dipende da quale delle due si guarda. La
            seconda: una parte consistente delle denunce non ha un settore attribuito, e la quota cambia
            molto da regione a regione. La terza: tre denunce su dieci non arrivano a un riconoscimento.
            Nessun ente pubblica i propri buchi di classificazione; qui sono dichiarati accanto ai dati.
          </p>
        </div>
        <LimitiDatoSection />
      </section>

      {/* 5. Macro-aree: Tasso di Incidenza per ripartizione geografica */}
      <section className="card" aria-label="Macro-aree geografiche" id="macro-aree">
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
      <section className="card" aria-label="Comparti Produttivi ATECO" id="comparti-ateco">
        <div className="card-header">
          <h2 className="card-title">Comparti Produttivi e Attività Economiche (Classificazione ATECO)</h2>
          <p className="card-desc">
            Analisi comparativa per macro-settori (Sezioni A–U) con <strong>tasso di incidenza su 1.000 occupati</strong>,
            <strong>giornate perse su 1.000 occupati</strong> (impatto complessivo, non gravità per evento) e filtro annuale. È disponibile anche il
            <strong>dettaglio per divisione ATECO (2 cifre)</strong> con ricerca per codice o settore, trend 2020 – 2025 e conteggi per singola attività economica. I settori sono ordinati per incidenza: tocca un box per aprire il dettaglio completo.
          </p>
        </div>
        <AtecoSettoriWidget />
      </section>

      {/* 6. Profilo Demografico: Genere e Fasce d'Età con Selettore Anno */}
      <section className="card" aria-label="Distribuzione Demografica" id="distribuzione-demografica">
        <div className="card-header">
          <h2 className="card-title">Distribuzione Demografica: Genere e Fasce d&apos;Età</h2>
          <p className="card-desc">
            Composizione anagrafica degli infortunati con distinzione di genere e classi d&apos;età all&apos;accadimento.
            Seleziona l&apos;anno per osservare l&apos;evoluzione demografica della popolazione infortunata.
          </p>
        </div>
        <DemografiaAnnualeWidget />
      </section>

      {/* 7. Distribuzione per giorno della settimana (open data INAIL, livello record) */}
      <section className="card" aria-label="Distribuzione settimanale degli infortuni" id="giorno-settimana">
        <div className="card-header">
          <h2 className="card-title">In quali giorni della settimana accadono gli infortuni</h2>
          <p className="card-desc">
            Distribuzione delle denunce INAIL per giorno della settimana, calcolata sull&apos;intero
            insieme dei record open data (tutte le regioni, non un campione). Seleziona uno o più anni
            per confrontarli, scegli tra denunce totali e mortali, e separa gli infortuni in occasione
            di lavoro da quelli in itinere.
          </p>
          <InfoModalButton>
            <section className="modal-section">
              <h3 className="modal-section-title">Distribuzione per giorno della settimana</h3>
              <p>
                Fonte: open data INAIL, dataset semestrali per regione con dettaglio record
                (campo <em>DataAccadimento</em>). Perimetro: 20 regioni, anni 2021-2025, tutte le
                denunce presenti nei file, infortuni in occasione di lavoro e in itinere.
              </p>
              <ul>
                <li>
                  <strong>Giorno derivato dalla data</strong>: nessun record scartato per data non
                  valida. Il conteggio è un censimento delle denunce contenute nei file, non un
                  campione.
                </li>
                <li>
                  <strong>Valori assoluti e calendario</strong>: in un anno ci sono circa 52
                  lunedì e 52 domeniche, quindi il conteggio grezzo non è confrontabile tra giorni.
                  La vista <em>media per giorno</em> divide per il numero di giorni di quel tipo.
                </li>
                <li>
                  <strong>Indice vs feriale</strong>: casi del giorno diviso la media dei giorni
                  Lun-Ven dello stesso anno e perimetro. 1,00 = giorno feriale medio, 0,50 = metà.
                </li>
                <li>
                  <strong>Limite dichiarato</strong>: non è un tasso di incidenza su occupati. Il
                  numero di occupati per singolo giorno della settimana non è disponibile nella
                  fonte, quindi il denominatore resta di calendario e non di esposizione.
                </li>
                <li>
                  <strong>Anno parziale</strong>: se un anno non copre dodici mesi il campo
                  <em>copertura.completo</em> è falso e il confronto con gli altri anni va evitato.
                </li>
              </ul>
            </section>
          </InfoModalButton>
        </div>
        <SettimanaWidget />
      </section>

      {/* 8. Analisi Qualitativa: Gravità del Danno, Durata delle Assenze e Stagionalità */}
      <section className="card" aria-label="Analisi di Gravità e Durata Assenze" id="gravita-inabilita">
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

      {/* 9. Benchmark Internazionale Eurostat */}
      <section className="card" aria-label="Benchmark Internazionale" id="benchmark-europa">
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
