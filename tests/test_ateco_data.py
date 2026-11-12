"""Test di struttura dei dati ATECO nel dataset multidimensionale.

Prima questo file era uno script con `assert` a livello di modulo e `print`:
non veniva eseguito da unittest (`discover` con pattern `test_*.py` lo importa
ma il risultato era sempre "0 test"), quindi non proteggeva da nulla.
"""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "src" / "data" / "generated" / "inail-multidimensionale.json"


class TestAtecoData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = json.loads(DATASET.read_text(encoding="utf-8"))
        cls.y24 = cls.m["perAnno"]["2024"]

    def test_macro_sezioni_complete(self):
        self.assertEqual(len(self.y24["atecoMacro"]), 22)
        chiavi = {s["key"] for s in self.y24["atecoMacro"]}
        self.assertIn("ND", chiavi)
        for sezione in ("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
                        "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"):
            self.assertIn(sezione, chiavi)

    def test_divisioni_hanno_nome_e_sezione(self):
        divs = self.y24["atecoDivisioni"]
        self.assertEqual(len(divs), 86)
        for d in divs:
            self.assertTrue(d["key"], d)
            self.assertTrue(d.get("nome"), d)
            self.assertTrue(d.get("sezione"), d)
            self.assertGreaterEqual(d["casi"], 0)

    def test_top_divisioni_presente(self):
        top = self.y24.get("atecoDivisioniTop")
        self.assertEqual(len(top), 20)

    def test_serie_per_divisione_copre_tutti_gli_anni(self):
        serie = self.m["atecoDivisioneSerie"]
        self.assertEqual(len(serie), 86)
        for divisione, anni in serie.items():
            self.assertEqual(set(anni), set(self.m["anniDisponibili"]), divisione)

    def test_lavoro_piu_itinere_uguale_casi(self):
        for d in self.y24["atecoDivisioni"]:
            self.assertEqual(d["lavoro"] + d["itinere"], d["casi"], d["key"])

    def test_macro_somma_al_totale_annuale(self):
        totale = sum(s["casi"] for s in self.y24["atecoMacro"])
        self.assertEqual(totale, self.y24["totale"])

    def test_mortali_macro_sommano_al_totale(self):
        totale = sum(s["mortali"] for s in self.y24["atecoMacro"])
        self.assertEqual(totale, self.y24["mortali"])

    def test_incidenza_coerente_con_casi_e_occupati(self):
        for s in self.y24["atecoMacro"]:
            if not s["occupati"]:
                self.assertEqual(s["indiceIncidenza"], 0.0, s["key"])
                continue
            atteso = s["casi"] / s["occupati"] * 1000
            self.assertAlmostEqual(s["indiceIncidenza"], atteso, delta=0.02, msg=s["key"])


if __name__ == "__main__":
    unittest.main()
