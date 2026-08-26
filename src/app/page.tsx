import type { Metadata } from "next";
import { getInailView } from "@/lib/inail-infortuni";
import { compactNumber, exactNumber, longDate } from "@/lib/format";
import { InfortuniAnnualeChart } from "@/components/charts/infortuni-annuale-chart";
import { buildMonthlySerie } from "@/lib/serie-utils";
import { InfortuniMonthlyChart } from "@/components/charts/infortuni-monthly-chart";
import { InfortuniSettoriChart } from "@/components/charts/infortuni-settori-chart";

export const revalidate = 86_400;
export const metadata: Metadata = {
  title: "Infortuni sul lavoro in Italia",
  description: "Serie storiche e analisi sugli infortuni sul lavoro da open data INAIL.",
};

export default function HomePage() {
  const { viste, meta, freshness } = getInailView();
  const annuale = viste.serieAnnuale.map((p) => ({ anno: p.anno, casi: p.casi }));
  const mensile = buildMonthlySerie(viste.serieMensile);
  const settori = viste.settori.map((s) => ({ settore: s.key, casi: s.casi }));
  const totale = viste.coverage.casi;
  const mortali = viste.coverage.mortali;

  return (
    <div style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-4)" }}>
      <section>
        <h1 style={{ fontSize: "1.7rem", margin: "0 0 var(--space-2)" }}>Infortuni sul lavoro in Italia</h1>
        <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "75ch" }}>
          Quanti infortuni sul lavoro denunciati all&apos;INAIL, dove, in quali settori e come cambiano nel
          tempo. Dati ufficiali aggregati, tutte le 20 regioni, serie storica 2020-2024 consolidata.
        </p>
      </section>

      <section className="card" aria-label="Numeri principali">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "var(--space-4)" }}>
          <div>
            <div className="metric-label">Casi 2020-2024</div>
            <div className="metric">{compactNumber(totale)}</div>
          </div>
          <div>
            <div className="metric-label">Esiti mortali</div>
            <div className="metric">{exactNumber(mortali)}</div>
          </div>
          <div>
            <div className="metric-label">Regioni</div>
            <div className="metric">20/20</div>
          </div>
          <div>
            <div className="metric-label">Periodo</div>
            <div className="metric">2020-24</div>
          </div>
        </div>
        <div className="source-note">
          Fonte: {meta.source.owner}. Estrazione: {longDate(freshness.extractedAt)}.{" "}
          <span className={`freshness ${freshness.state}`}>{freshness.state === "fresh" ? "dato fresco" : "dato da aggiornare"}</span>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Andamento annuale</h2>
        <InfortuniAnnualeChart data={annuale} />
        <p className="source-note">{viste.coverage.notaPeriodo ?? ""}</p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Congiuntura mensile recente</h2>
        <InfortuniMonthlyChart data={mensile} />
        <p className="source-note">
          Casi per mese di accadimento nelle finestre di rilevazione disponibili (gen-giu di ogni anno).
          Dato congiunturale, non una serie continua.
        </p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Settori più colpiti (ATECO, 2020-2024)</h2>
        <InfortuniSettoriChart data={settori} />
        <p className="source-note">
          Primi 15 codici ATECO per numero di casi. Il confronto tra settori richiede i denominatori
          (occupati per settore): un settore grande può avere molti casi senza un rischio più alto.
        </p>
      </section>
    </div>
  );
}
