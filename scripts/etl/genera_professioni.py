#!/usr/bin/env python3
"""Genera l'analisi per gruppo professionale per la pagina professioni.

Ingresso: src/data/generated/informo-mortali-dettaglio.json
Uscita:   public/data/informo-professioni.json

Il campo mansione Infor.MO arriva già come etichetta tassonomizzata (stile
denominazioni CP 2011), non come testo libero: 43 etichette distinte su 2.617
casi. Questo script le mappa sui grandi gruppi CP 2011 (INAPP) con una tabella
curata, corregge il mojibake (Ã -> à, ecc.) e produce:

  - distribuzione per grande gruppo professionale, per anno (RULES.md regola 1)
  - top mansioni specifiche per anno (escluse le categorie di scarto)
  - report di copertura nel meta: quanto pesano 'Altre mansioni' (scarto INAIL)
    e i casi senza mansione, in modo che la copertura sia sempre dichiarata.

Metodo: mapping curato etichetta Infor.MO -> grande gruppo CP 2011 (1-9),
con override espliciti. Le etichette non mappate cadono in 'Non classificabile'.
Nessun fuzzy matching: il campo è già tassonomizzato, il rischio era il testo
libero, che qui non c'è.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DET = ROOT / "src" / "data" / "generated" / "informo-mortali-dettaglio.json"
OUT = ROOT / "public" / "data" / "informo-professioni.json"

TOP_MANSIONI = 15  # voci specifiche per anno nella vista dedicata

# Grandi gruppi CP 2011 (INAPP). Codice, etichetta breve.
GRUPPI = {
    "1": "Legislatori, imprenditori e alta direzione",
    "2": "Professioni intellettuali, scientifiche e di elevata specializzazione",
    "3": "Professioni tecniche",
    "4": "Professioni esecutive nel lavoro d'ufficio",
    "5": "Professioni qualificate nelle attività commerciali e nei servizi",
    "6": "Artigiani, operai specializzati e agricoltori",
    "7": "Operai specializzati e conduttori di impianti e macchine",
    "8": "Professioni non qualificate",
    "9": "Forze armate",
}

# Mapping curato: etichetta Infor.MO (normalizzata) -> codice grande gruppo.
# Le chiavi sono le etichette esatte osservate nel dataset 2014-2024.
MAP = {
    "Imprenditori, amministratori e direttori di grandi aziende, gestori e responsabili di piccole imprese": "1",
    "Professioni intellettuali, scientifiche e di elevata specializzazione (medici, fisici, ingegneri, ...)": "2",
    "Professioni tecniche (tecnici, segretari, periti, insegnanti, istruttori, ...)": "3",
    "Impiegati": "4",
    "Professioni qualificate nelle attivita' commerciali e nei servizi": "5",
    "Commercianti ambulanti": "5",
    "Agricoltori e operai agricoli specializzati": "6",
    "Allevatori e operai specializzati della zootecnia": "6",
    "Lavoratori forestali specializzati": "6",
    "Pescatori e cacciatori": "6",
    "Artigiani e operai specializzati dell'installazione e della manutenzione di attrezzature elettriche ed elettroniche": "6",
    "Artigiani ed operai specializzati addetti alle rifiniture delle costruzioni, alla pitturazione ed alla pulizia degli esterni degli edifici, alla pulizia ed all'igiene degli edifici ed assimilati;": "6",
    "Artigiani ed operai specializzati della meccanica di precisione su metalli e materiali similari": "6",
    "Artigiani ed operai specializzati delle attivita' poligrafiche e dei laboratori fotografici": "6",
    "Artigiani ed operai specializzati delle attività poligrafiche e dei laboratori fotografici": "6",
    "Artigiani ed operai specializzati delle lavorazioni alimentari": "6",
    "Carpentieri e falegnami nell'edilizia (esclusi i parchettisti)": "6",
    "Fabbri ferrai costruttori di utensili ed assimilati": "6",
    "Fonditori, saldatori, lattonieri-calderai, montatori di carpenteria metallica ed assimilati": "6",
    "Meccanici artigianali, montatori, riparatori e manutentori di macchine fisse e mobili (esclusi gli addetti alle linee di montaggio industriale)": "6",
    "Minatori, cavatori, tagliatori di pietre e affini": "7",
    "Muratori": "6",
    "Pontatori e ponteggiatori; Armatori di gallerie, addetti all'armamento ferroviario ed assimilati; Altri artigiani ed operai addetti all'edilizia": "6",
    "Conduttori di forni ed altri impianti per la lavorazione del vetro, della ceramica e di materiali similari": "7",
    "Conduttori di macchinari per la fabbricazione di articoli in gomma e materie plastiche": "7",
    "Conduttori di macchine per movimento terra, di macchine di sollevamento e di maneggio dei materiali": "7",
    "Conduttori di mezzi pesanti e camion": "7",
    "Guidatori di motociclette e furgoncini; Autisti di taxi, automobili, furgoni, autobus, tram e filobus": "7",
    "Marinai di coperta e operai assimilati": "7",
    "Operai addetti a macchinari dell'industria tessile e delle confezioni ed assimilati": "7",
    "Operai addetti a macchinari fissi nell'agricoltura, nella prima trasformazione dei prodotti agricoli e nell'industria alimentare": "7",
    "Operai addetti a macchinari in impianti per la produzione in serie di articoli in legno": "7",
    "Operai addetti a macchinari per la fabbricazione di prodotti derivati dalla chimica e lavorazioni affini": "7",
    "Operai addetti a macchine automatiche e semiautomatiche per lavorazioni metalliche e per prodotti minerali": "7",
    "Operai addetti ad assemblaggio e/o a macchine confezionatrici di prodotti industriali": "7",
    "Personale forestale non qualificato": "8",
    "Personale non qualificato addetto alla cura degli animali, alla pesca e alla caccia": "8",
    "Personale non qualificato dell'agricoltura": "8",
    "Personale non qualificato nei servizi turistici": "8",
    "Professioni non qualificate delle miniere, delle costruzioni, e delle attivita' industriali": "8",
    "Professioni non qualificate delle miniere, delle costruzioni, e delle attività industriali": "8",
    "Professioni non qualificate nei servizi alle persone ed assimilati": "8",
    "Professioni non qualificate nei servizi di istruzione e sanitari": "8",
}

# Categorie di scarto INAIL (non professione, gestite a parte)
SCARTO = {"Altre mansioni"}


def fix_mojibake(s: str) -> str:
    """Corregge i caratteri rovinati da un doppio encoding UTF-8 -> Latin-1."""
    return (
        s.replace("Ã ", "à ")
        .replace("Ã¨", "è")
        .replace("Ã©", "é")
        .replace("Ã¬", "ì")
        .replace("Ã²", "ò")
        .replace("Ã¹", "ù")
        .replace("Ã¡", "á")
        .replace("Ã´", "ô")
    )


def clean(v: str | None) -> str | None:
    if not v:
        return None
    v = fix_mojibake(re.sub(r"\s+", " ", str(v).strip()))
    return v or None


def main() -> int:
    data = json.loads(DET.read_text(encoding="utf-8"))
    casi = data["casi"]
    anni = sorted({c.get("anno") for c in casi if c.get("anno")})

    # Passo 1: etichette uniche e copertura
    counter = Counter(clean(c.get("mansione")) for c in casi)
    tot = len(casi)
    scarto = sum(n for et, n in counter.items() if et in SCARTO)
    non_class = sum(n for et, n in counter.items() if et not in SCARTO and et not in MAP and et is not None)
    mancanti = counter.get(None, 0)
    mappate = tot - scarto - non_class - mancanti

    # Passo 2: distribuzione per gruppo x anno
    gruppi_out = []
    for cod, nome in GRUPPI.items():
        per_anno = []
        for anno in anni:
            casi_anno = [c for c in casi if c.get("anno") == anno]
            n = sum(
                1
                for c in casi_anno
                if MAP.get(clean(c.get("mansione"))) == cod
            )
            per_anno.append(
                {
                    "anno": anno,
                    "casi": n,
                    "quota": round(n / len(casi_anno) * 100, 1) if casi_anno else 0,
                }
            )
        totale_gruppo = sum(p["casi"] for p in per_anno)
        gruppi_out.append(
            {
                "codice": cod,
                "nome": nome,
                "casi": totale_gruppo,
                "quota": round(totale_gruppo / tot * 100, 1) if tot else 0,
                "perAnno": per_anno,
            }
        )

    # Passo 3: top mansioni specifiche per anno (escluse le categorie di scarto)
    top_out = []
    for anno in anni:
        cnt = Counter(
            clean(c.get("mansione"))
            for c in casi
            if c.get("anno") == anno
            and clean(c.get("mansione")) not in SCARTO
            and clean(c.get("mansione")) is not None
        )
        tot_anno = sum(cnt.values())
        top_out.append(
            {
                "anno": anno,
                "totale": tot_anno,
                "voci": [
                    {"mansione": m, "casi": n, "quota": round(n / tot_anno * 100, 1) if tot_anno else 0}
                    for m, n in cnt.most_common(TOP_MANSIONI)
                ],
            }
        )

    # Passo 4: report etichette non mappate (da rivedere manualmente)
    non_mappate = [
        {"mansione": et, "casi": n}
        for et, n in counter.items()
        if et not in SCARTO and et not in MAP and et is not None
    ]

    payload = {
        "meta": {
            "fonte": "INAIL - Infor.MO / InformoWeb (tipoEvento=1, casi mortali)",
            "periodo": f"{anni[0]}-{anni[-1]}",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "metodo": "Il campo mansione Infor.MO arriva già come etichetta "
                      "tassonomizzata (43 etichette distinte), non testo libero. "
                      "Mapping curato verso i grandi gruppi CP 2011 (INAPP). "
                      "Nessun fuzzy matching.",
            "copertura": {
                "casiTotali": tot,
                "mappateAGruppo": mappate,
                "quotaMappate": round(mappate / tot * 100, 1) if tot else 0,
                "scartoAltreMansioni": scarto,
                "quotaScarto": round(scarto / tot * 100, 1) if tot else 0,
                "senzaMansione": mancanti,
                "quotaSenza": round(mancanti / tot * 100, 1) if tot else 0,
                "nonClassificabili": non_class,
                "quotaNonClass": round(non_class / tot * 100, 1) if tot else 0,
            },
            "etichetteNonMappate": non_mappate,
            "criteri": "Quote riferite al totale dei casi (o del gruppo/anno). "
                       "Nessun aggregato multi-anno. La copertura del campo "
                       "mansione è dichiarata nel meta.",
        },
        "gruppi": gruppi_out,
        "topMansioni": top_out,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024

    print(f"[informo-professioni] {len(gruppi_out)} gruppi, {kb:.1f} KB -> {OUT}")
    print(f"  copertura: {mappate}/{tot} mappate ({round(mappate/tot*100,1)}%)")
    print(f"  scarto 'Altre mansioni': {scarto} ({round(scarto/tot*100,1)}%)")
    print(f"  senza mansione: {mancanti} ({round(mancanti/tot*100,1)}%)")
    print(f"  etichette non mappate: {non_class} casi / {len(non_mappate)} etichette")
    return 0


if __name__ == "__main__":
    sys.exit(main())
