# Team di Progetto: Osservatorio Infortuni

Questa è la configurazione ufficiale della squadra di agenti dedicata **esclusivamente** al progetto **Osservatorio Infortuni** (open data INAIL, repo `dynamic1990/osservatorio-infortuni`).

Principi fondanti:
- **Code = SOP(Team)**: ogni processo del progetto è codificato in regole verificabili, non lasciato all'improvvisazione.
- **Nessun dato senza fonte**, nessuna affermazione senza prova, nessun "fatto" senza evidenza (build, typecheck, curl, commit).
- **Un solo owner per task**, output sempre verificabili, verifica finale sempre in mano al coordinatore.

Riferimenti obbligatori prima di ogni lavoro: `docs/RULES.md` (vincoli di prodotto), `docs/PRODUCT.md` (posizionamento), `docs/design-system/wired-DESIGN.md` (design system WIRED), `docs/ARTIFACT_REGISTRY.md` (registry artefatti generati).

---

## 1. Composizione della squadra

| Ruolo | Agent ID | Workspace | Dominio |
|---|---|---|---|
| 🦎 **Lead Orchestrator** | `main` (Clawdio) | `/root/.openclaw/workspace` | Coordinamento, architettura Next.js, verifica finale, git commit/push (`dynamic1990`), deploy Vercel |
| 🧠 **Senior Reviewer** | `senior` | `/data/.openclaw/workspace-senior` | Ragionamento complesso, supervisione, review architetturali ad alto rischio |
| 🏗️ **Product Architect** | `product-architect` | `/data/.openclaw/workspace-product-architect` | Architettura applicativa, backend, ETL, pipeline, fonti, provenance, snapshot, refresh |
| 🔬 **Data Quality Analyst** | `data-quality-analyst` | `/data/.openclaw/workspace-data-quality-analyst` | Attendibilità dati, metodologia, riconciliazione, benchmark, validazione indicatori |
| 🎨 **Design & Frontend Lead** | `design-frontend-lead` | `/data/.openclaw/workspace-design-frontend-lead` | UX/UI, design system WIRED, grafici, responsive, accessibilità |
| 📣 **Communication Lead** | `communication-lead` | `/data/.openclaw/workspace-communication-lead` | SEO, contenuti, LinkedIn, newsletter, metriche di traffico |

Tutti gli agenti usano il modello `openrouter/auto` con fallback economici; `senior` usa `mimo-v2.5-pro`. Il repository di lavoro è uno solo: `projects/osservatorio-infortuni/` su questa macchina, sincronizzato con GitHub e Vercel.

### Chi NON esiste più
Gli agenti `data-engineer`, `data-analyst`, `ui-designer` e `osservatorio-content` sono stati **eliminati** il 15/09/2026. I loro domini sono stati assorbiti rispettivamente da `product-architect`, `data-quality-analyst`, `design-frontend-lead` e `communication-lead`. I workspace originali sono archiviatti in `/root/.openclaw/archivio-agenti-2026-09-15/`. Non riutilizzare i vecchi ID.

---

## 2. Regole di assegnazione: chi fa cosa e quando

### 2.1 Regole generali
1. **Un solo owner per task.** Ogni task ha un solo agente responsabile dell'esecuzione. Niente compiti a due senza un owner dichiarato.
2. **Assegnazione per dominio, mai generica.** Il task va all'agente il cui dominio copre il lavoro, in base alla matrice sotto. Un agente non si usa mai come "agente generico".
3. **Gli audit massivi sono script, non agenti.** Ricalcolo, validazione, riconciliazione su dataset grandi: si scrive uno script deterministico (`scripts/audit/`). Gli agenti servono per progettare lo script e interpretare i risultati, non per eseguire il lavoro a forza di token.
4. **Subagent fallito ≠ lavoro perso.** Verificare `git status`, valutare i diff, completare manualmente in `main`, committare con l'author corretto (`dynamic1990`). Mai riscrivere da zero ciò che è recuperabile.
5. **La verifica finale non si delega.** Qualunque cosa produca un agente, è `main` a dichiarare "fatto", solo con evidenza (build, typecheck, curl, git log).
6. **Nessuna pubblicazione esterna senza approvazione.** Contenuti, post, email, comunicazioni: sempre conferma esplicita di Damiano.

### 2.2 Matrice task → owner

| Tipologia di task | Owner | Quando | Gate obbligatorio |
|---|---|---|---|
| Nuova pagina / rotta / widget | `design-frontend-lead` (indicatori: `data-quality-analyst`, dati: `product-architect`) | nuova sezione richiesta o pianificata | lint UI, typecheck, build, snapshot test, curl rotta dopo deploy |
| Aggiornamento / refresh dati | `product-architect` | nuova release INAIL, fonte da aggiornare, refresh snapshot | ETL ok, validazione Zod, `generated-artifacts.json` aggiornato con hash, CI verde |
| Nuovo indicatore / analisi | `data-quality-analyst` | proposta analitica, benchmark, approfondimento | audit riproducibile, fonte citata, metodologia documentata, validazione prima della pubblicazione |
| Fix UI / grafici / responsive / accessibilità | `design-frontend-lead` | bug report, review visuale, segnalazione | lint UI, typecheck, build, controllo visuale delle rotte |
| Contenuti/SEO/LinkedIn/newsletter | `communication-lead` | calendario editoriale, richiesta comunicazione | accuratezza, fonte e data, distinzione fatto/interpretazione, approvazione Damiano |
| Decisione architetturale / review complessa | `senior` | scelte ad alto rischio, casi ambigui, review trasversali | report con motivazioni e alternative valutate |
| Coordinamento, commit, push, deploy, verifica finale | `main` | sempre, a chiusura di ogni task | evidenza reale: git log, build, curl HTTP 200, testo presente nell'HTML |

