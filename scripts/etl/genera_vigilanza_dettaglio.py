#!/usr/bin/env python3
"""ETL Monitoraggi INL: violazioni e sospensioni per settore, ATECO e casistiche SSL.

Fonte: Ispettorato Nazionale del Lavoro, sezione Monitoraggio e Report
(ispettorato.gov.it). PDF ufficiali "Monitoraggio attività di vigilanza"
(irregolarità accertate per settore/ATECO) e "Monitoraggio periodico dei
provvedimenti di sospensione" (art. 14, D.Lgs. 81/2008).

Estratto con pdfplumber (estrazione tabellare nativa da PDF con griglia).

Serie estratte:
- irregolaritaSettori: 2021-2025, 4 macro-settori x 17 tipologie violazione
- irregolaritaAteco:   2021-2024, 21 sezioni ATECO x 17 tipologie violazione
- sospensioniSettori:  2018-2025, totale, lavoro nero, gravi violazioni SSL,
                       revocate, % revocate, arresti, sequestri
- sospensioniAteco:    2022-2024, 21 sezioni ATECO x (adottate/revocate)
- casisticheSsl:       2025, 13 motivazioni di sospensione per SSL per settore

Regola del progetto: nessun aggregato multi-anno, ogni riga è un anno
singolo; i delta si calcolano lato UI.

Uso:
  python3 scripts/etl/genera_vigilanza_dettaglio.py [--raw-dir DIR] [--pdfplumber]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"
OUT = GEN / "vigilanza-dettaglio.json"
DEFAULT_RAW = ROOT / "data" / "raw" / "inl-monitoraggi"

# ---------------------------------------------------------------------------
# Colonne delle matrici "irregolarità accertate" (ordine nei PDF)
# ---------------------------------------------------------------------------
IRR_COLS = [
    "lavoratoriTutelati",       # Lavoratori cui si riferiscono le violazioni
    "lavoroNero",               # Lavoro nero (Lav.)
    "extracomunitariSprovvisti",# di cui extracomunitari sprovvisti permesso
    "caporalato",               # Caporalato / Sfruttamento art 603bis cp
    "interpositori",            # Fenomeni interpositori
    "distacco",                 # Distacco transnazionale
    "tutelaMinori",             # Tutela minori
    "riqualificazione",         # Riqualificazione
    "lavoratriciMadri",         # Lavoratrici madri e pari opportunità
    "paritaUomoDonna",          # Parità uomo/donna
    "orarioLavoro",             # Orario di lavoro
    "autotrasportoRegCE",       # Violazioni Reg CE 561/2006 C.d.S.
    "autotrasportoDlgs",        # Violazioni D.Lgs. N. 234/2007
    "violazioniSicurezza",      # N. Viol. Salute e Sicurezza
    "violazioniPenali",         # N. Viol. Penali (altre)
    "violazioniAmministrative", # N. Viol. Amministrative (altre)
    "coperturaAliquote",        # Copertura aliquote disabili
]

# Colonne sospensioni formato "macro-settori" (2022+)
SOSP_COLS = [
    "adottateTotale", "adottateInNero", "adottateGraviSsl",
    "revocateTotale", "revocateInNero", "revocateGraviSsl",
    "pctRevocate", "arresti", "sequestri",
]

# Colonne casistiche SSL (13 motivazioni art. 14 per gravi violazioni SSL)
SSL_COLS = [
    "mancanzaDvr", "mancanzaPee", "mancanzaSspRspp", "mancanzaPos",
    "mancanzaProtezioniVuoto", "mancanzaArmaturaSostegno",
    "lavoriVicinoLineeElettriche", "presenzaConduttoriNudi",
    "protezioneContattiDirettiIndiretti", "omessaVigilanzaDispositiviSicurezza",
    "mancataNotificaPreventiva", "mancataFormazioneAddestramento", "mancataFornituraDpi",
]

SETTORI = ["Agricoltura", "Industria", "Edilizia", "Terziario"]
SETTORI_ORDER = {s: i for i, s in enumerate(SETTORI)}

ATECO_SEZIONI = OrderedDict([
    ("A", "Agricoltura, silvicoltura e pesca"),
    ("B", "Estrazione di minerali da cave e miniere"),
    ("C", "Attività manifatturiere"),
    ("D", "Fornitura di energia elettrica, gas, vapore e aria condizionata"),
    ("E", "Fornitura di acqua; reti fognarie, gestione rifiuti e risanamento"),
    ("F", "Costruzioni"),
    ("G", "Commercio all'ingrosso e al dettaglio; riparazione di autoveicoli e motocicli"),
    ("H", "Trasporto e magazzinaggio"),
    ("I", "Attività dei servizi di alloggio e di ristorazione"),
    ("J", "Servizi di informazione e comunicazione"),
    ("K", "Attività finanziarie e assicurative"),
    ("L", "Attività immobiliari"),
    ("M", "Attività professionali, scientifiche e tecniche"),
    ("N", "Noleggio, agenzie di viaggio, servizi di supporto alle imprese"),
    ("O", "Amministrazione pubblica e difesa; assicurazione sociale obbligatoria"),
    ("P", "Istruzione"),
    ("Q", "Sanità e assistenza sociale"),
    ("R", "Attività artistiche, sportive, di intrattenimento e divertimento"),
    ("S", "Altre attività di servizi"),
    ("T", "Attività di famiglie e convivenze come datori di lavoro; produzione di beni e servizi indifferenziati"),
    ("U", "Organizzazioni ed organismi extraterritoriali"),
])

MACRO_ATECO = {
    "Agricoltura": ["A"],
    "Industria": ["B", "C", "D", "E"],
    "Edilizia": ["F"],
    "Terziario": ["G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"],
}


def num(s):
    """Estrae il primo numero da una stringa.

    Gestisce:
    - separatori di migliaia: '.'  (1.069 -> 1069)
    - spazi inseriti dentro il numero: '1 .069' -> 1069, '4 79' -> 479, '2 .736' -> 2736
    - percentuali: '84%' -> 84
    - vuoto / '-'
    """
    if s is None:
        return 0
    t = str(s).replace("\u20ac", "").strip()
    if not t or t in ("-", "/"):
        return 0
    # Normalizza: toglie gli spazi interni (es. '2 .736' -> '2.736'), ma non quelli tra parole
    t = re.sub(r"\s+", "", t)
    m = re.search(r"-?[\d.]+", t)
    if not m:
        return 0
    v = m.group(0).replace(".", "")
    if not v:
        return 0
    return int(v)


def norm(cell):
    """Normalizza una cella pdfplumber: rimuove newline interni e spazi."""
    if cell is None:
        return ""
    return re.sub(r"\s+", " ", str(cell)).strip()


def clean_rows(table):
    """Filtra righe vuote da una tabella pdfplumber."""
    out = []
    for r in table:
        cells = [norm(c) for c in r]
        if any(cells):
            out.append(cells)
    return out


def parse_irr_settori_pdf(path, anno):
    """Irregolarità per 4 macro-settori (2021-2025) con pdfplumber.

    Le colonne variano tra anni (es. 2022 senza 'Parità Uomo/Donna'), quindi
    le mappo dall'header riconoscendo le intestazioni per parole chiave.
    """
    import pdfplumber
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                cleaned = clean_rows(table)
                if not cleaned:
                    continue
                # Trova l'header: la riga con 'settore' e 'salute'
                hidx = None
                for i, r in enumerate(cleaned):
                    j = " ".join(r).lower()
                    if "settore" in j and "salute" in j:
                        hidx = i
                        break
                if hidx is None:
                    continue
                header = cleaned[hidx]
                # Mappa ogni colonna target all'indice nell'header
                targets = {
                    "lavoratoriTutelati": ["lavoratori"],
                    "lavoroNero": ["lavoro nero"],
                    "extracomunitariSprovvisti": ["extra comunitari", "permesso"],
                    "caporalato": ["caporalato"],
                    "interpositori": ["interpositori"],
                    "distacco": ["distacco"],
                    "tutelaMinori": ["minori"],
                    "riqualificazione": ["riqualificazione"],
                    "lavoratriciMadri": ["lavoratrici madri"],
                    "paritaUomoDonna": ["parità", "uomo/donna"],
                    "orarioLavoro": ["orario di lavoro"],
                    "autotrasportoRegCE": ["autotrasporto"],
                    "autotrasportoDlgs": ["autotrasporto"],
                    "violazioniSicurezza": ["salute e sicurezza"],
                    "violazioniPenali": ["penali"],
                    "violazioniAmministrative": ["amministrative"],
                    "coperturaAliquote": ["copertura", "quote disabili"],
                }
                colmap = {}
                for key, needles in targets.items():
                    if key == "autotrasportoRegCE":
                        # prima colonna autotrasporto
                        found = [i for i, c in enumerate(header) if "autotrasporto" in c.lower()]
                        colmap[key] = found[0] if found else None
                        continue
                    if key == "autotrasportoDlgs":
                        found = [i for i, c in enumerate(header) if "autotrasporto" in c.lower()]
                        colmap[key] = found[1] if len(found) > 1 else None
                        continue
                    for i, c in enumerate(header):
                        cl = c.lower()
                        if all(n in cl for n in needles):
                            colmap[key] = i
                            break
                for r in cleaned[hidx + 1:]:
                    if r[0] in SETTORI or r[0].strip().upper() == "ND":
                        rec = {"settore": r[0].strip().upper() if r[0].strip().upper() == "ND" else r[0], "anno": anno}
                        for key, idx in colmap.items():
                            rec[key] = num(r[idx]) if idx is not None and idx < len(r) else 0
                        rows.append(rec)
    return rows


def parse_irr_ateco_pdf(path, anno):
    """Irregolarità per sezione ATECO A-U (2021-2024) con pdfplumber.

    Stessa logica di mapping dall'header usata per i settori.
    """
    import pdfplumber
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                cleaned = clean_rows(table)
                if not cleaned:
                    continue
                hidx = None
                for i, r in enumerate(cleaned):
                    j = " ".join(r).lower()
                    if ("sezione" in j or "ateco" in j) and "salute" in j:
                        hidx = i
                        break
                if hidx is None:
                    continue
                header = cleaned[hidx]
                targets = {
                    "lavoratoriTutelati": ["lavoratori"],
                    "lavoroNero": ["lavoro nero"],
                    "extracomunitariSprovvisti": ["extra comunitari", "permesso"],
                    "caporalato": ["caporalato"],
                    "interpositori": ["interpositori"],
                    "distacco": ["distacco"],
                    "tutelaMinori": ["minori"],
                    "riqualificazione": ["riqualificazione"],
                    "lavoratriciMadri": ["lavoratrici madri"],
                    "paritaUomoDonna": ["parità", "uomo/donna"],
                    "orarioLavoro": ["orario di lavoro"],
                    "autotrasportoRegCE": ["autotrasporto"],
                    "autotrasportoDlgs": ["autotrasporto"],
                    "violazioniSicurezza": ["salute e sicurezza"],
                    "violazioniPenali": ["penali"],
                    "violazioniAmministrative": ["amministrative"],
                    "coperturaAliquote": ["copertura", "quote disabili"],
                }
                colmap = {}
                for key, needles in targets.items():
                    if key == "autotrasportoRegCE":
                        found = [i for i, c in enumerate(header) if "autotrasporto" in c.lower()]
                        colmap[key] = found[0] if found else None
                        continue
                    if key == "autotrasportoDlgs":
                        found = [i for i, c in enumerate(header) if "autotrasporto" in c.lower()]
                        colmap[key] = found[1] if len(found) > 1 else None
                        continue
                    for i, c in enumerate(header):
                        cl = c.lower()
                        if all(n in cl for n in needles):
                            colmap[key] = i
                            break
                for r in cleaned[hidx + 1:]:
                    m = re.match(r"^\s*-\s*([A-U])\s+", r[0])
                    if not m:
                        continue
                    lett = m.group(1)
                    rec = {
                        "sezione": lett,
                        "descrizione": ATECO_SEZIONI.get(lett, ""),
                        "anno": anno,
                    }
                    for key, idx in colmap.items():
                        rec[key] = num(r[idx]) if idx is not None and idx < len(r) else 0
                    rows.append(rec)
    return rows


def detect_header(rows, needles):
    """Trova l'indice della riga di header contenente tutte le needle richieste."""
    for i, r in enumerate(rows):
        joined = " ".join(r).lower()
        if all(n.lower() in joined for n in needles):
            return i
    return None


