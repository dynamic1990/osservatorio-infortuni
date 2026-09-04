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
- Quello che è vietato è sommare o mediare gli anni in un unico valore.

**Le serie storiche non sono un aggregato multi-anno.** Una serie con un punto (o una barra) per ogni anno è il modo corretto di raccontare il trend, ed è anzi la forma preferita. La serie decennale 2014-2024 è quindi ammessa così com'è: ogni barra è un anno distinto e l'andamento si legge lungo l'asse. La regola colpisce solo il valore unico che comprime più anni in un numero ("2020-2024: 2,4 milioni di denunce").

Eventuali totali di periodo sono ammessi solo se l'utente li seleziona esplicitamente e solo con etichetta chiara del perimetro.

Forma della lettura corretta:

```
2024 — 585.000 denunce
Δ vs 2023: -12.400 (-2,1%)
```

---

## Regola 2 — L'app è uno strumento di lettura dei trend

Un numero riferito a un singolo anno, da solo, non dice quasi nulla: non si capisce se il fenomeno migliora, peggiora o è stabile. L'Osservatorio esiste per rendere leggibile la direzione delle cose, quindi ogni pagina, **ove la fonte lo consenta**, deve dare quattro livelli di lettura, in ordine di importanza:

1. **Trend storico**: la serie temporale del fenomeno (un punto o una barra per anno, per mese dove ha senso), per vedere l'andamento nel tempo.
2. **Confronto anno in oggetto vs anno precedente**: il delta in valore assoluto e in percentuale, con segno esplicito e codifica cromatica coerente.
3. **Percentuali dove possibile**: le quote di composizione (per settore, genere, gravità, territorio) quando il valore assoluto da solo non basta a capire il peso relativo.
4. **Tasso di incidenza dove possibile**: il dato rapportato a una dimensione del fenomeno (es. denunce ogni 100.000 occupati), per confrontare anni, territori e settori con popolazioni diverse. Il denominatore va sempre dichiarato: fonte, perimetro e anno di riferimento.

Gerarchia minima: se una fonte permette una sola elaborazione, quella minima è il confronto anno vs anno precedente. Trend e tasso di incidenza sono il livello desiderabile, non accessori; dove i dati per calcolarli esistono, vanno mostrati.

### Ordine di lettura nella pagina

I **primi indicatori visibili in una pagina devono rappresentare il dato più recente disponibile messo a confronto con l'anno precedente**. Il lettore deve capire subito dove siamo posizionati rispetto all'anno scorso, prima di ogni altra elaborazione. Solo dopo arriva il trend storico, se la fonte lo consente.

Struttura di riferimento per ogni pagina:

1. **Apertura**: ultimo anno o periodo disponibile vs anno precedente, con delta in valore assoluto e in percentuale. Qui si risponde alla domanda «come stiamo andando?».
2. **Contesto**: il trend storico, una barra o un punto per anno. Qui si risponde a «da dove veniamo?».
3. **Approfondimento**: composizioni, territori, settori, confronti di benchmark.

Corollari operativi:

- Nelle sezioni con filtro anno, l'anno di default è il **più recente disponibile**; il delta vs anno precedente accompagna sempre il dato principale.
- Non si apre una sezione con un anno arbitrario, né con un dato privo di confronto.
- I blocchi che non sono indicatori statistici (cronaca, notizie, approfondimenti qualitativi) non spezzano la sequenza «confronto più recente → trend storico»: se presenti, stanno dopo, o in una posizione che non interrompe la lettura.

---

## Regola 3 — Separazione "occasione di lavoro" e "in itinere"

I due fenomeni hanno cause, dinamiche e leve di prevenzione diverse. Metterli insieme produce un numero che non parla né agli uni né agli altri.

Prescrizioni operative:

- Ovunque la fonte lo consenta, infortuni e malattie vanno **separati in "occasione di lavoro" e "in itinere"**.
- La separazione è sempre **selezionabile tramite filtro**, con la possibilità di vedere le due modalità singolarmente o affiancate nel confronto.
- Il componente di riferimento è `FiltroModalità` (`src/components/charts/filtro-modalita.tsx`). Va riusato, non riscritto: garantisce già comportamento toggle, stato `aria-pressed` e palco cromatico allineato.
- Se un widget non ha copertura dati sufficiente per la scomposizione, va mostrato un solo canale con nota esplicita della limitazione della fonte, non un dato misto silenzioso.
- I totali complessivi restano ammessi solo come riga di sintesi, mai come unica lettura disponibile.

---

## Regola 4 — Coerenza cromatica tra filtri e grafici

