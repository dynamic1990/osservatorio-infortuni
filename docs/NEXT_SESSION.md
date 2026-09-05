# Prossima sessione — Osservatorio Infortuni (decisa il 2026-09-05)

Stato al termine della sessione: pagina **Casi mortali** live (commit `d09fe4d`),
build verde (7 rotte statiche), ETL Infor.MO di dettaglio completo
(1.212 casi, 2.334 fattori). Working tree del repo progetto pulito.

Ordine di lavoro suggerito (dal più importante al più decorativo):

---

## 1. Tool SEO + analisi traffico utenti (richiesto DAMIANO)

Obiettivo: dashboard professionale di analisi del traffico del sito
(visite, utenti, sorgenti, pagine più viste, tempo, bounce) pensata per
la scala ("non sia mai che diventa famosa").

Da decidere PRIMA di scrivere codice:
- **Approccio**: Vercel Analytics (nativo, zero cookie banner per i dati
  aggregate) vs Plausible self-hosted vs Google Analytics 4 (richiede
  cookie banner/consenso). Vercel e Plausible sono privacy-first; GA4
  più potente ma con obbligo banner cookie e maggiore complessità GDPR.
  Nota: il dominio è Vercel → Vercel Analytics è integrato e zero-config.
- **Dove mostrare i dati**: pagina riservata/admin vs pagina pubblica di
  "trasparenza" (es. contatori) vs niente pubblica con report periodico.
- **Cosa misurare**: sessioni, utenti unici, pagine/visita, durata media,
  bounce, top pagine, sorgenti (organic, direct, social, referral),
  device/geografia (solo aggregata per privacy).
- **Privacy**: se GA4 serve cookie banner; Plausible/Vercel Analytics
  non tracciano cross-device e sono GDPR-friendly senza banner.

Consegna attesa: decisione approccio + setup + pagina (riservata) con i
dati, crontab per estrazione se serve.

## 2. Sezione sponsorizzazioni (nella stessa ottica crescita)

- Pensare a una parte dedicata alle sponsorizzazioni (posizioni, format,
regole, contatti).
- **Da decidere con Damiano i limiti etici**: l'Osservatorio mostra dati
di infortuni e morti sul lavoro: nessuna pubblicità ingannevole, niente
sponsor che speculano sul tema, banner distinti e chi, possibilità di
"sponsor trasparente" (es. enti, associazioni, istituzioni).
- Sulla curva di crescita: la sezione va progettata ma attivata solo al
raggiungimento di soglie di traffico (es. >X visite/mese) per non
snaturare il progetto all'inizio.
- Se la dismissione laterale: REFERRENZA a un eventuale media kit.

## 3. Audit TOTALE coerenza grafiche

Tutte le pagine (`/`, `/casi-mortali`, `/malattie-professionali`,
`/vigilanza`, `/fonti`) vs design system WIRED (docs/DESIGN.md) e
RULES.md (regole 4-5-6):
- colori SOLO da token CSS (nessun hex nel codice, palette.ts inclusa);
- filtro attivo = colore della serie che controlla (Regola 4),
  dichiarata UNA volta per pagina;
- toggle uniformi (btn-pill + accento), NIENTE stili ibridi (Regola 5);
- spazi, tipografia, angoli, hover/focus/active coerenti;
- legende e titoli ben distaccati dai grafici;
- **verifica esplicita DAMIANO: titoli e legende distaccati, desktop +
  mobile** (sessione 2026-09-04, mai eseguita);
- responsive: nessun overflow/sovrapposizione su mobile (test viewport
  375px e 1440px+).

Questo era l'ultimo punto rimasto aperto dell'audit 09-04 (migrazione
WIRED completa home + verifica mobile/desktop + malattie/vigilanza).

## 4. Audit TOTALE coerenza dati mostrati

Cross-check numerico tra pagine e fonti:
- stessa cifra = stessa fonte (una cifra non può venire da fonti diverse
  in pagine diverse);
- delta vs anno precedente sempre corretti (ordine anni, segno,
  arrotondamenti);
- unità e denominatori sempre dichiarati (tassi/incidenze);
- niente aggregati multi-anno (Regola 1), niente "acronimi interni"
  nell'interfaccia pubblica (lesson 2026-08);
- freschezza dati visibile (data estrazione in ogni blocco);
- coerenza tra serie decennale home e confronti nelle altre pagine
  (es. mortali 2024: 1.228 da serie INAIL vs 249 casi Infor.MO: il
  distinguo deve essere chiaro ovunque).

Output atteso: tabella di coerenza per pagina con esito, fix applicati,
eventuali segnalazioni da confermare con Damiano.

## 5. Gap analysis dati mostrati vs mostrabili

Matrice: oggi mostriamo / possiamo mostrare / valore / velocità per
decidere se e come arricchire il sito. Candidati noti:
- Infor.MO **gravi**: endpoint chiuso (tipoEvento=2 ritorna 0), strada
  bloccata salvo nuove evidenze — dichiarare chiuso;
- serie decennale con **2025**: verificare se INAIL ha pubblicato;
- **incidenza per settore/branca e per territorio** dagli occupati
  (occupati-regione e occupati-settore già scaricati: si può calcolare
  tasso per settore ATECO e per macro-area);
- **dati provinciali** (denunce) se disponibili da Open Data INAIL:
  mappa rischio per provincia;
- **malattie professionali**: più profondità (già pagine esiste) —
  per settore, per agente eziologico;
- **benchmark UE**: dettaglio per paese (ESA W) per confronti più fini;
- **correlazioni** tra fattori causali e settore/territorio (dati Infor.MO
  già scraping: incroci possibili con le viste esistenti);
- esportazione/export dei dati (CSV/API), alert nuovi casi, commenti di
  fonte qualitati;
- eurostat/ISTAT: forza lavoro per settore dettagliato (ATECO 2 digit).

Output atteso: matrice priorità (impatto di trasparenza vs effort
tecnico) da validare con Damiano.

---

## Lezioni apprese (sessione 2026-09-05) — da rileggere PRIMA di partire
1. Verificare SEMPRE i conteggi chiave dopo un ETL (test su sottoinsieme
   non deve inquinare il dataset finale: caso 18905).
2. script lunghi: scrivere tutto con `write` intero, `py_compile`, test
   minimo, grep nomi. Gli esperimenti a metà costano giri.
3. TS: quando un valore nullable entra in un calcolo, guard esplicito
   subito (delta).
4. ETL lunghi: checkpoint + run in background + log a file, riprendibile.
5. Endpoint che non risponde (gravi): testare varianti, poi dichiarare
   limite e passare oltre.