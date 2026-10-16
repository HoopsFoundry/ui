#!/usr/bin/env node
/**
 * Einmaliger Codemod der Stufe T (Design-Tokens): benennt alle eigenen CSS-Custom-Properties in diesem Repository um.
 *
 *   node scripts/codemod-tokens.mjs --dry-run            # Ersetzungstabelle und Treffer je Datei, schreibt nichts
 *   node scripts/codemod-tokens.mjs                      # schreibt die Dateien um
 *   node scripts/codemod-tokens.mjs --dry-run --root=<ordner> [--write-table=<datei.mjs>]
 *
 * Die Namen werden aus dem Bestand abgeleitet: Definitionen (`--x:` in CSS ohne Kommentare), `var(--x`-Verwendungen, `setProperty`/
 * `getPropertyValue`-Zeichenketten und Inline-Style-Angaben. Dritt-Variablen und absichtlich fremde Namen stehen in AUSNAHMEN
 * (mit Begründung) und bleiben unverändert. Die Ersetzung selbst steckt in scripts/lib/token-rename.mjs (Wortgrenzen, Schablonen).
 * Nur Node-APIs, keine Shell. Wiederholtes Ausführen ändert nichts mehr (idempotent).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildTable, buildRegexes, transformText } from './lib/token-rename.mjs';

/** Im Repository umbenannt, aber nicht in der Tabelle für Konsumenten: Namen, die nur in den Stories vorkommen. */
export const NUR_STORIES = new Set(['--d']);

/** Namen, die NICHT umbenannt werden – mit Begründung. */
export const AUSNAHMEN = new Map([
  ['--evil', 'Testeingabe: absichtlich fremde Eigenschaft, die die Bereinigung der Karte verwerfen muss'],
  ['--token', 'Platzhalter in Kommentaren der Kontrasttests (`var(--token)`), keine Variable'],
]);

export const ENDUNGEN = new Set(['.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.svelte', '.mdx', '.md', '.json', '.html', '.adoc', '.yaml', '.yml', '.svg', '.txt', '.sh']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'storybook-static', 'release', '.worktrees', 'images', '.visual', '.svelte-kit', 'coverage', 'playwright-report', 'test-results']);
/** Pfade (relativ, mit /), die nicht angefasst werden: Geschichte, Erzeugtes, Historisches. */
const SKIP_PATHS = [
  /^package-lock\.json$/, /^CHANGELOG\.md$/, /^docs\/superpowers\//, /^docs\/architecture\/README\.adoc$/,
  /^docs\/entwuerfe\//, /^stories\/assets\//, /^scripts\/(codemod-tokens|migrate-from-dss|migration-table|codemod-names)\.mjs$/, /^scripts\/lib\/(token|name)-rename\.mjs$/,
  /^tests\/(codemod-tokens|migrate-from-dss|token-prefix|codemod-names|no-dss)\.test\.ts$/, /^tests\/fixtures\/migrate\//,
];

/** Temporäre Arbeitsordner der Tests (tests/.release-tmp-*, .bundle-tmp-* und andere Punkt-Ordner unter tests/) gehören nie zum Bestand. */
const TEMP_PFAD = /(^|\/)\.(release|bundle)-tmp|^tests\/\.[^/]+\//;

function inBestand(rel) {
  if (rel.split('/').some((seg) => SKIP_DIRS.has(seg))) return false;
  if (TEMP_PFAD.test(rel)) return false;
  if (!ENDUNGEN.has(rel.slice(rel.lastIndexOf('.')))) return false;
  return !SKIP_PATHS.some((re) => re.test(rel));
}

/** Dateien des Bestands laut Git (versioniert und neu, aber nicht ignoriert); null, wenn `root` kein Git-Arbeitsbaum ist. */
function gitFiles(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\0').filter(Boolean).filter((f) => existsSync(join(root, f)));
  } catch {
    return null;
  }
}

export async function listFiles(root) {
  const viaGit = gitFiles(root);
  if (viaGit) return [...new Set(viaGit)].filter(inBestand).sort();
  const out = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      const rel = relative(root, full).split(sep).join('/');
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !TEMP_PFAD.test(`${rel}/`)) await walk(full); continue; }
      if (inBestand(rel)) out.push(rel);
    }
  }
  await walk(root);
  return out.sort();
}

const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