def parse_sosp_macro_pdf(path, anno):
    """Sospensioni per macro-settore (2022-2025, divisione inNero/SSL).

    Layout per anno (indici colonna nella tabella pdfplumber):
    2022: settore, totaleAd, inNero, graviSsl, totaleRev, revInNero, revSsl, %, arresti, sequestri
    2023: settore, ateco, totaleAd, soloInNero, inNero+ssl, soleGraviSsl, totaleRev, revInNero, revSsl, %, arresti, sequestri
    2024: settore, totaleAd, soloInNero, inNero+ssl, soleGraviSsl, totaleRev, revInNero, revSsl, %, arresti, sequestri
    2025: settore, ateco, soloInNero, inNero+viol, graviSsl, totaleAd, revInNero, revInNero+viol, revSsl, totaleRev, %, sequestri, arresti
    """
    import pdfplumber
    layout = {
        # 2022: settore, totaleAd, inNero, graviSsl, totaleRev, revInNero, revSsl, %, arresti, sequestri
        2022: {"adTot": 1, "adNero": 2, "adSsl": 3, "revTot": 4, "revNero": 5, "revSsl": 6, "pct": 7, "arr": 8, "seq": 9},
        # 2023: settore, ateco, totaleAd, soloInNero, inNero+gravi, soleGraviSsl, revTot, revInNero, revInNero+gravi(rev SSL), %, arresti, sequestri
        2023: {"adTot": 2, "adNero": 3, "adSsl": (4, 5), "revTot": 6, "revNero": 7, "revSsl": 8, "pct": 9, "arr": 10, "seq": 11},
        # 2024: settore, totaleAd, soloInNero, inNero+gravi, soleGraviSsl, revTot, revInNero, revInNero+gravi(rev SSL), %, arresti, sequestri
        2024: {"adTot": 1, "adNero": 2, "adSsl": (3, 4), "revTot": 5, "revNero": 6, "revSsl": 7, "pct": 8, "arr": 9, "seq": 10},
        # 2025: settore, ateco, soloInNero, inNero+viol, graviSsl, totaleAd, revInNero, revInNero+viol, revSsl, totaleRev, %, sequestri, arresti
        2025: {"adTot": 5, "adNero": 2, "adSsl": 4, "revTot": 9, "revNero": 6, "revSsl": 8, "pct": 10, "seq": 11, "arr": 12},
    }
    L = layout.get(anno)
    if not L:
        return []
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for r in clean_rows(table):
                    if r[0] not in SETTORI and r[0].strip().upper() != "ND":
                        continue
                    def g(k, default=0):
                        spec = L[k]
                        if isinstance(spec, tuple):
                            tot = 0
                            for idx in spec:
                                if len(r) > idx:
                                    tot += num(r[idx])
                            return tot
                        idx = spec
                        if isinstance(idx, str):
                            return 0
                        return num(r[idx]) if len(r) > idx else default
                    rows.append({
                        "settore": r[0],
                        "anno": anno,
                        "adottateTotale": g("adTot"),
                        "adottateInNero": g("adNero"),
                        "adottateGraviSsl": g("adSsl"),
                        "revocateTotale": g("revTot"),
                        "revocateInNero": g("revNero"),
                        "revocateGraviSsl": g("revSsl"),
                        "pctRevocate": g("pct"),
                        "arresti": g("arr"),
                        "sequestri": g("seq"),
                    })
    return rows


