#!/usr/bin/env python3
"""Genera l'analisi per sezione Ateco (attività economica) per la pagina
"Analisi delle cause".

Ingresso: src/data/generated/informo-{mortali|gravi}-dettaglio.json
          scripts/etl/ateco_informo_map.py  (mappatura attPrev -> Ateco)
Uscita:   public/data/informo-ateco-analisi.json
          public/data/informo-ateco-analisi-gravi.json

Per ogni sezione Ateco (A, B, C, ...) e per ogni anno, produce le viste
principali della pagina ricalcolate sul sottoinsieme dei casi di quella
sezione: serie, incidenti (dinamica), settori di dettaglio, profili e
fattori causali. Serve al dropdown "Attività economica" della pagina
Analisi delle cause: la selezione di una sezione aggiorna tutti i grafici
a valle sul sottoinsieme (filtro a monte), mentre la lettura caso per caso
mantiene i propri filtri.

Convenzioni (coerenti con genera_cluster_dimensionali.py):
- Le "settori" mostrate nel sottoinsieme sono le descrizioni attPrev dei
  casi della sezione (non più le voci INAIL dei filtri, che non possono
  essere ricalcolate lato API: filtra.do rifiuta filtri pre-impostati).
- Il "territorio" è ricostruito dal campo luogo del caso (macro-area non
  disponibile nel dettaglio): la vista si chiama comunque "territori" ma
  il meta dichiara il limite.
- Quote riferite al totale del sottoinsieme-anno (niente aggregati
  multi-anno, RULES.md regola 1).
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "etl"))
from ateco_informo_map import mappa_att_prev  # noqa: E402

TOP = 8  # voci per vista per sezione-anno


def clean(v) -> str | None:
    if not v:
        return None
    return re.sub(r"\s+", " ", str(v).strip()) or None


def main(tipo: str) -> int:
    det_path = ROOT / "src" / "data" / "generated" / f"informo-{tipo}-dettaglio.json"
    out_path = ROOT / "public" / "data" / (
        "informo-ateco-analisi.json" if tipo == "mortali" else "informo-ateco-analisi-gravi.json"
    )
    d = json.loads(det_path.read_text(encoding="utf-8"))
    casi = d["casi"]

    # casi per sezione (esclusi i non classificabili -> 'U 00')
    by_sezione: dict[str, list] = defaultdict(list)
    non_classificati = 0
    for c in casi:
        m = mappa_att_prev(c.get("attPrev"))
        if m is None:
            non_classificati += 1
            continue
        by_sezione[m["sezione"]].append(c)

    ANNI = sorted({c["anno"] for c in casi})

    def voci_per_anno(casi_sez: list, anno: int, campo: str, key: str | None = None) -> list:
        cnt: Counter = Counter()
        for c in casi_sez:
            if c.get("anno") != anno:
                continue
            if key == "fattoreTipo":
                for f in (c.get("fattori") or []):
                    t = clean(f.get("tipoFattore"))
                    if t:
                        cnt[t] += 1
                continue
            if key == "problemaSicurezza":
                for f in (c.get("fattori") or []):
                    ps = clean(f.get("problemaSicurezza"))
                    if ps:
                        cnt[ps] += 1
                continue
            v = clean(c.get(campo))
            if v:
                cnt[v] += 1
        tot = sum(cnt.values())
        return [
            {"nome": nome, "count": n, "quota": round(n / tot * 100, 1) if tot else 0}
            for nome, n in cnt.most_common(TOP)
        ]

    sezioni_out = []
    for sez in sorted(by_sezione):
        casi_sez = by_sezione[sez]
        per_anno = []
        for anno in ANNI:
            casi_anno = [c for c in casi_sez if c.get("anno") == anno]
            per_anno.append({
                "anno": anno,
                "casi": len(casi_anno),
                "viste": {
                    "incidenti": voci_per_anno(casi_sez, anno, "incidente"),
                    "settori": voci_per_anno(casi_sez, anno, "attPrev"),
                    "territori": voci_per_anno(casi_sez, anno, "luogo"),
                    "fattoriTipo": voci_per_anno(casi_sez, anno, None, "fattoreTipo"),
                    "problemiSicurezza": voci_per_anno(casi_sez, anno, None, "problemaSicurezza"),
                },
            })
        sezioni_out.append({"sezione": sez, "casi": len(casi_sez), "perAnno": per_anno})

    payload = {
        "meta": {
            "fonte": f"INAIL - Infor.MO / InformoWeb (tipoEvento={'1' if tipo == 'mortali' else '0'}, casi {'mortali' if tipo == 'mortali' else 'gravi'})",
            "periodo": f"{ANNI[0]}-{ANNI[-1]}",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "nota": "Analisi per sezione Ateco (attività economica) ricalcolata dal "
                    "dettaglio dei casi. Il territorio è il luogo del caso (macro-area "
                    "INAIL non disponibile nel dettaglio). Casi senza settore "
                    "classificabile esclusi.",
            "criteri": {
                "casiTotali": len(casi),
                "casiConSezione": sum(len(v) for v in by_sezione.values()),
                "casiNonClassificati": non_classificati,
                "sezioni": sorted(by_sezione),
            },
        },
        "sezioni": sezioni_out,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    kb = out_path.stat().st_size / 1024
    print(f"[informo-ateco-analisi] {tipo}: {len(sezioni_out)} sezioni, "
          f"{kb:.1f} KB -> {out_path}")
    print(f"  casi totali {len(casi)}, con sezione "
          f"{sum(len(v) for v in by_sezione.values())}, non classificati {non_classificati}")
    return 0


if __name__ == "__main__":
    tipo = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ("mortali", "gravi") else "mortali"
    raise SystemExit(main(tipo))