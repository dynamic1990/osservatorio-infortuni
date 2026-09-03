#!/usr/bin/env python3
"""
ETL Malattie Professionali per Osservatorio Infortuni.

Legge i CSV ufficiali INAIL Open Data (scaricati da dati.inail.it):
- DatiMensiliMalattieProfessionaliDataProt_<Regione>.csv  (denunce, cadenza mensile)
- DatiSemestraliMalattieProfessionaliDataDec_<Regione>.csv (decessi, cadenza semestrale)

Genera src/data/generated/malattie-professionali.json aggregato per:
- totale nazionale e per genere/anno/mese (confronto I semestre 2025 vs 2026)
- categorie di patologia ICD-10 (raggruppamento clinico leggibile)
- regione (mappa + ranking)
- decessi per malattia professionale (per anno di morte, silicosi/asbestosi)

Nessun record singolo: solo aggregati. Privacy preservata.
"""

import csv
import json
import glob
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw" / "malattie-professionali"
GEN_DIR = ROOT / "src" / "data" / "generated"
GEN_DIR.mkdir(parents=True, exist_ok=True)

DATASET_ID = "inail-malattie-professionali"
SCHEMA_VERSION = 1

REGIONI = {
    "Piemonte": "01", "ValledAosta": "02", "Lombardia": "03", "TrentinoAltoAdige": "04",
    "Veneto": "05", "FriuliVeneziaGiulia": "06", "Liguria": "07", "EmiliaRomagna": "08",
    "Toscana": "09", "Umbria": "10", "Marche": "11", "Lazio": "12", "Abruzzo": "13",
    "Molise": "14", "Campania": "15", "Puglia": "16", "Basilicata": "17",
    "Calabria": "18", "Sicilia": "19", "Sardegna": "20",
}

NOMI = {v: k for k, v in REGIONI.items()}


def mappa_categoria(icd: str) -> tuple[str, str]:
    """Raggruppa un codice ICD-10 in una categoria clinica leggibile.

    Ritorna (key, nome). Key usata per aggregazioni stabili.
    """
    icd = (icd or "").strip().upper()
    if not icd or icd in {"ND", "N.D.", "N.D"}:
        return ("ND", "Codice non indicato")

    # Capitolo muscolo-scheletrico (M) — dettaglio per patologia
    if icd.startswith("M75"):
        return ("SPALLA", "Patologie della spalla (cuffia dei rotatori)")
    if icd.startswith(("M51", "M50")):
        return ("RACHIDE", "Ernie e discopatie del rachide (dorsale/lombare/cervicale)")
    if icd.startswith("M54"):
        return ("RACHIDE", "Ernie e discopatie del rachide (dorsale/lombare/cervicale)")
    if icd.startswith("G56"):
        return ("CANALICOLARI", "Sindromi canalicolari (tunnel carpale, gomito)")
    if icd.startswith("H83"):
        return ("IPOACUSIA", "Ipoacusia da rumore")
    if icd.startswith("M77"):
        return ("TENDINOPATIE", "Epicondiliti e tendinopatie (gomito, polso)")
    if icd.startswith("M65"):
        return ("TENOSINOVITI", "Tenosinoviti e patologie dei tendini flessori")
    if icd.startswith("M23"):
        return ("MENISCO", "Lesioni del menisco")
    if icd.startswith("M17"):
        return ("ARTROSI", "Gonartrosi da sovraccarico")
    if icd.startswith("M16"):
        return ("ARTROSI", "Coxartrosi da sovraccarico")
    if icd.startswith("M18"):
        return ("ARTROSI", "Rizartrosi del pollice")
    if icd.startswith("M47"):
        return ("SPONDILOSI", "Spondilosi e artrosi vertebrale")
    if icd.startswith("M20") or icd.startswith("M21"):
        return ("DEFORMITA", "Deformità acquisite da sovraccarico")
    if icd.startswith("M"):
        return ("MUSCOLOSCHELETRICO_ALTRO", "Altre malattie muscolo-scheletriche")

    # Tumori professionali (capitolo C)
    if icd.startswith("C45"):
        return ("MESOTELIOMA", "Mesoteliomi (esposizione ad amianto)")
    if icd.startswith("C34"):
        return ("TUMORE_POLMONE", "Tumori del polmone")
    if icd.startswith("C67"):
        return ("TUMORE_VESCICA", "Tumori della vescica")
    if icd.startswith("C44"):
        return ("TUMORE_CUTE", "Tumori della cute")
    if icd.startswith("C"):
        return ("TUMORE_ALTRO", "Altri tumori professionali")

    # Apparato respiratorio (capitolo J)
    if icd.startswith(("J92", "J61", "J60", "J62", "J63", "J64", "J65")):
        return ("POLVERI", "Patologie pleuro-polmonari da polveri (silicosi, asbestosi)")

    # Disturbi psichici (capitolo F)
    if icd.startswith("F"):
        return ("STRESS", "Disturbi psichici (stress lavoro-correlato)")

    # Cute (capitolo L)
    if icd.startswith("L"):
        return ("CUTE", "Dermatosi professionali (agenti fisici e chimici)")

    return ("ALTRO", "Altre patologie")


