# Osservatorio Infortuni — Design System

## 01 Overview

**Direzione: "Il registro pubblico."**

Osservatorio Infortuni è un prodotto operativo di consultazione e analisi. Deve sembrare un documento pubblico contemporaneo: carta chiara, inchiostro scuro, un accento che indica dove guardare. Niente pannelli traslucidi, niente bagliori, niente angoli arrotondati.

La schermata deve far capire rapidamente:

1. che cosa si sta guardando;
2. qual è il dato o confronto principale;
3. da quale fonte arriva e quanto è fresco;
4. come approfondirlo (filtri, serie, contesto).

La domanda sceglie la forma: mappa per geografia, linea per trend, barre per confronti, tabella per valori esatti. Non usare una visualizzazione solo perché più spettacolare.

Ordine di lettura: **dato principale → confronto → contesto → dettaglio → fonte**.

Prima del design system valgono le regole trasversali di prodotto, raccolte in **[RULES.md](RULES.md)**: nessun aggregato multi-anno, separazione in occasione di lavoro / in itinere, coerenza cromatica tra filtri e grafici della stessa pagina.

## 02 Colors

Palette ispirata al modello DVNS: grigio-carta caldo con un accento. Il tema infortuni suggerisce un segnale forte ma contenuto.

- `--color-bg: #f3f2f2` — fondo applicazione;
- `--color-surface: #eae9e9` — fondo secondario;
- `--color-raised: #ffffff` — superficie dei pannelli;
- `--color-text: #201e1d` — testo principale;
- `--color-accent: #b3261e` — evidenza, serie primaria (rosso segnale);
- `--color-divider` — separatore calcolato dal testo.

Nessun colore scritto a mano nei componenti: i token vivono in `src/app/design-system.css`.

## 03 Type

Sistema tipografico sobrio, altezza di riga generosa, numeri tabulari per le metriche (allineamento nei confronti).

## 04 Data display

- Linea per serie storiche.
- Barre per confronti tra settori o territori.
- Mappa coropletica per la geografia (fase 2).
- Tabella per i valori esatti, con ordinamento.
- Ogni grafico ha equivalente testuale (tabella o testo) per accessibilità.
- Ogni blocco dati mostra fonte e data di estrazione.
