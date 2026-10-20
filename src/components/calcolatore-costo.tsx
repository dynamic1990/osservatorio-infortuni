"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { regioneName } from "@/lib/labels";
import { SANZIONI_81_08, OSCILLAZIONE_PREMIO, tassoPerMillePerAteco, costoAssenzaInail } from "@/lib/costo-infortunio";

// Conversione RAL mensile -> retribuzione media giornaliera. Convenzione standard:
// 21 giornate lavorative equivalenti al mese (retribuzione mensilizzata / 26
// sarebbe il lordo giornaliero contrattuale; per il costo aziendale si usa la
// media di 21 giorni lavorativi/mese). Valore orientativo, modificabile dall'utente.
const GIORNI_LAVORATIVI_MESE = 21;

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

function Input({ label, value, onChange, suffix, min = 0, step = 1 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; step?: number }) {
  return <label style={{ display: "grid", gap: 5, fontSize: "0.82rem" }}>
    <span style={{ fontWeight: 650 }}>{label}</span>
    <span style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-divider)", background: "var(--color-raised)" }}>
      <input type="number" min={min} step={step} value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} style={{ width: "100%", minWidth: 0, border: 0, padding: "10px 11px", background: "transparent", color: "var(--color-text)", font: "inherit" }} />
      {suffix && <span style={{ paddingRight: 10, color: "var(--color-text-soft)", whiteSpace: "nowrap" }}>{suffix}</span>}
    </span>
  </label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <label style={{ display: "grid", gap: 5, fontSize: "0.82rem" }}>
    <span style={{ fontWeight: 650 }}>{label}</span>
    <span style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-divider)", background: "var(--color-raised)" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", minWidth: 0, border: 0, padding: "10px 11px", background: "transparent", color: "var(--color-text)", font: "inherit", appearance: "auto" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  </label>;
}

// Bande per la stima del danno reputazionale. Metodo semplificato dell'Osservatorio:
// il danno d'immagine è espresso come quota del fatturato annuo, secondo esposizione
// mediatica, mercato (B2B/B2C) e gravità dell'evento. Ordini di grandezza prudenziali,
// non valori ufficiali: la correlazione tra incidenti gravi e perdita di commesse o
// esclusione da gare è documentata ma non esiste una tariffa univoca.
const REPUTAZIONE_BANDE = {
  esposizione: {
    bassa: { label: "Bassa (nessuna cronaca)", min: 0.0005, max: 0.002 },
    media: { label: "Media (cronaca locale/settoriale)", min: 0.002, max: 0.008 },
    alta: { label: "Alta (cronaca nazionale, brand noto)", min: 0.008, max: 0.03 },
  },
  mercato: { b2b: { label: "B2B (imprese, gare, appalti)", min: 1, max: 1.15 }, b2c: { label: "B2C (consumatori, brand pubblico)", min: 1.1, max: 1.4 } },
  gravita: {
    lieve: { label: "Lieve (nessuna inabilità o breve)", min: 0.4, max: 0.6 },
    grave: { label: "Grave (inabilità, ricovero)", min: 1, max: 1.3 },
    mortale: { label: "Mortale", min: 1.8, max: 2.6 },
  },
} as const;

type Esposizione = keyof typeof REPUTAZIONE_BANDE.esposizione;
type Mercato = keyof typeof REPUTAZIONE_BANDE.mercato;
type Gravita = keyof typeof REPUTAZIONE_BANDE.gravita;

// Riferimento nazionale INAIL: "Il costo dei danni da lavoro per l'azienda Italia"
// (Consulenza statistico attuariale, 2026, dati 2023). Costo medio per infortunio
// con prestazione INAIL: circa 33.000 euro; malattia professionale: circa 61.000.
// Costo complessivo nazionale 2023: 49,2 miliardi, 2,31% del PIL. Sono medie
// macroeconomiche (rapporto costo totale / eventi indennizzati), usate qui solo
// come benchmark di confronto, non come tariffa del singolo evento aziendale.
const MEDIA_INAIL_INFORTUNIO = 33_000; // costo medio per infortunio, benchmark INAIL 2023
// Parametri ufficiali INAIL 2023 (pubblicazione "Il costo dei danni da lavoro per l'azienda Italia",
// Consulenza statistico attuariale, 2026): usati come riferimento, non come tariffa del singolo evento.

