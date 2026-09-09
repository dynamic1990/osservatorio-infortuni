# Osservatorio Infortuni

Progetto civico open source per rendere leggibili i dati sugli infortuni sul lavoro in Italia.

La banca dati INAIL è ricchissima ma di difficile lettura: dataset enormi, codici al posto dei nomi, nessuna vista sintetica. Osservatorio Infortuni la valorizza al massimo, con grafici e analisi che permettono una lettura facile e approfondita: serie storiche, andamenti per settore e territorio, modalità di accadimento, esiti.

## Fase 1: Open data INAIL

Copertura attuale (verificata 2026-08-27):

- **Serie storica consolidata 2020-2024**: dataset semestrali regionali INAIL (file CSV), tutte le 20 regioni, ~3 milioni di record, con definizione amministrativa, indennizzo e giorni indennizzati.
- **Congiuntura mensile 2025-2026**: API REST mensile (16 regioni) + CSV mensili delle 4 regioni con nome composto (Valle d'Aosta, Trentino-Alto Adige, Friuli-Venezia Giulia, Emilia-Romagna).
- Analisi per: tempo (serie storiche), luogo (regione/provincia ISTAT), persona (età, genere), modalità (in occasione di lavoro / in itinere, con/senza mezzo di trasporto), settore (ATECO), esito.

Limite noto: l'API REST mensile espone ~18 mesi di finestra; per lo storico si usano i CSV semestrali regionali (5 anni). La fase 2 integrerà i dati di vigilanza dell'Ispettorato Nazionale del Lavoro e le malattie professionali (l'API REST copre ~18 mensili).

## Principi

Le regole valide in tutta l'app (nessun aggregato multi-anno, separazione lavoro/itinere, coerenza cromatica filtri-grafici) sono in **[docs/RULES.md](docs/RULES.md)**. Da leggere prima di aggiungere o modificare una pagina.

- Nessun numero senza fonte e data.
- Nessun dato inventato o dimostrativo nelle pagine pubbliche.
- Un segnale non è una colpa: un aumento delle denunce può dipendere da più vigilanza, più consapevolezza o cambi normativi.
- I confronti usano solo misure compatibili (stesso perimetro, stessa definizione).
- Se una fonte non risponde, il problema resta visibile.
- Privacy: nessuna pubblicazione di casi singoli, solo aggregazioni.

## Fonti

| Fonte | Dato | Formato | Cadenza |
|-------|------|---------|---------|
| INAIL Open Data | Infortuni (record per record) | API REST JSON | Mensile / semestrale |
| INAIL Open Data | Malattie professionali | API REST JSON | Mensile / semestrale |

## Struttura

- `src/app/` pagine e API
- `src/components/` interfaccia e grafici
- `src/data/generated/` snapshot verificati
- `scripts/etl/` aggiornamento fonti (Python)
- `docs/` metodo, architettura, note legali
- `tests/` controlli automatici

## Sviluppo

```bash
npm ci
npm run dev
```

Script ETL:

```bash
python3 scripts/etl/inail_infortuni_snapshot.py --regione Lazio --anno 2025 --mese 01
```

## Licenza

Codice sotto [GNU Affero General Public License v3.0](LICENSE). I dati di terzi (INAIL, Eurostat, ISTAT, INL) restano sotto le rispettive licenze pubbliche.

## Contribuire

Issue e pull request benvenute. Prima di intervenire leggere `docs/RULES.md` (regole su dati e interfaccia) e `docs/LEGAL_AND_ETHICS.md` (limiti e responsabilità).

## Sito live

https://www.osservatorioinfortuni.it
