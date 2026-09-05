# Gap analysis — dati mostrati vs mostrabili (2026-09-05)

Matrice priorità (impatto di trasparenza vs effort tecnico) per decidere come arricchire
l'Osservatorio. Riferimento: NEXT_SESSION.md punto 5. Compilata il 2026-09-05 dopo
l'audit dati automatico (35 check OK, 0 FAIL).

Legenda priorità: **P1** = alto impatto, effort basso/medio · **P2** = buon impatto,
effort medio · **P3** = impatto marginale o effort alto.

---

## Matrice

| # | Candidato | Oggi mostriamo | Possiamo mostrare | Fonte | Effort | Impatto | Priorità | Raccomandazione |
|---|---|---|---|---|---|---|---|---|
| 1 | **Serie decennale con 2025** | Serie 2014-2024 | Serie 2014-2025 (un punto/barra per anno, Regola 1 rispettata) | INAIL open data mensili: comunicato dicembre 2025 (feb 2026): 416.900 denunce occasione di lavoro 2025, +0,5% vs 2024 (414.853); mortali 2025 disponibili dai dati mensili | M | Alto | **P1** | **Fattibile e consigliato**: INAIL ha pubblicato i dati 2025. ETL di aggiornamento della serie decennale (script esistente `inail_infortuni_snapshot.py` o nuovo), poi la home mostra il trend fino al 2025. Da verificare: coerenza perimetro (al netto studenti) e disponibilità mortali/occupati 2025 per gli indici |
| 2 | **Incidenza per settore ATECO e macro-area** | Tasso per regione (indice-incidenza) | Tasso per settore ATECO e per macro-area (Nord/ Centro/Sud) dagli occupati | Occupati già scaricati: `occupati-settore.json`, `occupati-regione.json` (ISTAT RCFL/Eurostat) + serie INAIL settori (`inail-infortuni-viste.json` settori) | S | Alto | **P1** | **Fattibile subito**: i denominatori ci sono già. Un widget "incidenza per settore" (denunce/occupati × 1.000) con denominatore dichiarato. Rispetta RULES.md regola 2 (tasso di incidenza = livello desiderabile) |
| 3 | **Dati provinciali (denunce)** | Mappa regionale | Mappa provinciale del rischio | Open Data INAIL (dati elementari per singolo infortunio, `dati.inail.it`) | M | Medio | **P2** | Da valutare: i dati elementari INAIL permettono aggregazione provinciale. Effort medio (ETL + mappa province). Buon valore per il pubblico locale |
| 4 | **Malattie professionali: profondità** | Totale, categorie, regioni, genere | Per settore ATECO e per agente eziologico | INAIL Open Data malattie (DatiSemestraliMalattieProfessionali) | M | Medio | **P2** | La pagina malattie esiste già: aggiungere scomposizione per settore/agente eziologico dove la fonte la espone. Da verificare la disponibilità nei dataset INAIL |
| 5 | **Benchmark UE: dettaglio per paese** | Ranking 10 paesi, tasso standardizzato | Serie storica per paese + confronto Italia vs UE per settore | Eurostat ESAW (hsw_mi01) già integrato (`eurostat-benchmark.json`) | S | Medio | **P2** | Il dataset ha già `rankingUltimoAnno`: estendere con serie per paese (dati già parzialmente disponibili). Effort basso |
| 6 | **Correlazioni fattori causali × settore/territorio** | Fattori causali aggregati (pagina casi mortali) | Incroci fattore × settore, fattore × territorio | Dati Infor.MO già in `informo-mortali-dettaglio.json` (2.334 fattori) | M | Medio | **P2** | I dati ci sono già: un incrocio "quale fattore causale domina in quale settore" è analisi nuova a costo quasi zero (script di aggregazione). Buon valore di lettura |
| 7 | **Infor.MO gravi** | Niente (endpoint chiuso) | Niente | Endpoint INAIL tipoEvento=2 ritorna 0 record (testato 04/09) | — | — | **Chiuso** | **Dichiarare chiuso**: strada bloccata salvo nuove evidenze. Documentare nel registro fonti |
| 8 | **Export/API dei dati** | Niente | Download CSV dei dataset + API pubblica | Dati già in JSON nel repo | S | Medio | **P2** | Pagina "Dati" con download CSV (generati da script) + endpoint JSON già esistente (`/api/dati/*`). Effort basso, valore alto per trasparenza e citabilità |
| 9 | **Alert nuovi casi** | Widget cronaca news (cron giornaliero) | Alert configurati (es. notifica su eventi gravi) | Google News RSS già integrato (`news-infortuni.json`) + cron esistente | S | Basso | **P3** | Il cron news c'è già: un alert push (Telegram/email) su casi mortali è un'estensione semplice. Da decidere con Damiano se serve |
| 10 | **Forza lavoro ATECO 2 digit** | Settori a 1 digit | Settori a 2 digit per incidenza più fine | ISTAT RCFL / Eurostat lfsq (2 digit) | M | Medio | **P3** | Migliora la granularità dell'incidenza per settore (candidato #2) ma richiede ETL aggiuntivo. Rimandare a dopo #2 |
| 11 | **Freschezza dati visibile** | Parziale (source-note con data estrazione) | Data estrazione in ogni blocco, badge "aggiornato il" | Tutti i dataset hanno `generatedAt` (verificato in audit) | S | Alto | **P1** | **Fix rapido di trasparenza**: audit ha verificato che `generatedAt` esiste quasi ovunque (manca nel congiunturale, che dichiara il periodo). Uniformare la visualizzazione della data di estrazione in tutti i widget |

---

## Sintesi consigliata

**Subito (P1, effort basso):**
1. Serie decennale aggiornata al 2025 (dati INAIL pubblicati)
2. Incidenza per settore ATECO e macro-area (denominatori già scaricati)
3. Freschezza dati: data estrazione visibile in ogni blocco

**Prossimo giro (P2):**
4. Correlazioni fattori causali × settore/territorio (dati già presenti)
5. Export/API dati (CSV + endpoint)
6. Dati provinciali, malattie per settore, benchmark UE per paese

**Chiuso:** Infor.MO gravi (endpoint INAIL non espone i dati).

**Da validare con Damiano:** alert nuovi casi (P3), forza lavoro 2 digit (P3).