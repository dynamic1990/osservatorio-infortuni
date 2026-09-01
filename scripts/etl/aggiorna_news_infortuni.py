#!/usr/bin/env python3
"""ETL notizie infortuni sul lavoro (Italia).

Aggrega le ultime notizie da Google News RSS (query: infortunio mortale/grave
sul lavoro) e produce src/data/generated/news-infortuni.json per la dashboard.

Caratteristiche:
- mantiene solo notizie classificate gravi o mortali (escluse le generiche);
- esclude gli infortuni in itinere (tragitto casa-lavoro e simili);
- estrae dal titolo la provincia e la regione dell'evento (best-effort);
- ogni voce mantiene link, fonte e data per rimandare all'originale.

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

MAX_ITEMS = 60
MAX_KEEP = 25  # notizie conservate nel file

# ---------------------------------------------------------------------------
# Riferimenti geografici (provincia -> regione)
# ---------------------------------------------------------------------------

PROVINCE = [
    ("Agrigento", "Sicilia"), ("Alessandria", "Piemonte"), ("Ancona", "Marche"),
    ("Aosta", "Valle d'Aosta"), ("Arezzo", "Toscana"), ("Ascoli Piceno", "Marche"),
    ("Asti", "Piemonte"), ("Avellino", "Campania"), ("Bari", "Puglia"),
    ("Barletta", "Puglia"), ("Belluno", "Veneto"), ("Benevento", "Campania"),
    ("Bergamo", "Lombardia"), ("Biella", "Piemonte"), ("Bologna", "Emilia-Romagna"),
    ("Bolzano", "Trentino-Alto Adige"), ("Brescia", "Lombardia"), ("Brindisi", "Puglia"),
    ("Cagliari", "Sardegna"), ("Caltanissetta", "Sicilia"), ("Campobasso", "Molise"),
    ("Caserta", "Campania"), ("Catania", "Sicilia"), ("Catanzaro", "Calabria"),
    ("Chieti", "Abruzzo"), ("Como", "Lombardia"), ("Cosenza", "Calabria"),
    ("Cremona", "Lombardia"), ("Crotone", "Calabria"), ("Cuneo", "Piemonte"),
    ("Enna", "Sicilia"), ("Ferrara", "Emilia-Romagna"), ("Firenze", "Toscana"),
    ("Foggia", "Puglia"), ("Forlì", "Emilia-Romagna"), ("Forlì-Cesena", "Emilia-Romagna"),
    ("Frosinone", "Lazio"), ("Genova", "Liguria"), ("Gorizia", "Friuli-Venezia Giulia"),
    ("Grosseto", "Toscana"), ("Imperia", "Liguria"), ("Isernia", "Molise"),
    ("L'Aquila", "Abruzzo"), ("La Spezia", "Liguria"), ("Latina", "Lazio"),
    ("Lecce", "Puglia"), ("Lecco", "Lombardia"), ("Livorno", "Toscana"),
    ("Lodi", "Lombardia"), ("Lucca", "Toscana"), ("Macerata", "Marche"),
    ("Mantova", "Lombardia"), ("Massa-Carrara", "Toscana"), ("Matera", "Basilicata"),
    ("Messina", "Sicilia"), ("Milano", "Lombardia"), ("Modena", "Emilia-Romagna"),
    ("Monza", "Lombardia"), ("Monza-Brianza", "Lombardia"), ("Napoli", "Campania"),
    ("Novara", "Piemonte"), ("Nuoro", "Sardegna"), ("Oristano", "Sardegna"),
    ("Padova", "Veneto"), ("Palermo", "Sicilia"), ("Parma", "Emilia-Romagna"),
    ("Pavia", "Lombardia"), ("Perugia", "Umbria"), ("Pesaro", "Marche"),
    ("Pesaro-Urbino", "Marche"), ("Pescara", "Abruzzo"), ("Piacenza", "Emilia-Romagna"),
    ("Pisa", "Toscana"), ("Pistoia", "Toscana"), ("Pordenone", "Friuli-Venezia Giulia"),
    ("Potenza", "Basilicata"), ("Prato", "Toscana"), ("Ragusa", "Sicilia"),
    ("Ravenna", "Emilia-Romagna"), ("Reggio Calabria", "Calabria"),
    ("Reggio Emilia", "Emilia-Romagna"), ("Rieti", "Lazio"), ("Rimini", "Emilia-Romagna"),
    ("Roma", "Lazio"), ("Rovigo", "Veneto"), ("Salerno", "Campania"),
    ("Sassari", "Sardegna"), ("Savona", "Liguria"), ("Siena", "Toscana"),
    ("Siracusa", "Sicilia"), ("Sondrio", "Lombardia"), ("Sud Sardegna", "Sardegna"),
    ("Taranto", "Puglia"), ("Teramo", "Abruzzo"), ("Terni", "Umbria"),
    ("Torino", "Piemonte"), ("Trapani", "Sicilia"), ("Trento", "Trentino-Alto Adige"),
    ("Treviso", "Veneto"), ("Trieste", "Friuli-Venezia Giulia"),
    ("Udine", "Friuli-Venezia Giulia"), ("Varese", "Lombardia"),
    ("Venezia", "Veneto"), ("Verona", "Veneto"), ("Vercelli", "Piemonte"),
    ("Vibo Valentia", "Calabria"), ("Vicenza", "Veneto"), ("Viterbo", "Lazio"),
]

# Comuni ricorrenti nei titoli: alias -> ("Provincia", "Regione")
ALIAS_COMUNI = {
    "casinalbo": ("Modena", "Emilia-Romagna"),
    "eraclea": ("Venezia", "Veneto"),
    "treia": ("Macerata", "Marche"),
    "polesine": ("Parma", "Emilia-Romagna"),
    "petrignano": ("Perugia", "Umbria"),
    "bivona": ("Agrigento", "Sicilia"),
    "origgio": ("Varese", "Lombardia"),
}

REGIONI_NOMI = [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
    "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
    "Trentino-Alto Adige", "Trentino", "Umbria", "Valle d'Aosta", "Veneto",
]


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


def is_itinere(titolo: str) -> bool:
    t = titolo.lower()
    return any(k in t for k in (
        "in itinere",
        "casa-lavoro",
        "casa lavoro",
        "tragitto casa-lavoro",
        "percorso casa-lavoro",
        "andando al lavoro",
        "si recava al lavoro",
        "si stava recando al lavoro",
        "mentre andava al lavoro",
        "diretta al lavoro",
        "diretto al lavoro",
        "di ritorno dal lavoro",
        "di ritorno a casa dal lavoro",
        "uscendo dal lavoro",
        "dopo il turno",
        "al termine del turno",
    ))


def estrai_luogo(titolo: str) -> tuple[str | None, str | None]:
    """Best-effort: restituisce (provincia, regione) dal titolo, o (None, None)."""
    tl = titolo.lower()

    # 1) pattern esplicito "in provincia di X"
    m = re.search(r"in provincia di ([a-zà-ù' ]{2,45})", tl)
    if m:
        nome = m.group(1).strip()
        for prov, reg in PROVINCE:
            if prov.lower() == nome or prov.lower().startswith(nome):
                return prov, reg

    # 2) comuni noti (alias)
    for alias, (prov, reg) in ALIAS_COMUNI.items():
        if alias in tl:
            return prov, reg

    # 3) regione citata
    for reg in REGIONI_NOMI:
        if reg.lower() in tl:
            # migliora con la provincia se presente nel titolo
            for prov, preg in PROVINCE:
                if preg == reg and len(prov) > 4 and prov.lower() in tl:
                    return prov, reg
            return None, reg

    # 4) provincia citata (vince la più lunga, evita falsi positivi corti)
    best = None
    for prov, reg in PROVINCE:
        if len(prov) < 5:
            continue
        if prov.lower() in tl:
            if best is None or len(prov) > len(best[0]):
                best = (prov, reg)
    if best:
        return best

    return None, None


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

    filtrate: list[dict] = []
    for n in dedupe(tutti):
        n["categoria"] = classify(n["titolo"])
        if n["categoria"] not in ("mortale", "grave"):
            continue
        if is_itinere(n["titolo"]):
            continue
        prov, reg = estrai_luogo(n["titolo"])
        n["provincia"] = prov
        n["regione"] = reg
        filtrate.append(n)

    payload = {
        "schemaVersion": 2,
        "datasetId": "news_infortuni",
        "generatedAt": utc_now(),
        "fonte": "Google News RSS (query: infortuni sul lavoro Italia)",
        "periodo": "ultimi 7 giorni",
        "notizie": filtrate[:MAX_KEEP],
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] {len(payload['notizie'])} notizie gravi/mortali -> {OUT}")
    for n in payload["notizie"][:8]:
        print(f"  [{n['categoria']}] {n['titolo']} | {n.get('provincia')} ({n.get('regione')}) | {n['fonte']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())