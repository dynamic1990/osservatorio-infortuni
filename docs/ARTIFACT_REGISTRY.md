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

Il registro non sostituisce i metadata della fonte. Periodo, URL, metodologia,
copertura e limiti restano nei file `.meta.json` e nella documentazione della
relativa pipeline.
