#!/usr/bin/env python3
"""ETL esiti malattie professionali: denunce, riconosciute, rigettate, in istruttoria.

Fonte: INAIL Open Data, DatiSemestraliMalattieProfessionaliDataProt (CSV per
regione, rilevazione 30/04/2026). Ogni riga è una pratica con la sua
DefinizioneAmministrativaCaso (P = positivo/riconosciuta, N = negativo,
I = in istruttoria), DataProtocollo e DataDefinizione.

A differenza della Relazione Annuale (che pubblica "36 mila" arrotondato),
questo dataset permette il conteggio PRECISO alla data di rilevazione delle
pratiche riconosciute, rigettate e ancora in istruttoria, per anno di
protocollo della denuncia.

Output: src/data/generated/malattie-esiti.json

Uso:
  python3 scripts/etl/estrai_esiti_malattie.py
  (i CSV raw vanno aggiornati prima con aggiorna_malattie_professionali.py
   esteso al semestrale DataProt, oppure scaricati come da RAW_FONTE)
"""

from __future__ import annotations

import csv
import glob
import hashlib
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw" / "malattie-professionali"
OUT = ROOT / "src" / "data" / "generated" / "malattie-esiti.json"
REGISTRY = ROOT / "scripts" / "ci" / "generated-artifacts.json"

REGIONI = {
    "Abruzzo": "13", "Basilicata": "17", "Calabria": "18", "Campania": "15",
    "EmiliaRomagna": "08", "FriuliVeneziaGiulia": "06", "Lazio": "12",
    "Liguria": "07", "Lombardia": "03", "Marche": "11", "Molise": "14",
    "Piemonte": "01", "Puglia": "16", "Sardegna": "20", "Sicilia": "19",
    "Toscana": "09", "TrentinoAltoAdige": "04", "Umbria": "10",
    "ValledAosta": "02", "Veneto": "05",
}
NOMI = {v: k for k, v in REGIONI.items()}

# Nome leggibile per i codici ICD-10 più frequenti nelle malattie professionali.
# Solo i codici osservati nei dati hanno una descrizione; gli altri mostrano il codice.
DESCRIZIONI_ICD = {
    "M75.1": "Lesioni della cuffia dei rotatori (spalla)",
    "G56.0": "Sindrome del tunnel carpale",
    "M51.1": "Ernia o protrusione discale lombare",
    "M51.2": "Spostamento di disco intervertebrale lombare",
    "M51.3": "Degenerazione di disco intervertebrale lombare",
    "M75": "Borsiti e lesioni della spalla",
    "M77.0": "Epicondilite mediale (gomito del golfista)",
    "M77.1": "Epicondilite laterale (gomito del tennista)",
    "H83.3": "Ipoacusia da rumore",
    "M47.8": "Spondilosi (artrosi della colonna)",
    "M23.3": "Meniscopatia del ginocchio",
    "M75.4": "Tendinite della spalla",
    "M18": "Artrosi della prima articolazione carpo-metacarpale",
    "M17": "Gonartrosi (artrosi del ginocchio)",
    "L23": "Dermatite allergica da contatto",
    "L24": "Dermatite irritante da contatto",
    "L25": "Dermatite da contatto non specificata",
    "C45.0": "Mesotelioma della pleura",
    "C34": "Tumore maligno del bronco-polmonare",
    "J45": "Asma",
    "J45.0": "Asma allergico",
    "A15": "Tubercolosi respiratoria",
    "G62": "Polineuropatie",
    "M65.8": "Altre sinoviti e tenosinoviti",
    "M65.4": "Tenosinovite della stiloide radiale (de Quervain)",
    "M65": "Sinoviti e tenosinoviti",
    "M70": "Malattie dei tessuti molli da uso e pressione",
    "M70.2": "Borsite dell'olecrano",
    "M70.4": "Borsite prepatellare",
    "M75.3": "Tendinite calcificante della spalla",
    "F43": "Reazione a stress grave e disturbi dell'adattamento",
    "M77": "Altre entesopatie",
    "H83": "Altre malattie dell'orecchio interno",
    "M54.5": "Lombalgia",
    "M54": "Dorsalgia",
    "R06": "Anomalie della respirazione",
    "G56": "Mononeuropatie dell'arto superiore",
    "C45": "Mesotelioma",
}

