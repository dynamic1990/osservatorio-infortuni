# Freschezza e aggiornamento

## Cadenza dichiarata per fonte

| Fonte | Aggiornamento fonte | Refresh snapshot | Note |
|-------|--------------------|------------------|------|
| INAIL infortuni mensili | Mensile (dati rilevati al mese precedente) | Dopo ogni pubblicazione INAIL | Ultimo rilascio visto: dati al 30/06/2026 (03/08/2026) |
| INAIL malattie professionali | Mensile/semestrale | Dopo verifica del rilascio | CSV regionali, perimetro dichiarato nella pagina |
| Eurostat ESAW | Annuale | Dopo verifica del rilascio | API JSON-stat |
| ISTAT/Eurostat occupati | Trimestrale/annuale | Dopo verifica del rilascio | Usati come denominatori, non come numeratori INAIL |
| INL rapporti annuali | Annuale | Dopo verifica del rilascio | PDF, richiede parsing e controllo manuale |
| Radar Google News | Quotidiana | Automatica | Escluso dall'audit mensile |

## Politica

- Ogni snapshot riporta `extractedAt` e fonte nel meta file.
- Se una fonte non risponde durante il refresh, lo snapshot precedente resta pubblicato e la pagina "fonti" lo segnala.
- Le discontinuità note (nuova classificazione ATECO dal 2026, nuova suddivisione province Sardegna da gen 2026) si documentano nel catalogo dati.
- Soglia di stale: 35 giorni (un rilascio mensile mancato + tolleranza).

## Audit mensile delle fonti

Il job `Audit mensile fonti Osservatorio` viene eseguito il 15 di ogni mese. È un comando Python, non una chiamata a un modello linguistico, quindi il controllo ordinario non consuma token LLM.

Il job verifica URL ufficiali, codici HTTP, formato della risposta e una fingerprint degli endpoint dati. Confronta la fingerprint con la baseline precedente e invia soltanto anomalie o cambiamenti da valutare. Non esegue ETL, non sovrascrive snapshot e non pubblica automaticamente nuove annualità.

Un cambiamento tecnico non dimostra da solo che esista un dato utile. Prima di integrare una nuova annualità bisogna verificare periodo, definizioni, perimetro, copertura regionale, denominatori e compatibilità con le serie già pubblicate.
