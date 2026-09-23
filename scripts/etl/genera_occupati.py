#!/usr/bin/env python3
"""Rigenera occupati-regione.json e occupati-settore.json da Eurostat.

- occupati-regione.json: occupati 15-64 per regione (NUTS2), migliaia.
  Mappa NUTS2 -> codice regione INAIL (01-20). Regione 04 = ITH1+ITH2.
- occupati-settore.json: occupati 15-64 per sezione ATECO (NACE rev.2, A-U), migliaia.
  I valori per settore non sono esposti a livello aggregato IT da Eurostat LFS;
  la colonna 2025 viene stimata con il tasso di crescita dell'occupazione totale.

Aggiornamento 2026-09-23: finestra 2020-2025 (il 2020 serve per l'indice di
incidenza dell'anno, incluso nel multidimensionale).
"""
import json
import ssl
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"

REGIONI = {
    "Piemonte": "01", "ValledAosta": "02", "Lombardia": "03", "TrentinoAltoAdige": "04",
    "Veneto": "05", "FriuliVeneziaGiulia": "06", "Liguria": "07", "EmiliaRomagna": "08",
    "Toscana": "09", "Umbria": "10", "Marche": "11", "Lazio": "12", "Abruzzo": "13",
    "Molise": "14", "Campania": "15", "Puglia": "16", "Basilicata": "17", "Calabria": "18",
    "Sicilia": "19", "Sardegna": "20",
}

# NUTS2 italiane (ordine dichiarato dal server Eurostat):
# ITC1 Piemonte, ITC2 Valle d'Aosta, ITC3 Liguria, ITC4 Lombardia,
# ITF1 Abruzzo, ITF2 Molise, ITF3 Campania, ITF4 Puglia, ITF5 Basilicata, ITF6 Calabria,
# ITG1 Sicilia, ITG2 Sardegna, ITH1 Bolzano, ITH2 Trento, ITH3 Veneto, ITH4 Friuli, ITH5 Emilia-Romagna,
# ITI1 Toscana, ITI2 Umbria, ITI3 Marche, ITI4 Lazio
NUTS2_CORRETTA = {
    "Piemonte": ["ITC1"], "ValledAosta": ["ITC2"], "Lombardia": ["ITC4"], "Liguria": ["ITC3"],
    "TrentinoAltoAdige": ["ITH1", "ITH2"], "Veneto": ["ITH3"],
    "FriuliVeneziaGiulia": ["ITH4"], "EmiliaRomagna": ["ITH5"],
    "Toscana": ["ITI1"], "Umbria": ["ITI2"], "Marche": ["ITI3"], "Lazio": ["ITI4"],
    "Abruzzo": ["ITF1"], "Molise": ["ITF2"], "Campania": ["ITF3"], "Puglia": ["ITF4"],
    "Basilicata": ["ITF5"], "Calabria": ["ITF6"], "Sicilia": ["ITG1"], "Sardegna": ["ITG2"],
}

ANNI = ["2020", "2021", "2022", "2023", "2024", "2025"]


def fetch_region_data():
    """Scarica occupati 15-64 per tutte le NUTS2 italiane in un'unica richiesta."""
    geo_list = sorted({g for gs in NUTS2_CORRETTA.values() for g in gs})
    geo_q = "".join(f"&geo={g}" for g in geo_list)
    url = (f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/lfst_r_lfe2emp"
           f"?lang=en{geo_q}&sex=T&age=Y15-64&unit=THS_PER&freq=A")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=90, context=ctx) as r:
        d = json.loads(r.read().decode("utf-8"))

    geo_idx = d["dimension"]["geo"]["category"]["index"]
    time_idx = d["dimension"]["geo"]["category"]["time"] if False else d["dimension"]["time"]["category"]["index"]
    n_time = len(time_idx)
    vals = d["value"]
    res = {}
    for fk, v in vals.items():
        f = int(fk)
        gi, ti = f // n_time, f % n_time
        g = list(geo_idx.keys())[gi]
        t = list(time_idx.keys())[ti]
        res.setdefault(g, {})[t] = v
    return res


def main():
    data = fetch_region_data()

    regioni = {}
    for nome, geos in NUTS2_CORRETTA.items():
        cod = REGIONI[nome]
        vals = {}
        for a in ANNI:
            v = sum(data.get(g, {}).get(a, 0) for g in geos)
            vals[a] = round(v, 1) if v else None
        regioni[cod] = vals

    payload_r = {
        "schemaVersion": 1,
        "datasetId": "occupati_regione",
        "fonte": "Eurostat lfst_r_lfe2emp (occupati 15-64, migliaia) - base ISTAT RCFL",
        "nota": "Denominatore per l indice di incidenza (infortuni / occupati * 1000). Valori in migliaia di persone. Regione 04 include ITH1 (Bolzano) e ITH2 (Trento).",
        "unita": "migliaia",
        "regioni": regioni,
    }
    out = GEN / "occupati-regione.json"
    out.write_text(json.dumps(payload_r, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[ok] {out}")

    # --- Settori ATECO: proiezione 2025 ---
    cur = json.loads((GEN / "occupati-settore.json").read_text(encoding="utf-8"))
    settori = cur["settori"]
    f_growth = 23.2512 / 23.1500  # 2024 -> 2025 occupati totali Italia
    for k, s in settori.items():
        v2024 = s.get("2024")
        if v2024:
            s["2025"] = round(v2024 * f_growth, 1)
    payload_s = {
        "schemaVersion": 1,
        "datasetId": "occupati_settore",
        "fonte": "Eurostat (occupati 15-64 per sezione NACE A-U), proiezione 2025 su crescita occupati totali",
        "unita": "migliaia",
        "settori": settori,
    }
    out = GEN / "occupati-settore.json"
    out.write_text(json.dumps(payload_s, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[ok] {out}")


if __name__ == "__main__":
    main()