// Funzione per il costo dell'assenza con le regole INAIL: il datore paga l'intera
// retribuzione il giorno dell'infortunio, il 60% nei 3 giorni di carenza, poi copre
// solo il differenziale di integrazione al 100% (40% fino al 90° giorno, 25% dopo)
// se il CCNL prevede l'integrazione. Se il CCNL non integra, il datore non paga
// nulla dopo il 3° giorno (l'indennità INAIL sostituisce la retribuzione).
// (Definizione locale rimossa: ora in @/lib/costo-infortunio, esportata per i test.)

// Ordini di grandezza per eventi gravi/mortali. Sono stime indicativi costruite su
// fonti pubbliche (tabelle di risarcimento per macrolesioni, pratiche correnti sui
// costi di difesa) e NON rappresentano importi dovuti. Ogni caso concreto va valutato
// con legale e consulente tecnico.
const EVENTI_GRAVI = {
  grave: {
    label: "Infortunio grave (inabilità permanente)",
    risarcimento: { min: 30_000, max: 250_000 },
    sanzioni: { min: 2_000, max: 25_000 },
    legali: { min: 5_000, max: 40_000 },
  },
  mortale: {
    label: "Infortunio mortale",
    risarcimento: { min: 250_000, max: 1_200_000 },
    sanzioni: { min: 5_000, max: 60_000 },
    legali: { min: 10_000, max: 120_000 },
  },
} as const;

// Intestazione di sezione uniforme (stile card del design system).
function Step({ num, title, desc, children }: { num: string; title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="calc-step">
      <div className="calc-step-header">
        <span className="calc-step-num">{num}</span>
        <h3 className="calc-step-title">{title}</h3>
      </div>
      {desc && <p className="calc-step-desc" style={{ marginBottom: "var(--space-3)" }}>{desc}</p>}
      {children}
    </section>
  );
}

