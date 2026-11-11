# Registro integrato delle fonti

Ogni dataset pubblicato ha una riga in questo registro con: ente, URL, licenza, formato, frequenza, perimetro e limiti.

| ID | Ente | Dataset | URL | Formato | Cadenza | Perimetro | Limiti |
|----|------|---------|-----|---------|---------|-----------|--------|
| INAIL-INF-MENS | INAIL | Infortuni con cadenza mensile | https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni | JSON (REST) | Mensile | Regione, anno e mese di accadimento obbligatori; record singoli pseudonimizzati | Non include definizione amministrativa, indennizzo, giorni indennizzati (solo semestrale) |
| INAIL-INF-SEM | INAIL | Infortuni con cadenza semestrale | https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni | JSON (REST) | Semestrale | Come sopra + definizione, esito mortale, indennizzo | Stessa limitazione dell'API mensile sui nomi di regione; le serie pubbliche usano gli archivi CSV |
| INAIL-INF-SEM-CSV | INAIL | Infortuni semestrali, archivio CSV per regione | https://dati.inail.it/opendata/downloads/daticoncadenzasemestraleinfortuni/zip/DatiConCadenzaSemestraleInfortuni&lt;Regione&gt;_csv.zip | CSV (20 zip regionali) | Semestrale | Livello record, tutte le province, 20/20 regioni, 2021-2025 | Nessun campo ora del giorno: l'orario di accadimento non è esposto. Usato da `aggrega_inail_settimana.py` |
| INAIL-MAL-MENS | INAIL | Malattie professionali mensili | https://dati.inail.it/opendata/downloads/datimensilimalattieprofessionali/csv/DatiMensiliMalattieProfessionaliDataProt&lt;Regione&gt;.csv | CSV regionali | Mensile | Data protocollo, 20/20 regioni | Letto dai CSV: la regione è la sede di protocollazione INAIL, non il luogo di lavoro |
| INAIL-MAL-SEM | INAIL | Malattie professionali semestrali (decessi) | https://dati.inail.it/opendata/downloads/datisemestralimalattieprofessionali/csv/DatiSemestraliMalattieProfessionaliDataDec&lt;Regione&gt;.csv | CSV regionali | Semestrale | Decessi per anno di decisione, 2021-2025 | Variante DataDec, usata per la sezione decessi |

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
