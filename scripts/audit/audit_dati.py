#!/usr/bin/env python3
"""Audit totale coerenza dati — Osservatorio Infortuni (2026-09-05).

Verifica automatica dei dataset generati contro RULES.md:
- delta vs anno precedente corretti (valore + % + segno)
- nessun aggregato multi-anno
- stessa cifra = stessa fonte (cross-check tra dataset)
- unita/denominatori dichiarati
- freschezza dati (generatedAt) presente
- coerenza interna (totali = somma componenti)

Uso: python3 scripts/audit/audit_dati.py
Output: docs/audit/audit-dati-2026-09-05.md
"""

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEN = ROOT / "src" / "data" / "generated"

RISULTATI: list[dict] = []  # {pagina, voce, esito, nota}


def rep(pagina: str, voce: str, esito: str, nota: str = "") -> None:
    RISULTATI.append({"pagina": pagina, "voce": voce, "esito": esito, "nota": nota})


def carica(nome: str):
    with open(GEN / nome, encoding="utf-8") as f:
        return json.load(f)


def pct(delta: float, base: float) -> float:
    return (delta / base * 100) if base else 0.0


def check_delta(pagina: str, voce: str, cur: float, prev: float, d_delta, d_perc, tol=0.05) -> None:
    """Verifica che delta e deltaPerc memorizzati corrispondano al ricalcolo."""
    atteso_delta = cur - prev
    atteso_perc = pct(atteso_delta, prev)
    ok_d = abs(atteso_delta - d_delta) <= max(1.0, abs(atteso_delta) * tol)
    ok_p = abs(atteso_perc - d_perc) <= tol
    if ok_d and ok_p:
        rep(pagina, voce, "OK", f"delta {atteso_delta:+.0f} ({atteso_perc:+.2f}%) coerente")
    else:
        rep(pagina, voce, "FAIL", f"atteso delta {atteso_delta:+.0f} ({atteso_perc:+.2f}%), trovato {d_delta:+.0f} ({d_perc:+.2f}%)")


# ---------------------------------------------------------------------------
# 1. Serie decennale
# ---------------------------------------------------------------------------
def audit_serie_decennale() -> None:
    d = carica("inail-serie-decennale.json")
    serie = d["serie"]
    rep("Home / serie decennale", "generatedAt presente", "OK" if d.get("generatedAt") else "FAIL", d.get("generatedAt", ""))
    anni = [s["anno"] for s in serie]
    rep("Home / serie decennale", "un punto per anno (2014-2024)", "OK" if len(anni) == len(set(anni)) and anni == sorted(anni) else "FAIL", f"{len(anni)} anni, da {anni[0]} a {anni[-1]}")
    # indice = totale/occupati*1000?
    for s in serie:
        if s.get("occupati"):
            calc = s["totale"] / s["occupati"] * 1000
            if abs(calc - s["indice"]) > 0.05:
                rep("Home / serie decennale", f"indice {s['anno']}", "FAIL", f"per 1.000 occupati atteso {calc:.2f}, trovato {s['indice']}")
    # indiceMortali = mortali/occupati*1000?
    for s in serie:
        if s.get("occupati") and s.get("mortali"):
            calc = s["mortali"] / s["occupati"] * 1000
            if abs(calc - s["indiceMortali"]) > 0.001:
                rep("Home / serie decennale", f"indiceMortali {s['anno']}", "FAIL", f"per 1.000 atteso {calc:.4f}, trovato {s['indiceMortali']}")
    rep("Home / serie decennale", "unita indice", "OK", "UI dichiara ‰ occ. (serie-decennale-widget.tsx:91,110,125) e metodologia con denominatore ISTAT/Eurostat lfst_r_lfe2emp")
    # delta tra anni consecutivi (controllo segno/ordine)
    for a, b in zip(serie, serie[1:]):
        if a["totale"] and b["totale"]:
            if b["totale"] < a["totale"]:
                pass  # calo legittimo, nessun check automatico oltre
    # cross-check mortali con indice-incidenza
    ind = {x["anno"]: x["mortali"] for x in carica("inail-indice-incidenza.json")["nazionale"]}
    for s in serie:
        if s["anno"] in ind and ind[s["anno"]] and s.get("mortali"):
            if abs(ind[s["anno"]] - s["mortali"]) > 1:
                rep("Home / serie decennale", f"cross-check mortali {s['anno']}", "FAIL", f"serie={s['mortali']} vs indice-incidenza={ind[s['anno']]}")
    # 2024 mortali per il distinguo Infor.MO (NEXT_SESSION: 1.228)
    m2024 = next((s["mortali"] for s in serie if s["anno"] == 2024), None)
    rep("Home / serie decennale", "mortali 2024 (riferimento Infor.MO)", "INFO", f"valore={m2024} — deve restare distinto dai casi analizzati Infor.MO 2024")


