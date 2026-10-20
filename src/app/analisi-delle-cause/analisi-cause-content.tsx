"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { InformoVociLista } from "@/components/charts/informo-voci-lista";
import { InformoEsploratore } from "@/components/charts/informo-esploratore";
import { FiltroDimensioneAziendale } from "@/components/charts/filtro-dimensione-aziendale";
import { FiltroSettoreAteco, type AtecoDataset } from "@/components/charts/filtro-settore-ateco";
import { InformoPerimetro } from "@/components/charts/informo-perimetro";
import { InfoModalButton } from "@/components/ui/info-modal";
import {
  getInformoAnalisi,
  getInformoGraviAnalisi,
  INFORM_COLORS,
  PERIMETRI_INFORMO,
  perimetroDaQuery,
  type PerimetroInformo,
  type PerimetroQuery,
  type AnnoVoci,
  type InformoAnalisi,
} from "@/lib/informo-casi";

// Dataset Ateco (per sezione attività economica): un sottoinsieme dei casi
// con le viste principali ricalcolate (serie, incidenti, settori, territorio,
// profilo, fattori). Il filtro per sezione agisce a monte dei toggle
// mortali/gravi: quando una sezione è selezionata, tutte le viste a valle
// mostrano i casi di quella sezione.
const FILE_ATECO = {
  mortali: "/data/informo-ateco-analisi.json",
  gravi: "/data/informo-ateco-analisi-gravi.json",
} as const;

// Trasforma la vista di un dataset Ateco nel formato AnnoVoci[].
function vistaAteco(
  dati: AtecoDataset | null,
  sezione: string,
  campo: "incidenti" | "settori" | "territori" | "fattoriTipo" | "problemiSicurezza"
): AnnoVoci[] {
  if (!dati) return [];
  const sez = dati.sezioni.find((s) => s.sezione === sezione);
  if (!sez) return [];
  return sez.perAnno.map((p) => ({
    anno: p.anno,
    voci: p.viste[campo].map((v) => ({ nome: v.nome, count: v.count })),
  }));
}

// Serie per anno dal dataset Ateco (casi per anno della sezione).
function serieAteco(
  dati: AtecoDataset | null,
  sezione: string
): { anno: number; casiAnalizzati: number; totaleFiltri?: number }[] {
  if (!dati) return [];
  const sez = dati.sezioni.find((s) => s.sezione === sezione);
  if (!sez) return [];
  return sez.perAnno.map((p) => ({ anno: p.anno, casiAnalizzati: p.casi }));
}

// Unisce due serie "anno -> voci" sommando i conteggi per nome (per la
// modalità "entrambi": mortali + gravi).
function unisciSerie(a: AnnoVoci[], b: AnnoVoci[]): AnnoVoci[] {
  const perAnno = new Map<number, Map<string, number>>();
  for (const s of [a, b]) {
    for (const anno of s) {
      const mappa = perAnno.get(anno.anno) ?? new Map<string, number>();
      for (const v of anno.voci) mappa.set(v.nome, (mappa.get(v.nome) ?? 0) + v.count);
      perAnno.set(anno.anno, mappa);
    }
  }
  return Array.from(perAnno.entries())
    .sort((x, y) => x[0] - y[0])
    .map(([anno, mappa]) => ({
      anno,
      voci: Array.from(mappa.entries())
        .map(([nome, count]) => ({ nome, count }))
        .sort((x, y) => y.count - x.count),
    }));
}

// Somma due serie profili (record "chiave -> AnnoVoci[]").
function unisciProfili(
  a: Record<string, AnnoVoci[]>,
  b: Record<string, AnnoVoci[]>
): Record<string, AnnoVoci[]> {
  const chiavi = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: Record<string, AnnoVoci[]> = {};
  for (const k of chiavi) {
    out[k] = unisciSerie(a[k] ?? [], b[k] ?? []);
  }
  return out;
}

// Somma due serie per la voce di conteggio (es. fattori).
function unisciSerieInformo(
  a: InformoAnalisi,
  b: InformoAnalisi
): Pick<
  InformoAnalisi,
  "serie" | "incidenti" | "settori" | "territori" | "popolazioni" | "mansioni" | "profili" | "fattori"