Il colore è un sistema di riferimento, non una decorazione. Se nella stessa pagina un filtro usa un colore e il grafico associato ne usa un altro, l'utente perde il collegamento tra ciò che seleziona e ciò che legge.

Prescrizioni operative:

- In una medesima pagina, il **colore di un pulsante di filtro attivo è lo stesso colore della serie, barra o area che quel filtro controlla**.
- Nessun colore scritto a mano nei componenti: si usano i token CSS in `src/app/design-system.css` (`--color-accent`, `--color-blue`, `--color-success`, `--color-warning`, ecc.).
- Ogni canale dati mantiene lo **stesso colore in tutta la pagina**: se "in occasione di lavoro" è blu in un grafico, è blu in tutti i grafici, nelle legende e nei filtri di quella pagina.
- L'assegnazione colore → canale va dichiarata una sola volta per pagina, in un punto di definizione condiviso dai widget, non ripetuta dentro ogni componente.
- I delta usano una codifica distinta e coerente: una sola coppia di colori per "peggioramento / miglioramento", mai colori presi dalla palette delle serie.
- Le palette devono restare leggibili anche in condizioni di daltonismo e in scala di grigi: il colore non è mai l'unico canale che distingue due serie (si affiancano etichette dirette, tratteggi o ordine).

---

## Regola 5 — Design system: una sola fonte, applicata ovunque

Quando per l'app viene adottato un design system di riferimento (per esempio uno dei sistemi raccolti in awesome-design-md, il repository indicato da Damiano), quella scelta **sostituisce tutte le precedenti e vale per l'intera applicazione**, senza eccezioni per pagina o componente.

Prescrizioni operative:

- Il design system adottato va **scelto una volta e documentato** in `docs/DESIGN.md`, con riferimento esplicito (link del repository, nome del sistema) e le eventuali varianti deliberate.
- **Applicazione integrale e professionale**: colori, tipografia, spaziature, forme dei controlli, angoli, elevazione, stati hover/active/focus, empty state e comportamento responsive seguono il sistema scelto. Non si applica un design system "a metà", ibridandolo con stili precedenti o lasciando pagine in versione vecchia.
- **Niente stili paralleli**: i design system non si mescolano. Se si cambia riferimento, si migra tutta l'app con un unico giro di modifiche; non si introduce il nuovo stile pagina per pagina lasciando il resto indietro.
- **Componenti condivisi**: pulsanti, filtri, card, tooltip e altri elementi riutilizzabili sono definiti una volta sola, conformi al sistema scelto, e riusati da tutte le pagine. Un controllo uguale non ha mai due resa diverse a seconda della sezione.
- I token del design system (in `src/app/design-system.css`) restano l'unica fonte dei colori, in coerenza con la Regola 4: la mappa colore → canale si declina con la palette del sistema adottato.
- Prima di dichiarare conclusa una modifica visuale va verificata la **coerenza su tutte le pagine**, non solo su quella toccata.

---

## Regola 6 — Leggibilità prima della spettacolarità

Corollario delle regole precedenti, valido per ogni scelta di visualizzazione.

- La forma segue la domanda: linea per i trend, barre per i confronti, mappa per la geografia, tabella per i valori esatti.
- Ogni grafico ha un equivalente testuale o tabellare accessibile.
- Ogni blocco dati mostra fonte e data di estrazione.
- Nessuna visualizzazione viene scelta perché più appariscente.

---

## Checklist applicativa

Prima di considerare conclusa una pagina o un widget, verificare:

- [ ] Nessun valore aggregato su più anni; ogni dato è riferito a un anno selezionabile.
- [ ] Il primo blocco della pagina mostra il dato più recente vs anno precedente, con delta (valore + %).
- [ ] Il trend storico segue il confronto iniziale e non lo precede; l'anno di default è il più recente.
- [ ] Serie storica visibile dove la fonte lo consente (un punto/barra per anno).
- [ ] Delta vs anno precedente presente e formattato (valore + percentuale + segno).
- [ ] Percentuali presenti dove il valore assoluto da solo non basta.
- [ ] Tasso di incidenza calcolato dove i denominatori esistono, con fonte del denominatore dichiarata.
- [ ] Separazione in occasione di lavoro / in itinere presente o limitazione dichiarata.
- [ ] Filtri e grafici della pagina condividono la stessa mappa colore → canale.
- [ ] Colori presi dai token del design system, non hardcoded.
- [ ] Design system di riferimento documentato in DESIGN.md e applicato in modo integrale e coerente su tutte le pagine (nessuna pagina ibrida o in versione vecchia).
- [ ] Fonte e freschezza del dato visibili.