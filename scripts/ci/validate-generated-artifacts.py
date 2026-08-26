#!/usr/bin/env python3
"""Valida gli snapshot generati prima della pubblicazione.

Verifica che:
- i file esistano e siano JSON validi;
- lo snapshot dati rispetti il contratto (chiavi attese, tipi, valori);
- il meta riporti fonte, data estrazione e hash coerente con il file dati.

Uso:
    python3 scripts/ci/validate-generated-artifacts.py
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "src" / "data" / "generated"

REQUIRED_META = {"schemaVersion", "datasetId", "source", "extractedAt", "period", "coverage", "limits", "methodology", "dataArtifactSha256"}
REQUIRED_DATA = {"schemaVersion", "datasetId", "period", "coverage", "aggregates"}


def check(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERRORE: {message}")


def main() -> int:
    data_path = DATA_DIR / "inail-infortuni-serie.json"
    meta_path = DATA_DIR / "inail-infortuni-serie.meta.json"

    check(data_path.exists(), f"manca {data_path.name}")
    check(meta_path.exists(), f"manca {meta_path.name}")

    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)
    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)

    check(set(data) >= REQUIRED_DATA, f"contratto dati incompleto: mancano {REQUIRED_DATA - set(data)}")
    check(data["schemaVersion"] == 1, "schemaVersion dati != 1")
    check(data["datasetId"] == meta.get("datasetId"), "datasetId dati/meta non coincide")
    check(data["period"] == meta.get("period"), "period dati/meta non coincide")
    check(data["coverage"]["record"] == meta["coverage"]["record"], "coverage.record dati/meta non coincide")

    check(set(meta) >= REQUIRED_META, f"contratto meta incompleto: mancano {REQUIRED_META - set(meta)}")
    check("source" in meta and "owner" in meta["source"] and "apiUrl" in meta["source"], "meta.source incompleta")

    # Hash del file dati come dichiarato nel meta
    digest = hashlib.sha256(data_path.read_bytes()).hexdigest()
    check(digest == meta.get("dataArtifactSha256"), f"sha256 non coincide: {digest} != {meta.get('dataArtifactSha256')}")

    # Sanità degli aggregati
    aggregates = data["aggregates"]
    check(isinstance(aggregates, list) and len(aggregates) > 0, "aggregates vuoto")
    for row in aggregates[:1000]:
        check(row["casi"] > 0, f"casi <= 0 in {row['key']}")
        check(row["genere"] in ("M", "F"), f"genere non valido in {row['key']}")
        check(row["modalita"] in ("S", "N"), f"modalita non valida in {row['key']}")
        check(isinstance(row["eta"], int), f"eta non intera in {row['key']}")

    print(f"OK: {data_path.name} ({len(aggregates)} aggregati, {meta['coverage']['record']} record fonte)")
    print(f"OK: {meta_path.name} (estrazione {meta['extractedAt']}, hash verificato)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
