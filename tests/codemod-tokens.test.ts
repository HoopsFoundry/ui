// @vitest-environment node
// Stufe T der Umbenennung (DSS → HoopsFoundry UI): Ersetzungsregeln für Design-Tokens (CSS-Custom-Properties) und Mutationstests.
import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRegexes, buildTable, renameToken, tableFromPairs, transformText } from '../scripts/lib/token-rename.mjs';
import { collectNames, listFiles } from '../scripts/codemod-tokens.mjs';
import { TOKENS } from '../scripts/migration-table.mjs';
import { loadMutated } from './helpers/script-mutation';

const table = tableFromPairs(TOKENS);
const run = (text: string, t = table) => transformText(text, t).text;
const mini = buildTable(['--n-0', '--ink-0', '--dss-fg', '--dss-fg-soft', '--sm', '--fs-h1', '--fs-body', '--_dss-map-h', '--ring-w', '--ring-color']);

describe('Umbenennungsregel', () => {
  it('--dss-foo → --hoops-foo, --_dss-foo → --_hoops-foo, unpräfixiert → --hoops-', () => {
    expect(renameToken('--dss-fg')).toBe('--hoops-fg');
    expect(renameToken('--_dss-map-h')).toBe('--_hoops-map-h');
    expect(renameToken('--n-0')).toBe('--hoops-n-0');
    expect(renameToken('--radius-md')).toBe('--hoops-radius-md');
  });
  it('schon umbenannte Namen bleiben (idempotent)', () => {
    expect(renameToken('--hoops-fg')).toBe('--hoops-fg');
    expect(renameToken('--_hoops-map-h')).toBe('--_hoops-map-h');
  });
  it('Kollision zweier alter Namen wird gemeldet; --surface-N löst sie auf', () => {
    expect(() => buildTable(['--dss-x', '--hoops-x'])).not.toThrow();
    expect(() => buildTable(['--x', '--dss-x'])).toThrow(/Kollision/);
    const t = buildTable(['--surface-2', '--dss-surface-2']);
    expect(t.names.get('--surface-2')).toBe('--hoops-page-surface-2');
    expect(t.names.get('--dss-surface-2')).toBe('--hoops-surface-2');
  });
  it('die gespeicherte Tabelle stimmt mit der Regel überein, ohne doppelte Ziele', () => {
    const targets = new Set<string>();
    for (const [alt, neu] of TOKENS as [string, string][]) {
      expect(renameToken(alt), alt).toBe(neu);
      expect(targets.has(neu), `doppelt: ${neu}`).toBe(false);
      targets.add(neu);
      expect(neu).toMatch(/^--_?hoops-/);
    }
    expect(TOKENS.length).toBeGreaterThan(250);
  });
});

