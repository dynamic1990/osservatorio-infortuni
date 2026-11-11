#!/usr/bin/env python3
"""Scarica, valida e aggrega gli infortuni INAIL in uno snapshot verificato.

Fonte unica: i CSV mensili regionali del portale open data INAIL.

  https://dati.inail.it/opendata/downloads/daticoncadenzamensileinfortuni/zip/
      DatiConCadenzaMensileInfortuni<Regione>_csv.zip

Perché i CSV e non l'API REST:

- l'API rifiuta i nomi delle regioni con il trattino (Emilia-Romagna,
  Trentino-Alto Adige, Friuli-Venezia Giulia) con "Descrizione Regione
  errata": restavano 16-17 regioni su 20;
- i CSV usano i nomi composti senza trattino (EmiliaRomagna,
  TrentinoAltoAdige, FriuliVeneziaGiulia) e coprono tutte le 20 regioni;
- i valori coincidono con l'API dove i due si sovrappongono (verificato
  il 2026-11-11 su Lombardia, Molise, Sicilia, ValledAosta per 2025-07 e
  2026-09: stessi conteggi al record).

Vintage del dato: ogni file contiene una rilevazione per anno di
accadimento. Al 2026-11-11 la finestra è 2025-01..2026-09, con 2025 letto
alla rilevazione 30/09/2025 e 2026 alla rilevazione 30/09/2026. I mesi di
ottobre-dicembre 2025 non sono pubblicati in questa cadenza.

Produce:

    * src/data/generated/inail-infortuni-serie.json         (aggregati, non versionato)
    * src/data/generated/inail-infortuni-mensile.meta.json  (provenienza mensile, versionato)
    * src/data/generated/inail-infortuni-viste.json         (viste mensili, sovrascritte da unify_views)

Nota: `inail-infortuni-serie.meta.json` NON è di competenza di questo script.
Quel file descrive le viste consolidate 2021-2025 (cadenza semestrale) e viene
scritto da `inail_unify_views.py`. Lo snapshot mensile ha un meta separato,
così i due dataset non si sovrascrivono a vicenda.

I record singoli (pseudonimizzati) restano nel raw layer, fuori dal sito.

Esempio:
    python3 scripts/etl/inail_infortuni_snapshot.py --anno-da 2025 --anno-a 2026 --mese-a 9
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

BASE_ZIP = "https://dati.inail.it/opendata/downloads/daticoncadenzamensileinfortuni/zip"
OFFICIAL_HOST = "dati.inail.it"
USER_AGENT = "OsservatorioInfortuni-ETL/0.3 (+https://github.com/dynamic1990/osservatorio-infortuni)"
TRANSIENT_HTTP = {408, 425, 429, 500, 502, 503, 504}
MAX_RETRIES = 3
RETRY_DELAY_MS = 500

# Nome del file regionale -> codice ISTAT della regione.
# Il nome è quello usato dal portale: i composti perdono il trattino.
REGIONI_CSV = {
    "Piemonte": "01",
    "ValledAosta": "02",
    "Lombardia": "03",
    "TrentinoAltoAdige": "04",
    "Veneto": "05",
    "FriuliVeneziaGiulia": "06",
    "Liguria": "07",
    "EmiliaRomagna": "08",
    "Toscana": "09",
    "Umbria": "10",
    "Marche": "11",
    "Lazio": "12",
    "Abruzzo": "13",
    "Molise": "14",
    "Campania": "15",
    "Puglia": "16",
    "Basilicata": "17",
    "Calabria": "18",
    "Sicilia": "19",
    "Sardegna": "20",
}

CAMPI_OBBLIGATORI = (
    "DataRilevazione", "DataAccadimento", "Genere", "LuogoAccadimento",
    "Eta", "ModalitaAccadimento", "ConSenzaMezzoTrasporto",
    "IdentificativoCaso", "SettoreAttivitaEconomica", "GestioneTariffaria",
)


class StructuralError(RuntimeError):
    """La fonte ha risposto, ma il contratto non è più attendibile."""


def verifica_host(url: str) -> None:
    """Accetta solo URL https sul host ufficiale INAIL."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != OFFICIAL_HOST:
        raise StructuralError(f"URL non ufficiale: {url!r}")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def scarica_zip(regione: str, dest: Path, force: bool = False) -> Path:
    """Scarica il CSV mensile regionale, saltando se il contenuto è identico.

    Il confronto è su sha256 del file scaricato: i timestamp dei raw restano
    l'ultimo aggiornamento reale del dato, non l'ultima esecuzione dell'ETL.
    """
    url = f"{BASE_ZIP}/DatiConCadenzaMensileInfortuni{regione}_csv.zip"
    verifica_host(url)

    dest.parent.mkdir(parents=True, exist_ok=True)
    ultimo: Exception | None = None
    for tentativo in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=300) as resp:
                payload = resp.read()
            break
        except urllib.error.HTTPError as error:
            ultimo = error
            if error.code in TRANSIENT_HTTP and tentativo < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY_MS * (2**tentativo) / 1000)
                continue
            raise StructuralError(f"HTTP {error.code} da {url}") from error
        except urllib.error.URLError as error:
            ultimo = error
            time.sleep(RETRY_DELAY_MS / 1000)
    else:
        raise StructuralError(f"Impossibile scaricare {url}: {ultimo}")

    nuovo = hashlib.sha256(payload).hexdigest()
    if not force and dest.exists() and sha256_file(dest) == nuovo:
        return dest
    dest.write_bytes(payload)
    return dest