def parse_sosp_ateco_pre2021_pdf(path, anno):
    """Sospensioni per sezione ATECO A-U (2018-2021): formato macrocategorie.

    Nel 2018-2021 la tabella ha colonne:
    settore | lettera ATECO | adottate | revocate | % | arresti | sequestri
    """
    import pdfplumber
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for r in clean_rows(table):
                    if len(r) < 6:
                        continue
                    cells = [norm(c) for c in r]
                    # riga dati: esiste una lettera A-U isolata
                    lett = None
                    for tk in cells:
                        if re.fullmatch(r"[A-U]", tk):
                            lett = tk
                            break
                    if not lett:
                        continue
                    if lett == "U" and cells[1] == "U" and cells[0] in ("", "TOTALE"):
                        continue
                    # Indici: 0=settore, 1=lettera, 2=adottate, 3=revocate, 4=%, 5=arresti, 6=sequestri
                    adottate = num(cells[2])
                    revocate = num(cells[3])
                    pct = num(cells[4]) if len(cells) > 4 else None
                    arresti = num(cells[5]) if len(cells) > 5 else 0
                    sequestri = num(cells[6]) if len(cells) > 6 else 0
                    rows.append({
                        "sezione": lett,
                        "descrizione": ATECO_SEZIONI.get(lett, ""),
                        "anno": anno,
                        "adottateTotale": adottate,
                        "revocateTotale": revocate,
                        "pctRevocate": pct,
                        "arresti": arresti,
                        "sequestri": sequestri,
                    })
    return rows


