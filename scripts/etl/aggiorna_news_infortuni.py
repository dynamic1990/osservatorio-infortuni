#!/usr/bin/env python3
"""ETL notizie infortuni sul lavoro (Italia).

Aggrega le ultime notizie da Google News RSS (query: infortunio mortale/grave
sul lavoro) e produce src/data/generated/news-infortuni.json per la dashboard.

Caratteristiche:
- assegna a ogni articolo un WORK_ACCIDENT_SCORE da 0 a 100;
- mantiene solo notizie classificate gravi o mortali e sufficientemente pertinenti;
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
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"
OUT = GEN / "news-infortuni.json"
REGISTRY = ROOT / "scripts" / "ci" / "generated-artifacts.json"

QUERIES = [
    "infortunio mortale lavoro",
    "operaio morto cantiere",
    "infortunio grave lavoro oggi",
    "incidente sul lavoro mortale",
    "caduto da impalcatura lavoro",
    "investito sul lavoro",
    "esplosione cantiere",
    "schiacciato macchinario lavoro",
]

MAX_ITEMS = 200
MAX_KEEP = 5000  # archivio: fino a 365 giorni di notizie (cap prudenziale)
MIN_WORK_ACCIDENT_SCORE = 45
ARCHIVIO_GIORNI = 365

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

# Comuni ricorrenti nella cronaca degli infortuni (capoluoghi e comuni citati
# spesso nei titoli). Servono per l'estrazione del luogo e per il confronto
# "stesso comune" nella deduplicazione: senza questo dizionario i titoli che
# citano solo il comune ("morto a Caivano", "tragedia a Faenza") non si
# accorpan perché il comune non è una provincia.
COMUNI_NOTI = {
    "caivano": ("Napoli", "Campania"),
    "faenza": ("Ravenna", "Emilia-Romagna"),
    "rimini": ("Rimini", "Emilia-Romagna"),
    "palagonia": ("Catania", "Sicilia"),
    "gallese": ("Viterbo", "Lazio"),
    "filago": ("Bergamo", "Lombardia"),
    "ornago": ("Monza-Brianza", "Lombardia"),
    "robbecco sul naviglio": ("Milano", "Lombardia"),
    "castelfiorentino": ("Firenze", "Toscana"),
    "borgo valsugana": ("Trento", "Trentino-Alto Adige"),
    "aponte san nicolò": ("Padova", "Veneto"),
    "borso del grappa": ("Treviso", "Veneto"),
    "castellammare": ("Napoli", "Campania"),
    "prata principato ultra": ("Avellino", "Campania"),
    "apollosa": ("Benevento", "Campania"),
    "frascineto": ("Cosenza", "Calabria"),
    "sant'agostino": ("Pistoia", "Toscana"),
    "rocco": ("Milano", "Lombardia"),
    "pistoia": ("Pistoia", "Toscana"),
    "sapri": ("Salerno", "Campania"),
    "zevio": ("Verona", "Veneto"),
    "altavilla vicentina": ("Vicenza", "Veneto"),
    "san giovanni in persiceto": ("Bologna", "Emilia-Romagna"),
    # Entità-luogo ricorrenti nella cronaca: non sono comuni, ma identificano
    # un luogo preciso anche senza citare la città. Servono al confronto evento:
    # "Fincantieri" e "cantiere del porto" nella stessa finestra temporale
    # indicano lo stesso fatto anche se il titolo non dice "Ancona".
    "fincantieri": ("Ancona", "Marche"),
    "cantiere del porto": ("Ancona", "Marche"),
    "cantiere navale": ("Ancona", "Marche"),
    "al porto": ("Ancona", "Marche"),
    "del porto": ("Ancona", "Marche"),
}

# Unisce i due dizionari per la ricerca luogo: prima i comuni (più specifici),
# poi le province. L'ordine conta: "Rimini" è sia comune che provincia, ma il
# comune è più specifico e ha lo stesso risultato.
LUOGHI_ORDINATI = sorted(
    [(nome, prov, reg) for nome, (prov, reg) in COMUNI_NOTI.items()]
    + [(nome.lower(), prov, reg) for nome, (prov, reg) in ALIAS_COMUNI.items()]
    + [(prov.lower(), prov, reg) for prov, reg in PROVINCE],
    key=lambda x: -len(x[0]),
)

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


def fetch_rss(query: str, when: str = "30d") -> list[dict]:
    q = urllib.parse.quote(query)
    url = (
        f"https://news.google.com/rss/search?q={q}"
        f"+when:{when}&hl=it&gl=IT&ceid=IT:it"
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


# Marker di articoli che riportano numeri di periodo (report, bilanci, analisi)
# e non descrivono un singolo evento di cronaca. Distinguere i due piani evita
# che la timeline della cronaca venga inquinata da statistiche tipo "Inail,
# 498 morti in 8 mesi" o "15 decessi nel semestre".
REPORT_MARKERS = [
    "inail", "denunce", "dati", "istat", "eurostat",
    "primi 8 mesi", "primi otto mesi",
    "primi 7 mesi", "primi sette mesi", "primi sei mesi", "primo semestre",
    "primi 9 mesi", "primi nove mesi", "bilancio", "rapporto", "studio",
    "aumentano", "aumentati", "aumentate", "in aumento", "denunce in",
    "decessi", "rischio", "analisi", "classifica", "percentuale",
    "crescita", "calo", "calano", "record negativo", "media giornaliera",
    "morti in", "morti sul lavoro in",
    # Titoli di bilancio regionale/periodo come "Lavoro Abruzzo: meno morti ma
    # più infortuni. Terza regione in Italia per malattie professionali"
    "meno morti", "più infortuni", "malattie professionali",
    "giornata nazionale", "regione in italia",
]


def classify_tipo(titolo: str, fonte: str = "") -> str:
    """'evento' per la cronaca di un singolo fatto, 'report' per dati di periodo."""
    text = f"{titolo} {fonte}".lower()
    # Segnali forti di report: percentuali o numeri di periodo con andamento
    if any(m in text for m in REPORT_MARKERS):
        return "report"
    # Fallback: titoli con "%" o "+xx%" sono quasi sempre statistiche
    if "%" in text or "+8" in text or "+9" in text or "+10" in text:
        return "report"
    # Bilanci con numeri di periodo: "18 morti e oltre 10mila infortuni in un
    # anno", "15 morti sul lavoro in sette mesi", "un infortunio ogni mezz'ora",
    # "701 morti nel 2026". Un numero vicino a morti/infortuni/decessi più un
    # periodo esplicito è quasi sempre un quadro statistico, non un singolo
    # fatto imminente.
    if re.search(r"\d[\d.'\u202f]*\s*(?:morti?|infortuni?|decessi|denunce|vittime)\b", text) and re.search(
        r"(?:in un anno|all'anno|nel \d{4}|in \w+ mesi|in \d+ giorni|nel semestre|nel trimestre|ogni \w+)", text
    ):
        return "report"
    return "evento"


# Approfondimenti tematici, cerimonie e conseguenze: l'articolo parla del
# tema (numeri, prevenzione, appelli, processi, commemorazioni) senza
# raccontare un singolo fatto di cronaca. Non va in 'mortale'/'grave' anche
# se il titolo cita 'morti' o 'infortuni'.
#
# Marker FORTI: l'articolo è inequivocabilmente un approfondimento, anche se
# il titolo descrive una dinamica nel riferirsi alla vittima
# ("In otto rischiano il processo per l'operaio morto folgorato..." → analisi).
ANALISI_FORTE_MARKERS = (
    "rischiano il processo", "rischiano un processo", "rinvio a giudizio",
    "processo per la morte", "processo per l'operaio", "processo per il",
    "chiesto il processo", "chiede il processo", "condannat", "assolt",
    "commemorazion", "a un anno dalla", "anniversario", "giornata della memoria",
)

# Marker DEBOLI: approfondimento solo se il titolo non racconta anche la
# dinamica del fatto ("Operaio travolto e ucciso in A14, scatta lo sciopero
# proclamato dalla Cgil" resta un fatto mortale perché 'travolto' è la
# dinamica; "L'appello alle istituzioni" senza dinamica è un approfondimento).
ANALISI_DEBOLI_MARKERS = (
    "appello", "la sicurezza è un diritto", "cerimonia", "convegno",
    "iniziativa", "manifestazione", "basta morti", "basta stragi",
    "processo", "arrest", "indagini", "inchiesta", "sciopero",
    "cgil", "sindacat", "lutto", "cordoglio", "ricordo", "chi era",
    "funerali", "funerale", "prevenzione", "anmil", "proposta",
)


def classify_categoria(titolo: str, tipo: str) -> str:
    """Categoria pubblica della notizia: fatto (mortale/grave) o analisi.

    Regola (v6, 14/10/2026): il tag riflette la NATURA DELL'ARTICOLO, non
    la data di pubblicazione.
    - 'mortale' o 'grave' per gli articoli che RACCONTANO un fatto di cronaca
      (l'esito deriva da classify: morte, amputazione, prognosi riservata…)
      e il tag è stabile nel tempo;
    - 'analisi' per gli approfondimenti: bilanci di periodo e dati (tipo
      report), appelli, cerimonie, processi, commemorazioni e discorsi sul
      tema che non raccontano un singolo evento, anche quando citano
      'mortali' o 'gravi' nel titolo.
    """
    t = titolo.lower()
    if tipo != "evento":
        return "analisi"
    # Approfondimento tematico/giudiziario/commemorativo inequivocabile
    if any(m in t for m in ANALISI_FORTE_MARKERS):
        return "analisi"
    # Approfondimento probabile: il racconto del fatto vince solo se nel
    # titolo c'è la dinamica dell'evento (caduta, esplosione, schiacciamento)
    if any(m in t for m in ANALISI_DEBOLI_MARKERS) and not semantic_dinamica(titolo):
        return "analisi"
    return classify(titolo)


# Il punteggio è un filtro prudenziale, non una classificazione ufficiale.
# Il titolo RSS è spesso l'unico testo disponibile, quindi i segnali negativi
# devono prevalere sui termini generici come "grave" o "infortunio".
WORK_TERMS = {
    "operaio", "operaia", "operai", "lavoratore", "lavoratrice", "lavoratori",
    "cantiere", "azienda", "impresa", "ditta", "datore", "dipendente",
    "muratore", "carpentiere", "edile", "capannone", "fabbrica", "officina",
    "stabilimento", "ponteggio", "impalcatura", "macchinario", "muletto",
    "gru", "escavatore", "trattore", "tetto", "lavorando", "lavorava",
    "lavoro", "sul lavoro", "in azienda", "durante il turno",
}
EVENT_TERMS = {
    # Non è una tassonomia chiusa: questi segnali aumentano la fiducia, ma
    # l'assenza di uno di essi non esclude l'articolo. Le dinamiche reali
    # possono essere molto più numerose e il titolo RSS può usare sinonimi.
    "caduto", "caduta", "cadde", "scivolato", "scivolata", "precipitato", "precipita",
    "crollo", "crollato", "crollata", "cedimento", "sprofondato", "travolto", "travolta",
    "travolge", "investito", "investita", "schiacciato", "schiacciata", "schiacciamento",
    "folgorato", "folgorata", "elettrocuzione", "ustionato", "ustionata", "bruciato",
    "esplosione", "incendio", "fumo", "intossicato", "intossicata", "avvelenato",
    "annegato", "annegata", "soffocato", "asfissiato", "sepolto", "sepolta", "sommerso",
    "ribaltato", "ribaltata", "amputazione", "ferito", "ferita", "ferito grave",
    "malore", "colto da malore", "perde i sensi", "ustione", "lesione", "trauma",
    "incidente", "sinistro", "scontro", "urto", "morto", "morta", "morti", "muore",
    "deceduto", "deceduta", "decesso", "perde la vita", "ucciso", "uccisa",
}
SPORT_TERMS = {
    "basket", "calcio", "tennis", "pallavolo", "rugby", "sport", "atleta",
    "giocatore", "giocatrice", "partita", "stagione", "olimpico", "olimpiadi",
    "sciatore", "ciclista", "pilota", "motogp", "formula 1", "pugile",
    "kartodromo", "pista", "gara", "campionato", "allenamento",
}
ROAD_NONWORK_TERMS = {
    "incidente stradale", "scontro stradale", "schianto stradale", "auto", "automobile",
    "motocicletta", "moto", "scooter", "pedone", "statale", "autostrada",
}
NON_PROFESSIONAL_TERMS = {
    "casa", "domestico", "domestica", "tempo libero", "vacanza", "escursione",
    "spiaggia", "piscina", "scivolo", "parco giochi",
}


def _contains(text: str, terms: set[str]) -> set[str]:
    return {term for term in terms if term in text}


def work_accident_score(titolo: str, fonte: str = "") -> tuple[int, list[str]]:
    """Calcola un punteggio spiegabile di pertinenza al lavoro, 0-100."""
    text = f"{titolo} {fonte}".lower()
    score = 0
    reasons: list[str] = []
    work = _contains(text, WORK_TERMS)
    events = _contains(text, EVENT_TERMS)
    sports = _contains(text, SPORT_TERMS)
    road = _contains(text, ROAD_NONWORK_TERMS)
    non_professional = _contains(text, NON_PROFESSIONAL_TERMS)

    if work:
        score += min(42, 14 * len(work))
        reasons.append("contesto lavorativo")
    if events:
        score += min(25, 10 * len(events))
        reasons.append("evento/infortunio")
    if any(term in text for term in ("mort", "decedut", "muore", "perde la vita", "uccis")):
        score += 18
        reasons.append("esito mortale")
    elif any(term in text for term in ("grav", "ospedale", "prognosi", "rianimazione", "ambulanza")):
        score += 10
        reasons.append("conseguenza grave")
    if any(prov.lower() in text for prov, _ in PROVINCE) or any(reg.lower() in text for reg in REGIONI_NOMI):
        score += 5
        reasons.append("localizzazione geografica")

    if sports:
        score -= 75
        reasons.append("esclusione sport")
    if road and not work:
        score -= 35
        reasons.append("incidente stradale non lavorativo")
    if non_professional and not work:
        score -= 35
        reasons.append("evento non professionale")

    return max(0, min(100, score)), reasons


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

    # 2) comuni noti (alias + dizionario comuni ricorrenti)
    for nome, prov, reg in LUOGHI_ORDINATI:
        if nome in tl:
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
        # Soglia a 4 per coprire i capoluoghi corti (Roma, Pisa, Enna, Como,
        # Bari, Asti). "Lodi" è esclusa perché coincide con un sostantivo
        # comune (plurale di lode) e genera falsi positivi.
        if len(prov) < 4 or prov.lower() == "lodi":
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


AGE_PATTERN = re.compile(r"\b(\d{1,3})\s*(?:anni|enne|enne)\b")

def victim_age(titolo: str) -> set[int]:
    """Età della vittima quando il titolo la riporta ('operaio di 52 anni', '52enne').

    L'età è un identificatore quasi univoco quanto il nome: due articoli che
    citano la stessa età nello stesso luogo e nello stesso giorno descrivono
    quasi certamente la stessa persona. Età fuori range (0 o >110) scartate.
    """
    out = set()
    for m in AGE_PATTERN.finditer(titolo):
        try:
            eta = int(m.group(1))
        except ValueError:
            continue
        if 10 <= eta <= 110:
            out.add(eta)
    return out


def title_similarity(a: str, b: str) -> float:
    """Coefficiente Dice sui token significativi (stopword escluse).

    Cattura le parafrasi delle testate: 'Muore operaio schiacciato a Caivano'
    vs 'Caivano, operaio schiacciato dal muro: muore in ospedale' hanno quasi
    gli stessi token evento pur non essendo titoli identici.
    """
    ta = event_tokens({"titolo": a})
    tb = event_tokens({"titolo": b})
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    return 2 * inter / (len(ta) + len(tb))


# Nomi propri: pattern "Nome Cognome" nel titolo. È la chiave più forte per
# accorpare articoli dello stesso evento (la vittima è univoca), anche quando
# titoli e testate cambiano completamente.
NAME_PATTERN = re.compile(
    r"\b([A-ZÀ-Ž][a-zà-ž]+)\s+([A-ZÀ-Ž][a-zà-ž]+)\b"
)

def victim_names(item: dict) -> set[str]:
    """Nomi propri (Nome Cognome) estraibili dal titolo."""
    testo = item.get("titolo", "")
    nomi = set()
    for m in NAME_PATTERN.finditer(testo):
        name = m.group(0)
        low = name.lower()
        # Esclude falsi positivi: inizio frase, saluti, toponimi composti noti
        if low in {"di che", "non è", "il titolare", "il datore", "la cgil", "la figlia", "la moglie"}:
            continue
        # Esclude le parole stop/vuote che sembrano nomi
        if not re.search(r"[aeiouàèéìòù]", name):
            continue
        nomi.add(name)
    return nomi


def extract_comune(titolo: str) -> str | None:
    """Cerca nel titolo un comune/provincia noto anche fuori dal pattern 'in provincia di'."""
    tl = normalize_place(titolo)
    for nome, _, _ in LUOGHI_ORDINATI:
        nome_norm = normalize_place(nome)
        if nome_norm and re.search(rf"(?<![a-z]){re.escape(nome_norm)}(?![a-z])", tl):
            return nome
    return None


def is_aggregate_report(titolo: str) -> bool:
    """Titoli che riassumono piu' eventi distinti ('Tre operai morti a Pistoia, Faenza e Treviso').

    Sono casi limite: non sono la cronaca di un singolo infortunio, ma un
    panorama di piu' fatti. Contarli come 'uno' distorcerebbe il contatore
    (contengono gia' eventi contati singolarmente), quindi vanno marcati come
    report e non entrano nel calcolo dei KPI.
    """
    tl = normalize_place(titolo)
    # Conteggio toponimi provincia/regione nel titolo: se ce ne sono piu' di
    # uno con la virgola o 'e', e' un riassunto di piu' eventi.
    toponimi = set()
    for prov, _ in PROVINCE:
        pn = normalize_place(prov)
        if len(pn) >= 4 and re.search(rf"(?<![a-z]){re.escape(pn)}(?![a-z])", tl):
            toponimi.add(pn)
    for reg in REGIONI_NOMI:
        rn = normalize_place(reg)
        if len(rn) >= 4 and re.search(rf"(?<![a-z]){re.escape(rn)}(?![a-z])", tl):
            toponimi.add(rn)
    # Numeri di vittime multiple nel titolo ("tre operai", "due operai", "3 morti")
    numeri = re.findall(r"\b(?:tre|due|quattro|cinque|3|4|5)\s+operai?\b", tl)
    return len(toponimi) >= 2 or bool(numeri)


def normalize_place(value: str) -> str:
    return unicodedata.normalize("NFKD", value.lower()).encode("ascii", "ignore").decode()


def event_places(item: dict) -> set[str]:
    """Restituisce tutti i livelli geografici utili al confronto evento."""
    titolo = normalize_place(item.get("titolo", ""))
    places: set[str] = set()

    # Comuni noti, alias e province: tutto ciò che è riconoscibile nel titolo.
    # Conserviamo tutti i livelli: Bivona deve poter combaciare con un
    # articolo che cita solo Agrigento.
    for nome, prov, reg in LUOGHI_ORDINATI:
        nome_norm = normalize_place(nome)
        if not nome_norm:
            continue
        if re.search(rf"(?<![a-z]){re.escape(nome_norm)}(?![a-z])", titolo):
            places.update({nome_norm, normalize_place(prov), normalize_place(reg)})

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


def semantic_dinamica(titolo: str) -> set[str]:
    """Categorie di dinamica condivise tra fonti diverse.

    Permette di riconoscere la stessa dinamica anche quando le parole sono
    diverse: 'investito da una fiammata', 'esplosione', 'gravi ustioni' e
    'fuga di gas' appartengono tutte al batch fuoco.
    """
    t = normalize_place(titolo)
    fuoco = ("fiammata", "ustion", "incendio", "esplos", "vapore", "scoppio", "fuga di gas")
    caduta = ("cadut", "precipit", "croll", "volo", "tetto", "pontegg", "impalcatura", "sottotetto", "solaio", "scaffal")
    schiacciamento = ("schiacci", "travol", "investit", "colpit", "carico caduto", "ribalt")
    elettrico = ("folgor", "elettrocuzion", "scossa", "elettrico")
    annegamento = ("anneg", "caduto in acqua", "canale", "fiume", "vasca")
    out = set()
    if any(k in t for k in fuoco):
        out.add("fuoco")
    if any(k in t for k in caduta):
        out.add("caduta")
    if any(k in t for k in schiacciamento):
        out.add("schiacciamento")
    if any(k in t for k in elettrico):
        out.add("elettrico")
    if any(k in t for k in annegamento):
        out.add("annegamento")
    return out


DINAMICHE_RARE = {"fuoco", "elettrico", "annegamento"}

# ---------------------------------------------------------------------------
# Grandi opere / cantieri unici (ancora di accorpamento)
# ---------------------------------------------------------------------------
# Alcuni cantieri identificano un luogo così specifico da essere quasi univoci
# in una città: la Tav/Alta velocità, la metropolitana, un viadotto, un porto.
# Due incidenti mortali nello stesso luogo e nello stesso cantiere grande
# opera sono quasi certamente lo stesso evento, anche quando i titoli usano
# parole diverse ('muore nel cantiere' vs 'cade un pilone') o citano
# denominazioni diverse ('Alta velocità' vs 'Tav').
OPERA_CATEGORIE = (
    ("alta velocit", "tav"),
    ("terzo valico", "tav"),
    ("nodo di firenze", "tav"),
    ("viadotto", "viadotto"),
    ("autostrada", "autostrada"),
    ("metropolitana", "metro"),
    ("galleria", "galleria"),
    ("tunnel", "galleria"),
)


def opere_identificative(titolo: str) -> set[str]:
    """Categorie di grande opera/cantiere unico citate nel titolo.

    Normalizza le denominazioni: 'Alta velocità' e 'Tav' sono la stessa
    opera, quindi restituiscono entrambe 'tav'. Il marker 'tav' usa il
    confine di parola per non matchare 'tavolo'.
    """
    t = normalize_place(titolo)
    out = set()
    for marker, cat in OPERA_CATEGORIE:
        if marker in t:
            out.add(cat)
    if re.search(r"\btav\b", t):
        out.add("tav")
    return out

# ---------------------------------------------------------------------------
# Sintesi breve "cosa è successo" per la card della cronaca
# ---------------------------------------------------------------------------
# Regole deterministiche di estrazione: il titolo RSS è l'unica fonte, quindi
# la sintesi resta prudente e basata su pattern riconoscibili. Quando non si
# riesce a identificare una dinamica, si produce una descrizione generica
# invece di inventare dettagli.

DINAMICA_PATTERNS: list[tuple[str, tuple[str, ...], str]] = [
    # (chiave, termini, frase)
    ("caduta", ("caduto", "caduta", "cadde", "precipitato", "precipita", "volo", "crollo", "crollato", "crollata", "cedimento", "sprofondato"), "caduto dall'alto"),
    ("schiacciamento", ("schiacciato", "schiacciata", "schiacciamento", "schiaccia", "muro", "muri", "sepolto", "sepolta", "sommerso", "carico caduto", "ribaltat", "colpito da un escavatore", "colpito da escavatore"), "schiacciato da un carico/macchinario"),
    ("folgorazione", ("folgorato", "folgorata", "elettrocuzione", "scossa elettrica", "scossa", "elettrico", "elettrica"), "folgorato da corrente elettrica"),
    ("fuoco", ("ustionato", "ustionata", "incendio", "esplosione", "esplode", "esplosa", "esploso", "vapore", "scoppio", "fiammata", "fuga di gas", "bruciato", "ustioni"), "colpito da fuoco/esplosione"),
    ("annegamento", ("annegato", "annegata", "caduta in acqua", "caduto in acqua", "finisce in acqua", "canale", "vasca"), "annegato"),
    ("investimento", ("investito", "investita", "travolto", "travolta"), "investito da un veicolo/mezzo"),
    ("malore", ("malore", "colto da malore", "perde i sensi", "malore fatale"), "colto da malore"),
    ("amputazione", ("amputazione", "amputato", "perso un arto", "perde un braccio", "perde una mano"), "amputazione di un arto"),
    ("trauma", ("trauma cranico", "trauma", "lesioni", "ferito al braccio", "ferito alla mano", "frattur"), "trauma/lesione fisica"),
]

# I follow-up (arresti, processo, famiglia, sindacati) raccontano le
# conseguenze, non la dinamica: il titolo può citare la frase di un terzo
# ("Di' che ti hanno investito") che non descrive l'evento reale.
FOLLOWUP_DINAMICA_TERMS = ("arrest", "processo", "procedimento", "giudizi", "condann", "assoluzion", "indagini", "famiglia", "famigliari", "cordoglio", "lutto", "funeral", "ricordo", "chi era", "sindacat", "commissione", "inchiesta")

# Sostantivi/verbi che segnalano la vittima senza specificare la dinamica
GENERIC_DEATH = ("morto", "morta", "morti", "muore", "muoiono", "deceduto", "deceduta", "perde la vita", "perdono la vita", "ucciso", "uccisa")


def estrai_sintesi(titolo: str) -> str:
    """Produce una breve descrizione dell'evento per la card.

    Esempi reali:
      'Caivano, Salvatore Calignano è morto dopo una caduta da un capannone'
        -> 'Caduto dall'alto, vittima deceduta'
      'Operaio folgorato a Milano' -> 'Folgorato da corrente elettrica'
      'Infortunio sul lavoro a Rimini: operaio schiacciato da un muletto'
        -> 'Schiacciato da un carico/macchinario'
    Quando non si riconosce la dinamica:
      'Infortunio sul lavoro a Treviso, operaio grave in ospedale'
        -> 'Infortunio con conseguenze gravi'
    """
    t = titolo.lower()

    # I follow-up descrivono conseguenze, non dinamica: sintesi generica.
    # Se però il titolo descrive anche la dinamica dell'evento (es. "Esplosione
    # in un'officina a Roma: morto un operaio, indagini in corso"), la dinamica
    # vince: 'indagini' da solo non rende il titolo un follow-up.
    has_dinamica_titolo = any(
        any(k in t for k in termini) for _, termini, _ in DINAMICA_PATTERNS
    )
    # Discorso riportato tra virgolette ("…"): di solito è la citazione di un
    # terzo (datore, sindacalista) e può contenere parole di dinamica che non
    # descrivono l'evento reale ("Di' che ti hanno investito").
    has_quoted = '"' in titolo or "“" in titolo or "”" in titolo
    if any(k in t for k in FOLLOWUP_DINAMICA_TERMS) and (not has_dinamica_titolo or (has_quoted and "arrest" in t)):
        if re.search(r"\b(?:mort|decedut|muore|perde la vita|uccis)", t):
            return "Infortunio con vittima deceduta"
        return "Infortunio sul lavoro"

    dinamica = None
    for chiave, termini, frase in DINAMICA_PATTERNS:
        if any(k in t for k in termini):
            dinamica = frase
            break

    esito = None
    # 'mort' senza \b finale: matcha morto/morta/mortali ecc.
    if re.search(r"\b(?:mort|decedut|muore|muoiono|perde la vita|perdono la vita|uccis)", t):
        esito = "vittima deceduta"
    elif re.search(r"\b(?:grav|prognosi|rianimazion|eliambulanza|intubat|amputazion|ospedale)", t):
        esito = "conseguenze gravi"

    if dinamica and esito:
        # La dinamica 'Trauma/lesione fisica' include già la gravità: evitare
        # la ripetizione 'Trauma/lesione fisica, conseguenze gravi'.
        if dinamica == "trauma/lesione fisica" and esito == "conseguenze gravi":
            return dinamica.capitalize()
        return f"{dinamica.capitalize()}, {esito}"
    if dinamica:
        return dinamica.capitalize()
    if esito:
        return f"Infortunio con {esito}" if esito != "vittima deceduta" else "Infortunio con vittima deceduta"
    return "Infortunio sul lavoro"


# Grandi città ad alta densità di eventi: il solo comune condiviso non basta
# ad accorpare (due fatti diversi nello stesso giorno a Roma o Napoli non
# sono lo stesso evento). Per queste serve un aggancio forte (età, nome,
# dinamica rara, anchor).
METROPOLI = {
    "roma", "napoli", "milano", "torino", "bologna", "firenze", "genova",
    "palermo", "bari", "catania", "verona", "venezia", "brescia", "bergamo",
    "salerno", "taranto", "reggio calabria", "cagliari", "messina", "padova",
    "trieste", "parma", "modena", "reggio emilia", "perugia", "rimini",
}


def luogo_specifico(item: dict) -> set[str]:
    """Solo i luoghi specifici (comune, provincia, entità), senza la regione.

    La regione da sola è una prova troppo debole: due incidenti in città
    diverse della stessa regione finirebbero per essere considerati lo stesso
    evento. Rimini e Faenza sono entrambe in Emilia-Romagna, ma non sono lo
    stesso fatto solo per questo.
    """
    places = event_places(item)
    regioni = {normalize_place(r) for r in REGIONI_NOMI}
    return places - regioni


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

    # I report statistici vivono su un piano diverso: un bilancio di periodo
    # ("Emergenza sicurezza a Roma, +8,1%") NON è lo stesso evento di una
    # cronaca singola ("Esplosione in officina a Roma"). Mescolarli farebbe
    # sparire l'evento vero dal gruppo e gonfierebbe/azzera i KPI.
    if (a.get("tipo") == "report") != (b.get("tipo") == "report"):
        return False

    # Chiave fortissima: stesso nome della vittima -> stesso evento
    nomi_a = victim_names(a)
    nomi_b = victim_names(b)
    if nomi_a & nomi_b:
        return True

    # Chiave forte: stessa età dichiarata + stesso luogo (specifico o regione)
    # nella stessa finestra. Un "52enne" e un "operaio di 53 anni" nello stesso
    # comune nello stesso giorno sono quasi certamente la stessa persona.
    età_a = victim_age(a.get("titolo", ""))
    età_b = victim_age(b.get("titolo", ""))
    if età_a & età_b and delta_days <= 3:
        places_match = bool(luogo_specifico(a) & luogo_specifico(b))
        region_match = bool(
            (event_places(a) & {normalize_place(r) for r in REGIONI_NOMI})
            & (event_places(b) & {normalize_place(r) for r in REGIONI_NOMI})
        )
        if places_match or region_match:
            return True

    # Parafrasi delle testate: stesso luogo + titoli con alta sovrapposizione
    # di token evento (Dice >= 0.6) nella stessa finestra. Cattura "Muore
    # operaio schiacciato a Caivano" vs "Caivano, operaio schiacciato dal
    # muro: muore in ospedale" senza richiedere il nome della vittima.
    places_a = luogo_specifico(a)
    places_b = luogo_specifico(b)
    same_place = bool(places_a & places_b)
    if delta_days <= 3 and same_place:
        sim = title_similarity(a.get("titolo", ""), b.get("titolo", ""))
        if sim >= 0.6:
            return True

    # La sola regione condivisa (senza luogo specifico) è una prova debole.
    region_a = event_places(a) & {normalize_place(r) for r in REGIONI_NOMI}
    region_b = event_places(b) & {normalize_place(r) for r in REGIONI_NOMI}
    same_region_only = bool(region_a & region_b) and not same_place

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
    # provincia nel titolo. Per collegarle in modo prudente richiediamo un
    # aggancio forte (età o nome) oltre alla dinamica, nello stesso arco di
    # 48 ore. Due soli anchor generici ("schiacciato", "macchinario")
    # senza luogo non bastano: è così che Zevio finiva dentro il gruppo
    # Faenza (stessa dinamica, eventi diversi).
    if not same_place and delta_days <= 2:
        if numbers and anchors:
            return True
        if anchors and len(concrete) >= 2 and numbers:
            return True

    # Comune/provincia esplicito condiviso + stessa finestra di 3 giorni:
    # descrivono normalmente lo stesso fatto anche se le dinamiche nei titoli
    # sono rese in modo diverso ("morto a Caivano", "tragedia a Caivano").
    comune_a = extract_comune(a.get("titolo", ""))
    comune_b = extract_comune(b.get("titolo", ""))
    if comune_a and comune_b and comune_a == comune_b and delta_days <= 3:
        # Nelle grandi città il solo comune non basta: due eventi diversi
        # nello stesso giorno a Roma o Napoli condividono il capoluogo senza
        # essere lo stesso fatto. Serve un aggancio forte (anchor, età, o
        # dinamica rara) oltre al luogo.
        if normalize_place(comune_a) in METROPOLI:
            dyn_rare = semantic_dinamica(a.get("titolo", "")) & semantic_dinamica(b.get("titolo", "")) & DINAMICHE_RARE
            if anchors or numbers or dyn_rare:
                return True
        else:
            return True

    # Dinamica rara e inequivocabile condivisa (fuoco, elettrico, annegamento)
    # nello stesso luogo specifico e nella stessa finestra temporale: quasi
    # certamente lo stesso evento anche con titoli molto diversi. Copre il
    # caso Fincantieri ("investito da una fiammata", "esplosione", "gravi
    # ustioni", "cantiere del porto") dove manca il nome della vittima.
    dyn_a = semantic_dinamica(a.get("titolo", ""))
    dyn_b = semantic_dinamica(b.get("titolo", ""))
    if same_place and (dyn_a & dyn_b & DINAMICHE_RARE) and delta_days <= 6:
        return True

    # Stesso cantiere grande opera (Tav, viadotto, metro, galleria) nello
    # stesso luogo e nella stessa finestra: l'opera è un luogo quasi univoco,
    # quindi due incidenti mortali lì nello stesso giorno sono lo stesso
    # evento anche se i titoli raccontano la dinamica in modo diverso
    # ("muore nel cantiere dell'Alta Velocità" vs "cade un pilone nel
    # cantiere della Tav").
    op_a = opere_identificative(a.get("titolo", ""))
    op_b = opere_identificative(b.get("titolo", ""))
    if same_place and (op_a & op_b) and delta_days <= 3:
        return True

    # Follow-up sulla stessa provincia con un aggancio (nome, età o dinamica)
    if delta_days <= 2 and same_place:
        if is_followup(a) != is_followup(b):
            other = b if is_followup(a) else a
            if event_anchors(other) or any(t.isdigit() for t in event_tokens(other)):
                return True

    # Solo la regione condivisa: serve una combinazione forte (età identica
    # + almeno un dettaglio concreto) nello stesso giorno. È l'unico caso in
    # cui la regione da sola può bastare, per non perdere eventi regionali
    # raccontati da testate che non ripetono la città.
    if same_region_only and delta_days <= 1:
        if numbers and len(concrete - numbers) >= 1:
            return True

    return False


def dedupe_eventi(items: list[dict]) -> list[dict]:
    """Riduce i diversi articoli dello stesso incidente a una sola voce.

    Ogni gruppo evento produce il rappresentante (capo), arricchito con:
    - `eventGroupId`: id stabile del gruppo;
    - `fonti`: le notizie raggruppate (titolo, data, fonte, link, score) così
      la UI può mostrare "1 evento · N fonti" ed eventualmente un elenco
      espandibile delle testate che ne hanno parlato.
    Il contatore dei KPI resta quindi "eventi distinti", non notizie.
    """
    ordinati = sorted(items, key=news_datetime, reverse=True)
    gruppi: list[list[dict]] = []
    for item in ordinati:
        gruppo = next((g for g in gruppi if any(is_same_event(item, other) for other in g)), None)
        if gruppo is None:
            gruppi.append([item])
        else:
            gruppo.append(item)

    out = []
    for g in gruppi:
        # Il rappresentante è l'articolo più fresco del gruppo, con la
        # localizzazione migliore (provincia/regione nota se disponibile).
        # La categoria guida la scelta: un fatto mortale raccontato poi come
        # analisi (processo, commemorazione) deve restare mortale nel gruppo.
        PRIORITA_CATEGORIA = {"mortale": 3, "grave": 2, "analisi": 1}
        g_ordinato = sorted(
            g,
            key=lambda x: (
                PRIORITA_CATEGORIA.get(x.get("categoria", "analisi"), 0),
                1 if x.get("provincia") or x.get("regione") else 0,
                news_datetime(x),
            ),
            reverse=True,
        )
        capo = g_ordinato[0]
        gid = f"evt-{abs(hash(capo['link'])):012x}"
        for m in g:
            m["eventGroupId"] = gid
        capo["fonti"] = [
            {
                "titolo": m.get("titolo"),
                "data": m.get("data"),
                "fonte": m.get("fonte"),
                "link": m.get("link"),
                "score": m.get("workAccidentScore"),
            }
            for m in sorted(g, key=news_datetime, reverse=True)
            if m is not capo
        ]
        out.append(capo)
    return out


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


def calcola_stats(notizie: list[dict]) -> dict:
    """Statistiche di periodo per KPI e contatore mensile (cronaca congiunturale).

    Conta gli eventi di cronaca (tipo == 'evento') per il loro esito grezzo
    (`esito`), sempre, a prescindere dall'età: la categoria ormai coincide con
    la natura del fatto (mortale/grave, stabile), quindi anche gli eventi
    raccontati settimane fa restano fatti di cronaca nei KPI di periodo.
    I report e i bilanci (tipo 'report') restano fuori per non mischiare
    i fatti con i numeri.
    """
    now = datetime.now(timezone.utc)
    eventi = [
        n for n in notizie
        if n.get("tipo") == "evento" and n.get("esito") in ("mortale", "grave")
    ]

    # Nomi mese in italiano senza dipendere dal locale di sistema (non
    # disponibile in container: it_IT non installato).
    MESI_IT = {
        1: "Gennaio", 2: "Febbraio", 3: "Marzo", 4: "Aprile", 5: "Maggio", 6: "Giugno",
        7: "Luglio", 8: "Agosto", 9: "Settembre", 10: "Ottobre", 11: "Novembre", 12: "Dicembre",
    }

    def giorni(n: dict) -> int:
        return max(0, int((now - news_datetime(n)).total_seconds() / 86400))

    def conta(cond) -> int:
        return sum(1 for n in eventi if cond(n))

    # Finestra mobile 7 giorni vs i 7 giorni precedenti (confronto parità)
    ultimi7 = [n for n in eventi if giorni(n) <= 7]
    precedenti7 = [n for n in eventi if 7 < giorni(n) <= 14]

    def split_categorie(items: list[dict]) -> dict:
        return {
            "mortali": sum(1 for n in items if n["esito"] == "mortale"),
            "gravi": sum(1 for n in items if n["esito"] == "grave"),
            "totale": len(items),
        }

    # Contatore mensile alla data di generazione (per il dato LinkedIn)
    mese_corrente = now.strftime("%Y-%m")
    mese_precedente = (now.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    in_mese = [n for n in eventi if news_datetime(n).strftime("%Y-%m") == mese_corrente]
    mese_scorso = [n for n in eventi if news_datetime(n).strftime("%Y-%m") == mese_precedente]

    return {
        "finestra": 365,
        "generatoIl": utc_now(),
        "ultimi7": split_categorie(ultimi7),
        "precedenti7": split_categorie(precedenti7),
        "mese": {
            "codice": mese_corrente,
            "etichetta": f"{MESI_IT[now.month]} {now.year}",
            "mortali": sum(1 for n in in_mese if n["esito"] == "mortale"),
            "totale": len(in_mese),
        },
        "mesePrecedente": {
            "codice": mese_precedente,
            "mortali": sum(1 for n in mese_scorso if n["esito"] == "mortale"),
        },
    }


def carica_archivio() -> list[dict]:
    """Legge le notizie già salvate nel file (archivio storico).

    L'archivio si accumula giorno per giorno: ogni run aggiunge ciò che i
    fetch giornalieri raccolgono e il trim a 365 giorni scarta il resto.
    Non c'è scansione retroattiva del web.
    """
    if not OUT.exists():
        return []
    try:
        payload = json.loads(OUT.read_text(encoding="utf-8"))
        return payload.get("notizie", []) if isinstance(payload, dict) else []
    except (json.JSONDecodeError, OSError):
        return []


def main() -> int:
    archivio = carica_archivio()
    tutti: list[dict] = []
    # Fetch giornaliero: finestra 30 giorni (densa, per la cronaca corrente).
    # L'archivio non va a cercare articoli passati: si accumula con quello
    # che raccogliamo ogni giorno fino a coprire gli ultimi 365 giorni.
    for q in QUERIES:
        try:
            tutti.extend(fetch_rss(q, when="30d"))
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] query '{q}' (30d) fallita: {exc}")

    # Merge con l'archivio già salvato: gli item storici vengono riprocessati
    # dal pipeline attuale (stesse regole, deterministiche), quindi quando i
    # parametri di classificazione migliorano tutto l'archivio si rietichetta
    # da solo. I doppioni per titolo vengono eliminati da dedupe_titoli.
    tutti.extend(archivio)

    filtrate: list[dict] = []
    for n in dedupe_titoli(tutti):
        if is_itinere(n["titolo"]):
            continue
        prov, reg = estrai_luogo(n["titolo"])
        n["provincia"] = prov
        n["regione"] = reg
        n["tipo"] = classify_tipo(n["titolo"], n["fonte"])
        # I riassunti di più eventi ("Tre operai morti a Pistoia, Faenza e
        # Treviso") vanno trattati come report: contengono già eventi contati
        # singolarmente e distorcerebbero i KPI.
        if is_aggregate_report(n["titolo"]):
            n["tipo"] = "report"
        # Esito grezzo dal titolo: resta il gate di ammissione (come prima,
        # solo articoli che segnalano mortale o grave entrano nel dataset).
        n["esito"] = classify(n["titolo"])
        if n["esito"] not in ("mortale", "grave"):
            continue
        # Categoria pubblica: NATURA dell'articolo (fatto mortale/grave o
        # analisi), stabile nel tempo: non cambia con l'età della notizia.
        n["categoria"] = classify_categoria(n["titolo"], n["tipo"])
        score, reasons = work_accident_score(n["titolo"], n["fonte"])
        n["workAccidentScore"] = score
        n["scoreReasons"] = reasons
        n["sintesi"] = "" if n["tipo"] != "evento" else estrai_sintesi(n["titolo"])
        if score < MIN_WORK_ACCIDENT_SCORE:
            continue
        filtrate.append(n)

    filtrate = dedupe_eventi(filtrate)
    # Archivio: conserva gli ultimi 365 giorni di cronaca (gli item con data
    # non parsabile cadono, come già succedeva in coda all'ordinamento).
    ora = datetime.now(timezone.utc)
    filtrate = [
        n for n in filtrate
        if (ora - news_datetime(n)).total_seconds() / 86400 <= ARCHIVIO_GIORNI
    ]
    filtrate.sort(key=news_datetime, reverse=True)

    # Le stats devono contare gli EVENTI DISTINTI (un capo per gruppo), non
    # le notizie: altrimenti i KPI tornano gonfiati dai doppioni della cronaca
    # (stesso infortunio raccontato da più testate).
    stats = calcola_stats(filtrate)
    payload = {
        "schemaVersion": 7,
        "datasetId": "news_infortuni",
        "generatedAt": utc_now(),
        "fonte": "Google News RSS, filtro WORK_ACCIDENT_SCORE >= 45 (query: infortuni sul lavoro Italia)",
        "periodo": "ultimi 365 giorni (archivio)",
        "stats": stats,
        "notizie": filtrate[:MAX_KEEP],
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    # Tiene il registro artifact allineato: il file cambia a ogni esecuzione
    # (radar quotidiano), quindi si aggiorna subito hash e byte count così
    # la validazione in CI (validate-generated-artifacts.py) non fallisce.
    if REGISTRY.exists():
        try:
            registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
            entries = registry if isinstance(registry, list) else registry.get("artifacts", registry)
            if isinstance(entries, dict):
                entries = list(entries.values())
            content = OUT.read_bytes()
            sha = hashlib.sha256(content).hexdigest()
            for entry in entries:
                if isinstance(entry, dict) and entry.get("path") == "src/data/generated/news-infortuni.json":
                    entry["sha256"] = sha
                    entry["bytes"] = len(content)
                    break
            REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"[registry] aggiornato generated-artifacts.json ({sha[:12]}…)")
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] registro artifact non aggiornato: {exc}")
    print(f"[ok] {len(payload['notizie'])} notizie gravi/mortali -> {OUT}")
    for n in payload["notizie"][:8]:
        print(f"  [{n['categoria']}] score={n['workAccidentScore']} {n['titolo']} | {n.get('provincia')} ({n.get('regione')}) | {n['fonte']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
