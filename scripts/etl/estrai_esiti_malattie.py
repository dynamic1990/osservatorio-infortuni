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
        "perPatologia": None,  # in sviluppo: top ICD10 accertati con esiti
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