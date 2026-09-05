# Proposta — Tool SEO e analisi traffico utenti

_Data: 2026-09-05 · Stato: DA DECIDERE (Damiano) · Riferimento: NEXT_SESSION.md punto 1_

## Obiettivo

Dashboard professionale di analisi del traffico (visite, utenti, sorgenti, pagine più
viste, tempo, bounce) pensata per la scala: il sito potrebbe crescere, e l'infrastruttura
di misura va scelta subito in modo da non doverla cambiare dopo.

## Criteri di valutazione

1. **Privacy/GDPR**: niente cookie banner se possibile (il sito oggi non ne ha).
2. **Scala**: costo e affidabilità da poche centinaia a milioni di visite/mese.
3. **Integrazione**: il sito è su Vercel (dominio `osservatorio-infortuni.vercel.app`).
4. **Dove mostrare i dati**: pagina riservata vs pubblica vs report periodico.
5. **Costo**: l'Osservatorio è un progetto senza budget.

## Opzioni a confronto

| Criterio | Vercel Analytics | Plausible (self-hosted o cloud) | GA4 |
|---|---|---|---|
| Integrazione | Nativa, zero-config (dominio Vercel) | Script JS + backend | Script JS + backend |
| Cookie banner | Nessuno (dati aggregati, no cross-device) | Nessuno (privacy-first, no cookie) | **Obbligatorio** (consenso GDPR) |
| Metriche | Visite, utenti, pageview, sorgenti, device, geo (aggregata) | Visite, utenti, pageview, sorgenti, device, geo, durata, bounce | Tutto + eventi custom, funnel, demografia |
| Costo | Gratuito nel piano Hobby (dati 30 giorni) | Cloud ~9€/mese; self-host gratis ma da mantenere | Gratuito |
| Scala | Ottima (infra Vercel) | Ottima | Ottima |
| Export dati | Limitato (dashboard Vercel) | API + CSV | BigQuery (a pagamento oltre soglia) |
| Svantaggi | Dati solo 30 giorni nel piano free; dashboard solo su Vercel | Self-host = un servizio in più da gestire sulla VPS | Cookie banner + complessità GDPR + dati personali |

## Raccomandazione

**Vercel Analytics come base immediata** (zero-config, zero banner, zero costi) per
partire a misurare subito. È la scelta coerente con l'infrastruttura attuale.

**Plausible self-hosted come upgrade quando serve** (es. >50k visite/mese, bisogno di
serie storiche oltre 30 giorni, export dati): gira sulla VPS (31.97.57.243) in Docker
accanto a Open WebUI, con Caddy già configurato come reverse proxy. Costo: solo la VPS
che già paghiamo.

**GA4: esclusa per ora** (cookie banner + complessità GDPR + dati personali: incoerente
con la natura pubblica e "istituzionale" del progetto).

## Dove mostrare i dati

Proposta: **pagina riservata** `/admin/analytics` protetta da password (basic auth o
token), non indicizzata, non linkata dalla nav pubblica. Motivi:

- I dati di traffico non sono un contenuto pubblico dell'Osservatorio (che racconta
  infortuni, non sé stesso).
- Una pagina pubblica di contatori ("X visite questo mese") è un'opzione futura di
  trasparenza, ma non ora.
- Report periodico (es. mensile via email/Telegram) come complemento, non sostituto.

## Cosa misurare (KPI)

- Sessioni e utenti unici (mensili, con trend)
- Pagine/visita, durata media, bounce rate
- Top pagine (per pageview)
- Sorgenti: organic / direct / social / referral (con breakdown)
- Device (mobile/desktop/tablet) e geografia (solo aggregata, per privacy)

## Passi di implementazione (una volta deciso)

1. Abilitare Vercel Analytics dal dashboard Vercel (project settings → Analytics) —
   richiede accesso al progetto Vercel (token o dashboard).
2. Aggiungere `<Analytics />` da `@vercel/analytics` in `layout.tsx`.
3. Creare pagina `/admin/analytics` riservata (basic auth via middleware o env var)
   che embedda la dashboard Vercel o mostri i dati via API.
4. Se si sceglie Plausible: `docker compose` sulla VPS + script + pagina riservata
   con embed pubblico (Plausible ha embed senza auth, ma la pagina resta riservata).

## Decisioni richieste a Damiano

- [ ] OK Vercel Analytics come base immediata?
- [ ] OK pagina riservata `/admin/analytics` (non pubblica)?
- [ ] Plausible self-hosted: da valutare ora o quando serve?
- [ ] Report periodico mensile (Telegram/email): sì/no?