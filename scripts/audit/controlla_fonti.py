#!/usr/bin/env python3
"""Controllo mensile, non distruttivo, delle fonti dell'Osservatorio.

Il controllo esclude intenzionalmente Google News/Radar. Non scarica né modifica
 i dataset pubblicati: verifica raggiungibilità, tipo di contenuto, intestazioni
 HTTP e segnali di aggiornamento nei contenuti disponibili.
"""
from __future__ import annotations

import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone

TIMEOUT = 25
USER_AGENT = "OsservatorioInfortuni-FonteAudit/1.0"

SOURCES = [
    ("INAIL infortuni mensili", "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-mensile.html", "https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni"),
    ("INAIL infortuni semestrali", "https://dati.inail.it/portale/it/dataset/infortuni-sul-lavoro/dati-con-cadenza-semestrale.html", "https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni"),
    ("INAIL malattie professionali mensili", "https://dati.inail.it/portale/it/dataset/malattie-professionali/dati-con-cadenza-mensile.html", "https://dati.inail.it/opendata/downloads/datimensilimalattieprofessionali/csv/DatiMensiliMalattieProfessionaliDataProtLazio.csv"),
    ("INAIL malattie professionali semestrali", "https://dati.inail.it/portale/it/dataset/malattie-professionali/dati-con-cadenza-semestrale.html", "https://dati.inail.it/opendata/downloads/datisemestralimalattieprofessionali/csv/DatiSemestraliMalattieProfessionaliDataDecLazio.csv"),
    ("Eurostat ESAW", "https://ec.europa.eu/eurostat/databrowser/view/hsw_mi01/default/table?lang=it", "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hsw_mi01"),
    ("ISTAT/Eurostat occupati", "https://ec.europa.eu/eurostat/databrowser/view/lfst_r_lfe2emp/default/table?lang=it", "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/lfst_r_lfe2emp"),
    ("INAIL Infor.MO", "https://www.inail.it/nsol-informo/", "https://www.inail.it/nsol-informo/filtra.do"),
    ("INL rapporti vigilanza", "https://www.ispettorato.gov.it/attivita-studi-e-statistiche/monitoraggio-e-report/rapporti-annuali-sullattivita-di-vigilanza-in-materia-di-lavoro-e-previdenziale/", "https://www.ispettorato.gov.it/files/2026/04/INL-Relazione-annuale-e-rapporto-vigilanza-2025.pdf"),
]

@dataclass
class Check:
    label: str
    url: str
    status: str
    detail: str
    signals: str


def fetch(url: str) -> Check:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            body = response.read(256_000)
            content_type = response.headers.get("Content-Type", "?")
            last_modified = response.headers.get("Last-Modified", "n/d")
            status = getattr(response, "status", 200)
            text = body.decode("utf-8", errors="ignore")
            years = sorted(set(re.findall(r"\b20(?:2[0-9]|1[4-9])\b", text)))
            signals = f"anni rilevati: {', '.join(years[-8:]) or 'n/d'}; Last-Modified: {last_modified}"
            return Check("", url, "OK" if status < 400 else "WARN", f"HTTP {status}, {content_type}, {len(body)} byte", signals)
    except urllib.error.HTTPError as exc:
        return Check("", url, "WARN", f"HTTP {exc.code} {exc.reason}", "")
    except Exception as exc:  # rete, DNS, timeout, TLS
        return Check("", url, "FAIL", f"{type(exc).__name__}: {exc}", "")


def main() -> int:
    now = datetime.now(timezone.utc).astimezone()
    print(f"AUDIT MENSILE FONTI OSSERVATORIO | {now:%Y-%m-%d %H:%M %Z}")
    print("Controllo non distruttivo. Radar Google News escluso. Nessun dataset modificato.")
    print()
    failures = warnings = 0
    for label, landing, api in SOURCES:
        print(f"## {label}")
        for kind, url in (("landing", landing), ("endpoint", api)):
            result = fetch(url)
            result.label = label
            print(f"- {kind}: **{result.status}** | {result.detail}")
            if result.signals:
                print(f"  {result.signals}")
            failures += result.status == "FAIL"
            warnings += result.status == "WARN"
        print()
    print("ESITO")
    print(f"- fonti controllate: {len(SOURCES)}")
    print(f"- errori: {failures}")
    print(f"- avvisi: {warnings}")
    print("- decisione: nessuna integrazione automatica; valutazione con Damiano prima di modificare i dataset.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