def parse_sosp_ateco_pdf(path, anno):
    """Sospensioni per sezione ATECO (2022-2024, divisione inNero/SSL).

    Layout per anno (pdfplumber colonne):
    2022: settore, MACRO_ATECO lettera, totaleAd, inNero, graviSsl, totaleRev, revInNero, revSsl, %, arresti, sequestri
    2023/24: settore(nome completo), totaleAd, soloInNero, inNero+gravi, soleGraviSsl, totaleRev, revInNero, revInNero+gravi, revSsl, %, arresti, sequestri
    """
    import pdfplumber
    # Mapping nome settore -> lettera ATECO (per i file dove la lettera non c'è)
    name_to_letter = {v: k for k, v in ATECO_SEZIONI.items()}
    def _norm(t):
        # normalizza accenti, apostrofi e spazi per il confronto
        t = t.lower().replace("'", "").replace("’", "").replace("`", "")
        t = t.replace("à", "a").replace("è", "e").replace("é", "e").replace("ì", "i").replace("ò", "o").replace("ù", "u")
        return t
    def letter_from_name(name):
        n = _norm(name).strip()
        for full, lett in sorted(name_to_letter.items(), key=lambda kv: -len(kv[0])):
            fn = _norm(full)
            if n.startswith(fn[:14]) or fn.startswith(n[:14]):
                return lett
        return None

    layout = {
        2022: {"adTot": 2, "adNero": 3, "adSsl": 4, "revTot": 5, "revNero": 6, "revSsl": 7, "pct": 8, "arr": 9, "seq": 10},
        # 2023/24: settore, totaleAd, soloInNero, inNero+gravi, soleGraviSsl, revTot, revInNero, revInNero+gravi(rev SSL), %, arresti, sequestri
        2023: {"adTot": 1, "adNero": 2, "adSsl": (3, 4), "revTot": 5, "revNero": 6, "revSsl": 7, "pct": 8, "arr": 9, "seq": 10},
        2024: {"adTot": 1, "adNero": 2, "adSsl": (3, 4), "revTot": 5, "revNero": 6, "revSsl": 7, "pct": 8, "arr": 9, "seq": 10},
    }
    L = layout.get(anno)
    if not L:
        return []
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for r in clean_rows(table):
                    if len(r) < 9:
                        continue
                    # 2022: lettera isolata tra le celle
                    if anno == 2022:
                        lett = None
                        for tk in r[1:]:
                            if re.fullmatch(r"[A-U]", tk):
                                lett = tk
                                break
                        if not lett:
                            continue
                    else:
                        if r[0].strip().upper() in ("TOTALE", "ND", ""):
                            continue
                        lett = letter_from_name(r[0])
                        if not lett:
                            continue
                    def g(k, default=0):
                        spec = L[k]
                        if isinstance(spec, tuple):
                            tot = 0
                            for idx in spec:
                                if len(r) > idx:
                                    tot += num(r[idx])
                            return tot
                        idx = spec
                        return num(r[idx]) if len(r) > idx else default
                    rows.append({
                        "sezione": lett,
                        "descrizione": ATECO_SEZIONI.get(lett, ""),
                        "anno": anno,
                        "adottateTotale": g("adTot"),
                        "adottateInNero": g("adNero"),
                        "adottateGraviSsl": g("adSsl"),
                        "revocateTotale": g("revTot"),
                        "revocateInNero": g("revNero"),
                        "revocateGraviSsl": g("revSsl"),
                        "pctRevocate": g("pct"),
                        "arresti": g("arr"),
                        "sequestri": g("seq"),
                    })
    return rows


