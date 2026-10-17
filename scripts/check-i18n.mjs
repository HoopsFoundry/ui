#!/usr/bin/env node
// Prüft die Kataloge unter js/i18n/: fehlende und überzählige Schlüssel gegenüber `en`, abweichende Platzhalter,
// unvollständige Mehrzahlformen (nach Intl.PluralRules der Sprache) und mit --unused Schlüssel ohne Verwendung.
//   node scripts/check-i18n.mjs [--locale=xx] [--unused]
// Exit 1 bei Fehlern. Meldungen deutsch.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Dateien unter js/i18n/, die keine Kataloge sind (Kern, Hilfen, Registrierung)
const NOT_CATALOG = new Set(['index.js', 'format.js', 'lang.js', 'text-table.js', 'de-register.js']);

const forms = (value) => (typeof value === 'string' ? [value] : Object.values(value));
const holders = (text) => [...String(text).matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]).sort().join(',');
const isPlural = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Prüft Kataloge (`{ code: katalog }`) gegen den Bezug `en`. Gibt eine Liste deutscher Fehlermeldungen zurück.
 * `only` beschränkt auf eine Sprache.
 */
export function checkCatalogs(catalogs, only) {
  const errors = [];
  const base = catalogs.en;
  if (!base) return ['Der englische Katalog (en) fehlt.'];
  for (const [code, catalog] of Object.entries(catalogs)) {
    if (only && code !== only) continue;
    for (const key of Object.keys(base)) {
      if (!(key in catalog)) errors.push(`${code}: Schlüssel fehlt: ${key}`);
    }
    for (const key of Object.keys(catalog)) {
      if (!(key in base)) errors.push(`${code}: Schlüssel überzählig (nicht in en): ${key}`);
    }
    let categories;
    try {
      categories = new Intl.PluralRules(code).resolvedOptions().pluralCategories;
    } catch {
      errors.push(`${code}: unbekannter Sprachcode für Mehrzahlregeln`);
      categories = ['one', 'other'];
    }
    for (const [key, value] of Object.entries(catalog)) {
      if (!(key in base)) continue;
      const ref = base[key];
      if (isPlural(value) !== isPlural(ref)) {
        errors.push(`${code}: ${key}: Art weicht von en ab (${isPlural(ref) ? 'Mehrzahl' : 'Text'} erwartet)`);
        continue;
      }
      if (isPlural(value)) {
        const missing = categories.filter((c) => typeof value[c] !== 'string' || !value[c].trim());
        if (missing.length) errors.push(`${code}: ${key}: Mehrzahlformen fehlen: ${missing.join(', ')} (Pflicht nach Intl.PluralRules; one und other sind immer nötig)`);
        if (typeof value.other !== 'string') errors.push(`${code}: ${key}: Form other fehlt`);
      }
      const want = holders(forms(ref)[0]);
      for (const text of forms(value)) {
        if (typeof text !== 'string' || !text.trim()) {
          errors.push(`${code}: ${key}: leerer Wert`);
        } else if (holders(text) !== want) {
          errors.push(`${code}: ${key}: Platzhalter weichen ab (erwartet {${want.split(',').filter(Boolean).join('}, {')}}, gefunden {${holders(text).split(',').filter(Boolean).join('}, {')}})`);
        }
      }
    }
  }
  return errors;
}

/** Schlüssel, die in `sources` (Text je Datei) nirgends als Zeichenkette vorkommen. */
export function unusedKeys(keys, sources) {
  const text = sources.join('\n');
  return keys.filter((key) => !text.includes(`'${key}'`) && !text.includes(`"${key}"`) && !text.includes(`\`${key}\``));
}

/** Quelltexte, in denen Schlüssel verwendet werden: svelte/, react/, js/ (ohne js/i18n/, ohne Tests und Typdateien). */
export function usageSources(root = ROOT) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (path !== 'js/i18n') walk(path);
      } else if (/\.(svelte|tsx?|js)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) {
        out.push(readFileSync(join(root, path), 'utf8'));
      }
    }
  };
  for (const dir of ['svelte', 'react', 'js']) walk(dir);
  // js/i18n/format.js bildet die Himmelsrichtungen (common.direction.*) mit ausgeschriebenen Schlüsseln und gehört deshalb zu den Quellen (die übrigen Dateien
  // unter js/i18n/ sind Kern und Kataloge, in denen jeder Schlüssel steht)
  out.push(readFileSync(join(root, 'js/i18n/format.js'), 'utf8'));
  return out;
}

/** Prüft die Zulassungsliste: Schlüssel, die schon verwendet werden, müssen aus der Liste verschwinden; unverwendete müssen drinstehen. */
export function checkAllowlist(keys, allowlist, sources) {
  const errors = [];
  const unused = new Set(unusedKeys(keys, sources));
  for (const key of keys) {
    if (unused.has(key) && !(key in allowlist)) errors.push(`Schlüssel ohne Verwendung und nicht in scripts/i18n-unused-allowlist.json: ${key}`);
    if (!unused.has(key) && key in allowlist) errors.push(`Schlüssel wird verwendet, steht aber noch in scripts/i18n-unused-allowlist.json (Eintrag entfernen): ${key}`);
  }
  for (const key of Object.keys(allowlist)) if (!keys.includes(key)) errors.push(`Eintrag der Zulassungsliste ohne Katalogschlüssel: ${key}`);
  return errors;
}

/** Lädt alle Kataloge aus js/i18n/ (Dateiname = Sprachcode). */
export async function loadCatalogs(root = ROOT) {
  const dir = join(root, 'js/i18n');
  const out = {};
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith('.js') || NOT_CATALOG.has(name)) continue;
    out[name.slice(0, -3)] = (await import(pathToFileURL(join(dir, name)).href)).default;
  }
  return out;
}

async function main(argv) {
  const only = argv.map((a) => a.match(/^--locale=(.+)$/)).find(Boolean)?.[1];
  const catalogs = await loadCatalogs();
  if (only && !catalogs[only]) {
    console.error(`Kein Katalog für die Sprache ${only} unter js/i18n/.`);
    return 1;
  }
  let errors = checkCatalogs(catalogs, only);
  if (argv.includes('--unused')) {
    const allowlist = JSON.parse(readFileSync(join(ROOT, 'scripts/i18n-unused-allowlist.json'), 'utf8'));
    errors = errors.concat(checkAllowlist(Object.keys(catalogs.en), allowlist, usageSources()));
  }
  const langs = Object.keys(catalogs).filter((c) => !only || c === only);
  if (errors.length) {
    for (const message of errors) console.error(message);
    console.error(`${errors.length} Fehler in den Katalogen (${langs.join(', ')}).`);
    return 1;
  }
  console.log(`Kataloge in Ordnung: ${langs.join(', ')} (${Object.keys(catalogs.en).length} Schlüssel).`);
  return 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) process.exitCode = await main(process.argv.slice(2));
