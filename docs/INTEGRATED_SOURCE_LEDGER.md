# Registro integrato delle fonti

Ogni dataset pubblicato ha una riga in questo registro con: ente, URL, licenza, formato, frequenza, perimetro e limiti.

| ID | Ente | Dataset | URL | Formato | Cadenza | Perimetro | Limiti |
|----|------|---------|-----|---------|---------|-----------|--------|
| INAIL-INF-MENS | INAIL | Infortuni con cadenza mensile | https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni | JSON (REST) | Mensile | Regione, anno e mese di accadimento obbligatori; record singoli pseudonimizzati | Non include definizione amministrativa, indennizzo, giorni indennizzati (solo semestrale) |
| INAIL-INF-SEM | INAIL | Infortuni con cadenza semestrale | https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni | JSON (REST) | Semestrale | Come sopra + definizione, esito mortale, indennizzo | Stessa limitazione dell'API mensile sui nomi di regione; le serie pubbliche usano gli archivi CSV |
| INAIL-INF-SEM-CSV | INAIL | Infortuni semestrali, archivio CSV per regione | https://dati.inail.it/opendata/downloads/daticoncadenzasemestraleinfortuni/zip/DatiConCadenzaSemestraleInfortuni&lt;Regione&gt;_csv.zip | CSV (20 zip regionali) | Semestrale | Livello record, tutte le province, 20/20 regioni, 2021-2025 | Nessun campo ora del giorno: l'orario di accadimento non è esposto. Usato da `aggrega_inail_settimana.py` |
| INAIL-MAL-MENS | INAIL | Malattie professionali mensili | https://dati.inail.it/opendata/downloads/datimensilimalattieprofessionali/csv/DatiMensiliMalattieProfessionaliDataProt&lt;Regione&gt;.csv | CSV regionali | Mensile | Data protocollo, 20/20 regioni | Letto dai CSV: la regione è la sede di protocollazione INAIL, non il luogo di lavoro |
| INAIL-MAL-SEM | INAIL | Malattie professionali semestrali (decessi) | https://dati.inail.it/opendata/downloads/datisemestralimalattieprofessionali/csv/DatiSemestraliMalattieProfessionaliDataDec&lt;Regione&gt;.csv | CSV regionali | Semestrale | Decessi per anno di decisione, 2021-2025 | Variante DataDec, usata per la sezione decessi |
| ISTAT-CODICI-SARD | ISTAT | Codici statistici delle unità amministrative della Sardegna | https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/ | CSV (una riga per comune) | A evento | 377 comuni, associazione codice nuovo (2026) e precedente | Non è un archivio di dati: serve solo a ricomporre il territorio. La corrispondenza è documentata a livello di comune, gli archivi INAIL non scendono sotto la provincia |

## Mappatura dei codici provinciali sardi

La Sardegna ha cambiato i codici delle province con il riordino entrato in vigore
il 1 gennaio 2026 (LR 7/2021, modificata dalla LR 9/2023, e Delibera G.R. 36/34
del 9 luglio 2025). I due archivi INAIL cadono a cavallo della riforma:

- **semestrale consolidato 2021-2025**: 090, 091, 092, 095, 111;
- **mensile 2025-2026**: 112, 113, 114, 115, 116, 117, 118, 119.

La corrispondenza ufficiale tra i due periodi non si deduce: viene dall'elenco
ISTAT citato sopra, che per ogni comune riporta il codice nuovo e quello
precedente. `scripts/etl/genera_mappatura_sardegna.py` la trasforma in un
artefatto usabile dal codice (`src/data/generated/province-sardegna-mappatura.json`,
caricato da `src/lib/province-sardegna.ts`).

Due trappole nei codici, verificate sul campo:

- INAIL usa **092** per Cagliari nei dati 2021-2025, mentre l'ISTAT riporta
  **292** (codice da città metropolitana). Stesso ente, codice diverso: senza
  la normalizzazione 17 comuni restano fuori da ogni contenitore.
- Per le città metropolitane l'ISTAT distingue il codice ente (**312**, **318**)
  dal progressivo usato nei codici comune (**112**, **118**). INAIL usa il
  secondo. I codici ente restano nell'artefatto come metadato, non come chiave.

### Livelli di confronto

| Livello | Copertura | Residuo |
|---------|-----------|---------|
| Area (4 contenitori) | territorio regionale intero in entrambi i periodi | 2 comuni: Seui e Seulo passano dal Sud Sardegna al Nuorese |
| Provincia storica (5 contenitori) | 090, 091, 095 esatte; 092 e 111 no | 53 comuni del Sud Sardegna passano alla città metropolitana di Cagliari |
| Provincia nuova (8 contenitori) | solo lettura del periodo 2025-2026 | non usabile per serie storiche |

Le aree sono il livello da usare per un confronto nel tempo. Le province
storiche funzionano solo per **Sassari** e **Oristano**, dove il territorio non
è cambiato e cambia soltanto l'etichetta: il campo `confrontabileNelTempo`
dell'artefatto lo dichiara per ogni contenitore, così il codice può filtrarle
invece di assumerle.

### Verifica incrociata

Il 2025 è l'unico anno presente in entrambi gli archivi. Il semestrale copre 12
mesi, il mensile i primi 9: il rapporto atteso tra i totali è circa 0,75. Sui
dati reali:

| Area | semestrale 2025 (12 mesi) | mensile 2025 (9 mesi) | rapporto |
|------|--------------------------:|----------------------:|---------:|
| Sassari | 3.961 | 3.022 | 0,763 |
| Nuoro | 1.455 | 1.069 | 0,735 |
| Oristano | 1.144 | 834 | 0,729 |
| Cagliari e Sud Sardegna | 5.747 | 4.185 | 0,728 |
| **Totale** | **12.307** | **9.110** | **0,740** |

Lo scostamento per area resta entro un punto percentuale dal valore atteso, il
che indica che la mappatura ricompone gli stessi territori. Non è una stima dei
casi: serve solo a verificare che i contenitori non mescolino aree diverse.

## Note di verifica (aggiornate al 2026-11-11)

- API infortuni mensile testata: parametri `Regione`, `AnnoAccadimento`, `MeseAccadimento` (2 cifre) obbligatori. Senza zero iniziale: "Dati non trovati".
- Regioni accettate dall'API (16/20): Piemonte, Lombardia, Veneto, Liguria, Toscana, Umbria, Marche, Lazio, Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna.
- Valle d'Aosta, Trentino-Alto Adige, Friuli-Venezia Giulia ed Emilia-Romagna non sono risolte via API (testate ~30 varianti al 2026-08-27)
  e l'API le rifiuta sia come nome esteso sia come codice ISTAT. **Questione chiusa nel 2026-11-11**: le serie erano già complete
  perché i CSV regionali del portale usano i nomi composti senza trattino (EmiliaRomagna, TrentinoAltoAdige, FriuliVeneziaGiulia,
  ValledAosta) e coprono 20/20 regioni. L'ETL legge solo i CSV; l'API non è più usata per la congiuntura.
- Licenza esatta dei dataset INAIL: Italian Open Data License v2.0 (dichiarata nei metadati degli artifact).
- Finestra mensile: la cadenza pubblica gennaio-settembre per l'anno in corso e per il precedente; ottobre-dicembre dell'anno
  precedente non sono presenti e la serie congiunturale si ferma a settembre per entrambi gli anni. Verificato 2026-11-11.

## Da verificare

- Denominatori per tassi di incidenza (occupati per settore/territorio: Istat RCFL).
- Presenza di dataset di vigilanza INL nel CKAN del Ministero (portale in manutenzione ad ago 2026).
