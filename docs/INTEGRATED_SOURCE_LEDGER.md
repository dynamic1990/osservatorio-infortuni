# Registro integrato delle fonti

Ogni dataset pubblicato ha una riga in questo registro con: ente, URL, licenza, formato, frequenza, perimetro e limiti.

| ID | Ente | Dataset | URL | Formato | Cadenza | Perimetro | Limiti |
|----|------|---------|-----|---------|---------|-----------|--------|
| INAIL-INF-MENS | INAIL | Infortuni con cadenza mensile | https://dati.inail.it/api/OpenData/DatiConCadenzaMensileInfortuni | JSON (REST) | Mensile | Regione, anno e mese di accadimento obbligatori; record singoli pseudonimizzati | Non include definizione amministrativa, indennizzo, giorni indennizzati (solo semestrale) |
| INAIL-INF-SEM | INAIL | Infortuni con cadenza semestrale | https://dati.inail.it/api/OpenData/DatiConCadenzaSemestraleInfortuni | JSON (REST) | Semestrale | Come sopra + definizione, esito mortale, indennizzo | Parametro Regione accetta valori particolari (vedi note) |
| INAIL-MAL-MENS | INAIL | Malattie professionali mensili | https://dati.inail.it/api/OpenData/DatiMensiliMalattieProfessionaliDataProt | JSON (REST) | Mensile | Data protocollo | Da testare |
| INL-RAPP-ANNUALE | INL | Rapporto annuale attività di vigilanza | https://www.ispettorato.gov.it/.../Rapporto-annuale-2024.pdf | PDF | Annuale | Accessi, violazioni, diffide, sospensioni per settore e territorio | PDF non strutturato; parsing richiesto; cadenza annuale |
| MLPS-CKAN | Min. Lavoro | Portale open data | https://dati.lavoro.gov.it | CKAN/CSV | ? | ? | Portale in manutenzione (ago 2026); endpoint SpodCkanApi |

## Da verificare

- Licenza esatta dei dataset INAIL (CC BY?)
- Storico anni disponibili per le API INAIL (fino a che anno si può risalire?)
- Presenza di dataset di vigilanza INL nel CKAN del Ministero
- Denominatori per tassi di incidenza (occupati per settore/territorio: Istat RCFL)