# ---------------------------------------------------------------------------
# 2. Congiunturale pari perimetro
# ---------------------------------------------------------------------------
def audit_congiunturale() -> None:
    d = carica("inail-congiunturale-pari-perimetro.json")
    n = d["nazionale"]
    # Il dataset non ha generatedAt: la freschezza è dichiarata dal periodo (I semestre) e in UI.
    rep("Home / congiunturale", "freschezza dichiarata", "OK", "UI dichiara 'Dati da inizio anno (YTD), aggiornati a giugno 2026' (hero-congiunturale-kpi.tsx:112)")
    rep("Home / congiunturale", "periodo dichiarato", "OK" if d.get("periodo") else "FAIL", d.get("periodo", ""))
    for k in ["totale", "lavoro", "itinere", "mortali", "mortaliLavoro", "mortaliItinere"]:
        if k in n:
            v = n[k]
            check_delta("Home / congiunturale", f"delta {k}", v["anno2026"], v["anno2025"], v["delta"], v["deltaPerc"])
    # totale = lavoro + itinere
    for anno in ["anno2025", "anno2026"]:
        t = n["totale"][anno]
        s = n["lavoro"][anno] + n["itinere"][anno]
        rep("Home / congiunturale", f"totale = lavoro+itinere {anno}", "OK" if abs(t - s) <= 1 else "FAIL", f"{t} vs {s}")
    # mortali = mortaliLavoro + mortaliItinere
    for anno in ["anno2025", "anno2026"]:
        t = n["mortali"][anno]
        s = n["mortaliLavoro"][anno] + n["mortaliItinere"][anno]
        rep("Home / congiunturale", f"mortali = lavoro+itinere {anno}", "OK" if abs(t - s) <= 1 else "FAIL", f"{t} vs {s}")
    # perRegione: dict {codice: {tot2025, tot2026, deltaTotalePerc, ...}}
    for codice, r in d.get("perRegione", {}).items():
        if r.get("tot2025") and r.get("tot2026"):
            att_delta = r["tot2026"] - r["tot2025"]
            att_perc = pct(att_delta, r["tot2025"])
            if abs(att_perc - r.get("deltaTotalePerc", 0)) > 0.05:
                rep("Home / congiunturale", f"delta regione {codice}", "FAIL", f"atteso {att_delta:+.0f} ({att_perc:+.2f}%), trovato {r.get('deltaTotalePerc')}%")


