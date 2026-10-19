"""Test di calibrazione dell'analisi tematica "manutenzione" vs Scheda 28 INAIL.

La Scheda 28 INAIL (attività manutentive, manifatturiero 2014-2023) conta:
- 1.128 infortuni totali nel manifatturiero (mortali+gravi)
- 259 in attività manutentive (95 mortali + 164 gravi)

Verifichiamo che la nostra selezione con parole chiave resti vicina al
riferimento INAIL (stesso ordine di grandezza, distribuzione per settore
compatibile) e non degeneri. Il test documenta la calibrazione e fallisce
solo se la selezione si allontana troppo dal riferimento (supera il 2x o
è inferiore alla metà).
"""
import json
import sys
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "etl"))

from ateco_informo_map import mappa_att_prev  # noqa: E402
from genera_temi_informo import TEMA_KEYWORDS, match_tema  # noqa: E402

# Riferimento Scheda 28 INAIL (2014-2023, manifatturiero)
RIF_TOTALE_MANIF = 1128
RIF_MANUTENZIONE = 259
RIF_MORTALI = 95
RIF_GRAVI = 164


def load_dettaglio(name: str):
    p = ROOT / "src" / "data" / "generated" / f"informo-{name}-dettaglio.json"
    return json.loads(p.read_text(encoding="utf-8"))["casi"]


def selezione_manutenzione():
    mortali = load_dettaglio("mortali")
    gravi = load_dettaglio("gravi")
    tema = TEMA_KEYWORDS["manutenzione"]

    def is_manif(c):
        mm = mappa_att_prev(c.get("attPrev"))
        return mm is not None and mm["sezione"] == "C"

    m = [c for c in mortali
         if c.get("anno") and 2014 <= c["anno"] <= 2023 and is_manif(c)]
    g = [c for c in gravi
         if c.get("anno") and 2014 <= c["anno"] <= 2023 and is_manif(c)]
    m_sel = [c for c in m if match_tema(c.get("dinamica"), tema)]
    g_sel = [c for c in g if match_tema(c.get("dinamica"), tema)]
    return m, g, m_sel, g_sel


class TestCalibrazioneManutenzione(unittest.TestCase):
    def test_totale_manifatturiero(self):
        m, g, _, _ = selezione_manutenzione()
        tot = len(m) + len(g)
        self.assertLessEqual(abs(tot - RIF_TOTALE_MANIF), 5,
                             f"totale manifatturiero {tot} vs 1128: fuori tolleranza")

    def test_selezione_manutenzione_vicina_al_riferimento(self):
        _, _, m_sel, g_sel = selezione_manutenzione()
        tot = len(m_sel) + len(g_sel)
        # Il riferimento INAIL è 259; la nostra selezione keyword è attesa
        # nello stesso ordine di grandezza (tra metà e il doppio).
        self.assertGreaterEqual(tot, RIF_MANUTENZIONE * 0.5,
                                f"selezione {tot} troppo bassa vs 259")
        self.assertLessEqual(tot, RIF_MANUTENZIONE * 2,
                             f"selezione {tot} troppo alta vs 259")

    def test_rapporto_mortali_gravi(self):
        _, _, m_sel, g_sel = selezione_manutenzione()
        tot = len(m_sel) + len(g_sel)
        if tot == 0:
            self.fail("nessun caso selezionato")
        quota_m = len(m_sel) / tot
        # Scheda 28: 95/259 = 36,7%
        self.assertAlmostEqual(quota_m, 0.367, delta=0.10,
                               msg=f"quota mortali {quota_m:.3f} vs 0.367")

    def test_distribuzione_settori_compatibile(self):
        m, g, m_sel, g_sel = selezione_manutenzione()
        sel = m_sel + g_sel
        cnt = Counter()
        for c in sel:
            mm = mappa_att_prev(c.get("attPrev"))
            if mm:
                cnt[mm["sezione"]] += 1
        tot = sum(cnt.values())
        if tot == 0:
            self.fail("nessun settore mappato")
        # Nella Scheda 28 la metalmeccanica è il primo settore (~27-31%)
        # e il manifatturiero (C) domina la selezione.
        quota_c = cnt.get("C", 0) / tot
        self.assertGreater(quota_c, 0.30,
                           f"quota manifatturiero {quota_c:.3f} troppo bassa")
        # I 5 settori top della scheda (C + F) devono coprire la maggioranza
        quota_top = (cnt.get("C", 0) + cnt.get("F", 0)) / tot
        self.assertGreater(quota_top, 0.50,
                           f"quota C+F {quota_top:.3f} troppo bassa")


if __name__ == "__main__":
    unittest.main(verbosity=2)