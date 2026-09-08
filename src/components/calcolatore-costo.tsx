"use client";

import { useMemo, useState } from "react";

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

export function CalcolatoreCosto() {
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

  const result = useMemo(() => {
    const assenza = infortunati * giorni * costoGiorno * (quotaAzienda / 100);
    const sostituzione = sostituto === "no" ? 0 : infortunati * giorni * costoSostituto * (sostituto === "esterno" ? 1.2 : 1);
    const fermo = oreFermo * valoreOra;
    const amministrativi = costiExtra + sanzioni;
    const minimo = assenza + sostituzione * 0.8 + fermo * 0.7 + amministrativi * 0.5;
    const probabile = assenza + sostituzione + fermo + amministrativi;
    const grave = assenza * 1.25 + sostituzione * 1.3 + fermo * 1.5 + amministrativi * 1.5;
    return { assenza, sostituzione, fermo, amministrativi, minimo, probabile, grave };
  }, [infortunati, giorni, costoGiorno, quotaAzienda, sostituto, costoSostituto, oreFermo, valoreOra, costiExtra, sanzioni]);

  return <div style={{ display: "grid", gap: "var(--space-5)" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-3)" }}>
      <Input label="Numero di infortunati" value={infortunati} onChange={setInfortunati} suffix="persone" />
      <Input label="Giorni di assenza per persona" value={giorni} onChange={setGiorni} suffix="giorni" />
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

    <div style={{ borderTop: "2px solid var(--color-accent)", paddingTop: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
        {([["minimo", "Scenario minimo", result.minimo], ["probabile", "Scenario probabile", result.probabile], ["grave", "Scenario grave", result.grave]] as const).map(([key, label, value]) => <div key={key} style={{ padding: "var(--space-3)", background: key === "probabile" ? "var(--color-text)" : "var(--color-surface)", color: key === "probabile" ? "var(--color-raised)" : "var(--color-text)", border: "1px solid var(--color-divider)" }}><div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.75 }}>{label}</div><strong style={{ display: "block", fontSize: "1.45rem", marginTop: 5 }}>{euro.format(value)}</strong></div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", marginTop: "var(--space-3)", fontSize: "0.82rem" }}>
        <span>Assenza: <strong>{euro.format(result.assenza)}</strong></span><span>Sostituzione: <strong>{euro.format(result.sostituzione)}</strong></span><span>Fermo: <strong>{euro.format(result.fermo)}</strong></span><span>Gestione e sanzioni: <strong>{euro.format(result.amministrativi)}</strong></span>
      </div>
    </div>
    <p className="source-note">Stima orientativa, non contabile né giuridica. I valori sono inseriti dall&apos;utente; il calcolatore non determina responsabilità, sanzioni o rimborsi INAIL. Lo scenario probabile somma le componenti indicate, mentre minimo e grave applicano coefficienti prudenziali per rappresentare l&apos;incertezza. Verificare sempre CCNL, paghe, contratti e provvedimenti con i professionisti competenti.</p>
  </div>;
}
