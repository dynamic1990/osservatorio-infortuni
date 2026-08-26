export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} M`;
  if (value >= 1_000) return `${(value / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} k`;
  return value.toLocaleString("it-IT");
}

export function exactNumber(value: number): string {
  return value.toLocaleString("it-IT");
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toLocaleString("it-IT", { maximumFractionDigits: digits })}%`;
}

export function monthName(mese: number): string {
  const nomi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return nomi[mese - 1];
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
