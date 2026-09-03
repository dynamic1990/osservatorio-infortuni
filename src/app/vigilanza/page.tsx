import type { Metadata } from "next";
import { VigilanzaKpi } from "@/components/charts/vigilanza-kpi";
import { VigilanzaTrendWidget } from "@/components/charts/vigilanza-trend-widget";
import { VigilanzaViolazioniWidget } from "@/components/charts/vigilanza-violazioni-widget";
import { VigilanzaPanoramicaWidget } from "@/components/charts/vigilanza-panoramica-widget";
import { InfoModalVigilanza } from "@/components/ui/info-modal-vigilanza";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Vigilanza sul Lavoro | Osservatorio Infortuni sul Lavoro",
  description:
    "Dashboard sull'attività di vigilanza in materia di lavoro e previdenziale: serie storica 2021-2025 dei controlli ispettivi INL, INPS e INAIL, tasso di irregolarità, lavoratori in nero, provvedimenti di sospensione art. 14 D.Lgs. 81/2008, violazioni in materia di salute e sicurezza e patente a crediti.",
};

export default function VigilanzaPage() {
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
                  color: "#ffffff",
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
                INL &middot; Rapporti annuali attività di vigilanza
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Vigilanza sul Lavoro
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
              Quanti controlli arrivano davvero nelle aziende italiane, quanti lavoratori irregolari emergono e quanto
              si recupera in contributi evasi? La serie storica 2021-2025 dell&apos;attività ispettiva INL (con INPS e INAIL)
              racconta l&apos;azione di contrasto al lavoro sommerso e alle violazioni della sicurezza nei luoghi di lavoro,
              dai provvedimenti di sospensione alle nuove regole della patente a crediti.
            </p>
            <div style={{ marginTop: "var(--space-2)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              Progetto a cura di{" "}
              <strong style={{ color: "var(--color-text)" }}>Ing. Damiano Salvati</strong> &middot;
              aggiornato con il Rapporto annuale INL 2025
            </div>
          </div>
          <InfoModalVigilanza />
        </div>
      </header>

      {/* 2. KPI di Sintesi */}
      <section className="card" aria-label="Sintesi Vigilanza INL">
        <div className="card-header">
          <h2 className="card-title">L&apos;attività di vigilanza in numeri</h2>
          <p className="card-desc">
            Gli indicatori di sintesi dell&apos;ultimo anno disponibile (2025) e i confronti con il 2024.
            I dati coprono l&apos;attività complessiva di INL, INPS e INAIL.
          </p>
        </div>
        <VigilanzaKpi />
      </section>

      {/* 3. Serie Storica: Controlli e Tasso di Irregolarità / Sospensioni */}
      <section className="card" aria-label="Serie Storica Vigilanza">
        <div className="card-header">
          <h2 className="card-title">Serie Storica quinquennio (2021 – 2025)</h2>
          <p className="card-desc">
            L&apos;andamento dei controlli avviati sul territorio nazionale e del tasso di irregolarità, oppure
            l&apos;evoluzione dei provvedimenti di sospensione dell&apos;attività imprenditoriale con la quota legata
            alle gravi violazioni in materia di sicurezza. Usa il toggle per alternare le due viste.
          </p>
        </div>
        <VigilanzaTrendWidget />
      </section>

      {/* 4. Violazioni, Lavoro Nero e Lavoratori Irregolari */}
      <section className="card" aria-label="Violazioni e Lavoro Sommerso">
        <div className="card-header">
          <h2 className="card-title">Violazioni accertate e lavoro sommerso</h2>
          <p className="card-desc">
            L&apos;esito dei controlli: le violazioni penali in materia di salute e sicurezza (D.Lgs. 81/2008),
            i lavoratori trovati completamente in nero e il totale dei lavoratori irregolari cui si riferiscono
            gli atti ispettivi. Il toggle consente di confrontare le tre serie.
          </p>
        </div>
        <VigilanzaViolazioniWidget />
      </section>

      {/* 5. Recuperi, Sommerso e Patente a Crediti */}
      <section className="card" aria-label="Recuperi e Patente a Crediti">
        <div className="card-header">
          <h2 className="card-title">Recuperi, sommerso e patente a crediti</h2>
          <p className="card-desc">
            Il valore economico dell&apos;azione ispettiva e la nuova frontiera della patente a crediti nei cantieri:
            lo strumento introdotto dalla riforma del 2024 per alzare la soglia di responsabilità delle imprese.
          </p>
        </div>
        <VigilanzaPanoramicaWidget />
      </section>
    </div>
  );
}