# Famiglie cliniche usate dalla Relazione Annuale INAIL per il confronto.
FAMIGLIE_RELAZIONE = [
    ("Sistema nervoso", ("G",)),
    ("Cute", ("L",)),
    ("Apparato osteomuscolare", ("M",)),
    ("Ipoacusia", ("H83",)),
    ("Tumori", ("C",)),
    ("Apparato respiratorio", ("J",)),
    ("Occhio", ("H",)),
]

# Rilevazione attesa: la cadenza semestrale pubblica con rilevazione 30/04 e 31/10.
# Il dataset con DataRilevazione == RILEVAZIONE_ATTESA è la fotografia più recente.
RILEVAZIONE_ATTESA = "30/04/2026"

# Coerenza con la Relazione Annuale 2025: le denunce 2025 devono combaciare.
# Se il totale dei record per anno di protocollo 2025 non è 98.312, lo script
# avvisa: la fonte è cambiata (nuova rilevazione, altro aggiornamento).
DENUNCE_2025_ATTESE = 98312


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def leggi_rilevazione(rilevazione: str) -> list[dict]:
    """Legge tutti i CSV regionali e ritorna SOLO le pratiche della rilevazione data."""
    righe: list[dict] = []
    for f in sorted(glob.glob(str(RAW_DIR / "semestrale_prot_*.csv"))):
        with open(f, encoding="latin-1", newline="") as fh:
            for r in csv.DictReader(fh, delimiter=";"):
                if (r.get("DataRilevazione") or "").strip() == rilevazione:
                    righe.append(r)
    return righe


def esito_da_rilevazioni(righe: list[dict]) -> dict:
    """Aggrega per anno di protocollo: P/N/I per DefinizioneAmministrativaCaso."""
    per_anno = defaultdict(Counter)
    for r in righe:
        dp = (r.get("DataProtocollo") or "").strip()
        anno = dp[6:10] if len(dp) == 10 and dp[6:10].isdigit() else "?"
        esito = (r.get("DefinizioneAmministrativaCaso") or "").strip() or "?"
        per_anno[anno][esito] += 1
    return per_anno


