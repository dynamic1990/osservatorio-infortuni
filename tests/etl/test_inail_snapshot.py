"""Test dell'ETL infortuni INAIL (senza rete: fixture locali)."""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "etl"))
import inail_infortuni_snapshot as etl  # noqa: E402


class TestValidateRecord(unittest.TestCase):
    def test_record_valido(self):
        record = {
            "DataRilevazione": "30/06/2025", "LuogoNascita": "ITAL", "Regione": "12",
            "Genere": "M", "Gestione": "I", "IdentificativoCaso": "1",
            "DataProtocollo": "23/01/2025", "DataAccadimento": "21/01/2025",
            "DataMorte": None, "LuogoAccadimento": "058", "IdentificativoInfortunato": "1",
            "Eta": "35", "ModalitaAccadimento": "S", "ConSenzaMezzoTrasporto": "N",
            "IdentificativoDatoreLavoro": "1", "PosizioneAssicurativaTerritoriale": "1",
            "SettoreAttivitaEconomica": "F 41", "GestioneTariffaria": "1",
            "GrandeGruppoTariffario": "3",
        }
        etl.validate_record(record, "Lazio", 2025, 1)  # non deve sollevare

    def test_campo_mancante(self):
        record = {"Genere": "M", "Eta": "30", "LuogoAccadimento": "058"}
        with self.assertRaises(etl.StructuralError):
            etl.validate_record(record, "Lazio", 2025, 1)

    def test_genere_invalido(self):
        record = {
            "DataRilevazione": "30/06/2025", "LuogoNascita": "ITAL", "Regione": "12",
            "Genere": "X", "Gestione": "I", "IdentificativoCaso": "1",
            "DataProtocollo": "23/01/2025", "DataAccadimento": "21/01/2025",
            "DataMorte": None, "LuogoAccadimento": "058", "IdentificativoInfortunato": "1",
            "Eta": "35", "ModalitaAccadimento": "S", "ConSenzaMezzoTrasporto": "N",
            "IdentificativoDatoreLavoro": "1", "PosizioneAssicurativaTerritoriale": "1",
            "SettoreAttivitaEconomica": "F 41", "GestioneTariffaria": "1",
            "GrandeGruppoTariffario": "3",
        }
        with self.assertRaises(etl.StructuralError):
            etl.validate_record(record, "Lazio", 2025, 1)

    def test_eta_non_numerica(self):
        record = {
            "DataRilevazione": "30/06/2025", "LuogoNascita": "ITAL", "Regione": "12",
            "Genere": "M", "Gestione": "I", "IdentificativoCaso": "1",
            "DataProtocollo": "23/01/2025", "DataAccadimento": "21/01/2025",
            "DataMorte": None, "LuogoAccadimento": "058", "IdentificativoInfortunato": "1",
            "Eta": "abc", "ModalitaAccadimento": "S", "ConSenzaMezzoTrasporto": "N",
            "IdentificativoDatoreLavoro": "1", "PosizioneAssicurativaTerritoriale": "1",
            "SettoreAttivitaEconomica": "F 41", "GestioneTariffaria": "1",
            "GrandeGruppoTariffario": "3",
        }
        with self.assertRaises(etl.StructuralError):
            etl.validate_record(record, "Lazio", 2025, 1)


class TestAggregate(unittest.TestCase):
    def test_aggregazione_conteggia(self):
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
        records = [dict(base), dict(base, IdentificativoCaso="2"), dict(base, Genere="F", IdentificativoCaso="3")]
        rows = etl.aggregate(records, "Lazio", 2025, 1)
        self.assertEqual(len(rows), 2)  # due combinazioni (M x2, F x1)
        by_genere = {r["genere"]: r["casi"] for r in rows}
        self.assertEqual(by_genere, {"M": 2, "F": 1})

    def test_esito_mortale_conteggiato(self):
        base = {
            "DataRilevazione": "30/06/2025", "LuogoNascita": "ITAL", "Regione": "12",
            "Genere": "M", "Gestione": "I", "IdentificativoCaso": "1",
            "DataProtocollo": "23/01/2025", "DataAccadimento": "21/01/2025",
            "DataMorte": "25/01/2025", "LuogoAccadimento": "058", "IdentificativoInfortunato": "1",
            "Eta": "35", "ModalitaAccadimento": "S", "ConSenzaMezzoTrasporto": "N",
            "IdentificativoDatoreLavoro": "1", "PosizioneAssicurativaTerritoriale": "1",
            "SettoreAttivitaEconomica": "F 41", "GestioneTariffaria": "1",
            "GrandeGruppoTariffario": "3",
        }
        rows = etl.aggregate([base], "Lazio", 2025, 1)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["casi"], 1)


class TestFetchPreconditions(unittest.TestCase):
    def test_url_non_ufficiale(self):
        with self.assertRaises(etl.StructuralError):
            etl.fetch_json("https://esempio.gov.it/api/OpenData/DatiConCadenzaMensileInfortuni?x=1")

    def test_host_name(self):
        self.assertEqual(etl.OFFICIAL_HOST, "dati.inail.it")


if __name__ == "__main__":
    unittest.main()


class TestEtaSconosciuta(unittest.TestCase):
    def test_eta_meno_uno_ammessa(self):
        base = {
            "DataRilevazione": "30/06/2025", "LuogoNascita": "ITAL", "Regione": "12",
            "Genere": "M", "Gestione": "I", "IdentificativoCaso": "1",
            "DataProtocollo": "23/01/2025", "DataAccadimento": "21/01/2025",
            "DataMorte": None, "LuogoAccadimento": "058", "IdentificativoInfortunato": "1",
            "Eta": "-1", "ModalitaAccadimento": "S", "ConSenzaMezzoTrasporto": "N",
            "IdentificativoDatoreLavoro": "1", "PosizioneAssicurativaTerritoriale": "1",
            "SettoreAttivitaEconomica": "F 41", "GestioneTariffaria": "1",
            "GrandeGruppoTariffario": "3",
        }
        etl.validate_record(base, "Lazio", 2025, 1)  # non deve sollevare
        rows = etl.aggregate([base], "Lazio", 2025, 1)
        self.assertEqual(rows[0]["eta"], -1)