/** Leitet die Menge der eigenen Namen aus den Dateien ab (Definitionen, var()-Verwendungen, setProperty, Inline-Style). */
export function collectNames(files, ausnahmen = AUSNAHMEN) {
  const found = new Map();
  const add = (n, f) => { if (!found.has(n)) found.set(n, new Set()); found.get(n).add(f); };
  for (const [file, text] of files) {
    const isCss = file.endsWith('.css');
    const t = isCss ? stripComments(text) : text;
    for (const m of t.matchAll(/var\(\s*(--[a-zA-Z_][\w-]*)/g)) add(m[1], file);
    if (isCss) for (const m of t.matchAll(/(?<![\w-])(--[a-zA-Z_][\w-]*)\s*:/g)) add(m[1], file);
    for (const m of t.matchAll(/(?:setProperty|getPropertyValue|removeProperty)\(\s*(['"`])(--[a-zA-Z_][\w-]*)/g)) add(m[2], file);
    if (!isCss) {
      for (const m of t.matchAll(/(?:style\s*=\s*["'{`]|style:\s*[`'"]|style:)[^\n]*?(?<![\w-])(--[a-zA-Z_][\w-]*)\s*:/g)) add(m[1], file);
      // reine Definitionen in Text, Markdown, Code-Blöcken, Svelte-`<style>` und Skripten: `--x: wert`
      // (nicht in scripts/ und tests/: dort stehen Kommandozeilen-Optionen in Meldungen, etwa „--from-release: …“)
      if (!/^(scripts|tests)\//.test(file)) for (const m of t.matchAll(/(?<![\w-])(--[a-zA-Z_][\w-]*)[ \t]*:[ \t]*(?=[^\s:;,)}\]])/g)) add(m[1], file);
      // Objektschlüssel `{ '--x': 1 }`, `style={{ '--x': … }}`
      for (const m of t.matchAll(/(['"`])(--[a-zA-Z_][\w-]*)\1\s*:/g)) add(m[2], file);
      // Svelte-Direktive `style:--x="…"`
      for (const m of t.matchAll(/style:(--[a-zA-Z_][\w-]*)\s*=/g)) add(m[1], file);
    }
  }
  for (const n of [...found.keys()]) if (n.endsWith('-') || ausnahmen.has(n)) found.delete(n);
  return found;
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes('--dry-run');
  const opt = (k) => argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  const root = opt('root') ?? fileURLToPath(new URL('../', import.meta.url));
  const files = new Map();
  for (const rel of await listFiles(root)) files.set(rel, await readFile(join(root, rel), 'utf8'));
  const found = collectNames(files);
  const table = buildTable(found.keys());
  const regexes = buildRegexes(table);

  console.log(`Eigene Custom-Properties: ${found.size}, Schablonen-Präfixe: ${table.prefixes.size}, Ausnahmen: ${[...AUSNAHMEN.keys()].join(', ')}`);
  console.log('\nErsetzungstabelle (alt → neu):');
  for (const [o, n] of table.names) console.log(`  ${o} → ${n}`);
  console.log('\nPräfixe (Schablonen, Platzhalter):');
  for (const [o, n] of table.prefixes) console.log(`  ${o} → ${n}`);

  let changedFiles = 0;
  let total = 0;
  const perName = new Map();
  for (const [rel, text] of files) {
    const { text: next, hits } = transformText(text, table, regexes);
    if (next === text) continue;
    changedFiles++;
    let n = 0;
    for (const [k, v] of hits) { n += v; (perName.get(k) ?? perName.set(k, new Set()).get(k)).add(rel); }
    total += n;
    console.log(`${dry ? 'würde ändern' : 'geändert'}: ${rel} (${n})`);
    if (!dry) await writeFile(join(root, rel), next);
  }
  console.log(`\n${changedFiles} Dateien, ${total} Ersetzungen${dry ? ' (Probelauf, nichts geschrieben)' : ''}.`);
  const verdaechtig = [...perName].filter(([, fs]) => [...fs].some((f) => /^(scripts|\.github)\//.test(f)));
  if (verdaechtig.length) console.log(`Zur Kontrolle (Treffer in scripts/ oder CI): ${verdaechtig.map(([k, fs]) => `${k} in ${[...fs].filter((f) => /^(scripts|\.github)\//.test(f)).join(', ')}`).join('; ')}`);

  const out = opt('write-table');
  if (out) {
    const lines = [...table.names].filter(([o]) => !NUR_STORIES.has(o)).map(([o, n]) => `  ['${o}', '${n}'],`).join('\n');
    const body = `/**
 * Ersetzungstabellen der Umbenennung von DSS auf HoopsFoundry UI, je Stufe (alt → neu). Genutzt von scripts/migrate-from-dss.mjs.
 * Stufe T (Design-Tokens) ist mit scripts/codemod-tokens.mjs erzeugt; spätere Stufen (K Klassen, D data-Attribute und Namen) ergänzen
 * eigene Tabellen und tragen sie in STUFEN ein.
 */
export const TOKENS = [\n${lines}\n];

/** Reihenfolge der Anwendung: [Kennung, Beschriftung, Paare]. */
export const STUFEN = [['T', 'Design-Tokens (CSS-Custom-Properties)', TOKENS]];
`;
    await writeFile(out, body);
    console.log(`Tabelle geschrieben: ${out}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
