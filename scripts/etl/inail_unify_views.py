#!/usr/bin/env python3
"""Unifica mensile (16 regioni via API) + mensile CSV (4 regioni) + semestrale
storico (2020-2024, tutte le regioni) in un'unica vista per il sito.

Output: src/data/generated/inail-infortuni-viste.json (viste, piccolo) e
meta aggiornato. Le serie coprono 2020-2026 con tutte le 20 regioni.

Usa:
  python3 scripts/etl/inail_unify_views.py
"""

from __future__ import annotations

import csv
import io
import json
import sys
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data" / "generated"

REGIONI_CSV_MENSILE = {
    "EmiliaRomagna": "08", "ValledAosta": "02",
    "TrentinoAltoAdige": "04", "FriuliVeneziaGiulia": "06",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def leggi_mensile_api() -> list[dict]:
    """16 regioni via API (già aggregate)."""
    path = OUT / "inail-infortuni-serie.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["aggregates"]


def leggi_mensile_csv(regione, code) -> list[dict]:
    """CSV mensile per le regioni con nome composto. Dedup per caso, tiene la
    rilevazione più recente (30/06/2026)."""
    zip_path = RAW / f"mensile-{regione}.zip"
    if not zip_path.exists():
        return []
    with zipfile.ZipFile(zip_path) as zf:
        name = zf.namelist()[0]
        with zf.open(name) as f:
            text = io.TextIOWrapper(f, encoding="utf-8-sig")
            reader = csv.DictReader(text, delimiter=";")
            records = list(reader)
    best: dict[str, dict] = {}
    for r in records:
        if not r.get("DataAccadimento") or len(r["DataAccadimento"]) != 10:
            continue
        if r.get("DataRilevazione") < "30/06/2026":
            continue
        best[r.get("IdentificativoCaso", "")] = r
    agg: dict[tuple, int] = Counter()
    for r in best.values():
        try:
            eta = int(r.get("Eta", "-1"))
        except ValueError:
            eta = -1
        data_acc = r["DataAccadimento"]
        anno = int(data_acc[6:10])
        mese = int(data_acc[3:5])
        if anno < 2025:
            continue
        k = (anno, mese, code, r.get("LuogoAccadimento", ""), r.get("SettoreAttivitaEconomica", ""),
             r.get("GrandeGruppoTariffario", ""), r.get("Gestione", ""), r.get("GestioneTariffaria", ""),
             r.get("Genere", ""), eta, r.get("ModalitaAccadimento", ""), r.get("ConSenzaMezzoTrasporto", ""))
        agg[k] += 1
    rows = [
        {"key": f"{a}-{m:02d}|{reg}|{prov}", "anno": a, "mese": m, "regione": reg, "provincia": prov,
         "settoreAteco": ateco, "grandeGruppo": gg, "gestione": gest, "gestioneTariffaria": gt,
         "genere": g, "eta": e, "modalita": mod, "mezzoTrasporto": mz, "esitoMortale": True if False else False,
         "casi": c}
        for (a, m, reg, prov, ateco, gg, gest, gt, g, e, mod, mz), c in agg.items()
    ]
    return rows


def fascia(eta: int) -> str:
    if eta < 0:
        return "ND"
    if eta < 15:
        return "0-14"
    if eta < 25:
        return "15-24"
    if eta < 35:
        return "25-34"
    if eta < 45:
        return "35-44"
    if eta < 55:
        return "45-54"
    if eta < 65:
        return "55-64"
    return "65+"


def main() -> int:
    # 1) Carica lo storico semestrale aggregato (2020-2024, 20 regioni)
    storico_path = OUT / "inail-infortuni-semestrale-storico.json"
    storico = json.loads(storico_path.read_text(encoding="utf-8"))
    semi = storico["aggregates"]

    # 2) Mensile: API (16 regioni) + CSV (4 regioni)
    mens = leggi_mensile_api()
    for reg, code in REGIONI_CSV_MENSILE.items():
        mens.extend(leggi_mensile_csv(reg, code))

    # 3) Viste
    serie_annuale: Counter[int] = Counter()
    serie_annuale_reg: dict[str, Counter[int]] = {}
    serie_mensile: Counter[str] = Counter()
    settori = Counter()
    regioni = Counter()
    generi = Counter()
    fasce = Counter()
    modalita = Counter()
    gestioni = Counter()
    gruppi = Counter()
    mortali = Counter()

    # semestrale (2020-2024)
    for r in semi:
        anno = r["anno"]
        serie_annuale[anno] += r["casi"]
        serie_annuale_reg.setdefault(r["regione"], Counter())[anno] += r["casi"]
        settori[r["settoreAteco"] or "ND"] += r["casi"]
        regioni[r["regione"]] += r["casi"]
        generi[r["genere"] or "ND"] += r["casi"]
        fasce[fascia(r["eta"])] += r["casi"]
        modalita[r["modalita"] or "ND"] += r["casi"]
        if r.get("definizioneAmministrativa") == "P":
            mortali[(anno, "P")] += r["casi"]
        gruppi[r["grandeGruppo"] or "ND"] += r["casi"]

    # mensile (2025-2026): solo serie mensile congiunturale
    # (la serie annuale consolidata 2020-2024 viene dal semestrale)
    for r in mens:
        anno, mese = r["anno"], r["mese"]
        serie_mensile[f"{anno}-{mese:02d}"] += r["casi"]

    def top(c, n=15):
        return [{"key": k, "casi": v} for k, v in c.most_common(n)]

    viste_mortali = storico["coverage"]["mortali"]
    viste = {
        "schemaVersion": 2,
        "datasetId": "inail_infortuni_viste",
        "period": {"annoDa": 2020, "annoA": 2024, "mesi": None},
        "coverage": {
            "regioni": len(regioni),
            "record": storico["coverage"]["record"],
            "casi": sum(v for v in serie_annuale.values()),
            "mortali": viste_mortali,
            "casiPerAnno": {str(a): serie_annuale[a] for a in sorted(serie_annuale)},
            "notaPeriodo": "Serie annuale consolidata 2020-2024 (cadenza semestrale, tutte le 20 regioni). I dati mensili 2025-2026 sono congiunturali su finestre di rilevazione (gen-giu).",
        },
        "serieAnnuale": [{"anno": a, "casi": serie_annuale[a]} for a in sorted(serie_annuale)],
        "serieAnnualeRegioni": [
            {"regione": reg, "anni": [{"anno": a, "casi": serie_annuale_reg[reg][a]} for a in sorted(serie_annuale_reg[reg])]}
            for reg in sorted(serie_annuale_reg)
        ],
        "serieMensile": [{"key": k, "casi": serie_mensile[k]} for k in sorted(serie_mensile)],
        "settori": top(settori),
        "regioni": [{"key": k, "casi": v} for k, v in sorted(regioni.items(), key=lambda kv: -kv[1])],
        "generi": [{"key": k, "casi": v} for k, v in generi.items()],
        "fasceEta": [{"key": k, "casi": v} for k, v in sorted(fasce.items(), key=lambda kv: kv[0])],
        "modalita": [{"key": k, "casi": v} for k, v in modalita.items()],
        "gestioni": [{"key": k, "casi": v} for k, v in gestioni.items()],
        "gruppiTariffari": [{"key": k, "casi": v} for k, v in gruppi.items()],
    }
    out = OUT / "inail-infortuni-viste.json"
    out.write_text(json.dumps(viste, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Viste salvate: {out} ({out.stat().st_size} bytes)")
    print("Casi per anno:", dict(sorted(serie_annuale.items())))
    print("Regioni:", len(regioni))
    return 0


if __name__ == "__main__":
    sys.exit(main())
