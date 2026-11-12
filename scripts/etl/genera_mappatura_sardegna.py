#!/usr/bin/env python3
"""Genera la mappatura dei codici provinciali della Sardegna.

Perché serve: i due archivi INAIL usano codici provincia diversi per la
Sardegna. La serie consolidata semestrale (2021-2025) usa i codici del
riordino 2016 (090, 091, 092, 095, 111), la congiuntura mensile (2025-2026)
usa quelli entrati in vigore il 1 gennaio 2026 (112-119). Senza una mappatura
esplicita, un confronto per provincia tra i due archivi somma territori
diversi con la stessa etichetta.

La corrispondenza non si inventa: viene dall'elenco ufficiale ISTAT
"Codici statistici e denominazioni delle unità amministrative della
Sardegna", che associa a ogni comune il codice nuovo e quello precedente.

Granularità: la mappatura è a livello di comune (377 righe), perché solo
così si sa da dove viene ogni territorio. Gli archivi INAIL però non
scendono sotto la provincia, quindi l'aggregazione utile ai dati è quella
provinciale: per questo lo script produce anche i raggruppamenti
confrontabili e dichiara il residuo che non è ricomponibile.

Uso:
    python3 scripts/etl/genera_mappatura_sardegna.py
    python3 scripts/etl/genera_mappatura_sardegna.py --verifica   # + controllo sui dati
"""

from __future__ import annotations

import argparse
import collections
import csv
import io
import json
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data" / "generated"
GEN = OUT / "province-sardegna-mappatura.json"

ZIP_URL = (
    "https://www.istat.it/wp-content/uploads/2024/09/"
    "Codici-statistici-e-denominazioni-delle-unita-amministrative-della-Sardegna.zip"
)
LANDING_URL = "https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/"
USER_AGENT = "OsservatorioInfortuni-ETL/0.3 (+https://github.com/dynamic1990/osservatorio-infortuni)"

# I codici INAIL sono codici provincia a tre cifre. Per le città
# metropolitane ISTAT usa 312 e 318 (codice ente = progressivo + 200),
# mentre nei dati INAIL circolano 112 e 118, cioè il progressivo usato
# come prefisso dei codici comune. La tabella tiene insieme le due cose.
CODICE_ENTE_DA_INAIL = {"112": "312", "118": "318"}
CODICE_INAIL_DA_ENTE = {v: k for k, v in CODICE_ENTE_DA_INAIL.items()}


def codice_inail(codice_istat: str) -> str:
    """Riporta un codice provincia ISTAT al codice usato da INAIL nei dati.

    ISTAT identifica le città metropolitane con 312 e 318; gli archivi INAIL
    usano 112 e 118, cioè il progressivo che fa da prefisso ai codici comune.
    Tutti gli altri codici coincidono.
    """
    return CODICE_INAIL_DA_ENTE.get(codice_istat, codice_istat)


def codice_precedente_inail(codice_istat: str) -> str:
    """Come codice_inail, ma per i codici soppressi.

    L'ISTAT riporta 292 per la città metropolitana di Cagliari nel periodo
    precedente; gli archivi INAIL 2021-2025 usano 092. Senza questa
    normalizzazione 17 comuni resterebbero fuori da ogni contenitore.
    """
    if codice_istat == "292":
        return "092"
    return codice_istat

# Nomi degli enti così come compaiono nell'elenco ISTAT.
NOMI = {
    "112": "Città metropolitana di Sassari",
    "113": "Provincia della Gallura Nord-Est Sardegna",
    "114": "Provincia di Nuoro",
    "115": "Provincia di Oristano",
    "116": "Provincia dell'Ogliastra",
    "117": "Provincia del Medio Campidano",
    "118": "Città metropolitana di Cagliari",
    "119": "Provincia del Sulcis Iglesiente",
}

