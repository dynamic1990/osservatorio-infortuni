# Osservatorio Infortuni — Product Context

## Platform

web

## Users

Il pubblico primario sono gli **addetti ai lavori**: RSPP/ASPP, HSE manager, medici del lavoro, delegati sindacali, consulenti e formatori che devono leggere i dati sugli infortuni per capire dove intervenire. Oggi questi dati esistono ma sono dispersi in dataset enormi e poco leggibili.

Utenti secondari:

- giornalisti e fact-checker che devono risalire rapidamente dal dato alla fonte originale;
- ricercatori e analisti che confrontano settori, territori e periodi;
- funzionari di enti pubblici e parti sociali;
- cittadini che vogliono capire il fenomeno.

La situazione d'uso tipica è esplorativa e analitica: una persona parte da un settore, una provincia, un periodo o una modalità di accadimento e deve poter seguire collegamenti verificabili senza scaricare e processare CSV giganti.

## Product purpose

Osservatorio Infortuni aggrega e normalizza i dati open data INAIL per rendere il fenomeno degli infortuni sul lavoro leggibile, confrontabile e verificabile da un unico punto di accesso, con grafici e serie storiche.

Il prodotto non sostituisce le fonti ufficiali. Le collega, conserva la provenienza e riduce il costo cognitivo necessario per capire dati oggi difficili da leggere.

## Positioning

**Un unico posto per leggere gli infortuni sul lavoro in Italia e controllare i numeri alla fonte.**

## Operating context

Il prodotto opera su dati pubblici con frequenze definite. "Live" non significa inventare un tempo reale che la fonte non offre.

Per ogni aggregato rilevante conserviamo almeno:

- fonte e titolare del dato;
- URL o identificativo sorgente;
- data di riferimento/pubblicazione;
- data e ora di acquisizione;
- frequenza attesa della fonte;
- trasformazioni applicate;
- perimetro e limiti noti.

La UI deve rendere visibile la freschezza effettiva del dato.

## Fase 1 (attuale)

Solo open data INAIL sugli infortuni (cadenza mensile). Analisi per: tempo, territorio, settore, persona, modalità, esito. Nessuna correlazione con la vigilanza finché non ci sarà una fonte strutturata.

## Fase 2 (futura)

- Malattie professionali.
- Dati di vigilanza INL (da PDF annuali, con caveat espliciti).
- Tassi di incidenza con denominatori Istat (occupati per settore/territorio).
