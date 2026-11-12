// Test di coerenza dei dataset pubblicati.
//
// Prima questo comando eseguiva zero test (`tests/*.test.mjs` non esisteva):
// la CI era verde senza aver verificato nulla. Questi controlli leggono gli
// artifact reali e verificano le invarianti che le pagine danno per scontate.
// Se un ETL cambia perimetro o rompe un totale, il test fallisce.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (p) => JSON.parse(readFileSync(new URL(`../src/data/generated/${p}`, import.meta.url), "utf8"));

const viste = load("inail-infortuni-viste.json");
const temporale = load("inail-infortuni-temporale.json");
const multidim = load("inail-multidimensionale.json");
const decennale = load("inail-serie-decennale.json");
const malattie = load("malattie-professionali.json");
const esiti = load("malattie-esiti.json");
const informo = load("informo-mortali-analisi.json");
const news = load("news-infortuni.json");
const congiunturale = load("inail-congiunturale-pari-perimetro.json");
const occupati = load("occupati-regione.json");

test("viste: la serie annuale coincide con la somma delle regioni", () => {
  const somma = new Map();
  for (const r of viste.serieAnnualeRegioni) {
    for (const a of r.anni) somma.set(a.anno, (somma.get(a.anno) ?? 0) + a.casi);
  }
  for (const s of viste.serieAnnuale) {
    assert.equal(somma.get(s.anno), s.casi, `anno ${s.anno}`);
  }
});

test("viste: copertura completa di 20 regioni e totale record coerente", () => {
  assert.equal(viste.coverage.regioni, 20);
  assert.equal(viste.serieAnnualeRegioni.length, 20);
  const totale = viste.serieAnnuale.reduce((acc, s) => acc + s.casi, 0);
  assert.equal(totale, viste.coverage.casi);
});

test("temporale: lavoro + itinere = totale, per ogni anno", () => {
  for (const r of temporale.serieAnnuale) {
    assert.equal(r.lavoro + r.itinere, r.totale, `anno ${r.anno} regione ${r.regione}`);
  }
});

test("multidimensionale: ogni ripartizione somma al totale dell'anno", () => {
  for (const anno of multidim.anniDisponibili) {
    const a = multidim.perAnno[anno];
    const somme = {
      regioni: a.regioni.reduce((x, r) => x + r.totale, 0),
      ateco: a.atecoMacro.reduce((x, s) => x + s.casi, 0),
      generi: Object.values(a.generi).reduce((x, v) => x + v, 0),
      fasceEta: Object.values(a.fasceEta).reduce((x, v) => x + v, 0),
      mensile: Object.values(a.mensile).reduce((x, v) => x + v, 0),
    };
    for (const [nome, valore] of Object.entries(somme)) {
      assert.equal(valore, a.totale, `${anno} ${nome}`);
    }
  }
});

test("multidimensionale: gli occupati per regione coincidono con il denominatore", () => {
  for (const anno of multidim.anniDisponibili) {
    for (const r of multidim.perAnno[anno].regioni) {
      const rif = occupati.regioni[r.regione]?.[anno];
      if (rif == null) continue;
      assert.ok(
        Math.abs(r.occupati - rif * 1000) < 1500,
        `${anno} regione ${r.regione}: ${r.occupati} vs ${rif * 1000}`
      );
    }
  }
});

test("decennale: 2014-2025 senza buchi e indice coerente con casi/occupati", () => {
  assert.equal(decennale.serie.length, 12);
  assert.equal(decennale.serie[0].anno, 2014);
  assert.equal(decennale.serie.at(-1).anno, 2025);
  for (const s of decennale.serie) {
    assert.ok(s.totale > 0, `anno ${s.anno}`);
    const atteso = (s.totale / s.occupati) * 1000;
    assert.ok(Math.abs(atteso - s.indice) < 0.02, `indice ${s.anno}`);
  }
});

test("decennale: dal 2021 i casi coincidono con la serie consolidata", () => {
  const daViste = new Map(viste.serieAnnuale.map((s) => [s.anno, s.casi]));
  for (const s of decennale.serie) {
    if (s.anno < 2021) continue;
    assert.equal(s.totale, daViste.get(s.anno), `anno ${s.anno}`);
  }
});

