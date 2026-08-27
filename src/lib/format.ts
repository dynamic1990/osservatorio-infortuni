export function compactNumber(value?: number | string | null): string {
  if (value === undefined || value === null || value === "") return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} M`;
  if (num >= 1_000) return `${(num / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} k`;
  return num.toLocaleString("it-IT");
}

export function exactNumber(value?: number | string | null): string {
  if (value === undefined || value === null || value === "") return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";
  return num.toLocaleString("it-IT");
}

export function percent(value?: number | string | null, digits = 1): string {
  if (value === undefined || value === null || value === "") return "0,0%";
  const num = Number(value);
  if (isNaN(num)) return "0,0%";
  return `${(num * 100).toLocaleString("it-IT", { maximumFractionDigits: digits })}%`;
}

export function monthName(mese: number): string {
  const nomi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return nomi[mese - 1] || `m${mese}`;
}

export function longDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}
