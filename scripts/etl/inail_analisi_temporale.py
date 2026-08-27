#!/usr/bin/env python3
"""Analisi temporale infortuni da CSV semestrali INAIL (20 regioni, 2020-2024).

Produce src/data/generated/inail-infortuni-temporale.json con le serie per
anno (consolidata) e per mese (congiunturale), aggregate per regione, pronte
per i filtri multiselezione della dashboard.

Serie annuale per regione (da cadenza semestrale, 25 campi):
  totale, lavoro (N), itinere (S), mortali, menomati (danno permanente >=0),
  giorni (giorni indennizzati)

Serie mensile congiunturale 2025-2026: totale/lavoro/itinere dall'aggregato
mensile, mortali dai file raw API. Dato congiunturale, tenuto separato
(nessun confronto improprio con la serie consolidata).

Nota metodologica: mortalita, menomazione e giorni indennizzati sono esposti
solo dalla cadenza semestrale; il dataset mensile INAIL non li fornisce a
livello elementare.

Usa:
  python3 scripts/etl/inail_analisi_temporale.py
"""
from __future__ import annotations

import csv
import glob
import io
import json
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT_DIR = ROOT / "src" / "data" / "generated"

REGIONI = [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "EmiliaRomagna",
    "FriuliVeneziaGiulia", "Lazio", "Liguria", "Lombardia", "Marche",
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
    "TrentinoAltoAdige", "Umbria", "ValledAosta", "Veneto",
]
CODICE = {
    "Piemonte": "01", "ValledAosta": "02", "Lombardia": "03",
    "TrentinoAltoAdige": "04", "Veneto": "05", "FriuliVeneziaGiulia": "06",
    "Liguria": "07", "EmiliaRomagna": "08", "Toscana": "09", "Umbria": "10",
    "Marche": "11", "Lazio": "12", "Abruzzo": "13", "Molise": "14",
    "Campania": "15", "Puglia": "16", "Basilicata": "17", "Calabria": "18",
    "Sicilia": "19", "Sardegna": "20",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def estrai_semestrale(regione: str) -> dict:
    """Legge il CSV semestrale di una regione -> contatori per (anno, modalita)."""
    zip_path = RAW / f"semestrale-{regione}.zip"
    totale: dict = defaultdict(int)
    mortali: dict = defaultdict(int)
    menomati: dict = defaultdict(int)
    giorni: dict = defaultdict(int)
    record = 0
    if not zip_path.exists():
        print(f"  [!] manca {zip_path.name}")
        return {"totale": totale, "mortali": mortali, "menomati": menomati,
                "giorni": giorni, "record": record}

    with zipfile.ZipFile(zip_path) as zf:
        name = zf.namelist()[0]
        with zf.open(name) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"), delimiter=";")
            for r in reader:
                record += 1
                data = r.get("DataAccadimento", "")
                if len(data) != 10:
                    continue
                try:
                    anno = int(data[6:10])
                except ValueError:
                    continue
                mod = r.get("ModalitaAccadimento", "") or "ND"
                if mod not in ("N", "S"):
                    mod = "ND"
                k = (anno, mod)
                totale[k] += 1
                if (r.get("DataMorte") or "").strip():
                    mortali[k] += 1
                try:
                    if int(r.get("GradoMenomazione", "-1")) >= 0:
                        menomati[k] += 1
                except ValueError:
                    pass
                try:
                    giorni[k] += max(0, int(r.get("GiorniIndennizzati", "0")))
                except ValueError:
                    pass
    return {"totale": totale, "mortali": mortali, "menomati": menomati,
            "giorni": giorni, "record": record}


def compatta_semestrale(per_regione: dict) -> list:
    """(regione, anno) -> serie riepilogativa con lavoro/itinere/totale/..."""
    agg: dict = defaultdict(lambda: {"N": 0, "S": 0, "ND": 0,
                                     "mortN": 0, "mortS": 0,
                                     "menN": 0, "menS": 0,
                                     "giN": 0, "giS": 0})
    for code, d in per_regione.items():
        for (anno, mod), c in d["totale"].items():
            a = agg[(code, anno)]
            a[mod] += c
            a[f"mort{mod[0]}"] += d["mortali"].get((anno, mod), 0)
            a[f"men{mod[0]}"] += d["menomati"].get((anno, mod), 0)
            a[f"gi{mod[0]}"] += d["giorni"].get((anno, mod), 0)
    out = []
    for (code, anno), a in sorted(agg.items()):
        out.append({
            "regione": code, "anno": anno,
            "totale": a["N"] + a["S"] + a["ND"],
            "lavoro": a["N"], "itinere": a["S"],
            "mortali": a["mortN"] + a["mortS"],
            "mortaliLavoro": a["mortN"], "mortaliItinere": a["mortS"],
            "menomati": a["menN"] + a["menS"],
            "giorni": a["giN"] + a["giS"],
        })
    return out


def estrai_mensile() -> tuple[list, int]:
    """Serie mensile congiunturale 2025-2026.

    totale/lavoro/itinere dall'aggregato mensile; mortali dai file raw API
    (16 regioni). Le 4 regioni da CSV non hanno mortali a livello elementare.
    """
    serie_path = OUT_DIR / "inail-infortuni-serie.json"
    per_chiave: dict = defaultdict(lambda: {"N": 0, "S": 0, "ND": 0})
    if serie_path.exists():
        data = json.loads(serie_path.read_text(encoding="utf-8"))
        for r in data.get("aggregates", []):
            ch = (str(r["regione"]).zfill(2), r["anno"], r["mese"])
            mod = r.get("modalita", "N") or "N"
            per_chiave[ch][mod if mod in ("N", "S") else "ND"] += r["casi"]

    # mortali mensili dai raw API (16 regioni)
    morti_raw: dict = defaultdict(int)
    for path in sorted(glob.glob(str(RAW / "infortuni-*.json"))):
        stem = Path(path).stem.split("-")
        if len(stem) < 4:
            continue
        try:
            anno = int(stem[-2]); mese = int(stem[-1])
        except ValueError:
            continue
        if anno < 2025:
            continue
        try:
            d = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue
        rec = d.get("record")
        if not isinstance(rec, list):
            continue
        for r in rec:
            if (r.get("DataMorte") or "").strip():
                morti_raw[(str(r.get("Regione", "")).zfill(2), anno, mese)] += 1

    serie = []
    for (reg, anno, mese), d in sorted(per_chiave.items()):
        serie.append({
            "regione": reg, "anno": anno, "mese": mese,
            "totale": d["N"] + d["S"] + d["ND"],
            "lavoro": d["N"], "itinere": d["S"],
            "mortali": morti_raw.get((reg, anno, mese), 0),
        })
    return serie, len(per_chiave)


def main() -> int:
    per_regione: dict = {}
    tot_generale = 0
    for regione in REGIONI:
        d = estrai_semestrale(regione)
        per_regione[CODICE[regione]] = d
        tot_generale += d["record"]
        print(f"[annuale] {regione}: {d['record']} record")

    serie_annuale = compatta_semestrale(per_regione)
    serie_mensile, n_chiavi = estrai_mensile()

    vista = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_temporale",
        "generatedAt": utc_now(),
        "period": {"annoDa": 2020, "annoA": 2024, "mesi": {"da": "2025-01", "a": "2026-06"}},
        "coverage": {"regioni": 20, "casiAnnuali": tot_generale},
        "serieAnnuale": serie_annuale,
        "serieMensile": serie_mensile,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "inail-infortuni-temporale.json"
    out.write_text(json.dumps(vista, ensure_ascii=False), encoding="utf-8")
    print(f"\n[ok] scritto {out} ({out.stat().st_size / 1024:.0f} KB)")
    print("  annuale:", len(serie_annuale), "righe | mensile:", len(serie_mensile), "righe")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())