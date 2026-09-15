#!/usr/bin/env python3
"""Genera l'incrocio causa x settore economico per la pagina Analisi delle cause.

Ingresso: src/data/generated/informo-mortali-dettaglio.json
Uscita:   public/data/informo-cause-settori.json

Per ogni caso mortale con settore economico noto (attPrev) e fattori causali
classificati, associa il problema di sicurezza prevalente al settore. Il
risultato è una matrice settore x causa precalcolata, leggera (poche decine
di KB), che la pagina usa per mostrare, per ciascun comparto, le cause più
frequenti e la loro incidenza.

Limiti dichiarati (coerenti con la pagina):
- Copre solo i casi con settore e fattori noti (circa 1.000 su 1.212).
- I problemi di sicurezza sono la classificazione degli analisti INAIL.
- Non è un dataset di conteggio ufficiale: i totali restano nei filtri INAIL.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DET = ROOT / "src" / "data" / "generated" / "informo-mortali-dettaglio.json"
OUT = ROOT / "public" / "data" / "informo-cause-settori.json"

# Numero massimo di cause per settore nella matrice
TOP_CAUSE = 6
# Soglia minima di casi per includere un settore (evita rumore su n troppo piccoli)
MIN_CASI_SETTORE = 8


def clean(v: str | None) -> str | None:
    if not v:
        return None
    return re.sub(r"\s+", " ", v.strip()) or None


def main() -> int:
    d = json.loads(DET.read_text(encoding="utf-8"))
    casi = d["casi"]

    # matrice: settore -> { causa -> count }
    matrice: dict[str, Counter] = defaultdict(Counter)
    casi_settore: Counter = Counter()
    casi_con_incrocio = 0

    for c in casi:
        settore = clean(c.get("attPrev"))
        if not settore:
            continue
        casi_settore[settore] += 1
        # Cause prevalenti del caso: primo problema di sicurezza non vuoto
        # (rappresenta la dinamica principale della scheda).
        causa = None
        for f in (c.get("fattori") or []):
            ps = clean(f.get("problemaSicurezza"))
            if ps:
                causa = ps
                break
        if causa is None:
            continue
        matrice[settore][causa] += 1
        casi_con_incrocio += 1

    settori_out = []
    for settore, cnt in sorted(casi_settore.items(), key=lambda kv: -kv[1]):
        if cnt < MIN_CASI_SETTORE:
            continue
        cause = matrice[settore]
        totale_cause = sum(cause.values())
        voce_settore = {
            "settore": settore,
            "casi": cnt,
            "casiConCausa": totale_cause,
            "cause": [
                {
                    "causa": nome,
                    "casi": n,
                    "quota": round(n / cnt * 100, 1),
                }
                for nome, n in cause.most_common(TOP_CAUSE)
            ],
        }
        settori_out.append(voce_settore)

    payload = {
        "meta": {
            "fonte": "INAIL - Infor.MO / InformoWeb (tipoEvento=1, casi mortali)",
            "periodo": "2020-2024",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "nota": "Incrocio causa x settore precalcolato dal dettaglio casi. "
                    "Copre i casi con settore economico e problema di sicurezza "
                    "classificato; non è un dataset di conteggio ufficiale.",
            "criteri": {
                "topCausePerSettore": TOP_CAUSE,
                "minCasiSettore": MIN_CASI_SETTORE,
                "casiTotali": len(casi),
                "casiConSettore": sum(casi_settore.values()),
                "casiConIncrocio": casi_con_incrocio,
            },
        },
        "settori": settori_out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"[informo-cause-settori] {len(settori_out)} settori, "
          f"{casi_con_incrocio} casi con incrocio, {kb:.1f} KB -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())