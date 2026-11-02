#!/usr/bin/env python3
"""Distribuzione per giorno della settimana degli infortuni denunciati (INAIL).

Fonte: dataset semestrali INAIL per regione, livello record (open data ufficiale,
https://dati.inail.it). Nessun campionamento: sono le denunce effettive.

Perche' non Infor.MO: l'archivio Infor.MO copre solo i casi analizzati (mortali e
gravi), non il totale delle denunce. Per la distribuzione settimanale serve il
denominatore completo, che sta solo negli open data.

Ingresso   data/raw/semestrale-<Regione>.zip  (20 regioni, 2021-2025)
Uscita     src/data/generated/inail-infortuni-settimana.json

Nota metodologica importante: il conteggio grezzo per giorno della settimana
riflette il calendario lavorativo, non il rischio. Ci sono ~4,3 lunedi' per ogni
domenica. Per questo lo script produce anche:
  - giorniCalendario : quante volte quel giorno cade nel periodo
  - mediaPerGiorno   : casi medi in un singolo giorno di quel tipo di settimana
  - indiceVsFeriale  : casi del giorno / media dei giorni Lun-Ven

La "media per giorno" non e' un tasso di incidenza su occupati (il denominatore
occupati per singolo giorno non esiste): e' una normalizzazione di calendario,
e va etichettata come tale.
"""
from __future__ import annotations

import csv
import io
import json
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data" / "generated" / "inail-infortuni-settimana.json"

GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
ANNI_MIN, ANNI_MAX = 2021, 2025


def leggi_record():
    """Itera i record di tutti i dataset semestrali regionali."""
    for zpath in sorted(RAW.glob("semestrale-*.zip")):
        with zipfile.ZipFile(zpath) as zf:
            nome = zf.namelist()[0]
            with zf.open(nome) as fh:
                reader = csv.DictReader(
                    io.TextIOWrapper(fh, encoding="utf-8-sig"), delimiter=";")
                for row in reader:
                    yield row


def giorni_calendario(da: date, a: date) -> Counter:
    out = Counter()
    d = da
    while d <= a:
        out[d.weekday()] += 1
        d += timedelta(days=1)
    return out


def serie_giorni(conteggi: list[int], cal: list[int]) -> list[dict]:
    feriale = sum(conteggi[:5]) / 5 if sum(conteggi[:5]) else 0
    out = []
    for i, nome in enumerate(GIORNI):
        out.append({
            "giorno": nome,
            "casi": conteggi[i],
            "giorniCalendario": cal[i],
            "mediaPerGiorno": round(conteggi[i] / cal[i], 1) if cal[i] else 0.0,
            "indiceVsFeriale": round(conteggi[i] / feriale, 3) if feriale else None,
        })
    return out


def main() -> None:
    # [anno][modalita][giorno] -> casi ; [anno][modalita] -> mortali
    tot: dict[int, dict[str, list[int]]] = defaultdict(lambda: {"lavoro": [0] * 7, "itinere": [0] * 7})
    mort: dict[int, dict[str, list[int]]] = defaultdict(lambda: {"lavoro": [0] * 7, "itinere": [0] * 7})
    giorni_osservati: dict[int, set] = defaultdict(set)
    scartati = 0
    letti = 0

    for row in leggi_record():
        data_str = (row.get("DataAccadimento") or "").strip()
        if len(data_str) != 10:
            scartati += 1
            continue
        try:
            dt = datetime.strptime(data_str, "%d/%m/%Y").date()
        except ValueError:
            scartati += 1
            continue
        anno = dt.year
        if not (ANNI_MIN <= anno <= ANNI_MAX):
            continue

        modalita = "itinere" if (row.get("ModalitaAccadimento") or "").strip() == "S" else "lavoro"
        g = dt.weekday()
        letti += 1
        tot[anno][modalita][g] += 1
        giorni_osservati[anno].add(dt)
        if (row.get("DataMorte") or "").strip():
            mort[anno][modalita][g] += 1

    anni = []
    for anno in sorted(tot):
        date_anno = giorni_osservati[anno]
        da, a = min(date_anno), max(date_anno)
        cal = giorni_calendario(da, a)
        cal_list = [cal[i] for i in range(7)]

        somma = [tot[anno]["lavoro"][i] + tot[anno]["itinere"][i] for i in range(7)]
        morti = [mort[anno]["lavoro"][i] + mort[anno]["itinere"][i] for i in range(7)]
        lavoro = list(tot[anno]["lavoro"])
        itinere = list(tot[anno]["itinere"])
        morti_lavoro = list(mort[anno]["lavoro"])
        morti_itinere = list(mort[anno]["itinere"])

        anni.append({
            "anno": anno,
            "copertura": {"da": da.isoformat(), "a": a.isoformat(),
                          "giorni": sum(cal_list),
                          "completo": da.month == 1 and a.month == 12},
            "totale": {
                "casi": sum(somma),
                "mortali": sum(morti),
                "giorni": serie_giorni(somma, cal_list),
                "giorniMortali": serie_giorni(morti, cal_list),
                "perModalita": {
                    "lavoro": {"casi": sum(lavoro),
                               "giorni": serie_giorni(lavoro, cal_list)},
                    "itinere": {"casi": sum(itinere),
                                "giorni": serie_giorni(itinere, cal_list)},
                },
                "mortaliPerModalita": {
                    "lavoro": {"casi": sum(morti_lavoro),
                               "giorni": serie_giorni(morti_lavoro, cal_list)},
                    "itinere": {"casi": sum(morti_itinere),
                                "giorni": serie_giorni(morti_itinere, cal_list)},
                },
            },
        })

    out = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fonte": "INAIL open data - DatiConCadenzaSemestraleInfortuni (livello record, 20 regioni)",
        "periodo": {"da": ANNI_MIN, "a": ANNI_MAX},
        "metodo": {
            "denominatore": "giorni-calendario per giorno della settimana nel periodo osservato",
            "nonE": "tasso di incidenza su occupati: il denominatore occupati per singolo giorno non e' disponibile",
            "annoParziale": "se un anno non copre 12 mesi, copertura.completo e' false e il confronto tra anni va evitato",
        },
        "recordUsati": letti,
        "recordScartati": scartati,
        "anni": anni,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    for a in anni:
        print(f"{a['anno']}: casi {a['totale']['casi']:>7}  mortali {a['totale']['mortali']:>5}  "
              f"copertura {a['copertura']['da']}..{a['copertura']['a']}")
    print(f"scritto {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