# Vecchi codici così come li usa INAIL nei dati 2021-2025. L'ISTAT riporta
# 292 per la città metropolitana di Cagliari, INAIL usa 092: stesso ente,
# codice diverso. Verificato sul campo LuogoAccadimento.
NOMI_PRECEDENTI = {
    "090": "Provincia di Sassari",
    "091": "Provincia di Nuoro",
    "092": "Città metropolitana di Cagliari",
    "095": "Provincia di Oristano",
    "111": "Provincia del Sud Sardegna",
}

# Raggruppamenti confrontabili tra i due archivi.
#
# Aree: quattro contenitori che coprono esattamente il territorio regionale
# in entrambi i periodi, con l'unica eccezione di due comuni (Seui e Seulo)
# passati dal Sud Sardegna a Ogliastra e Nuoro. È il livello con il residuo
# più basso: preferirlo quando serve un confronto pulito nel tempo.
AREE = [
    {
        "id": "sassari",
        "nome": "Sassari",
        "vecchi": ["090"],
        "nuovi": ["112", "113"],
        "nota": "La provincia di Sassari si divide tra città metropolitana e Gallura.",
    },
    {
        "id": "nuoro",
        "nome": "Nuoro",
        "vecchi": ["091"],
        "nuovi": ["114", "116"],
        "nota": "Nuoro e Ogliastra: l'Ogliastra torna provincia dopo essere stata accorpata.",
    },
    {
        "id": "oristano",
        "nome": "Oristano",
        "vecchi": ["095"],
        "nuovi": ["115"],
        "nota": "Confini invariati, cambia solo il codice.",
    },
    {
        "id": "cagliari-sud",
        "nome": "Cagliari e Sud Sardegna",
        "vecchi": ["092", "111"],
        "nuovi": ["117", "118", "119"],
        "nota": "Il Sud Sardegna si scompone in Medio Campidano, Sulcis Iglesiente e 53 comuni che passano alla città metropolitana di Cagliari.",
    },
]

