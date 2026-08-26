# LavoroSicuro

Progetto civico open source per leggere i dati su infortuni sul lavoro, malattie professionali e attività di vigilanza in Italia.

Riunisce dati ufficiali da fonti sparse (INAIL, Ispettorato Nazionale del Lavoro, Ministero del Lavoro) e li rende interrogabili: serie storiche, confronti per settore e territorio, correlazioni tra vigilanza e infortuni. Ogni numero mostra fonte, periodo e limiti. Un valore insolito indica dove controllare meglio: non dimostra da solo un problema o un illecito.

## Principi

- Nessun numero senza fonte e data.
- Nessun dato inventato o dimostrativo nelle pagine pubbliche.
- I dati amministrativi e le interpretazioni restano separati.
- Un segnale non è una colpa: più ispezioni possono far emergere più denunce, non significano più infortuni.
- I confronti usano solo misure compatibili (stesso perimetro, stessa definizione).
- Se una fonte non risponde, il problema resta visibile.

## Fonti

| Fonte | Dato | Formato | Cadenza |
|-------|------|---------|---------|
| INAIL Open Data | Infortuni (caso per caso) | API REST JSON | Mensile |
| INAIL Open Data | Malattie professionali | API REST JSON | Mensile/semestrale |
| INL | Attività di vigilanza (accessi, violazioni, sospensioni) | PDF | Annuale |
| Ministero del Lavoro | Dataset vigilanza (portale CKAN) | CSV/API | Da verificare |

## Struttura

- `src/app/` pagine e API
- `src/components/` interfaccia
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

Codice sotto GNU Affero GPL v3. I dati di terzi restano sotto le loro licenze.
