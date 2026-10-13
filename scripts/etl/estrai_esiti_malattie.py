#!/usr/bin/env python3
"""ETL esiti malattie professionali: quante denunce vengono riconosciute.

Fonte: INAIL, Relazione Annuale 2025, "Focus statistico sulle malattie
professionali" (pagg. 65-74 del PDF ufficiale, presentato alla Camera il
22/09/2026). Il focus contiene sia le denunce sia l'esito delle pratiche:
riconosciute positivamente, definite negativamente e ancora in istruttoria.

Questo ETL NON fa parsing euristico dei numeri dal PDF: i valori sono stati
letti e verificati a mano sul testo ufficiale il 13/10/2026, e lo script
verifica che i marker testuali chiave siano ancora presenti nel PDF prima di
scrivere il dataset. Se l'edizione del prossimo anno cambia layout o cifre,
lo script fallisce in modo esplicito: i valori andranno ri-verificati.

Output: src/data/generated/malattie-esiti.json

Uso:
  python3 scripts/etl/estrai_esiti_malattie.py
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "data" / "raw" / "relazione-annuale" / "relazione-annuale-inail-2025.pdf"
OUT = ROOT / "src" / "data" / "generated" / "malattie-esiti.json"
REGISTRY = ROOT / "scripts" / "ci" / "generated-artifacts.json"

# Marker testuali che devono comparire nel testo estratto (salvaguardia
# anti-regressione: se la fonte cambia, l'ETL si ferma).
REQUIRED_MARKERS = [
    "98.312",        # denunce 2025
    "88.338",        # denunce 2024
    "72.575",        # denunce 2023
    "60.623",        # denunce 2022
    "55.198",        # denunce 2021
    "63.136",        # lavoratori coinvolti 2025
    "36 mila",       # riconosciute positivamente alla rilevazione 30/04/2026
    "circa la metà", # esiti sui casi definiti 2021-2025
    "55%",           # soglia nervoso/cute
    "15%",           # pratiche ancora in istruttoria nell'ultimo anno
    "30 aprile 2026",  # data di rilevazione
]

# Valori verificati a mano sul PDF (13/10/2026). Non modificare senza
# ri-verificare i marker sopra.
VALORI = {
    "denunce": {
        "2021": 55198,
        "2022": 60623,
        "2023": 72575,
        "2024": 88338,
        "2025": 98312,
    },
    "lavoratoriCoinvolti": {
        "2024": 58000,   # "58 mila" nel testo (cifra arrotondata dalla fonte)
        "2025": 63136,   # cifra esatta nel testo
    },
    "esiti2025": {
        "denunce": 98312,
        "riconosciute": 36000,  # "36 mila" circa, alla rilevazione 30/04/2026
        "inIstruttoriaNota": "diverse migliaia di pratiche ancora in istruttoria",
    },
    "casiDefiniti2021_2025": {
        "riconosciutePerc": 50,   # "circa la metà"
        "nonRiconosciutePerc": 50,  # il complemento sui casi definiti
        "nota": "Percentuali sui soli casi definiti (positive e negative), escluse le pratiche in istruttoria.",
    },
    "istruttoriaUltimoAnnoPerc": 15,
    "perPatologia": [
        {"patologia": "Malattie del sistema nervoso", "tasso": ">55%"},
        {"patologia": "Malattie della cute", "tasso": ">55%"},
        {"patologia": "Malattie osteomuscolari", "tasso": "≈50%"},
        {"patologia": "Ipoacusie", "tasso": "≈50%"},
        {"patologia": "Tumori professionali", "tasso": "≈50%"},
        {"patologia": "Tutte le altre patologie", "tasso": "<50%"},
    ],
    "denuncePlurime": {
        "denunce2025": 98312,
        "lavoratori2025": 63136,
        "nota": "Una stessa segnalazione può aprire più pratiche (denunce plurime): il numero di denunce non coincide con il numero di lavoratori ammalati.",
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def extract_text(pdf: Path) -> str:
    try:
        import pdfplumber
    except ImportError as exc:  # pragma: no cover
        raise SystemExit("pdfplumber non installato (venv ETL: /root/.scrapling-venv/bin/python)") from exc
    parts: list[str] = []
    with pdfplumber.open(str(pdf)) as doc:
        for page in doc.pages:
            t = page.extract_text() or ""
            parts.append(t)
    return "\n".join(parts)


def main() -> int:
    if not PDF.exists():
        raise SystemExit(f"Manca il PDF: {PDF} (copiare il PDF ufficiale della Relazione Annuale in data/raw/relazione-annuale/)")
    print(f"1. Estrazione testo da {PDF.name} ...")
    testo = extract_text(PDF)
    # normalizza gli spazi (il testo estratto ha spesso spazi doppi)
    testo_norm = " ".join(testo.split())
    print(f"   testo estratto: {len(testo_norm):,} caratteri")

    print("2. Verifica marker testuali...")
    mancanti = [m for m in REQUIRED_MARKERS if m not in testo_norm]
    if mancanti:
        raise SystemExit(
            f"Marker mancanti nel PDF (fonte cambiata?): {mancanti}. "
            "Rileggere il focus e aggiornare VALORI prima di rigenerare."
        )
    print("   OK: tutti i marker presenti.")

    payload = {
        "schemaVersion": 1,
        "datasetId": "malattie_esiti",
        "generatedAt": utc_now(),
        "fonte": "INAIL, Relazione Annuale 2025, Focus statistico sulle malattie professionali (pagg. 65-74 del PDF ufficiale)",
        "dataRilevazione": "2026-04-30",
        "nota": "Dato curato, non open data mensile: arriva una volta l'anno dalla Relazione Annuale INAIL. I valori sono stati verificati a mano sul testo ufficiale il 13/10/2026; l'ETL fallisce se i marker testuali chiave spariscono dal PDF.",
        **VALORI,
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"3. Scritto {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")

    # Allinea il registry degli artifact (come aggiorna_news_infortuni.py)
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