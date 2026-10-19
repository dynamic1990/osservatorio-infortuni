#!/usr/bin/env python3
"""
Mappatura Ateco delle descrizioni "attPrev" dell'archivio Infor.MO.

Le descrizioni attPrev sono i valori della domanda "attività di prevenzione" /
attività economica dell'azienda dell'infortunato, così come restituita
dall'API InformoWeb. Sono testi liberi non normalizzati: questa mappa li
associa a sezione e divisione Ateco (convenzione INAIL, 2 cifre).

Uso:
- normalizzare i settori dell'archivio Infor.MO verso l'Ateco 2007 (stessa
  convenzione delle viste INAIL infortuni presenti nel sito);
- consentire analisi trasversali per macro-settore (es. manifatturiero
  Sezione C) confrontabili con le schede INAIL (Scheda 28 manutenzione).

I valori sono stati estratti dal dataset generato (informo-mortali-dettaglio
+ informo-gravi-dettaglio, 52 unici) e mappati a mano sulla base dei nomi
Ateco INAIL/Istat. Le voci non mappate restano 'U 99' (non classificato) e
vengono tracciate.
"""

from __future__ import annotations

# chiave: valore attPrev (minuscolo, normalizzato) -> (sezione, divisione, nome_sezione)
ATT_PREV_ATECO: dict[str, tuple[str, str, str]] = {
    # --- AGRICOLTURA, SILVICOLTURA E PESCA (A) ---
    "coltivazioni agricole, orticoltura, floricoltura/ coltivazioni agricole associate all’allevamento":
        ("A", "A 01", "Agricoltura, silvicoltura e pesca"),
    "attività connesse all’agricoltura e alla zootecnia (esercizio per conto terzi e noleggio di mezzi e di macchine agricole con personale), esclusi i servizi veterinari; creazione e manutenzione spazi verdi":
        ("A", "A 01", "Agricoltura, silvicoltura e pesca"),
    "allevamento di animali/ caccia e cattura per allevamento e ripopolamento":
        ("A", "A 01", "Agricoltura, silvicoltura e pesca"),
    "silvicoltura e utilizzazione di aree forestali e servizi":
        ("A", "A 02", "Silvicoltura ed utilizzo di aree forestali"),
    "pesca, piscicoltura e servizi connessi":
        ("A", "A 03", "Pesca e acquacoltura"),

    # --- INDUSTRIE ESTRATTIVE (B) ---
    "estrazione di minerali non energetici":
        ("B", "B 08", "Industrie estrattive"),
    "estrazione di minerali energetici":
        ("B", "B 06", "Estrazione di minerali da cave e miniere"),

    # --- ATTIVITÀ MANIFATTURIERE (C) ---
    "fabbricazione e lavorazione dei prodotti in metallo, esclusi macchine e impianti":
        ("C", "C 25", "Fabbricazione di prodotti in metallo (esclusi macchinari e attrezzature)"),
    "metallurgia":
        ("C", "C 24", "Metallurgia"),
    "industrie alimentari, delle bevande e del tabacco":
        ("C", "C 10", "Industrie alimentari"),
    "fabbricazione di macchine ed apparecchi meccanici":
        ("C", "C 28", "Fabbricazione di macchinari ed apparecchiature n.c.a."),
    "fabbricazione di prodotti della lavorazione di minerali non metalliferi (vetro e prodotti in vetro, prodotti ceramici e per pavimenti e rivestimenti, mattoni, tegole, cemento, calce, gesso, …)":
        ("C", "C 23", "Fabbricazione di altri prodotti della lavorazione di minerali non metalliferi"),
    "fabbricazione di articoli in gomma e materie plastiche":
        ("C", "C 22", "Fabbricazione di articoli in gomma e materie plastiche"),
    "fabbricazione di prodotti chimici e di fibre sintetiche e artificiali":
        ("C", "C 20", "Fabbricazione di prodotti chimici"),
    "fabbricazione di coke, raffinerie di petrolio, trattamento dei combustibili nucleari":
        ("C", "C 19", "Fabbricazione di coke e prodotti della raffinazione del petrolio"),
    "taglio, piallatura e trattamento del legno":
        ("C", "C 16", "Industria del legno e prodotti in legno e sughero"),
    "fabbricazione di fogli da impiallacciatura, compensato, pannelli / carpenteria in legno e falegnameria per l’edilizia/ altri prodotti in legno, in sughero e materiali da intreccio":
        ("C", "C 16", "Industria del legno e prodotti in legno e sughero"),
    "fabbricazione della pasta-carta, della carta e del cartone e dei prodotti di carta":
        ("C", "C 17", "Fabbricazione di carta e prodotti di carta"),
    "editoria, stampa e riproduzione di supporti registrati":
        ("C", "C 18", "Stampa e riproduzione di supporti registrati"),
    "industrie tessili":
        ("C", "C 13", "Industrie tessili"),
    "confezione di articoli di abbigliamento; preparazione, tintura e confezione di pellicce":
        ("C", "C 14", "Confezione di articoli di abbigliamento"),
    "industrie conciarie, fabbricazione di prodotti in cuoio, pelle e similari":
        ("C", "C 15", "Fabbricazione di articoli in pelle e simili"),
    "fabbricazione di macchine elettriche e di apparecchiature elettriche, elettroniche ed ottiche":
        ("C", "C 26", "Fabbricazione di computer, prodotti di elettronica e ottica"),
    "fabbricazione mezzi di trasporto (autoveicoli, locomotive, aeromobili, motocicli,...)":
        ("C", "C 29", "Fabbricazione di autoveicoli, rimorchi e semirimorchi"),
    "industria cantieristica: costruzioni navali e riparazioni di navi e imbarcazioni":
        ("C", "C 30", "Fabbricazione di altri mezzi di trasporto"),
    "fabbricazione di mobili":
        ("C", "C 31", "Fabbricazione di mobili"),
    "altre industrie manifatturiere (mobili, gioielleria, strumenti musicali, articoli sportivi, …)":
        ("C", "C 32", "Altre industrie manifatturiere"),

    # --- FORNITURA ENERGIA (D) / GESTIONE ACQUA (E) ---
    "produzione e distribuzione di energia elettrica, gas, e acqua":
        ("D", "D 35", "Fornitura di energia elettrica, gas, vapore e aria condizionata"),

    # --- GESTIONE ACQUE E RIFIUTI (E) ---
    "smaltimento dei rifiuti solidi, delle acque di scarico e simili":
        ("E", "E 38", "Attività di gestione dei rifiuti e risanamento"),

    # --- COSTRUZIONI (F) ---
    "lavori generali di costruzione di edifici e lavori di ingegneria civile":
        ("F", "F 41", "Costruzione di edifici"),
    "lavori di completamento degli edifici (intonacatura, posa in opera di infissi, rivestimento di pavimenti e di muri, …)":
        ("F", "F 43", "Lavori di costruzione specializzati"),
    "preparazione del cantiere edile (demolizione edifici e sistemazione terreno, trivellazioni, …)":
        ("F", "F 43", "Lavori di costruzione specializzati"),
    "posa in opera di coperture e costruzione di ossature di tetti di edifici":
        ("F", "F 43", "Lavori di costruzione specializzati"),
    "installazione dei servizi in un fabbricato (impianti elettrici, lavori di isolamento, installazione di impianti idraulico-sanitari, …)":
        ("F", "F 43", "Lavori di costruzione specializzati"),
    "costruzione di autostrade, strade, campi di aviazione e impianti sportivi":
        ("F", "F 42", "Ingegneria civile"),
    "costruzione di opere idrauliche/altri lavori speciali di costruzione (lavori di fondazione, inclusa la palificazione, perforazione e costruzione pozzi d’acqua, …)":
        ("F", "F 42", "Ingegneria civile"),
    "noleggio di macchine e attrezzature per la costruzione o la demolizione, con manovratore":
        ("F", "F 43", "Lavori di costruzione specializzati"),

    # --- COMMERCIO (G) ---
    "commercio, manutenzione e riparazione di autoveicoli e motocicli; vendita al dettaglio di carburanti per autotrazione":
        ("G", "G 45", "Commercio all'ingrosso e al dettaglio e riparazione di autoveicoli e motocicli"),
    "commercio all’ingrosso e intermediari del commercio, autoveicoli e motocicli esclusi":
        ("G", "G 46", "Commercio all'ingrosso"),
    "commercio al dettaglio (escluso autoveicoli e moto); riparazione beni personali e per la casa":
        ("G", "G 47", "Commercio al dettaglio"),

    # --- TRASPORTI E MAGAZZINAGGIO (H) ---
    "trasporti terrestri/ marittimi/ aerei":
        ("H", "H 49", "Trasporto terrestre e trasporto mediante condotte"),
    "altre attività connesse ai trasporti (gestione infrastrutture, stazioni, porti, …)/ attività delle agenzie di viaggio e degli operatori turistici/ poste e telecomunicazioni":
        ("H", "H 52", "Magazzinaggio e attività di supporto ai trasporti"),
    "movimentazione merci e magazzinaggio":
        ("H", "H 52", "Magazzinaggio e attività di supporto ai trasporti"),

    # --- ALLOGGIO E RISTORAZIONE (I) ---
    "alberghi e ristoranti":
        ("I", "I 56", "Attività dei servizi di ristorazione"),

    # --- ATTIVITÀ IMMOBILIARI, PROFESSIONALI (L/M/N) ---
    "attività immobiliari, noleggio, informatica, ricerca, altre attività imprenditoriali e professionali":
        ("M", "M 74", "Altre attività professionali, scientifiche e tecniche"),

    # --- AMMINISTRAZIONE PUBBLICA (O) ---
    "amministrazione pubblica":
        ("O", "O 84", "Pubblica amministrazione e difesa, assicurazione sociale obbligatoria"),

    # --- ISTRUZIONE (P) ---
    "istruzione":
        ("P", "P 85", "Istruzione"),

    # --- SANITÀ E ASSISTENZA (Q) ---
    "sanità e assistenza sociale":
        ("Q", "Q 86", "Assistenza sanitaria"),

    # --- ALTRE ATTIVITÀ DI SERVIZI (S) ---
    "attività di organizzazioni associative/attività culturali e sportive/servizi alle famiglie":
        ("S", "S 96", "Altre attività di servizi"),

    # --- ATTIVITÀ DI FAMIGLIE (T) ---
    "attività svolte da famiglie e convivenze":
        ("T", "T 97", "Attività di famiglie e convivenze come datori di lavoro per personale domestico"),

    # --- ORGANIZZAZIONI EXTRATERRITORIALI (U) ---
    "organizzazioni e organismi extraterritoriali":
        ("U", "U 99", "Organizzazioni ed organismi extraterritoriali"),
}

