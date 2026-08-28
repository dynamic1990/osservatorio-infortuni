import zipfile, csv, io
from collections import defaultdict
from pathlib import Path

zpath = Path('projects/osservatorio-infortuni/data/raw/semestrale-TrentinoAltoAdige.zip')
prov_stats = defaultdict(lambda: defaultdict(lambda: {
    'totale': 0, 'mortali': 0, 'giorni': 0, 'menomati': 0, 'lavoro': 0, 'itinere': 0,
    'indennizzati_temp': 0
}))

with zipfile.ZipFile(zpath) as z:
    for name in z.namelist():
        if name.endswith('.csv'):
            with z.open(name) as f:
                reader = csv.DictReader(io.TextIOWrapper(f, encoding='iso-8859-1'), delimiter=';')
                for row in reader:
                    luogo = row.get('LuogoAccadimento', '').strip()
                    dt = row.get('DataAccadimento', '').strip()
                    parts = dt.split('/')
                    if len(parts) == 3:
                        y = parts[2]
                        if y in ['2020', '2021', '2022', '2023', '2024']:
                            s = prov_stats[luogo][y]
                            s['totale'] += 1
                            if row.get('DataMorte', '').strip(): s['mortali'] += 1
                            if row.get('ModalitaAccadimento', '').strip() == 'S': s['itinere'] += 1
                            else: s['lavoro'] += 1
                            try:
                                gm = int(row.get('GradoMenomazione', -1))
                                if gm >= 0: s['menomati'] += 1
                            except: pass
                            try:
                                g = int(row.get('GiorniIndennizzati', 0))
                                if g > 0:
                                    s['giorni'] += g
                                    s['indennizzati_temp'] += 1
                            except: pass

print("Provinces in Trentino-Alto Adige:", list(prov_stats.keys()))
for p in sorted(prov_stats.keys()):
    print(f"--- Prov {p} ---")
    for y in ['2020', '2021', '2022', '2023', '2024']:
        print(f"  {y}: {dict(prov_stats[p][y])}")
