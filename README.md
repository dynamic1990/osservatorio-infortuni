# Osservatorio Infortuni

Progetto civico open source per rendere leggibili i dati sugli infortuni sul lavoro in Italia.

La banca dati INAIL è ricchissima ma di difficile lettura: dataset enormi, codici al posto dei nomi, nessuna vista sintetica. Osservatorio Infortuni la valorizza al massimo, con grafici e analisi che permettono una lettura facile e approfondita: serie storiche, andamenti per settore e territorio, modalità di accadimento, esiti.

## Fase 1: Open data INAIL

- **Infortuni sul lavoro** con cadenza mensile e semestrale (API REST JSON)
- **Malattie professionali** con cadenza mensile e semestrale (API REST JSON)
- Analisi per: tempo (serie storiche), luogo (provincia/regione ISTAT), persona (età, genere), modalità (in occasione di lavoro / in itinere, con/senza mezzo di trasporto), settore (ATECO, gestione tariffaria, grande gruppo tariffario), esito (mortali)

La fase 2 integrerà i dati di vigilanza dell'Ispettorato Nazionale del Lavoro, i CSV storici completi INAIL (l'API REST copre ~18 mesi) e le malattie professionali.

## Principi

- Nessun numero senza fonte e data.
- Nessun dato inventato o dimostrativo nelle pagine pubbliche.
- Un segnale non è una colpa: un aumento delle denunce può dipendere da più vigilanza, più consapevolezza o cambi normativi.
- I confronti usano solo misure compatibili (stesso perimetro, stessa definizione).
- Se una fonte non risponde, il problema resta visibile.
- Privacy: nessuna pubblicazione di casi singoli, solo aggregazioni.

## Fonti

| Fonte | Dato | Formato | Cadenza |
|-------|------|---------|---------|
| INAIL Open Data | Infortuni (record per record) | API REST JSON | Mensile / semestrale |
| INAIL Open Data | Malattie professionali | API REST JSON | Mensile / semestrale |

## Struttura

- `src/app/` pagine e API
- `src/components/` interfaccia e grafici
- `src/data/generated/` snapshot verificati
- `scripts/etl/` aggiornamento fonti (Python)
- `docs/` metodo, architettura, note legali
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

## Licenza

Codice sotto GNU Affero GPL v3 (in valutazione). I dati di terzi restano sotto le loro licenze.
