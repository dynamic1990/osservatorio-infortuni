#!/usr/bin/env python3
"""
Aggiorna i CSV raw delle malattie professionali da dati.inail.it.

Scarica per le 20 regioni i due file ufficiali INAIL Open Data:
- DatiMensiliMalattieProfessionaliDataProt_<Regione>.csv  (denunce, cadenza mensile)
- DatiSemestraliMalattieProfessionaliDataDec_<Regione>.csv (decessi, cadenza semestrale)

Gli URL seguono il pattern pubblico del portale (niente API CKAN, che non esiste più:
dati.inail.it/opendata/downloads/...). Verificato il 10/10/2026: pattern attivo su
tutte le regioni, CSV con dati fino ad agosto 2026.

Output:
- data/raw/malattie-professionali/mensile_<Regione>.csv
- data/raw/malattie-professionali/decessi_<Regione>.csv

I file vengono sovrascritti SOLO se il contenuto cambia (confronto sha256), così
i timestamp dei raw riflettono l'ultimo aggiornamento reale del dato.

Uso:
  python3 scripts/etl/aggiorna_malattie_professionali.py [--etl]
    --etl  esegue anche l'ETL per rigenerare src/data/generated/malattie-professionali.json
"""

import argparse
import hashlib
import sys
import time
from pathlib import Path

from scrapling.fetchers import Fetcher

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw" / "malattie-professionali"
RAW_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://dati.inail.it/opendata/downloads"
PATTERNS = {
    "mensile": "datimensilimalattieprofessionali/csv/DatiMensiliMalattieProfessionaliDataProt{reg}.csv",
    "decessi": "datisemestralimalattieprofessionali/csv/DatiSemestraliMalattieProfessionaliDataDec{reg}.csv",
}

REGIONI = [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "EmiliaRomagna",
    "FriuliVeneziaGiulia", "Lazio", "Liguria", "Lombardia", "Marche",
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
    "TrentinoAltoAdige", "Umbria", "ValledAosta", "Veneto",
]

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0 "
    "OsservatorioInfortuniETL/1.0 (contact: page Progetto)"
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def download_one(url: str, dest: Path, retries: int = 3) -> tuple[bool, str]:
    """Scarica url in dest. Ritorna (cambiato, stato)."""
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            r = Fetcher.get(url, timeout=60, headers={"User-Agent": USER_AGENT})
            if r.status != 200:
                last_err = f"HTTP {r.status}"
                time.sleep(2 * attempt)
                continue
            body = r.body if hasattr(r, "body") else r.content
            if not body or len(body) < 100:
                last_err = f"risposta vuota ({len(body) if body else 0} byte)"
                time.sleep(2 * attempt)
                continue
            nuovo_hash = sha256(body)
            if dest.exists() and sha256(dest.read_bytes()) == nuovo_hash:
                return False, "invariato"
            tmp = dest.with_suffix(".csv.tmp")
            tmp.write_bytes(body)
            tmp.replace(dest)
            return True, f"aggiornato ({len(body):,} byte)"
        except Exception as e:  # noqa: BLE001
            last_err = f"{type(e).__name__}: {e}"
            time.sleep(2 * attempt)
    return False, f"ERRORE {last_err}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--etl", action="store_true", help="rigenera anche il JSON con l'ETL")
    ap.add_argument("--solo", choices=list(PATTERNS) + ["tutti"], default="tutti")
    args = ap.parse_args()

    print(f"Aggiornamento fonti malattie professionali | {time.strftime('%Y-%m-%d %H:%M')}")
    print(f"Output: {RAW_DIR}\n")

    totali = {"mensile": 0, "decessi": 0}
    errori = []

    for reg in REGIONI:
        for kind, pattern in PATTERNS.items():
            if args.solo != "tutti" and args.solo != kind:
                continue
            url = f"{BASE}/{pattern.format(reg=reg)}"
            dest = RAW_DIR / f"{kind}_{reg}.csv"
            cambiato, stato = download_one(url, dest)
            totali[kind] += 1 if cambiato else 0
            marc = "+" if cambiato else " "
            print(f" {marc} {kind[:8]:8s} {reg:22s} {stato}")
            if stato.startswith("ERRORE"):
                errori.append((reg, kind, stato))

    print(f"\nFile aggiornati: mensili={totali['mensile']}, decessi={totali['decessi']}")
    if errori:
        print("Errori:")
        for reg, kind, stato in errori:
            print(f"  - {kind} {reg}: {stato}")
        return 1

    if args.etl:
        print("\nEseguo ETL...")
        import subprocess
        script = ROOT / "scripts" / "etl" / "malattie_professionali_etl.py"
        r = subprocess.run([sys.executable, str(script)], cwd=ROOT)
        return r.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())