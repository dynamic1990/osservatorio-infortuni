#!/usr/bin/env python3
"""Scarica, valida e aggrega gli infortuni INAIL in uno snapshot verificato.

Seguendo il modello di DoveVannoINostriSoldi:

- scarica solo da endpoint ufficiali INAIL (host verificato);
- ritenta con backoff sui codici HTTP transitori;
- fallisce in modo esplicito (StructuralError) se il contratto non è più attendibile;
- produce due artefatti:
    * src/data/generated/inail-infortuni-serie.json      (aggregati, mai record singoli)
    * src/data/generated/inail-infortuni-serie.meta.json (provenienza, copertura, limiti)

I record singoli (pseudonimizzati) restano nel raw layer, fuori dal sito.

Nota: l'API REST espone una finestra di circa 18 mesi (verificato 2026-08-27:
dal 2025-01 al 2026-06). Per serie storiche più lunghe servono i dataset CSV
completi del portale (fase 2).

Esempio:
    python3 scripts/etl/inail_infortuni_snapshot.py --anno-da 2025 --anno-a 2026
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

API_URL = "https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni"
OFFICIAL_HOST = "dati.inail.it"
USER_AGENT = "OsservatorioInfortuni-ETL/0.1 (+https://github.com/dynamic1990/osservatorio-infortuni)"
TRANSIENT_HTTP = {408, 425, 429, 500, 502, 503, 504}
MAX_RETRIES = 3
RETRY_DELAY_MS = 500

# Regioni accettate dall'API (verificate il 2026-08-27).
# Nomi composti non ancora risolti: Valle d'Aosta, Trentino-Alto Adige,
# Friuli-Venezia Giulia, Emilia-Romagna (da investigare, vedi TODO).
REGIONI = [
    "Piemonte", "Lombardia", "Veneto", "Liguria", "Toscana", "Umbria",
    "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia",
    "Basilicata", "Calabria", "Sicilia", "Sardegna",
]

# Mappa codice regione ISTAT -> nome (per aggregazione)
CODICE_REGIONE = {
    1: "Piemonte", 2: "Valle d'Aosta", 3: "Lombardia", 4: "Trentino-Alto Adige",
    5: "Veneto", 6: "Friuli-Venezia Giulia", 7: "Liguria", 8: "Emilia-Romagna",
    9: "Toscana", 10: "Umbria", 11: "Marche", 12: "Lazio", 13: "Abruzzo",
    14: "Molise", 15: "Campania", 16: "Puglia", 17: "Basilicata",
    18: "Calabria", 19: "Sicilia", 20: "Sardegna",
}


class StructuralError(RuntimeError):
    """L'API ha risposto, ma il contratto non è più attendibile."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch_json(url: str) -> dict:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != OFFICIAL_HOST:
        raise StructuralError(f"URL non ufficiale: {url!r}")

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as error:
            if error.code in TRANSIENT_HTTP and attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY_MS * (2**attempt) / 1000)
                last_error = error
                continue
            body = error.read(200).decode("utf-8", "replace")
            if error.code == 500 and "Dati non trovati" in body:
                return None  # mese/anno non disponibile (finestra API), non è un errore
            raise StructuralError(f"HTTP {error.code} da {url}: {body}") from error
        except urllib.error.URLError as error:
            last_error = error
            time.sleep(RETRY_DELAY_MS / 1000)
    raise StructuralError(f"Impossibile scaricare {url}: {last_error}")


def fetch_regione_mese(regione: str, anno: int, mese: int) -> list[dict]:
    params = urllib.parse.urlencode({
        "Regione": regione,
        "AnnoAccadimento": anno,
        "MeseAccadimento": f"{mese:02d}",
    })
    data = fetch_json(f"{API_URL}?{params}")
    if data is None:
        return None  # non disponibile
    records = data.get("DatiConCadenzaMensileInfortuni")
    if records is None:
        raise StructuralError(f"Chiave DatiConCadenzaMensileInfortuni assente per {regione} {anno}-{mese:02d}")
    return records


