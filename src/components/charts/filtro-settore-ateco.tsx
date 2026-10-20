"use client";

// Selettore "Attività economica (settore)" per la pagina Analisi delle cause.
// Posizionato a monte dei toggle mortali/gravi: la sezione scelta filtra a
// monte tutte le viste a valle (serie, incidenti, settori, profilo, fattori).
// La lettura caso per caso (esploratore) mantiene i propri filtri locali.

import { useEffect, useMemo, useState } from "react";

export interface AtecoSezione {
  sezione: string;
  casi: number;
  perAnno: {
    anno: number;
    casi: number;
    viste: Record<
      "incidenti" | "settori" | "territori" | "fattoriTipo" | "problemiSicurezza",
      { nome: string; count: number; quota: number }[]
    >;
  }[];
}

export interface AtecoDataset {
  meta?: {
    periodo?: string;
    criteri?: { casiConSezione?: number; sezioni?: string[] };
    nota?: string;
  };
  sezioni: AtecoSezione[];
}

const FILE_DATASET = {
  mortali: "/data/informo-ateco-analisi.json",
  gravi: "/data/informo-ateco-analisi-gravi.json",
} as const;

// Nomi di sezione Ateco per la label del dropdown (etichette brevi).
const NOMI_SEZIONE: Record<string, string> = {
  A: "Agricoltura, silvicoltura e pesca",
  B: "Industrie estrattive",
  C: "Attività manifatturiere",
  D: "Energia elettrica, gas, vapore",
  E: "Acqua, reti fognarie, rifiuti",
  F: "Costruzioni",
  G: "Commercio all'ingrosso e al dettaglio",
  H: "Trasporti e magazzinaggio",
  I: "Attività di alloggio e ristorazione",
  K: "Attività finanziarie e assicurative",
  M: "Attività professionali, scientifiche e tecniche",
  O: "Amministrazione pubblica e difesa",
  P: "Istruzione",
  Q: "Sanità e assistenza sociale",
  R: "Attività artistiche, sportive e intrattenimento",
  S: "Altre attività di servizi",
  T: "Attività di famiglie e convivenze",
  U: "Organizzazioni extraterritoriali",
} as const;

export function nomeSezione(sezione: string): string {
  return NOMI_SEZIONE[sezione] ?? `Sezione ${sezione}`;
}

interface Props {
  value: string; // "" = tutti i settori
  onChange: (sezione: string) => void;
  perimetro: { mortali: boolean; gravi: boolean };
  disabled?: boolean;
}

export function FiltroSettoreAteco({ value, onChange, perimetro, disabled }: Props) {
  const [dati, setDati] = useState<{ mortali: AtecoDataset | null; gravi: AtecoDataset | null }>({
    mortali: null,
    gravi: null,
  });

  // Carica i dataset al mount (una sola volta). Il merge tra mortali e gravi
  // avviene al volo nel selettore delle viste quando servono entrambi.
  useEffect(() => {
    const load = async () => {
      const [m, g] = await Promise.all([
        fetch(FILE_DATASET.mortali).then((r) => r.json()),
        fetch(FILE_DATASET.gravi).then((r) => r.json()),
      ]);
      setDati({ mortali: m as AtecoDataset, gravi: g as AtecoDataset });
    };
    void load();
  }, []);

  // Dataset effettivo secondo il perimetro attivo (mortali/gravi/entrambi).
  const datasetAttivo = useMemo<{ dataset: AtecoDataset; merge: boolean } | null>(() => {
    const m = dati.mortali;
    const g = dati.gravi;
    if (!m && !g) return null;
    if (!g) return { dataset: m!, merge: false };
    if (!m) return { dataset: g, merge: false };
    if (perimetro.gravi && !perimetro.mortali) return { dataset: g, merge: false };
    if (perimetro.mortali && !perimetro.gravi) return { dataset: m, merge: false };
    return { dataset: m, merge: true };
  }, [dati, perimetro.mortali, perimetro.gravi]);

  // Elenco sezioni disponibili (dal dataset attivo, ordinate per codice).
  const sezioni = useMemo(() => {
    const ds = datasetAttivo;
    if (!ds) return [] as { sezione: string; casi: number }[];
    return ds.merge
      ? mergeSezioni(ds.dataset, dati.gravi!)
      : ds.dataset.sezioni.map((s) => ({ sezione: s.sezione, casi: s.casi }));
  }, [datasetAttivo, dati.gravi]);

  const styleBase: React.CSSProperties = {
    border: "1px solid var(--color-divider)",
    borderRadius: 2,
    background: "var(--color-raised)",
    color: "var(--color-text)",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "6px 10px",
    cursor: "pointer",
    maxWidth: 260,
  };

  if (!datasetAttivo) {
    return (
      <select style={styleBase} disabled aria-label="Attività economica">
        <option>Caricamento&hellip;</option>
      </select>
    );
  }

  const label = value === "" ? "Tutte le attività" : nomeSezione(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <select
        style={styleBase}
        value={value}
        disabled={disabled}
        aria-label="Filtra per attività economica (settore)"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Tutte le attività economiche</option>
        {sezioni.map((s) => (
          <option key={s.sezione} value={s.sezione}>
            {nomeSezione(s.sezione)} ({s.casi.toLocaleString("it-IT")})
          </option>
        ))}
      </select>
      {label !== "Tutte le attività" && (
        <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// Somma due dataset Ateco sezione per sezione (mortali + gravi).
export function mergeSezioni(a: AtecoDataset, b: AtecoDataset): { sezione: string; casi: number }[] {
  const perSezione = new Map<string, { casi: number }>();
  for (const ds of [a, b]) {
    for (const s of ds.sezioni) {
      const cur = perSezione.get(s.sezione) ?? { casi: 0 };
      cur.casi += s.casi;
      perSezione.set(s.sezione, cur);
    }
  }
  return [...perSezione.entries()]
    .map(([sezione, { casi }]) => ({ sezione, casi }))
    .sort((x, y) => x.sezione.localeCompare(y.sezione));
}