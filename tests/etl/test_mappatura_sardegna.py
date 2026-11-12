"""Test della mappatura dei codici provinciali sardi (senza rete).

La mappatura nasce da un unico rischio: che il passaggio dai vecchi codici
ai nuovi perda o duplichi comuni. Questi test verificano la ricomposizione
sul file ISTAT vero, letto dal raw layer.
"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "etl"))
import genera_mappatura_sardegna as etl  # noqa: E402

ZIP = ROOT / "data" / "raw" / "istat-mappatura-sardegna.zip"


@unittest.skipUnless(ZIP.exists(), "manca lo zip ISTAT nel raw layer")
class TestMappaturaSardegna(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.comuni = etl.leggi_comuni(ZIP)
        cls.artefatto = etl.costruisci(cls.comuni)

    def test_tutti_i_comuni_sardi(self):
        self.assertEqual(len(self.comuni), 377)

    def test_codici_comune_univoci(self):
        codici = [c["codiceComune"] for c in self.comuni]
        self.assertEqual(len(codici), len(set(codici)))

    def test_somma_per_provincia_nuova(self):
        somma = sum(p["comuni"] for p in self.artefatto["province"]["nuove"])
        self.assertEqual(somma, 377)

    def test_somma_per_provincia_precedente(self):
        somma = sum(p["comuni"] for p in self.artefatto["province"]["precedenti"])
        self.assertEqual(somma, 377)

    def test_codici_vecchi_normalizzati_su_inail(self):
        # Lo zip ISTAT usa 292 e 318 per Cagliari: nei dati INAIL sono 092 e 118.
        vecchi = {c["provinciaPrecedente"] for c in self.comuni}
        nuovi = {c["provincia"] for c in self.comuni}
        self.assertNotIn("292", vecchi)
        self.assertNotIn("318", nuovi)
        self.assertIn("092", vecchi)
        self.assertIn("118", nuovi)

    def test_codice_ente_preservato(self):
        # Il codice ISTAT dell'ente non va perso: serve per risalire alla fonte.
        cagliari = next(p for p in self.artefatto["province"]["nuove"] if p["codice"] == "118")
        self.assertEqual(cagliari["codiceEnte"], "318")
        sassari = next(p for p in self.artefatto["province"]["nuove"] if p["codice"] == "112")
        self.assertEqual(sassari["codiceEnte"], "312")

    def test_aree_conservano_il_territorio(self):
        # Solo Seui e Seulo cambiano area: dal Sud Sardegna al Nuorese.
        aree = {a["id"]: a for a in self.artefatto["confronto"]["aree"]}
        self.assertEqual(aree["sassari"]["comuniSpostati"], 0)
        self.assertEqual(aree["oristano"]["comuniSpostati"], 0)
        self.assertEqual(aree["nuoro"]["comuniSpostati"], 2)
        self.assertEqual(aree["cagliari-sud"]["comuniSpostati"], -2)
        totale = sum(a["comuniNuovi"] for a in aree.values())
        self.assertEqual(totale, 377)

    def test_province_storiche_confrontabili(self):
        storiche = {p["nome"]: p for p in self.artefatto["confronto"]["provinceStoriche"]}
        self.assertTrue(storiche["Sassari"]["confrontabileNelTempo"])
        self.assertTrue(storiche["Oristano"]["confrontabileNelTempo"])
        self.assertFalse(storiche["Sud Sardegna"]["confrontabileNelTempo"])
        self.assertEqual(storiche["Sud Sardegna"]["comuniStorici"], 107)
        self.assertEqual(storiche["Sud Sardegna"]["comuniFuoriusciti"], 55)

    def test_mappatura_bidirezionale(self):
        m = self.artefatto["mappatura"]
        for vecchio, nuovi in m["vecchioVersoNuovo"].items():
            for nuovo in nuovi:
                self.assertIn(vecchio, m["nuovoVersoVecchio"][nuovo])

    def test_fonte_dichiarata(self):
        src = self.artefatto["source"]
        self.assertEqual(src["owner"], "ISTAT")
        self.assertEqual(src["licenza"], "CC BY 4.0")
        self.assertIn("36/34", src["notaNormativa"])
        self.assertTrue(self.artefatto["limiti"])


class TestNormalizzazioneCodici(unittest.TestCase):
    def test_codice_inail_da_istat(self):
        self.assertEqual(etl.codice_inail("312"), "112")
        self.assertEqual(etl.codice_inail("318"), "118")
        self.assertEqual(etl.codice_inail("113"), "113")

    def test_codice_precedente_inail(self):
        self.assertEqual(etl.codice_precedente_inail("292"), "092")
        self.assertEqual(etl.codice_precedente_inail("090"), "090")


if __name__ == "__main__":
    unittest.main()