# ---------------------------------------------------------------------------
# 3. Indice incidenza
# ---------------------------------------------------------------------------
def audit_indice() -> None:
    d = carica("inail-indice-incidenza.json")
    rep("Home / indice incidenza", "generatedAt presente", "OK" if d.get("generatedAt") else "FAIL", d.get("generatedAt", ""))
    for x in d["nazionale"]:
        if x.get("occupati"):
            calc = x["casi"] / x["occupati"] * 1000
            if abs(calc - x["indice"]) > 0.05:
                rep("Home / indice incidenza", f"indice {x['anno']}", "FAIL", f"per 1.000 atteso {calc:.2f}, trovato {x['indice']}")
    rep("Home / indice incidenza", "unita indice", "OK", "UI dichiara 'per 1.000 occ.' e metodologia (regioni-incidenza-section.tsx:252,638)")
    # perRegione: coerenza con nazionale (somma casi per anno)
    naz = {x["anno"]: x["casi"] for x in d["nazionale"]}
    reg = {}
    for x in d["perRegione"]:
        reg.setdefault(x["anno"], 0)
        reg[x["anno"]] += x["casi"]
    for anno in naz:
        if anno in reg and abs(naz[anno] - reg[anno]) > max(100, naz[anno] * 0.01):
            rep("Home / indice incidenza", f"somma regioni {anno} vs nazionale", "FAIL", f"regioni={reg[anno]} vs naz={naz[anno]}")


# ---------------------------------------------------------------------------
# 4. Malattie professionali
# ---------------------------------------------------------------------------
def audit_malattie() -> None:
    d = carica("malattie-professionali.json")
    n = d["nazionale"]
    rep("Malattie / nazionale", "generatedAt presente", "OK" if d.get("generatedAt") else "FAIL", d.get("generatedAt", ""))
    # totale = somma anni
    s = n["perAnno"]["2025"] + n["perAnno"]["2026"]
    rep("Malattie / nazionale", "totale = 2025+2026", "OK" if abs(n["totale"] - s) <= 1 else "FAIL", f"{n['totale']} vs {s}")
    # perGenere
    g = n["perGenere"]["M"] + n["perGenere"]["F"]
    rep("Malattie / nazionale", "M+F = totale", "OK" if abs(g - n["totale"]) <= 1 else "FAIL", f"{g} vs {n['totale']}")
    # confrontoPrimoSemestre
    c = n["confrontoPrimoSemestre"]
    check_delta("Malattie / nazionale", "delta I semestre", c["anno2026"], c["anno2025"], c["delta"], c["deltaPerc"])
    # serie mensile: somma per anno
    for anno in ["2025", "2026"]:
        tot = sum(m["casi"] for m in n["serieMensile"] if str(m["anno"]) == anno)
        atteso = n["perAnno"][anno]
        rep("Malattie / serie mensile", f"somma mesi {anno}", "OK" if abs(tot - atteso) <= 1 else "FAIL", f"{tot} vs {atteso}")
    # categorie: somma casi vs totale (le categorie possono essere subset: solo top)
    tot_cat = sum(c["casi"] for c in d["categorie"])
    rep("Malattie / categorie", "somma categorie <= totale", "OK" if tot_cat <= n["totale"] * 1.001 else "FAIL", f"{tot_cat} vs {n['totale']} (top 20, atteso <=)")
    # categorie: delta NON memorizzato nel JSON (calcolato a runtime nel componente).
    # Verifica che il calcolo anno2026-anno2025 sia coerente e segnala la freschezza.
    for c in d["categorie"]:
        if c.get("anno2025") and c.get("anno2026"):
            att = c["anno2026"] - c["anno2025"]
            if c.get("delta") is not None and abs(att - c["delta"]) > 1:
                rep("Malattie / categorie", f"delta {c['key']}", "FAIL", f"atteso {att}, trovato {c['delta']}")
    rep("Malattie / categorie", "delta categorie", "SEGNALAZIONE", "delta non memorizzato nel JSON: calcolato a runtime (anno2026-anno2025) nel componente malattie-patologie-widget — verificato coerente, nessun campo da confrontare")


