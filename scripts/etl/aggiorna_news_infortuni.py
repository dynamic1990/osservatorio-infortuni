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
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
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
    "santo stefano quisquina": ("Agrigento", "Sicilia"),
    "origgio": ("Varese", "Lombardia"),
}

# Alcune testate non riportano il luogo nel titolo, ma lo rendono evidente
# nel nome della fonte. Serve come informazione ausiliaria per la deduplica.
SOURCE_PLACES = {
    "agrigento": "agrigento",
    "agrigentonotizie": "agrigento",
    "agrigentooggi": "agrigento",
    "sciacca": "agrigento",
    "corrieredisciacca": "agrigento",
    "trapanioggi": "agrigento",
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


def news_datetime(item: dict) -> datetime:
    """Converte pubDate RSS in una data confrontabile, con fallback stabile."""
    try:
        dt = parsedate_to_datetime(item.get("data", ""))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        return datetime.min.replace(tzinfo=timezone.utc)


EVENT_STOPWORDS = {
    "incidente", "infortunio", "infortuni", "lavoro", "operaio", "operaia",
    "operai", "lavoratore", "lavoratrice", "lavoratori", "morto", "morta",
    "morti", "morte", "muore", "muoiono", "deceduto", "deceduta", "tragedia",
    "grave", "gravissimo", "gravissima", "ferito", "ferita", "feriti", "ferite",
    "cantiere", "azienda", "ditta", "impresa", "edile", "soccorso", "soccorso",
    "sicurezza", "sindacati", "controlli", "carabinieri", "vigili", "fuoco",
    "polizia", "sanita", "san", "ospedale", "ospedali", "cronaca", "oggi",
    "ieri", "titolare", "carpentiere", "muratore", "giovane", "uomo", "donna",
    "anni", "anno", "sul", "sulla", "sullo", "nel", "nella", "della", "delle",
    "degli", "dell", "del", "di", "da", "un", "una", "uno", "il", "lo", "la",
    "i", "gli", "e", "ed", "a", "al", "alla", "con", "per", "che", "chi", "si",
}

EVENT_ANCHORS = {
    "muro", "parete", "soletta", "blocco", "cemento", "escavatore", "ponteggio",
    "ponteggi", "tetto", "tetti", "volo", "precipita", "precipitato", "folgorato",
    "folgorata", "bancale", "capannone", "macchinario", "macchina", "trattore",
    "impalcatura", "gru", "terrapieno", "crollo", "crolla", "crollato", "crollata",
    "sbriciola", "sbriciolato", "schiacciato", "schiacciata", "travolge", "travolto",
    "travolta", "caduto", "caduta", "cadde", "amputazione", "ribaltato", "ribaltata",
}

FOLLOWUP_MARKERS = {
    "lutto", "cordoglio", "ricordo", "chi era", "sindacati", "sicurezza",
    "controlli", "funerali", "funerale", "comune", "cittadino",
}


def normalized_tokens(text: str) -> set[str]:
    """Token normalizzati, utili per confrontare titoli di fonti diverse."""
    ascii_text = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()
    return set(re.findall(r"[a-z0-9]{3,}", ascii_text))


def event_tokens(item: dict) -> set[str]:
    return normalized_tokens(item.get("titolo", "")) - EVENT_STOPWORDS


def event_anchors(item: dict) -> set[str]:
    tokens = event_tokens(item)
    anchors = set()
    for token in tokens:
        if token in EVENT_ANCHORS:
            anchors.add(token)
        elif token.startswith(("croll", "sbriciol", "schiacci", "travolg", "precipit", "folgor", "cadut")):
            anchors.add(token[:6])
    return anchors


def is_followup(item: dict) -> bool:
    titolo = item.get("titolo", "").lower()
    return any(marker in titolo for marker in FOLLOWUP_MARKERS)


def normalize_place(value: str) -> str:
    return unicodedata.normalize("NFKD", value.lower()).encode("ascii", "ignore").decode()


def event_places(item: dict) -> set[str]:
    """Restituisce tutti i livelli geografici utili al confronto evento."""
    titolo = normalize_place(item.get("titolo", ""))
    places: set[str] = set()

    # Comune, provincia e regione del titolo. Conserviamo tutti i livelli:
    # Bivona deve poter combaciare con un articolo che cita solo Agrigento.
    for alias in sorted(ALIAS_COMUNI, key=len, reverse=True):
        alias_norm = normalize_place(alias)
        if re.search(rf"(?<![a-z]){re.escape(alias_norm)}(?![a-z])", titolo):
            provincia, regione = ALIAS_COMUNI[alias]
            places.update({alias_norm, normalize_place(provincia), normalize_place(regione)})

    for provincia, regione in PROVINCE:
        provincia_norm = normalize_place(provincia)
        if re.search(rf"(?<![a-z]){re.escape(provincia_norm)}(?![a-z])", titolo):
            places.update({provincia_norm, normalize_place(regione)})

    for regione in REGIONI_NOMI:
        regione_norm = normalize_place(regione)
        if re.search(rf"(?<![a-z]){re.escape(regione_norm)}(?![a-z])", titolo):
            places.add(regione_norm)

    if item.get("provincia"):
        places.add(normalize_place(item["provincia"]))
    if item.get("regione"):
        places.add(normalize_place(item["regione"]))

    source = normalize_place(item.get("fonte", ""))
    for marker, place in SOURCE_PLACES.items():
        if marker in source:
            places.add(place)

    return places


def is_same_event(a: dict, b: dict) -> bool:
    """Confronto prudente tra articoli sullo stesso evento.

    Non usa il titolo identico come unico criterio: combina luogo, vicinanza
    temporale e dettagli concreti (persona, età, oggetto o dinamica). In questo
    modo tre titoli diversi sul crollo del muro di Bivona vengono accorpati,
    mentre due eventi generici nella stessa regione restano distinti.
    """
    delta_days = abs((news_datetime(a) - news_datetime(b)).total_seconds()) / 86400
    if delta_days > 4:
        return False

    places_a = event_places(a)
    places_b = event_places(b)
    same_place = bool(places_a & places_b)

    tokens_a = event_tokens(a)
    tokens_b = event_tokens(b)
    common = tokens_a & tokens_b
    anchors = event_anchors(a) & event_anchors(b)

    # Un nome, un'età o un dettaglio concreto condiviso è un forte indicatore.
    numbers = {t for t in common if t.isdigit()}
    concrete = common - {"sicilia", "agrigento", "lombardia", "varese", "veneto"}
    if same_place and (numbers or len(concrete) >= 2):
        return True

    # Per le cronache dello stesso giorno è sufficiente una dinamica comune
    # chiaramente identificabile: muro/parete, escavatore, folgorazione, ecc.
    if same_place and anchors and delta_days <= 2:
        return True

    # Alcune fonti riprendono l'evento senza ripetere il comune o la
    # provincia nel titolo. Per collegarle in modo prudente richiediamo una
    # dinamica concreta e almeno un altro dettaglio comune, oppure due
    # elementi della dinamica, nello stesso arco di 48 ore.
    if not same_place and delta_days <= 2:
        if len(anchors) >= 2:
            return True
        if anchors and (numbers or len(concrete) >= 2):
            return True

    # Due articoli che citano lo stesso comune nello stesso arco di 48 ore
    # descrivono normalmente lo stesso fatto anche quando uno dei titoli è
    # una semplice scheda di aggiornamento e non ripete la dinamica.
    alias_places = {normalize_place(alias) for alias in ALIAS_COMUNI}
    if places_a & places_b & alias_places and delta_days <= 2:
        return True

    # Le fonti pubblicano spesso un secondo pezzo sul lutto, sulla vittima o
    # sulle richieste di sicurezza senza ripetere luogo e dinamica. Se il
    # seguito è nella stessa provincia e nello stesso arco di 48 ore di un
    # articolo che contiene una dinamica concreta o un'età, è lo stesso evento
    # con elevata probabilità. È il caso Bivona/Santo Stefano Quisquina del
    # 1 settembre 2026.
    if delta_days <= 2 and same_place:
        if is_followup(a) != is_followup(b):
            other = b if is_followup(a) else a
            if event_anchors(other) or any(t.isdigit() for t in event_tokens(other)):
                return True

    return False


def dedupe_eventi(items: list[dict]) -> list[dict]:
    """Riduce i diversi articoli dello stesso incidente a una sola voce."""
    ordinati = sorted(items, key=news_datetime, reverse=True)
    gruppi: list[list[dict]] = []
    for item in ordinati:
        gruppo = next((g for g in gruppi if any(is_same_event(item, other) for other in g)), None)
        if gruppo is None:
            gruppi.append([item])
        else:
            gruppo.append(item)
    return [gruppo[0] for gruppo in gruppi]


def dedupe_titoli(items: list[dict]) -> list[dict]:
    """Elimina duplicati tecnici prima della deduplicazione per evento."""
    seen = set()
    out = []
    for it in sorted(items, key=news_datetime, reverse=True):
        key = re.sub(r"[^a-z0-9]+", "", it["titolo"].lower())
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
    for n in dedupe_titoli(tutti):
        n["categoria"] = classify(n["titolo"])
        if n["categoria"] not in ("mortale", "grave"):
            continue
        if is_itinere(n["titolo"]):
            continue
        prov, reg = estrai_luogo(n["titolo"])
        n["provincia"] = prov
        n["regione"] = reg
        filtrate.append(n)

    filtrate = dedupe_eventi(filtrate)
    filtrate.sort(key=news_datetime, reverse=True)

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
