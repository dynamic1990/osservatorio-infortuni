import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InformoKpi } from "@/components/charts/informo-kpi";
import { InformoTrendWidget } from "@/components/charts/informo-trend-widget";
import { InformoVociLista } from "@/components/charts/informo-voci-lista";
import { InformoFattoriWidget } from "@/components/charts/informo-fattori-widget";
import { InformoEsploratore } from "@/components/charts/informo-esploratore";
import { getInformoAnalisi, INFORM_COLORS } from "@/lib/informo-casi";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Casi mortali | Analisi Infor.MO INAIL",
  description:
    "Analisi di dettaglio dei casi mortali sul lavoro dell'archivio Infor.MO INAIL 2020-2024: dinamica degli eventi, fattori causali classificati, settori e territori a maggior rischio, profilo dei lavoratori e delle aziende coinvolti.",
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
    <section className="card" style={{ padding: "var(--space-5)", display: "grid", gap: "var(--space-4)" }}>
      <div>
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
        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 750, letterSpacing: "-0.01em" }}>
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
              settore e il territorio, il profilo di chi è morto e dell&apos;azienda,
              e soprattutto i fattori causali classificati dagli analisti secondo
              il modello Infor.MO. Non un elenco di numeri: una lettura dei
              pattern che si ripetono, per capire dove intervenire.
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            fontSize: "0.78rem",
            color: "var(--color-text-muted)",
          }}
        >
          <span>Da dove vengono i dati → INAIL, archivio Infor.MO (InformoWeb)</span>
          <span>·</span>
          <span>1.212 casi analizzati 2020-2024</span>
          <span>·</span>
          <span>2.334 fattori causali classificati</span>
        </div>
      </header>

      {/* 1. Confronto più recente (apertura, RULES.md regola 2) */}
      <Sezione occhiello="Il punto di partenza" titolo="2024 vs 2023: come stiamo andando?">
        <InformoKpi />
      </Sezione>

      {/* 2. Trend storico */}
      <Sezione occhiello="Da dove veniamo" titolo="La serie quinquennale">
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
          Il conteggio è riferito al singolo anno: il confronto viene con il
          delta vs anno precedente, non con aggregati pluriennali (RULES.md
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

      {/* 4. Fattori causali */}
      <Sezione occhiello="I fattori causali" titolo="Cosa è intervenuto nell'evento">
        <InformoFattoriWidget />
      </Sezione>

      {/* 5. Esploratore */}
      <Sezione occhiello="La lettura caso per caso" titolo="Cerca nella dinamica">
        <InformoEsploratore />
      </Sezione>

      {/* 6. Metodologia e limiti */}
      <Sezione occhiello="Metodologia e limiti" titolo="Da dove vengono questi dati">
        <div style={{ display: "grid", gap: "var(--space-2)", fontSize: "0.88rem", lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            La pagina usa l&apos;archivio Infor.MO di INAIL, il database pubblico
            che documenta i casi di infortunio mortale sottoposti a un&apos;analisi
            secondo il modello Infor.MO (classe di appartenenza del rischio,
            dinamica, fattori causali). I dati sono recuperati via API
            (<code>filtra.do</code>, <code>dettaglio.do</code>,
            <code>dettagliInfortunio.do</code>, <code>dettaglioFattore.do</code>)
            senza autenticazione, dal 2020 al 2024. Gli endpoint sono parte del
            vecchio portale &ldquo;InformoWeb&rdquo; di INAIL, non degli Open Data
            ufficiali del percorso dati.inail.it.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Perimetro:</strong> l&apos;archivio analizza una parte dei casi
            denunciati con esito mortale. Non è il censimento dei morti sul
            lavoro: i totali ufficiali da denunce sono quelli della pagina
            Infortuni. Qui la cosa utile è la classificazione dei perché, che
            esiste solo per i casi analizzati.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Limiti dichiarati:</strong> la fonte non distingue (senza
            filtri dedicati) occasion di lavoro e in itinere, quindi il canale
            non è separabile in questa pagina. La classificazione è quella degli
            analisti INAIL e riflette la ricostruzione a posteriori, non un
            esito giudiziale né una attribuzione di colpa. I campi anagrafici
            (età, mansione, azienda) sono assenti o parziali per una quota di
            casi: la copertura per ciascuna vista è indicata dove serve.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Aggiornamento:</strong> i dati sono estratti e aggiornati
            periodicamente con uno script ETL (<code>scripts/etl/estrai_informo_dettaglio.py</code>);
            la data di generazione del dataset è riportata nel registro fonti.
          </p>
        </div>
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