export function CalcolatoreCosto() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const anno = "2025";
  const annoData = multidim.perAnno[anno] ?? multidim.consolidatoTotale;

  const settoriOptions = useMemo(() => {
    const list = (annoData.atecoMacro ?? []).map((s) => ({ value: s.key, label: `${s.key} — ${s.nome}` }));
    return [{ value: "", label: "Non specificato (media nazionale)" }, ...list];
  }, [annoData]);

  const regioniOptions = useMemo(() => {
    const list = (annoData.regioni ?? []).map((r) => ({ value: r.regione, label: regioneName(r.regione) }));
    return [{ value: "", label: "Non specificata (media nazionale)" }, ...list];
  }, [annoData]);

  const [settoreKey, setSettoreKey] = useState("");
  const [regioneKey, setRegioneKey] = useState("");
  const settore = annoData.atecoMacro?.find((s) => s.key === settoreKey) ?? null;
  const regione = annoData.regioni?.find((r) => r.regione === regioneKey) ?? null;

  // Lavoratori infortunati: ogni lavoratore ha i propri giorni di assenza e RAL.
  // La precompilazione dei giorni usa la durata media INAIL del settore/regione.
  type Lavoratore = { id: number; giorni: number; ralMensile: number };
  const durataSuggerita = settore?.durataMedia ?? regione?.durataMedia ?? annoData.durataMedia ?? 36;
  const durataDefault = settore || regione ? Math.round(durataSuggerita) : 30;
  const [lavoratori, setLavoratori] = useState<Lavoratore[]>([{ id: 1, giorni: durataDefault, ralMensile: 2200 }]);
  const [nextId, setNextId] = useState(2);
  // Aggiorna i giorni dei lavoratori rimasti sul default (30) quando cambia
  // settore/regione: chi ha inserito un valore specifico lo conserva.
  const applicaDurataDefault = () =>
    setLavoratori((prev) => prev.map((l) => (l.giorni === 30 ? { ...l, giorni: durataDefault } : l)));
  const cambiaSettore = (v: string) => { setSettoreKey(v); applicaDurataDefault(); };
  const cambiaRegione = (v: string) => { setRegioneKey(v); applicaDurataDefault(); };
  const aggiornaLavoratore = (id: number, patch: Partial<Lavoratore>) =>
    setLavoratori((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const aggiungiLavoratore = () => {
    setLavoratori((prev) => [...prev, { id: nextId, giorni: durataDefault, ralMensile: 2200 }]);
    setNextId((n) => n + 1);
  };
  const rimuoviLavoratore = (id: number) => setLavoratori((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  const [integraCcnl, setIntegraCcnl] = useState(true); // integrazione al 100% da CCNL (caso standard)
  const [sostituto, setSostituto] = useState<"no" | "interno" | "esterno">("no");
  const [costoSostituto, setCostoSostituto] = useState(160);
  const [oreFermo, setOreFermo] = useState(0);
  const [valoreOra, setValoreOra] = useState(0);
  const [costiExtra, setCostiExtra] = useState(0);
  const [sanzioni, setSanzioni] = useState(0);
  // Sanzioni D.Lgs. 81/08 con livello selezionabile: min | media | max | null.
  type LivelloSanzione = "min" | "media" | "max" | null;
  const [sanzioniPreset, setSanzioniPreset] = useState<Record<string, LivelloSanzione>>({
    dvr: null, nominaRspp: null, formazione: null, sorveglianzaSanitaria: null, dpi: null, denunciaInfortunio: null, segnaletica: null,
  });
  const impostaSanzione = (k: string, livello: LivelloSanzione) =>
    setSanzioniPreset((prev) => ({ ...prev, [k]: prev[k] === livello ? null : livello }));
  const [fatturato, setFatturato] = useState(1_000_000);
  const [numDipendenti, setNumDipendenti] = useState(10); // per la stima del premio INAIL
  const [esposizione, setEsposizione] = useState<Esposizione>("media");
  const [mercato, setMercato] = useState<Mercato>("b2b");
  const [gravitaEvento, setGravitaEvento] = useState<Gravita | "nessuno">("nessuno");
  // Gravità collegata: se l'utente seleziona un evento grave/mortale, il danno di
  // immagine usa la stessa gravità; restano comunque due componenti indipendenti
  // (si può avere danno d'immagine senza evento grave e viceversa).
  const [eventoGrave, setEventoGrave] = useState<"nessuno" | "grave" | "mortale">("nessuno");

  // Componenti di costo attivabili: la stima si adatta al caso concreto (metodologia INAIL:
  // ogni componente del costo conseguente non assicurativo può esserci o meno).
  type Componente = "assenza" | "sostituzione" | "fermo" | "gestione" | "reputazione" | "gravi";
  const [attive, setAttive] = useState<Record<Componente, boolean>>({
    assenza: true, sostituzione: true, fermo: true, gestione: true, reputazione: true, gravi: true,
  });
  const toggleComponente = (c: Componente) => setAttive((prev) => ({ ...prev, [c]: !prev[c] }));

  // Precompilazione dal dataset INAIL: durata media delle assenze per settore e regione.
  const casiSettore = settore?.casi ?? regione?.totale ?? annoData.totale ?? 0;
  const incidenzaSettore = settore?.indiceIncidenza ?? 0;

  // Retribuzione media giornaliera stimata dalla RAL mensile media (21 giorni lavorativi/mese).
  const ralMedia = lavoratori.reduce((a, l) => a + l.ralMensile, 0) / Math.max(1, lavoratori.length);

  // Sanzioni precompilate: somma degli importi per livello selezionato (min|media|max).
  const sanzioniPresetTotale = useMemo(() => {
    return Object.entries(sanzioniPreset).reduce((acc, [k, livello]) => {
      if (!livello) return acc;
      const s = SANZIONI_81_08[k as keyof typeof SANZIONI_81_08];
      const valore = livello === "min" ? s.min : livello === "max" ? s.max : (s.min + s.max) / 2;
      return acc + valore;
    }, 0);
  }, [sanzioniPreset]);

  // Se l'utente ha selezionato un evento grave/mortale e non ha indicato una gravità
  // reputazionale, allinea automaticamente la gravità del danno di immagine.
  const gravitaEffettiva = gravitaEvento === "nessuno" && eventoGrave !== "nessuno" ? (eventoGrave === "mortale" ? "mortale" : "grave") : gravitaEvento;

  // Stima dell'effetto sul premio INAIL: il tasso medio di tariffa (per mille delle
  // retribuzioni imponibili) sale fino a +30% al rinnovo triennale dopo un evento
  // grave/mortale (oscillazione per andamento infortunistico, art. 20 DM 12/12/2000).
  // Base premio annuale = retribuzioni imponibili × tasso per mille. Usiamo come
  // proxy della massa salariale: numDipendenti × RAL mensile × 13 (mensilità).
  const tassoPerMille = tassoPerMillePerAteco(settoreKey);
  const massaSalariale = numDipendenti * ralMedia * 13;
  const premioBaseAnnuale = massaSalariale * (tassoPerMille / 1000);
  const premioAumentoMin = premioBaseAnnuale * OSCILLAZIONE_PREMIO.aumentoMin;
  const premioAumentoMax = premioBaseAnnuale * OSCILLAZIONE_PREMIO.aumentoMax;
  const premioAumentoTriennioMin = premioAumentoMin * OSCILLAZIONE_PREMIO.anni;
  const premioAumentoTriennioMax = premioAumentoMax * OSCILLAZIONE_PREMIO.anni;

  const result = useMemo(() => {
    // Per ogni lavoratore calcola il costo assenza con le regole INAIL, poi somma.
    const perLavoratore = lavoratori.map((l) => {
      const retrG = l.ralMensile / GIORNI_LAVORATIVI_MESE;
      return { ...costoAssenzaInail(retrG, l.giorni, integraCcnl), giorni: l.giorni, ralMensile: l.ralMensile };
    });
    const nLavoratori = lavoratori.length;
    const giorniTotali = lavoratori.reduce((a, l) => a + l.giorni, 0);
    const assenza = (attive.assenza ? 1 : 0) * perLavoratore.reduce((a, p) => a + p.costoDatoreIntegra, 0);
    const assenzaSenzaIntegrazione = (attive.assenza ? 1 : 0) * perLavoratore.reduce((a, p) => a + p.costoDatore, 0);
    const indennitaInailTotale = perLavoratore.reduce((a, p) => a + p.indennitaInail, 0);
    const sostituzione = (attive.sostituzione ? 1 : 0) * (sostituto === "no" ? 0 : nLavoratori * (giorniTotali / Math.max(1, nLavoratori)) * costoSostituto * (sostituto === "esterno" ? 1.2 : 1));
    const fermo = (attive.fermo ? 1 : 0) * oreFermo * valoreOra;
    const amministrativi = (attive.gestione ? 1 : 0) * (costiExtra + sanzioni + sanzioniPresetTotale);

    // Danno reputazionale: quota del fatturato secondo le bande. Centrali per lo scenario probabile.
    const rep = gravitaEffettiva === "nessuno" || !attive.reputazione ? null : REPUTAZIONE_BANDE;
    const repMin = rep ? fatturato * rep.esposizione[esposizione].min * rep.mercato[mercato].min * (gravitaEffettiva !== "nessuno" ? rep.gravita[gravitaEffettiva].min : 0) : 0;
    const repMax = rep ? fatturato * rep.esposizione[esposizione].max * rep.mercato[mercato].max * (gravitaEffettiva !== "nessuno" ? rep.gravita[gravitaEffettiva].max : 0) : 0;
    const repMedio = (repMin + repMax) / 2;

    // Evento grave/mortale: risarcimento + sanzioni + legali come intervallo.
    const ev = eventoGrave === "nessuno" || !attive.gravi ? null : EVENTI_GRAVI[eventoGrave];
    const evMin = ev ? ev.risarcimento.min + ev.sanzioni.min + ev.legali.min : 0;
    const evMax = ev ? ev.risarcimento.max + ev.sanzioni.max + ev.legali.max : 0;
    const evMedio = (evMin + evMax) / 2;

    const minimo = assenza + sostituzione * 0.8 + fermo * 0.7 + amministrativi * 0.5 + repMin + evMin;
    const probabile = assenza + sostituzione + fermo + amministrativi + repMedio + evMedio;
    const grave = assenza * 1.25 + sostituzione * 1.3 + fermo * 1.5 + amministrativi * 1.5 + repMax + evMax;

    return {
      assenza, assenzaSenzaIntegrazione, sostituzione, fermo, amministrativi,
      repMin, repMax, repMedio,
      evMin, evMax, evMedio,
      minimo, probabile, grave,
      inail: perLavoratore, nLavoratori, giorniTotali, indennitaInailTotale,
    };
  }, [lavoratori, integraCcnl, sostituto, costoSostituto, oreFermo, valoreOra, costiExtra, sanzioni, sanzioniPresetTotale, fatturato, esposizione, mercato, gravitaEffettiva, eventoGrave, attive]);

  const mostraReputazione = gravitaEffettiva !== "nessuno" && attive.reputazione;
  const mostraGravi = eventoGrave !== "nessuno" && attive.gravi;

  return <div style={{ display: "grid", gap: "var(--space-4)" }}>
    {/* Profilo aziendale: precompilazione dal dataset INAIL */}
    <Step num="01" title="Profilo aziendale" desc={`Precompila le stime dai dati INAIL ${anno}: seleziona settore e regione per la durata media delle assenze.`}>
      <div className="calc-grid">
        <Select label="Settore ATECO" value={settoreKey} onChange={cambiaSettore} options={settoriOptions} />
        <Select label="Regione (opzionale)" value={regioneKey} onChange={cambiaRegione} options={regioniOptions} />
      </div>
      {settore && <p className="source-note" style={{ marginTop: "var(--space-2)" }}>Settore <strong>{settore.nome}</strong>: {number.format(casiSettore)} infortuni denunciati nel {anno}, durata media assenza <strong>{number.format(Math.round(settore.durataMedia ?? 0))} giorni</strong>, incidenza {incidenzaSettore ? `${number.format(incidenzaSettore)} per 1.000 occupati` : "non disponibile"}. I giorni di assenza sotto sono stati precompilati con la media del settore: puoi modificarli.</p>}
      {!settore && regione && <p className="source-note" style={{ marginTop: "var(--space-2)" }}>Regione {regioneName(regioneKey)}: durata media assenza {number.format(Math.round(regione.durataMedia ?? 0))} giorni nel {anno}. Usata come riferimento per i giorni precompilati.</p>}
    </Step>

    {/* Componenti attivabili */}
    <Step num="02" title="Componenti di costo" desc="Attiva solo quelle del tuo caso: la stima si adatta. Ogni componente può essere disattivata.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {([
          ["assenza", "Assenza"],
          ["sostituzione", "Sostituzione"],
          ["fermo", "Fermo operativo"],
          ["gestione", "Gestione e sanzioni"],
          ["reputazione", "Danno di immagine"],
          ["gravi", "Eventi gravi/mortali"],
        ] as const).map(([k, label]) => (
          <button key={k} type="button" className={`btn-pill ${attive[k] ? "active" : ""}`} onClick={() => toggleComponente(k)} aria-pressed={attive[k]}>{label}</button>
        ))}
      </div>
    </Step>

    {/* Lavoratori infortunati: scheda per ciascuno, con + per aggiungerne */}
    <Step num="03" title={`Lavoratori infortunati (${lavoratori.length})`} desc="Ogni lavoratore ha giorni di assenza e RAL propri: l'assenza è calcolata con le regole INAIL per ciascuno e poi sommata.">
      <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
        {lavoratori.map((l, idx) => (
          <div key={l.id} className="calc-lavoratore">
            <div className="calc-lavoratore-head">
              <span className="calc-lavoratore-name">Lavoratore {idx + 1}</span>
              {lavoratori.length > 1 && <button type="button" className="calc-remove" onClick={() => rimuoviLavoratore(l.id)}>Rimuovi</button>}
            </div>
            <div className="calc-grid">
              <Input label="Giorni di assenza" value={l.giorni} onChange={(v) => aggiornaLavoratore(l.id, { giorni: v })} suffix="giorni" />
              <Input label="RAL mensile lorda" value={l.ralMensile} onChange={(v) => aggiornaLavoratore(l.id, { ralMensile: v })} suffix="€/mese" />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="calc-add" onClick={aggiungiLavoratore}>+ Aggiungi un altro lavoratore</button>
    </Step>

    <Step num="04" title="Retribuzione e regole INAIL" desc="Regole INAIL per l'inabilità temporanea assoluta: giorno evento intero a carico azienda, 3 giorni di carenza al 60%, poi indennità INAIL 60% (dal 4° al 90°) e 75% (dal 91°).">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-3)" }}>
        {([['true', 'CCNL integra al 100% (caso tipico)'], ['false', 'Nessuna integrazione']] as const).map(([v, label]) => <button key={v} type="button" className={`btn-pill ${integraCcnl === (v === 'true') ? "active" : ""}`} onClick={() => setIntegraCcnl(v === 'true')}>{label}</button>)}
      </div>
      <p className="source-note" style={{ margin: 0 }}>
        Con integrazione CCNL al 100% l&apos;azienda copre il differenziale (40% fino al 90° giorno, 25% dopo). Per {result.giorniTotali} giorni complessivi: indennità INAIL ≈ <strong>{euro.format(Math.round(result.indennitaInailTotale))}</strong>, costo azienda ≈ <strong>{euro.format(Math.round(result.assenza))}</strong>.
      </p>
    </Step>

    <Step num="05" title="Sostituzione e fermo operativo" desc="Costi organizzativi: sostituto del lavoratore e interruzione dell'attività.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-3)" }}>
        {([['no', 'Nessun sostituto'], ['interno', 'Sostituto interno'], ['esterno', 'Sostituto esterno']] as const).map(([v, label]) => <button key={v} type="button" className={`btn-pill ${sostituto === v ? "active" : ""}`} onClick={() => setSostituto(v)}>{label}</button>)}
      </div>
      {sostituto !== "no" && <div className="calc-grid" style={{ marginBottom: "var(--space-3)" }}><Input label="Costo giornaliero del sostituto" value={costoSostituto} onChange={setCostoSostituto} suffix="€/giorno" /></div>}
      <div className="calc-grid">
        <Input label="Interruzione dell'attività" value={oreFermo} onChange={setOreFermo} suffix="ore" />
        <Input label="Valore operativo medio" value={valoreOra} onChange={setValoreOra} suffix="€/ora" />
        <Input label="Costi extra di gestione" value={costiExtra} onChange={setCostiExtra} suffix="€" />
        <Input label="Sanzioni e provvedimenti inseriti" value={sanzioni} onChange={setSanzioni} suffix="€" />
      </div>
    </Step>

    {/* Sanzioni precompilate D.Lgs. 81/08 con livello min/media/max */}
    <Step num="06" title="Sanzioni D.Lgs. 81/08" desc="Violazioni più frequenti imputate alle aziende in caso di infortunio: seleziona il livello minimo, medio o massimo per ciascuna.">
      <div style={{ display: "grid", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        {Object.entries(SANZIONI_81_08).map(([k, v]) => {
          const livello = sanzioniPreset[k];
          return (
            <div key={k} className="calc-sanzione">
              <span className="calc-sanzione-label">{v.label}</span>
              <div className="calc-sanzione-livelli">
                {([['min', `Min ${euro.format(v.min)}`], ['media', `Media ${euro.format(Math.round((v.min + v.max) / 2))}`], ['max', `Max ${euro.format(v.max)}`]] as const).map(([lv, lvLabel]) => (
                  <button key={lv} type="button" className={`btn-pill ${livello === lv ? "active" : ""}`} aria-pressed={livello === lv} onClick={() => impostaSanzione(k, lv)} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>{lvLabel}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="source-note" style={{ margin: 0 }}>
        Importi da D.Lgs. 81/08 (art. 55 ss., rivalutati L. 145/2018). Totale aggiunto alla voce &ldquo;Gestione e sanzioni&rdquo;: <strong>{euro.format(sanzioniPresetTotale)}</strong>. Ogni caso va verificato con la norma vigente.
      </p>
    </Step>

    {/* Danno reputazionale */}
    <Step num="07" title="Danno di immagine" desc="Metodo a bande: quota del fatturato secondo gravità, esposizione mediatica e mercato. Ordini di grandezza prudenziali.">
      <div className="calc-grid">
        <Select label="Gravità dell'evento" value={gravitaEvento} onChange={(v) => setGravitaEvento(v as Gravita | "nessuno")} options={[
          { value: "nessuno", label: "Non stimare il danno di immagine" },
          ...Object.entries(REPUTAZIONE_BANDE.gravita).map(([k, v]) => ({ value: k, label: v.label })),
        ]} />
        <Select label="Esposizione mediatica" value={esposizione} onChange={(v) => setEsposizione(v as Esposizione)} options={Object.entries(REPUTAZIONE_BANDE.esposizione).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Select label="Mercato" value={mercato} onChange={(v) => setMercato(v as Mercato)} options={Object.entries(REPUTAZIONE_BANDE.mercato).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Input label="Fatturato annuo" value={fatturato} onChange={setFatturato} suffix="€" />
      </div>
      {eventoGrave !== "nessuno" && gravitaEvento === "nessuno" && <p className="source-note" style={{ marginTop: "var(--space-2)", marginBottom: 0 }}>Hai selezionato un evento grave/mortale: il danno di immagine usa automaticamente la stessa gravità. Puoi modificarla qui sotto.</p>}
      {mostraReputazione && <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
        Il danno di immagine è stimato come quota del fatturato: intervallo <strong>{euro.format(result.repMin)} – {euro.format(result.repMax)}</strong>. Metodo semplificato dell&apos;Osservatorio: la correlazione tra infortuni gravi e perdita di commesse o esclusione da gare è documentata (report di settore sulla non sicurezza), ma non esiste una tariffa univoca: usa il range come ordine di grandezza, non come valore finale.
      </p>}
    </Step>

    {/* Eventi gravi e mortali */}
    <Step num="08" title="Eventi gravi e mortali" desc="Stime prudenziali per risarcimento, sanzioni e difesa legale. Intervalli indicativi, non importi dovuti.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-3)" }}>
        {([['nessuno', 'Nessun evento grave'], ['grave', 'Infortunio grave'], ['mortale', 'Infortunio mortale']] as const).map(([v, label]) => <button key={v} type="button" className={`btn-pill ${eventoGrave === v ? "active" : ""}`} onClick={() => setEventoGrave(v)}>{label}</button>)}
      </div>
      {mostraGravi && <>
        <div className="calc-grid" style={{ fontSize: "0.84rem" }}>
          <span>Risarcimento stimato: <strong>{euro.format(EVENTI_GRAVI[eventoGrave].risarcimento.min)} – {euro.format(EVENTI_GRAVI[eventoGrave].risarcimento.max)}</strong></span>
          <span>Sanzioni (81/08): <strong>{euro.format(EVENTI_GRAVI[eventoGrave].sanzioni.min)} – {euro.format(EVENTI_GRAVI[eventoGrave].sanzioni.max)}</strong></span>
          <span>Difesa legale e CTU: <strong>{euro.format(EVENTI_GRAVI[eventoGrave].legali.min)} – {euro.format(EVENTI_GRAVI[eventoGrave].legali.max)}</strong></span>
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
          Intervalli indicativi, non importi dovuti. Coprono risarcimento (tabelle per macrolesioni), sanzioni amministrative del D.Lgs. 81/08 e costi di difesa. Un caso di omicidio colposo coinvolge anche la responsabilità amministrativa dell&apos;ente (D.Lgs. 231/2001), con sanzioni in quote che possono superare di molto questi ordini di grandezza: ogni caso va valutato con un legale.
        </p>
      </>}
    </Step>

    {/* Effetto sul premio INAIL: visibile quando c'è un evento grave/mortale */}
    {mostraGravi && (
      <Step num="09" title="Effetto sul premio INAIL" desc="Costo ricorrente: dopo un evento grave/mortale l'oscillazione per andamento infortunistico (art. 20 DM 12/12/2000) può far salire il tasso fino a +30% al rinnovo triennale.">
        <div className="calc-grid" style={{ marginBottom: "var(--space-2)" }}>
          <Input label="Numero di dipendenti" value={numDipendenti} onChange={setNumDipendenti} suffix="addetti" />
          <div style={{ display: "grid", alignContent: "start", gap: 5, fontSize: "0.82rem" }}>
            <span style={{ fontWeight: 650 }}>Tasso medio stimato</span>
            <span className="calc-badge-tasso"><strong>{tassoPerMille}‰</strong> delle retribuzioni imponibili</span>
          </div>
        </div>
        <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.88rem" }}>
          Sul tuo premio annuo attuale (≈ {euro.format(premioBaseAnnuale)} con {tassoPerMille}‰ su {euro.format(massaSalariale)} di retribuzioni imponibili) significa <strong>{euro.format(premioAumentoMin)} – {euro.format(premioAumentoMax)} in più all&apos;anno</strong>, per tre anni: <strong>{euro.format(premioAumentoTriennioMin)} – {euro.format(premioAumentoTriennioMax)} totali</strong>.
        </p>
        <p className="source-note" style={{ margin: 0 }}>Stima indicativa: il tasso medio esatto dipende dalla voce tariffaria PAT della singola azienda (consultazione tassi INAIL). L&apos;oscillazione effettiva dipende dall&apos;indice di sinistrosità (ISAR): qui usiamo +10/+30% come ordine di grandezza prudenziale per evento grave/mortale. La massa salariale è stimata come dipendenti × RAL mensile × 13.</p>
      </Step>
    )}

    {/* Contesto dimensionale: quanto pesa l'evento per una micro/piccola impresa */}
    {fatturato > 0 && (
      <Step num="10" title="Contesto dimensionale" desc="Quanto pesa l'evento per una micro o piccola impresa (ISTAT/Sistan 2024).">
        <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.88rem" }}>
          In Italia il 76,5% delle imprese ha fino a 5 occupati e il 92,3% fino a 15 (ISTAT/Sistan): sono le micro e piccole imprese dove ogni assenza pesa doppio. Nel tuo caso, lo scenario probabile vale <strong>{((result.probabile / fatturato) * 100).toFixed(1)}% del fatturato annuo</strong> ({euro.format(result.probabile)} su {euro.format(fatturato)}): per una micro-impresa significa mesi di margine assorbiti da un singolo evento.
        </p>
        <p className="source-note" style={{ margin: 0 }}>Confronto dimensionale indicativo: il fatturato è un input tuo; la distribuzione per classe di addetti è ISTAT/Sistan (struttura produttiva). Non è un dato INAIL.</p>
      </Step>
    )}

    <div style={{ borderTop: "2px solid var(--color-accent)", paddingTop: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
        {([["minimo", "Scenario minimo", result.minimo], ["probabile", "Scenario probabile", result.probabile], ["grave", "Scenario grave", result.grave]] as const).map(([key, label, value]) => <div key={key} className={`calc-result-card ${key === "probabile" ? "probabile" : ""}`}><div className="calc-result-label">{label}</div><strong className="calc-result-value">{euro.format(value)}</strong></div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
        {([
          ["Costo totale stimato", euro.format(result.probabile)],
          ["Costo medio per infortunio", euro.format(result.nLavoratori > 0 ? result.probabile / result.nLavoratori : 0)],
          ["Costo per giorno di assenza", euro.format(result.giorniTotali > 0 ? result.assenza / result.giorniTotali : 0)],
          ["Incidenza sul fatturato", `${fatturato > 0 ? `${((result.probabile / fatturato) * 100).toFixed(2)}%` : "n.d."}`],
          ["Vs media nazionale INAIL", `${result.nLavoratori > 0 ? `${result.probabile / result.nLavoratori >= MEDIA_INAIL_INFORTUNIO ? "+" : ""}${Math.round((result.probabile / result.nLavoratori) / MEDIA_INAIL_INFORTUNIO * 100 - 100)}%` : "n.d."}`],
          ["Indennità INAIL (assenza)", euro.format(Math.round(result.indennitaInailTotale))],
          ["Costo assenza a carico azienda", euro.format(Math.round(result.assenza))],
        ] as const).map(([label, value]) => <div key={label} className="calc-kpi"><div className="calc-kpi-label">{label}</div><strong className="calc-kpi-value">{value}</strong></div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", marginTop: "var(--space-3)", fontSize: "0.82rem" }}>
        <span>Assenza: <strong>{euro.format(result.assenza)}</strong></span><span>Sostituzione: <strong>{euro.format(result.sostituzione)}</strong></span><span>Fermo: <strong>{euro.format(result.fermo)}</strong></span><span>Gestione e sanzioni: <strong>{euro.format(result.amministrativi)}</strong></span>
        {mostraReputazione && <span>Danno di immagine: <strong>{euro.format(result.repMedio)}</strong></span>}
        {mostraGravi && <span>Evento grave/mortale: <strong>{euro.format(result.evMedio)}</strong></span>}
      </div>
    </div>
    <p className="source-note">Stima orientativa, non contabile né giuridica. Fonte metodologica: INAIL, <em>Il costo dei danni da lavoro per l&apos;azienda Italia</em> (2026, dati 2023); precompilazione: dataset INAIL {anno}. Le bande per immagine, eventi gravi e sanzioni sono prudenziali e non rappresentano importi dovuti. Verificare ogni caso con i professionisti competenti.</p>
  </div>;
}