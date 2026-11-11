"""Test dell'ETL infortuni INAIL (senza rete: fixture locali).

Dal 2026-11-11 l'ETL legge i CSV mensili regionali invece dell'API REST:
i CSV coprono tutte e 20 le regioni, mentre l'API rifiuta i nomi con il
trattino (Emilia-Romagna, Trentino-Alto Adige, Friuli-Venezia Giulia).
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "etl"))
import inail_infortuni_snapshot as etl  # noqa: E402


def record_valido(**override):
    base = {
        "DataRilevazione": "30/06/2025", "LuogoNascita": "ITAL", "Regione": "12",
        "Genere": "M", "Gestione": "I", "IdentificativoCaso": "1",
        "DataProtocollo": "23/01/2025", "DataAccadimento": "21/01/2025",
        "DataMorte": None, "LuogoAccadimento": "058", "IdentificativoInfortunato": "1",
        "Eta": "35", "ModalitaAccadimento": "S", "ConSenzaMezzoTrasporto": "N",
        "IdentificativoDatoreLavoro": "1", "PosizioneAssicurativaTerritoriale": "1",
        "SettoreAttivitaEconomica": "F 41", "GestioneTariffaria": "1",
        "GrandeGruppoTariffario": "3",
    }
    base.update(override)
    return base


class TestValidaRecord(unittest.TestCase):
    def test_record_valido(self):
        etl.valida_record(record_valido())  # non deve sollevare

    def test_campo_mancante(self):
        with self.assertRaises(etl.StructuralError):
            etl.valida_record({"Genere": "M", "Eta": "30", "LuogoAccadimento": "058"})

    def test_genere_invalido(self):
        with self.assertRaises(etl.StructuralError):
            etl.valida_record(record_valido(Genere="X"))

    def test_eta_non_numerica(self):
        with self.assertRaises(etl.StructuralError):
            etl.valida_record(record_valido(Eta="abc"))

    def test_eta_meno_uno_ammessa(self):
        etl.valida_record(record_valido(Eta="-1"))  # età sconosciuta, come da fonte

    def test_modalita_invalida(self):
        with self.assertRaises(etl.StructuralError):
            etl.valida_record(record_valido(ModalitaAccadimento="X"))

    def test_luogo_non_numerico(self):
        with self.assertRaises(etl.StructuralError):
            etl.valida_record(record_valido(LuogoAccadimento="ZZZ"))


class TestDate(unittest.TestCase):
    def test_data_iso(self):
        self.assertEqual(etl.data_iso(record_valido(), "DataAccadimento"), "2025-01-21")

    def test_data_assente(self):
        self.assertIsNone(etl.data_iso(record_valido(DataMorte=None), "DataMorte"))

    def test_data_malformata(self):
        self.assertIsNone(etl.data_iso(record_valido(DataMorte=""), "DataMorte"))


class TestAggrega(unittest.TestCase):
    def test_aggregazione_conteggia(self):
        records = [
            record_valido(IdentificativoCaso="1"),
            record_valido(IdentificativoCaso="2"),
            record_valido(Genere="F", IdentificativoCaso="3"),
        ]
        rows, _ = etl.aggrega(records, "12", 2025, 2026, 9)
        self.assertEqual(len(rows), 2)  # due combinazioni (M x2, F x1)
        by_genere = {r["genere"]: r["casi"] for r in rows}
        self.assertEqual(by_genere, {"M": 2, "F": 1})

    def test_esito_mortale_e_dimensione(self):
        """L'esito mortale separa gli aggregati: la mortalità è leggibile per regione."""
        records = [
            record_valido(IdentificativoCaso="1"),
            record_valido(IdentificativoCaso="2", DataMorte="25/01/2025"),
        ]
        rows, _ = etl.aggrega(records, "12", 2025, 2026, 9)
        self.assertEqual(len(rows), 2)
        mortali = [r for r in rows if r["esitoMortale"]]
        self.assertEqual(len(mortali), 1)
        self.assertEqual(mortali[0]["casi"], 1)
        non_mortali = [r for r in rows if not r["esitoMortale"]]
        self.assertEqual(non_mortali[0]["casi"], 1)

    def test_record_fuori_finestra_esclusi(self):
        """I mesi oltre --mese-a non entrano: la vintage non li contiene."""
        records = [
            record_valido(IdentificativoCaso="1", DataAccadimento="21/01/2025"),
            record_valido(IdentificativoCaso="2", DataAccadimento="15/10/2025"),
        ]
        rows, extra = etl.aggrega(records, "12", 2025, 2026, 9)
        self.assertEqual(sum(r["casi"] for r in rows), 1)
        self.assertEqual(extra["fuoriFinestra"], 1)

    def test_anno_fuori_finestra_escluso(self):
        records = [record_valido(IdentificativoCaso="1", DataAccadimento="21/01/2024")]
        rows, extra = etl.aggrega(records, "12", 2025, 2026, 9)
        self.assertEqual(rows, [])
        self.assertEqual(extra["fuoriFinestra"], 1)

    def test_rilevazione_tracciata_per_anno(self):
        """Ogni anno di accadimento porta la propria rilevazione: serve al vintage."""
        records = [
            record_valido(IdentificativoCaso="1", DataAccadimento="21/01/2025", DataRilevazione="30/09/2025"),
            record_valido(IdentificativoCaso="2", DataAccadimento="21/01/2026", DataRilevazione="30/09/2026"),
        ]
        _, extra = etl.aggrega(records, "12", 2025, 2026, 9)
        self.assertEqual(set(extra["rilevazioni"][2025]), {"2025-09-30"})
        self.assertEqual(set(extra["rilevazioni"][2026]), {"2026-09-30"})


class TestFonte(unittest.TestCase):
    def test_host_ufficiale(self):
        self.assertEqual(etl.OFFICIAL_HOST, "dati.inail.it")

    def test_url_non_ufficiale(self):
        """scarica_zip rifiuta qualsiasi host che non sia quello ufficiale."""
        with self.assertRaises(etl.StructuralError):
            etl.verifica_host("https://esempio.gov.it/api/dati.zip")
        etl.verifica_host("https://dati.inail.it/opendata/dati.zip")  # non solleva

    def test_tutte_le_regioni_mappate(self):
        """La mappa nomi-file -> codici ISTAT copre le 20 regioni, senza buchi."""
        self.assertEqual(len(etl.REGIONI_CSV), 20)
        codici = sorted(etl.REGIONI_CSV.values())
        self.assertEqual(codici, [f"{i:02d}" for i in range(1, 21)])

    def test_nomi_composti_senza_trattino(self):
        """I CSV usano i nomi composti senza trattino: è il motivo per cui si evitano le API."""
        self.assertIn("EmiliaRomagna", etl.REGIONI_CSV)
        self.assertIn("TrentinoAltoAdige", etl.REGIONI_CSV)
        self.assertIn("FriuliVeneziaGiulia", etl.REGIONI_CSV)
        self.assertIn("ValledAosta", etl.REGIONI_CSV)


if __name__ == "__main__":
    unittest.main()