> {
  const serie = [...a.serie, ...b.serie].reduce<Map<number, { casiAnalizzati: number; totaleFiltri?: number }>>(
    (acc, s) => {
      const cur = acc.get(s.anno) ?? { casiAnalizzati: 0 };
      cur.casiAnalizzati += s.casiAnalizzati;
      if (s.totaleFiltri !== undefined) {
        cur.totaleFiltri = (cur.totaleFiltri ?? 0) + (s.totaleFiltri ?? 0);
      }
      acc.set(s.anno, cur);
      return acc;
    },
    new Map()
  );
  const serieUnite = Array.from(serie.entries())
    .sort((x, y) => x[0] - y[0])
    .map(([anno, v]) => ({
      anno,
      casiAnalizzati: v.casiAnalizzati,
      totaleFiltri: v.totaleFiltri,
    }));
  return {
    serie: serieUnite,
    incidenti: unisciSerie(a.incidenti, b.incidenti),
    settori: unisciSerie(a.settori, b.settori),
    territori: unisciSerie(a.territori, b.territori),
    popolazioni: unisciSerie(a.popolazioni, b.popolazioni),
    mansioni: unisciSerie(a.mansioni, b.mansioni),
    profili: unisciProfili(a.profili, b.profili),
    fattori: {
      perTipo: unisciSerie(a.fattori.perTipo, b.fattori.perTipo),
      perRuolo: unisciSerie(a.fattori.perRuolo, b.fattori.perRuolo),
      perModulazione: unisciSerie(a.fattori.perModulazione, b.fattori.perModulazione),
      perProblemaSicurezza: unisciSerie(a.fattori.perProblemaSicurezza, b.fattori.perProblemaSicurezza),
      perStandard: unisciSerie(a.fattori.perStandard, b.fattori.perStandard),
      perValutazione: unisciSerie(a.fattori.perValutazione, b.fattori.perValutazione),
    },
  };
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Sezione con intestazione e contenuto, per uniformità con le altre pagine.
function Sezione({
  titolo,
  occhiello,
  id,
  children,
}: {
  titolo: string;
  occhiello?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="card"
      id={id}
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

const DESCRIZIONI: Record<PerimetroInformo, string> = {
  mortali:
    "Ogni caso mortale documentato nell'archivio Infor.MO di INAIL diventa qui un dato analizzabile: la dinamica dell'evento, il settore e il territorio, il profilo di chi è morto e dell'azienda. Non un elenco di numeri: una lettura dei pattern che si ripetono, per capire dove intervenire.",
  gravi:
    "Ogni caso grave documentato nell'archivio Infor.MO di INAIL diventa qui un dato analizzabile: la dinamica dell'evento, il settore e il territorio, il profilo di chi è rimasto ferito e dell'azienda. Un bacino più ampio dei mortali, che mostra i pattern ricorrenti prima che l'esito diventi fatale.",
  entrambi:
    "Mortali e gravi documentati nell'archivio Infor.MO di INAIL diventano qui dati analizzabili: la dinamica dell'evento, il settore e il territorio, il profilo dei lavoratori coinvolti e dell'azienda. Il confronto tra i due archivi mostra i pattern che si ripetono prima e dopo la soglia dell'esito fatale.",
};

const SOTTO_TITOLI = {
  incidenti: {
    mortali: "Classificazione INAIL della dinamica: casi per anno o somma di periodo",
    gravi: "Classificazione INAIL della dinamica nei casi gravi: casi per anno o somma di periodo",
    entrambi: "Classificazione INAIL della dinamica, mortali e gravi: casi per anno o somma di periodo",
  },
  settori: {
    mortali: "Classificazione INAIL per attività economica: casi per anno o somma di periodo",
    gravi: "Classificazione INAIL per attività economica nei casi gravi: casi per anno o somma di periodo",
    entrambi: "Classificazione INAIL per attività economica, mortali e gravi: casi per anno o somma di periodo",
  },
  territori: {
    mortali: "Localizzazione INAIL: Nord-Ovest, Nord-Est, Centro, Sud e Isole (per anno o somma di periodo)",
    gravi: "Localizzazione INAIL nei casi gravi: Nord-Ovest, Nord-Est, Centro, Sud e Isole (per anno o somma di periodo)",
    entrambi: "Localizzazione INAIL, mortali e gravi: Nord-Ovest, Nord-Est, Centro, Sud e Isole (per anno o somma di periodo)",
  },
  popolazioni: {
    mortali: "Segnalazioni demografiche INAIL (anziani, stranieri, irregolari, giovani...)",
    gravi: "Segnalazioni demografiche INAIL nei casi gravi (anziani, stranieri, irregolari, giovani...)",
    entrambi: "Segnalazioni demografiche INAIL, mortali e gravi (anziani, stranieri, irregolari, giovani...)",
  },
  mansioni: {
    mortali: "Le prime mansioni per numero di casi",
    gravi: "Le prime mansioni per numero di casi nei casi gravi",
    entrambi: "Le prime mansioni per numero di casi, mortali e gravi",
  },
} as const;

export function AnalisiCauseContent() {
  // Due toggle indipendenti: mortali e gravi, selezionabili insieme o da soli.
  const [perimetroQuery, setPerimetroQuery] = useState<PerimetroQuery>({ mortali: true, gravi: false });
  const perimetro = perimetroDaQuery(perimetroQuery);

  // Filtro per attività economica (settore): vuoto = tutte le attività.
  // Quando selezionato, le viste a valle mostrano solo i casi di quella
  // sezione Ateco (leggenda nel header). La lettura caso per caso non è
  // toccata: ha filtri propri.
  const [sezioneAteco, setSezioneAteco] = useState<string>("");
  const [datiAteco, setDatiAteco] = useState<{
    mortali: AtecoDataset | null;
    gravi: AtecoDataset | null;
  }>({ mortali: null, gravi: null });

  // Carica i dataset Ateco al mount (una sola volta, sono file statici).
  useEffect(() => {
    if (datiAteco.mortali || datiAteco.gravi) return;
    const load = async () => {
      const [m, g] = await Promise.all([
        fetch(FILE_ATECO.mortali).then((r) => r.json()),
        fetch(FILE_ATECO.gravi).then((r) => r.json()),
      ]);
      setDatiAteco({ mortali: m as AtecoDataset, gravi: g as AtecoDataset });
    };
    void load();
  }, [datiAteco.mortali, datiAteco.gravi]);

  // Dataset Ateco attivo secondo il perimetro (mortali/gravi/entrambi):
  // quando sono attivi entrambi, le viste si sommano sezione per sezione.
  const datasetAtecoAttivo = useMemo<AtecoDataset | null>(() => {
    const { mortali: m, gravi: g } = datiAteco;
    if (!m && !g) return null;
    if (perimetro === "mortali") return m;
    if (perimetro === "gravi") return g;
    if (!m || !g) return m ?? g;
    // entrambi: fondi le sezioni (stessa struttura, voci sommate).
    const sezioni = m.sezioni.map((sm) => {
      const sg = g.sezioni.find((s) => s.sezione === sm.sezione);
      if (!sg) return sm;
      const perAnno = sm.perAnno.map((pm) => {
        const pg = sg.perAnno.find((p) => p.anno === pm.anno);
        if (!pg) return pm;
        const somma = (vs: { nome: string; count: number; quota: number }[]) => {
          const mappa = new Map<string, number>();
          for (const v of vs) mappa.set(v.nome, (mappa.get(v.nome) ?? 0) + v.count);
          return Array.from(mappa.entries()).map(([nome, count]) => ({ nome, count, quota: 0 }));
        };
        const viste = {
          incidenti: somma([...pm.viste.incidenti, ...pg.viste.incidenti]),
          settori: somma([...pm.viste.settori, ...pg.viste.settori]),
          territori: somma([...pm.viste.territori, ...pg.viste.territori]),
          fattoriTipo: somma([...pm.viste.fattoriTipo, ...pg.viste.fattoriTipo]),
          problemiSicurezza: somma([...pm.viste.problemiSicurezza, ...pg.viste.problemiSicurezza]),
        };
        return { anno: pm.anno, casi: pm.casi + pg.casi, viste };
      });
      const casi = sm.casi + sg.casi;
      return { sezione: sm.sezione, casi, perAnno };
    });
    return { meta: m.meta, sezioni } as AtecoDataset;
  }, [datiAteco, perimetro]);

  // Dataset base (perimetro senza filtro settore): invariato.
  const analisi = useMemo<InformoAnalisi>(() => {
    const mortali = getInformoAnalisi();
    if (perimetro === "gravi") return getInformoGraviAnalisi();
    if (perimetro === "mortali") return mortali;
    return {
      ...mortali,
      ...unisciSerieInformo(mortali, getInformoGraviAnalisi()),
    } as InformoAnalisi;
  }, [perimetro]);

  // Dataset effettivo mostrato: se una sezione Ateco è selezionata e i dati
  // sono carichi, usa il sottoinsieme della sezione (filtro a monte).
  const analisiEffettiva = useMemo<InformoAnalisi>(() => {
    if (!sezioneAteco || !datasetAtecoAttivo) return analisi;
    const dati = datasetAtecoAttivo;
    const serie = serieAteco(dati, sezioneAteco);
    return {
      serie: serie.map((s) => ({ ...s, totaleFiltri: undefined })),
      incidenti: vistaAteco(dati, sezioneAteco, "incidenti"),
      settori: vistaAteco(dati, sezioneAteco, "settori"),
      territori: vistaAteco(dati, sezioneAteco, "territori"),
      popolazioni: [],
      mansioni: [],
      profili: {},
      fattori: {
        perTipo: vistaAteco(dati, sezioneAteco, "fattoriTipo"),
        perRuolo: [],
        perModulazione: [],
        perProblemaSicurezza: vistaAteco(dati, sezioneAteco, "problemiSicurezza"),
        perStandard: [],
        perValutazione: [],
      },
      totFattori: 0,
      casiConFattori: 0,
      casiPeriodo: sum(serie.map((s) => s.casiAnalizzati)),
    } as InformoAnalisi;
  }, [sezioneAteco, datasetAtecoAttivo, analisi]);

  // Casi reali per anno (dalla serie dell'archivio): servono all'etichetta
  // del totale di periodo, distinta dalle voci classificate.
  const casiAnno = analisiEffettiva.serie.map((s) => ({ anno: s.anno, casi: s.casiAnalizzati }));

  const labelPerimetro =
    PERIMETRI_INFORMO.find((p) => p.id === perimetro)?.label ?? "Mortali e gravi";

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
                Analisi delle cause
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Archivio Infor.MO &middot; INAIL &middot; 2010-2024
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Analisi delle cause degli infortuni
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
              {DESCRIZIONI[perimetro]}
            </p>
            <p style={{ color: "var(--color-text-soft)", margin: "var(--space-2) 0 0", fontSize: "0.88rem", lineHeight: 1.6 }}>
              L&apos;archivio Infor.MO non copre tutti gli infortuni mortali e gravi denunciati
              all&apos;INAIL: raccoglie solo i casi indagati e analizzati dai Servizi di
              prevenzione delle ASL. I conteggi di questa pagina vanno quindi letti come
              casi analizzati, non come totali degli infortuni sul lavoro.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            borderTop: "1px solid var(--color-divider)",
            paddingTop: "var(--space-3)",
            marginTop: "var(--space-3)",
          }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-muted)",
              }}
            >
              Attività economica
            </div>
            <FiltroSettoreAteco value={sezioneAteco} onChange={setSezioneAteco} perimetro={perimetroQuery} />
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-muted)",
              }}
            >
              Perimetro dei casi
            </div>
            <InformoPerimetro value={perimetroQuery} onChange={setPerimetroQuery} />
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
                dettaglioFattore.do) per gli eventi con esito mortale o grave nel
                periodo 2010-2024.
              </p>
              <p className="modal-text">
                <strong>Perimetro:</strong> l&apos;archivio analizza una parte dei casi
                denunciati, non è il censimento degli infortuni sul lavoro. I
                totali ufficiali da denunce sono nella pagina Infortuni. Il
                confronto anno su anno non ha senso su questo sottoinsieme: la
                variazione misurerebbe la copertura dell&apos;archivio più che il
                fenomeno reale. Per questo la pagina non presenta delta tra anni.
              </p>
            </section>
            <section className="modal-section">
              <h3 className="modal-section-title">2. Cosa mostra ogni blocco</h3>
              <ul className="modal-list">
                <li><strong>Serie per anno:</strong> i casi analizzati dall&apos;archivio, con la copertura sui casi dell&apos;archivio. In modalità &ldquo;entrambi&rdquo; la pila somma mortali e gravi.</li>
                <li><strong>Cause, settori, territorio:</strong> prime voci per anno con la classificazione INAIL.</li>
                <li><strong>Profilo:</strong> popolazioni a rischio, mansioni, sesso, rapporto di lavoro, sede della lesione.</li>
                <li><strong>Esploratore:</strong> ricerca libera full-text nella narrativa dei casi analizzati con filtri per anno, settore e causa.</li>
              </ul>
            </section>
            <section className="modal-section">
              <h3 className="modal-section-title">3. Limiti dichiarati</h3>
              <ul className="modal-list">
                <li><strong>Campione, non censimento:</strong> i casi analizzati sono una parte degli infortuni denunciati da INAIL nello stesso periodo; la quota esatta è dichiarata dove disponibile. La lettura di cause, settori e profili vale per i casi analizzati, non per tutti gli eventi.</li>
                <li><strong>Occasione di lavoro / in itinere:</strong> la fonte dell&apos;archivio non distingue i due canali senza filtri dedicati, quindi il canale non è separabile in questa pagina e il dato è presentato in forma complessiva.</li>
                <li><strong>Classificazione degli analisti:</strong> è la ricostruzione a posteriori degli analisti INAIL, non un esito giudiziale né una attribuzione di colpa.</li>
                <li><strong>Campi parziali:</strong> età, mansione e azienda sono assenti o parziali per una quota di casi; la copertura per vista è indicata dove serve.</li>
                <li><strong>Serie nazionale gravi:</strong> INAIL non pubblica una serie dei denunciati gravi con lo stesso perimetro dell&apos;archivio, quindi per i gravi non è possibile il confronto con un totale nazionale.</li>
              </ul>
            </section>
            <section className="modal-section">
              <h3 className="modal-section-title">4. Aggiornamento</h3>
              <p className="modal-text">
                I dati sono estratti e aggiornati con gli script ETL
                (scripts/etl/estrai_informo.py e estrai_informo_dettaglio.py); la
                data di generazione del dataset è riportata nel registro fonti.
              </p>
            </section>
          </InfoModalButton>
        </div>
      </header>

      {/* 3. Approfondimenti: cause, settori, territorio */}
      <Sezione occhiello="Le cause" titolo={`Perché si verificano: modalità di accadimento (${labelPerimetro.toLowerCase()})`} id="tipologie-incidente">
        <InformoVociLista
          titolo="Incidente (modalità di accadimento)"
          sottotitolo={SOTTO_TITOLI.incidenti[perimetro]}
          serie={analisiEffettiva.incidenti}
          limite={8}
          colore={INFORM_COLORS.corrente}
          multiAnno
          casiAnno={casiAnno}
        />
      </Sezione>

      <Sezione occhiello="I settori" titolo="Dove avvengono i casi" id="settori-casi">
        <InformoVociLista
          titolo="Settore di attività"
          sottotitolo={SOTTO_TITOLI.settori[perimetro]}
          serie={analisiEffettiva.settori}
          limite={8}
          colore={INFORM_COLORS.secondario}
          multiAnno
          casiAnno={casiAnno}
        />
        <div
          id="dimensione-aziendale"
          style={{
            display: "grid",
            gap: "var(--space-3)",
            borderTop: "1px solid var(--color-divider)",
            paddingTop: "var(--space-4)",
          }}
        >
          <div>
            <div style={{ color: "var(--color-accent)", fontSize: "0.78rem", fontWeight: 650, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
              La dimensione aziendale
            </div>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Analisi per dimensione aziendale</h3>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--color-text-soft)", margin: "var(--space-2) 0 0" }}>
              Microimprese, piccole, medie e grandi aziende hanno profili di rischio diversi.
              Consulta dinamiche e settori per anno, con la variazione rispetto all&apos;anno precedente.
            </p>
          </div>
          <FiltroDimensioneAziendale perimetro={perimetroQuery} />
        </div>
      </Sezione>

      <Sezione occhiello="Il territorio" titolo="Dove avvengono i casi" id="territorio-casi">
        <InformoVociLista
          titolo="Macro-aree"
          sottotitolo={SOTTO_TITOLI.territori[perimetro]}
          serie={analisiEffettiva.territori}
          limite={4}
          colore={INFORM_COLORS.corrente}
          multiAnno
          casiAnno={casiAnno}
        />
      </Sezione>

      <Sezione occhiello="I lavoratori e le aziende" titolo="Profilo dei lavoratori coinvolti" id="profilo-vittime">
        <InformoVociLista
          titolo="Popolazioni a rischio"
          sottotitolo={SOTTO_TITOLI.popolazioni[perimetro]}
          serie={analisiEffettiva.popolazioni}
          limite={8}
          colore={INFORM_COLORS.secondario}
          multiAnno
          casiAnno={casiAnno}
        />
        <InformoVociLista
          titolo="Mansioni coinvolte"
          sottotitolo={SOTTO_TITOLI.mansioni[perimetro]}
          serie={analisiEffettiva.mansioni}
          limite={8}
          colore={INFORM_COLORS.corrente}
          multiAnno
          casiAnno={casiAnno}
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
            <InformoCondensed serie={analisiEffettiva.profili.sesso} labelAnno={casiAnno[casiAnno.length - 1]?.anno ?? 2024} />
          </div>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Rapporto di lavoro</strong>
            <InformoCondensed serie={analisiEffettiva.profili.rapportoLavoro} limite={4} labelAnno={casiAnno[casiAnno.length - 1]?.anno ?? 2024} />
          </div>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Sede della lesione</strong>
            <InformoCondensed serie={analisiEffettiva.profili.sedeLesione} limite={4} labelAnno={casiAnno[casiAnno.length - 1]?.anno ?? 2024} />
          </div>
        </div>
      </Sezione>

      {/* 4. Fattori causali e problemi di sicurezza: classificazione INAIL dei
          motivi, distinta per perimetro (mortali/gravi/entrambi). Le serie
          sommano i fattori dei casi: un caso può avere più fattori. */}
      <Sezione occhiello="I fattori" titolo="I fattori causali" id="fattori-causali">
        <InformoVociLista
          titolo="Tipologie di fattori"
          sottotitolo={"Classificazione INAIL del fattore: attività dell&apos;infortunato, attività di terzi, utensili/macchine/impianti, ambiente, DPI, materiali (per anno o somma di periodo)"}
          serie={analisiEffettiva.fattori.perTipo}
          limite={8}
          colore={INFORM_COLORS.corrente}
          multiAnno
          casiAnno={casiAnno}
          unita="fattori"
        />
      </Sezione>

      <Sezione occhiello="I problemi" titolo={"I problemi di sicurezza più frequenti"} id="problemi-sicurezza">
        <InformoVociLista
          titolo="Problema di sicurezza"
          sottotitolo={"Classificazione INAIL del problema di sicurezza associato ai fattori (es. Azione estemporanea, Formazione/Informazione/Addestramento, Protezioni). Un caso può avere più fattori, ognuno con il proprio problema."}
          serie={analisiEffettiva.fattori.perProblemaSicurezza}
          limite={10}
          colore={INFORM_COLORS.secondario}
          multiAnno
          casiAnno={casiAnno}
          unita="problemi"
        />
      </Sezione>

      {/* 5. Esploratore: la lettura caso per caso ha un filtro locale di
          provenienza (solo mortali / solo gravi / tutti), indipendente dal
          perimetro scelto sopra. */}
      <Sezione occhiello="La lettura caso per caso" titolo="Cerca nella dinamica" id="cerca-dinamica">
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
  labelAnno,
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
