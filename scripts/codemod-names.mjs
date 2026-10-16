#!/usr/bin/env node
/**
 * Einmaliger Codemod der Stufen K (CSS-Klassen), D (data-Attribute, Ereignisse, Speicherschlüssel, Dateinamen, Paketname) und M (Marke und
 * Texte) der Umbenennung von DSS auf HoopsFoundry UI. Die Regeln für K und D stehen in scripts/lib/name-rename.mjs und werden auch vom
 * Migrationsskript für Konsumenten genutzt; Bezeichner und Texte (nur dieses Repository) stehen hier.
 *
 *   node scripts/codemod-names.mjs --dry-run              # Treffer je Datei und Regel, Kollisionen; schreibt nichts
 *   node scripts/codemod-names.mjs                        # schreibt die Dateien um
 *   node scripts/codemod-names.mjs --stufen=K,D           # nur bestimmte Stufen (Standard: D,K,M)
 *   node scripts/codemod-names.mjs --root=<ordner>        # anderer Wurzelordner (Standard: das Repository)
 *
 * Kontexte, die die Regeln abdecken: CSS-Selektoren (`.dss-x`, `[data-dss-x]`), `class="…"`, `className`, `classList`, `class:dss-x`,
 * Schablonen (`dss-${x}`), Verkettungen (`'dss-' + name`), `querySelector`/`closest`, Ereignisnamen (`addEventListener('dss:…')`), Importe
 * und Dateinamen (`dss.min.js`, `dss-render.js`), JSON und Markdown. Kollisionen (ein neuer Name `hoops-x` existiert schon) werden gemeldet.
 * Nur Node-APIs, keine Shell. Wiederholtes Ausführen ändert nichts mehr (idempotent).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listFiles } from './codemod-tokens.mjs';
import { applyRules, REGELN_D, REGELN_K } from './lib/name-rename.mjs';

/** Nur dieses Repository: Bezeichner im Code. */
export const REGELN_BEZEICHNER = [
  { name: 'Bezeichner syncDss', muster: /(?<=[a-z])Dss(?![a-z])/g, ersatz: 'Hoops' },
  { name: 'Bezeichner DssX', muster: /(?<![\w])Dss(?=[A-Z])/g, ersatz: 'Hoops' },
  { name: 'Bezeichner dssX', muster: /(?<![\w])dss(?=[A-Z])/g, ersatz: 'hoops' },
  { name: 'Konstanten DSS_X', muster: /(?<![A-Za-z])DSS(?=_)|(?<=_)DSS(?=_)/g, ersatz: 'HOOPS' },
  { name: 'Budget-/Manifest-Schlüssel bundles.dss', muster: /(?<=\b(?:BUDGETS|bundles)\.)dss\b/g, ersatz: 'hoops' },
];

/** Stufe M: Marke in Texten. */
export const REGELN_M = [
  { name: 'DSS Design System', muster: /DSS Design System/g, ersatz: 'HoopsFoundry UI' },
  { name: 'Digital Sports System', muster: /Digital Sports System/g, ersatz: 'HoopsFoundry UI' },
  { name: 'DSS-Zusammensetzung', muster: /(?<![\w-])DSS-(?=\w)/g, ersatz: 'HoopsFoundry-UI-' },
  { name: 'DSS', muster: /(?<![\w-])DSS(?![\w-])/g, ersatz: 'HoopsFoundry UI' },
];

/** Pfade, die der Codemod nie anfasst (zusätzlich zu denen von codemod-tokens.mjs): Entwürfe, die Werkzeuge selbst, Fixtures. */
const EIGENE = [/^docs\/entwuerfe\//, /^scripts\/(codemod-names|lib\/name-rename)\.mjs$/, /^tests\/(codemod-names|no-dss|names-rename)\.test\.ts$/];

export async function planen(root, stufen) {
  const files = new Map();
  for (const rel of await listFiles(root)) if (!EIGENE.some((re) => re.test(rel))) files.set(rel, await readFile(join(root, rel), 'utf8'));
  const regeln = [];
  if (stufen.has('D')) regeln.push(...REGELN_D);
  if (stufen.has('K')) regeln.push(...REGELN_K);
  if (stufen.has('K') || stufen.has('D')) regeln.push(...REGELN_BEZEICHNER);
  if (stufen.has('M')) regeln.push(...REGELN_M);
  const out = [];
  const kollisionen = new Set();
  const alle = [...files.values()].join('\n');
  for (const [rel, text] of files) {
    const r = applyRules(text, regeln);
    if (r.text === text) continue;
    out.push({ rel, text: r.text, hits: r.hits });
  }
  // Kollision: es gibt schon eine Klasse hoops-x (nicht Token), die aus dss-x entstehen würde
  for (const m of alle.matchAll(/(?<![\w-])dss-([\w-]+)/g)) if (new RegExp(`(?<![\\w-])hoops-${m[1].replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?![\\w-])`).test(alle)) kollisionen.add(m[1]);
  return { out, kollisionen };
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes('--dry-run');
  const opt = (k) => argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  const root = opt('root') ?? fileURLToPath(new URL('../', import.meta.url));
  const stufen = new Set((opt('stufen') ?? 'D,K,M').split(',').map((s) => s.trim().toUpperCase()));
  const { out, kollisionen } = await planen(root, stufen);
  const je = new Map();
  let total = 0;
  for (const f of out) {
    let n = 0;
    for (const [k, v] of f.hits) { n += v; je.set(k, (je.get(k) ?? 0) + v); }
    total += n;
    console.log(`${dry ? 'würde ändern' : 'geändert'}: ${f.rel} (${n})`);
    if (!dry) await writeFile(join(root, f.rel), f.text);
  }
  console.log('\nTreffer je altem Wort (Auszug, häufigste):');
  for (const [k, v] of [...je].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${k} ×${v}`);
  if (kollisionen.size) console.log(`\nKOLLISIONEN (hoops-x existiert schon): ${[...kollisionen].join(', ')}`);
  console.log(`\n${out.length} Dateien, ${total} Ersetzungen${dry ? ' (Probelauf, nichts geschrieben)' : ''}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
