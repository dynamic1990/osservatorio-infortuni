#!/usr/bin/env python3
"""Genera l'analisi per dimensione aziendale per la pagina Analisi delle cause.

Ingresso: src/data/generated/informo-{mortali|gravi}-dettaglio.json
Uscita:   public/data/informo-cluster-dimensionali.json
          public/data/informo-cluster-dimensionali-gravi.json

Raggruppa i casi Infor.MO (mortali o gravi, a seconda dell'argomento) per
classe dimensionale dell'azienda (raccomandazione UE 2003/361): microimprese
(0-9 addetti), piccole (10-49), medie (50-249), grandi (250+), più la classe
"Non dichiarata" per i casi senza dato. Per ogni cluster e per ogni anno
produce le viste principali della pagina (dinamiche/incidenti, settori,
territorio, tipologie di fattore causale, problemi di sicurezza),
precalcolate e leggere, con quote riferite al totale del cluster-anno
(niente aggregati multi-anno, RULES.md regola 1).

Uso:  python3 genera_cluster_dimensionali.py [mortali|gravi]
      (default: mortali; 'gravi' scrive il file -gravi.json)

Il confronto di benchmark con la scheda INAIL 2026 "Infortuni mortali nelle
microimprese" (Collana Infor.MO, Scheda 27) è citato nel meta del dataset
mortali; per i gravi il riferimento è la scheda equivalente se disponibile.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TIPO = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ("mortali", "gravi") else "mortali"
DET = ROOT / "src" / "data" / "generated" / f"informo-{TIPO}-dettaglio.json"
OUT = ROOT / "public" / "data" / ("informo-cluster-dimensionali.json" if TIPO == "mortali" else "informo-cluster-dimensionali-gravi.json")

TOP = 8  # voci per vista per cluster-anno

CLUSTER = [
    ("tutte", "Tutte le dimensioni", None),
    ("micro", "Microimprese (0-9 addetti)", lambda a: 0 <= a <= 9),
    ("piccola", "Piccole (10-49 addetti)", lambda a: 10 <= a <= 49),
    ("media", "Medie (50-249 addetti)", lambda a: 50 <= a <= 249),
    ("grande", "Grandi (250+ addetti)", lambda a: a >= 250),
    ("nd", "Non dichiarata", None),
]

VISTE = ("incidenti", "settori", "territori", "fattoriTipo", "problemiSicurezza")


def clean(v: str | None) -> str | None:
    if not v:
        return None
    return re.sub(r"\s+", " ", v.strip()) or None


def addetti(c: dict) -> int | None:
    v = c.get("numAddetti")
    if v in (None, "ND", "", "n.d.", "Non indicato"):
        return None
    try:
        return int(float(str(v).replace(",", ".")))
    except (TypeError, ValueError):
        return None


def cluster_of(a: int | None) -> str:
    if a is None:
        return "nd"
    if a <= 9:
        return "micro"
    if a <= 49:
        return "piccola"
    if a <= 249:
        return "media"
    return "grande"


def main() -> int:
    d = json.loads(DET.read_text(encoding="utf-8"))
    casi = d["casi"]
    ANNI = sorted({c["anno"] for c in casi})

    # casi per cluster
    by_cluster: dict[str, list] = defaultdict(list)
    for c in casi:
        a = addetti(c)
        by_cluster[cluster_of(a)].append(c)
    # il cluster "tutte" contiene tutti i casi
    by_cluster["tutte"] = list(casi)

    def voci_per_anno(casi_cluster: list, anno: int, campo: str, key: str | None = None) -> list:
        cnt: Counter = Counter()
        for c in casi_cluster:
            if c.get("anno") != anno:
                continue
            v = c.get(campo) if key is None else c.get(campo)
            if not v:
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
            cnt[clean(v)] += 1
        tot = sum(cnt.values())
        return [
            {"nome": nome, "count": n, "quota": round(n / tot * 100, 1) if tot else 0}
            for nome, n in cnt.most_common(TOP)
        ]

    cluster_out = []
    for cid, nome, _pred in CLUSTER:
        casi_c = by_cluster[cid]
        per_anno = []
        for anno in ANNI:
            casi_anno = [c for c in casi_c if c.get("anno") == anno]
            viste = {
                "incidenti": voci_per_anno(casi_c, anno, "incidente"),
                "settori": voci_per_anno(casi_c, anno, "attPrev"),
                "territori": voci_per_anno(casi_c, anno, "luogo"),
                "fattoriTipo": voci_per_anno(casi_c, anno, None, "fattoreTipo"),
                "problemiSicurezza": voci_per_anno(casi_c, anno, None, "problemaSicurezza"),
            }
            per_anno.append({"anno": anno, "casi": len(casi_anno), "viste": viste})
        cluster_out.append({"id": cid, "nome": nome, "casi": len(casi_c), "perAnno": per_anno})

    payload = {
        "meta": {
            "fonte": f"INAIL - Infor.MO / InformoWeb (tipoEvento={'1' if TIPO == 'mortali' else '0'}, casi {'mortali' if TIPO == 'mortali' else 'gravi'})",
            "periodo": f"{ANNI[0]}-{ANNI[-1]}",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "cluster": [
                {"id": c[0], "nome": c[1]}
                for c in CLUSTER
            ],
            "nota": "Classi dimensionali secondo la raccomandazione UE 2003/361 "
                    f"(micro 0-9, piccole 10-49, medie 50-249, grandi 250+ addetti), "
                    f"calcolate dal campo addetti del singolo caso. I casi senza dato "
                    f"sono in 'Non dichiarata'. Le quote sono riferite al totale del "
                    f"cluster e dell'anno, senza aggregati multi-anno. Benchmark di "
                    f"riferimento: scheda INAIL 2026 'Infortuni {'mortali' if TIPO == 'mortali' else 'gravi'} nelle "
                    f"microimprese' (Collana Infor.MO, Scheda 27).",
            "criteri": {
                "casiTotali": len(casi),
                "perCluster": {cid: len(by_cluster[cid]) for cid, _, _ in CLUSTER},
            },
        },
        "cluster": cluster_out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"[informo-cluster-dimensionali] {TIPO}: {len(cluster_out)} cluster, {kb:.1f} KB -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())