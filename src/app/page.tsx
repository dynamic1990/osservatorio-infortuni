import type { Metadata } from "next";
import { getInailView } from "@/lib/inail-infortuni";
import { compactNumber, exactNumber, longDate } from "@/lib/format";
import {
  buildMonthlySerie,
  InfortuniMonthlyChart,
} from "@/components/charts/infortuni-monthly-chart";
import {
  buildSettoriSerie,
  InfortuniSettoriChart,
} from "@/components/charts/infortuni-settori-chart";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Infortuni sul lavoro in Italia",
  description: "Serie storiche e analisi sugli infortuni sul lavoro da open data INAIL.",
};

export default function HomePage() {
  const { snapshot, meta, freshness } = getInailView();
  const serie = buildMonthlySerie(snapshot.aggregates);
  const settori = buildSettoriSerie(snapshot.aggregates);
  const totale = snapshot.coverage.casi;
  const totaleAnno = snapshot.aggregates.reduce((acc, row) => acc + (row.anno === snapshot.period.annoA ? row.casi : 0), 0);

  return (
    <div style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-4)" }}>
      <section>
        <h1 style={{ fontSize: "1.7rem", margin: "0 0 var(--space-2)" }}>Infortuni sul lavoro in Italia</h1>
        <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "70ch" }}>
          Quanti infortuni denunciati all'INAIL, dove, in quali settori e come stanno cambiando nel tempo.
          Dati ufficiali aggregati, con fonte e data di estrazione sempre visibili.
        </p>
      </section>

      <section className="card" aria-label="Numeri principali">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
          <div>
            <div className="metric-label">Casi totali nel periodo</div>
            <div className="metric">{compactNumber(totale)}</div>
          </div>
          <div>
            <div className="metric-label">Casi {snapshot.period.annoA}</div>
            <div className="metric">{compactNumber(totaleAnno)}</div>
          </div>
          <div>
            <div className="metric-label">Regioni coperte</div>
            <div className="metric">{snapshot.coverage.regioni}/20</div>
          </div>
          <div>
            <div className="metric-label">Province</div>
            <div className="metric">{exactNumber(snapshot.coverage.province)}</div>
          </div>
        </div>
        <div className="source-note">
          Fonte: {meta.source.owner}. Estrazione: {longDate(freshness.extractedAt)}.{" "}
          <span className={`freshness ${freshness.state}`}>{freshness.state === "fresh" ? "dato fresco" : "dato da aggiornare"}</span>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Andamento mensile</h2>
        <InfortuniMonthlyChart data={serie} />
        <p className="source-note">
          Casi denunciati per mese di accadimento, periodo {snapshot.period.annoDa}–{snapshot.period.annoA}.
          La cadenza mensile non include la definizione amministrativa: i casi possono essere revisionati.
        </p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Settori più colpiti (ATECO)</h2>
        <InfortuniSettoriChart data={settori} />
        <p className="source-note">
          Primi 15 codici ATECO per numero di casi. Il confronto tra settori va letto con i denominatori
          (occupati per settore): un settore grande può avere molti casi senza un rischio più alto.
        </p>
      </section>
    </div>
  );
}