describe('Tabelle für Konsumenten', () => {
  it('enthält nur Namen, die in der Bibliothek vorkommen (css, tokens, svelte, react, js), keine storyinternen', async () => {
    const lib = (await listFiles(process.cwd())).filter((f) => /^(css|tokens|svelte|react|js)\//.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
    const nurStories = (TOKENS as [string, string][]).filter(([, neu]) => !lib.includes(neu)).map(([alt]) => alt);
    expect(nurStories).toEqual([]);
    expect((TOKENS as [string, string][]).some(([alt]) => alt === '--d')).toBe(false);
  });
  it('Mutation: ein storyinterner Name in der Tabelle wird erkannt', async () => {
    const lib = (await listFiles(process.cwd())).filter((f) => /^(css|tokens|svelte|react|js)\//.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
    const mit: [string, string][] = [...(TOKENS as [string, string][]), ['--d', '--hoops-d']];
    expect(mit.filter(([, neu]) => !lib.includes(neu)).map(([alt]) => alt)).toEqual(['--d']);
  });
});

describe('Ersetzung nach Kontext', () => {
  it('CSS: Definition, var(), Fallbackkette', () => {
    expect(run('a { --dss-fg: var(--n-0); color: var(--dss-fg, var(--ink-0, red)); }')).toBe('a { --hoops-fg: var(--hoops-n-0); color: var(--hoops-fg, var(--hoops-ink-0, red)); }');
  });
  it('JS/TS: setProperty, getPropertyValue, Anführungszeichen und Schablonen', () => {
    expect(run("el.style.setProperty('--dss-map-h', '1px'); el.style.getPropertyValue(\"--dss-map-h\"); `var(--fs-${id})`; `--ink-${n}`; '--n-'")).toBe(
      "el.style.setProperty('--hoops-map-h', '1px'); el.style.getPropertyValue(\"--hoops-map-h\"); `var(--hoops-fs-${id})`; `--hoops-ink-${n}`; '--hoops-n-'",
    );
  });
  it('Inline-Style in HTML, Svelte (style:-Direktive), JSX-Objekt, Vue', () => {
    expect(run('<p style="--dss-map-h: 3px; color: var(--dss-fg)" style:--dss-map-pin-bg="var(--signal-400)">')).toBe('<p style="--hoops-map-h: 3px; color: var(--hoops-fg)" style:--hoops-map-pin-bg="var(--hoops-signal-400)">');
    expect(run("{ '--dss-title-size': '1rem', color: 'var(--dss-mute)' }")).toBe("{ '--hoops-title-size': '1rem', color: 'var(--hoops-mute)' }");
  });
  it('Doku: Platzhalter, Alternativen und Regex-Literale mit Präfix', () => {
    expect(run('`--dss-*`, `--ring-*`, --dss-… und /var\\(--fs-([a-z-]+)\\)/ und /--dss-chip-[\\w-]+/')).toBe('`--hoops-*`, `--hoops-ring-*`, --hoops-… und /var\\(--hoops-fs-([a-z-]+)\\)/ und /--hoops-chip-[\\w-]+/');
  });
  it('JSON und Tailwind-Zuordnungen', () => {
    expect(run('{"$description": "CSS: --base-*, --signal-*"}')).toBe('{"$description": "CSS: --hoops-base-*, --hoops-signal-*"}');
    expect(run("0: 'var(--base-0)',")).toBe("0: 'var(--hoops-base-0)',");
  });
});

describe('Wortgrenzen und Fremdes', () => {
  it('kein Teilwort-Treffer: --n-0 nicht in --ink-0, --n-050, x--n-0, BEM-Modifikatoren', () => {
    expect(run('--ink-0 --n-050 x--n-0 --n-0-x dss-btn--sm .a--fs-h1', mini)).toBe('--hoops-ink-0 --n-050 x--n-0 --n-0-x dss-btn--sm .a--fs-h1');
    expect(run('--n-0', mini)).toBe('--hoops-n-0');
  });
  it('längster Name gewinnt: --dss-fg und --dss-fg-soft', () => {
    expect(run('--dss-fg-soft --dss-fg --dss-fg-weich', mini)).toBe('--hoops-fg-soft --hoops-fg --dss-fg-weich');
  });
  it('Dritt-Variablen und eigene Namen bleiben unverändert', () => {
    const t = '.leaflet-container { font: var(--leaflet-font); color: var(--tw-ring-color); --sb-bg: red; --meine-farbe: blue; } --evil';
    expect(run(t)).toBe(t);
  });
  it('Schablonenpräfix nur mit Folgezeichen, Fließtext bleibt', () => {
    expect(run('der Ausdruck --ink-sehr und --fs- im Satz', mini)).toBe('der Ausdruck --ink-sehr und --fs- im Satz');
  });
  it('Idempotenz: zweiter Durchlauf ändert nichts', () => {
    const t = 'a { --dss-fg: var(--n-0); } `--fs-${x}` --ring-* x.setProperty("--dss-map-h")';
    const once = run(t);
    expect(run(once)).toBe(once);
  });
});

describe('Bestand', () => {
  it('der Codemod findet im Bestand nichts mehr umzubenennen (alle eigenen Namen tragen --hoops-)', async () => {
    const files = new Map<string, string>();
    for (const f of await listFiles(process.cwd())) files.set(f, readFileSync(f, 'utf8'));
    const found = collectNames(files);
    expect(found.size).toBeGreaterThan(250);
    expect(buildTable(found.keys()).names.size).toBe(0);
  });
});

// Mutationstests: jede Regel muss rot werden, wenn sie im Quelltext verfälscht wird.
describe('Mutationstests der Ersetzungsregeln', () => {
  const LIB = 'lib/token-rename.mjs';
  /** Prüfpunkte gegen ein (verfälschtes) Modul; jeder Wert ist true, wenn die Regel hält. */
  async function regeln(from: string, to: string) {
    const m = await loadMutated('lib/token-rename.mjs', LIB, from, to);
    const out: Record<string, boolean> = {};
    const attempt = (k: string, fn: () => boolean) => { try { out[k] = fn(); } catch { out[k] = false; } };
    const t = () => m.buildTable(['--n-0', '--ink-0', '--fs-h1', '--ring-w', '--surface-2', '--dss-surface-2']);
    attempt('davor', () => m.transformText('x--n-0 dss-btn--sm', t()).text === 'x--n-0 dss-btn--sm');
    attempt('dahinter', () => m.transformText('--n-050 --n-0-x', t()).text === '--n-050 --n-0-x');
    attempt('schablone', () => m.transformText('`--fs-${a}` --ring-*', t()).text === '`--hoops-fs-${a}` --hoops-ring-*');
    attempt('folgezeichen', () => m.transformText('--ink-sehr', t()).text === '--ink-sehr');
    attempt('kollision', () => { try { m.buildTable(['--x', '--dss-x']); return false; } catch { return true; } });
    attempt('ueberschreibung', () => m.buildTable(['--surface-2', '--dss-surface-2']).names.get('--surface-2') === '--hoops-page-surface-2');
    attempt('unterstrich', () => m.renameToken('--_dss-map-h') === '--_hoops-map-h');
    attempt('idempotent', () => m.renameToken('--hoops-fg') === '--hoops-fg');
    attempt('praefix-eines-dss-namens', () => m.transformText('--dss-*', m.buildTable(['--dss-fg'])).text === '--hoops-*');
    return out;
  }
  it('ohne Verfälschung halten alle Regeln', async () => {
    const m = await loadMutated('lib/token-rename.mjs', LIB, 'export const NEW_PREFIX', 'export const NEW_PREFIX');
    expect(m.renameToken('--dss-a')).toBe('--hoops-a');
    expect(Object.values(await regeln('export const NEW_PREFIX', 'export const NEW_PREFIX')).every(Boolean)).toBe(true);
  });
  it.each([
    ['Wortgrenze davor entfernt', '(?<![\\\\w-])(${alt(table.names.keys())})', '(${alt(table.names.keys())})', 'davor'],
    ['Wortgrenze dahinter entfernt', '(?![\\\\w-])`, \'g\') : null;\n  const prefix', '`, \'g\') : null;\n  const prefix', 'dahinter'],
    ['Schablonenregel entfernt', 'const prefix = table.prefixes.size ?', 'const prefix = false ?', 'schablone'],
    ['Folgezeichen der Schablone entfernt', "const PREFIX_FOLLOW = '(?=\\\\$\\\\{|[*\\\\[(|…\\'\"`/])';", "const PREFIX_FOLLOW = '';", 'folgezeichen'],
    ['Kollisionsprüfung entfernt', 'if (seen.has(next)) throw', 'if (false) throw', 'kollision'],
    ['Auflösung --surface-N entfernt', "['--surface-2', '--hoops-page-surface-2'],", '', 'ueberschreibung'],
    ['Regel für --_dss- entfernt', "if (name.startsWith('--_dss-'))", "if (false)", 'unterstrich'],
    ['Schutz vor doppelter Umbenennung entfernt', 'if (name.startsWith(`--${NEW_PREFIX}-`) || name.startsWith(`--_${NEW_PREFIX}-`)) return name;', '', 'idempotent'],
  ])('%s → Regel kippt', async (_name, from, to, key) => {
    const r = await regeln(from, to);
    expect(r[key], key).toBe(false);
  });
  it('Codemod: Ausnahmen (--evil) werden nicht gesammelt', async () => {
    const files = new Map([['a.css', ':root { --evil: 1; --x: 2; } a { color: var(--evil) var(--x); }']]);
    const names = [...collectNames(files).keys()];
    expect(names).toEqual(['--x']);
    const m = await loadMutated('codemod-tokens.mjs', 'codemod-tokens.mjs', "['--evil', ", "['--evilx', ");
    expect([...m.collectNames(files).keys()].sort()).toEqual(['--evil', '--x']);
  });
});

describe('Dateiliste des Bestands (Rennen mit den Arbeitsordnern anderer Tests)', () => {
  const dummy = (root: string) => {
    for (const dir of ['tests/.release-tmp-zzdummy-load/0/scripts', 'tests/.release-tmp-zzdummy/x', '.bundle-tmp-zzdummy', 'tests/.code-tmp-zzdummy']) {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(join(root, dir, 'a.css'), ':root { --ohne-praefix: 1; } a { color: var(--ohne-praefix); }\n');
    }
  };
  const cleanup = (root: string) => { for (const dir of ['tests/.release-tmp-zzdummy-load', 'tests/.release-tmp-zzdummy', '.bundle-tmp-zzdummy', 'tests/.code-tmp-zzdummy']) rmSync(join(root, dir), { recursive: true, force: true }); };
  it('Arbeitsordner unter tests/ und .release-tmp*/.bundle-tmp* werden ignoriert (Git-Weg)', async () => {
    const root = process.cwd();
    try {
      dummy(root);
      const files = await listFiles(root);
      expect(files.filter((f) => f.includes('zzdummy'))).toEqual([]);
      expect(files).toContain('css/components.css');
    } finally { cleanup(root); }
  });
  it('dasselbe im Rückfall ohne Git (Verzeichnislauf)', async () => {
    const root = mkdtempSync(join(tmpdir(), 'hoops-list-'));
    try {
      dummy(root);
      mkdirSync(join(root, 'css'), { recursive: true });
      writeFileSync(join(root, 'css/echt.css'), 'a { color: red; }\n');
      expect(await listFiles(root)).toEqual(['css/echt.css']);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it('Mutation: ohne Ausschluss der Arbeitsordner sieht die Liste die Kopien', async () => {
    const m = await loadMutated('codemod-tokens.mjs', 'codemod-tokens.mjs', 'const TEMP_PFAD = /', 'const TEMP_PFAD = /(?!)/; const UNBENUTZT = /');
    const root = mkdtempSync(join(tmpdir(), 'hoops-list-'));
    try {
      mkdirSync(join(root, 'tests/.release-tmp-zzdummy-load'), { recursive: true });
      writeFileSync(join(root, 'tests/.release-tmp-zzdummy-load/a.css'), 'a { color: var(--x); }\n');
      expect((await m.listFiles(root)).some((f: string) => f.includes('zzdummy'))).toBe(true);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});

describe('Erkennung eigener Namen in allen Kontexten (collectNames)', () => {
  const names = (file: string, text: string) => [...collectNames(new Map([[file, text]]), new Map()).keys()];
  it.each([
    ['MDX-Text mit reiner Definition', 'stories/Neu.mdx', 'Die Variable\n\n--neu-eins: 12px;\n'],
    ['Markdown', 'README.md', '`--neu-eins: 12px`'],
    ['Code-Block in .code.ts', 'stories/Neu.code.ts', 'export const css = `:root {\n  --neu-eins: red;\n}`;'],
    ['Svelte-<style>', 'stories/Neu.svelte', '<style>\n  .a { --neu-eins: 1px; }\n</style>'],
    ['Objektschlüssel in JS', 'js/neu.js', "export const s = { '--neu-eins': '1px' };"],
    ['style={{…}} in TSX', 'react/Neu.tsx', "export const A = () => <div style={{ '--neu-eins': 1 }} />;"],
    ['Svelte-Direktive style:--x', 'svelte/Neu.svelte', '<div style:--neu-eins="1px"></div>'],
    ['SVG', 'stories/neu.svg', '<svg style="fill: var(--neu-eins)"></svg>'],
    ['Textdatei', 'docs/neu.txt', '--neu-eins: 3px'],
    ['Shell-Skript', 'scripts/neu.sh', 'echo "x" # var(--neu-eins)'],
    ['JSON', 'tokens/neu.json', '{"css": "var(--neu-eins)"}'],
    ['HTML', 'stories/neu.html', '<p style="--neu-eins: 1px">'],
    ['YAML', '.github/neu.yml', 'run: echo "var(--neu-eins)"'],
  ])('%s', (_name, file, text) => {
    expect(names(file, text)).toContain('--neu-eins');
  });
  it('Kommandozeilen-Optionen in Meldungen von scripts/ und tests/ sind keine Definitionen', () => {
    expect(names('scripts/x.mjs', "console.error('--from-release: Version fehlt');")).toEqual([]);
    expect(names('tests/x.test.ts', "expect(msg).toContain('--debug: ')")).toEqual([]);
  });
  it('Mutation: ohne die Muster für Definitionen in Text fehlt der Name', async () => {
    const m = await loadMutated('codemod-tokens.mjs', 'codemod-tokens.mjs', "if (!/^(scripts|tests)\\//.test(file)) for", "if (false) for");
    expect([...m.collectNames(new Map([['stories/Neu.mdx', '--neu-eins: 12px;']]), new Map()).keys()]).toEqual([]);
    const k = await loadMutated('codemod-tokens.mjs', 'codemod-tokens.mjs', "for (const m of t.matchAll(/(['\"`])(--[a-zA-Z_][\\w-]*)\\1\\s*:/g)) add(m[2], file);", '');
    expect([...k.collectNames(new Map([['js/n.js', "{ '--neu-eins': 1 }"]]), new Map()).keys()]).toEqual([]);
    const d = await loadMutated('codemod-tokens.mjs', 'codemod-tokens.mjs', "for (const m of t.matchAll(/style:(--[a-zA-Z_][\\w-]*)\\s*=/g)) add(m[1], file);", '');
    expect([...d.collectNames(new Map([['svelte/N.svelte', '<i style:--neu-eins="1">']]), new Map()).keys()]).toEqual([]);
  });
});