def validate_record(record: dict, regione: str, anno: int, mese: int) -> None:
    for field in ("DataAccadimento", "DataRilevazione", "Genere", "LuogoAccadimento",
                  "Eta", "ModalitaAccadimento", "ConSenzaMezzoTrasporto",
                  "IdentificativoCaso", "SettoreAttivitaEconomica", "GestioneTariffaria"):
        if not isinstance(record.get(field), str) or not record[field]:
            raise StructuralError(
                f"Campo {field!r} mancante/invalido per {regione} {anno}-{mese:02d}: {record!r}"
            )
    if record["Genere"] not in ("M", "F"):
        raise StructuralError(f"Genere non valido: {record.get('Genere')!r}")
    if record["ModalitaAccadimento"] not in ("S", "N"):
        raise StructuralError(f"ModalitaAccadimento non valida: {record.get('ModalitaAccadimento')!r}")
    eta = record["Eta"]
    if eta == "-1":
        return  # età sconosciuta (missing, come da fonte)
    if not eta.isdigit() or int(eta) > 110:
        raise StructuralError(f"Eta non valida: {eta!r}")
    if not record["LuogoAccadimento"].isdigit():
        raise StructuralError(f"LuogoAccadimento non valido: {record.get('LuogoAccadimento')!r}")


def aggregate(records: list[dict], regione: str, anno: int, mese: int) -> list[dict]:
    """Aggrega i record in contatori per dimensione di lettura.

    Mai record singoli negli artefatti pubblicati: privacy + peso.
    """
    counter: Counter[tuple] = Counter()
    mortali = 0
    for record in records:
        validate_record(record, regione, anno, mese)
        key = (
            anno, mese,
            record["Regione"], record["LuogoAccadimento"],
            record["SettoreAttivitaEconomica"], record["GrandeGruppoTariffario"],
            record["Gestione"], record["GestioneTariffaria"],
            record["Genere"], int(record["Eta"]),
            record["ModalitaAccadimento"], record["ConSenzaMezzoTrasporto"],
        )
        counter[key] += 1
        if record.get("DataMorte"):
            mortali += 1
    rows = []
    for (a, m, reg, prov, ateco, gg, gest, gest_tar, genere, eta, modalita, mezzo), casi in counter.items():
        rows.append({
            "key": f"{a}-{m:02d}|{reg}|{prov}",
            "anno": a, "mese": m,
            "regione": reg, "provincia": prov,
            "settoreAteco": ateco, "grandeGruppo": gg,
            "gestione": gest, "gestioneTariffaria": gest_tar,
            "genere": genere, "eta": eta,
            "modalita": modalita, "mezzoTrasporto": mezzo,
            "esitoMortale": False, "casi": casi,
        })
    # Nota: gli esiti mortali vengono conteggiati a parte nel meta (coverage),
    # la granularità completa esito x dimensione arriva in fase 2 con il semestrale.
    return rows