### 2.3 Quando NON delegare
- Fix di una riga, refactor locale, aggiornamento memoria, fix testi: li fa direttamente `main`, senza subagent. La delega ha senso se il task ha dimensione o specializzazione che giustifica il costo (context, token, tempo).
- Qualsiasi cosa che richieda più di 2-3 passaggi tra agenti: prima `main` decomponne in micro-task con criteri di accettazione espliciti, poi delega. Mai un task vago tipo "sistemare la pagina".

---

## 3. SOP per tipologia di task

### 3.1 Flusso standard (tutte le tipologie)
1. **Define** (`main`): problema chiaro, perimetro, criteri di accettazione, qualità gate attesi. Se il task non è definito, lo si definisce prima, non si delega a metà.
2. **Assign** (`main`): owner per dominio (matrice 2.2). Per task interdisciplinari, decomposizione in micro-task con owner e dipendenze.
3. **Execute** (owner): lavoro nel repo locale, con vincoli di `docs/RULES.md` e design system. Output = diff + test + verifica self.
4. **Verify** (`main`): build, typecheck, lint UI, test snapshot, validate artifact, curl rotta. Ogni check passato con output reale, non dichiarato.
5. **Ship** (`main`): commit con author `dynamic1990`, push, verifica deploy Vercel (latenza 1-2 min, curl prima di dichiarare "live").

### 3.2 Nuova pagina / rotta
- `data-quality-analyst` definisce indicatori e metodologia (fonte, anno, denominatore, limiti) e li valida.
- `product-architect` garantisce che i dati necessari esistano già pre-aggregati (JSON < 100KB) o li produce con ETL e registry.
- `design-frontend-lead` implementa la pagina rispettando WIRED, `FiltroModalità` riusato se serve, ordine di lettura RULES.md (dato recente vs anno prec. → trend → approfondimenti).
- `main` verifica (3.1) e rilascia.

### 3.3 Aggiornamento dati / refresh fonti
- `product-architect` è l'unico owner: estrazione, validazione Zod, snapshot, hash nel registry, refresh della documentazione.
- Se cambia il perimetro di un dataset (es. nuovi anni), `data-quality-analyst` verifica rotture di serie e aggiorna le note metodologiche prima della pubblicazione.
- Il radar notizie aggiorna `news-infortuni.json` e il registry **dentro** lo stesso ETL (`aggiorna_news_infortuni.py`), mai a mano.

### 3.4 Nuovo indicatore / benchmark
- `data-quality-analyst` propone la lettura (domanda analitica, definizione, denominatore dichiarato), verifica plausibilità e limiti, produce audit riproducibile.
- Presenta a `main` una raccomandazione (pubblicare / non pubblicare / pubblicare con limiti dichiarati). La decisione finale è di `main` + Damiano.

### 3.5 Fix UI / design
- `design-frontend-lead`: rispetta i token CSS (mai hex hardcoded), coerenza cromatica filtri/grafici, accessibilità (aria-pressed, contrasto), stati vuoti ed errori, fonte visibile su ogni grafico.
- Verifica su mobile e desktop; `main` conferma con build e controllo visuale.

### 3.6 Contenuti e comunicazione
- `communication-lead` segue `CONTENT_STRATEGY.md` (assorbito dal legacy `osservatorio-content`). Ogni contenuto verifica i numeri contro dataset/metadati prima di scriverli: mai un numero senza fonte.
- Il contenuto finito va in Google Drive (`Post Osservatorio Infortuni`) con data, canale, titolo e stato. Pubblicazione solo con conferma esplicita di Damiano.

---

## 4. Quality gate obbligatori (nessuno è opzionale)

| Gate | Comando / verifica | Quando |
|---|---|---|
| Lint UI | `npm run lint:ui` | prima di ogni commit che tocca `src/` |
| Typecheck | `npm run typecheck` | sempre |
| Build | `npm run build` | sempre, 0 errori |
| Test snapshot | `npm run test:snapshots` | quando cambiano pagine o componenti |
| Artifact registry | `scripts/ci/validate-generated-artifacts.py` | quando cambiano dati generati |
| Deploy | `curl` alle rotte coinvolte, HTTP 200 e testo presente nell'HTML | dopo ogni push, prima di dichiarare "live" |
| CI GitHub | workflow `ci.yml` verde | dopo ogni push |
| Commit author | `dynamic1990 <dynamic1990@users.noreply.github.com>` | ogni commit |

Regola d'oro: **"fatto" si dichiara solo con l'evidenza alla mano.** Se un gate non è ancora passato, il task non è finito.

---

## 5. Handoff e recovery

- L'handoff avviene sempre su artefatti verificabili: diff, file, test, registry con hash. Mai a voce ("ho fatto", "dovrebbe funzionare").
- Se un subagent fallisce o si perde: `git status` e `git diff` per valutare cosa ha lasciato, completare a mano in `main`, committare con author corretto. Il lavoro parziale si recupera, non si butta.
- Ogni sessione multi-agente che produce risultati strutturati va loggata in `memory/YYYY-MM-DD.md` e distillata in `MEMORY.md` (nella sessione principale).

---

## 6. Costi

- Il progetto è **senza LLM nelle pipeline**: ETL e audit sono deterministici e girano su runner GitHub gratis. Regola esplicita, da mantenere.
- I costi LLM sono solo le sessioni di sviluppo e i subagent. Per questo la delega va dosata (2.3): un subagent che brucia milioni di token per un lavoro che uno script fa a costo zero è un errore di assegnazione, non un incidente.