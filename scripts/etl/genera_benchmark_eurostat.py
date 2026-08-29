#!/usr/bin/env python3
"""Benchmark internazionale ESAW: infortuni mortali per 100.000 occupati.

Fonte: Eurostat API (dataset hsw_mi01, unit=RT_SINC, severity=FAT, sex=T, age=TOTAL).
Produce src/data/generated/eurostat-benchmark.json per la dashboard.

Uso:
  python3 scripts/etl/genera_benchmark_eurostat.py
"""
from __future__ import annotations

import json
import ssl
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"
OUT = GEN / "eurostat-benchmark.json"

GEOS = ["EU27_2020", "IT", "DE", "FR", "ES", "NL", "PL", "SE", "AT", "BE"]
GEO_LABELS = {
    "EU27_2020": "Media Unione Europea (UE-27)",
    "IT": "Italia", "DE": "Germania", "FR": "Francia", "ES": "Spagna",
    "NL": "Paesi Bassi", "PL": "Polonia", "SE": "Svezia", "AT": "Austria",
    "BE": "Belgio",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fetch_esaw() -> tuple[dict, dict]:
    geo_params = "&".join(f"geo={g}" for g in GEOS)
    url = (
        "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
        f"hsw_mi01?lang=en&unit=RT_SINC&severity=FAT&sex=T&age=TOTAL&{geo_params}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
        return json.loads(r.read().decode("utf-8")), {}


def decode(data: dict, geo_code: str, time_str: str):
    dims = data["dimension"]
    dkeys = list(dims.keys())
    sizes = [len(dims[k]["category"]["index"]) for k in dkeys]
    vals = data.get("value", {})
    idxs = []
    for k in dkeys:
        cats = dims[k]["category"]["index"]
        c = cats.get(geo_code) if k == "geo" else (cats.get(time_str) if k == "time" else 0)
        if c is None:
            return None
        idxs.append(c)
    flat, stride = 0, 1
    for i, s in zip(reversed(idxs), reversed(sizes)):
        flat += i * stride
        stride *= s
    return vals.get(str(flat))


def main() -> int:
    data, _ = fetch_esaw()
    dims = data["dimension"]
    years = [t for t in dims["time"]["category"]["index"] if int(t) >= 2014]

    serie = {}
    for g in GEOS:
        serie[g] = {"codice": g, "nome": GEO_LABELS.get(g, g), "valori": {}}
        for t in years:
            v = decode(data, g, t)
            if v is not None:
                serie[g]["valori"][t] = round(float(v), 2)

    latest = years[-1]
    ranking = []
    for g in GEOS:
        v = serie[g]["valori"].get(latest)
        if v is not None:
            ranking.append({
                "codice": g,
                "nome": GEO_LABELS.get(g, g),
                "tassoIncidenzaStandardizzato": v,
                "isItaly": g == "IT",
                "isEU": g == "EU27_2020",
            })
    ranking.sort(key=lambda x: x["tassoIncidenzaStandardizzato"], reverse=True)

    payload = {
        "schemaVersion": 1,
        "datasetId": "eurostat_benchmark_esaw",
        "generatedAt": utc_now(),
        "fonte": "Eurostat ESAW (European Statistics on Accidents at Work) - Dataset hsw_mi01",
        "unita": "Tasso di incidenza standardizzato per 100.000 occupati (infortuni mortali)",
        "settori": "Agricoltura, Industria, Costruzioni e Servizi (NACE Rev. 2 Sezioni A, C-N)",
        "ultimoAnno": latest,
        "rankingUltimoAnno": ranking,
        "serieStorica": serie,
        "anni": years,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] scritto {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
    for r in ranking:
        print(f"  {r['nome']}: {r['tassoIncidenzaStandardizzato']} morti / 100k")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