def leggi_zip(zip_path: Path) -> list[dict]:
    with zipfile.ZipFile(zip_path) as zf:
        nomi = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not nomi:
            raise StructuralError(f"{zip_path.name}: nessun CSV nello zip")
        with zf.open(nomi[0]) as raw:
            testo = io.TextIOWrapper(raw, encoding="utf-8-sig", errors="replace")
            return list(csv.DictReader(testo, delimiter=";"))


def valida_record(record: dict) -> None:
    for campo in CAMPI_OBBLIGATORI:
        if not isinstance(record.get(campo), str) or not record[campo].strip():
            raise StructuralError(f"Campo {campo!r} mancante/invalido: {record!r}")
    if record["Genere"] not in ("M", "F"):
        raise StructuralError(f"Genere non valido: {record.get('Genere')!r}")
    if record["ModalitaAccadimento"] not in ("S", "N"):
        raise StructuralError(
            f"ModalitaAccadimento non valida: {record.get('ModalitaAccadimento')!r}"
        )
    eta = record["Eta"].strip()
    if eta == "-1":
        return  # età sconosciuta (missing, come da fonte)
    if not eta.isdigit() or int(eta) > 110:
        raise StructuralError(f"Eta non valida: {record.get('Eta')!r}")
    if not record["LuogoAccadimento"].strip().isdigit():
        raise StructuralError(
            f"LuogoAccadimento non valido: {record.get('LuogoAccadimento')!r}"
        )


def data_iso(record: dict, campo: str) -> str | None:
    """Data gg/mm/aaaa -> aaaa-mm-gg, oppure None se assente."""
    valore = (record.get(campo) or "").strip()
    if len(valore) != 10 or valore[2] != "/" or valore[5] != "/":
        return None
    return f"{valore[6:10]}-{valore[3:5]}-{valore[0:2]}"


def aggrega(
    record_list: list[dict],
    codice_regione: str,
    anno_da: int,
    anno_a: int,
    mese_a: int,
) -> tuple[list[dict], dict]:
    """Aggrega i record in contatori per dimensione di lettura.

    Mai record singoli negli artefatti pubblicati: privacy + peso.
    L'esito mortale è una dimensione dell'aggregato, quindi la mortalità è
    disponibile per tutte le 20 regioni e per ogni incrocio, non solo a
    livello nazionale.
    """
    contatore: Counter[tuple] = Counter()
    fuori_finestra = 0
    rilevazioni: dict[int, Counter[str]] = {}

    for record in record_list:
        accadimento = data_iso(record, "DataAccadimento")
        if accadimento is None:
            raise StructuralError(f"DataAccadimento non valida: {record!r}")
        anno = int(accadimento[0:4])
        mese = int(accadimento[5:7])
        if anno < anno_da or anno > anno_a or mese > mese_a:
            fuori_finestra += 1
            continue

        valida_record(record)
        rilevazione = data_iso(record, "DataRilevazione") or "ND"
        rilevazioni.setdefault(anno, Counter())[rilevazione] += 1
        eta = int(record["Eta"].strip())
        esito = 1 if (record.get("DataMorte") or "").strip() else 0
        chiave = (
            anno, mese, codice_regione,
            record["LuogoAccadimento"].strip(),
            record["SettoreAttivitaEconomica"].strip(),
            (record.get("GrandeGruppoTariffario") or "ND").strip(),
            (record.get("Gestione") or "ND").strip(),
            record["GestioneTariffaria"].strip(),
            record["Genere"], eta,
            record["ModalitaAccadimento"],
            record["ConSenzaMezzoTrasporto"].strip(),
            esito,
        )
        contatore[chiave] += 1

    righe = []
    for (a, m, reg, prov, ateco, gg, gest, gest_tar, genere, eta,
         modalita, mezzo, esito), casi in contatore.items():
        righe.append({
            "key": f"{a}-{m:02d}|{reg}|{prov}|{'M' if esito else '-'}",
            "anno": a, "mese": m,
            "regione": reg, "provincia": prov,
            "settoreAteco": ateco, "grandeGruppo": gg,
            "gestione": gest, "gestioneTariffaria": gest_tar,
            "genere": genere, "eta": eta,
            "modalita": modalita, "mezzoTrasporto": mezzo,
            "esitoMortale": bool(esito), "casi": casi,
        })
    return righe, {"fuoriFinestra": fuori_finestra, "rilevazioni": rilevazioni}


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


