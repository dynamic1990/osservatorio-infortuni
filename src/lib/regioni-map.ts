// Corrispondenza tra codice regione INAIL e id/path SVG della mappa Italia
// (@svg-maps/italy). Le regioni nella mappa usano nomi inglesi.

export const REGIONI_MAP_ID: Record<string, string> = {
  "01": "piedmont",
  "02": "aosta-valley",
  "03": "lombardy",
  "04": "trentino-south-tyrol",
  "05": "veneto",
  "06": "friuli-venezia-giulia",
  "07": "liguria",
  "08": "emilia-romagna",
  "09": "tuscany",
  "10": "umbria",
  "11": "marche",
  "12": "lazio",
  "13": "abruzzo",
  "14": "molise",
  "15": "campania",
  "16": "apulia",
  "17": "basilicata",
  "18": "calabria",
  "19": "sicily",
  "20": "sardinia",
};

export const MAP_ID_REGIONE: Record<string, string> = Object.fromEntries(
  Object.entries(REGIONI_MAP_ID).map(([k, v]) => [v, k]),
);
