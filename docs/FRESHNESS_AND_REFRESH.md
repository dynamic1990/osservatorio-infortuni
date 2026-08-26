# Freschezza e aggiornamento

## Cadenza per fonte

| Fonte | Aggiornamento fonte | Refresh snapshot | Note |
|-------|--------------------|------------------|------|
| INAIL infortuni mensili | Mensile (dati rilevati al mese precedente) | Dopo ogni pubblicazione INAIL | Ultimo rilascio visto: dati al 30/06/2026 (03/08/2026) |
| INAIL malattie professionali | Mensile/semestrale | Dopo ogni pubblicazione | |
| INL rapporti annuali | Annuale (es. rapporto 2024 pubblicato 03/2025) | Dopo ogni pubblicazione | Formato PDF, richiede parsing |
| Ministero Lavoro CKAN | Da verificare | Quando il portale è disponibile | Attualmente in manutenzione |

## Politica

- Ogni snapshot riporta `data_estrazione` e `fonte` nel file stesso.
- Se una fonte non risponde durante il refresh, lo snapshot precedente resta pubblicato e la pagina "fonti" lo segnala.
- Le discontinuità note (es. cambio classificazione ATECO, nuove province Sardegna da gen 2026) si documentano nel catalogo dati.
