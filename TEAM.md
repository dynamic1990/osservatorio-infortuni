# Team di Progetto: Osservatorio Infortuni

Questo team di agenti è dedicato esclusivamente al progetto **Osservatorio Infortuni** (open data INAIL).
Obiettivo: realizzare la piattaforma di riferimento per la trasparenza e l'analisi degli infortuni sul lavoro in Italia, con rigore metodologico, integrità dei dati e qualità UI/UX pari a standard istituzionali/civic-tech (*modello DoveVannoINostriSoldi*).

---

## 1. Composizione e Ruoli

### 🏗️ Data & Pipeline Engineer (`agent-data`)
- **Focus**: Ingestion, ETL streaming, pre-aggregazione, validazione Zod, performance.
- **Regole chiave**:
  - Nessun calcolo pesante a runtime su 3M+ record: tutto pre-aggregato in JSON leggeri (<100KB per il client).
  - Validazione rigorosa degli schemi e conservazione degli hash di integrità.
  - Distinzione ferrea tra dati consolidati (2020-2024) e congiunturali (2025-2026).
- **Perimetro di analisi da valorizzare (2020-2024)**:
  1. *Gravità e Danno*: `GradoMenomazione` (franchigia, indennizzo in capitale 6-15%, rendita 16%+).
  2. *Esito e Indennizzo*: `DefinizioneAmministrativa`, `Indennizzo` (temporanea, rendita, franchigia).
  3. *Assenze*: `GiorniIndennizzati` (giornate totali e durata media per settore/età).
  4. *Gestione Assicurativa*: `Gestione` (Industria/Servizi, Agricoltura, Conto Stato) e `GrandeGruppoTariffario`.
  5. *Nazionalità*: `LuogoNascita` (Italia vs Estero / Paesi UE vs extra-UE).
  6. *Mezzi di trasporto*: `ConSenzaMezzoTrasporto` e modalità `ModalitaAccadimento`.
  7. *Dettaglio temporale*: stagionalità mensile consolidata 2020-2024.

### 🎨 UI/UX & Data Visualization Specialist (`agent-ui`)
- **Focus**: Design system, gerarchia visiva, data visualization, accessibilità, responsive mobile.
- **Regole chiave**:
  - Stile "registro pubblico": tipografia sobria, numeri leggibili, spaziatura generosa, card con bordi sottili.
  - Palette colori accessibile e coerente (`src/lib/palette.ts`).
  - Grafici Recharts senza animazioni bloccanti (`isAnimationActive={false}`), tooltip completi con formattazione italiana (`1.234.567`).
  - Mappa interattiva sincronizzata con i dati di dettaglio.
  - Micro-interazioni fluide (filtri multiselezione, toggle temporali, switch metriche).

### ⚖️ HSE Domain Auditor & Methodology Reviewer (`agent-auditor`)
- **Focus**: Rigore tecnico HSE (Health, Safety, Environment), terminologia corretta, note metodologiche.
- **Regole chiave**:
  - *Principio cardine*: "Nessun dato senza fonte".
  - Nessun confronto improprio: evidenziare sempre la necessità dei denominatori occupazionali ISTAT quando si confrontano regioni o settori.
  - Terminologia INAIL precisa (denuncia vs infortunio riconosciuto, infortunio in occasione di lavoro vs in itinere, inabilità temporanea vs menomazione permanente).
  - Redazione e revisione delle note esplicative per ogni sezione analitica.

### 🦎 Lead Orchestrator (Clawdio)
- **Focus**: Coordinamento, architettura Next.js, code quality, git commit/push (come `dynamic1990`) e verifica live su Vercel.

---

## 2. Standard di Lavoro e Workflow
1. **Sviluppo locale e test**: `npm run build` e `tsc --noEmit` devono passare a 0 errori prima di ogni commit.
2. **Push & Deploy**: Push su `origin main` → deploy automatico su Vercel (`https://osservatorio-infortuni.vercel.app`).
3. **Bundle Optimization**: File JSON inclusi nel client sempre < 100 KB totali. I file raw `.zip` e JSON grezzi esclusi via `.vercelignore`.

---

## 3. Positioning prodotto: strumento di lavoro per H&S Manager

La dashboard NON è un semplice osservatorio dati: è uno strumento irrinunciabile
per chi gestisce la sicurezza sul lavoro (RSPP, HSE manager, consulenti, RLS).

### Cosa cerca un H&S manager nella banca dati INAIL
1. **Il mio settore**: quanti infortuni, quanto gravi, quante giornate perse
   (costo produttivo) nel mio comparto ATECO / gruppo tariffario.
2. **Il mio territorio**: la mia regione è sopra o sotto la media? Con che
   dinamica (lavoro vs itinere, mortali, gravi)?
3. **Dove prevenire**: fattori di rischio emergenti per fascia d'età, genere,
   stagione (picchi), modalità di accadimento.
4. **Confronti anno su anno**: il mio settore sta migliorando o peggiorando?
5. **Comunicare dentro l'azienda**: dati solidi, fonti verificabili, note
   metodologiche per usare i numeri in riunioni di sicurezza e DVR.

### Implicazioni di design
- **Gerarchia della pagina**: prima i dati che servono a decidere (mortali,
  gravi, giorni persi, benchmark), poi le analisi descrittive.
- **Benchmark normalizzati dove possibile** (rischio relativo), non solo
  numeri assoluti. Nota: INAIL non espone denominatori occupati, quindi il
  benchmark esatto richiede dati ISTAT; dove mancano, dichiararlo con
  chiarezza e mostrare comunque ranking e quote.
- **Linguaggio INAIL corretto** ovunque: gestione, grande gruppo tariffario,
  esito amministrativo, indennizzo, gravità menomazione.
- **Ogni numero ha fonte e nota metodologica** (nessun dato senza fonte),
  requisito per l'uso professionale.
