#!/usr/bin/env python3
"""Scarica i casi Infor.MO (INAIL) e genera dati pronti per la dashboard.

Uso: python3 scripts/etl/estrai_informo.py [--anni 2024] [--tipo-evento 1]
       [--include-gravi]

L'API usa pagine numerate zero-based (nonostante il parametro sia documentato
come numeroPagina). I conteggi degli aggregati sono quelli restituiti da INAIL
in ``filtri.entry`` e restano sempre distinti per anno.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "src" / "data" / "generated"
URL = "https://www.inail.it/nsol-informo/filtra.do"
YEARS = list(range(2020, 2025))
PAGE_SIZE = 10


def request_page(year: int, event_type: str, page: int, retries: int = 3) -> dict:
    payload = {"listaFiltri": [], "dates": [str(year)], "tipoEvento": event_type,
               "numeroPagina": page, "desc": "", "pericoli": []}
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Content-Type": "application/json", "Accept": "application/json",
        "User-Agent": "Osservatorio-Infortuni-ETL/1.0",
    })
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.load(response).get("result")
                if not isinstance(result, dict):
                    raise ValueError("risposta senza result")
                return result
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"API fallita anno {year}, pagina {page}: {exc}") from exc
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def clean(value):
    if value is None or value == "":
        return None
    return value


def case_record(case: dict, year: int) -> dict:
    fattori = []
    for infortunato in case.get("listaInfortunati") or []:
        for f in infortunato.get("fattoreRischio") or []:
            desc = f.get("descFattoreRischio")
            if desc:
                fattori.append(desc)
    # listaDescFattori è mantenuta come fallback quando non esiste la struttura
    fattori.extend(x for x in (case.get("listaDescFattori") or []) if x)
    keys = ("codiceInfortunio", "codiceInfortunato", "dataInfortunio", "incidente",
            "settore", "sesso", "cittadinanza", "mansione", "luogo", "sedeLesione",
            "naturaLesione", "numeroGiorniAssenza", "tipoAtt", "agente",
            "variazEnergia", "agenteMatInc", "rapLav", "anzianita", "numAddetti", "attPrev")
    result = {"anno": year}
    result.update({k: clean(case.get(k)) for k in keys})
    result["descFattoreRischio"] = fattori
    return result


def entries(result: dict) -> dict:
    """Converte filtri.entry in {nome_dimensione: [{voce,count,...}]}"""
    out = {}
    for entry in (result.get("filtri") or {}).get("entry") or []:
        key = entry.get("key") or "Sconosciuto"
        value = entry.get("value") or {}
        values = value.get("listaFiltri") or []
        out[key] = [{k: v for k, v in {
            "voce": x.get("voce"), "count": x.get("count", 0),
            "codiceAgg": x.get("codiceAgg"), "codiciWhere": x.get("codiciWhere"),
        }.items() if v is not None} for x in values]
    return out


def download_year(year: int, event_type: str, delay: float) -> dict:
    # L'endpoint ignora pagina 0; la prima pagina effettiva è 1.
    page = 1
    all_cases = []
    first = None
    total = None
    while True:
        if page > 1:
            time.sleep(delay)
        result = request_page(year, event_type, page)
        if first is None:
            first = result
            total = int(result.get("numeroRecord") or 0)
        current = result.get("listaInfortuni") or []
        all_cases.extend(case_record(c, year) for c in current)
        if len(all_cases) >= total or not current:
            break
        page += 1
    if total != len(all_cases):
        print(f"AVVISO {year}: API dichiara {total}, scaricati {len(all_cases)}", file=sys.stderr)
    return {"anno": year, "numeroRecord": total, "record": all_cases,
            "conteggi": entries(first or {})}


def output(years: list[int], event_type: str, delay: float) -> dict:
    years_data = []
    for year in years:
        print(f"Infor.MO tipoEvento={event_type}, anno={year}", file=sys.stderr)
        years_data.append(download_year(year, event_type, delay))
    label = "mortali" if event_type == "1" else "gravi"
    return {"meta": {"fonte": "INAIL - Infor.MO / InformoWeb",
                      "endpoint": URL, "tipoEvento": event_type,
                      "periodo": f"{min(years)}-{max(years)}",
                      "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                      "nota": "Conteggi da filtri.entry; ogni aggregato mantiene la dimensione anno."},
            "anni": years_data, "tipo": label}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--anni", nargs="+", type=int, default=YEARS)
    parser.add_argument("--tipo-evento", choices=("1", "2"), default="1")
    parser.add_argument("--include-gravi", action="store_true", help="genera anche informo-gravi.json")
    parser.add_argument("--delay", type=float, default=1.0, help="secondi tra le richieste (default: 1)")
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = output(args.anni, args.tipo_evento, args.delay)
    name = "informo-mortali.json" if args.tipo_evento == "1" else "informo-gravi.json"
    (OUT_DIR / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.include_gravi and args.tipo_evento == "1":
        gravi = output(args.anni, "2", args.delay)
        (OUT_DIR / "informo-gravi.json").write_text(json.dumps(gravi, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"file": name, "anni": {str(x["anno"]): x["numeroRecord"] for x in data["anni"]},
                      "totale": sum(x["numeroRecord"] for x in data["anni"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
