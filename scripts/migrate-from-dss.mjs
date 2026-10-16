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

export const STANDARD_ENDUNGEN = ['.css', '.scss', '.sass', '.less', '.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.svelte', '.vue', '.mdx', '.md', '.svg'];
export const IGNORIERT = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit', '.output', '.turbo', '.cache', 'coverage', 'storybook-static']);
const MAX_BYTES = 5 * 1024 * 1024;

/** Liefert Dateien `{ file }` und Übersprungenes `{ skip, grund }` (Symlinks werden nie verfolgt, aber genannt). */
async function* walk(dir, root, endungen) {
  for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) { yield { skip: full, grund: 'Symlink (wird nicht verfolgt)' }; continue; }
    if (e.isDirectory()) { if (!IGNORIERT.has(e.name)) yield* walk(full, root, endungen); continue; }
    if (e.isFile() && endungen.has(extname(e.name).toLowerCase())) yield { file: full };
  }
}

const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/**
 * Wendet die gewählten Stufen auf ein Projekt an. `write: false` (Standard) schreibt nichts.
 * Rückgabe: { files: [{ file, hits: { alt: Anzahl }, total }], total, written, skipped: [{ file, grund }] }.
 * Nie überschrieben werden Dateien, die kein gültiges UTF-8 sind (zum Beispiel Latin-1) oder Nullbytes enthalten, Symlinks und Dateien über 5 MiB;
 * sie stehen in `skipped`.
 */
export async function migrateProject(root, { write = false, stufen = null, endungen = STANDARD_ENDUNGEN } = {}) {
  const base = resolve(root);
  const info = await lstat(base).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`Kein Ordner: ${root}`);
  const gewaehlt = STUFEN.filter(([id]) => !stufen || stufen.includes(id));
  if (gewaehlt.length === 0) throw new Error(`Keine passende Stufe (vorhanden: ${STUFEN.map(([id]) => id).join(', ')})`);
  const tables = gewaehlt.map(([, , pairs]) => { const t = tableFromPairs(pairs); return [t, buildRegexes(t)]; });
  const files = [];
  const skipped = [];
  const rel = (f) => relative(base, f).split(sep).join('/');
  let total = 0;
  let written = 0;
  for await (const entry of walk(base, base, new Set(endungen))) {
    if (entry.skip) { skipped.push({ file: rel(entry.skip), grund: entry.grund }); continue; }
    const file = entry.file;
    const st = await lstat(file);
    if (st.size > MAX_BYTES) { skipped.push({ file: rel(file), grund: `größer als ${MAX_BYTES / 1024 / 1024} MiB` }); continue; }
    const bytes = await readFile(file);
    if (bytes.includes(0)) { skipped.push({ file: rel(file), grund: 'binär (enthält Nullbytes)' }); continue; }
    let text;
    try { text = UTF8.decode(bytes); } catch { skipped.push({ file: rel(file), grund: 'kein gültiges UTF-8 (zum Beispiel Latin-1); nicht verändert' }); continue; }
    let current = text;
    const hits = {};
    for (const [table, regexes] of tables) {
      const r = transformText(current, table, regexes);
      current = r.text;
      for (const [k, v] of r.hits) hits[k] = (hits[k] ?? 0) + v;
    }
    if (current === text) continue;
    const n = Object.values(hits).reduce((a, b) => a + b, 0);
    files.push({ file: rel(file), hits, total: n });
    total += n;
    if (write) { await writeFile(file, current); written++; }
  }
  return { files, total, written, skipped };
}

async function main() {
  const argv = process.argv.slice(2);
  const pos = argv.filter((a) => !a.startsWith('--'));
  const bekannt = /^--(dry-run|write|json|stufen=.*|ext=.*)$/;
  const unbekannt = argv.filter((a) => a.startsWith('--') && !bekannt.test(a));
  if (unbekannt.length) {
    console.error(`Unbekannte Option: ${unbekannt.join(', ')}\nAufruf: migrate-from-dss.mjs <projektordner> [--dry-run | --write] [--stufen=T] [--ext=.css,.vue] [--json]`);
    process.exit(2);
  }
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
  for (const k of result.skipped) console.log(`übersprungen: ${k.file} (${k.grund})`);
  console.log(`\n${result.files.length} Dateien, ${result.total} Treffer${write ? `, ${result.written} Dateien geschrieben` : ' (Probelauf, nichts geschrieben; zum Schreiben --write)'}.`);
  if (write) console.log('Rückgängig machen: im Projekt `git restore .` (vorher den Git-Stand gesichert haben).');
  else if (result.files.length) console.log('Vor --write den Git-Stand sichern (committen oder `git stash`); zurücknehmen mit `git restore .`.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
