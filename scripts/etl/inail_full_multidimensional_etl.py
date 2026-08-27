#!/usr/bin/env python3
"""
ETL Completo Multidimensionale per Osservatorio Infortuni.
Estrae da:
1. 20 CSV semestrali (2020-2024, 3.024.370 record consolidati)
2. JSON mensili congiunturali 2025 e 2026 (Gen-Giu, pari perimetro)
3. Eurostat/ISTAT occupati regionali (lfst_r_lfe2emp)

Genera:
- src/data/generated/inail-congiunturale-pari-perimetro.json
- src/data/generated/inail-multidimensionale.json
"""

import json
import glob
import csv
import zipfile
import io
import os
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
GEN_DIR = ROOT / "src" / "data" / "generated"
GEN_DIR.mkdir(parents=True, exist_ok=True)

REG_CODES = {
    "Piemonte": "01", "ValledAosta": "02", "Lombardia": "03", "TrentinoAltoAdige": "04",
    "Veneto": "05", "FriuliVeneziaGiulia": "06", "Liguria": "07", "EmiliaRomagna": "08",
    "Toscana": "09", "Umbria": "10", "Marche": "11", "Lazio": "12",
    "Abruzzo": "13", "Molise": "14", "Campania": "15", "Puglia": "16",
    "Basilicata": "17", "Calabria": "18", "Sicilia": "19", "Sardegna": "20"
}

YEARS = ["2020", "2021", "2022", "2023", "2024"]

def fascia_eta(eta_str):
    try:
        e = int(eta_str)
        if e < 15: return "0-14"
        if e <= 24: return "15-24"
        if e <= 34: return "25-34"
        if e <= 49: return "35-49"
        if e <= 64: return "50-64"
        return "65+"
    except:
        return "ND"

def map_gravita(gm_str):
    try:
        gm = int(gm_str)
        if gm < 0: return "nessuna"
        if gm <= 5: return "franchigia"
        if gm <= 15: return "capitale"
        return "rendita"
    except:
        return "nessuna"

def map_durata(g_str):
    try:
        g = int(g_str)
        if g <= 0: return "zero"
        if g <= 7: return "breve"
        if g <= 30: return "media"
        if g <= 90: return "lunga"
        return "grave90"
    except:
        return "zero"