test("congiunturale: i mesi 1-9 sommati danno il totale nazionale", () => {
  const n = congiunturale.nazionale;
  const tot25 = congiunturale.perMese.reduce((x, m) => x + m.tot2025, 0);
  const tot26 = congiunturale.perMese.reduce((x, m) => x + m.tot2026, 0);
  assert.equal(tot25, n.totale.anno2025);
  assert.equal(tot26, n.totale.anno2026);
  for (const m of congiunturale.perMese) {
    assert.equal(m.lav2025 + m.iti2025, m.tot2025, `2025 mese ${m.mese}`);
    assert.equal(m.lav2026 + m.iti2026, m.tot2026, `2026 mese ${m.mese}`);
  }
});

test("congiunturale: copertura completa delle 20 regioni", () => {
  assert.equal(Object.keys(congiunturale.perRegione).length, 20);
});

test("malattie: le quote delle categorie sommano ai casi del periodo", () => {
  const casi = malattie.categorie.reduce((x, c) => x + c.casi, 0);
  assert.equal(casi, malattie.nazionale.totale);
  const sommaQuote = malattie.categorie.reduce((x, c) => x + c.quota, 0);
  assert.ok(Math.abs(sommaQuote - 100) < 0.5, `quote: ${sommaQuote}`);
});

test("malattie: anno2025 + anno2026 delle categorie = casi totali", () => {
  for (const c of malattie.categorie) {
    assert.equal(c.anno2025 + c.anno2026, c.casi, c.key);
  }
});

test("esiti: riconosciute + rigettate + in istruttoria = denunce, per anno", () => {
  // Per gli anni passati il dataset espone solo il conteggio ricostruito dalle
  // tre componenti; il 2025 ha anche il campo `denunce` esplicito, che deve
  // coincidere con la somma e con il valore della Relazione annuale INAIL.
  const attese = { 2021: 55198, 2022: 60623, 2023: 72575, 2024: 88338, 2025: 98312 };
  for (const a of esiti.denuncePerAnno) {
    const somma = a.riconosciute + a.rigettate + a.inIstruttoria;
    assert.equal(somma, attese[Number(a.anno)], `anno ${a.anno}`);
    if (a.denunce !== undefined) assert.equal(a.denunce, somma, `campo denunce ${a.anno}`);
  }
  const a2025 = esiti["2025"];
  assert.equal(a2025.riconosciute + a2025.rigettate + a2025.inIstruttoria, a2025.denunce);
  // Il totale annuale 2025 (98.312) viene dalle definizioni di istruttoria, non
  // dai protocolli mensili del dataset malattie (che coprono gen-set). Sono due
  // fonti diverse dello stesso fenomeno: qui si verifica solo che il 2025 sia
  // coerente internamente, non che coincida con la finestra congiunturale.
});

test("Infor.MO: quota calcolata su perimetro omogeneo, non su perimetri diversi", () => {
  assert.equal(informo.casiPeriodo, informo.serie.filter((s) => s.anno >= 2014).reduce((x, s) => x + s.casiAnalizzati, 0));
  const totNaz = informo.serie.filter((s) => s.anno >= 2014).reduce((x, s) => x + (s.mortaliNazionali ?? 0), 0);
  assert.equal(informo.totaleMortaliNazionali, totNaz);
  assert.ok(Math.abs(informo.quotaPeriodo - (informo.casiPeriodo / informo.totaleMortaliNazionali) * 100) < 0.1);
});

test("cronaca: nessun articolo duplicato per link e nessun evento estero isolato", () => {
  const links = news.notizie.map((n) => n.link);
  assert.equal(new Set(links).size, links.length, "link duplicati");
  const ids = news.notizie.map((n) => n.eventGroupId);
  assert.equal(new Set(ids).size, ids.length, "eventGroupId duplicati");
  // Un evento estero è ammesso solo se il titolo contiene anche un luogo
  // italiano (lavoratore italiano all'estero, contesto italiano).
  for (const n of news.notizie) {
    // Confini di parola obbligatori: senza, "cascina" matcherebbe "Cina".
    const estero = /\b(Turchia|Belgio|Austria|Cina|India|Brasile|Germania)\b/i.test(n.titolo);
    assert.ok(!estero || n.provincia || n.regione, `evento estero senza luogo italiano: ${n.titolo}`);
  }
});

test("cronaca: la copertura dichiarata corrisponde alle date presenti", () => {
  const date = news.notizie.map((n) => Date.parse(n.data)).filter((t) => !Number.isNaN(t));
  const giorni = Math.floor((Math.max(...date) - Math.min(...date)) / 86_400_000) + 1;
  assert.ok(Math.abs(giorni - news.copertura.giorni) <= 1, `${giorni} vs ${news.copertura.giorni}`);
});