def build_views(aggregates: list[dict], period: dict, coverage: dict) -> dict:
    """Viste precalcolate per la dashboard (piccole, versionate).

    ATTENZIONE: questo helper produce viste sul perimetro mensile e NON viene
    scritto su disco. Il file `inail-infortuni-viste.json` è di competenza di
    `inail_unify_views.py`, che lo costruisce sulla serie consolidata
    2021-2025 con la serie mensile innestata. Sovrascriverlo da qui
    romperebbe il contratto del sito (schemaVersion 2, 20 regioni, 5 anni).

    Resta disponibile per ispezione manuale e per i test.
    """
    per_mese: Counter[str] = Counter()
    per_settore: Counter[str] = Counter()
    per_regione: Counter[str] = Counter()
    per_genere: Counter[str] = Counter()
    per_fascia: Counter[str] = Counter()
    per_modalita: Counter[str] = Counter()
    per_gestione: Counter[str] = Counter()
    per_gruppo: Counter[str] = Counter()

    for row in aggregates:
        mese_key = f"{row['anno']}-{row['mese']:02d}"
        per_mese[mese_key] += row["casi"]
        per_settore[row["settoreAteco"] or "ND"] += row["casi"]
        per_regione[row["regione"]] += row["casi"]
        per_genere[row["genere"]] += row["casi"]
        per_fascia[fascia(row["eta"])] += row["casi"]
        per_modalita[row["modalita"]] += row["casi"]
        per_gestione[row["gestione"] or "ND"] += row["casi"]
        per_gruppo[row["grandeGruppo"] or "ND"] += row["casi"]

    def top(counter: Counter, n: int = 15) -> list[dict]:
        return [{"key": k, "casi": v} for k, v in counter.most_common(n)]

    return {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_viste",
        "period": period,
        "coverage": coverage,
        "serieMensile": [{"key": k, "casi": v} for k, v in sorted(per_mese.items())],
        "settori": top(per_settore),
        "regioni": [{"key": k, "casi": v} for k, v in sorted(per_regione.items(), key=lambda kv: -kv[1])],
        "generi": [{"key": k, "casi": v} for k, v in per_genere.items()],
        "fasceEta": [{"key": k, "casi": v} for k, v in per_fascia.items()],
        "modalita": [{"key": k, "casi": v} for k, v in per_modalita.items()],
        "gestioni": [{"key": k, "casi": v} for k, v in per_gestione.items()],
        "gruppiTariffari": [{"key": k, "casi": v} for k, v in per_gruppo.items()],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--anno-da", type=int, default=2025)
    parser.add_argument("--anno-a", type=int, default=datetime.now().year)
    parser.add_argument("--mese-a", type=int, default=9, choices=range(1, 13),
                        help="Mese finale (default 9: ultimo pubblicato al 2026-11-11)")
    parser.add_argument("--output-dir", type=Path, default=Path("src/data/generated"))
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--force-download", action="store_true",
                        help="Riscarica anche se lo sha256 non è cambiato")
    args = parser.parse_args()

    if args.anno_da > args.anno_a:
        print("--anno-da deve essere <= --anno-a", file=sys.stderr)
        return 2

    args.output_dir.mkdir(parents=True, exist_ok=True)

    tutti: list[dict] = []
    totale_record = 0
    regioni_ok: set[str] = set()
    province_ok: set[str] = set()
    casi_mortali = 0
    rilevazioni_per_anno: dict[int, Counter[str]] = {}
    regioni_per_anno: dict[int, set[str]] = {}
    fuori_finestra = 0

    for regione, codice in REGIONI_CSV.items():
        zip_path = args.raw_dir / f"mensile-{regione}.zip"
        scarica_zip(regione, zip_path, force=args.force_download)
        record_list = leggi_zip(zip_path)
        righe, extra = aggrega(record_list, codice, args.anno_da, args.anno_a, args.mese_a)
        fuori_finestra += extra["fuoriFinestra"]
        for anno_accadimento, contatore_rilevazioni in extra["rilevazioni"].items():
            rilevazioni_per_anno.setdefault(anno_accadimento, Counter()).update(
                contatore_rilevazioni
            )
            regioni_per_anno.setdefault(anno_accadimento, set()).add(codice)
        tutti.extend(righe)
        regioni_ok.add(codice)
        dentro = sum(r["casi"] for r in righe)
        totale_record += dentro
        casi_mortali += sum(r["casi"] for r in righe if r["esitoMortale"])
        for r in righe:
            province_ok.add(r["provincia"])
        print(f"[{regione:20s}] {len(record_list):>7d} righe -> {dentro:>7d} casi in finestra")

    if not tutti:
        print("Nessun dato scaricato", file=sys.stderr)
        return 1

    mesi_coperti = (args.anno_a - args.anno_da + 1) * args.mese_a
    period = {"annoDa": args.anno_da, "annoA": args.anno_a, "mesi": mesi_coperti}
    coverage = {
        "regioni": len(regioni_ok),
        "province": len(province_ok),
        "record": totale_record,
        "casi": sum(row["casi"] for row in tutti),
        "casiMortali": casi_mortali,
        "fuoriFinestra": fuori_finestra,
    }

    serialized = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_mensili",
        "period": period,
        "coverage": coverage,
        "aggregates": tutti,
    }

    data_path = args.output_dir / "inail-infortuni-serie.json"
    meta_path = args.output_dir / "inail-infortuni-mensile.meta.json"

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(serialized, f, ensure_ascii=False, separators=(",", ":"))

    meta = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_mensili",
        "artifactScope": "snapshot-mensile",
        "source": {
            "owner": "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
            "landingUrl": "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-mensile.html",
            "apiUrl": f"{BASE_ZIP}/DatiConCadenzaMensileInfortuni<Regione>_csv.zip",
            "license": "Italian Open Data License v2.0",
            "attribution": "INAIL Open Data",
        },
        "extractedAt": utc_now(),
        "period": period,
        "coverage": coverage,
        "limits": [
            "Copertura completa: tutte le 20 regioni, lette dai CSV mensili regionali.",
            "I mesi di ottobre-dicembre 2025 non sono pubblicati nella cadenza mensile: la serie si ferma a settembre per entrambi gli anni.",
            "Ogni anno ha una rilevazione diversa (2025 al 30/09/2025, 2026 al 30/09/2026): il confronto è a pari ritardo dalla fine del periodo, non su dati definitivi.",
            "Le denunce sono provvisorie e vengono integrate e riclassificate nel tempo. Gli esiti mortali risultano invece stabili tra rilevazioni (verificato 2026-11-11: Q3 2025 vale 190 sia a un anno di distanza sia oggi).",
            "La definizione amministrativa (positivo/negativo) non è disponibile nella cadenza mensile: arriva dalla cadenza semestrale.",
            "La finestra API REST INAIL resta più stretta (16-17 regioni, nomi senza trattino): l'ETL non la usa.",
        ],
        "methodology": [
            "I record singoli pseudonimizzati restano nel raw layer e non sono pubblicati nel sito.",
            "Le aggregazioni usano i codici così come forniti dai CSV (provincia ISTAT, ATECO, grande gruppo tariffario).",
            "L'esito mortale deriva dal campo DataMorte non nullo ed è una dimensione dell'aggregato: la mortalità è quindi disponibile per regione, settore, età e modalità.",
            "I file regionali vengono riscaricati solo se lo sha256 cambia: i timestamp dei raw riflettono l'aggiornamento reale della fonte.",
            "I valori dei CSV coincidono con quelli dell'API REST dove i due si sovrappongono (verifica puntuale su 4 regioni, 2 mesi).",
            "Il confronto tra settori richiede denominatori (occupati) che non sono in questo dataset.",
        ],
        "vintage": {
            anno: {
                "rilevazioni": sorted(rilevazioni_per_anno.get(anno, Counter()).keys()),
                "regioni": len(regioni_per_anno.get(anno, set())),
            }
            for anno in sorted(rilevazioni_per_anno)
        },
        "dataArtifactSha256": sha256_file(data_path),
        "dataArtifactBytes": data_path.stat().st_size,
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\nSnapshot: {data_path}")
    print(f"Meta:     {meta_path}")
    print(
        f"Record in finestra: {totale_record}, aggregati: {len(tutti)}, "
        f"regioni: {len(regioni_ok)}, province: {len(province_ok)}, mortali: {casi_mortali}"
    )
    print(f"Vintage: {json.dumps(meta['vintage'], ensure_ascii=False)}")
    print("Nota: le viste del sito le scrive inail_unify_views.py (serie consolidata).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