# Province storiche: cinque contenitori corrispondenti ai vecchi codici.
# Servono a produrre una serie lunga con le etichette del passato, ma il
# residuo è più alto: 53 comuni del Sud Sardegna finiscono nella città
# metropolitana di Cagliari e non sono separabili senza il livello comune,
# che gli archivi INAIL non espongono.
PROVINCE_STORICHE = [
    {"codice": "090", "istat": "090", "nome": "Sassari", "nuovi": ["112", "113"]},
    {"codice": "091", "istat": "091", "nome": "Nuoro", "nuovi": ["114", "116"]},
    {"codice": "092", "istat": "292", "nome": "Cagliari", "nuovi": ["118"]},
    {"codice": "095", "istat": "095", "nome": "Oristano", "nuovi": ["115"]},
    {"codice": "111", "istat": "111", "nome": "Sud Sardegna", "nuovi": ["117", "119"]},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def scarica() -> Path:
    RAW.mkdir(parents=True, exist_ok=True)
    dest = RAW / "istat-mappatura-sardegna.zip"
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    print(f"Download {ZIP_URL}", flush=True)
    req = urllib.request.Request(ZIP_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=120) as resp:
        dest.write_bytes(resp.read())
    return dest


def leggi_comuni(zip_path: Path) -> list[dict]:
    """Legge il CSV ISTAT. È in latin-1 e ha due righe di intestazione."""
    with zipfile.ZipFile(zip_path) as zf:
        nome = next(n for n in zf.namelist() if n.lower().endswith(".csv"))
        with zf.open(nome) as fh:
            testo = io.TextIOWrapper(fh, encoding="latin-1", newline="")
            righe = list(csv.reader(testo, delimiter=";"))

    # riga 0: titolo, riga 1: intestazioni (su due linee), riga 2+: dati
    dati = righe[2:]
    comuni = []
    for r in dati:
        if len(r) < 7 or not r[1].strip():
            continue
        nuovo, prec = r[1].strip(), r[5].strip()
        comuni.append(
            {
                "codiceComune": r[2].strip(),
                "nome": r[3].strip(),
                # codice ISTAT dell'ente (312/318 per le città metropolitane)
                "codiceEnte": nuovo,
                "denominazioneEnte": r[0].strip(),
                # codice con cui INAIL identifica la provincia (112/118)
                "provincia": codice_inail(nuovo),
                "codiceComunePrecedente": r[4].strip(),
                "provinciaPrecedente": codice_precedente_inail(prec) if prec else "",
            }
        )
    return comuni


def costruisci(comuni: list[dict]) -> dict:
    nuove = sorted({c["provincia"] for c in comuni})
    vecchie = sorted({c["provinciaPrecedente"] for c in comuni if c["provinciaPrecedente"]})

    per_nuova = collections.Counter(c["provincia"] for c in comuni)
    per_vecchia = collections.Counter(c["provinciaPrecedente"] for c in comuni if c["provinciaPrecedente"])
    cross = collections.Counter((c["provinciaPrecedente"], c["provincia"]) for c in comuni)

    province_nuove = []
    for cod in nuove:
        voce = {
            "codice": cod,  # codice provincia usato da INAIL
            "nome": NOMI.get(cod, ""),
            "comuni": per_nuova[cod],
            "provincePrecedenti": sorted({c["provinciaPrecedente"] for c in comuni
                                          if c["provincia"] == cod and c["provinciaPrecedente"]}),
        }
        # Solo le città metropolitane hanno un codice ente distinto dal
        # codice provincia; per le province i due valori coincidono e
        # ripeterli aggiungerebbe rumore.
        if cod in CODICE_ENTE_DA_INAIL:
            voce["codiceEnte"] = CODICE_ENTE_DA_INAIL[cod]
            voce["denominazioneEnte"] = next(
                (c["denominazioneEnte"] for c in comuni if c["provincia"] == cod), ""
            )
        province_nuove.append(voce)

    province_precedenti = [
        {
            "codice": cod,
            "nome": NOMI_PRECEDENTI.get(cod, ""),
            "comuni": per_vecchia[cod],
            "provinceNuove": sorted({c["provincia"] for c in comuni if c["provinciaPrecedente"] == cod}),
        }
        for cod in vecchie
    ]

    aree = []
    for a in AREE:
        nuovi_comuni = sum(per_nuova[c] for c in a["nuovi"])
        vecchi_comuni = sum(per_vecchia[c] for c in a["vecchi"])
        aree.append(
            {
                "id": a["id"],
                "nome": a["nome"],
                "vecchi": a["vecchi"],
                "nuovi": a["nuovi"],
                "comuniNuovi": nuovi_comuni,
                "comuniVecchi": vecchi_comuni,
                # quanti comuni cambiano area: 0 significa territorio identico
                "comuniSpostati": nuovi_comuni - vecchi_comuni,
                "nota": a["nota"],
            }
        )

    province_storiche = []
    for p in PROVINCE_STORICHE:
        # comuni che nel frattempo sono passati a un'altra provincia: restano
        # dentro il contenitore nuovo, quindi non sono separabili nei dati
        fuoriusciti = sum(
            n for (vecchia, nuova), n in cross.items()
            if vecchia == p["codice"] and nuova not in p["nuovi"]
        )
        province_storiche.append(
            {
                "codice": p["codice"],
                "nome": p["nome"],
                "nuovi": p["nuovi"],
                # comuni che avevano questo codice nel periodo precedente
                "comuniStorici": per_vecchia[p["codice"]],
                # comuni che il contenitore nuovo contiene in tutto
                "comuniNelContenitoreNuovo": sum(per_nuova[c] for c in p["nuovi"]),
                "comuniFuoriusciti": fuoriusciti,
                # comuni che il contenitore nuovo guadagna da altre province
                "comuniAcquisiti": sum(per_nuova[c] for c in p["nuovi"]) - per_vecchia[p["codice"]],
                # un contenitore è confrontabile nel tempo solo se il
                # territorio non è cambiato in nessuna delle due direzioni
                "confrontabileNelTempo": fuoriusciti == 0
                and sum(per_nuova[c] for c in p["nuovi"]) == per_vecchia[p["codice"]],
            }
        )

    return {
        "schemaVersion": 1,
        "datasetId": "province_sardegna_mappatura",
        "source": {
            "owner": "ISTAT",
            "titolo": "Codici statistici e denominazioni delle unità amministrative della Sardegna",
            "landingUrl": LANDING_URL,
            "url": ZIP_URL,
            "licenza": "CC BY 4.0",
            "dataRiferimento": "2026-01-01",
            "notaNormativa": (
                "LR Sardegna 7/2021, modificata dalla LR 9/2023, e Delibera G.R. 36/34 "
                "del 9 luglio 2025 (BURAS 39 del 17 luglio 2025). Codici validi per tutte "
                "le rilevazioni statistiche ufficiali dal 1 gennaio 2026."
            ),
        },
        "extractedAt": utc_now(),
        "coverage": {
            "comuni": len(comuni),
            "provinceNuove": len(nuove),
            "provincePrecedenti": len(vecchie),
        },
        "province": {"nuove": province_nuove, "precedenti": province_precedenti},
        "comuni": comuni,
        "mappatura": {
            "vecchioVersoNuovo": {
                v["codice"]: v["provinceNuove"] for v in province_precedenti
            },
            "nuovoVersoVecchio": {
                n["codice"]: n["provincePrecedenti"] for n in province_nuove
            },
            "note": [
                "Il vecchio codice 092 non compare nell'elenco ISTAT, che per Cagliari "
                "riporta 292: 092 è il codice usato da INAIL nei dati 2021-2025.",
                "Per le città metropolitane ISTAT distingue il codice ente (312, 318) dal "
                "progressivo usato nei codici comune (112, 118). INAIL usa il secondo.",
            ],
        },
        "confronto": {
            "aree": aree,
            "provinceStoriche": province_storiche,
        },
        "limiti": [
            "La mappatura è a livello di comune: è l'unico livello a cui la corrispondenza "
            "è documentata dall'ISTAT.",
            "Gli archivi INAIL non espongono il comune, quindi il passaggio a provincia "
            "perde informazione: i comuni che hanno cambiato provincia non sono "
            "ricollocabili nei dati aggregati.",
            "Due comuni passano dal Sud Sardegna a Ogliastra (Seui) e Nuoro (Seulo): "
            "il raggruppamento per aree li lascia nell'area di arrivo.",
            "Cinquantatré comuni del Sud Sardegna passano alla città metropolitana di "
            "Cagliari: nei contenitori provinciali storici restano con Cagliari, quindi "
            "la serie 111 risulta sottostimata e la 092 sovrastimata.",
            "I codici provinciali INAIL non seguono l'ISTAT per le città metropolitane: "
            "112 e 118 al posto di 312 e 318.",
            "La mappatura non dice nulla sulla qualità del dato: cambiare codice non "
            "rende confrontabili due rilevazioni con vintage diversi.",
        ],
    }


def verifica(artefatto: dict) -> dict:
    """Controlla la mappatura contro i due archivi reali, se disponibili.

    Confronta il 2025 (unico anno presente in entrambi) aggregando per area:
    il semestrale copre 12 mesi, il mensile 9. Il rapporto atteso tra i due
    totali è quindi circa 9/12, non 1. Serve a verificare che la mappatura
    ricomponga gli stessi territori, non a stimare i casi.
    """
    stato = {"eseguita": False, "motivo": ""}

    serie_path = OUT / "inail-infortuni-serie.json"
    semi_path = OUT / "inail-infortuni-semestrale-storico.json"
    raw_semi = RAW / "semestrale-Sardegna.zip"

    if not serie_path.exists():
        stato["motivo"] = "manca inail-infortuni-serie.json (artefatto non versionato)"
        return stato
    if not (semi_path.exists() or raw_semi.exists()):
        stato["motivo"] = "manca l'archivio semestrale della Sardegna"
        return stato

    nuovi = collections.Counter()
    vecchi = collections.Counter()

    if semi_path.exists():
        semi = json.loads(semi_path.read_text(encoding="utf-8"))
        for r in semi["aggregates"]:
            if r["regione"] == "20" and r["anno"] == 2025:
                vecchi[r["provincia"]] += r.get("casi", 0)
        fonte_vecchi = "inail-infortuni-semestrale-storico.json"
    else:
        with zipfile.ZipFile(raw_semi) as zf:
            nome = next(n for n in zf.namelist() if n.endswith(".csv"))
            with zf.open(nome) as fh:
                testo = io.TextIOWrapper(fh, encoding="utf-8-sig")
                for row in csv.DictReader(testo, delimiter=";"):
                    d = row.get("DataAccadimento", "")
                    if len(d) == 10 and int(d[6:10]) == 2025:
                        vecchi[row.get("LuogoAccadimento", "")] += 1
        fonte_vecchi = "data/raw/semestrale-Sardegna.zip"

    serie = json.loads(serie_path.read_text(encoding="utf-8"))
    mesi_mensile = set()
    for r in serie["aggregates"]:
        if r["regione"] == "20" and r["anno"] == 2025:
            nuovi[r["provincia"]] += r.get("casi", 0)
            mesi_mensile.add(r["mese"])

    aree = []
    for a in artefatto["confronto"]["aree"]:
        v = sum(vecchi[c] for c in a["vecchi"])
        n = sum(nuovi[c] for c in a["nuovi"])
        aree.append(
            {
                "id": a["id"],
                "nome": a["nome"],
                "semestrale2025": v,
                "mensile2025": n,
                "rapporto": round(n / v, 4) if v else None,
            }
        )

    tot_v = sum(vecchi.values())
    tot_n = sum(nuovi.values())
    return {
        "eseguita": True,
        "fonteVecchi": fonte_vecchi,
        "fonteNuovi": "inail-infortuni-serie.json",
        "anno": 2025,
        "mesiMensile": sorted(mesi_mensile),
        "nota": (
            "Il semestrale copre 12 mesi, il mensile 9: il rapporto atteso tra i totali "
            "è circa 0,75. Scostamenti per area oltre il 5% indicano che la mappatura "
            "non ricompone gli stessi territori."
        ),
        "aree": aree,
        "totaleSemestrale": tot_v,
        "totaleMensile": tot_n,
        "rapporto": round(tot_n / tot_v, 4) if tot_v else None,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verifica", action="store_true",
                    help="confronta la mappatura con i due archivi reali")
    ap.add_argument("--no-verifica", action="store_true",
                    help="non tocca il blocco di verifica già presente")
    args = ap.parse_args()

    comuni = leggi_comuni(scarica())
    artefatto = costruisci(comuni)

    if args.verifica:
        artefatto["verifica"] = verifica(artefatto)
    elif not args.no_verifica and GEN.exists():
        # conserva la verifica già calcolata: senza i file grandi non è rifacibile
        vecchio = json.loads(GEN.read_text(encoding="utf-8"))
        if "verifica" in vecchio:
            artefatto["verifica"] = vecchio["verifica"]

    GEN.write_text(
        json.dumps(artefatto, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Scritto {GEN.relative_to(ROOT)} ({GEN.stat().st_size} bytes)")
    print(f"  comuni: {artefatto['coverage']['comuni']}")
    print(f"  province nuove: {artefatto['coverage']['provinceNuove']}")
    print(f"  province precedenti: {artefatto['coverage']['provincePrecedenti']}")
    if "verifica" in artefatto:
        v = artefatto["verifica"]
        if v.get("eseguita"):
            print(f"  verifica 2025: semestrale {v['totaleSemestrale']}, "
                  f"mensile {v['totaleMensile']}, rapporto {v['rapporto']}")
        else:
            print(f"  verifica non eseguita: {v.get('motivo')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
