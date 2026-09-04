# Osservatorio Infortuni — Design System

## Riferimento ufficiale

**Design system adottato: WIRED** (scelta Damiano, 04/09/2026).

- Fonte: `awesome-design-md` (https://github.com/VoltAgent/awesome-design-md) → file ufficiale copiato in `docs/design-system/wired-DESIGN.md`.
- Direzione: **"il registro pubblico"**: documento di giornale autorevole, carta chiara, inchiostro scuro, densità editoriale. La domanda sceglie la forma (linea per trend, barre per confronti, mappa per geografia, tabella per valori esatti).
- **Accento rosso semantico**: `#f36458` (mutuato da Sanity, delibera Damiano) usato con parsimonia per: esiti mortali, peggioramenti (delta negativi,, evidenza principale. Non un rosso "allarme" pieno: tenue, corallino, misurato.

## Palette (token in `src/app/design-system.css`)

- `--color-bg` (canvas): bianco carta `#ffffff` (soft `#f5f5f5` per bande alternate)
- `--color-raised` (surface card): bianco `#ffffff`
- `--color-surface`: grigio carta `#f5f5f5`
- `--color-text` (ink): nero profondo `#1a1a1a`
- `--color-text-soft`: grigio corpo `#757575`
- `--color-text-muted`: grigio didascalia più chiaro
- `--color-divider` / `--color-border` (hairline): `#e0e0e0`
- `--color-accent` (evidenza, serie primaria, filtri modalità): **rosso `#f36458`**
- `--color-link`: blu inchiostro `#057dbc` (link testuali e linee di incidenza)
- `--color-success` (miglioramenti, delta positivi): verde `#1e7a4e`
- `--color-warning`: ambra, uso limitato
- Serie/grafici: palette secondaria derivata da inchiostro e link, senza colori a mano nei componenti.

## Tipografia

- **Display / titoli / testate**: serif editoriale Georgia / Times New Roman (fallback di WiredDisplay, Perché il font proprietario Wired non è caricabile): peso 400-700, narrow e deciso.

- **Body / UI / etichette / legende**: sans Helvetica Neue / Arial / system-ui, peso 400-600. Numeri tabulari per le metriche.
. - **Micro-etichette**: uppercase, letter-spacing, per le eyebrow08 (es. "MONITORAGGIO YTD").
- Scala tipografica del file WIRED come riferimento (display 26-64px, body 14-17px, caption 12px.

## Componenti

- **Angoli**: squadrati (0-4px); nessuna ombra decorativa, nessun bagliore.

- **Card**: bordo hairline 1px `#e0e0e0`, superficie bianca, padding generoso (griglia verticale da `--space-*`).
- **Filtri/pulsanti**: pill, bordo hairline o bordo colore per stati attivi; stato attivo = riempimento colore assegnato al canale che controlla (regola 4 RULES.md); hover leggero.

- **Titolazione sezioni**: maiuscola con lettering, riga dividere sottile, distacco generoso dal grafico/legenda sottostante (verificare in desktop e mobile).
- **Legende grafici**: distacco esplicito dal grafico (padding verticale dedicato, mai aderente), leggibili anche su mobile.



## Regole di visualizzazione

- Valgono le regole in `docs/RULES.md`, in particolare: nessun aggregato multi-anno, app come lettura dei trend(primo dato = più recente vs anno precedente, poi trend storico, poi approfondimenti), separazione occasione/itinere, coerenza cromatica filtri↔serie, design system unico su tutta l'app, leggibilità prima della spettacolarità.

## Note migrazione

Tutto il CSS esistente (DVNS-based) va migrato ai token WIRED in un unico giro, senza stili ibridi (regola 5. Verificare distacco tra titoli e legende dei grafici (desktop + mobile).