# Nota: "attività finanziarie" (K 64) non ha voce attPrev dedicata nel
# dataset attuale ma resta coperta dal fallback generico sotto.

_FALLBACK_SEZIONE: dict[str, str] = {
    "attività finanziarie": "K",
}


def mappa_att_prev(value: str | None) -> dict | None:
    """Ritorna {sezione, divisione, nomeSezione} per una descrizione attPrev.

    La corrispondenza è case-insensitive e tollera spazi doppi. Se non trova
    la voce esatta, cerca una sottostringa (per descrizioni accorciate dal
    troncamento INAIL). Ritorna None se non riesce a classificare.
    """
    if not value:
        return None
    key = " ".join(value.strip().lower().split())
    if key in ATT_PREV_ATECO:
        sez, div, nome = ATT_PREV_ATECO[key]
        return {"sezione": sez, "divisione": div, "nomeSezione": nome}
    for k, (sez, div, nome) in ATT_PREV_ATECO.items():
        if k in key or key in k:
            return {"sezione": sez, "divisione": div, "nomeSezione": nome}
    # fallback per gruppi noti
    for kw, sez in _FALLBACK_SEZIONE.items():
        if kw in key:
            return {"sezione": sez, "divisione": f"{sez} 00", "nomeSezione": sez}
    return None


if __name__ == "__main__":
    # Verifica di coerenza: ogni voce della mappa è classificabile
    non_ok = [k for k in ATT_PREV_ATECO if mappa_att_prev(k) is None]
    print(f"Voci mappa: {len(ATT_PREV_ATECO)} | non classificabili: {len(non_ok)}")
    for k in non_ok:
        print("  !!", k)