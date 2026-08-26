#!/usr/bin/env python3
"""Valida gli snapshot generati prima della pubblicazione."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "src" / "data" / "generated"

REQUIRED_META = {"schemaVersion", "datasetId", "source", "extractedAt", "period", "coverage", "limits", "methodology"}
REQUIRED_VISTE = {"schemaVersion", "datasetId", "period", "coverage", "serieAnnuale", "serieAnnualeRegioni", "serieMensile", "settori", "regioni", "generi", "fasceEta", "modalita", "gestioni", "gruppiTariffari"}


def check(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def main() -> int:
    meta_path = DATA_DIR / "inail-infortuni-serie.meta.json"
    viste_path = DATA_DIR / "inail-infortuni-viste.json"

    check(meta_path.exists(), f"manca {meta_path.name}")
    check(viste_path.exists(), f"manca {viste_path.name}")

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    viste = json.loads(viste_path.read_text(encoding="utf-8"))

    check(set(meta) >= REQUIRED_META, f"meta incompleto: mancano {REQUIRED_META - set(meta)}")
    check(set(viste) >= REQUIRED_VISTE, f"viste incomplete: mancano {REQUIRED_VISTE - set(viste)}")
    check(viste["schemaVersion"] == 2, "schemaVersion viste != 2")
    check(viste["coverage"]["regioni"] == meta["coverage"]["regioni"], "regioni viste/meta diversa")
    check(viste["coverage"]["casi"] == meta["coverage"]["casi"], "casi viste/meta diversa")

    # Coerenza serie annuale col coverage
    totale = sum(p["casi"] for p in viste["serieAnnuale"])
    check(totale == viste["coverage"]["casi"], f"serieAnnuale somma {totale}, coverage {viste['coverage']['casi']}")

    # serieAnnualeRegioni: somma degli anni = totale
    tot_reg = sum(pa["casi"] for r in viste["serieAnnualeRegioni"] for pa in r["anni"])
    check(abs(tot_reg - totale) / max(totale, 1) < 0.01, f"serieAnnualeRegioni somma {tot_reg} vs {totale}")

    print(f"OK: {viste_path.name} ({len(viste['serieAnnuale'])} anni, {viste['coverage']['regioni']} regioni)")
    print(f"OK: {meta_path.name} (estrazione {meta['extractedAt']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
