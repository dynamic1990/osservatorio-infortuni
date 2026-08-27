#!/usr/bin/env python3
"""Indice di incidenza infortuni: infortuni / occupati x 1.000.

Unisce i numeratori INAIL (serie annuale per regione, consolidato 2020-2024)
ai denominatori di occupazione (ISTAT/Eurostat lfst_r_lfe2emp, occupati 15-64).

Formula: indice = infortuni_anno / (occupati_anno_migliaia * 1000) * 1000
semplificata: infortuni / occupati_migliaia  (perche' dividere e moltiplicare
per 1000 si elidono).

Nota metodologica: l'indice usa gli OCCUPATI totali (non solo gli assicurati
INAIL) come denominatore. E' la convenzione piu' diffusa per i tassi di
incidenza pubblici; il confronto tra settori richiede denominatori per
settore (disponibili da Eurostat con nace_r2, fase successiva).

Usa:
  python3 scripts/etl/inail_indice_incidenza.py
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def main() -> int:
    temporale = json.loads((GEN / "inail-infortuni-temporale.json").read_text(encoding="utf-8"))
    occupati = json.loads((GEN / "occupati-regione.json").read_text(encoding="utf-8"))

    # serie annuale per regione
    per_reg_anno: dict = {}
    for r in temporale["serieAnnuale"]:
        per_reg_anno[(r["regione"], str(r["anno"]))] = r

    righe = []
    for (reg, anno), num in sorted(per_reg_anno.items()):
        den_migliaia = occupati["regioni"].get(reg, {}).get(anno)
        if den_migliaia is None:
            continue
        totale = num["totale"]
        mortali = num["mortali"]
        indice = round(totale / den_migliaia, 2)  # infortuni per 1.000 occupati
        indice_mortali = round(mortali / den_migliaia, 2) if mortali else 0
        righe.append({
            "regione": reg,
            "anno": int(anno),
            "casi": totale,
            "mortali": mortali,
            "occupati": int(den_migliaia * 1000),
            "indice": indice,               # per 1.000 occupati
            "indiceMortali": indice_mortali,
        })

    # totale nazionale
    naz = {}
    for r in righe:
        naz.setdefault(r["anno"], {"casi": 0, "mortali": 0, "occupati": 0})
        naz[r["anno"]]["casi"] += r["casi"]
        naz[r["anno"]]["mortali"] += r["mortali"]
        naz[r["anno"]]["occupati"] += r["occupati"]

    naz_serie = []
    for anno in sorted(naz):
        d = naz[anno]
        naz_serie.append({
            "anno": anno,
            "casi": d["casi"],
            "mortali": d["mortali"],
            "occupati": d["occupati"],
            "indice": round(d["casi"] / (d["occupati"] / 1000), 2),
            "indiceMortali": round(d["mortali"] / (d["occupati"] / 1000), 3),
        })

    vista = {
        "schemaVersion": 1,
        "datasetId": "inail_indice_incidenza",
        "generatedAt": utc_now(),
        "period": {"annoDa": 2020, "annoA": 2024},
        "formula": "indice = casi / occupati * 1000 (occupati 15-64, ISTAT/Eurostat lfst_r_lfe2emp)",
        "nota": "Gli infortuni INAIL includono denunce; il denominatore sono gli occupati (non solo assicurati INAIL).",
        "nazionale": naz_serie,
        "perRegione": righe,
    }

    out = GEN / "inail-indice-incidenza.json"
    out.write_text(json.dumps(vista, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] scritto {out} ({out.stat().st_size / 1024:.0f} KB)")
    print("  nazionale:", naz_serie)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())