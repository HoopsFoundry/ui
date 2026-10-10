// Farb- und Kontrastrechnung für CSS-Tests: liest Token-Definitionen aus dem CSS-Text und rechnet WCAG-Kontrast.
export type Rgb = [number, number, number];

export const blockOf = (src: string, head: string): string => {
  const start = src.indexOf(head);
  if (start < 0) throw new Error(`Block nicht gefunden: ${head}`);
  const open = src.indexOf('{', start);
  return src.slice(open + 1, src.indexOf('}', open));
};

export const defOf = (src: string, name: string): string => {
  const m = src.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  if (!m) throw new Error(`Token nicht gefunden: ${name}`);
  return m[1].trim();
};

const num = (expr: string, scope: string): number => {
  const e = expr.trim();
  const v = e.match(/^var\((--[\w-]+)\)$/);
  if (v) return num(defOf(scope, v[1]), scope);
  const c = e.match(/^calc\(\s*(.+?)\s*([+-])\s*([\d.]+)\s*\)$/);
  if (c) return num(c[1], scope) + (c[2] === '+' ? 1 : -1) * Number(c[3]);
  return Number(e);
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));

export const oklch = (L: number, C: number, h: number): Rgb => {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
};

/** Löst `oklch(L C H)` (Farbton auch als var()) und `var(--token)` im gegebenen Token-Text auf. */
export const color = (expr: string, scope: string): Rgb => {
  const e = expr.trim();
  const v = e.match(/^var\((--[\w-]+)\)$/);
  if (v) return color(defOf(scope, v[1]), scope);
  const o = e.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+(.+)\)$/);
  if (!o) throw new Error(`Keine oklch-Farbe: ${expr}`);
  return oklch(Number(o[1]), Number(o[2]), num(o[3], scope));
};

export const lum = (c: Rgb) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
export const ratio = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
export const hex = (h: string): Rgb =>
  [1, 3, 5].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as Rgb;

const toGamma = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** Farbe `fg` mit Deckkraft `alpha` über `bg`, gemischt wie der Browser (in sRGB, nicht linear). */
export const over = (fg: Rgb, bg: Rgb, alpha: number): Rgb =>
  fg.map((c, i) => toLinear(alpha * toGamma(c) + (1 - alpha) * toGamma(bg[i]))) as Rgb;
