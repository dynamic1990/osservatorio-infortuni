import json

m = json.load(open("src/data/generated/inail-multidimensionale.json"))
y24 = m["perAnno"]["2024"]
print("Macro 2024:", y24["atecoMacro"])
print("Divisioni 2024 (top 10):", y24["atecoDivisioni"][:10])