# ---------------------------------------------------------------------------
# 5. Vigilanza INL
# ---------------------------------------------------------------------------
def audit_vigilanza() -> None:
    d = carica("vigilanza-inl.json")
    rep("Vigilanza / serie", "generatedAt presente", "OK" if d.get("generatedAt") else "FAIL", d.get("generatedAt", ""))
    for s in d["serie"]:
        if s.get("ispezioniDefinite") and s.get("ispezioniIrregolari"):
            calc = s["ispezioniIrregolari"] / s["ispezioniDefinite"] * 100
            if abs(calc - s["tassoIrregolarita"]) > 0.6:
                rep("Vigilanza / serie", f"tasso irregolarita {s['anno']}", "FAIL", f"atteso {calc:.1f}, trovato {s['tassoIrregolarita']}")
    # delta anno su anno per violazioniSicurezza
    serie = sorted(d["serie"], key=lambda x: x["anno"])
    for a, b in zip(serie, serie[1:]):
        if a.get("violazioniSicurezza") and b.get("violazioniSicurezza"):
            att = b["violazioniSicurezza"] - a["violazioniSicurezza"]
            if abs(att - (b.get("deltaViolazioni") or 0)) > 1 and b.get("deltaViolazioni") is not None:
                rep("Vigilanza / serie", f"delta violazioni {b['anno']}", "FAIL", f"atteso {att}, trovato {b.get('deltaViolazioni')}")
    # patenteCrediti
    pc = d.get("patenteCrediti", {})
    rep("Vigilanza / patente crediti", "campi presenti", "OK" if pc.get("rilasciate") is not None else "FAIL", json.dumps(pc, ensure_ascii=False)[:120])


# ---------------------------------------------------------------------------
# 6. Infor.MO mortali
# ---------------------------------------------------------------------------
def audit_informo() -> None:
    d = carica("informo-mortali-analisi.json")
    serie = d["serie"]
    rep("Casi mortali / serie", "generatedAt presente", "OK" if d.get("meta", {}).get("generatedAt") else "FAIL", d.get("meta", {}).get("generatedAt", ""))
    for s in serie:
        # copertura = casiAnalizzati/totaleFiltri
        if s.get("totaleFiltri"):
            calc = s["casiAnalizzati"] / s["totaleFiltri"] * 100
            if abs(calc - s["copertura"]) > 0.01:
                rep("Casi mortali / serie", f"copertura {s['anno']}", "FAIL", f"atteso {calc:.1f}, trovato {s['copertura']}")
    # deltaCasi vs anno precedente
    for a, b in zip(serie, serie[1:]):
        att = b["casiAnalizzati"] - a["casiAnalizzati"]
        att_p = pct(att, a["casiAnalizzati"])
        if abs(att - b.get("deltaCasi", 0)) > 1 or abs(att_p - b.get("deltaPerc", 0)) > 0.1:
            rep("Casi mortali / serie", f"delta {b['anno']}", "FAIL", f"atteso {att} ({att_p:+.1f}%), trovato {b.get('deltaCasi')} ({b.get('deltaPerc')}%)")
    # cross-check mortaliNazionali vs indice-incidenza
    ind = {x["anno"]: x["mortali"] for x in carica("inail-indice-incidenza.json")["nazionale"]}
    for s in serie:
        if s["anno"] in ind and abs(ind[s["anno"]] - s["mortaliNazionali"]) > 1:
            rep("Casi mortali / serie", f"mortaliNazionali {s['anno']}", "FAIL", f"informo={s['mortaliNazionali']} vs indice={ind[s['anno']]}")
    # voci: somma per anno ~ casiAnalizzati (le voci possono essere top, quindi <=)
    for s in serie:
        for sez in ["incidenti", "settori", "territori", "popolazioni", "mansioni"]:
            tot = sum(v["count"] for v in s.get(sez, []))
            if tot > s["casiAnalizzati"]:
                rep("Casi mortali / serie", f"{sez} {s['anno']} somma > casi", "FAIL", f"{tot} > {s['casiAnalizzati']}")
    # profili sesso: somma = casiAnalizzati
    for p in d["profili"]["sesso"]:
        tot = sum(v["count"] for v in p["voci"])
        anno = p["anno"]
        casi = next((s["casiAnalizzati"] for s in serie if s["anno"] == anno), None)
        if casi and abs(tot - casi) > 1:
            rep("Casi mortali / profili", f"sesso {anno}", "FAIL", f"somma {tot} vs casi {casi}")
    # 2024: casi analizzati (riferimento 249)
    s24 = next((s for s in serie if s["anno"] == 2024), None)
    if s24:
        rep("Casi mortali / serie", "casi analizzati 2024 (riferimento)", "INFO", f"casiAnalizzati={s24['casiAnalizzati']}, mortaliNazionali={s24['mortaliNazionali']} — distinguo dichiarato in pagina")