def main():
    print("1. Caricamento dati occupati regionali...")
    occupati_data = json.loads((GEN_DIR / "occupati-regione.json").read_text(encoding="utf-8"))
    occ_reg = occupati_data["regioni"]
    
    # 2. Elaborazione Congiuntura 2025 vs 2026 a pari perimetro
    print("2. Elaborazione congiuntura 2025 vs 2026 (mesi 1..6 a pari perimetro)...")
    temporale_data = json.loads((GEN_DIR / "inail-infortuni-temporale.json").read_text(encoding="utf-8"))
    mensile = temporale_data.get("serieMensile", [])
    
    # Raggruppamento per mese e regione
    pari_mesi = [1, 2, 3, 4, 5, 6]
    congiuntura = {
        "periodo": "I Semestre (Gennaio - Giugno)",
        "mesi": pari_mesi,
        "nazionale": {
            "totale": {"anno2025": 0, "anno2026": 0, "delta": 0, "deltaPerc": 0.0},
            "lavoro": {"anno2025": 0, "anno2026": 0, "delta": 0, "deltaPerc": 0.0},
            "itinere": {"anno2025": 0, "anno2026": 0, "delta": 0, "deltaPerc": 0.0},
            "mortali": {"anno2025": 0, "anno2026": 0, "delta": 0, "deltaPerc": 0.0},
            "occupati2024": sum(occ_reg[r]["2024"] * 1000 for r in occ_reg if occ_reg[r].get("2024")),
            "incidenzaSemestrale2025": 0.0,
            "incidenzaSemestrale2026": 0.0,
        },
        "perMese": [],
        "perRegione": {}
    }
    
    mese_naz = {m: {"mese": m, "tot2025": 0, "tot2026": 0, "lav2025": 0, "lav2026": 0, "iti2025": 0, "iti2026": 0, "mor2025": 0, "mor2026": 0} for m in pari_mesi}
    reg_congiuntura = {r: {"tot2025": 0, "tot2026": 0, "lav2025": 0, "lav2026": 0, "iti2025": 0, "iti2026": 0, "mor2025": 0, "mor2026": 0} for r in [f"{i:02d}" for i in range(1, 21)]}
    
    for row in mensile:
        a = row["anno"]
        m = row["mese"]
        r = row["regione"]
        if a in (2025, 2026) and m in pari_mesi:
            t = row.get("totale", 0)
            l = row.get("lavoro", 0)
            it = row.get("itinere", 0)
            mor = row.get("mortali", 0)
            
            if a == 2025:
                congiuntura["nazionale"]["totale"]["anno2025"] += t
                congiuntura["nazionale"]["lavoro"]["anno2025"] += l
                congiuntura["nazionale"]["itinere"]["anno2025"] += it
                congiuntura["nazionale"]["mortali"]["anno2025"] += mor
                mese_naz[m]["tot2025"] += t
                mese_naz[m]["lav2025"] += l
                mese_naz[m]["iti2025"] += it
                mese_naz[m]["mor2025"] += mor
                reg_congiuntura[r]["tot2025"] += t
                reg_congiuntura[r]["lav2025"] += l
                reg_congiuntura[r]["iti2025"] += it
                reg_congiuntura[r]["mor2025"] += mor
            elif a == 2026:
                congiuntura["nazionale"]["totale"]["anno2026"] += t
                congiuntura["nazionale"]["lavoro"]["anno2026"] += l
                congiuntura["nazionale"]["itinere"]["anno2026"] += it
                congiuntura["nazionale"]["mortali"]["anno2026"] += mor
                mese_naz[m]["tot2026"] += t
                mese_naz[m]["lav2026"] += l
                mese_naz[m]["iti2026"] += it
                mese_naz[m]["mor2026"] += mor
                reg_congiuntura[r]["tot2026"] += t
                reg_congiuntura[r]["lav2026"] += l
                reg_congiuntura[r]["iti2026"] += it
                reg_congiuntura[r]["mor2026"] += mor

    # Calcolo delta
    for k in ["totale", "lavoro", "itinere", "mortali"]:
        v25 = congiuntura["nazionale"][k]["anno2025"]
        v26 = congiuntura["nazionale"][k]["anno2026"]
        d = v26 - v25
        dp = round((d / v25 * 100), 2) if v25 > 0 else 0.0
        congiuntura["nazionale"][k]["delta"] = d
        congiuntura["nazionale"][k]["deltaPerc"] = dp
        
    occ_tot_k = congiuntura["nazionale"]["occupati2024"] / 1000.0
    congiuntura["nazionale"]["incidenzaSemestrale2025"] = round(congiuntura["nazionale"]["totale"]["anno2025"] / occ_tot_k, 2)
    congiuntura["nazionale"]["incidenzaSemestrale2026"] = round(congiuntura["nazionale"]["totale"]["anno2026"] / occ_tot_k, 2)

    for m in pari_mesi:
        d = mese_naz[m]
        congiuntura["perMese"].append(d)
        
    for r, rd in sorted(reg_congiuntura.items()):
        occ_r = occ_reg.get(r, {}).get("2024", 1) # migliaia
        inc25 = round(rd["tot2025"] / occ_r, 2) if occ_r else 0.0
        inc26 = round(rd["tot2026"] / occ_r, 2) if occ_r else 0.0
        congiuntura["perRegione"][r] = {
            **rd,
            "occupati2024": int(occ_r * 1000) if occ_r else 0,
            "incidenza2025": inc25,
            "incidenza2026": inc26,
            "deltaTotalePerc": round((rd["tot2026"] - rd["tot2025"]) / rd["tot2025"] * 100, 2) if rd["tot2025"] > 0 else 0.0
        }
        
    (GEN_DIR / "inail-congiunturale-pari-perimetro.json").write_text(json.dumps(congiuntura, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Scritto inail-congiunturale-pari-perimetro.json")

    # 3. Elaborazione Multidimensionale per Anno (2020..2024 + Totale)
    print("3. Elaborazione consolidata 2020-2024 per singolo anno...")
    
    def new_dimension_container():
        return {
            "totale": 0, "mortali": 0, "lavoro": 0, "itinere": 0, "giorni": 0, "menomati": 0,
            "generi": defaultdict(int),
            "generiMortali": defaultdict(int),
            "fasceEta": defaultdict(int),
            "fasceEtaMortali": defaultdict(int),
            "modalita": defaultdict(int),
            "gestione": defaultdict(int),
            "esito": defaultdict(int),
            "indennizzo": defaultdict(int),
            "gravita": defaultdict(int),
            "durata": defaultdict(int),
            "nascita": defaultdict(int),
            "mezzo": defaultdict(int),
            "atecoMacro": defaultdict(int),
            "atecoMacroMortali": defaultdict(int),
            "atecoDivisione": defaultdict(int),
            "mensile": defaultdict(int),
            "regioni": defaultdict(lambda: {"totale": 0, "mortali": 0, "lavoro": 0, "itinere": 0, "giorni": 0, "menomati": 0})
        }

    dataset_by_year = {y: new_dimension_container() for y in YEARS}
    dataset_all = new_dimension_container()
    
    zips = sorted(glob.glob(str(RAW_DIR / "semestrale-*.zip")))
    for zpath in zips:
        reg_name = Path(zpath).stem.replace("semestrale-", "")
        reg_cod = REG_CODES.get(reg_name, "ND")
        with zipfile.ZipFile(zpath) as zf:
            for fname in zf.namelist():
                with zf.open(fname) as bf:
                    text_f = io.TextIOWrapper(bf, encoding='utf-8-sig', errors='replace')
                    reader = csv.reader(text_f, delimiter=';')
                    header = next(reader)
                    idx = {col: i for i, col in enumerate(header)}
                    
                    idx_dt = idx["DataAccadimento"]
                    idx_morte = idx["DataMorte"]
                    idx_mod = idx["ModalitaAccadimento"]
                    idx_gen = idx["Genere"]
                    idx_eta = idx["Eta"]
                    idx_gest = idx["Gestione"]
                    idx_esito = idx["DefinizioneAmministrativa"]
                    idx_ind = idx["Indennizzo"]
                    idx_gm = idx["GradoMenomazione"]
                    idx_gi = idx["GiorniIndennizzati"]
                    idx_ln = idx["LuogoNascita"]
                    idx_mz = idx["ConSenzaMezzoTrasporto"]
                    idx_ateco = idx["SettoreAttivitaEconomica"]
                    
                    for row in reader:
                        if not row or len(row) < len(header): continue
                        raw_dt = row[idx_dt].strip()
                        parts = raw_dt.split('/')
                        if len(parts) != 3: continue
                        anno = parts[2]
                        if anno not in dataset_by_year: continue
                        try:
                            mese_num = int(parts[1])
                        except:
                            mese_num = 0
                            
                        targets = [dataset_by_year[anno], dataset_all]
                        
                        is_mortale = bool(row[idx_morte].strip())
                        mod = row[idx_mod].strip()
                        is_itinere = (mod == "S")
                        gen = row[idx_gen].strip().upper()
                        if gen not in ("M", "F"): gen = "ND"
                        f_eta = fascia_eta(row[idx_eta].strip())
                        gest = row[idx_gest].strip().upper()
                        if gest not in ("I", "S", "A"): gest = "ND"
                        es = row[idx_esito].strip().upper()
                        if es not in ("P", "N", "F", "I"): es = "ND"
                        ind = row[idx_ind].strip().upper()
                        if ind not in ("TE", "NE", "CA", "RD", "RS"): ind = "ND"
                        gr = map_gravita(row[idx_gm].strip())
                        
                        gm_val = -1
                        try: gm_val = int(row[idx_gm].strip())
                        except: pass
                        is_menomato = (gm_val >= 0)
                        
                        g_val = 0
                        try: g_val = int(row[idx_gi].strip())
                        except: pass
                        dur = map_durata(row[idx_gi].strip())
                        
                        ln = row[idx_ln].strip().upper()
                        nascita_key = "ITAL" if (ln == "ITAL" or ln == "IT") else ("ESTERO" if ln else "ND")
                        
                        mz = row[idx_mz].strip().upper()
                        mezzo_key = "CON_MEZZO" if mz in ("S", "SI", "1") else "SENZA_MEZZO"
                        
                        ateco = row[idx_ateco].strip()
                        if ateco and ateco != "ND":
                            macro = ateco[0].upper()
                            div = ateco[:4].strip()
                        else:
                            macro = "ND"
                            div = "ND"
                            
                        for T in targets:
                            T["totale"] += 1
                            if is_mortale: 
                                T["mortali"] += 1
                                T["generiMortali"][gen] += 1
                                T["fasceEtaMortali"][f_eta] += 1
                                if macro != "ND": T["atecoMacroMortali"][macro] += 1
                            if is_itinere:
                                T["itinere"] += 1
                                T["modalita"]["itinere"] += 1
                            else:
                                T["lavoro"] += 1
                                T["modalita"]["lavoro"] += 1
                            T["generi"][gen] += 1
                            T["fasceEta"][f_eta] += 1
                            T["gestione"][gest] += 1
                            T["esito"][es] += 1
                            T["indennizzo"][ind] += 1
                            T["gravita"][gr] += 1
                            if is_menomato: T["menomati"] += 1
                            T["durata"][dur] += 1
                            if g_val > 0: T["giorni"] += g_val
                            T["nascita"][nascita_key] += 1
                            T["mezzo"][mezzo_key] += 1
                            T["atecoMacro"][macro] += 1
                            T["atecoDivisione"][div] += 1
                            if 1 <= mese_num <= 12: T["mensile"][mese_num] += 1
                            
                            r_stat = T["regioni"][reg_cod]
                            r_stat["totale"] += 1
                            if is_mortale: r_stat["mortali"] += 1
                            if is_itinere: r_stat["itinere"] += 1
                            else: r_stat["lavoro"] += 1
                            if is_menomato: r_stat["menomati"] += 1
                            if g_val > 0: r_stat["giorni"] += g_val

    # Costruzione JSON strutturato
    def format_container(c, anno_label):
        # Calcolo incidenza regionale per l'anno
        reg_list = []
        for r_cod in [f"{i:02d}" for i in range(1, 21)]:
            r_data = c["regioni"][r_cod]
            # occupati
            if anno_label == "ALL":
                # media occupati 2020-2024
                occ_vals = [occ_reg.get(r_cod, {}).get(y, 0) for y in YEARS]
                occ_k = sum(occ_vals) / len(occ_vals) if occ_vals else 1
            else:
                occ_k = occ_reg.get(r_cod, {}).get(anno_label, 1)
            
            inc = round(r_data["totale"] / occ_k, 2) if occ_k else 0.0
            inc_mor = round(r_data["mortali"] / occ_k, 3) if occ_k else 0.0
            reg_list.append({
                "regione": r_cod,
                "totale": r_data["totale"],
                "lavoro": r_data["lavoro"],
                "itinere": r_data["itinere"],
                "mortali": r_data["mortali"],
                "menomati": r_data["menomati"],
                "giorni": r_data["giorni"],
                "occupati": int(occ_k * 1000),
                "indiceIncidenza": inc,
                "indiceMortali": inc_mor
            })
            
        # Nazionale
        if anno_label == "ALL":
            occ_tot_k = sum(sum(occ_reg.get(r, {}).get(y, 0) for y in YEARS) / len(YEARS) for r in occ_reg)
        else:
            occ_tot_k = sum(occ_reg.get(r, {}).get(anno_label, 0) for r in occ_reg)
            
        inc_naz = round(c["totale"] / occ_tot_k, 2) if occ_tot_k else 0.0
        inc_mor_naz = round(c["mortali"] / occ_tot_k, 3) if occ_tot_k else 0.0

        # Top ATECO divisioni
        top_div = sorted(
            [{"key": k, "casi": v} for k, v in c["atecoDivisione"].items() if k != "ND"],
            key=lambda x: x["casi"],
            reverse=True
        )[:20]
        
        # ATECO Macro list
        macro_list = sorted(
            [{"key": k, "casi": v, "mortali": c["atecoMacroMortali"].get(k, 0)} for k, v in c["atecoMacro"].items()],
            key=lambda x: x["casi"],
            reverse=True
        )

        return {
            "anno": anno_label,
            "totale": c["totale"],
            "mortali": c["mortali"],
            "lavoro": c["lavoro"],
            "itinere": c["itinere"],
            "giorni": c["giorni"],
            "menomati": c["menomati"],
            "occupati": int(occ_tot_k * 1000),
            "indiceIncidenza": inc_naz,
            "indiceMortali": inc_mor_naz,
            "generi": dict(c["generi"]),
            "generiMortali": dict(c["generiMortali"]),
            "fasceEta": dict(c["fasceEta"]),
            "fasceEtaMortali": dict(c["fasceEtaMortali"]),
            "modalita": dict(c["modalita"]),
            "gestione": dict(c["gestione"]),
            "esito": dict(c["esito"]),
            "indennizzo": dict(c["indennizzo"]),
            "gravita": dict(c["gravita"]),
            "durata": dict(c["durata"]),
            "nascita": dict(c["nascita"]),
            "mezzo": dict(c["mezzo"]),
            "mensile": {str(m): c["mensile"].get(m, 0) for m in range(1, 13)},
            "atecoMacro": macro_list,
            "atecoDivisioni": top_div,
            "regioni": reg_list
        }

    output_multidim = {
        "schemaVersion": 2,
        "anniDisponibili": YEARS,
        "perAnno": {y: format_container(dataset_by_year[y], y) for y in YEARS},
        "consolidatoTotale": format_container(dataset_all, "ALL")
    }

    out_file = GEN_DIR / "inail-multidimensionale.json"
    out_file.write_text(json.dumps(output_multidim, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Scritto inail-multidimensionale.json ({out_file.stat().st_size / 1024:.1f} KB)")
    print("ETL completato con successo!")

if __name__ == "__main__":
    main()