def build_views(aggregates: list[dict], period: dict, coverage: dict) -> dict:
    """Viste precalcolate per la dashboard (piccole, versionate).

    Lo snapshot completo resta nel file serie (rigenerabile); il sito
    carica solo queste viste per restare leggero.
    """
    per_mese: Counter[str] = Counter()
    per_settore: Counter[str] = Counter()
    per_regione: Counter[str] = Counter()
    per_genere: Counter[str] = Counter()
    per_fascia: Counter[str] = Counter()
    per_modalita: Counter[str] = Counter()
    per_gestione: Counter[str] = Counter()
    per_gruppo: Counter[str] = Counter()

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
    parser.add_argument("--anno-da", type=int, default=2020)
    parser.add_argument("--anno-a", type=int, default=datetime.now().year - 1)
    parser.add_argument("--mese-a", type=int, default=6, choices=range(1, 13),
                        help="Mese finale (default 6: la finestra API arriva a giugno)")
    parser.add_argument("--output-dir", type=Path, default=Path("src/data/generated"))
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    args = parser.parse_args()

    if args.anno_da > args.anno_a:
        print("--anno-da deve essere <= --anno-a", file=sys.stderr)
        return 2

    raw_dir = args.raw_dir
    raw_dir.mkdir(parents=True, exist_ok=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    tutti: list[dict] = []
    totale_record = 0
    regioni_ok: set[str] = set()
    province_ok: set[str] = set()
    casi_mortali = 0

    for anno in range(args.anno_da, args.anno_a + 1):
        for mese in range(1, args.mese_a + 1):
            for regione in REGIONI:
                raw_path = raw_dir / f"infortuni-{regione.lower()}-{anno}-{mese:02d}.json"
                if raw_path.exists() and raw_path.stat().st_size > 0:
                    # Già scaricato: riavvii idempotenti, rileggi e aggrega.
                    with open(raw_path, encoding="utf-8") as f:
                        fetched = json.load(f)["record"]
                else:
                    fetched = fetch_regione_mese(regione, anno, mese)
                    if fetched is None:
                        continue  # finestra API: mese non disponibile
                    # Raw layer: salva i record grezzi (gitignored)
                    with open(raw_path, "w", encoding="utf-8") as f:
                        json.dump({"fonte": API_URL, "regione": regione, "anno": anno, "mese": mese, "record": fetched}, f, ensure_ascii=False)
                    time.sleep(0.15)  # gentilezza verso l'API
                tutti.extend(aggregate(fetched, regione, anno, mese))
                totale_record += len(fetched)
                regioni_ok.add(regione)
                for r in fetched:
                    province_ok.add(r["LuogoAccadimento"])
                    if r.get("DataMorte"):
                        casi_mortali += 1

    if not tutti:
        print("Nessun dato scaricato", file=sys.stderr)
        return 1

    serialized = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_mensili",
        "period": {"annoDa": args.anno_da, "annoA": args.anno_a, "mesi": (args.anno_a - args.anno_da + 1) * args.mese_a},
        "coverage": {
            "regioni": len(regioni_ok),
            "province": len(province_ok),
            "record": totale_record,
            "casi": sum(row["casi"] for row in tutti),
        },
        "aggregates": tutti,
    }

    data_path = args.output_dir / "inail-infortuni-serie.json"
    meta_path = args.output_dir / "inail-infortuni-serie.meta.json"

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(serialized, f, ensure_ascii=False, separators=(",", ":"))

    meta = {
        "schemaVersion": 1,
        "datasetId": "inail_infortuni_mensili",
        "source": {
            "owner": "INAIL – Istituto Nazionale Assicurazione contro gli Infortuni sul Lavoro",
            "landingUrl": "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-mensile.html",
            "apiUrl": API_URL,
            "license": "Da verificare (open data INAIL)",
            "attribution": "INAIL Open Data",
        },
        "extractedAt": utc_now(),
        "period": {"annoDa": args.anno_da, "annoA": args.anno_a, "mesi": (args.anno_a - args.anno_da + 1) * args.mese_a},
        "coverage": {
            "regioni": len(regioni_ok),
            "province": len(province_ok),
            "record": totale_record,
            "casi": sum(row["casi"] for row in tutti),
            "casiMortali": casi_mortali,
        },
        "limits": [
            "Sono incluse solo le regioni i cui nomi sono accettati dall'API INAIL (16 su 20 al 2026-08-27).",
            "La definizione amministrativa (positivo/negativo) non è disponibile nella cadenza mensile.",
            "Esito mortale rilevato dal campo DataMorte non nullo; la conferma amministrativa è nel semestrale.",
            "L'API REST INAIL espone una finestra di circa 18 mesi: per serie storiche più lunghe servono i dataset CSV completi del portale.",
            "Le serie storiche vanno lette con cautela: dal 2026 è attiva la nuova classificazione ATECO e la nuova suddivisione delle province della Sardegna.",
        ],
        "methodology": [
            "I record singoli pseudonimizzati restano nel raw layer e non sono pubblicati nel sito.",
            "Le aggregazioni usano i codici così come forniti dall'API (regione/provincia ISTAT, ATECO, grande gruppo tariffario).",
            "Il confronto tra settori richiede denominatori (occupati) che non sono in questo dataset.",
        ],
        "dataArtifactSha256": sha256_file(data_path),
        "dataArtifactBytes": data_path.stat().st_size,
    }
    viste = build_views(tutti, serialized["period"], serialized["coverage"])
    viste_path = args.output_dir / "inail-infortuni-viste.json"
    with open(viste_path, "w", encoding="utf-8") as f:
        json.dump(viste, f, ensure_ascii=False, separators=(",", ":"))

    # Il file completo (serie) non viene versionato (grande); il meta e le
    # viste sì. Lo snapshot si rigenera con questo script.
    print(f"Viste:    {viste_path} ({viste_path.stat().st_size} bytes)")

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\nSnapshot: {data_path}")
    print(f"Meta:     {meta_path}")
    print(f"Record scaricati: {totale_record}, aggregati: {len(tutti)}, regioni: {len(regioni_ok)}, province: {len(province_ok)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
