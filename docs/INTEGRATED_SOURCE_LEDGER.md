# Registro integrato delle fonti

Ogni dataset pubblicato ha una riga in questo registro con: ente, URL, licenza, formato, frequenza, perimetro e limiti.

| ID | Ente | Dataset | URL | Formato | Cadenza | Perimetro | Limiti |
|----|------|---------|-----|---------|---------|-----------|--------|
| INAIL-INF-MENS | INAIL | Infortuni con cadenza mensile | https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni | JSON (REST) | Mensile | Regione, anno e mese di accadimento obbligatori; record singoli pseudonimizzati | Non include definizione amministrativa, indennizzo, giorni indennizzati (solo semestrale) |
| INAIL-INF-SEM | INAIL | Infortuni con cadenza semestrale | https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni | JSON (REST) | Semestrale | Come sopra + definizione, esito mortale, indennizzo | Parametro Regione accetta valori particolari; da testare |
| INAIL-MAL-MENS | INAIL | Malattie professionali mensili | https://dati.inail.it/api/OpenData/DatiMensiliMalattieProfessionaliDataProt | JSON (REST) | Mensile | Data protocollo | Da testare |
| INAIL-MAL-SEM | INAIL | Malattie professionali semestrali | https://dati.inail.it/api/OpenData/DatiSemestraliMalattieProfessionaliDataProt | JSON (REST) | Semestrale | Data protocollo; variante DataDec | Da testare |

## Note di verifica (2026-08-27)

- API infortuni mensile testata: parametri `Regione`, `AnnoAccadimento`, `MeseAccadimento` (2 cifre) obbligatori. Senza zero iniziale: "Dati non trovati".
- Regioni accettate dall'API (16/20): Piemonte, Lombardia, Veneto, Liguria, Toscana, Umbria, Marche, Lazio, Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna.
- Non risolte (testate ~30 varianti al 2026-08-27): nomi accettati per Valle d'Aosta, Trentino-Alto Adige, Friuli-Venezia Giulia, Emilia-Romagna.
  L'API le rifiuta sia come nome esteso sia come codice ISTAT. Fallback: dataset CSV completi pubblicati sul portale
  (coprono tutte le province) oppure endpoint semestrale, da verificare. Impatto: 4 regioni su 20 mancanti nelle serie API. TODO.
- Licenza esatta dei dataset INAIL: da verificare.
- Storico disponibile: da verificare per anno (test iniziali con nomi errati hanno falsato il risultato).

## Da verificare

- Denominatori per tassi di incidenza (occupati per settore/territorio: Istat RCFL).
- Presenza di dataset di vigilanza INL nel CKAN del Ministero (portale in manutenzione ad ago 2026).