def main() -> int:
    print(f"1. Lettura CSV semestrali DataProt (rilevazione {RILEVAZIONE_ATTESA})")
    files = sorted(glob.glob(str(RAW_DIR / "semestrale_prot_*.csv")))
    if not files:
        raise SystemExit(
            f"Nessun CSV in {RAW_DIR}: scaricare i DatiSemestraliMalattieProfessionaliDataProt"
            " per tutte le regioni prima di eseguire questo ETL."
        )
    righe = leggi_rilevazione(RILEVAZIONE_ATTESA)
    print(f"   {len(files)} file regionali, {len(righe):,} pratiche alla rilevazione {RILEVAZIONE_ATTESA}")

    per_anno = esito_da_rilevazioni(righe)

    # --- Per patologia (ICD10 accertato) ---
    patologie: dict[str, Counter] = defaultdict(Counter)   # icd -> esito (+ include I e ND)
    patologie_def: dict[str, Counter] = defaultdict(Counter)
    pat_anno: dict[str, dict[str, Counter]] = defaultdict(lambda: defaultdict(Counter))
    famiglie: dict[str, Counter] = defaultdict(Counter)      # famiglia di patologia -> esito
    famiglie_def: dict[str, Counter] = defaultdict(Counter)
    nd_esiti = Counter()

    def _famiglia(icd: str) -> str:
        icd = (icd or "").strip().upper()
        if not icd or icd in ("ND", "N.D.", "N.D"):
            return "Non determinata"
        for nome, prefissi in FAMIGLIE_RELAZIONE:
            for p in prefissi:
                if icd.startswith(p):
                    return nome
        return "Altre patologie"

    for r in righe:
        dp = (r.get("DataProtocollo") or "").strip()
        anno = dp[6:10] if len(dp) == 10 and dp[6:10].isdigit() else "?"
        esito = (r.get("DefinizioneAmministrativaCaso") or "").strip() or "?"
        icd = (r.get("ICD10accertato") or "").strip().upper()
        if not icd or icd in ("ND", "N.D.", "N.D"):
            nd_esiti[esito] += 1
            icd = "ND"
        fam = _famiglia(icd)
        patologie[icd][esito] += 1
        famiglie[fam][esito] += 1
        if esito in ("P", "N"):
            patologie_def[icd][esito] += 1
            famiglie_def[fam][esito] += 1
        if anno in ("2021", "2022", "2023", "2024", "2025"):
            pat_anno[anno][icd][esito] += 1

    def _tasso(c: Counter) -> float | None:
        defi = c.get("P", 0) + c.get("N", 0)
        return round(c.get("P", 0) * 100 / defi, 1) if defi else None

    per_patologia = []
    for icd, c in patologie_def.items():
        if icd == "ND":
            continue
        defi = c.get("P", 0) + c.get("N", 0)
        if defi < 500:  # soglia: abbastanza casi per un tasso stabile
            continue
        per_patologia.append({
            "codice": icd,
            "nome": DESCRIZIONI_ICD.get(icd, icd),
            "riconosciute": c.get("P", 0),
            "rigettate": c.get("N", 0),
            "inIstruttoria": patologie[icd].get("I", 0),
            "tassoPerc": _tasso(c),
        })
    per_patologia.sort(key=lambda x: x["riconosciute"] + x["rigettate"], reverse=True)

    famiglie_out = []
    for fam, c in famiglie_def.items():
        if fam == "Non determinata":
            continue
        defi = c.get("P", 0) + c.get("N", 0)
        if defi < 2000:
            continue
        famiglie_out.append({
            "famiglia": fam,
            "riconosciute": c.get("P", 0),
            "rigettate": c.get("N", 0),
            "tassoPerc": _tasso(c),
        })
    famiglie_out.sort(key=lambda x: x["riconosciute"] + x["rigettate"], reverse=True)

    # --- Per patologia, distinto per anno (per i filtri) ---
    patologie_per_anno: dict[str, list[dict]] = {}
    ANNI_FILTRO = ("2021", "2022", "2023", "2024", "2025")
    for anno in ANNI_FILTRO:
        rows = []
        for icd, c in pat_anno[anno].items():
            if icd == "ND":
                continue
            defi = c.get("P", 0) + c.get("N", 0)
            if defi < 100:  # soglia per anno: tassi stabili anche su finestra singola
                continue
            rows.append({
                "codice": icd,
                "nome": DESCRIZIONI_ICD.get(icd, icd),
                "riconosciute": c.get("P", 0),
                "rigettate": c.get("N", 0),
                "inIstruttoria": patologie[icd].get("I", 0),
                "tassoPerc": _tasso(c),
            })
        rows.sort(key=lambda x: x["tassoPerc"], reverse=True)  # da più riconosciute
        patologie_per_anno[anno] = rows

    anagrafica: dict[str, dict] = {}
    for anno, c in sorted(per_anno.items()):
        if anno == "?":
            continue
        p = c.get("P", 0)
        n = c.get("N", 0)
        i = c.get("I", 0)
        tot = p + n + i
        def_tot = p + n
        anagrafica[anno] = {
            "anno": anno,
            "denunce": tot,
            "riconosciute": p,
            "rigettate": n,
            "inIstruttoria": i,
            "definite": def_tot,
        }
        if def_tot:
            anagrafica[anno]["riconosciutePerc"] = round(p * 100 / def_tot, 1)
            anagrafica[anno]["rigettatePerc"] = round(n * 100 / def_tot, 1)

    # Controllo di coerenza vs Relazione Annuale
    a2025 = anagrafica.get("2025", {})
    print(f"   2025: riconosciute={a2025.get('riconosciute')}, rigettate={a2025.get('rigettate')}, "
          f"istruttoria={a2025.get('inIstruttoria')}, denunce={a2025.get('denunce')}")
    if a2025.get("denunce") != DENUNCE_2025_ATTESE:
        print(f"   [ATTENZIONE] Denunce 2025 nel dataset ({a2025.get('denunce')}) != {DENUNCE_2025_ATTESE} "
              f"(Relazione Annuale). Fonte cambiata o rilevazione non aggiornata: verificare.")
    else:
        print("   OK: denunce 2025 coincidono con la Relazione Annuale (98.312).")

    serie = []
    for anno in sorted(anagrafica):
        serie.append({
            "anno": anno,
            "riconosciute": anagrafica[anno]["riconosciute"],
            "rigettate": anagrafica[anno]["rigettate"],
            "inIstruttoria": anagrafica[anno]["inIstruttoria"],
            "riconosciutePerc": anagrafica[anno]["riconosciutePerc"],
            "rigettatePerc": anagrafica[anno]["rigettatePerc"],
        })

    payload = {
        "schemaVersion": 2,
        "datasetId": "malattie_esiti",
        "generatedAt": utc_now(),
        "fonte": "INAIL Open Data — DatiSemestraliMalattieProfessionaliDataProt (CSV per regione)",
        "dataRilevazione": RILEVAZIONE_ATTESA,
        "nota": (
            "Dato preciso ricavato dal dataset open data semestrale, non dal valore "
            "arrotondato della Relazione Annuale ('36 mila'). Ogni riga corrisponde a una "
            "pratica con la sua definizione amministrativa (P=riconosciuta, N=rigettata, "
            "I=in istruttoria) alla data di rilevazione. Il numero è una fotografia: "
            "le pratiche in istruttoria dell'anno più recente potranno essere definite "
            "nella rilevazione successiva. Le denunce possono essere plurime (più pratiche "
            "per lo stesso lavoratore)."
        ),
        "denuncePerAnno": serie,
        "2025": anagrafica.get("2025"),
        "istruttoriaPerc2025": (
            round(anagrafica["2025"]["inIstruttoria"] * 100 / anagrafica["2025"]["denunce"], 1)
            if anagrafica.get("2025") and anagrafica["2025"]["denunce"] else None
        ),
        "lavoratoriCoinvolti": {"2025": 63136},  # dalla Relazione: lavoratori, non pratiche
        "perPatologia": per_patologia,
        "patologiePerAnno": patologie_per_anno,
        "famiglie": famiglie_out,
        "nonDeterminati": {
            "definitiNonD": nd_esiti.get("N", 0) + nd_esiti.get("P", 0),
            "rigettatiNonD": nd_esiti.get("N", 0),
            "riconosciutiNonD": nd_esiti.get("P", 0),
            "inIstruttoriaNonD": nd_esiti.get("I", 0),
        },
        "notaPatologie": (
            "Il tasso di riconoscimento per patologia si calcola sui casi definiti con patologia "
            "accertata (ICD10accertato valorizzato). I casi con ICD non determinato (ND) hanno "
            "l'esito amministrativo ma non la patologia accertata nel dataset: sono esclusi dal "
            "tasso per patologia e indicati a parte. Le famiglie cliniche seguono la Relazione "
            "Annuale INAIL per il confronto."
        ),
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"2. Scritto {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")

    if REGISTRY.exists():
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
        entries = registry.get("artifacts", registry)
        content = OUT.read_bytes()
        sha = hashlib.sha256(content).hexdigest()
        entry = next((e for e in entries if e.get("path") == "src/data/generated/malattie-esiti.json"), None)
        if entry is None:
            entries.append({
                "artifactId": "malattie-esiti",
                "path": "src/data/generated/malattie-esiti.json",
                "kind": "generated-json",
                "bytes": len(content),
                "sha256": sha,
            })
            print("   [registry] aggiunto malattie-esiti")
        else:
            entry["bytes"] = len(content)
            entry["sha256"] = sha
            print("   [registry] aggiornato malattie-esiti")
        REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())