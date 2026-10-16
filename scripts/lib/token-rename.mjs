/**
 * Gemeinsame Ersetzungslogik für die Umbenennung der Design-Tokens (CSS-Custom-Properties).
 * Genutzt vom einmaligen Codemod (scripts/codemod-tokens.mjs), vom Migrationsskript für Konsumenten
 * (scripts/migrate-from-dss.mjs) und von den Tests. Reine Funktionen, keine Dateizugriffe.
 *
 * Regel: `--dss-foo` → `--hoops-foo`, `--_dss-foo` → `--_hoops-foo`, `--foo` (unpräfixiert, von uns definiert) → `--hoops-foo`.
 * Fremde Variablen (Leaflet, Storybook, Tailwind …) stehen nicht in der Tabelle und bleiben unverändert.
 */

export const NEW_PREFIX = 'hoops';

/**
 * Aufgelöste Kollisionen: `--surface-N` (Seitenflächen im Seitenrahmen) würde wie `--dss-surface-2` (Flächen der Komponenten, im
 * Dunkelmodus andere Werte) zu `--hoops-surface-2`. Die Seitenflächen stehen bei `--page-*` und heißen deshalb `--hoops-page-surface-N`.
 */
export const OVERRIDES = new Map([
  ['--surface-0', '--hoops-page-surface-0'],
  ['--surface-1', '--hoops-page-surface-1'],
  ['--surface-2', '--hoops-page-surface-2'],
]);

/** Neuer Name zu einem alten (beide mit führendem `--`). */
export function renameToken(name) {
  if (OVERRIDES.has(name)) return OVERRIDES.get(name);
  if (!/^--[a-zA-Z_][\w-]*$/.test(name)) throw new Error(`Kein Custom-Property-Name: ${name}`);
  if (name.startsWith('--_dss-')) return `--_${NEW_PREFIX}-${name.slice(7)}`;
  if (name.startsWith('--dss-')) return `--${NEW_PREFIX}-${name.slice(6)}`;
  if (name.startsWith(`--${NEW_PREFIX}-`) || name.startsWith(`--_${NEW_PREFIX}-`)) return name;
  return `--${NEW_PREFIX}-${name.slice(2)}`;
}

/** Alle Teilpräfixe bis zu einem Bindestrich: `--dss-chip-ok-bg` → `--dss-`, `--dss-chip-`, `--dss-chip-ok-`. */
export function prefixesOf(name) {
  const out = [];
  for (let i = name.indexOf('-', 2); i !== -1; i = name.indexOf('-', i + 1)) out.push(name.slice(0, i + 1));
  return out;
}

/**
 * Tabelle aus den Namen: `names` (alt → neu, ganze Namen) und `prefixes` (alt → neu, für Schablonen wie `--ink-${step}`,
 * `--fs-*`, `'--n-'`). Meldet Kollisionen (zwei alte Namen, die denselben neuen ergeben) als Fehler.
 */
export function buildTable(oldNames) {
  const names = new Map();
  const seen = new Map();
  for (const old of [...new Set(oldNames)].sort()) {
    const next = renameToken(old);
    if (next === old) continue;
    if (seen.has(next)) throw new Error(`Kollision: ${old} und ${seen.get(next)} ergeben beide ${next}`);
    seen.set(next, old);
    names.set(old, next);
  }
  const prefixes = new Map();
  for (const [old, next] of names) {
    if (OVERRIDES.has(old)) continue;
    // Nur der Kopf des Namens ändert sich; das Präfix entspricht dem gleich langen Kopf des neuen Namens (abzüglich der Längendifferenz).
    for (const p of prefixesOf(old)) if (!names.has(p)) prefixes.set(p, next.slice(0, next.length - (old.length - p.length)));
  }
  return { names, prefixes };
}

/** Tabelle aus gespeicherten Paaren `[alt, neu]` (scripts/migration-table.mjs); leitet die Schablonen-Präfixe wie `buildTable` ab. */
export function tableFromPairs(pairs) {
  const names = new Map(pairs);
  const prefixes = new Map();
  for (const [old, next] of names) {
    if (OVERRIDES.has(old)) continue;
    for (const p of prefixesOf(old)) if (!names.has(p)) prefixes.set(p, next.slice(0, next.length - (old.length - p.length)));
  }
  return { names, prefixes };
}

const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Nach einem Präfix erlaubt: Schablone `${`, Platzhalter `*`, Zeichenklasse `[`, Gruppe `(`, Alternative `|`, Auslassung `…`, Anführungszeichen, `/`. */
const PREFIX_FOLLOW = '(?=\\$\\{|[*\\[(|…\'"`/])';

export function buildRegexes(table) {
  const alt = (keys) => [...keys].sort((a, b) => b.length - a.length).map(escapeForRegex).join('|');
  // Wortgrenzen: davor weder Wort- noch Bindestrich (kein Treffer in `dss-btn--sm` oder `--ink-0` innerhalb `--x-ink-0`),
  // dahinter ebenso nicht (kein Treffer von `--n-0` in `--n-050`).
  const exact = table.names.size ? new RegExp(`(?<![\\w-])(${alt(table.names.keys())})(?![\\w-])`, 'g') : null;
  const prefix = table.prefixes.size ? new RegExp(`(?<![\\w-])(${alt(table.prefixes.keys())})${PREFIX_FOLLOW}`, 'g') : null;
  return { exact, prefix };
}

/** Ersetzt in einem Text; gibt Text und Zahl der Treffer je alter Name zurück. */
export function transformText(text, table, regexes = buildRegexes(table)) {
  const hits = new Map();
  const bump = (k) => hits.set(k, (hits.get(k) ?? 0) + 1);
  let out = text;
  if (regexes.exact) out = out.replace(regexes.exact, (m) => { bump(m); return table.names.get(m); });
  if (regexes.prefix) out = out.replace(regexes.prefix, (m) => { bump(m); return table.prefixes.get(m); });
  return { text: out, hits };
}
