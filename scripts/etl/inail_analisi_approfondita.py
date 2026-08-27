#!/usr/bin/env python3
"""Analisi approfondita infortuni INAIL (dimensioni 2020-2024).

Legge i 20 CSV semestrali in streaming e produce
src/data/generated/inail-infortuni-approfondimenti.json con le dimensioni
che il dataset elementare espone ma che la dashboard alfa non valorizzava:

  - gestione assicurativa (Industria/Servizi, Conto Stato, Agricoltura)
  - esito amministrativo della pratica (positiva/negativa/altre)
  - tipo di indennizzo (temporanea, nessuno, capitale, rendita diretta,
    rendita superstiti)
  - gravità del danno (nessuna, franchigia 1-5%, capitale 6-15%, rendita 16%+)
  - durata dell'assenza (classi di giorni indennizzati)
  - luogo di nascita (Italia / estero)
  - mezzo di trasporto (con/senza)
  - stagionalità consolidata 2020-2024 (mese di accadimento)

Principi:
  - mai macinare i raw altrove: qui si fa streaming una tantum e si esce
  - output compatto (< 60 KB), aggregato per anno, pronto per i grafici
  - nessuna decodifica inventata: etichette prudenti + nota metodologica
    dove il dizionario INAIL non è pubblico

Usa:
  python3 scripts/etl/inail_analisi_approfondita.py
"""
from __future__ import annotations

import csv
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


def classe_gravita(val: str) -> str:
    try:
        v = int(val)
    except (TypeError, ValueError):
        return "nda"
    if v < 0:
        return "nessuna"
    if v <= 5:
        return "franchigia"
    if v <= 15:
        return "capitale"
    return "rendita"


def classe_durata(val: str) -> str:
    try:
        v = int(val)
    except (TypeError, ValueError):
        return "nda"
    if v <= 0:
        return "nessuna"
    if v <= 7:
        return "breve"
    if v <= 30:
        return "media"
    if v <= 90:
        return "lunga"
    return "lunga90"


def estrai(regione: str) -> dict:
    zip_path = RAW / f"semestrale-{regione}.zip"
    d: dict = defaultdict(lambda: defaultdict(int))
    record = 0
    if not zip_path.exists():
        print(f"  [!] manca {zip_path.name}")
        return {"d": d, "record": record}

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
                    mese = int(data[3:5])
                except ValueError:
                    continue

                d["anno"][anno] += 1
                d["mese"][mese] += 1
                d["gestione"][(anno, r.get("Gestione", "") or "ND")] += 1
                d["esito"][(anno, r.get("DefinizioneAmministrativa", "") or "ND")] += 1
                d["indennizzo"][(anno, r.get("Indennizzo", "") or "ND")] += 1
                d["gravita"][(anno, classe_gravita(r.get("GradoMenomazione", "")))] += 1
                d["durata"][(anno, classe_durata(r.get("GiorniIndennizzati", "")))] += 1
                nascita = r.get("LuogoNascita", "")
                if nascita == "ITAL":
                    nascita = "Italia"
                elif nascita.startswith("Z") or nascita:
                    nascita = "Estero"
                else:
                    nascita = "ND"
                d["nascita"][(anno, nascita)] += 1
                mezzo = r.get("ConSenzaMezzoTrasporto", "") or "ND"
                d["mezzo"][(anno, "Con mezzo" if mezzo == "S" else ("Senza mezzo" if mezzo == "N" else "ND"))] += 1
    return {"d": d, "record": record}


def serie_dim(d: dict, key: str, categorie: list[str]) -> list[dict]:
    """da [(anno, cat)] -> lista {anno, cat1: n, cat2: n, ...} ordinata."""
    anni = sorted(set(a for (a, _) in d[key]))
    out = []
    for anno in anni:
        riga = {"anno": anno}
        for c in categorie:
            riga[c] = d[key].get((anno, c), 0)
        out.append(riga)
    return out


def main() -> int:
    agg: dict = defaultdict(lambda: defaultdict(int))
    tot = 0
    for regione in REGIONI:
        r = estrai(regione)
        code = CODICE[regione]
        for k, mappa in r["d"].items():
            for kk, v in mappa.items():
                agg[k][kk] += v
        tot += r["record"]
        print(f"[ok] {regione}: {r['record']} record")

    vista = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_approfondimenti",
        "generatedAt": utc_now(),
        "period": {"annoDa": 2020, "annoA": 2024},
        "coverage": {"regioni": 20, "recordTotali": tot},
        "dimensioni": {
            "gestione": serie_dim(agg, "gestione", ["I", "S", "A", "ND"]),
            "esito": serie_dim(agg, "esito", ["P", "N", "F", "I", "ND"]),
            "indennizzo": serie_dim(agg, "indennizzo", ["TE", "NE", "CA", "RD", "RS", "ND"]),
            "gravita": serie_dim(agg, "gravita", ["nessuna", "franchigia", "capitale", "rendita", "nda"]),
            "durata": serie_dim(agg, "durata", ["nessuna", "breve", "media", "lunga", "lunga90", "nda"]),
            "nascita": serie_dim(agg, "nascita", ["Italia", "Estero", "ND"]),
            "mezzo": serie_dim(agg, "mezzo", ["Con mezzo", "Senza mezzo", "ND"]),
        },
        "stagionalita": [
            {"mese": m, "casi": agg["mese"].get(m, 0)} for m in range(1, 13)
        ],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "inail-infortuni-approfondimenti.json"
    out.write_text(json.dumps(vista, ensure_ascii=False), encoding="utf-8")
    print(f"\n[ok] scritto {out} ({out.stat().st_size / 1024:.0f} KB)")
    print("  record totali:", tot)
    print("  stagionalita:", {m: c for m, c in vista['stagionalita']})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())