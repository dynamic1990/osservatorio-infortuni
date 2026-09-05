#!/usr/bin/env python3
"""Scarica il dettaglio completo dei casi Infor.MO (INAIL) e salva il dataset.

Per ogni caso mortale (lista estratta già con estrai_informo.py):
  - GET  /nsol-informo/dettaglio.do?codiceInfortunio=N   -> narrativa della
    dinamica (testo) + id dei fattori causali presenti nella pagina
  - POST /nsol-informo/dettagliInfortunio.do  (body: N)  -> campi strutturati
    del caso (data, sede/natura lesione, profilo, azienda, incidente, agente)
  - POST /nsol-informo/dettaglioFattore.do    (body: id) -> classificazione del
    singolo fattore (determinante/modulatore, problema di sicurezza, standard)

Output:
  src/data/generated/informo-mortali-dettaglio.json   dataset completo casi
  data/etl_cache/informo_dettaglio_ckpt.json          checkpoint per riprendere

Il processo e' riprendibile: i casi gia' processati vengono letti dal
checkpoint all'avvio. Rate limit cautelativo configurabile (--delay).
"""
from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / "data" / "etl_cache"
OUT_DIR = ROOT / "src" / "data" / "generated"
DETTAGLIO_URL = "https://www.inail.it/nsol-informo/dettaglio.do"
DETTAGLI_JSON_URL = "https://www.inail.it/nsol-informo/dettagliInfortunio.do"
FATTORE_URL = "https://www.inail.it/nsol-informo/dettaglioFattore.do"
UA = "Osservatorio-Infortuni-ETL/2.0 (analisi casi mortali)"


def http_json(url: str, payload, timeout: float = 30.0, retries: int = 4):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"), method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json",
                 "User-Agent": UA},
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.load(resp)
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"POST {url} fallito: {exc}") from exc
            time.sleep(2 ** attempt)


def http_get(url: str, timeout: float = 30.0, retries: int = 4) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"GET {url} fallito: {exc}") from exc
            time.sleep(2 ** attempt)


def clean_text(value) -> str | None:
    if value is None:
        return None
    text = html.unescape(re.sub(r"<[^>]+>", " ", str(value)))
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def estrai_dinamica_e_fattori(page: str) -> tuple[str | None, list[dict]]:
    """Estrae dalla pagina di dettaglio la narrativa e l'elenco id fattori."""
    dinamica = None
    m = re.search(
        r"Descrizione della dinamica e dei relativi fattori</h3>\s*<p>(.*?)</p>",
        page, re.S,
    )
    if m:
        dinamica = clean_text(m.group(1))

    fattori: list[dict] = []
    for m in re.finditer(r"apriDettagliFattore\((\d+)\)", page):
        fid = int(m.group(1))
        before = page[max(0, m.start() - 4000):m.start()]
        pm = re.findall(r"<p[^>]*>(.*?)</p>", before, re.S)
        testo = clean_text(pm[-1]) if pm else None
        fattori.append({"id": fid, "testo": testo})
    visti = set()
    unici = []
    for f in fattori:
        if f["id"] not in visti:
            visti.add(f["id"])
            unici.append(f)
    return dinamica, unici


def fetch_fattore(fid: int) -> dict:
    res = http_json(FATTORE_URL, fid)
    if not isinstance(res, dict):
        res = {}
    return {
        "id": res.get("codiceFattore") or fid,
        "tipoFattore": clean_text(res.get("tipoFattore")),
        "testo": clean_text(res.get("descrizioneFattore")),
        "detMod": clean_text(res.get("detMod")),
        "tipoMod": clean_text(res.get("tipoMod")),
        "problemaSicurezza": clean_text(res.get("descrizioneProblSic")),
        "confrontoStandard": clean_text(res.get("confrontoStand")),
        "valutazioneRischi": clean_text(res.get("valRisc")),
        "statoProcesso": clean_text(res.get("statoProc")),
    }


