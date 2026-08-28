#!/usr/bin/env python3
"""
Aggiornamento ETL Multidimensionale con:
1. Dettaglio Province Autonome Bolzano (021) e Trento (022) per il Trentino-Alto Adige.
2. Calcolo Incidenza e Tassi per Macro-Settori ATECO (A-U) con occupati ISTAT.
3. Calcolo Giornate Perse Totali e Medie, Indice di Gravità per Regione e Settore.
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
    print("1. Caricamento dati occupati regionali e settoriali...")
    occ_reg_data = json.loads((GEN_DIR / "occupati-regione.json").read_text(encoding="utf-8"))
    occ_reg = occ_reg_data["regioni"]
    
    occ_sett_data = json.loads((GEN_DIR / "occupati-settore.json").read_text(encoding="utf-8"))
    occ_sett = occ_sett_data["settori"]
    
    # Occupati specifici per Bolzano (021) e Trento (022)
    occ_prov_pa = {
        "021": {"2020": 242.8, "2021": 241.1, "2022": 250.7, "2023": 250.6, "2024": 253.1},
        "022": {"2020": 233.6, "2021": 231.6, "2022": 240.7, "2023": 241.5, "2024": 243.3}
    }

    def new_dimension_container():
        return {
            "totale": 0, "mortali": 0, "lavoro": 0, "itinere": 0, "giorni": 0, "menomati": 0, "casi_con_giorni": 0,
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
            "atecoMacro": defaultdict(lambda: {"totale": 0, "mortali": 0, "lavoro": 0, "itinere": 0, "giorni": 0, "menomati": 0, "casi_con_giorni": 0}),
            "atecoDivisione": defaultdict(int),
            "mensile": defaultdict(int),
            "regioni": defaultdict(lambda: {"totale": 0, "mortali": 0, "lavoro": 0, "itinere": 0, "giorni": 0, "menomati": 0, "casi_con_giorni": 0}),
            "provinceAutonome": defaultdict(lambda: {"totale": 0, "mortali": 0, "lavoro": 0, "itinere": 0, "giorni": 0, "menomati": 0, "casi_con_giorni": 0})
        }

    dataset_by_year = {y: new_dimension_container() for y in YEARS}
    dataset_all = new_dimension_container()
    
    print("2. Parsing 20 CSV semestrali consolidati...")
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
                    idx_luogo = idx["LuogoAccadimento"]
                    
                    for row in reader:
                        if not row or len(row) < len(header): continue
                        raw_dt = row[idx_dt].strip()
                        parts = raw_dt.split('/')
                        if len(parts) != 3: continue
                        anno = parts[2]
                        if anno not in dataset_by_year: continue
                        try: mese_num = int(parts[1])
                        except: mese_num = 0
                            
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
                            
                        luogo_cod = row[idx_luogo].strip()
                        
                        for T in targets:
                            T["totale"] += 1
                            if is_mortale: 
                                T["mortali"] += 1
                                T["generiMortali"][gen] += 1
                                T["fasceEtaMortali"][f_eta] += 1
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
                            if g_val > 0: 
                                T["giorni"] += g_val
                                T["casi_con_giorni"] += 1
                            T["nascita"][nascita_key] += 1
                            T["mezzo"][mezzo_key] += 1
                            T["atecoDivisione"][div] += 1
                            if 1 <= mese_num <= 12: T["mensile"][mese_num] += 1
                            
                            # ATECO Macro
                            m_stat = T["atecoMacro"][macro]
                            m_stat["totale"] += 1
                            if is_mortale: m_stat["mortali"] += 1
                            if is_itinere: m_stat["itinere"] += 1
                            else: m_stat["lavoro"] += 1
                            if is_menomato: m_stat["menomati"] += 1
                            if g_val > 0: 
                                m_stat["giorni"] += g_val
                                m_stat["casi_con_giorni"] += 1
                            
                            # Regione
                            r_stat = T["regioni"][reg_cod]
                            r_stat["totale"] += 1
                            if is_mortale: r_stat["mortali"] += 1
                            if is_itinere: r_stat["itinere"] += 1
                            else: r_stat["lavoro"] += 1
                            if is_menomato: r_stat["menomati"] += 1
                            if g_val > 0: 
                                r_stat["giorni"] += g_val
                                r_stat["casi_con_giorni"] += 1
                                
                            # Province Autonome per Trentino-Alto Adige
                            if reg_cod == "04" and luogo_cod in ("021", "022"):
                                p_stat = T["provinceAutonome"][luogo_cod]
                                p_stat["totale"] += 1
                                if is_mortale: p_stat["mortali"] += 1
                                if is_itinere: p_stat["itinere"] += 1
                                else: p_stat["lavoro"] += 1
                                if is_menomato: p_stat["menomati"] += 1
                                if g_val > 0: 
                                    p_stat["giorni"] += g_val
                                    p_stat["casi_con_giorni"] += 1

    # Formattazione Output
    def format_container(c, anno_label):
        # 1. Regioni
        reg_list = []
        for r_cod in [f"{i:02d}" for i in range(1, 21)]:
            r_data = c["regioni"][r_cod]
            if anno_label == "ALL":
                occ_vals = [occ_reg.get(r_cod, {}).get(y, 0) for y in YEARS]
                occ_k = sum(occ_vals) / len(occ_vals) if occ_vals else 1
            else:
                occ_k = occ_reg.get(r_cod, {}).get(anno_label, 1)
            
            inc = round(r_data["totale"] / occ_k, 2) if occ_k else 0.0
            inc_mor = round(r_data["mortali"] / occ_k, 3) if occ_k else 0.0
            durata_media = round(r_data["giorni"] / r_data["casi_con_giorni"], 1) if r_data["casi_con_giorni"] > 0 else 0.0
            indice_gravita = round(r_data["giorni"] / occ_k, 1) if occ_k else 0.0
            
            reg_list.append({
                "regione": r_cod,
                "totale": r_data["totale"],
                "lavoro": r_data["lavoro"],
                "itinere": r_data["itinere"],
                "mortali": r_data["mortali"],
                "menomati": r_data["menomati"],
                "giorni": r_data["giorni"],
                "casiConGiorni": r_data["casi_con_giorni"],
                "durataMedia": durata_media,
                "indiceGravita": indice_gravita,
                "occupati": int(occ_k * 1000),
                "indiceIncidenza": inc,
                "indiceMortali": inc_mor
            })
            
        # 2. Province Autonome Bolzano (021) e Trento (022)
        prov_list = []
        for p_cod, p_name in [("021", "P.A. Bolzano / Bozen"), ("022", "P.A. Trento")]:
            p_data = c["provinceAutonome"][p_cod]
            if anno_label == "ALL":
                occ_vals = [occ_prov_pa[p_cod].get(y, 0) for y in YEARS]
                occ_k = sum(occ_vals) / len(occ_vals) if occ_vals else 1
            else:
                occ_k = occ_prov_pa[p_cod].get(anno_label, 1)
                
            inc = round(p_data["totale"] / occ_k, 2) if occ_k else 0.0
            inc_mor = round(p_data["mortali"] / occ_k, 3) if occ_k else 0.0
            durata_media = round(p_data["giorni"] / p_data["casi_con_giorni"], 1) if p_data["casi_con_giorni"] > 0 else 0.0
            indice_gravita = round(p_data["giorni"] / occ_k, 1) if occ_k else 0.0
            
            prov_list.append({
                "codice": p_cod,
                "nome": p_name,
                "totale": p_data["totale"],
                "lavoro": p_data["lavoro"],
                "itinere": p_data["itinere"],
                "mortali": p_data["mortali"],
                "menomati": p_data["menomati"],
                "giorni": p_data["giorni"],
                "casiConGiorni": p_data["casi_con_giorni"],
                "durataMedia": durata_media,
                "indiceGravita": indice_gravita,
                "occupati": int(occ_k * 1000),
                "indiceIncidenza": inc,
                "indiceMortali": inc_mor
            })

        # 3. Nazionale
        if anno_label == "ALL":
            occ_tot_k = sum(sum(occ_reg.get(r, {}).get(y, 0) for y in YEARS) / len(YEARS) for r in occ_reg)
        else:
            occ_tot_k = sum(occ_reg.get(r, {}).get(anno_label, 0) for r in occ_reg)
            
        inc_naz = round(c["totale"] / occ_tot_k, 2) if occ_tot_k else 0.0
        inc_mor_naz = round(c["mortali"] / occ_tot_k, 3) if occ_tot_k else 0.0
        durata_media_naz = round(c["giorni"] / c["casi_con_giorni"], 1) if c["casi_con_giorni"] > 0 else 0.0
        indice_gravita_naz = round(c["giorni"] / occ_tot_k, 1) if occ_tot_k else 0.0

        # 4. ATECO Macro con occupati e tassi
        macro_list = []
        for m_key, m_stat in c["atecoMacro"].items():
            if m_key == "ND":
                occ_k = 0
                inc = 0.0
                inc_mor = 0.0
                ind_grav = 0.0
                nome_sett = "Settore non attribuito (ND)"
            else:
                s_info = occ_sett.get(m_key, {})
                nome_sett = s_info.get("nome", m_key)
                if anno_label == "ALL":
                    occ_vals = [s_info.get(y, 0) for y in YEARS if s_info.get(y)]
                    occ_k = sum(occ_vals) / len(occ_vals) if occ_vals else 0
                else:
                    occ_k = s_info.get(anno_label, 0)
                inc = round(m_stat["totale"] / occ_k, 2) if occ_k > 0 else 0.0
                inc_mor = round(m_stat["mortali"] / occ_k, 3) if occ_k > 0 else 0.0
                ind_grav = round(m_stat["giorni"] / occ_k, 1) if occ_k > 0 else 0.0

            dur_m = round(m_stat["giorni"] / m_stat["casi_con_giorni"], 1) if m_stat["casi_con_giorni"] > 0 else 0.0
            
            macro_list.append({
                "key": m_key,
                "nome": nome_sett,
                "casi": m_stat["totale"],
                "mortali": m_stat["mortali"],
                "lavoro": m_stat["lavoro"],
                "itinere": m_stat["itinere"],
                "menomati": m_stat["menomati"],
                "giorni": m_stat["giorni"],
                "durataMedia": dur_m,
                "indiceGravita": ind_grav,
                "occupati": int(occ_k * 1000) if occ_k else 0,
                "indiceIncidenza": inc,
                "indiceMortali": inc_mor
            })
            
        macro_list.sort(key=lambda x: x["casi"], reverse=True)

        # Top ATECO divisioni
        top_div = sorted(
            [{"key": k, "casi": v} for k, v in c["atecoDivisione"].items() if k != "ND"],
            key=lambda x: x["casi"],
            reverse=True
        )[:20]

        return {
            "anno": anno_label,
            "totale": c["totale"],
            "mortali": c["mortali"],
            "lavoro": c["lavoro"],
            "itinere": c["itinere"],
            "giorni": c["giorni"],
            "casiConGiorni": c["casi_con_giorni"],
            "durataMedia": durata_media_naz,
            "indiceGravita": indice_gravita_naz,
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
            "regioni": reg_list,
            "provinceAutonome": prov_list
        }

    output_multidim = {
        "schemaVersion": 3,
        "anniDisponibili": YEARS,
        "perAnno": {y: format_container(dataset_by_year[y], y) for y in YEARS},
        "consolidatoTotale": format_container(dataset_all, "ALL")
    }

    out_file = GEN_DIR / "inail-multidimensionale.json"
    out_file.write_text(json.dumps(output_multidim, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Scritto inail-multidimensionale.json aggiornato ({out_file.stat().st_size / 1024:.1f} KB)")

if __name__ == "__main__":
    main()
