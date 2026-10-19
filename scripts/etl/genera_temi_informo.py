#!/usr/bin/env python3
"""Analisi tematiche trasversali sull'archivio Infor.MO (2010-2024).

Genera src/data/generated/informo-temi.json con una serie di "temi
trasversali", cioè cluster di operazioni/situazioni che attraversano tutti i
settori e non sono una dimensione strutturata di Infor.MO. La metodologia
segue le schede INAIL DIMEILA (es. Scheda 28 "Attività manutentive"), che
isolano il tema con parole chiave sul racconto (variabile dinamica).

Temi attuali:
  manutenzione    attività di manutenzione, riparazione, pulizia, sblocco
                  produzione, riattrezzaggio (Scheda 28 Infor.MO, 2014-2023)

Per ogni tema il dataset contiene:
  - meta: uso della keyword list, periodo, fonti, note metodologiche
  - serie: casi per anno (mortali/gravi), con quota sul totale archivio
  - settori: distribuzione % per sezione Ateco (dalla mappa attPrev)
  - incidenti: distribuzione % per modalità prevalente (Incidente)
  - fattori: per tipo (AI/AT/UMI/AMB/DPI/MAT) con quote
  - problemi: problemi di sicurezza più frequenti (per tema)
  - casi: esempi selezionati (max N, per anno) con codice e dinamica breve

Keyword list mantenute in TESEMI e calibrate per escludere i falsi positivi
(es. "pulizia" generica del luogo di lavoro non manutentiva). Il confronto
con la Scheda 28 INAIL (259 casi manutenzione su 1.128 manifatturiero
2014-2023) è il banco di prova della calibrazione: vedi tests/etl.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DET_M = ROOT / "src" / "data" / "generated" / "informo-mortali-dettaglio.json"
DET_G = ROOT / "src" / "data" / "generated" / "informo-gravi-dettaglio.json"
OUT = ROOT / "src" / "data" / "generated" / "informo-temi.json"
OUT_PUB = ROOT / "public" / "data" / "informo-temi.json"

sys.path.insert(0, str(ROOT / "scripts" / "etl"))
from ateco_informo_map import mappa_att_prev  # noqa: E402

# ---------------------------------------------------------------------------
# Definizione dei temi
# ---------------------------------------------------------------------------

# Parole chiave per ciascun tema, cercate sulla dinamica (minuscolo).
# La keyword list "base" è il nucleo distintivo; le keyword "extra" vengono
# usate con vincoli di contesto (es. "guasto" solo se accompagnato da
# riparaz/manutenz) per non allargare a caso.
TEMA_KEYWORDS: dict[str, dict] = {
    "manutenzione": {
        "label": "Attività manutentive",
        "base": [
            "manutenzione", "manutentiv", "manutentore", "manutentori",
            "riparazione", "riparando", "riparava", "riparat",
            "sblocco", "sbloccare", "ripristino", "riattrezz",
            "cambio ciclo", "sostituzione", "sostituendo", "sostituit",
        ],
        "extra_context": {
            # termine "neutro" -> contesti che lo rendono manutentivo
            "guasto": ["riparaz", "manutenz", "ripristin", "sblocc", "eliminare il guasto", "togliere il guasto"],
            "pulizia": ["pulizia della macchina", "pulizia della linea", "pulizia dell'impianto",
                        "pulizia della pressa", "pulizia del macchinario", "pulizia macchina",
                        "pulizia impianto", "pulizia linea", "cambio produzione", "ogni fine turno",
                        "pulizie della macchina", "pulizia del nastro", "pulizia del tamburo"],
            "regolazion": ["regolazione della macchina", "regolazion"],
            "messa a punto": ["messa a punto"],
        },
        "nota": (
            "Casi con dinamica riconducibile ad attività di manutenzione, "
            "riparazione, pulizia/stacco-sblocco di attrezzature e impianti, "
            "riattrezzaggio o cambio ciclo. La selezione avviene con parole "
            "chiave sul racconto della dinamica, come nelle schede INAIL. "
            "Confronto con Scheda 28 Infor.MO: 259 casi su 1.128 del "
            "manifatturiero nel periodo 2014-2023."
        ),
    },
}

# Numero massimo di casi di esempio per tema
MAX_ESEMPI = 80
# Periodo coperto dall'archivio (etichetta)
PERIODO = "2010-2024"


def clean(v: str | None) -> str | None:
    if not v:
        return None
    return re.sub(r"\s+", " ", v.strip()) or None


def normalizza_dinamica(dyn: str | None) -> str:
    s = (dyn or "").lower()
    return re.sub(r"\s+", " ", s)


def match_tema(dinamica: str, tema: dict) -> bool:
    """True se la dinamica appartiene al tema (keyword base o extra+contesto)."""
    d = normalizza_dinamica(dinamica)
    base = tema["base"]
    if any(k in d for k in base):
        return True
    for kw, ctxs in tema.get("extra_context", {}).items():
        if kw in d:
            # deve comparire almeno un contesto manutentivo
            if any(c in d for c in ctxs):
                return True
    return False


def sezione_ateco(c) -> str | None:
    m = mappa_att_prev(c.get("attPrev"))
    return m["sezione"] if m else None


def main() -> int:
    mortali = json.loads(DET_M.read_text(encoding="utf-8"))["casi"]
    gravi = json.loads(DET_G.read_text(encoding="utf-8"))["casi"]
    casi = [(*[c], "mortale") for c in mortali] + [(*[c], "grave") for c in gravi]
    casi = [{"caso": c, "esito": es} for c, es in casi]

    totali_anno_m = Counter(c["anno"] for c in mortali)
    totali_anno_g = Counter(c["anno"] for c in gravi)

    dataset = {
        "meta": {
            "fonte": "INAIL - Infor.MO / InformoWeb (archivio analizzato 2010-2024)",
            "periodo": PERIODO,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "nota": (
                "Analisi tematiche trasversali: i temi sono cluster di "
                "operazioni/situazioni individuati con parole chiave sul "
                "racconto della dinamica (variabile testuale), come nelle "
                "schede INAIL DIMEILA. Non sono dimensioni strutturate "
                "dell'archivio: la selezione è metodologica e la copertura "
                "va letta come casi riconducibili al tema."
            ),
        },
        "temi": {},
    }

    for tema_id, tema in TEMA_KEYWORDS.items():
        sel = [x for x in casi if match_tema(x["caso"].get("dinamica"), tema)]

        # serie per anno con quota su totale archivio di quel tipo
        serie = []
        casi_m = Counter(c["caso"]["anno"] for c in sel if c["esito"] == "mortale")
        casi_g = Counter(c["caso"]["anno"] for c in sel if c["esito"] == "grave")
        for anno in sorted(set(list(casi_m) + list(casi_g))):
            nm = casi_m.get(anno, 0)
            ng = casi_g.get(anno, 0)
            totm = totali_anno_m.get(anno, 0)
            totg = totali_anno_g.get(anno, 0)
            serie.append({
                "anno": anno,
                "mortali": nm,
                "gravi": ng,
                "totale": nm + ng,
                "quotaMortali": round(nm / totm * 100, 1) if totm else None,
                "quotaGravi": round(ng / totg * 100, 1) if totg else None,
            })

        # settori (sezione Ateco) sul totale selezionato
        cnt_sett = Counter(sezione_ateco(c["caso"]) for c in sel)
        tot_sel = len(sel)
        settori = [
            {"sezione": k, "casi": v, "quota": round(100 * v / tot_sel, 1)}
            for k, v in cnt_sett.most_common() if k
        ]

        # modalità Incidente prevalente
        cnt_inc = Counter((c["caso"].get("incidente") or "Non indicato") for c in sel)
        incidenti = [
            {"incidente": k, "casi": v, "quota": round(100 * v / tot_sel, 1)}
            for k, v in cnt_inc.most_common(10)
        ]

        # fattori causali per tipo (AI/AT/UMI/AMB/DPI/MAT)
        cnt_tipo = Counter()
        n_fatt = 0
        for c in sel:
            for f in c["caso"].get("fattori") or []:
                t = f.get("tipoFattore") or "Non classificato"
                cnt_tipo[t] += 1
                n_fatt += 1
        fattori = [
            {"tipo": k, "n": v, "quota": round(100 * v / n_fatt, 1)}
            for k, v in cnt_tipo.most_common() if n_fatt
        ]

        # problemi di sicurezza prevalenti (classificazione INAIL)
        cnt_ps = Counter(f.get("problemaSicurezza") or "Non indicato"
                         for c in sel for f in c["caso"].get("fattori") or [])
        problemi = [
            {"problema": k, "n": v}
            for k, v in cnt_ps.most_common(12)
        ]

        # esempi (casi più recenti, con dinamica abbreviata)
        esempi = []
        for c in sorted(sel, key=lambda x: x["caso"].get("anno") or 0, reverse=True)[:MAX_ESEMPI]:
            dyn = clean(c["caso"].get("dinamica")) or ""
            esempi.append({
                "anno": c["caso"].get("anno"),
                "codice": c["caso"].get("codiceInfortunio"),
                "esito": c["esito"],
                "settore": sezione_ateco(c["caso"]),
                "dinamica": dyn[:280],
            })

        n_mort = sum(1 for c in sel if c["esito"] == "mortale")
        n_grav = len(sel) - n_mort
        dataset["temi"][tema_id] = {
            "label": tema["label"],
            "nota": tema["nota"],
            "periodo": PERIODO,
            "totale": len(sel),
            "mortali": n_mort,
            "gravi": n_grav,
            "serie": serie,
            "settori": settori,
            "incidenti": incidenti,
            "fattori": fattori,
            "problemi": problemi,
            "esempi": esempi,
        }
        print(f"[informo-temi] {tema_id}: {len(sel)} casi "
              f"({n_mort} mortali + {n_grav} gravi)")

    OUT.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf-8")
    OUT_PUB.parent.mkdir(parents=True, exist_ok=True)
    OUT_PUB.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf-8")
    print(f"[informo-temi] salvato {OUT}")
    print(f"[informo-temi] salvato {OUT_PUB} (pubblico)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())