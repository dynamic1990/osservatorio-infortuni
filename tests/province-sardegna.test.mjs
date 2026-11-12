// Test della mappatura dei codici provinciali sardi.
//
// La mappatura serve a un solo scopo: permettere un confronto per territorio
// tra i due archivi INAIL. Questi test verificano che il territorio sia
// ricomposto esattamente (nessun comune perso, nessuno duplicato) e che i
// contenitori dichiarati "confrontabili" lo siano davvero.
//
// Usa il modulo puro `province-sardegna-core.ts` e legge l'artefatto con
// readFileSync, come gli altri test del repo: node non risolve l'alias `@/`
// né gli import JSON senza attributo.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  nuoveDaVecchio,
  vecchieDaNuovo,
  nomeProvinciaSarda,
  areaDaCodice,
  provinceStoricheConfrontabili,
} from "../src/lib/province-sardegna-core.ts";

const m = JSON.parse(
  readFileSync(
    new URL("../src/data/generated/province-sardegna-mappatura.json", import.meta.url),
    "utf8",
  ),
);

test("mappatura: i comuni sono tutti e soli quelli dell'elenco ISTAT", () => {
  assert.equal(m.comuni.length, 377);
  assert.equal(m.coverage.comuni, 377);
  assert.equal(m.comuni.length, m.coverage.comuni);
});

test("mappatura: ogni comune ha un codice univoco e una provincia valida", () => {
  const codici = new Set();
  const province = new Set(m.province.nuove.map((p) => p.codice));
  for (const c of m.comuni) {
    assert.ok(c.codiceComune, `comune senza codice: ${JSON.stringify(c)}`);
    assert.ok(!codici.has(c.codiceComune), `codice duplicato: ${c.codiceComune}`);
    codici.add(c.codiceComune);
    assert.ok(province.has(c.provincia), `provincia sconosciuta: ${c.provincia} (${c.nome})`);
  }
  assert.equal(codici.size, 377);
});

test("mappatura: la somma dei comuni per provincia è il totale", () => {
  const somma = m.province.nuove.reduce((acc, p) => acc + p.comuni, 0);
  assert.equal(somma, 377);
});

test("mappatura: i comuni per vecchia provincia coprono tutti i comuni", () => {
  const somma = m.province.precedenti.reduce((acc, p) => acc + p.comuni, 0);
  assert.equal(somma, 377);
});

test("mappatura: ogni provincia nuova ha almeno una provincia di origine", () => {
  for (const p of m.province.nuove) {
    assert.ok(p.provincePrecedenti.length > 0, `${p.nome} senza origine`);
  }
});

test("mappatura: le otto province nuove sono quelle del riordino 2026", () => {
  const codici = m.province.nuove.map((p) => p.codice).sort();
  assert.deepEqual(codici, ["112", "113", "114", "115", "116", "117", "118", "119"]);
});

test("mappatura: i cinque codici precedenti sono quelli usati da INAIL", () => {
  const codici = m.province.precedenti.map((p) => p.codice).sort();
  assert.deepEqual(codici, ["090", "091", "092", "095", "111"]);
});

test("mappatura: Cagliari è 092 nei dati INAIL, 312/318 sono codici ente", () => {
  // L'ISTAT riporta 292 e 318 per la città metropolitana; INAIL usa 092 e 118.
  // I codici ente restano disponibili come metadato, non come chiave nei dati.
  assert.ok(!m.comuni.some((c) => c.provinciaPrecedente === "292"));
  assert.ok(!m.comuni.some((c) => c.provincia === "318" || c.provincia === "312"));
  const cagliari = m.province.nuove.find((p) => p.codice === "118");
  assert.ok(cagliari);
  assert.equal(cagliari.codiceEnte, "318");
  const sassari = m.province.nuove.find((p) => p.codice === "112");
  assert.ok(sassari);
  assert.equal(sassari.codiceEnte, "312");
});

test("mappatura: la corrispondenza vecchio/nuovo è bidirezionale e coerente", () => {
  for (const [vecchio, nuovi] of Object.entries(m.mappatura.vecchioVersoNuovo)) {
    for (const nuovo of nuovi) {
      assert.ok(
        m.mappatura.nuovoVersoVecchio[nuovo]?.includes(vecchio),
        `${vecchio} -> ${nuovo} non ha il ritorno`,
      );
    }
  }
  for (const [nuovo, vecchi] of Object.entries(m.mappatura.nuovoVersoVecchio)) {
    for (const vecchio of vecchi) {
      assert.ok(
        m.mappatura.vecchioVersoNuovo[vecchio]?.includes(nuovo),
        `${nuovo} <- ${vecchio} non ha l'andata`,
      );
    }
  }
});

test("mappatura: le aree di confronto coprono tutti i codici dei due archivi", () => {
  const coperti = new Set();
  for (const a of m.confronto.aree) {
    for (const c of a.vecchi) coperti.add(c);
    for (const c of a.nuovi) coperti.add(c);
  }
  const attesi = [
    ...m.province.nuove.map((p) => p.codice),
    ...m.province.precedenti.map((p) => p.codice),
  ];
  for (const c of attesi) {
    assert.ok(coperti.has(c), `codice ${c} non è in nessuna area di confronto`);
  }
});