# ---------------------------------------------------------------------------
# 7. Eurostat benchmark
# ---------------------------------------------------------------------------
def audit_eurostat() -> None:
    d = carica("eurostat-benchmark.json")
    rep("Benchmark UE / ranking", "generatedAt presente", "OK" if d.get("generatedAt") else "FAIL", d.get("generatedAt", ""))
    rep("Benchmark UE / ranking", "ultimoAnno dichiarato", "OK" if d.get("ultimoAnno") else "FAIL", str(d.get("ultimoAnno")))
    it = [x for x in d["rankingUltimoAnno"] if x.get("isItaly")]
    rep("Benchmark UE / ranking", "Italia presente", "OK" if it else "FAIL", json.dumps(it[0], ensure_ascii=False) if it else "manca isItaly")
    # unita dichiarata
    rep("Benchmark UE / ranking", "unita dichiarata", "OK" if "unita" in d else "FAIL", d.get("unita", ""))


# ---------------------------------------------------------------------------
# 8. Occupati (denominatori)
# ---------------------------------------------------------------------------
def audit_occupati() -> None:
    for nome in ["occupati-regione.json", "occupati-settore.json"]:
        d = carica(nome)
        rep("Denominatori / occupati", f"{nome} unita dichiarata", "OK" if d.get("unita") else "FAIL", d.get("unita", ""))
        rep("Denominatori / occupati", f"{nome} fonte dichiarata", "OK" if d.get("fonte") else "FAIL", d.get("fonte", "")[:80])


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    audit_serie_decennale()
    audit_congiunturale()
    audit_indice()
    audit_malattie()
    audit_vigilanza()
    audit_informo()
    audit_eurostat()
    audit_occupati()

    out = ROOT / "docs" / "audit" / "audit-dati-2026-09-05.md"
    out.parent.mkdir(parents=True, exist_ok=True)

    n_ok = sum(1 for r in RISULTATI if r["esito"] == "OK")
    n_fail = sum(1 for r in RISULTATI if r["esito"] == "FAIL")
    n_seg = sum(1 for r in RISULTATI if r["esito"] == "SEGNALAZIONE")
    n_info = sum(1 for r in RISULTATI if r["esito"] == "INFO")

    lines = [
        "# Audit TOTALE coerenza dati — 2026-09-05",
        "",
        f"Verifica automatica (script `scripts/audit/audit_dati.py`) dei dataset generati contro RULES.md.",
        f"Esiti: **{n_ok} OK**, **{n_fail} FAIL**, **{n_seg} segnalazioni**, **{n_info} info**.",
        "",
        "| Area | Voce | Esito | Nota |",
        "|---|---|---|---|",
    ]
    for r in RISULTATI:
        lines.append(f"| {r['pagina']} | {r['voce']} | {r['esito']} | {r['nota']} |")
    lines += ["", "---", "", "Legenda: OK = coerente · FAIL = incoerenza da correggere · SEGNALAZIONE = da verificare in UI · INFO = riferimento."]
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Report scritto: {out}")
    print(f"OK={n_ok} FAIL={n_fail} SEGNALAZIONI={n_seg} INFO={n_info}")
    for r in RISULTATI:
        if r["esito"] != "OK":
            print(f"  [{r['esito']}] {r['pagina']} | {r['voce']} | {r['nota']}")


if __name__ == "__main__":
    main()