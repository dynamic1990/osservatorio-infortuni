# Freschezza e aggiornamento

## Cadenza per fonte

| Fonte | Aggiornamento fonte | Refresh snapshot | Note |
|-------|--------------------|------------------|------|
| INAIL infortuni mensili | Mensile (dati rilevati al mese precedente) | Dopo ogni pubblicazione INAIL | Ultimo rilascio visto: dati al 30/06/2026 (03/08/2026) |
| INAIL malattie professionali | Mensile/semestrale | Fase 2 | |
| INL rapporti annuali | Annuale | Fase 2 | PDF, richiede parsing |

## Politica

- Ogni snapshot riporta `extractedAt` e fonte nel meta file.
- Se una fonte non risponde durante il refresh, lo snapshot precedente resta pubblicato e la pagina "fonti" lo segnala.
- Le discontinuità note (nuova classificazione ATECO dal 2026, nuova suddivisione province Sardegna da gen 2026) si documentano nel catalogo dati.
- Soglia di stale: 35 giorni (un rilascio mensile mancato + tolleranza).
