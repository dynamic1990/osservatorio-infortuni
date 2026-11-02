#!/usr/bin/env python3
"""Controlli di coerenza sullo snapshot della distribuzione settimanale INAIL.

Verifica che:
  - ogni anno abbia 7 giorni con casi coerenti con il totale annuo;
  - la somma dei giorni per modalità coincida con il totale;
  - la copertura dichiarata corrisponda ai giorni-calendario del periodo;
  - la normalizzazione di calendario sia corretta (casi / giorni del tipo).
"""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAP = ROOT / "src" / "data" / "generated" / "inail-infortuni-settimana.json"


def giorni_calendario(da: date, a: date, weekday: int) -> int:
    n = 0
    d = da
    while d <= a:
        if d.weekday() == weekday:
            n += 1
        d += timedelta(days=1)
    return n


def main() -> None:
    data = json.loads(SNAP.read_text(encoding="utf-8"))
    anni = data["anni"]
    assert anni, "nessun anno nello snapshot"

    for anno in anni:
        cop = anno["copertura"]
        da = datetime.fromisoformat(cop["da"]).date()
        a = datetime.fromisoformat(cop["a"]).date()
        tot = anno["totale"]

        assert len(tot["giorni"]) == 7, f"{anno['anno']}: giorni != 7"
        assert len(tot["giorniMortali"]) == 7, f"{anno['anno']}: giorniMortali != 7"

        somma = sum(g["casi"] for g in tot["giorni"])
        assert somma == tot["casi"], f"{anno['anno']}: somma giorni {somma} != casi {tot['casi']}"

        somma_morti = sum(g["casi"] for g in tot["giorniMortali"])
        assert somma_morti == tot["mortali"], (
            f"{anno['anno']}: somma mortali {somma_morti} != {tot['mortali']}")

        # Modalità: la somma delle due deve ricostruire il totale.
        lav = tot["perModalita"]["lavoro"]
        iti = tot["perModalita"]["itinere"]
        assert lav["casi"] + iti["casi"] == tot["casi"], (
            f"{anno['anno']}: lavoro+itinere != totale")
        for i in range(7):
            assert lav["giorni"][i]["casi"] + iti["giorni"][i]["casi"] == tot["giorni"][i]["casi"]

        # Mortali per modalità.
        mlav = tot["mortaliPerModalita"]["lavoro"]
        miti = tot["mortaliPerModalita"]["itinere"]
        assert mlav["casi"] + miti["casi"] == tot["mortali"], (
            f"{anno['anno']}: mortali lavoro+itinere != totale")

        # Giorni di calendario e normalizzazione.
        for i, g in enumerate(tot["giorni"]):
            atteso = giorni_calendario(da, a, i)
            assert g["giorniCalendario"] == atteso, (
                f"{anno['anno']} {g['giorno']}: giorniCalendario {g['giorniCalendario']} != {atteso}")
            media = round(g["casi"] / atteso, 1)
            assert g["mediaPerGiorno"] == media, (
                f"{anno['anno']} {g['giorno']}: media {g['mediaPerGiorno']} != {media}")

        print(f"OK {anno['anno']}: {tot['casi']:,} denunce, {tot['mortali']:,} mortali".replace(",", "."))

    print(f"OK inail-infortuni-settimana.json ({len(anni)} anni)")


if __name__ == "__main__":
    main()