def fetch_caso(anno: int, codice: int, delay: float) -> dict:
    page = http_get(f"{DETTAGLIO_URL}?codiceInfortunio={codice}")
    dinamica, fattori_pagina = estrai_dinamica_e_fattori(page)
    time.sleep(delay)

    lavoratori = http_json(DETTAGLI_JSON_URL, codice)
    if not isinstance(lavoratori, list) or not lavoratori:
        lavoratori = [{}]
    time.sleep(delay)

    fattori = []
    for f in fattori_pagina:
        try:
            dettaglio = fetch_fattore(f["id"])
            if f["testo"]:
                dettaglio["testo"] = f["testo"]
            fattori.append(dettaglio)
        except Exception as exc:  # noqa: BLE001 - un fattore rotto non blocca il caso
            fattori.append({"id": f["id"], "testo": f.get("testo"),
                            "errore": str(exc)[:200]})
        time.sleep(delay)

    base = {}
    if lavoratori and isinstance(lavoratori[0], dict):
        base = {
            k: clean_text(lavoratori[0].get(k))
            for k in ("dataInfortunio", "oraLavoro", "flagColl", "sedeLesione",
                      "naturaLesione", "sesso", "cittadinanza", "rapLav",
                      "mansione", "anzianita", "numAddetti", "attPrev", "luogo",
                      "tipoAtt", "agente", "variazEnergia", "incidente",
                      "agenteMatInc", "numeroGiorniAssenza")
        }
    return {"anno": anno, "codiceInfortunio": codice, "dinamica": dinamica,
            "fattori": fattori, **base}


def load_ckpt() -> dict:
    ckpt = CACHE_DIR / "informo_dettaglio_ckpt.json"
    if ckpt.exists():
        return json.loads(ckpt.read_text(encoding="utf-8"))
    return {"casi": {}, "fattori_cache": {}}


def save_ckpt(state: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = CACHE_DIR / "informo_dettaglio_ckpt.json.tmp"
    tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
    tmp.replace(CACHE_DIR / "informo_dettaglio_ckpt.json")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--delay", type=float, default=0.15)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--input", type=Path, default=OUT_DIR / "informo-mortali.json")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    inventario = json.loads(args.input.read_text(encoding="utf-8"))
    casi = sorted({(a["anno"], r["codiceInfortunio"])
                   for a in inventario["anni"] for r in a.get("record", [])})
    print(f"[informo-dettaglio] {len(casi)} casi da processare", flush=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    state = {"casi": {}, "fattori_cache": {}} if args.force else load_ckpt()

    da_fare = [t for t in casi if str(t[1]) not in state["casi"]]
    print(f"[informo-dettaglio] gia' fatti {len(casi) - len(da_fare)}, "
          f"rimanenti {len(da_fare)}", flush=True)

    def processa(item):
        anno, codice = item
        return anno, codice, fetch_caso(anno, codice, args.delay)

    done = 0
    start = time.monotonic()
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
            for anno, codice, caso in ex.map(processa, da_fare, chunksize=8):
                state["casi"][str(codice)] = caso
                done += 1
                if done % 25 == 0:
                    save_ckpt(state)
                    rate = done / max(time.monotonic() - start, 0.1)
                    print(f"[informo-dettaglio] {done}/{len(da_fare)} a {rate:.1f}/s",
                          flush=True)
    except KeyboardInterrupt:
        print("[informo-dettaglio] interrotto, checkpoint salvato", flush=True)

    save_ckpt(state)

    casi_out = [state["casi"][str(c)] for (_, c) in casi if str(c) in state["casi"]]
    casi_out.sort(key=lambda c: (c["anno"], c["codiceInfortunio"]))
    dataset = {
        "meta": {
            "fonte": "INAIL - Infor.MO / InformoWeb (dettaglio casi)",
            "endpointDettaglio": DETTAGLIO_URL,
            "endpointJson": DETTAGLI_JSON_URL,
            "endpointFattore": FATTORE_URL,
            "tipoEvento": "1 (mortali)",
            "periodo": "2020-2024",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "nota": "Dataset di dettaglio: narrativa dinamica, fattori causali "
                    "classificati, profilo lavoratore e azienda. I conteggi "
                    "aggregati per anno restano quelli di filtri.entry "
                    "(estrai_informo.py).",
        },
        "casi": casi_out,
    }
    out = OUT_DIR / "informo-mortali-dettaglio.json"
    out.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf-8")
    print(f"[informo-dettaglio] salvato {out} con {len(casi)} casi", flush=True)


if __name__ == "__main__":
    main()