def leggi_csv(path: Path, delim: str = ";") -> list[dict]:
    if not path.exists():
        return []
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f, delimiter=delim))


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def main():
    print("1. Lettura CSV mensili (denunce)...")
    # ---- Denunce mensili ----
    # perMese[anno][mese] = conta
    per_mese = defaultdict(lambda: defaultdict(int))
    per_genere = Counter()
    per_anno = Counter()
    per_regione = Counter()          # codice -> totale
    per_regione_anno = defaultdict(Counter)  # codice -> anno -> totale
    per_categoria = Counter()        # key -> casi
    categoria_top_icd = defaultdict(Counter)
    totale = 0

    for f in sorted(glob.glob(str(RAW_DIR / "mensile_*.csv"))):
        reg_slug = Path(f).name.replace("mensile_", "").replace(".csv", "")
        codice = REGIONI.get(reg_slug)
        if codice is None:
            print(f"  ! regione sconosciuta da {Path(f).name}, salto")
            continue
        rows = leggi_csv(Path(f))
        for r in rows:
            dp = (r.get("DataProtocollo") or "").strip()
            if len(dp) != 10:
                continue
            anno, mese = dp[6:10], dp[3:5]
            per_mese[anno][int(mese)] += 1
            per_anno[anno] += 1
            per_genere[r.get("Genere", "?")] += 1
            per_regione[codice] += 1
            per_regione_anno[codice][anno] += 1
            icd = r.get("ICD10denunciato", "")
            key, nome = mappa_categoria(icd)
            per_categoria[key] += 1
            if icd.strip() and icd.strip().upper() not in {"ND"}:
                categoria_top_icd[key][icd.strip().upper()] += 1
            totale += 1

    print(f"   denunce totali: {totale}")

    # Serie mensile nazionale (soli mesi coperti dai CSV ufficiali: gen-giu 2025 e gen-giu 2026).
    # NB: non inserire zeri per mesi non pubblicati (lug-dic 2025): sarebbero falsi zero.
    mesi_nomi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]
    serie_mensile = []
    for anno in sorted(per_mese):
        for m in range(1, 7):
            serie_mensile.append({"anno": anno, "mese": m, "meseNome": mesi_nomi[m - 1], "casi": per_mese[anno].get(m, 0)})

    # Confronto I semestre
    s1_2025 = sum(per_mese["2025"].get(m, 0) for m in range(1, 7))
    s1_2026 = sum(per_mese["2026"].get(m, 0) for m in range(1, 7))
    delta = s1_2026 - s1_2025
    delta_perc = round(delta / s1_2025 * 100, 1) if s1_2025 else None

    # Categorie: ordina per casi, includi solo le prime 12
    categorie = []
    for key, casi in per_categoria.most_common():
        nome = next((n for k, n in [mappa_categoria("")] if False), "")
        # recupera nome dalla prima occorrenza: mappatura stabile
        nome = {
            "SPALLA": "Patologie della spalla (cuffia dei rotatori)",
            "RACHIDE": "Ernie e discopatie del rachide",
            "CANALICOLARI": "Sindromi canalicolari (tunnel carpale)",
            "IPOACUSIA": "Ipoacusia da rumore",
            "TENDINOPATIE": "Epicondiliti e tendinopatie",
            "TENOSINOVITI": "Tenosinoviti e patologie dei tendini",
            "MENISCO": "Lesioni del menisco",
            "ARTROSI": "Artrosi da sovraccarico",
            "SPONDILOSI": "Spondilosi e artrosi vertebrale",
            "DEFORMITA": "Deformità acquisite da sovraccarico",
            "MUSCOLOSCHELETRICO_ALTRO": "Altre malattie muscolo-scheletriche",
            "MESOTELIOMA": "Mesoteliomi (amianto)",
            "TUMORE_POLMONE": "Tumori del polmone",
            "TUMORE_VESCICA": "Tumori della vescica",
            "TUMORE_CUTE": "Tumori della cute",
            "TUMORE_ALTRO": "Altri tumori professionali",
            "POLVERI": "Patologie pleuro-polmonari da polveri",
            "STRESS": "Disturbi psichici (stress lavoro-correlato)",
            "CUTE": "Dermatosi professionali",
            "ALTRO": "Altre patologie",
            "ND": "Codice non indicato",
        }.get(key, "Altre patologie")
        top = [{"codice": c, "casi": n} for c, n in categoria_top_icd[key].most_common(5)]
        categorie.append({
            "key": key,
            "nome": nome,
            "casi": casi,
            "quota": round(casi / totale * 100, 2) if totale else 0,
            "topCodici": top,
        })

    # Regioni: ranking con delta %
    regioni = []
    for codice in sorted(REGIONI.values(), key=lambda c: int(c)):
        t = per_regione[codice]
        a25 = per_regione_anno[codice].get("2025", 0)
        a26 = per_regione_anno[codice].get("2026", 0)
        d = (a26 + a25) if False else None
        regioni.append({
            "codice": codice,
            "nome": NOMI[codice],
            "totale": t,
            "anno2025": a25,
            "anno2026": a26,
            "deltaPerc": round((a26 - a25) / a25 * 100, 1) if a25 else None,
        })
    regioni.sort(key=lambda r: r["totale"], reverse=True)

    print("2. Lettura CSV semestrali (decessi)...")
    # ---- Decessi ----
    decessi_tot = 0
    decessi_per_anno = Counter()
    decessi_per_anno_sa = Counter()  # silicosi/asbestosi
    decessi_per_regione = Counter()
    decessi_per_genere = Counter()
    decessi_eta = []

    for f in sorted(glob.glob(str(RAW_DIR / "decessi_*.csv"))):
        reg_slug = Path(f).name.replace("decessi_", "").replace(".csv", "")
        codice = REGIONI.get(reg_slug)
        if codice is None:
            continue
        for r in leggi_csv(Path(f)):
            dm = (r.get("DataMorte") or "").strip()
            anno_morte = dm[6:10] if len(dm) == 10 and dm[6:10].isdigit() else None
            if anno_morte is None:
                continue
            decessi_tot += 1
            decessi_per_anno[anno_morte] += 1
            if (r.get("MalattiaSilicosiAsbestosi") or "").strip().upper() == "S":
                decessi_per_anno_sa[anno_morte] += 1
            decessi_per_regione[codice] += 1
            decessi_per_genere[r.get("Genere", "?")] += 1
            eta = (r.get("EtaMorte") or "").strip()
            if eta.isdigit():
                decessi_eta.append(int(eta))

    decessi = {
        "totale": decessi_tot,
        "perAnno": [
            {
                "anno": a,
                "casi": decessi_per_anno[a],
                "silicosiAsbestosi": decessi_per_anno_sa.get(a, 0),
            }
            for a in sorted(decessi_per_anno)
        ],
        "perRegione": [
            {"codice": c, "nome": NOMI[c], "casi": decessi_per_regione[c]}
            for c in sorted(decessi_per_regione)
        ],
        "perGenere": dict(decessi_per_genere),
        "etaMedia": round(sum(decessi_eta) / len(decessi_eta), 1) if decessi_eta else None,
    }
    decessi["perRegione"].sort(key=lambda r: r["casi"], reverse=True)

    print(f"   decessi totali: {decessi_tot}")

    # ---- Output ----
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "datasetId": DATASET_ID,
        "generatedAt": utc_now(),
        "periodo": "Gennaio - Giugno 2025 e Gennaio - Giugno 2026",
        "nota": "La disaggregazione regionale riflette la sede INAIL competente per la protocollazione della denuncia (dove il caso è gestito), non il luogo di lavoro o la residenza del lavoratore. I CSV ufficiali coprono i primi due semestri: gen-giu 2025 e gen-giu 2026.",
        "fonte": "INAIL Open Data — DatiMensiliMalattieProfessionaliDataProt (denunce) + DatiSemestraliMalattieProfessionaliDataDec (decessi)",
        "nazionale": {
            "totale": totale,
            "perAnno": dict(per_anno),
            "perGenere": dict(per_genere),
            "confrontoPrimoSemestre": {
                "anno2025": s1_2025,
                "anno2026": s1_2026,
                "delta": delta,
                "deltaPerc": delta_perc,
            },
            "serieMensile": serie_mensile,
        },
        "categorie": categorie,
        "regioni": regioni,
        "decessi": decessi,
    }

    out = GEN_DIR / "malattie-professionali.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"3. Scritto {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