test("mappatura: le aree conservano il totale comuni, con i due trasferimenti noti", () => {
  // Le aree sono il livello pensato per il confronto: se il conteggio dei
  // comuni non torna, il confronto nel tempo non è lecito. Solo due comuni
  // cambiano area, e vanno in una direzione sola: Seui e Seulo passano dal
  // Sud Sardegna al Nuorese.
  const perArea = new Map();
  for (const c of m.comuni) {
    for (const a of m.confronto.aree) {
      if (a.nuovi.includes(c.provincia)) {
        const v = perArea.get(a.id) ?? { nuovi: 0, vecchi: 0 };
        v.nuovi += 1;
        perArea.set(a.id, v);
      }
      if (c.provinciaPrecedente && a.vecchi.includes(c.provinciaPrecedente)) {
        const v = perArea.get(a.id) ?? { nuovi: 0, vecchi: 0 };
        v.vecchi += 1;
        perArea.set(a.id, v);
      }
    }
  }

  const delta = (id) => {
    const v = perArea.get(id);
    assert.ok(v, `area senza comuni: ${id}`);
    return v.nuovi - v.vecchi;
  };

  // Sassari e Oristano non cambiano territorio: stessi comuni, codice diverso.
  assert.equal(delta("sassari"), 0, "Sassari non deve cambiare territorio");
  assert.equal(delta("oristano"), 0, "Oristano non deve cambiare territorio");

  // I due comuni che cambiano area: escono da Cagliari-Sud, entrano in Nuoro.
  assert.equal(delta("nuoro"), 2, "Nuoro deve guadagnare 2 comuni");
  assert.equal(delta("cagliari-sud"), -2, "Cagliari-Sud deve perdere 2 comuni");

  // Il totale non si muove: nessun comune duplicato o perso.
  const totVecchi = [...perArea.values()].reduce((acc, v) => acc + v.vecchi, 0);
  const totNuovi = [...perArea.values()].reduce((acc, v) => acc + v.nuovi, 0);
  assert.equal(totVecchi, 377);
  assert.equal(totNuovi, 377);
});

test("mappatura: Sassari e Oristano sono confrontabili nel tempo", () => {
  const nomi = provinceStoricheConfrontabili(m).map((p) => p.nome).sort();
  assert.deepEqual(nomi, ["Oristano", "Sassari"]);
});

test("mappatura: il Sud Sardegna dichiara di non essere confrontabile", () => {
  const sud = m.confronto.provinceStoriche.find((p) => p.codice === "111");
  assert.ok(sud);
  assert.equal(sud.confrontabileNelTempo, false);
  assert.equal(sud.comuniStorici, 107);
  assert.ok(sud.comuniAcquisiti < 0, "il contenitore nuovo è più piccolo dell'originale");
});

test("mappatura: lookup e nomi funzionano su entrambi gli archivi", () => {
  assert.deepEqual(nuoveDaVecchio(m, "090"), ["112", "113"]);
  assert.deepEqual(vecchieDaNuovo(m, "118"), ["092", "111"]);
  assert.deepEqual(nuoveDaVecchio(m, "999"), []);
  assert.equal(nomeProvinciaSarda(m, "112"), "Città metropolitana di Sassari");
  assert.equal(nomeProvinciaSarda(m, "111"), "Provincia del Sud Sardegna");
  assert.equal(nomeProvinciaSarda(m, "999"), "999");
});

test("mappatura: le aree si risolvono da un codice di qualunque periodo", () => {
  assert.equal(areaDaCodice(m, "090")?.id, "sassari");
  assert.equal(areaDaCodice(m, "113")?.id, "sassari");
  assert.equal(areaDaCodice(m, "092")?.id, "cagliari-sud");
  assert.equal(areaDaCodice(m, "119")?.id, "cagliari-sud");
  assert.equal(areaDaCodice(m, "056"), null, "Roma non è in Sardegna");
});

test("mappatura: la fonte è dichiarata e datata", () => {
  assert.equal(m.source.owner, "ISTAT");
  assert.equal(m.source.licenza, "CC BY 4.0");
  assert.match(m.source.notaNormativa, /36\/34/);
  assert.ok(m.limiti.length >= 5, "servono i limiti espliciti");
  assert.ok(m.limiti.some((l) => /non espone il comune|non espongono il comune/i.test(l)));
});

test("mappatura: la verifica incrociata sui due archivi è registrata", () => {
  const v = m.verifica;
  if (!v || !v.eseguita) return; // artefatto rigenerato senza i file grandi
  // Il semestrale copre 12 mesi, il mensile 9: atteso circa 0,75.
  assert.ok(v.rapporto > 0.7 && v.rapporto < 0.8, `rapporto inatteso: ${v.rapporto}`);
});
