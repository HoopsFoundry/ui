#!/usr/bin/env node
/**
 * Migrationsskript für Konsumenten: schreibt in einem fremden Projekt die alten DSS-Namen auf die neuen (HoopsFoundry UI) um.
 *
 *   node scripts/migrate-from-dss.mjs <projektordner>                  # Probelauf (Standard): meldet Treffer je Datei, schreibt nichts
 *   node scripts/migrate-from-dss.mjs <projektordner> --write          # schreibt die Dateien um
 *   node scripts/migrate-from-dss.mjs <projektordner> --stufen=T       # nur bestimmte Stufen (Standard: alle vorhandenen)
 *   node scripts/migrate-from-dss.mjs <projektordner> --ext=.css,.vue  # eigene Endungsliste statt der Standardliste
 *   node scripts/migrate-from-dss.mjs <projektordner> --json           # Ergebnis als JSON
 *
 * Aktuell umgesetzt: Stufe T (Design-Tokens, CSS-Custom-Properties). Die Ersetzungstabellen stehen in scripts/migration-table.mjs; spätere
 * Stufen (Klassen, data-Attribute, Ereignisse, Dateinamen) ergänzen dort weitere Tabellen.
 *
 * Vor `--write` den Git-Stand sichern (committen oder `git stash`). Zurücknehmen: `git restore .` (bzw. `git checkout -- .`) im Projekt.
 * Idempotent: ein zweiter Lauf findet nichts mehr. Ignoriert node_modules, .git, dist, build und weitere erzeugte Ordner.
 * Nur Node-APIs, keine Shell.
 */
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { STUFEN } from './migration-table.mjs';
import { buildRegexes, tableFromPairs, transformText } from './lib/token-rename.mjs';

export const STANDARD_ENDUNGEN = ['.css', '.scss', '.sass', '.less', '.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.svelte', '.vue', '.mdx', '.md'];
export const IGNORIERT = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit', '.output', '.turbo', '.cache', 'coverage', 'storybook-static']);
const MAX_BYTES = 5 * 1024 * 1024;

async function* walk(dir, root, endungen) {
  for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { if (!IGNORIERT.has(e.name)) yield* walk(full, root, endungen); continue; }
    if (e.isFile() && endungen.has(extname(e.name).toLowerCase())) yield full;
  }
}

/**
 * Wendet die gewählten Stufen auf ein Projekt an. `write: false` (Standard) schreibt nichts.
 * Rückgabe: { files: [{ file, hits: { alt: Anzahl }, total }], total, written }
 */
export async function migrateProject(root, { write = false, stufen = null, endungen = STANDARD_ENDUNGEN } = {}) {
  const base = resolve(root);
  const info = await lstat(base).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`Kein Ordner: ${root}`);
  const gewaehlt = STUFEN.filter(([id]) => !stufen || stufen.includes(id));
  if (gewaehlt.length === 0) throw new Error(`Keine passende Stufe (vorhanden: ${STUFEN.map(([id]) => id).join(', ')})`);
  const tables = gewaehlt.map(([, , pairs]) => { const t = tableFromPairs(pairs); return [t, buildRegexes(t)]; });
  const files = [];
  let total = 0;
  let written = 0;
  for await (const file of walk(base, base, new Set(endungen))) {
    const st = await lstat(file);
    if (st.size > MAX_BYTES) continue;
    const text = await readFile(file, 'utf8');
    if (text.includes('\u0000')) continue;
    let current = text;
    const hits = {};
    for (const [table, regexes] of tables) {
      const r = transformText(current, table, regexes);
      current = r.text;
      for (const [k, v] of r.hits) hits[k] = (hits[k] ?? 0) + v;
    }
    if (current === text) continue;
    const n = Object.values(hits).reduce((a, b) => a + b, 0);
    files.push({ file: relative(base, file).split(sep).join('/'), hits, total: n });
    total += n;
    if (write) { await writeFile(file, current); written++; }
  }
  return { files, total, written };
}

async function main() {
  const argv = process.argv.slice(2);
  const pos = argv.filter((a) => !a.startsWith('--'));
  const opt = (k) => argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  const write = argv.includes('--write');
  if (pos.length !== 1 || (write && argv.includes('--dry-run'))) {
    console.error('Aufruf: migrate-from-dss.mjs <projektordner> [--dry-run | --write] [--stufen=T] [--ext=.css,.vue] [--json]');
    process.exit(2);
  }
  const stufen = opt('stufen')?.split(',').map((s) => s.trim().toUpperCase());
  const endungen = opt('ext')?.split(',').map((s) => (s.startsWith('.') ? s : `.${s}`).toLowerCase());
  let result;
  try { result = await migrateProject(pos[0], { write, stufen, endungen }); }
  catch (error) { console.error(error.message); process.exit(2); }
  if (argv.includes('--json')) { console.log(JSON.stringify({ write, ...result }, null, 2)); return; }
  for (const f of result.files) {
    console.log(`${write ? 'geändert' : 'würde ändern'}: ${f.file} (${f.total})`);
    for (const [alt, n] of Object.entries(f.hits)) console.log(`    ${alt} ×${n}`);
  }
  console.log(`\n${result.files.length} Dateien, ${result.total} Treffer${write ? `, ${result.written} Dateien geschrieben` : ' (Probelauf, nichts geschrieben; zum Schreiben --write)'}.`);
  if (write) console.log('Rückgängig machen: im Projekt `git restore .` (vorher den Git-Stand gesichert haben).');
  else if (result.files.length) console.log('Vor --write den Git-Stand sichern (committen oder `git stash`); zurücknehmen mit `git restore .`.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
