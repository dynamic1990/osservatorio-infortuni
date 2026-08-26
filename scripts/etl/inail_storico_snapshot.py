#!/usr/bin/env python3
"""Scarica lo storico INAIL (semestrale 2020-2024, tutte le regioni).

L'API REST mensile copre ~18 mesi e 16 regioni. Per il passato e per le
regioni con nome composto (non accettate dall'API) si usano i file CSV
regionali pubblicati dal portale:

  https://dati.inail.it/opendata/downloads/daticoncadenzasemestraleinfortuni/zip/DatiConCadenzaSemestraleInfortuni<Regione>_csv.zip

I CSV semestrali contengono 5 anni interi (2020-2024) consolidati, inclusi
definizione amministrativa, indennizzo, giorni indennizzati.

Esempi:
  python3 scripts/etl/inail_storico_snapshot.py                    # tutte
  python3 scripts/etl/inail_storico_snapshot.py --regioni Molise   # solo test
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import urllib.request
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://dati.inail.it/opendata/downloads/daticoncadenzasemestraleinfortuni/zip"
USER_AGENT = "OsservatorioInfortuni-ETL/0.2 (+https://github.com/dynamic1990/osservatorio-infortuni)"

REGIONI = [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "EmiliaRomagna",
    "FriuliVeneziaGiulia", "Lazio", "Liguria", "Lombardia", "Marche",
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
    "TrentinoAltoAdige", "Umbria", "ValledAosta", "Veneto",
]

CODICE_REGIONE = {
    "Abruzzo": "13", "Basilicata": "17", "Calabria": "18", "Campania": "15",
    "EmiliaRomagna": "08", "FriuliVeneziaGiulia": "06", "Lazio": "12",
    "Liguria": "07", "Lombardia": "03", "Marche": "11", "Molise": "14",
    "Piemonte": "01", "Puglia": "16", "Sardegna": "20", "Sicilia": "19",
    "Toscana": "09", "TrentinoAltoAdige": "04", "Umbria": "10",
    "ValledAosta": "02", "Veneto": "05",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fetch_zip(regione: str, raw_dir: Path) -> str:
    url = f"{BASE}/DatiConCadenzaSemestraleInfortuni{regione}_csv.zip"
    dest = raw_dir / f"semestrale-{regione}.zip"
    if dest.exists() and dest.stat().st_size > 0:
        return str(dest)
    print(f"Download {regione}...", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=240) as resp:
        data = resp.read()
    dest.write_bytes(data)
    return str(dest)


def parse_zip(zip_path: str) -> list[dict]:
    records: list[dict] = []
    with zipfile.ZipFile(zip_path) as zf:
        name = zf.namelist()[0]
        with zf.open(name) as f:
            text = io.TextIOWrapper(f, encoding="utf-8-sig")
            reader = csv.DictReader(text, delimiter=";")
            for row in reader:
                records.append(row)
    return records


def aggregate(records: list[dict], regione: str) -> tuple[list[dict], int, int]:
    counter: Counter[tuple] = Counter()
    mortali = 0
    for r in records:
        data_acc = r.get("DataAccadimento", "")
        if len(data_acc) != 10:
            continue
        anno = int(data_acc[6:10])
        eta_raw = r.get("Eta", "-1")
        try:
            eta = int(eta_raw)
        except ValueError:
            eta = -1
        chiave = (
            anno,
            r.get("Regione", "") or CODICE_REGIONE[regione],
            r.get("LuogoAccadimento", ""),
            r.get("SettoreAttivitaEconomica", ""),
            r.get("GrandeGruppoTariffario", ""),
            r.get("Genere", ""),
            eta,
            r.get("ModalitaAccadimento", ""),
            r.get("DefinizioneAmministrativa", ""),
            r.get("Indennizzo", ""),
        )
        counter[chiave] += 1
        if r.get("DataMorte"):
            mortali += 1

    rows = [
        {
            "anno": k[0], "regione": k[1], "provincia": k[2],
            "settoreAteco": k[3], "grandeGruppo": k[4], "genere": k[5],
            "eta": k[6], "modalita": k[7],
            "definizioneAmministrativa": k[8], "indennizzo": k[9],
            "casi": v,
        }
        for k, v in counter.items()
    ]
    return rows, len(records), mortali


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--regioni", nargs="+", default=REGIONI)
    parser.add_argument("--output-dir", type=Path, default=Path("src/data/generated"))
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    args = parser.parse_args()

    args.raw_dir.mkdir(parents=True, exist_ok=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    tutti: list[dict] = []
    total_record = 0
    total_mortali = 0
    by_anno: Counter[int] = Counter()
    regioni_ok: list[str] = []
    province: set[str] = set()

    for regione in args.regioni:
        if regione not in CODICE_REGIONE:
            raise SystemExit(f"Regione sconosciuta: {regione}")
        zip_path = fetch_zip(regione, args.raw_dir)
        records = parse_zip(zip_path)
        rows, n_rec, n_mort = aggregate(records, regione)
        tutti.extend(rows)
        total_record += n_rec
        total_mortali += n_mort
        regioni_ok.append(regione)
        for r in rows:
            by_anno[r["anno"]] += r["casi"]
            province.add(r["provincia"])
        anni = sorted({r["anno"] for r in rows})
        print(f"{regione}: {n_rec} record, {len(rows)} aggregati, anni {anni[0]}-{anni[-1]}", flush=True)

    anni_lista = sorted(by_anno)
    snapshot = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_semestrale_storico",
        "period": {"annoDa": anni_lista[0], "annoA": anni_lista[-1], "mesi": None},
        "coverage": {
            "regioni": len(regioni_ok),
            "province": len(province),
            "record": total_record,
            "casi": sum(r["casi"] for r in tutti),
            "mortali": total_mortali,
            "casiPerAnno": {str(a): by_anno[a] for a in anni_lista},
        },
        "aggregates": tutti,
    }
    out = args.output_dir / "inail-infortuni-semestrale-storico.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\nSalvato {out} ({out.stat().st_size} bytes)")
    print(f"Record: {total_record}, aggregati: {len(tutti)}, mortali: {total_mortali}")
    print(f"Casi per anno: {dict(by_anno)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
