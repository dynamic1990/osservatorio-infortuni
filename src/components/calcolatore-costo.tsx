"use client";

import { useMemo, useState } from "react";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { regioneName } from "@/lib/labels";

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

export function CalcolatoreCosto() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const anno = "2024";
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
  const [infortunati, setInfortunati] = useState(1);
  const [giorni, setGiorni] = useState(30);
  const [costoGiorno, setCostoGiorno] = useState(180);
  const [quotaAzienda, setQuotaAzienda] = useState(40);
  const [sostituto, setSostituto] = useState<"no" | "interno" | "esterno">("no");
  const [costoSostituto, setCostoSostituto] = useState(160);
  const [oreFermo, setOreFermo] = useState(0);
  const [valoreOra, setValoreOra] = useState(0);
  const [costiExtra, setCostiExtra] = useState(0);
  const [sanzioni, setSanzioni] = useState(0);
  const [fatturato, setFatturato] = useState(1_000_000);
  const [esposizione, setEsposizione] = useState<Esposizione>("media");
  const [mercato, setMercato] = useState<Mercato>("b2b");
  const [gravitaEvento, setGravitaEvento] = useState<Gravita | "nessuno">("nessuno");
  const [eventoGrave, setEventoGrave] = useState<"nessuno" | "grave" | "mortale">("nessuno");

  const settore = annoData.atecoMacro?.find((s) => s.key === settoreKey) ?? null;
  const regione = annoData.regioni?.find((r) => r.regione === regioneKey) ?? null;

  // Precompilazione dal dataset INAIL: durata media delle assenze per settore e regione.
  const durataSuggerita = settore?.durataMedia ?? regione?.durataMedia ?? annoData.durataMedia ?? 36;
  const casiSettore = settore?.casi ?? regione?.totale ?? annoData.totale ?? 0;
  const incidenzaSettore = settore?.indiceIncidenza ?? 0;
  const effGiorni = settore || regione ? (giorni === 30 ? Math.round(durataSuggerita) : giorni) : giorni;

  const result = useMemo(() => {
    const assenza = infortunati * effGiorni * costoGiorno * (quotaAzienda / 100);
    const sostituzione = sostituto === "no" ? 0 : infortunati * effGiorni * costoSostituto * (sostituto === "esterno" ? 1.2 : 1);
    const fermo = oreFermo * valoreOra;
    const amministrativi = costiExtra + sanzioni;

    // Danno reputazionale: quota del fatturato secondo le bande. Centrali per lo scenario probabile.
    const rep = gravitaEvento === "nessuno" ? null : REPUTAZIONE_BANDE;
    const repMin = rep ? fatturato * rep.esposizione[esposizione].min * rep.mercato[mercato].min * (gravitaEvento !== "nessuno" ? rep.gravita[gravitaEvento].min : 0) : 0;
    const repMax = rep ? fatturato * rep.esposizione[esposizione].max * rep.mercato[mercato].max * (gravitaEvento !== "nessuno" ? rep.gravita[gravitaEvento].max : 0) : 0;
    const repMedio = (repMin + repMax) / 2;

    // Evento grave/mortale: risarcimento + sanzioni + legali come intervallo.
    const ev = eventoGrave === "nessuno" ? null : EVENTI_GRAVI[eventoGrave];
    const evMin = ev ? ev.risarcimento.min + ev.sanzioni.min + ev.legali.min : 0;
    const evMax = ev ? ev.risarcimento.max + ev.sanzioni.max + ev.legali.max : 0;
    const evMedio = (evMin + evMax) / 2;

    const minimo = assenza + sostituzione * 0.8 + fermo * 0.7 + amministrativi * 0.5 + repMin + evMin;
    const probabile = assenza + sostituzione + fermo + amministrativi + repMedio + evMedio;
    const grave = assenza * 1.25 + sostituzione * 1.3 + fermo * 1.5 + amministrativi * 1.5 + repMax + evMax;

    return {
      assenza, sostituzione, fermo, amministrativi,
      repMin, repMax, repMedio,
      evMin, evMax, evMedio,
      minimo, probabile, grave,
    };
  }, [infortunati, effGiorni, costoGiorno, quotaAzienda, sostituto, costoSostituto, oreFermo, valoreOra, costiExtra, sanzioni, fatturato, esposizione, mercato, gravitaEvento, eventoGrave]);

  const mostraReputazione = gravitaEvento !== "nessuno";
  const mostraGravi = eventoGrave !== "nessuno";

  return <div style={{ display: "grid", gap: "var(--space-5)" }}>
    {/* Profilo aziendale: precompilazione dal dataset INAIL */}
    <fieldset style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)", margin: 0 }}>
      <legend style={{ padding: "0 6px", fontWeight: 750, fontSize: "0.9rem" }}>Profilo aziendale (precompila le stime dai dati INAIL {anno})</legend>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
        <Select label="Settore ATECO" value={settoreKey} onChange={setSettoreKey} options={settoriOptions} />
        <Select label="Regione (opzionale)" value={regioneKey} onChange={setRegioneKey} options={regioniOptions} />
      </div>
      {settore && <p className="source-note" style={{ marginTop: "var(--space-2)" }}>Settore <strong>{settore.nome}</strong>: {number.format(casiSettore)} infortuni denunciati nel {anno}, durata media assenza <strong>{number.format(Math.round(settore.durataMedia ?? 0))} giorni</strong>, incidenza {incidenzaSettore ? `${number.format(incidenzaSettore)} per 1.000 occupati` : "non disponibile"}. I giorni di assenza sotto sono stati precompilati con la media del settore: puoi modificarli.</p>}
      {!settore && regione && <p className="source-note" style={{ marginTop: "var(--space-2)" }}>Regione {regioneName(regioneKey)}: durata media assenza {number.format(Math.round(regione.durataMedia ?? 0))} giorni nel {anno}. Usata come riferimento per i giorni precompilati.</p>}
    </fieldset>

    {/* Componenti operative */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-3)" }}>
      <Input label="Numero di infortunati" value={infortunati} onChange={setInfortunati} suffix="persone" />
      <Input label="Giorni di assenza per persona" value={effGiorni} onChange={setGiorni} suffix="giorni" />
      <Input label="Costo aziendale giornaliero" value={costoGiorno} onChange={setCostoGiorno} suffix="€/giorno" />
      <Input label="Quota stimata a carico azienda" value={quotaAzienda} onChange={setQuotaAzienda} suffix="%" min={0} step={5} />
    </div>
    <fieldset style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)", margin: 0 }}>
      <legend style={{ padding: "0 6px", fontWeight: 750, fontSize: "0.9rem" }}>Sostituzione del lavoratore</legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-3)" }}>
        {([['no', 'Nessun sostituto'], ['interno', 'Sostituto interno'], ['esterno', 'Sostituto esterno']] as const).map(([v, label]) => <button key={v} type="button" className={`btn-pill ${sostituto === v ? "active" : ""}`} onClick={() => setSostituto(v)}>{label}</button>)}
      </div>
      {sostituto !== "no" && <Input label="Costo giornaliero del sostituto" value={costoSostituto} onChange={setCostoSostituto} suffix="€/giorno" />}
    </fieldset>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-3)" }}>
      <Input label="Interruzione dell'attività" value={oreFermo} onChange={setOreFermo} suffix="ore" />
      <Input label="Valore operativo medio" value={valoreOra} onChange={setValoreOra} suffix="€/ora" />
      <Input label="Costi extra di gestione" value={costiExtra} onChange={setCostiExtra} suffix="€" />
      <Input label="Sanzioni e provvedimenti inseriti" value={sanzioni} onChange={setSanzioni} suffix="€" />
    </div>

    {/* Danno reputazionale */}
    <fieldset style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)", margin: 0 }}>
      <legend style={{ padding: "0 6px", fontWeight: 750, fontSize: "0.9rem" }}>Danno di immagine (metodo a bande)</legend>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
        <Select label="Gravità dell'evento" value={gravitaEvento} onChange={(v) => setGravitaEvento(v as Gravita | "nessuno")} options={[
          { value: "nessuno", label: "Non stimare il danno di immagine" },
          ...Object.entries(REPUTAZIONE_BANDE.gravita).map(([k, v]) => ({ value: k, label: v.label })),
        ]} />
        <Select label="Esposizione mediatica" value={esposizione} onChange={(v) => setEsposizione(v as Esposizione)} options={Object.entries(REPUTAZIONE_BANDE.esposizione).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Select label="Mercato" value={mercato} onChange={(v) => setMercato(v as Mercato)} options={Object.entries(REPUTAZIONE_BANDE.mercato).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Input label="Fatturato annuo" value={fatturato} onChange={setFatturato} suffix="€" />
      </div>
      {mostraReputazione && <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
        Il danno di immagine è stimato come quota del fatturato: intervallo <strong>{euro.format(result.repMin)} – {euro.format(result.repMax)}</strong>. Metodo semplificato dell&apos;Osservatorio: la correlazione tra infortuni gravi e perdita di commesse o esclusione da gare è documentata (report di settore sulla non sicurezza), ma non esiste una tariffa univoca: usa il range come ordine di grandezza, non come valore finale.
      </p>}
    </fieldset>

    {/* Eventi gravi e mortali */}
    <fieldset style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)", margin: 0 }}>
      <legend style={{ padding: "0 6px", fontWeight: 750, fontSize: "0.9rem" }}>Eventi gravi e mortali (stime prudenziali)</legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-3)" }}>
        {([['nessuno', 'Nessun evento grave'], ['grave', 'Infortunio grave'], ['mortale', 'Infortunio mortale']] as const).map(([v, label]) => <button key={v} type="button" className={`btn-pill ${eventoGrave === v ? "active" : ""}`} onClick={() => setEventoGrave(v)}>{label}</button>)}
      </div>
      {mostraGravi && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "var(--space-3)", fontSize: "0.84rem" }}>
          <span>Risarcimento stimato: <strong>{euro.format(EVENTI_GRAVI[eventoGrave].risarcimento.min)} – {euro.format(EVENTI_GRAVI[eventoGrave].risarcimento.max)}</strong></span>
          <span>Sanzioni (81/08): <strong>{euro.format(EVENTI_GRAVI[eventoGrave].sanzioni.min)} – {euro.format(EVENTI_GRAVI[eventoGrave].sanzioni.max)}</strong></span>
          <span>Difesa legale e CTU: <strong>{euro.format(EVENTI_GRAVI[eventoGrave].legali.min)} – {euro.format(EVENTI_GRAVI[eventoGrave].legali.max)}</strong></span>
        </div>
        <p className="source-note" style={{ marginTop: "var(--space-2)" }}>
          Intervalli indicativi, non importi dovuti. Coprono risarcimento (tabelle per macrolesioni), sanzioni amministrative del D.Lgs. 81/08 e costi di difesa. Un caso di omicidio colposo coinvolge anche la responsabilità amministrativa dell&apos;ente (D.Lgs. 231/2001), con sanzioni in quote che possono superare di molto questi ordini di grandezza: ogni caso va valutato con un legale.
        </p>
      </>}
    </fieldset>

    <div style={{ borderTop: "2px solid var(--color-accent)", paddingTop: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
        {([["minimo", "Scenario minimo", result.minimo], ["probabile", "Scenario probabile", result.probabile], ["grave", "Scenario grave", result.grave]] as const).map(([key, label, value]) => <div key={key} style={{ padding: "var(--space-3)", background: key === "probabile" ? "var(--color-text)" : "var(--color-surface)", color: key === "probabile" ? "var(--color-raised)" : "var(--color-text)", border: "1px solid var(--color-divider)" }}><div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.75 }}>{label}</div><strong style={{ display: "block", fontSize: "1.45rem", marginTop: 5 }}>{euro.format(value)}</strong></div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", marginTop: "var(--space-3)", fontSize: "0.82rem" }}>
        <span>Assenza: <strong>{euro.format(result.assenza)}</strong></span><span>Sostituzione: <strong>{euro.format(result.sostituzione)}</strong></span><span>Fermo: <strong>{euro.format(result.fermo)}</strong></span><span>Gestione e sanzioni: <strong>{euro.format(result.amministrativi)}</strong></span>
        {mostraReputazione && <span>Danno di immagine: <strong>{euro.format(result.repMedio)}</strong></span>}
        {mostraGravi && <span>Evento grave/mortale: <strong>{euro.format(result.evMedio)}</strong></span>}
      </div>
    </div>
    <p className="source-note">Stima orientativa, non contabile né giuridica. I valori operativi sono inseriti dall&apos;utente e precompilati dalle medie INAIL {anno} (dataset multidimensionale integrato nell&apos;Osservatorio): durata media delle assenze, casi e incidenza per settore e regione. Il danno di immagine e gli eventi gravi/mortali usano bande prudenziali dichiarate, da verificare sempre con i professionisti competenti (legale, consulente del lavoro, medico legale). Il calcolatore non determina responsabilità, sanzioni o rimborsi INAIL. Le tabelle sanzionatorie del D.Lgs. 81/08 sono aggiornate periodicamente: gli importi indicati qui sono ordini di grandezza da verificare sulla fonte ufficiale.</p>
  </div>;
}