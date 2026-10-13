# Freschezza e aggiornamento

## Calendario aggiornamenti dati

Ogni dataset pubblicato ha una **finestra di pubblicazione attesa** dalla fonte e un **verificatore** nel progetto. Il calendario serve a ricordarsi di controllare che la fonte abbia pubblicato, che il formato sia quello atteso e di portare il dato a bordo dell'app.

| Dataset | Fonte | Cadenza di pubblicazione | Finestra attesa | Verifica | ETL | Ultimo a bordo |
|---------|-------|--------------------------|-----------------|----------|-----|----------------|
| Infortuni mensili | INAIL | Mensile (dati al mese precedente) | Metà del mese successivo. Visto: dati 30/06/2026 pubblicati 03/08/2026 | `scripts/audit/controlla_fonti.py` + controllo API | `scripts/etl/inail_infortuni_snapshot.py` | giu 2026 |
| Infortuni semestrali | INAIL | Semestrale (rilevazioni 30/04 e 31/10) | Pubblicazione ~2 mesi dopo (giu e dic) | Audit fonti | `inail_unify_views.py` + snapshot | rilevazione 30/04/2026 (in-sito 2025) |
| Malattie professionali mensili (denunce) | INAIL | Mensile (data di protocollo) | Metà del mese successivo | Audit fonti + `aggiorna_malattie_professionali.py` | `malattie_professionali_etl.py` | ago 2026 (confronto gen-giu) |
| Malattie professionali semestrali (decessi) | INAIL | Semestrale | ~2 mesi dopo la rilevazione | Audit fonti | `malattie_professionali_etl.py` | 2021-2025 |
| **Esiti malattie professionali** | INAIL Relazione Annuale | **Annuale** (settembre, con la Relazione Annuale) | Presentata a settembre (2025: 22/09/2026). I valori vanno ri-verificati a mano sul PDF | `estrai_esiti_malattie.py` (fallisce se i marker spariscono) | `estrai_esiti_malattie.py` | Relazione 2025 (ott 2026) |
| Vigilanza INL (rapporti annuali) | INL | Annuale | Primo semestre (PDF 2025 pubblicato 04/2026) | Audit fonti | `genera_vigilanza_dettaglio.py` | 2025 |
| Infor.MO casi mortali | INAIL | Aggiornamento continuo; annualità complete in autunno | Da confermare via audit (fine anno) | Audit fonti | `estrai_informo*.py` | 2024 |
| Incidenti mortali / analisi cause | INAIL DIMEILA | Annuale | Da monitorare | Audit fonti | manuale | 2025 |
| Eurostat ESAW benchmark | Eurostat | Annuale (dati T-1) | Autunno (a set 2026 ultimi dati 2023) | Audit fonti | `genera_benchmark_eurostat.py` | 2023 |
| Occupati per regione/settore | ISTAT/Eurostat | Annuale/trimestrale | Aggiornamenti in corso d'anno | Audit fonti | `genera_occupati.py` | 2025 |
| News infortuni (radar) | Google News RSS | Quotidiana | Automatica (2 job/giorno) | Esclusa dall'audit | `aggiorna_news_infortuni.py` | giornaliero |

**Regola operativa**: quando scatta la finestra attesa di un dataset, si esegue il verificatore, si controlla che il formato sia quello atteso (stessi campi, stessi perimetri), e solo allora si porta il dato a bordo. Se la fonte è cambiata e lo script non fallisce da solo, la modifica va documentata nel registro sorgenti. Nessuna integrazione automatica di nuove annualità: prima verifica di periodo, definizioni, perimetro e compatibilità con le serie pubblicate.

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
