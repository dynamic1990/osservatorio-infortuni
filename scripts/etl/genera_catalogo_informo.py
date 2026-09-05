#!/usr/bin/env python3
"""Genera il catalogo consultabile dei casi Infor.MO per la pagina Casi mortali.

Ingresso: src/data/generated/informo-mortali-dettaglio.json
Uscita:   public/data/informo-catalogo.json

Il catalogo è la versione "consultabile" del dataset di dettaglio: una riga
per caso con i campi chiave del profilo e la dinamica testuale, pensata per
la ricerca libera (full-text sulla dinamica e sui fattori) e per i filtri
per anno/settore/causa/luogo. Il dettaglio completo (tutti i campi e i
fattori) resta in src/data/generated e non è versionato: è rigenerabile
dall'API INAIL con scripts/etl/estrai_informo_dettaglio.py.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DET = ROOT / "src" / "data" / "generated" / "informo-mortali-dettaglio.json"
OUT = ROOT / "public" / "data" / "informo-catalogo.json"

FATTORI_DA_TENERE = ("tipoFattore", "testo", "detMod", "tipoMod",
                     "problemaSicurezza")


def clean(v: str | None) -> str | None:
    if not v:
        return None
    return re.sub(r"\s+", " ", v.strip()) or None


def main() -> int:
    d = json.loads(DET.read_text(encoding="utf-8"))
    casi = d["casi"]
    catalogo = []
    for c in casi:
        dinamica = clean(c.get("dinamica"))
        voce = {
            "anno": c["anno"],
            "codice": c["codiceInfortunio"],
            "data": clean(c.get("dataInfortunio")),
            "settore": clean(c.get("attPrev")),
            "luogo": clean(c.get("luogo")),
            "mansione": clean(c.get("mansione")),
            "sesso": clean(c.get("sesso")),
            "cittadinanza": clean(c.get("cittadinanza")),
            "rapportoLavoro": clean(c.get("rapLav")),
            "anzianita": clean(c.get("anzianita")),
            "classeAddetti": clean(c.get("numAddetti")),
            "sedeLesione": clean(c.get("sedeLesione")),
            "naturaLesione": clean(c.get("naturaLesione")),
            "incidente": clean(c.get("incidente")),
            "agenteMateriale": clean(c.get("agenteMatInc")),
            "dinamica": dinamica,
            "fattori": [
                {k: clean(f.get(k)) for k in FATTORI_DA_TENERE}
                for f in (c.get("fattori") or [])
            ],
        }
        catalogo.append(voce)

    catalogo.sort(key=lambda v: (v["anno"], v["codice"]))
    payload = {
        "meta": {
            "fonte": "INAIL - Infor.MO / InformoWeb (tipoEvento=1, casi mortali)",
            "periodo": "2020-2024",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "nota": "Catalogo casi per ricerca e analisi qualitativa: dinamica "
                    "testuale e fattori per singolo caso. Non è un dataset di "
                    "conteggio: i totali ufficiali sono nei filtri INAIL.",
        },
        "casi": catalogo,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"[informo-catalogo] {len(catalogo)} casi scritti in {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())