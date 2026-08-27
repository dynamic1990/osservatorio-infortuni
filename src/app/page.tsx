import type { Metadata } from "next";
import { getInailView } from "@/lib/inail-infortuni";
import { compactNumber, exactNumber, longDate, percent } from "@/lib/format";
import { InfortuniAnnualeChart } from "@/components/charts/infortuni-annuale-chart";
import { buildMonthlySerie } from "@/lib/serie-utils";
import { InfortuniMonthlyChart } from "@/components/charts/infortuni-monthly-chart";
import { InfortuniSettoriChart } from "@/components/charts/infortuni-settori-chart";
import { InfortuniDistribuzioneChart } from "@/components/charts/infortuni-distribuzione-chart";
import { regioneName, genereName, modalitaName, gruppoName } from "@/lib/labels";
import { SerieTemporaleWidget } from "@/components/charts/serie-temporale-widget";
import { RegioniSection } from "@/components/charts/regioni-section";

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
  const regioni = viste.regioni.map((r) => ({ regione: r.key, casi: r.casi }));
  const totale = viste.coverage.casi;
  const mortali = viste.coverage.mortali;

  const generi = viste.generi.map((g) => ({ key: g.key, casi: g.casi, label: genereName(g.key) }));
  const fasce = viste.fasceEta.map((f) => ({ key: f.key, casi: f.casi, label: f.key }));
  const modalita = viste.modalita.map((m) => ({ key: m.key, casi: m.casi, label: modalitaName(m.key) }));
  const gruppi = viste.gruppiTariffari.map((g) => ({ key: g.key, casi: g.casi, label: gruppoName(g.key) }));

  const casiGen = generi.find((g) => g.key === "M")?.casi ?? 0;
  const casiFem = generi.find((g) => g.key === "F")?.casi ?? 0;
  const casiOcc = modalita.find((m) => m.key === "N")?.casi ?? 0;
  const casiIti = modalita.find((m) => m.key === "S")?.casi ?? 0;
  const casiSettND = settori.find((s) => s.settore === "ND")?.casi ?? 0;
  const casiSettNoti = totale - casiSettND;

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
        <h2 style={{ marginTop: 0 }}>Andamento nel tempo</h2>
        <p style={{ color: "var(--color-text-soft)", marginTop: 0, maxWidth: "80ch" }}>
          Confronta l&apos;andamento di infortuni in occasione di lavoro e in itinere, esiti mortali,
          casi con danno permanente e giornate di lavoro perse. Seleziona una o più regioni per
          confrontarle tra loro.
        </p>
        <SerieTemporaleWidget />
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
        <h2 style={{ marginTop: 0 }}>Per regione (2020-2024)</h2>
        <RegioniSection data={regioni} />
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Per genere e fascia d&apos;età</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)" }}>
          <div>
            <h3 style={{ fontSize: "1rem" }}>Genere</h3>
            <InfortuniDistribuzioneChart data={generi} />
            <p className="source-note">
              Maschi {compactNumber(casiGen)} ({percent(casiGen / totale)}), femmine {compactNumber(casiFem)} ({percent(casiFem / totale)}).
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "1rem" }}>Fascia d&apos;età</h3>
            <InfortuniDistribuzioneChart data={fasce} />
            <p className="source-note">Età all&apos;accadimento, anni compiuti. La distribuzione va letta con gli occupati per età.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Modalità di accadimento</h2>
        <InfortuniDistribuzioneChart data={modalita} />
        <p className="source-note">
          In occasione di lavoro {compactNumber(casiOcc)} ({percent(casiOcc / totale)}), in itinere {compactNumber(casiIti)} ({percent(casiIti / totale)}).
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

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Grandi gruppi tariffari (2020-2024)</h2>
        <InfortuniDistribuzioneChart data={gruppi} />
        <p className="source-note">
          Classificazione INAIL per comparto produttivo. Il gruppo &quot;Attività varie&quot; raccoglie le voci non altrove classificate.
        </p>
      </section>
    </div>
  );
}
