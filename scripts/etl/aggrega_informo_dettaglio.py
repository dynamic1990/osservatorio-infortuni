#!/usr/bin/env python3
"""Aggrega il dataset di dettaglio Infor.MO in viste per anno per la pagina
"Casi mortali".

Ingresso
  - src/data/generated/informo-mortali-dettaglio.json  (dettaglio casi)
  - src/data/generated/informo-mortali.json            (conteggi ufficiali)

Uscita: src/data/generated/informo-mortali-analisi.json

Le viste dei conteggi ufficiali (incidenti, settori, territori, popolazioni,
mansioni) restano quelle dei filtri INAIL, già estratte: la fonte li fornisce
distinti per anno e sono la base di confronto. Le viste nuove vengono dal
dettaglio dei singoli casi (profilo dell'infortunato, fattori causali,
problemi di sicurezza, standard): sono possibili solo sul sottoinsieme dei
casi analizzati e la copertura è dichiarata.

Viste prodotte, tutte per singolo anno (RULES.md regola 1):
  serie            casi analizzati vs totale filtri, copertura %, delta vs anno
  incidenti        causa (voce Incidente INAIL)
  settori          settore attività
  territori        macro-area
  popolazioni      irregolari/anziani/stranieri/neo-assunti/giovani
  mansioni         mansione
  profili          sesso, rapporto di lavoro, anzianità, classe addetti,
                   luogo, sede lesione, natura lesione, agente materiale
  fattori          per tipo, per ruolo (determinante/modulatore), per tipo di
                   modulazione, per problema di sicurezza, per standard di
                   confronto, per valutazione del rischio
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
BASE = ROOT / "src" / "data" / "generated" / "informo-mortali.json"
SERIE = ROOT / "src" / "data" / "generated" / "inail-serie-decennale.json"
OUT = ROOT / "src" / "data" / "generated" / "informo-mortali-analisi.json"

ADDETTI_BUCKETS = [("1", 1, 1), ("2-9", 2, 9), ("10-49", 10, 49),
                   ("50-249", 50, 249), ("250 e oltre", 250, 10 ** 9)]


def bucket_addetti(v: str | None) -> str:
    if not v:
        return "Non indicato"
    try:
        n = int(float(v.replace(".", "").replace(",", ".")))
    except ValueError:
        return "Non indicato"
    for label, lo, hi in ADDETTI_BUCKETS:
        if lo <= n <= hi:
            return label
    return "Non indicato"


def clean(v: str | None) -> str | None:
    if not v:
        return None
    return re.sub(r"\s+", " ", v.strip()) or None


def voci_counter(cnt: Counter) -> list[dict]:
    return [{"nome": k, "count": n} for k, n in cnt.most_common()]


def per_anno(by_anno, getter):
    out = []
    for anno in sorted(by_anno):
        cnt: Counter = Counter()
        for c in by_anno[anno]:
            v = getter(c)
            if v:
                cnt[v] += 1
        out.append({"anno": anno, "voci": voci_counter(cnt)})
    return out


def from_filtri(base: dict, dim: str) -> list[dict]:
    out = []
    for a in base["anni"]:
        out.append({"anno": a["anno"],
                    "voci": [{"nome": e["voce"], "count": e["count"]}
                             for e in a["conteggi"][dim]]})
    return out


def main() -> int:
    d = json.loads(DET.read_text(encoding="utf-8"))
    casi = d["casi"]
    base = json.loads(BASE.read_text(encoding="utf-8"))
    totali = {a["anno"]: a["numeroRecord"] for a in base["anni"]}

    by_anno: dict[int, list] = defaultdict(list)
    for c in casi:
        by_anno[c["anno"]].append(c)

    # mortali nazionali da denuncia (serie storica INAIL), per il confronto
    # tra campione Infor.MO e totale dei decessi denunciati
    mortali_naz = {}
    if SERIE.exists():
        sdec = json.loads(SERIE.read_text(encoding="utf-8"))
        mortali_naz = {s["anno"]: s.get("mortali") for s in sdec.get("serie", [])}
    totale_mortali_naz = sum(v for v in mortali_naz.values() if isinstance(v, int))

    # ---- serie (casi analizzati vs totale filtri) ----
    serie = []
    anni = sorted(by_anno)
    for i, anno in enumerate(anni):
        n = len(by_anno[anno])
        tot = totali.get(anno)
        prev = totali.get(anni[i - 1]) if i > 0 else None
        delta = (n - prev) if prev is not None else None
        voce = {
            "anno": anno,
            "casiAnalizzati": n,
            "totaleFiltri": tot,
            "copertura": round(n / tot * 100, 1) if tot else None,
            "mortaliNazionali": mortali_naz.get(anno),
        }
        if delta is not None:
            voce["deltaCasi"] = delta
            voce["deltaPerc"] = round(delta / prev * 100, 1) if prev else None
        serie.append(voce)

    # ---- viste dal dettaglio (profilo, fattori) ----
    profilo_getters = {
        "sesso": lambda c: c.get("sesso") or "Non indicato",
        "rapportoLavoro": lambda c: c.get("rapLav") or "Non indicato",
        "anzianita": lambda c: c.get("anzianita") or "Non indicata",
        "classeAddetti": lambda c: bucket_addetti(c.get("numAddetti")),
        "luogo": lambda c: c.get("luogo") or "Non indicato",
        "sedeLesione": lambda c: c.get("sedeLesione") or "Non indicata",
        "naturaLesione": lambda c: c.get("naturaLesione") or "Non indicata",
        "agenteMateriale": lambda c: c.get("agenteMatInc") or "Non indicato",
    }
    profili = {k: per_anno(by_anno, g) for k, g in profilo_getters.items()}

    fattori_tipo: dict[int, Counter] = defaultdict(Counter)
    fattori_ruolo: dict[int, Counter] = defaultdict(Counter)
    fattori_mod: dict[int, Counter] = defaultdict(Counter)
    fattori_ps: dict[int, Counter] = defaultdict(Counter)
    fattori_std: dict[int, Counter] = defaultdict(Counter)
    fattori_val: dict[int, Counter] = defaultdict(Counter)
    casi_con_fattori = 0
    n_fattori = 0
    for anno, cs in by_anno.items():
        for c in cs:
            if c.get("fattori"):
                casi_con_fattori += 1
            for f in c.get("fattori") or []:
                n_fattori += 1
                fattori_tipo[anno][f.get("tipoFattore") or "Non classificato"] += 1
                fattori_ruolo[anno][f.get("detMod") or "Non classificato"] += 1
                fattori_mod[anno][f.get("tipoMod") or "Non modulato"] += 1
                fattori_ps[anno][f.get("problemaSicurezza") or "Non indicato"] += 1
                fattori_std[anno][f.get("confrontoStandard") or "Non indicato"] += 1
                fattori_val[anno][f.get("valutazioneRischi") or "Non indicata"] += 1

    def da_counter(mappa):
        out = []
        for anno in sorted(mappa):
            out.append({"anno": anno, "voci": voci_counter(mappa[anno])})
        return out

    dataset = {
        "meta": {
            "fonte": "INAIL - Infor.MO / InformoWeb (tipoEvento=1, casi mortali)",
            "endpointFiltri": "https://www.inail.it/nsol-informo/filtra.do",
            "endpointDettaglio": "https://www.inail.it/nsol-informo/dettaglio.do",
            "periodo": "2020-2024",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "nota": "Conteggi ufficiali (incidenti, settori, territori, "
                    "popolazioni, mansioni) dai filtri INAIL e sempre distinti "
                    "per anno. Le voci di profilo e fattori causali provengono "
                    "dal dettaglio dei casi analizzati e coprono solo quel "
                    "sottoinsieme: la copertura è dichiarata in serie.copertura.",
        },
        "serie": serie,
        "incidenti": from_filtri(base, "Incidente"),
        "settori": from_filtri(base, "Settore Attività"),
        "territori": from_filtri(base, "Localizzazione territoriale"),
        "popolazioni": from_filtri(base, "Popolazioni"),
        "mansioni": from_filtri(base, "Mansioni"),
        "profili": profili,
        "fattori": {
            "perTipo": da_counter(fattori_tipo),
            "perRuolo": da_counter(fattori_ruolo),
            "perModulazione": da_counter(fattori_mod),
            "perProblemaSicurezza": da_counter(fattori_ps),
            "perStandard": da_counter(fattori_std),
            "perValutazione": da_counter(fattori_val),
        },
        "totFattori": n_fattori,
        "casiConFattori": casi_con_fattori,
        "totaleMortaliNazionali": totale_mortali_naz,
        "casiPeriodo": len(casi),
        "quotaQuinquennio": round(
            len(casi) / totale_mortali_naz * 100, 1
        ) if totale_mortali_naz else None,
    }

    OUT.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf-8")
    print(f"[informo-analisi] salvato {OUT}")
    print(f"[informo-analisi] casi {len(casi)}, fattori {n_fattori}, "
          f"casi con fattori {casi_con_fattori}")
    for s in serie:
        print(f"  {s['anno']}: {s['casiAnalizzati']}/{s['totaleFiltri']} "
              f"({s['copertura']}%) delta {s.get('deltaCasi')} "
              f"({s.get('deltaPerc')}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())