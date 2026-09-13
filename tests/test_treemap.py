import json
m = json.load(open("src/data/generated/inail-multidimensionale.json"))
print("AtecoMacro 2024:", m["perAnno"]["2024"]["atecoMacro"][:6])
print("AtecoDivisioni 2024:", m["perAnno"]["2024"]["atecoDivisioni"][:6])
