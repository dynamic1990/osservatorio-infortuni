# Osservatorio Infortuni — Regole generali del progetto

Questo file contiene le regole valide in tutta l'applicazione. Sono vincoli di prodotto, non preferenze estetiche: ogni nuova pagina, widget o sezione deve rispettarle senza eccezioni, a meno che la fonte dati renda tecnicamente impossibile applicarle (e in quel caso va dichiarato a schermo).

Le regole valgono per ogni pagina: home infortuni, malattie professionali, vigilanza, e qualsiasi modulo futuro.

---

## Regola 1 — Nessun dato aggregato multi-anno

I dati non vanno mai presentati come aggregato su un intervallo pluriennale del tipo "2020-2024". Un numero del genere non produce alcuna lettura utile: nasconde il trend, mescola anni con perimetri e metodologie diverse, e impedisce di capire se la situazione migliora o peggiora.

Prescrizioni operative:

- Ogni metrica, classifica, grafico e tabella è riferita a **un singolo anno**.
- L'anno è sempre **selezionabile tramite filtro** visibile nella pagina.
- Accanto al valore dell'anno selezionato va riportato il **delta rispetto all'anno precedente**, in valore assoluto e in percentuale, con segno esplicito e colore coerente (miglioramento / peggioramento).
- Se l'anno precedente non è disponibile nella serie, il delta va omesso e va indicato perché (es. "serie disponibile dal 2014").
- Le serie storiche restano ammesse e anzi preferite quando la domanda è proprio l'andamento nel tempo: in quel caso l'asse x è l'anno e **ogni punto è un anno distinto**. Quello che è vietato è sommare o mediare gli anni in un unico valore.
- Eventuali totali di periodo sono ammessi solo se l'utente li seleziona esplicitamente e solo con etichetta chiara del perimetro.

Forma della lettura corretta:

```
2024 — 585.000 denunce
Δ vs 2023: -12.400 (-2,1%)
```

---

## Regola 2 — Separazione "occasione di lavoro" e "in itinere"

I due fenomeni hanno cause, dinamiche e leve di prevenzione diverse. Metterli insieme produce un numero che non parla né agli uni né agli altri.

Prescrizioni operative:

- Ovunque la fonte lo consenta, infortuni e malattie vanno **separati in "occasione di lavoro" e "in itinere"**.
- La separazione è sempre **selezionabile tramite filtro**, con la possibilità di vedere le due modalità singolarmente o affiancate nel confronto.
- Il componente di riferimento è `FiltroModalità` (`src/components/charts/filtro-modalita.tsx`). Va riusato, non riscritto: garantisce già comportamento toggle, stato `aria-pressed` e palco cromatico allineato.
- Se un widget non ha copertura dati sufficiente per la scomposizione, va mostrato un solo canale con nota esplicita della limitazione della fonte, non un dato misto silenzioso.
- I totali complessivi restano ammessi solo come riga di sintesi, mai come unica lettura disponibile.

---

## Regola 3 — Coerenza cromatica tra filtri e grafici

Il colore è un sistema di riferimento, non una decorazione. Se nella stessa pagina un filtro usa un colore e il grafico associato ne usa un altro, l'utente perde il collegamento tra ciò che seleziona e ciò che legge.

Prescrizioni operative:

- In una medesima pagina, il **colore di un pulsante di filtro attivo è lo stesso colore della serie, barra o area che quel filtro controlla**.
- Nessun colore scritto a mano nei componenti: si usano i token CSS in `src/app/design-system.css` (`--color-accent`, `--color-blue`, `--color-success`, `--color-warning`, ecc.).
- Ogni canale dati mantiene lo **stesso colore in tutta la pagina**: se "in occasione di lavoro" è blu in un grafico, è blu in tutti i grafici, nelle legende e nei filtri di quella pagina.
- L'assegnazione colore → canale va dichiarata una volta sola per pagina, in un punto di definizione condiviso dai widget, non ripetuta dentro ogni componente.
- I delta usano una codifica distinta e coerente: una sola coppia di colori per "peggioramento / miglioramento", mai colori presi dalla palette delle serie.
- Le palette devono restare leggibili anche in condizioni di daltonismo e in scala di grigi: il colore non è mai l'unico canale che distingue due serie (si affiancano etichette dirette, tratteggi o ordine).

---

## Regola 4 — Leggibilità prima della spettacolarità

Corollario delle tre regole precedenti, valido per ogni scelta di visualizzazione.

- La forma segue la domanda: linea per i trend, barre per i confronti, mappa per la geografia, tabella per i valori esatti.
- Ogni grafico ha un equivalente testuale o tabellare accessibile.
- Ogni blocco dati mostra fonte e data di estrazione.
- Nessuna visualizzazione viene scelta perché più appariscente.

---

## Checklist applicativa

Prima di considerare conclusa una pagina o un widget, verificare:

- [ ] Nessun valore aggregato su più anni; ogni dato è riferito a un anno selezionabile.
- [ ] Delta vs anno precedente presente e formattato (valore + percentuale + segno).
- [ ] Separazione in occasione di lavoro / in itinere presente o limitazione dichiarata.
- [ ] Filtri e grafici della pagina condividono la stessa mappa colore → canale.
- [ ] Colori presi dai token del design system, non hardcoded.
- [ ] Fonte e freschezza del dato visibili.
