#!/usr/bin/env python3
"""Controllo mensile, non distruttivo, delle fonti dell'Osservatorio.

Il controllo esclude intenzionalmente Google News/Radar. Non scarica né modifica
 i dataset pubblicati: verifica raggiungibilità, tipo di contenuto, intestazioni
 HTTP e segnali di aggiornamento nei contenuti disponibili.
"""
from __future__ import annotations

import re
import sys
import hashlib
import json
import argparse
from pathlib import Path
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone

TIMEOUT = 25
USER_AGENT = "OsservatorioInfortuni-FonteAudit/1.0"
STATE_FILE = Path.home() / ".cache" / "osservatorio-infortuni" / "source-audit-state.json"

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

    def as_dict(self) -> dict[str, str]:
        return {
            "label": self.label,
            "url": self.url,
            "status": self.status,
            "detail": self.detail,
            "signals": self.signals,
        }


def fetch(url: str, *, inspect_body: bool = False) -> Check:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            body = response.read(128_000) if inspect_body else b""
            content_type = response.headers.get("Content-Type", "?")
            last_modified = response.headers.get("Last-Modified", "n/d")
            status = getattr(response, "status", 200)
            text = body.decode("utf-8", errors="ignore")
            years = sorted(set(re.findall(r"\b20(?:2[0-9]|1[4-9])\b", text)))
            signals = f"anni rilevati: {', '.join(years[-8:]) or 'n/d'}; Last-Modified: {last_modified}"
            digest = hashlib.sha256(body).hexdigest()[:16] if body else ""
            return Check("", url, "OK" if status < 400 else "WARN", f"HTTP {status}, {content_type}, {len(body)} byte", signals + (f"; fingerprint: {digest}" if digest else ""))
    except urllib.error.HTTPError as exc:
        return Check("", url, "WARN", f"HTTP {exc.code} {exc.reason}", "")
    except Exception as exc:  # rete, DNS, timeout, TLS
        return Check("", url, "FAIL", f"{type(exc).__name__}: {exc}", "")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--report",
        type=Path,
        help="scrive anche un report JSON nel percorso indicato",
    )
    parser.add_argument(
        "--state",
        type=Path,
        default=STATE_FILE,
        help="percorso della baseline persistente (default: cache utente)",
    )
    args = parser.parse_args()
    now = datetime.now(timezone.utc).astimezone()
    print(f"AUDIT FONTI OSSERVATORIO | {now:%Y-%m-%d}")
    print("Radar escluso. Controllo non distruttivo, nessuna integrazione automatica.")
    failures = warnings = 0
    args.state.parent.mkdir(parents=True, exist_ok=True)
    try:
        old_state = json.loads(args.state.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        old_state = {}
    new_state: dict[str, dict[str, str]] = {}
    changes: list[str] = []
    checks: list[Check] = []
    for label, landing, api in SOURCES:
        for kind, url in (("landing", landing), ("endpoint", api)):
            # Il corpo della landing page cambia spesso per motivi editoriali.
            # Per rilevare nuovi dati confrontiamo solo gli endpoint dati.
            result = fetch(url, inspect_body=(kind == "endpoint" and "informo" not in label.lower()))
            result.label = label
            checks.append(result)
            if kind == "endpoint" and "fingerprint:" in result.signals:
                fingerprint = result.signals.rsplit("fingerprint: ", 1)[1]
                new_state[url] = {"fingerprint": fingerprint, "signals": result.signals}
                previous = old_state.get(url, {}).get("fingerprint")
                if previous and previous != fingerprint:
                    changes.append(f"{label}: contenuto dell'endpoint cambiato")
                elif not previous:
                    changes.append(f"{label}: baseline iniziale registrata")
            if result.status != "OK":
                changes.append(f"{label} ({kind}): {result.status}, {result.detail}")
            failures += result.status == "FAIL"
            warnings += result.status == "WARN"
    args.state.write_text(json.dumps(new_state, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ESITO")
    print(f"- fonti controllate: {len(SOURCES)}, endpoint dati: {len(new_state)}")
    print(f"- errori: {failures}")
    print(f"- avvisi: {warnings}")
    print(f"- endpoint con contenuto cambiato: {len([x for x in changes if 'baseline' not in x])}")
    if changes:
        print("- segnalazioni:")
        for change in changes:
            # Una riga per fonte, senza riversare nel messaggio il contenuto
            # degli endpoint o metadati tecnici non utili alla decisione.
            print(f"  - {change}")
    else:
        print("- nessun cambiamento rilevato rispetto all'audit precedente")
    print("- decisione: nessuna integrazione automatica; valutazione con Damiano prima di modificare i dataset.")
    if args.report:
        report = {
            "schemaVersion": 1,
            "generatedAt": now.isoformat(),
            "audit": "official-sources",
            "radarExcluded": True,
            "automaticIntegration": False,
            "summary": {
                "sources": len(SOURCES),
                "checks": len(checks),
                "failures": failures,
                "warnings": warnings,
                "changedEndpoints": len([x for x in changes if "baseline" not in x]),
            },
            "checks": [check.as_dict() for check in checks],
            "signals": changes,
        }
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"- report JSON: {args.report}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
