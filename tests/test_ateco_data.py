import json

m = json.load(open("src/data/generated/inail-multidimensionale.json"))
y24 = m["perAnno"]["2024"]

# Macro
print("Macro 2024:", len(y24["atecoMacro"]), "settori")
assert len(y24["atecoMacro"]) == 22

# Divisioni: tutte, con nome e sezione
divs = y24["atecoDivisioni"]
print("Divisioni 2024:", len(divs), "divisioni")
assert len(divs) == 86, f"attese 86 divisioni, trovate {len(divs)}"

# Ogni divisione ha chiave, nome, sezione, casi
for d in divs:
    assert d["key"] and d.get("nome"), f"divisione senza nome: {d}"
    assert d.get("sezione"), f"divisione senza sezione: {d}"
    assert d["casi"] >= 0

# Top: esiste ancora come sotto-vista
top = y24.get("atecoDivisioniTop")
print("Top divisioni 2024:", len(top) if top else 0)
assert top and len(top) == 20

# Serie per divisione
serie = m.get("atecoDivisioneSerie")
print("Serie per divisione:", len(serie), "divisioni")
assert serie and len(serie) == 86
assert set(m["anniDisponibili"]) == set(serie["H 52"].keys())

# Confronto: casi 2024 per H 52 = somma lavoro + itinere
record = next(d for d in divs if d["key"] == "H 52")
assert record["lavoro"] + record["itinere"] == record["casi"], (
    f"casi H 52 non coerente: {record}"
)

print("OK: tutti gli assert superati")