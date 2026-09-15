# Registro degli artifact generati

Il file `scripts/ci/generated-artifacts.json` è l'inventario canonico degli
snapshot pubblicati da `src/data/generated/`.

Per ogni artifact registra:

- identificativo stabile;
- percorso relativo nel repository;
- dimensione in byte;
- hash SHA-256 del file versionato.

Il comando `npm run test:snapshots` verifica il registro prima dei controlli
semantici sugli snapshot INAIL. Un file mancante, modificato senza aggiornare
il registro o con dimensione divergente interrompe il controllo, invece di
lasciare passare un artifact potenzialmente corrotto.

## File grandi non versionati

Alcuni snapshot sono **troppo grandi per il repository** e restano esclusi da
git (regole in `.gitignore`): `inail-infortuni-serie.json`,
`inail-infortuni-semestrale-storico.json` e `informo-mortali-dettaglio.json`.
Non compaiono quindi nel registro e il validatore non li controlla.

Per le build locali vanno generati prima con i rispettivi ETL
(`inail_infortuni_snapshot.py`, ETL storico semestrale,
`estrai_informo_dettaglio.py`). In CI non servono: il codice li carica in
runtime solo se presenti, e la build statica non li include.

Il registro non sostituisce i metadata della fonte. Periodo, URL, metodologia,
copertura e limiti restano nei file `.meta.json` e nella documentazione della
relativa pipeline.
