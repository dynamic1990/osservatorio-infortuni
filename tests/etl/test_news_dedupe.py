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


class TestSintesi(unittest.TestCase):
    """Sintesi breve 'cosa è successo' estratta dal titolo."""

    def test_caduta_con_esito_mortale(self):
        self.assertEqual(
            etl.estrai_sintesi("Caivano, Salvatore Calignano è morto dopo una caduta da un capannone"),
            "Caduto dall'alto, vittima deceduta",
        )

    def test_folgorazione_senza_esito(self):
        self.assertEqual(
            etl.estrai_sintesi("Operaio folgorato a Milano in cantiere"),
            "Folgorato da corrente elettrica",
        )

    def test_schiacciamento_con_esito_mortale(self):
        self.assertEqual(
            etl.estrai_sintesi("L'escavatore si ribalta e lo travolge: muore schiacciato in azienda"),
            "Schiacciato da un carico/macchinario, vittima deceduta",
        )

    def test_fuoco_con_esito_mortale(self):
        self.assertEqual(
            etl.estrai_sintesi("Esplosione in un'officina a Roma: morto un operaio, indagini in corso"),
            "Colpito da fuoco/esplosione, vittima deceduta",
        )

    def test_investimento(self):
        self.assertEqual(
            etl.estrai_sintesi("Bracciante investito in bicicletta sulla strada per il lavoro"),
            "Investito da un veicolo/mezzo",
        )

    def test_malore_con_esito_mortale(self):
        self.assertEqual(
            etl.estrai_sintesi("Operaio colto da malore in cantiere, muore in ospedale"),
            "Colto da malore, vittima deceduta",
        )

    def test_followup_arresto_non_descrive_dinamica(self):
        # Il titolo riporta la frase del datore, non la dinamica reale
        self.assertEqual(
            etl.estrai_sintesi("Morte Salvatore Calignano, datore di lavoro agli arresti: \"Di' che ti hanno investito\""),
            "Infortunio con vittima deceduta",
        )

    def test_titolo_generico(self):
        self.assertEqual(
            etl.estrai_sintesi("Incidente sul lavoro a Treviso, operaio grave in ospedale"),
            "Infortunio con conseguenze gravi",
        )

    def test_trauma_fisico(self):
        self.assertEqual(
            etl.estrai_sintesi("Infortunio sul lavoro a Castelfiorentino, grave trauma ad una mano"),
            "Trauma/lesione fisica",
        )


class TestClassifyTipo(unittest.TestCase):
    """Riconoscimento report/bilanci di periodo (quadri statistici)."""

    def test_titolo_rete8_classificato_report(self):
        titolo = "Lavoro Abruzzo: meno morti ma più infortuni. Terza regione in Italia per malattie professionali"
        self.assertEqual(etl.classify_tipo(titolo, "Rete8"), "report")

    def test_bilancio_numeri_periodo_report(self):
        # "18 morti ... in un anno", "15 morti in sette mesi": quadro statistico,
        # non cronaca di un singolo fatto imminente.
        self.assertEqual(
            etl.classify_tipo("A Bari e provincia il lavoro fa ancora paura: 18 morti e oltre 10mila infortuni in un anno", "Borderline24.com"),
            "report",
        )
        self.assertEqual(
            etl.classify_tipo("Un infortunio ogni mezz'ora e 15 morti sul lavoro in sette mesi", "Corriere Brescia"),
            "report",
        )

    def test_esplosione_evento_non_report(self):
        self.assertEqual(
            etl.classify_tipo("Esplosione in un'officina a Roma: morto un operaio, indagini in corso"),
            "evento",
        )


class TestClassifyCategoria(unittest.TestCase):
    """Categoria pubblica: NATURA del fatto (mortale/grave), stabile nel tempo.

    Il tag non cambia quando l'articolo invecchia: un evento mortale resta
    mortale anche oltre le 48 ore. Solo i report di periodo (tipo != 'evento')
    sono 'analisi'. L'imminenza (48 ore) è un flag separato."""

    def test_evento_mortale_sempre_mortale(self):
        # Anche "vecchio": la categoria è la natura del fatto, non l'età.
        self.assertEqual(etl.classify_categoria("Operaio muore schiacciato in cantiere", "evento"), "mortale")

    def test_evento_grave_sempre_grave(self):
        self.assertEqual(etl.classify_categoria("Operaio grave dopo caduta da impalcatura", "evento"), "grave")

    def test_amputazione_resta_grave(self):
        # Amputazione (zazoom 09/10): oltre le 48 ore ma il fatto
        # resta grave (amputazione). Categoria stabile, imminenza separata.
        self.assertEqual(
            etl.classify_categoria("Grave incidente sul lavoro giovane operaio ferito a una mano, amputate le falangi di tre dita", "evento"),
            "grave",
        )

    def test_report_sempre_analisi(self):
        self.assertEqual(
            etl.classify_categoria("Lavoro Abruzzo: meno morti ma più infortuni", "report"),
            "analisi",
        )

    def test_followup_giudiziario_mantiene_tag_del_fatto(self):
        # Il follow-up del processo non racconta l'evento imminente, ma il
        # fatto resta mortale: la categoria non cambia, lo dirà il flag.
        cat = etl.classify_categoria(
            "In otto rischiano il processo per l'operaio morto folgorato sul cantiere della Regionale 8",
            "evento",
        )
        self.assertEqual(cat, "mortale")


class TestIsImminente(unittest.TestCase):
    """Flag 'imminente': articolo che racconta il fatto appena accaduto (<=48h).

    Le 48h separano la cronaca del fatto dagli approfondimenti sul medesimo
    evento, pubblicati a distanza di giorni o settimane."""

    H = 3600

    def _data(self, ore_fa):
        from datetime import timedelta
        ref = datetime.now(timezone.utc) - timedelta(hours=ore_fa)
        return ref.strftime("%a, %d %b %Y %H:%M:%S GMT")

    def test_fresco_imminente(self):
        self.assertTrue(etl.is_imminente(self._data(2)))

    def test_oltre_48h_non_imminente(self):
        self.assertFalse(etl.is_imminente(self._data(72)))

    def test_followup_giudiziario_mai_imminente(self):
        # Anche se pubblicato oggi, un "rischiano il processo" è un
        # approfondimento sulle conseguenze, non il racconto del fatto.
        self.assertFalse(etl.is_imminente(self._data(2), "In otto rischiano il processo per l'operaio morto folgorato"))

    def test_amputazione_oltre_48h_non_imminente(self):
        # La notizia del 09/10 (più di 48h fa): il fatto resta grave, ma non
        # è più cronaca imminente.
        self.assertFalse(
            etl.is_imminente(self._data(120), "Grave incidente sul lavoro giovane operaio ferito a una mano, amputate le falangi di tre dita")
        )

    def test_indagini_con_dinamica_restano_imminenti(self):
        # "Esplosione ... morto un operaio, indagini in corso" racconta
        # l'evento (ha la dinamica), non è un follow-up: resta imminente
        # se pubblicato entro 48h.
        self.assertTrue(etl.is_imminente(self._data(4), "Esplosione in un'officina a Roma: morto un operaio, indagini in corso"))


if __name__ == "__main__":
    unittest.main()