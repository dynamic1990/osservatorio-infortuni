// Genera public/og-image.png (1200x630, formato social standard)
// Stile: design system del sito (--color-accent #f36458, --color-text #1a1a1a, font display Georgia/Liberation Serif)
import sharp from "sharp";
import { execSync } from "node:child_process";
import fs from "node:fs";

const OUT = new URL("../public/og-image.png", import.meta.url).pathname;
const W = 1200;
const H = 630;

function fontPath(name) {
  const p = execSync(`fc-match -f '%{file}' '${name}'`, { encoding: "utf8" }).trim();
  return p;
}

const serif = fontPath("Liberation Serif");
const sans = fontPath("Liberation Sans");

const TEXT_BG = "#ffffff";
const ACCENT = "#f36458";
const DARK = "#1a1a1a";
const SOFT = "#6e6e6e";

// SVG di base: fondo, barra accent, titolo + sottotitolo + baseline
const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${TEXT_BG}"/>
  <rect x="0" y="0" width="14" height="${H}" fill="${ACCENT}"/>
  <rect x="70" y="140" width="250" height="6" fill="${ACCENT}"/>
  <text x="70" y="250" font-family="Liberation Serif, Georgia, serif" font-size="64" fill="${DARK}" font-weight="bold">Osservatorio Infortuni</text>
  <text x="70" y="320" font-family="Liberation Serif, Georgia, serif" font-size="64" fill="${DARK}" font-weight="bold">sul Lavoro</text>
  <text x="70" y="390" font-family="Liberation Sans, Arial, sans-serif" font-size="26" fill="${SOFT}">Dati e indicatori statistici INAIL · Serie 2014-2024</text>
  <text x="70" y="540" font-family="Liberation Sans, Arial, sans-serif" font-size="22" fill="${SOFT}">osservatorioinfortuni.it</text>
</svg>`;

await sharp(Buffer.from(svg))
  .flatten({ background: TEXT_BG })
  .png()
  .toFile(OUT);

console.log("og-image.png generato:", fs.statSync(OUT).size, "bytes");