def parse_casistiche_ssl_pdf(path, anno):
    """Casistiche SSL (2025): 13 motivazioni per settore.

    Tabella: settore | Ateco 2025 | DVR | PEE | SSP/RSPP | POS | ... (col2+)
    """
    import pdfplumber
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for r in clean_rows(table):
                    if r[0] in SETTORI or r[0].strip().upper() == "ND":
                        nums = [num(c) for c in r[2:]]
                        if len(nums) >= len(SSL_COLS):
                            rows.append({
                                "settore": r[0].strip().upper() if r[0].strip().upper() == "ND" else r[0],
                                "anno": anno,
                                **dict(zip(SSL_COLS, nums[:len(SSL_COLS)])),
                            })
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw-dir", default=str(DEFAULT_RAW), help="Directory PDF monitoraggi")
    args = ap.parse_args()
    raw = Path(args.raw_dir)

    try:
        import pdfplumber  # noqa: F401
    except ImportError:
        print("Serve pdfplumber: installa con pip install pdfplumber", file=sys.stderr)
        return 2

    IR = {2021: "irr_sett_2021.pdf", 2022: "irr_sett_2022.pdf", 2023: "irr_sett_2023.pdf", 2024: "irr_sett_2024.pdf", 2025: "irr_sett_2025.pdf"}
    IA = {2021: "irr_ateco_2021.pdf", 2022: "irr_ateco_2022.pdf", 2023: "irr_ateco_2023.pdf", 2024: "irr_ateco_2024.pdf"}
    SS = {2018: "sosp_sett_2018.pdf", 2019: "sosp_sett_2019.pdf", 2020: "sosp_sett_2020.pdf", 2021: "sosp_sett_2021.pdf", 2022: "sosp_sett_2022.pdf", 2023: "sosp_sett_2023.pdf", 2024: "sosp_sett_2024.pdf", 2025: "sosp_sett_2025.pdf"}
    SA = {2022: "sosp_ateco_2022.pdf", 2023: "sosp_ateco_2023.pdf", 2024: "sosp_ateco_2024.pdf"}

    irregolaritaSettori, irregolaritaAteco = [], []
    sospensioniSettori, sospensioniAteco, casisticheSsl = [], [], []

    for anno, rel in IR.items():
        rows = parse_irr_settori_pdf(raw / rel, anno)
        print(f"irregolarità settori {anno}: {len(rows)} righe")
        irregolaritaSettori.extend(rows)

    for anno, rel in IA.items():
        rows = parse_irr_ateco_pdf(raw / rel, anno)
        print(f"irregolarità ATECO {anno}: {len(rows)} righe")
        irregolaritaAteco.extend(rows)

    # Sospensioni 2018-2021: sezioni ATECO -> aggregazione ai macro
    for anno in (2018, 2019, 2020, 2021):
        rows = parse_sosp_ateco_pre2021_pdf(raw / SS[anno], anno)
        print(f"sospensioni {anno}: {len(rows)} righe sezioni")
        if not rows:
            continue
        agg = {}
        for r in rows:
            macro = next((m for m, sez in MACRO_ATECO.items() if r["sezione"] in sez), None)
            if not macro:
                continue
            agg.setdefault(macro, {"adottateTotale": 0, "revocateTotale": 0, "arresti": 0, "sequestri": 0})
            agg[macro]["adottateTotale"] += r["adottateTotale"]
            agg[macro]["revocateTotale"] += r["revocateTotale"]
            agg[macro]["arresti"] += r["arresti"]
            agg[macro]["sequestri"] += r["sequestri"]
        for macro, v in agg.items():
            sospensioniSettori.append({
                "settore": macro, "anno": anno,
                "adottateTotale": v["adottateTotale"], "adottateInNero": None,
                "adottateGraviSsl": None,
                "revocateTotale": v["revocateTotale"], "revocateInNero": None,
                "revocateGraviSsl": None,
                "pctRevocate": round(100 * v["revocateTotale"] / v["adottateTotale"], 1) if v["adottateTotale"] else None,
                "arresti": v["arresti"], "sequestri": v["sequestri"],
            })

    # Sospensioni 2022-2025: macro-settori con divisione
    for anno in (2022, 2023, 2024, 2025):
        rows = parse_sosp_macro_pdf(raw / SS[anno], anno)
        print(f"sospensioni macro {anno}: {len(rows)} righe")
        sospensioniSettori.extend(rows)

    # Sospensioni ATECO 2022-2024
    for anno, rel in SA.items():
        rows = parse_sosp_ateco_pdf(raw / rel, anno)
        print(f"sospensioni ATECO {anno}: {len(rows)} righe")
        sospensioniAteco.extend(rows)

    # Casistiche SSL 2025
    rows = parse_casistiche_ssl_pdf(raw / "sosp_casistiche_ssl_2025.pdf", 2025)
    print(f"casistiche SSL 2025: {len(rows)} righe")
    casisticheSsl.extend(rows)

    # ------------------------------------------------------------------
    # Validazione incrociata con i totali ufficiali noti
    # ------------------------------------------------------------------
    def tot(rows, campo):
        return sum(r.get(campo, 0) or 0 for r in rows)

    def check(label, cond, val, atteso):
        print(f"  [{'OK ' if cond else 'FAIL'}] {label}: {val} (atteso {atteso})")
        return cond

    print("\nValidazione incrociata con Rapporti annuali INL:")
    ok = True
    vss = {a: tot([r for r in irregolaritaSettori if r["anno"] == a], "violazioniSicurezza")
           for a in (2021, 2022, 2023, 2024, 2025)}
    attesi_vss = {2021: 17643, 2022: 25481, 2023: 36680, 2024: 83330, 2025: 89851}
    for a, v in vss.items():
        ok &= check(f"violazioni sicurezza {a}", abs(v - attesi_vss[a]) <= 1, v, attesi_vss[a])

    t22 = tot([r for r in sospensioniSettori if r["anno"] == 2022], "adottateTotale")
    t23 = tot([r for r in sospensioniSettori if r["anno"] == 2023], "adottateTotale")
    t24 = tot([r for r in sospensioniSettori if r["anno"] == 2024], "adottateTotale")
    t25 = tot([r for r in sospensioniSettori if r["anno"] == 2025], "adottateTotale")
    ok &= check("sospensioni 2022", t22 == 8210, t22, 8210)
    ok &= check("sospensioni 2023", t23 == 11174, t23, 11174)
    ok &= check("sospensioni 2024", t24 == 15002, t24, 15002)
    ok &= check("sospensioni 2025", t25 == 13263, t25, 13263)

    gssl = {a: tot([r for r in sospensioniSettori if r["anno"] == a], "adottateGraviSsl")
            for a in (2022, 2023, 2024, 2025)}
    attesi_gssl = {2022: 2814, 2023: 4098, 2024: 5601, 2025: 3708}
    for a, v in gssl.items():
        ok &= check(f"sospensioni gravi SSL {a}", v == attesi_gssl[a], v, attesi_gssl[a])

    # ------------------------------------------------------------------
    # Output
    # ------------------------------------------------------------------
    dataset = {
        "schemaVersion": 1,
        "datasetId": "vigilanza-inl-dettaglio",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "periodo": "2018-2025 (serie per anno, nessun aggregato multi-anno)",
        "nota": ("Monitoraggi INL: irregolarità accertate per settore (2021-2025) e sezione ATECO "
                 "(2021-2024); provvedimenti di sospensione art. 14 D.Lgs. 81/2008 per settore "
                 "(2018-2025) e ATECO (2022-2024), distinti per lavoro nero vs gravi violazioni SSL "
                 "dal 2022; casistiche delle sospensioni per gravi violazioni SSL (2025). "
                 "Fonte: ispettorato.gov.it, sezione Monitoraggio e Report. "
                 "Nessun dato a livello di singola azienda: solo aggregati pubblici. "
                 "Nota di coerenza: in alcuni anni la somma delle righe può scostarsi di 1 unità "
                 "dal totale ufficiale INAIL (riattribuzioni tra 'non determinato' e settori); "
                 "il totale ufficiale è riportato nei dataset Vigilanza INL esistenti."),
        "fonte": "INL — Monitoraggio attività di vigilanza e Monitoraggio periodico provvedimenti di sospensione",
        "irregolaritaSettori": sorted(irregolaritaSettori, key=lambda r: (r["anno"], SETTORI_ORDER.get(r["settore"], 99))),
        "irregolaritaAteco": sorted(irregolaritaAteco, key=lambda r: (r["anno"], r["sezione"])),
        "sospensioniSettori": sorted(sospensioniSettori, key=lambda r: (r["anno"], SETTORI_ORDER.get(r["settore"], 99))),
        "sospensioniAteco": sorted(sospensioniAteco, key=lambda r: (r["anno"], r["sezione"])),
        "casisticheSsl": sorted(casisticheSsl, key=lambda r: (r["anno"], SETTORI_ORDER.get(r["settore"], 99))),
        "meta": {
            "colonneIrregolarita": IRR_COLS,
            "colonneSospensioni": SOSP_COLS,
            "colonneCasisticheSsl": SSL_COLS,
            "sezioniAteco": ATECO_SEZIONI,
            "macrosettoriAteco": MACRO_ATECO,
        },
    }

    GEN.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nScritto {OUT} ({OUT.stat().st_size} byte)")
    print(f"  irregolaritaSettori: {len(irregolaritaSettori)} righe")
    print(f"  irregolaritaAteco:   {len(irregolaritaAteco)} righe")
    print(f"  sospensioniSettori:  {len(sospensioniSettori)} righe")
    print(f"  sospensioniAteco:    {len(sospensioniAteco)} righe")
    print(f"  casisticheSsl:       {len(casisticheSsl)} righe")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())