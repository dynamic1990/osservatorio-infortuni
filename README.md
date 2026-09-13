# Osservatorio Infortuni

Progetto civico open source per rendere leggibili i dati sugli infortuni sul lavoro in Italia.

La banca dati INAIL è ricchissima ma di difficile lettura: dataset enormi, codici al posto dei nomi, nessuna vista sintetica. Osservatorio Infortuni la valorizza al massimo, con grafici e analisi che permettono una lettura facile e approfondita: serie storiche, andamenti per settore e territorio, modalità di accadimento, esiti.

## Cosa trovi nel sito

- **Home**: andamento congiunturale, serie storica, territorio, comparti ATECO, demografia e benchmark europeo.
- **Casi mortali**: archivio analizzato Infor.MO di INAIL, con dinamiche e fattori causali aggregati.
- **Malattie professionali**: denunce e decessi riconosciuti, con il perimetro dichiarato nella pagina.
- **Vigilanza**: rapporti annuali INL e indicatori sull'attività ispettiva.
- **Calcolatore del costo**: stima orientativa per scenari, non una valutazione contabile o legale.
- **Radar degli infortuni sul lavoro**: rassegna quotidiana da Google News RSS, filtrata con un punteggio interno di pertinenza. Non è una statistica ufficiale.

## Copertura dei dati

Copertura verificata al 2026-08-27 per la base INAIL e aggiornata nel registro delle fonti:

- **Serie storica consolidata 2020-2024**: dataset semestrali regionali INAIL (file CSV), tutte le 20 regioni, ~3 milioni di record, con definizione amministrativa, indennizzo e giorni indennizzati.
- **Congiuntura mensile 2025-2026**: API REST mensile (16 regioni) + CSV mensili delle 4 regioni con nome composto (Valle d'Aosta, Trentino-Alto Adige, Friuli-Venezia Giulia, Emilia-Romagna).
- Analisi per: tempo (serie storiche), luogo (regione/provincia ISTAT), persona (età, genere), modalità (in occasione di lavoro / in itinere, con/senza mezzo di trasporto), settore (ATECO), esito.

Limiti noti: l'API REST mensile espone una finestra di circa 18 mesi; per lo storico si usano i CSV semestrali regionali. Le denunce non coincidono automaticamente con gli infortuni definiti e indennizzati. Ogni pagina dichiara il proprio perimetro, la data del dato e le discontinuità note.

## Principi

Le regole valide in tutta l'app (nessun aggregato multi-anno, separazione lavoro/itinere, coerenza cromatica filtri-grafici) sono in **[docs/RULES.md](docs/RULES.md)**. Da leggere prima di aggiungere o modificare una pagina.

- Nessun numero senza fonte e data.
- Nessun dato inventato o dimostrativo nelle pagine pubbliche.
- Un segnale non è una colpa: un aumento delle denunce può dipendere da più vigilanza, più consapevolezza o cambi normativi.
- I confronti usano solo misure compatibili (stesso perimetro, stessa definizione).
- Se una fonte non risponde, il problema resta visibile.
- Privacy: nessuna pubblicazione di casi singoli, solo aggregazioni.

## Fonti principali

| Fonte | Dato | Formato | Cadenza |
|-------|------|---------|---------|
| INAIL Open Data | Infortuni (record per record) | API REST JSON | Mensile / semestrale |
| INAIL Open Data | Malattie professionali | CSV / API | Mensile / semestrale |
| Eurostat ESAW | Benchmark europeo | JSON-stat API | Annuale |
| ISTAT / Eurostat | Denominatori occupati | JSON-stat API | Trimestrale / annuale |
| INL | Rapporti di vigilanza | PDF | Annuale |
| Google News RSS | Radar editoriale | RSS XML | Quotidiana |

Il registro completo, con URL, copertura, note metodologiche e stato di integrazione, è disponibile nella [pagina Fonti](https://www.osservatorioinfortuni.it/fonti).

## Aggiornamento e controllo delle fonti

Il sito pubblica snapshot verificati, non interroga le API in tempo reale durante la navigazione. Un audit automatico, separato dal Radar, controlla il 15 di ogni mese gli endpoint delle fonti ufficiali. L'audit confronta le risposte con la baseline precedente e segnala possibili cambiamenti, ma non inserisce nuovi dati senza una revisione.

## Struttura

- `src/app/` pagine e API
- `src/components/` interfaccia e grafici
- `src/data/generated/` snapshot verificati
- `scripts/etl/` aggiornamento fonti (Python)
- `docs/` metodo, architettura, note legali
- `scripts/audit/` controllo periodico delle fonti, non distruttivo
- `tests/` controlli automatici

## Sviluppo

```bash
npm ci
npm run dev
```

Script ETL:

```bash
python3 scripts/etl/inail_infortuni_snapshot.py --regione Lazio --anno 2025 --mese 01
```

Controllo leggero delle fonti:

```bash
npm run audit:sources
```

L'audit non modifica i dataset pubblicati. Per rigenerare uno snapshot o cambiare il perimetro dei dati, leggere prima `docs/RULES.md` e la documentazione dello script interessato.

## Licenza

Codice sotto [GNU Affero General Public License v3.0](LICENSE). I dati di terzi (INAIL, Eurostat, ISTAT, INL) restano sotto le rispettive licenze pubbliche.

## Contribuire

Issue e pull request benvenute. Prima di intervenire leggere `docs/RULES.md` (regole su dati e interfaccia) e `docs/LEGAL_AND_ETHICS.md` (limiti e responsabilità).

## Sito live

https://www.osservatorioinfortuni.it
