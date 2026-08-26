#!/usr/bin/env python3
"""Scarica uno snapshot degli infortuni INAIL per regione/anno/mese.

API: https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni
Parametri obbligatori: Regione (nome), AnnoAccadimento, MeseAccadimento (2 cifre).

Nota volumi: un solo mese di una regione pesa centinaia di KB di JSON
(record singoli). Scaricare tutto lo storico richiede attenzione
(caching, rate limiting, storage).

Esempio:
    python3 inail_infortuni_snapshot.py --regione Lazio --anno 2025 --mese 01
"""
import argparse
import json
import sys
import urllib.request
import urllib.parse
from datetime import datetime, timezone

BASE_URL = "https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni"


def fetch_snapshot(regione: str, anno: int, mese: int) -> dict:
    params = urllib.parse.urlencode({
        "Regione": regione,
        "AnnoAccadimento": anno,
        "MeseAccadimento": f"{mese:02d}",
    })
    url = f"{BASE_URL}?{params}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--regione", required=True, help="Nome regione, es. Lazio")
    parser.add_argument("--anno", type=int, required=True)
    parser.add_argument("--mese", type=int, required=True, choices=range(1, 13))
    parser.add_argument("--output", default=None, help="File JSON di output")
    args = parser.parse_args()

    data = fetch_snapshot(args.regione, args.anno, args.mese)

    key = "DatiConCadenzaMensileInfortuni"
    records = data.get(key, [])
    if not records:
        print(f"Nessun record per {args.regione} {args.anno}-{args.mese:02d}", file=sys.stderr)
        return 1

    snapshot = {
        "fonte": "INAIL Open Data",
        "url_api": BASE_URL,
        "data_estrazione": datetime.now(timezone.utc).isoformat(),
        "regione": args.regione,
        "anno_accadimento": args.anno,
        "mese_accadimento": args.mese,
        "n_record": len(records),
        "record": records,
    }

    output = args.output or f"infortuni-{args.regione.lower()}-{args.anno}-{args.mese:02d}.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False)

    print(f"Salvati {len(records)} record in {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
