# Architettura

## Flusso dei dati

1. **ETL (scripts/etl/)**: script Python che scaricano le fonti ufficiali e producono snapshot verificati in `src/data/generated/`. Ogni snapshot registra fonte, data di estrazione e versione dello schema.
2. **Sito (src/)**: Next.js che legge esclusivamente gli snapshot, mai le fonti live. Nessun numero senza snapshot verificato.
3. **API (src/app/api/)**: endpoint di sola lettura sugli snapshot, usati dalle pagine e (in futuro) da un endpoint MCP pubblico.
4. **Refresh**: gli snapshot si rigenerano con cadenza definita per fonte (mensile INAIL, annuale INL). Il refresh è atomico: si scrive un file temporaneo e si rinomina.

## Perché snapshot e non query live

- Riproducibilità: chi apre una pagina vede esattamente i dati verificati in quel momento.
- Resilienza: se la fonte è giù (capita), il sito resta funzionante con l'ultimo snapshot.
- Tracciabilità: ogni valore pubblico ha una provenienza verificabile.

## Stack

- Node.js 22+, Next.js (App Router), TypeScript
- Python 3 per gli script ETL
- Test: vitest per unit, test E2E su build di produzione

## Decisioni da prendere

- Database per lo storico INAIL (SQLite/DuckDB) vs file JSON aggregati: da valutare con i volumi reali di download.
- Normalizzazione codici ATECO (cambio classificazione) e province (Sardegna 2026).
