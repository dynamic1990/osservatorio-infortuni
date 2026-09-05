# Audit TOTALE coerenza grafiche — 2026-09-05

Audit grafiche richiesto da Damiano (docs/NEXT_SESSION.md punto 3, ultimo punto aperto dell'audit 09-04).
Riferimenti: docs/RULES.md (regole 4-5-6 + checklist), docs/DESIGN.md (design system WIRED),
src/app/design-system.css (token), src/lib/palette.ts (palette categoriale, delibera 04/09).

Metodo: revisione statica del codice (grep esaustivo su hex/rgb nei componenti e nelle pagine) +
verifica runtime via CDP su preview localhost:3100 con emulazione **viewport 375x812 (mobile)** e
**1440x900 (desktop)**: misura oggettiva overflow orizzontale, elementi fuori viewport, distacco
titoli→grafici, intersezioni legende↔grafici. Screenshot in `docs/audit/shots/`
(mob-*.png 375px, desk-*.png 1440px, cdp-*.png con viewport emulato CDP).

---

## 1. Tabella esiti per pagina

### / (home)

| Voce | Esito | Note |
|---|---|---|
| Colori solo da token CSS | OK | Zero hex/rgb hardcoded nei componenti; unica costante `ATECO RISK_START/RISK_END` (ateco-settori-widget.tsx:13-14), scala di rischio nativa non collegata alla mappa colore→canale (vedi segnalazioni n.5) |
| Filtro attivo = colore serie (Reg.4) | OK | `FiltroModalita` (filtro-modalita.tsx:56,64) usa MODAL_COLORS.lavoro=ACCENT / itinere=INK; le serie lavoro/itinere dei widget collegati usano la stessa mappa condivisa |
| Mappa colore→canale unica per pagina | OK | Dichiarata in src/lib/palette.ts (MODAL_COLORS), riusata da tutti i widget con filtro modalità |
| Toggle uniformi btn-pill (Reg.5) | OK* | Filtri anno/modalità/metrica tutti `btn-pill` + `active`; *2 eccezioni inline segnalate (n.1, n.3) |
| Spazi/typografia/angoli coerenti WIRED | OK* | Hairline, serif nei titoli, nessuna ombra decorativa; *borderRadius "6px" fuori scala token in 4 widget (segnalazione n.2) |
| Titoli/legende distaccati dai grafici | OK | card-header → grafico: gap 311–1133px su desktop, 368–1276px mobile (gap include card-desc); legende recharts sotto gli SVG (verifica CDP: nessuna intersezione) |
| Responsive 375px | OK | scrollWidth=375=viewport, 0 elementi fuori viewport, n.0 overflow |
| Responsive 1440px | OK | scrollWidth=1440=viewport, 0 elementi fuori viewport |
| Delta codifica coerente | OK | accent=peggioramento / success=miglioramento ovunque (hero-congiunturale-kpi.tsx:147,178,210,238) |

### /casi-mortali

| Voce | Esito | Note |
|---|---|---|
| Colori solo da token CSS | OK | Nessun hex/rgb; INFORM_COLORS in informo-casi.ts:52 deriva da ACCENT/INK/LINK/RISK_SCALE di palette.ts |
| Filtro attivo = colore serie | OK | N/A: nessun filtro modalità (canale non separabile, limitazione dichiarata nel modale metodologia) |
| Toggle uniformi | OK | Anno in InformoEsploratore via `btn-pill`; liste InformoVociLista con righe espandibili coerenti |
| Spazi/titoli coerenti | OK* | Sezioni con `Sezione` custom (h2 serif 1.15rem + occhiello uppercase accent), non usa `.card-title` — coerente ma con resa leggermente diversa dalle altre pagine (vedi n.6) |
| Titoli→grafici distaccati | OK | gap 55px (desktop) / 78px (mobile) tra h2 e SVG; legenda testuale sotto il grafico con padding dedicato (informo-trend-widget.tsx:110+) |
| Responsive 375px / 1440px | OK | 0 overflow, 0 fuori viewport su entrambe le viewport |

### /malattie-professionali

| Voce | Esito | Note |
|---|---|---|
| Colori solo da token CSS | OK | `rgba(0,0,0,0.07)` solo come fondo barra progresso (neutro, ammesso); PALETTE centrale riusata |
| Filtro attivo = colore serie | OK | Viste anno/periodo via btn-pill; serie confronto 2025=muted / 2026=accent (malattie-andamento-widget.tsx:79,82) |
| Toggle uniformi | OK* | `btn-pill` con classe fantasma `btn-pill-accent` (mai definita nel CSS: innocua, da pulire) — vedi n.7 |
| Spazi/titoli coerenti | OK | card-header standard |
| Titoli→grafici distaccati | OK | gap 405–459px desktop, 500–630px mobile; legende recharts sotto il grafico |
| Responsive 375px / 1440px | OK | 0 overflow su entrambe; layout pat-row a due righe su mobile funzionante |
| Delta codifica | OK | accent-soft/success-soft con pill delta (malattie-patologie-widget.tsx:89-90) |

### /vigilanza

| Voce | Esito | Note |
|---|---|---|
| Colori solo da token CSS | OK | Colori viste violazioni in record VISTE con var(--color-*) (vigilanza-violazioni-widget.tsx:28-30) |
| Filtro attivo = colore serie | OK* | Vista violazioni: pill attiva nera (uniforme) ma serie bar = accent; scelta "filtro neutro + serie colorata" accettabile ma da confermare (n.4) |
| Toggle uniformi | OK* | btn-pill ovunque; classe `btn-pill-accent` fantasma (n.7) |
| Spazi/titoli coerenti | OK | card-header standard |
| Titoli→grafici distaccati | OK | gap 137–446px desktop, 292–530px mobile; legenda recharts sotto |
| Responsive 375px / 1440px | OK | 0 overflow, 0 fuori viewport |

### /fonti

| Voce | Esito | Note |
|---|---|---|
| Colori solo da token CSS | OK | Solo var(--color-*) inline |
| Coerenza WIRED | OK* | Header/badge accent coerenti; *non usa `.container` (layout full-width senza max-width: a 1440px le card si allargano fino a ~1392px, a differenza di tutte le altre pagine max 1160px) — vedi n.8 |
| Titoli distaccati | OK | Gap ampia tra header e card; nessun grafico in pagina |
| Responsive 375px / 1440px | OK | 0 overflow su entrambe le viewport |

---

## 2. Problemi trovati (con gravità)

| # | Gravità | Problema | Dove |
|---|---|---|---|
| 1 | **Media** | Toggle inline che duplicano btn-pill senza usare la classe (Reg.5: un controllo = una resa). Resa visiva quasi identica ma padding/font-size/radius/hover divergono | gravita-durata-widget.tsx:75-90, dimensioni-widget.tsx:79-94 |
| 2 | **Media** | borderRadius "6px" hardcoded fuori scala token (design system: angoli 0-4px; --radius-md/lg=4px). Incoerenza col resto dell'app | hero-congiunturale-kpi.tsx:133,162,194,227,250; malattie-patologie-widget.tsx:68; ateco-settori-widget.tsx:166,200 |
| 3 | **Media** | Toggle vista con stile inline parallello (stesso problema n.1, su pagina diversa) | malattie-regioni-widget.tsx:69-77 |
| 4 | **Bassa** | Vista violazioni vigilanza: pill attiva nera uniforme mentre la serie della vista è colorata (accent/warning/link). Scelta difendibile ("filtro" vs "canale") ma da confermare con Damiano per coerenza con la Reg.4 applicata in FiltroModalita | vigilanza-violazioni-widget.tsx:57 |
| 5 | **Bassa** | Costanti colore duplicate in ateco-settori-widget.tsx (RISK_START/RISK_END rgb) invece di riusare RISK_SCALE di palette.ts. Non altera la mappa colore→canale, ma palette.ts resta l'unica fonte dichiarata delle scale | ateco-settori-widget.tsx:13-14 |
| 6 | **Bassa** | /casi-mortali usa un componente Sezione custom (h2 1.15rem + occhiello) invece di card-header/card-title: resa leggermente più compatta delle altre pagine. Non ibrido, ma da uniformare se Damiano vuole identità visiva identica | src/app/casi-mortali/page.tsx:16-53 |
| 7 | **Cosmetica** | Classe CSS fantasma `btn-pill-accent` in 10 componenti: mai definita in nessun CSS (nessun effetto visivo, ma inganna il lettore del codice) | malattie-andamento, regioni-incidenza, malattie-regioni, stagionalita, malattie-decessi, vigilanza-trend, vigilanza-violazioni, vigilanza-tipologie, demografia-annuale (alcuni), serie-decennale |
| 8 | **Bassa** | /fonti non usa `.container` (max-width 1160px): layout full-width diverso da tutte le altre pagine | src/app/fonti/page.tsx:12 |

Verifica oggettiva NON-problemi (CDP): **zero overflow orizzontale** su tutte le 5 pagine a 375px
e 1440px (scrollWidth == viewport, 0 elementi fuori viewport); **nessuna sovrapposizione reale**
tra legende recharts e grafici (le intersezioni bbox rilevate sono gli item-legenda dentro il
wrapper `.recharts-legend-wrapper`, non il grafico).

---

## 3. Fix applicati

Nessun fix applicato: tutti i punti trovati sono o ambigui (richiedono delibera Damiano) o richiedono
un giro coordinato su più widget (togliere btn-pill-accent fantasma + uniformare i toggle inline)
che è meglio fare in una sessione dedicata per non mescolare interventi. Build e tipo-check
verificati verdi sullo stato attuale: `npx tsc --noEmit` OK, `npm run build` OK (7 rotte statiche).
Commit audit-only: **6cfc781**.

---

## 4. Segnalazioni da confermare con Damiano

1. **Toggle inline non-btn-pill (problemi 1 e 3)**: li uniformo a `.btn-pill` + `.active`? È il fix
   giusto secondo la Reg.5, ma tocca 3 widget e cambia la resa (padding/font leggermente diversi).
2. **borderRadius 6px → var(--radius-md) 4px (problema 2)**: allineo tutti i box ai token WIRED?
3. **Filtro violazioni vigilanza (problema 4)**: la pill attiva deve colorarsi come la serie che
   controlla (accent/warning/link come fa FiltroModalita), o resta il nero uniforme WIRED?
4. **RISK_START/RISK_END locali (problema 5)**: li sposto/riuso da palette.ts (RISK_SCALE)?
5. **Sezione casi-mortali (problema 6)**: uniformo alle card-header delle altre pagine o il
   formato "occhiello + h2 compatto" va bene così?
6. **/fonti senza .container (problema 8)**: allineo il layout alle altre pagine (max-width 1160px)?
7. **Classe btn-pill-accent fantasma (problema 7)**: la rimuovo dai 10 componenti (pulizia zero-risk)?

---

## 5. Sintesi

- **Esiti per pagina**: home OK, /casi-mortali OK, /malattie-professionali OK, /vigilanza OK, /fonti OK (con * sulle voci contrassegnate).
- **Fix applicati**: 0 (nessun fix sicuro e non ambiguo trovato; build e tsc verificati verdi).
- **Segnalazioni aperte**: 8 problemi catalogati (3 medie, 4 basse, 1 cosmetica) → 7 domande per Damiano.
- **Verifica esplicita Damiano (titoli/legende distaccati desktop+mobile)**: SUPERATA con misura oggettiva CDP (gap 55–1276px titolo→grafico; legende sotto i grafici senza intersezioni).
- **Responsive 375px e 1440px**: SUPERATA con misura oggettiva CDP (0 overflow, 0 fuori viewport, 5/5 pagine).
