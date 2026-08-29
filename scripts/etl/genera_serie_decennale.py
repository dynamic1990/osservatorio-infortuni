#!/usr/bin/env python3
"""Serie storica decennale infortuni sul lavoro (2014-2024).

Fonte numeratori:
- 2014-2019: serie storica ufficiale INAIL (denunce e casi mortali),
  estratta da pubblicazioni INAIL / Fondazione Feltrinelli (Tabella dati 1951-2019).
- 2020-2024: microdati INAIL Open Data gia' aggregati (inail-multidimensionale.json).

Fonte denominatori:
- Occupati 15-64 Italia: Eurostat lfst_r_lfe2emp (THS_PER), scaricati al momento.

Output: src/data/generated/inail-serie-decennale.json
"""
from __future__ import annotations

import json
import ssl
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"
OUT = GEN / "inail-serie-decennale.json"

# Denunce totali e casi mortali ufficiali INAIL 2014-2019
STOCK_2014_2019 = {
    2014: {"totale": 663039, "mortali": 1185},
    2015: {"totale": 636675, "mortali": 1303},
    2016: {"totale": 641113, "mortali": 1154},
    2017: {"totale": 646879, "mortali": 1148},
    2018: {"totale": 645049, "mortali": 1218},
    2019: {"totale": 641638, "mortali": 1089},
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fetch_occupati_it() -> dict[int, float]:
    """Occupati 15-64 Italia (migliaia) da Eurostat lfst_r_lfe2emp."""
    url = (
        "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
        "lfst_r_lfe2emp?lang=en&geo=IT&sex=T&age=Y15-64&unit=THS_PER&freq=A"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
        data = json.loads(r.read().decode("utf-8"))
    dims = data["dimension"]
    dkeys = list(dims.keys())
    sizes = [len(dims[k]["category"]["index"]) for k in dkeys]
    vals = data.get("value", {})

    def get_val(time_str: str):
        idx = []
        for k in dkeys:
            cats = dims[k]["category"]["index"]
            c = cats.get(time_str) if k == "time" else 0
            if c is None:
                return None
            idx.append(c)
        flat, stride = 0, 1
        for i, s in zip(reversed(idx), reversed(sizes)):
            flat += i * stride
            stride *= s
        return vals.get(str(flat))

    out = {}
    for t in dims["time"]["category"]["index"]:
        y = int(t)
        if 2014 <= y <= 2024:
            v = get_val(t)
            out[y] = round(float(v) * 1000) if v is not None else 0
    return out


def main() -> int:
    occupati = fetch_occupati_it()
    multi = json.loads((GEN / "inail-multidimensionale.json").read_text(encoding="utf-8"))

    serie = []
    for anno in range(2014, 2025):
        occ = occupati.get(anno, 0)
        if anno <= 2019:
            s = STOCK_2014_2019[anno]
            totale, mortali = s["totale"], s["mortali"]
            lavoro = itinere = mortaliLavoro = mortaliItinere = None
            nota = "Serie storica ufficiale INAIL (denunce)"
        else:
            row = multi["perAnno"][str(anno)]
            totale, mortali = row["totale"], row["mortali"]
            lavoro, itinere = row["lavoro"], row["itinere"]
            mortaliLavoro = mortaliItinere = None
            nota = "Microdati INAIL Open Data consolidati"
        serie.append({
            "anno": anno,
            "totale": totale,
            "lavoro": lavoro,
            "itinere": itinere,
            "mortali": mortali,
            "mortaliLavoro": mortaliLavoro,
            "mortaliItinere": mortaliItinere,
            "occupati": occ,
            "indice": round(totale / (occ / 1000), 2) if occ else None,
            "indiceMortali": round(mortali / (occ / 1000), 3) if occ else None,
            "nota": nota,
        })

    payload = {
        "schemaVersion": 1,
        "datasetId": "inail_serie_decennale",
        "generatedAt": utc_now(),
        "periodo": "2014-2024",
        "fonte": "INAIL (denunce) + Eurostat (occupati 15-64, lfst_r_lfe2emp)",
        "serie": serie,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] scritto {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
    for s in serie:
        print(f"  {s['anno']}: tot={s['totale']:,} morti={s['mortali']} occ={s['occupati']:,} ind={s['indice']}‰")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
