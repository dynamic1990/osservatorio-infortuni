#!/usr/bin/env python3
"""Genera l'analisi per dimensione aziendale per ogni sezione Ateco per la
pagina "Analisi delle cause".

Ingresso: src/data/generated/informo-{mortali|gravi}-dettaglio.json
          scripts/etl/ateco_informo_map.py  (mappatura attPrev -> Ateco)
Uscita:   public/data/informo-cluster-ateco.json
          public/data/informo-cluster-ateco-gravi.json

Serve al blocco "dimensione aziendale" della pagina Analisi delle cause
quando è attivo il filtro "attività economica": per la sezione selezionata
mostra gli stessi cluster dimensionali (micro, piccole, medie, grandi, non
dichiarata) ma calcolati solo sui casi di quella sezione Ateco.

La struttura replica informo-cluster-dimensionali.json: per ogni sezione,
per ogni cluster e per ogni anno, le viste principali (dinamiche/incidenti,
settori, territorio/luogo, tipologie di fattore, problemi di sicurezza) con
quote sul totale del cluster-anno. Un caso può appartenere a un solo
cluster (dimensione) e a una sola sezione (Ateco) → i totali per sezione
sono la somma dei cluster.

Uso:  python3 genera_cluster_ateco.py [mortali|gravi]
      (default: mortali; 'gravi' scrive il file -gravi.json)
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

TIPO = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ("mortali", "gravi") else "mortali"
DET = ROOT / "src" / "data" / "generated" / f"informo-{TIPO}-dettaglio.json"
OUT = ROOT / "public" / "data" / (
    "informo-cluster-ateco.json" if TIPO == "mortali" else "informo-cluster-ateco-gravi.json"
)

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


def main() -> int:
    d = json.loads(DET.read_text(encoding="utf-8"))
    casi = d["casi"]
    ANNI = sorted({c["anno"] for c in casi})

    # casi per sezione (esclusi non classificabili)
    by_sezione: dict[str, list] = defaultdict(list)
    non_classificati = 0
    for c in casi:
        m = mappa_att_prev(c.get("attPrev"))
        if m is None:
            non_classificati += 1
            continue
        by_sezione[m["sezione"]].append(c)

    sezioni_out = []
    for sez in sorted(by_sezione):
        casi_sez = by_sezione[sez]
        # cluster per questa sezione
        by_cluster: dict[str, list] = defaultdict(list)
        for c in casi_sez:
            a = addetti(c)
            by_cluster[cluster_of(a)].append(c)
        by_cluster["tutte"] = list(casi_sez)

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
        sezioni_out.append({
            "sezione": sez,
            "casi": len(casi_sez),
            "cluster": cluster_out,
        })

    payload = {
        "meta": {
            "fonte": f"INAIL - Infor.MO / InformoWeb (tipoEvento={'1' if TIPO == 'mortali' else '0'}, casi {'mortali' if TIPO == 'mortali' else 'gravi'})",
            "periodo": f"{ANNI[0]}-{ANNI[-1]}",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "cluster": [{"id": c[0], "nome": c[1]} for c in CLUSTER],
            "nota": "Cluster dimensionali per sezione Ateco, calcolati dal "
                    "dettaglio dei casi (dimensione dal campo addetti, sezione "
                    "dalla mappatura Ateco di attPrev). Il territorio è il luogo "
                    "del caso. Casi senza settore classificabile esclusi.",
            "criteri": {
                "casiTotali": len(casi),
                "casiConSezione": sum(len(v) for v in by_sezione.values()),
                "casiNonClassificati": non_classificati,
                "perSezione": {sez: len(cs) for sez, cs in sorted(by_sezione.items())},
            },
        },
        "sezioni": sezioni_out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"[informo-cluster-ateco] {TIPO}: {len(sezioni_out)} sezioni, "
          f"{kb:.1f} KB -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())