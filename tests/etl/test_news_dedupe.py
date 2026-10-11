"""Test della deduplicazione eventi dell'ETL notizie infortuni.

Verifica la regola d'oro della cronaca: lo stesso infortunio raccontato da
più testate deve produrre UN solo evento nei KPI, mentre eventi diversi
(anche nella stessa regione o nello stesso giorno) devono restare distinti.
Senza rete: usa solo le funzioni pure del modulo.
"""

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "etl"))
import aggiorna_news_infortuni as etl  # noqa: E402


def item(titolo, data="2026-10-10 08:00:00 +0000", fonte="Testata", tipo="evento", **kw):
    base = {
        "titolo": titolo,
        "fonte": fonte,
        "link": f"https://example.com/{abs(hash(titolo + fonte)):012x}",
        "data": data,
        "categoria": "mortale" if any(k in titolo.lower() for k in ("mort", "muore", "decedut")) else "grave",
        "tipo": tipo,
        "workAccidentScore": 80,
    }
    base.update(kw)
    return base


class TestVictimKeys(unittest.TestCase):
    def test_victim_names(self):
        a = item("Caivano, Salvatore Calignano è morto dopo una caduta da un capannone")
        b = item("Salvatore Calignano, morto sul lavoro a Caivano")
        self.assertTrue(etl.victim_names(a) & etl.victim_names(b))

    def test_victim_age(self):
        a = item("Operaio di 52 anni muore schiacciato a Caivano")
        b = item("Caivano, muore un 52enne schiacciato dal muro")
        self.assertEqual(etl.victim_age(a["titolo"]) & etl.victim_age(b["titolo"]), {52})

    def test_eta_fuori_range_scartata(self):
        self.assertEqual(etl.victim_age("Operaio di 0 anni"), set())
        self.assertEqual(etl.victim_age("Operaio di 200 anni"), set())


class TestSameEvent(unittest.TestCase):
    def test_stesso_nome_vittima(self):
        a = item("Caivano, Salvatore Calignano è morto dopo una caduta da un capannone", data="2026-10-10 08:00:00 +0000")
        b = item("Salvatore Calignano, morto sul lavoro a Caivano: arresti domiciliari", data="2026-10-11 09:00:00 +0000")
        self.assertTrue(etl.is_same_event(a, b))

    def test_stessa_eta_e_luogo(self):
        a = item("Operaio di 52 anni muore schiacciato a Caivano", data="2026-10-10 08:00:00 +0000")
        b = item("Caivano, muore un 52enne schiacciato dal muro", data="2026-10-10 14:00:00 +0000")
        self.assertTrue(etl.is_same_event(a, b))

    def test_parafrasi_stesso_luogo(self):
        a = item("Muore operaio schiacciato a Caivano", data="2026-10-10 10:00:00 +0000")
        b = item("Caivano, operaio schiacciato dal muro: muore in ospedale", data="2026-10-10 16:00:00 +0000")
        self.assertTrue(etl.is_same_event(a, b))

    def test_zevio_e_faenza_restano_distinti(self):
        # Regressione: due eventi con dinamica simile in comuni diversi
        # (stessa regione) NON devono accorparsi.
        z = item("Tragedia sul lavoro a Zevio, muore schiacciato da macchinario", data="2026-10-08 08:00:00 +0000")
        f = item("Operaio morto a 43 anni schiacciato dal carico di una gru a Faenza", data="2026-10-08 10:00:00 +0000")
        self.assertFalse(etl.is_same_event(z, f))

    def test_metropoli_non_accorpa_senza_ancora(self):
        # Due eventi diversi a Roma nello stesso giorno NON sono lo stesso
        # fatto: senza aggancio forte (nome, età, dinamica rara) restano separati.
        a = item("Operaio morto a Roma in un cantiere", data="2026-10-10 08:00:00 +0000")
        b = item("Tragedia sul lavoro a Roma: operaio travolto da un mezzo", data="2026-10-10 09:00:00 +0000")
        self.assertFalse(etl.is_same_event(a, b))

    def test_report_non_si_mescola_con_evento(self):
        # Un bilancio di periodo non è la cronaca di un singolo fatto:
        # mescolarli farebbe sparire l'evento vero dai KPI.
        report = item("Emergenza sicurezza sul lavoro: a Roma e nel Lazio +8,1% di infortuni nel 2026", tipo="report")
        evento = item("Esplosione in un'officina a Roma: morto un operaio", tipo="evento")
        self.assertFalse(etl.is_same_event(report, evento))

    def test_dinamica_rara_stesso_luogo(self):
        a = item("Operaio morto alla Fincantieri di Ancona investito da una fiammata", data="2026-10-09 08:00:00 +0000")
        b = item("Ancona, esplosione nel cantiere navale: un operaio morto, gravi ustioni", data="2026-10-10 08:00:00 +0000")
        self.assertTrue(etl.is_same_event(a, b))


class TestDedupeEventi(unittest.TestCase):
    def test_gruppo_un_solo_capo(self):
        items = [
            item("Caivano, Salvatore Calignano è morto dopo una caduta da un capannone", data="2026-10-10 08:00:00 +0000"),
            item("Salvatore Calignano, morto sul lavoro a Caivano", data="2026-10-11 09:00:00 +0000"),
            item("Operaio morto a Caivano, arrestato il datore di lavoro", data="2026-10-11 12:00:00 +0000"),
        ]
        out = etl.dedupe_eventi(items)
        self.assertEqual(len(out), 1)
        self.assertEqual(len(out[0]["fonti"]), 2)

    def test_eventi_distinti_restano_distinti(self):
        items = [
            item("Operaio morto a Roma in un cantiere", data="2026-10-10 08:00:00 +0000"),
            item("Tragedia sul lavoro a Zevio, muore schiacciato da macchinario", data="2026-10-10 09:00:00 +0000"),
        ]
        out = etl.dedupe_eventi(items)
        self.assertEqual(len(out), 2)


if __name__ == "__main__":
    unittest.main()