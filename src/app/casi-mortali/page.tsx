import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InformoKpi } from "@/components/charts/informo-kpi";
import { InformoTrendWidget } from "@/components/charts/informo-trend-widget";
import { InformoVociLista } from "@/components/charts/informo-voci-lista";
import { InformoEsploratore } from "@/components/charts/informo-esploratore";
import { InfoModalButton } from "@/components/ui/info-modal";
import { getInformoAnalisi, INFORM_COLORS } from "@/lib/informo-casi";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Casi mortali | Analisi Infor.MO INAIL",
  description:
    "Analisi di dettaglio dei casi mortali sul lavoro dell'archivio Infor.MO INAIL 2020-2024: dinamica degli eventi, settori e territori a maggior rischio, profilo dei lavoratori e delle aziende coinvolti, con la copertura dell'archivio sul totale dei decessi denunciati.",
  alternates: { canonical: "/casi-mortali" },
};

// Sezione con intestazione e contenuto, per uniformità con le altre pagine.
function Sezione({
  titolo,
  occhiello,
  children,
}: {
  titolo: string;
  occhiello?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="card"
      style={{ padding: "var(--space-5)", display: "grid", gap: "var(--space-4)", minWidth: 0, maxWidth: "100%" }}
    >
      <div className="card-header" style={{ marginBottom: 0 }}>
        {occhiello && (
          <div
            style={{
              color: "var(--color-accent)",
              fontSize: "0.78rem",
              fontWeight: 650,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {occhiello}
          </div>
        )}
        <h2 className="card-title" style={{ margin: 0 }}>
          {titolo}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function CasiMortaliPage() {
  const analisi = getInformoAnalisi();
  const serie = analisi.serie;

  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* Header */}
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
                Analisi casi mortali
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Archivio Infor.MO &middot; INAIL &middot; 2020-2024
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Casi mortali: la lettura dei perché
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
              Ogni caso mortale documentato nell&apos;archivio Infor.MO di INAIL
              diventa qui un dato analizzabile: la dinamica dell&apos;evento, il
              settore e il territorio, il profilo di chi è morto e dell&apos;azienda.
              Non un elenco di numeri: una lettura dei pattern che si ripetono,
              per capire dove intervenire.
            </p>
          </div>
        </div>
        <InfoModalButton>
          <section className="modal-section">
            <h3 className="modal-section-title">1. Fonte dei dati e perimetro</h3>
            <p className="modal-text">
              I dati provengono dall&apos;archivio <strong>Infor.MO</strong> di INAIL
              (InformoWeb), il database pubblico degli infortuni analizzati con
              il modello Infor.MO: classe di appartenenza del rischio, dinamica
              dell&apos;evento e fattori causali. I casi sono recuperati via API
              pubbliche (filtra.do, dettaglio.do, dettagliInfortunio.do,
              dettaglioFattore.do) per gli eventi con tipoEvento mortale nel
              periodo 2020-2024.
            </p>
            <p className="modal-text">
              <strong>Perimetro:</strong> l&apos;archivio analizza una parte dei casi
              denunciati con esito mortale, non è il censimento dei morti sul
              lavoro. I totali ufficiali da denunce sono nella pagina Infortuni.
              Il confronto anno su anno non ha senso su questo sottoinsieme: la
              variazione misurerebbe la copertura dell&apos;archivio più che il
              fenomeno reale. Per questo la pagina non presenta delta tra anni.
            </p>
          </section>
          <section className="modal-section">
            <h3 className="modal-section-title">2. Cosa mostra ogni blocco</h3>
            <ul className="modal-list">
              <li><strong>KPI d&apos;apertura:</strong> casi analizzati nell&apos;anno più recente (2024), copertura del dettaglio e quota sul totale nazionale dei morti denunciati.</li>
              <li><strong>Serie quinquennale:</strong> un punto per anno: il totale dei morti denunciati e dentro la quota con scheda di dettaglio in archivio.</li>
              <li><strong>Cause, settori, territorio:</strong> prime voci per anno con la classificazione INAIL.</li>
              <li><strong>Profilo:</strong> popolazioni a rischio, mansioni, sesso, rapporto di lavoro, sede della lesione.</li>
              <li><strong>Esploratore:</strong> ricerca libera full-text nella narrativa dei 1.212 casi con filtri per anno, settore e causa.</li>
            </ul>
          </section>
          <section className="modal-section">
            <h3 className="modal-section-title">3. Limiti dichiarati</h3>
            <ul className="modal-list">
              <li><strong>Campione, non censimento:</strong> i 1.212 casi analizzati 2020-2024 sono l&apos;8,6% dei 14.051 morti denunciati nello stesso periodo. La lettura di cause, settori e profili vale per i casi analizzati, non per tutti i decessi.</li>
              <li><strong>Occasione di lavoro / in itinere:</strong> la fonte dell&apos;archivio non distingue i due canali senza filtri dedicati, quindi il canale non è separabile in questa pagina e il dato è presentato in forma complessiva.</li>
              <li><strong>Classificazione degli analisti:</strong> è la ricostruzione a posteriori degli analisti INAIL, non un esito giudiziale né una attribuzione di colpa.</li>
              <li><strong>Campi parziali:</strong> età, mansione e azienda sono assenti o parziali per una quota di casi; la copertura per vista è indicata dove serve.</li>
            </ul>
          </section>
          <section className="modal-section">
            <h3 className="modal-section-title">4. Aggiornamento</h3>
            <p className="modal-text">
              I dati sono estratti e aggiornati con uno script ETL
              (scripts/etl/estrai_informo_dettaglio.py); la data di generazione
              del dataset è riportata nel registro fonti.
            </p>
          </section>
        </InfoModalButton>
      </header>

      {/* 1. Il punto di partenza (senza confronti anno su anno: vedi metodologia) */}
      <Sezione occhiello="Il punto di partenza" titolo="I casi analizzati nell'anno più recente">
        <InformoKpi />
      </Sezione>

      {/* 2. Copertura dell'archivio sul totale */}
      <Sezione occhiello="La copertura dell'archivio" titolo="Infortuni mortali: totale denunciato e casi analizzati">
        <InformoTrendWidget />
      </Sezione>

      {/* 3. Approfondimenti: cause, settori, territorio */}
      <Sezione occhiello="Le cause" titolo="Perché si muore: tipologie di incidente">
        <InformoVociLista
          titolo="Incidente (causa prevalente)"
          sottotitolo="Classificazione INAIL della dinamica, casi per anno"
          serie={analisi.incidenti}
          limite={8}
          colore={INFORM_COLORS.corrente}
        />
      </Sezione>

      <Sezione occhiello="I settori" titolo="Dove avvengono i casi mortali">
        <InformoVociLista
          titolo="Settore di attività"
          sottotitolo="Classificazione INAIL per attività economica"
          serie={analisi.settori}
          limite={8}
          colore={INFORM_COLORS.secondario}
        />
        <p className="source-note">
          Il conteggio è riferito al singolo anno selezionato: ogni lista
          mostra le voci dell&apos;anno, senza aggregati pluriennali (RULES.md
          regola 1).
        </p>
      </Sezione>

      <Sezione occhiello="Il territorio" titolo="Dove avvengono i casi mortali">
        <InformoVociLista
          titolo="Macro-aree"
          sottotitolo="Localizzazione INAIL: Nord-Ovest, Nord-Est, Centro, Sud e Isole"
          serie={analisi.territori}
          limite={4}
          colore={INFORM_COLORS.corrente}
        />
      </Sezione>

      <Sezione occhiello="I lavoratori e le aziende" titolo="Profilo di chi muore">
        <InformoVociLista
          titolo="Popolazioni a rischio"
          sottotitolo="Segnalazioni demografiche INAIL (anziani, stranieri, irregolari, giovani...)"
          serie={analisi.popolazioni}
          limite={8}
          colore={INFORM_COLORS.secondario}
        />
        <InformoVociLista
          titolo="Mansioni coinvolte"
          sottotitolo="Le prime mansioni per numero di casi"
          serie={analisi.mansioni}
          limite={8}
          colore={INFORM_COLORS.corrente}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Sesso</strong>
            <InformoCondensed serie={analisi.profili.sesso} />
          </div>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Rapporto di lavoro</strong>
            <InformoCondensed serie={analisi.profili.rapportoLavoro} limite={4} />
          </div>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Sede della lesione</strong>
            <InformoCondensed serie={analisi.profili.sedeLesione} limite={4} />
          </div>
        </div>
      </Sezione>

      {/* 4. Esploratore */}
      <Sezione occhiello="La lettura caso per caso" titolo="Cerca nella dinamica">
        <InformoEsploratore />
      </Sezione>
    </div>
  );
}

// Sotto-helper: mostra poche voci di una serie profili in modo compatto
// (senza filtro anno: serve solo come riepilogo dell'anno più recente).
function InformoCondensed({
  serie,
  limite = 3,
  labelAnno = 2024,
}: {
  serie?: { anno: number; voci: { nome: string; count: number }[] }[];
  limite?: number;
  labelAnno?: number;
}) {
  if (!serie) return null;
  const anno = serie.find((s) => s.anno === labelAnno);
  if (!anno) return null;
  const voci = anno.voci.slice(0, limite);
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {voci.map((v) => (
        <li key={v.nome} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", fontSize: "0.82rem" }}>
          <span style={{ color: "var(--color-text-soft)" }}>{v.nome}</span>
          <strong>{v.count}</strong>
        </li>
      ))}
    </ul>
  );
}

