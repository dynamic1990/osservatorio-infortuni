# Architettura

## Obiettivo

Osservatorio Infortuni deve rispondere a una domanda semplice: "quanti infortuni sul lavoro ci sono stati, dove, in quale settore, e come stanno cambiando nel tempo?". Deve farlo senza perdere la complessità amministrativa necessaria a dare una risposta corretta.

Per questo l'architettura è pensata in livelli separati, sul modello di DoveVannoINostriSoldi.

## 1. Source registry

Il registro in `src/lib/sources.ts` descrive ogni fonte:

- proprietario;
- area;
- URL ufficiale;
- formato;
- copertura;
- frequenza;
- stato di integrazione.

È il punto di partenza per provenienza e monitoring.

## 2. Acquisition

Ogni connettore deve:

1. scaricare solo da endpoint ufficiali (host verificato);
2. rispettare rate limit e condizioni d'uso (pausa tra le chiamate);
3. conservare timestamp di osservazione e metadati utili;
4. calcolare un hash degli artefatti;
5. evitare di riscaricare versioni identiche;
6. fallire in modo esplicito: dati vecchi sono preferibili a dati silenziosamente corrotti.

Per le API usiamo checkpoint e retry con backoff.

## 3. Raw layer

Il raw non viene "ripulito" in-place. I record singoli pseudonimizzati scaricati dall'API INAIL finiscono in `data/raw/` (gitignored), mai nel sito. Questo rende ogni trasformazione riproducibile e protegge la privacy.

## 4. Normalized layer

L'ETL produce **aggregazioni** (conteggi per regione, provincia, settore ATECO, genere, età, modalità, esito) in snapshot verificati:

- `src/data/generated/inail-infortuni-serie.json` — i dati aggregati;
- `src/data/generated/inail-infortuni-serie.meta.json` — provenienza, copertura, limiti, metodologia, hash.

Mai record singoli negli artefatti pubblicati.

## 5. Publication layer

Il sito (Next.js App Router) legge **solo gli snapshot**, mai le API live. Ogni pagina passa dal contract di validazione (`src/lib/data/*-contract.ts`, zod) e mostra la freschezza del dato.

## Perché snapshot e non query live

- Riproducibilità: chi apre una pagina vede esattamente i dati verificati in quel momento.
- Resilienza: se la fonte è giù (capita), il sito resta funzionante con l'ultimo snapshot.
- Tracciabilità: ogni valore pubblico ha una provenienza verificabile.

## Stack

- Node.js 22+, Next.js (App Router), TypeScript, React 19
- Grafici: Recharts
- Validazione: zod
- ETL: Python 3 (script indipendenti, testati con unittest)
- Deploy: Vercel (config in `vercel.json`)
