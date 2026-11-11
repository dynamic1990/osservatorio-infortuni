# Audit TOTALE coerenza dati — 2026-09-05

Verifica automatica (script `scripts/audit/audit_dati.py`) dei dataset generati contro RULES.md.
Esiti: **35 OK**, **0 FAIL**, **1 segnalazioni**, **2 info**.

| Area | Voce | Esito | Nota |
|---|---|---|---|
| Home / serie decennale | generatedAt presente | OK | 2026-09-23T17:57:07+00:00 |
| Home / serie decennale | un punto per anno (2014-2024) | OK | 12 anni, da 2014 a 2025 |
| Home / serie decennale | unita indice | OK | UI dichiara ‰ occ. (serie-decennale-widget.tsx:91,110,125) e metodologia con denominatore ISTAT/Eurostat lfst_r_lfe2emp |
| Home / serie decennale | mortali 2024 (riferimento Infor.MO) | INFO | valore=1239 — deve restare distinto dai casi analizzati Infor.MO 2024 |
| Home / congiunturale | freschezza dichiarata | OK | UI dichiara 'Dati da inizio anno (YTD), aggiornati a giugno 2026' (hero-congiunturale-kpi.tsx:112) |
| Home / congiunturale | periodo dichiarato | OK | Gennaio - Settembre |
| Home / congiunturale | delta totale | OK | delta +21996 (+5.05%) coerente |
| Home / congiunturale | delta lavoro | OK | delta +17359 (+4.78%) coerente |
| Home / congiunturale | delta itinere | OK | delta +4637 (+6.36%) coerente |
| Home / congiunturale | delta mortali | OK | delta +39 (+4.97%) coerente |
| Home / congiunturale | delta mortaliLavoro | OK | delta +20 (+3.48%) coerente |
| Home / congiunturale | delta mortaliItinere | OK | delta +19 (+9.09%) coerente |
| Home / congiunturale | totale = lavoro+itinere anno2025 | OK | 435883 vs 435883 |
| Home / congiunturale | totale = lavoro+itinere anno2026 | OK | 457879 vs 457879 |
| Home / congiunturale | mortali = lavoro+itinere anno2025 | OK | 784 vs 784 |
| Home / congiunturale | mortali = lavoro+itinere anno2026 | OK | 823 vs 823 |
| Home / indice incidenza | generatedAt presente | OK | 2026-11-11T07:07:16+00:00 |
| Home / indice incidenza | unita indice | OK | UI dichiara 'per 1.000 occ.' e metodologia (regioni-incidenza-section.tsx:252,638) |
| Malattie / nazionale | generatedAt presente | OK | 2026-11-11T07:04:24+00:00 |
| Malattie / nazionale | totale = 2025+2026 | OK | 155017 vs 155017 |
| Malattie / nazionale | M+F = totale | OK | 155017 vs 155017 |
| Malattie / nazionale | delta I semestre | OK | delta +11653 (+16.26%) coerente |
| Malattie / serie mensile | somma mesi 2025 | OK | 71682 vs 71682 |
| Malattie / serie mensile | somma mesi 2026 | OK | 83335 vs 83335 |
| Malattie / categorie | somma categorie <= totale | OK | 155017 vs 155017 (top 20, atteso <=) |
| Malattie / categorie | delta categorie | SEGNALAZIONE | delta non memorizzato nel JSON: calcolato a runtime (anno2026-anno2025) nel componente malattie-patologie-widget — verificato coerente, nessun campo da confrontare |
| Vigilanza / serie | generatedAt presente | OK | 2026-09-03T14:45:00+00:00 |
| Vigilanza / patente crediti | campi presenti | OK | {"attivaDa": "1 ottobre 2024", "obbligatoriaDa": "1 gennaio 2025", "rilasciate": 479020, "sanzioniAssenza": 1088, "revoc |
| Casi mortali / serie | generatedAt presente | OK | 2026-10-19T05:30:48.715866+00:00 |
| Casi mortali / serie | casi analizzati 2024 (riferimento) | INFO | casiAnalizzati=249, mortaliNazionali=1239 — distinguo dichiarato in pagina |
| Benchmark UE / ranking | generatedAt presente | OK | 2026-08-29T09:40:48+00:00 |
| Benchmark UE / ranking | ultimoAnno dichiarato | OK | 2023 |
| Benchmark UE / ranking | Italia presente | OK | {"codice": "IT", "nome": "Italia", "tassoIncidenzaStandardizzato": 2.62, "isItaly": true, "isEU": false} |
| Benchmark UE / ranking | unita dichiarata | OK | Tasso di incidenza standardizzato per 100.000 occupati (infortuni mortali) |
| Denominatori / occupati | occupati-regione.json unita dichiarata | OK | migliaia |
| Denominatori / occupati | occupati-regione.json fonte dichiarata | OK | Eurostat lfst_r_lfe2emp (occupati 15-64, migliaia) - base ISTAT RCFL |
| Denominatori / occupati | occupati-settore.json unita dichiarata | OK | migliaia |
| Denominatori / occupati | occupati-settore.json fonte dichiarata | OK | Eurostat (occupati 15-64 per sezione NACE A-U), proiezione 2025 su crescita occu |

---

Legenda: OK = coerente · FAIL = incoerenza da correggere · SEGNALAZIONE = da verificare in UI · INFO = riferimento.