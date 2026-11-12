#!/usr/bin/env python3
"""Unifica mensile (20 regioni dai CSV) + semestrale storico (2021-2025,
tutte le regioni) in un'unica vista per il sito.

Dal 2026-11-11 lo snapshot mensile è costruito dai CSV regionali e copre già
tutte e 20 le regioni: le regioni con il trattino nel nome (Emilia-Romagna,
Trentino-Alto Adige, Friuli-Venezia Giulia) non sono più un caso a parte.

Output: src/data/generated/inail-infortuni-viste.json (viste, piccolo) e
meta aggiornato. Le serie coprono 2021-2026 con tutte le 20 regioni.

Usa:
  python3 scripts/etl/inail_unify_views.py
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data" / "generated"

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def leggi_mensile_api() -> list[dict]:
    """Aggregati mensili 2025-2026, tutte le 20 regioni."""
    path = OUT / "inail-infortuni-serie.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["aggregates"]


def fascia(eta: int) -> str:
    if eta < 0:
        return "ND"
    if eta < 15:
        return "0-14"
    if eta < 25:
        return "15-24"
    if eta < 35:
        return "25-34"
    if eta < 45:
        return "35-44"
    if eta < 55:
        return "45-54"
    if eta < 65:
        return "55-64"
    return "65+"


def main() -> int:
    # 1) Carica lo storico semestrale aggregato (2021-2025, 20 regioni)
    storico_path = OUT / "inail-infortuni-semestrale-storico.json"
    storico = json.loads(storico_path.read_text(encoding="utf-8"))
    semi = storico["aggregates"]

    # 2) Mensile: 2025-2026, tutte le 20 regioni (fonte unica: serie.json)
    mens = leggi_mensile_api()

    regioni_mensile = {r["regione"] for r in mens}
    if len(regioni_mensile) < 20:
        print(
            f"[!] attenzione: lo snapshot mensile copre {len(regioni_mensile)} regioni, "
            "non 20. Rigenerare prima inail-infortuni-serie.json.",
            file=sys.stderr,
        )

    # 3) Viste
    serie_annuale: Counter[int] = Counter()
    serie_annuale_reg: dict[str, Counter[int]] = {}
    serie_mensile: Counter[str] = Counter()
    settori = Counter()
    regioni = Counter()
    generi = Counter()
    fasce = Counter()
    modalita = Counter()
    gestioni = Counter()
    gruppi = Counter()
    mortali = Counter()

    # semestrale (2021-2025)
    for r in semi:
        anno = r["anno"]
        serie_annuale[anno] += r["casi"]
        serie_annuale_reg.setdefault(r["regione"], Counter())[anno] += r["casi"]
        settori[r["settoreAteco"] or "ND"] += r["casi"]
        regioni[r["regione"]] += r["casi"]
        generi[r["genere"] or "ND"] += r["casi"]
        fasce[fascia(r["eta"])] += r["casi"]
        modalita[r["modalita"] or "ND"] += r["casi"]
        if r.get("definizioneAmministrativa") == "P":
            mortali[(anno, "P")] += r["casi"]
        gruppi[r["grandeGruppo"] or "ND"] += r["casi"]

    # mensile (2025-2026): solo serie mensile congiunturale
    # (la serie annuale consolidata 2020-2024 viene dal semestrale)
    for r in mens:
        anno, mese = r["anno"], r["mese"]
        serie_mensile[f"{anno}-{mese:02d}"] += r["casi"]

    def top(c, n=15):
        return [{"key": k, "casi": v} for k, v in c.most_common(n)]

    viste_mortali = storico["coverage"]["mortali"]
    viste = {
        "schemaVersion": 2,
        "datasetId": "inail_infortuni_viste",
        "period": {"annoDa": 2021, "annoA": 2025, "mesi": None},
        "coverage": {
            "regioni": len(regioni),
            "record": storico["coverage"]["record"],
            "casi": sum(v for v in serie_annuale.values()),
            "mortali": viste_mortali,
            "casiPerAnno": {str(a): serie_annuale[a] for a in sorted(serie_annuale)},
            "notaPeriodo": "Serie annuale consolidata 2021-2025 (cadenza semestrale, tutte le 20 regioni). I dati mensili 2025-2026 sono congiunturali e coprono gennaio-settembre su tutte le 20 regioni, con una rilevazione per anno (30/09/2025 e 30/09/2026).",
        },
        "serieAnnuale": [{"anno": a, "casi": serie_annuale[a]} for a in sorted(serie_annuale)],
        "serieAnnualeRegioni": [
            {"regione": reg, "anni": [{"anno": a, "casi": serie_annuale_reg[reg][a]} for a in sorted(serie_annuale_reg[reg])]}
            for reg in sorted(serie_annuale_reg)
        ],
        "serieMensile": [{"key": k, "casi": serie_mensile[k]} for k in sorted(serie_mensile)],
        "settori": top(settori),
        "regioni": [{"key": k, "casi": v} for k, v in sorted(regioni.items(), key=lambda kv: -kv[1])],
        "generi": [{"key": k, "casi": v} for k, v in generi.items()],
        "fasceEta": [{"key": k, "casi": v} for k, v in sorted(fasce.items(), key=lambda kv: kv[0])],
        "modalita": [{"key": k, "casi": v} for k, v in modalita.items()],
        "gestioni": [{"key": k, "casi": v} for k, v in gestioni.items()],
        "gruppiTariffari": [{"key": k, "casi": v} for k, v in gruppi.items()],
    }
    out = OUT / "inail-infortuni-viste.json"
    out.write_text(json.dumps(viste, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Viste salvate: {out} ({out.stat().st_size} bytes)")

    # Il meta delle viste appartiene a questo dataset (consolidato 2021-2025),
    # non allo snapshot mensile: lo scrive l'ETL delle viste, così i due
    # artefatti non si sovrascrivono a vicenda.
    meta_path = OUT / "inail-infortuni-serie.meta.json"
    meta = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_viste",
        "artifactScope": "viste-consolidate",
        "source": {
            "owner": "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
            "landingUrl": "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-semestrale.html",
            "apiUrl": "https://dati.inail.it/opendata/downloads/daticoncadenzasemestraleinfortuni/zip/",
            "license": "Italian Open Data License v2.0",
            "attribution": "INAIL Open Data",
        },
        "extractedAt": utc_now(),
        "period": {"annoDa": 2021, "annoA": 2025, "mesi": None},
        "coverage": {
            "regioni": len(regioni),
            "province": storico["coverage"].get("province", 0),
            "record": storico["coverage"]["record"],
            "casi": storico["coverage"]["casi"],
            "mortali": storico["coverage"]["mortali"],
        },
        "limits": [
            "Serie annuale consolidata da cadenza semestrale: copre 5 anni interi (2021-2025), rilevazione 30/04/2026.",
            "I dati mensili 2025-2026 (congiunturali) sono in un artefatto separato e coprono gennaio-settembre su tutte le 20 regioni.",
            "La definizione amministrativa e l'indennizzo sono disponibili solo nella cadenza semestrale.",
            "Le denunce sono provvisorie e vengono integrate e riclassificate nel tempo.",
            "Le province sono 107 nella serie consolidata e 110 nella congiuntura mensile: la differenza non è un errore ma il riordino amministrativo della Sardegna, che nella serie storica compare con i codici 090, 091, 092, 095 e 111 e nei dati 2025-2026 con i nuovi codici 112-119. I confronti provinciali tra i due archivi non sono quindi omogenei.",
        ],
        "methodology": [
            "Aggregazione di record pseudonimizzati: mai record singoli nel sito.",
            "Le viste sono precalcolate: il sito carica solo queste, non lo snapshot completo.",
            "Le regioni sono codici ISTAT a due cifre; le province sono codici ISTAT a tre cifre.",
            "Per la Sardegna i codici provinciali cambiano tra i due periodi: aggregare per provincia su anni diversi richiede una mappatura esplicita verso i nuovi codici.",
        ],
    }
    meta_path.write_text(
        json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"Meta viste: {meta_path}")

    # Riallinea gli hash del registro artefatti: le viste e il loro meta sono
    # appena cambiati, e un registro divergente blocca la validazione CI.
    import subprocess
    registry_script = ROOT / "scripts" / "ci" / "aggiorna_registry.py"
    if registry_script.is_file():
        subprocess.run([sys.executable, str(registry_script)], cwd=ROOT, check=False)
    print("Casi per anno:", dict(sorted(serie_annuale.items())))
    print("Regioni:", len(regioni))
    return 0


if __name__ == "__main__":
    sys.exit(main())
