#!/usr/bin/env python3
"""ETL notizie infortuni sul lavoro (Italia).

Aggrega le ultime notizie da Google News RSS (query: infortunio mortale/grave
sul lavoro) e produce src/data/generated/news-infortuni.json per la dashboard.

Uso:
  python3 scripts/etl/aggiorna_news_infortuni.py
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"
OUT = GEN / "news-infortuni.json"

QUERIES = [
    "infortunio mortale lavoro",
    "operaio morto cantiere",
    "infortunio grave lavoro oggi",
    "incidente sul lavoro mortale",
]

MAX_ITEMS = 40
MAX_KEEP = 25  # notizie conservate nel file


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fetch_rss(query: str) -> list[dict]:
    q = urllib.parse.quote(query)
    url = (
        f"https://news.google.com/rss/search?q={q}"
        f"+when:7d&hl=it&gl=IT&ceid=IT:it"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        xml_content = resp.read()
    root = ET.fromstring(xml_content)
    items = []
    for it in root.findall(".//item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        pub = (it.findtext("pubDate") or "").strip()
        source = it.findtext("source") or ""
        if not title or not link:
            continue
        # Google News mette la fonte nel titolo: "Titolo - Fonte"
        clean = title
        src = source.strip()
        if " - " in clean:
            parts = clean.rsplit(" - ", 1)
            if src and parts[-1].strip() == src:
                clean = parts[0].strip()
            elif src:
                clean = parts[0].strip()
        items.append({
            "titolo": clean,
            "fonte": src or "Cronaca",
            "link": link,
            "data": pub,
        })
    return items


def classify(titolo: str) -> str:
    t = titolo.lower()
    if any(k in t for k in ("mort", "decedut", "muore", "muoiono", "perde la vita", "uccis", "strage")):
        return "mortale"
    if any(k in t for k in ("grav", "prognosi riservata", "rianimazion", "eliambulanza", "intubat", "amputazion")):
        return "grave"
    return "altro"


def dedupe(items: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for it in sorted(items, key=lambda x: x["data"], reverse=True):
        key = re.sub(r"[^a-z0-9]+", "", it["titolo"].lower())[:60]
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out


def main() -> int:
    tutti: list[dict] = []
    for q in QUERIES:
        try:
            tutti.extend(fetch_rss(q))
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] query '{q}' fallita: {exc}")

    notizie = dedupe(tutti)[:MAX_KEEP]
    for n in notizie:
        n["categoria"] = classify(n["titolo"])

    payload = {
        "schemaVersion": 1,
        "datasetId": "news_infortuni",
        "generatedAt": utc_now(),
        "fonte": "Google News RSS (query: infortuni sul lavoro Italia)",
        "periodo": "ultimi 7 giorni",
        "notizie": notizie,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] {len(notizie)} notizie -> {OUT}")
    for n in notizie[:5]:
        print(f"  [{n['categoria']}] {n['titolo']} ({n['fonte']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
