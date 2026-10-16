// @vitest-environment node
// Verbotstest (Stufe T): Jede von uns definierte oder verwendete CSS-Custom-Property beginnt mit `--hoops-` (oder `--_hoops-` für private
// Hilfsvariablen). Unpräfixierte Namen und die alten `--dss-`-Namen sind verboten; Dritt-Variablen stehen in einer begründeten Allowlist.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { collectNames, listFiles } from '../scripts/codemod-tokens.mjs';

/** Erlaubte fremde Namen. Einträge, die auf `-` enden, gelten als Präfix (alle Namen darunter). Jede Zeile braucht eine Begründung. */
export const ALLOWLIST: { muster: string; grund: string }[] = [
  { muster: '--evil', grund: 'Testeingabe in tests/map-vanilla.test.ts: absichtlich fremde Eigenschaft, die die Bereinigung des Karten-Markups verwerfen muss' },
  { muster: '--token', grund: 'Platzhalter in Kommentaren der Kontrasttests (`var(--token)`), keine Variable' },
  { muster: '--leaflet-', grund: 'Dritt-Variablen von Leaflet (Karte, optionale Peer-Abhängigkeit); gehören nicht uns' },
  { muster: '--tw-', grund: 'Dritt-Variablen von Tailwind (Preset in tokens/tailwind.preset.js wird von Tailwind-Projekten genutzt)' },
  { muster: '--sb-', grund: 'Dritt-Variablen von Storybook (Oberfläche der Dokumentation)' },
  { muster: '--docblock-', grund: 'Dritt-Variablen von Storybook (Docs-Blöcke)' },
];

/** Dateien, die die alten Namen als Migrationshinweis nennen dürfen (Ersetzungsregel, Kollisionsauflösung). Der CHANGELOG ist als Historie ohnehin ausgenommen. */
const MIGRATIONSHINWEISE = new Set(['README.md', 'docs/architecture/sections/09-architecture-decisions.adoc']);

const OK = /^--_?hoops-/;
const erlaubt = (name: string, allow = ALLOWLIST) => OK.test(name) || allow.some((a) => (a.muster.endsWith('-') ? name.startsWith(a.muster) : name === a.muster));

/** Liefert alle Verstöße in den Dateien (Pfad → Text). */
export function findTokenViolations(files: Map<string, string>, allow = ALLOWLIST): string[] {
  const out: string[] = [];
  const names = collectNames(files, new Map());
  for (const [name, where] of names) if (!erlaubt(name, allow)) out.push(`unpräfixiert: ${name} (${[...where].slice(0, 3).join(', ')})`);
  for (const [file, text] of files) {
    if (MIGRATIONSHINWEISE.has(file)) continue;
    for (const m of text.matchAll(/(?<![\w-])--_?dss-[\w-]*/g)) out.push(`alter Name: ${m[0]} (${file})`);
    // Schablonen mit fremdem Präfix: `--ink-${x}`, `var(--fs-${x})`
    for (const m of text.matchAll(/(?<![\w-])(--[a-z][\w-]*-)\$\{/g)) if (!erlaubt(m[1] + 'x', allow)) out.push(`unpräfixierte Schablone: ${m[1]}\${…} (${file})`);
  }
  return out;
}

const cwd = process.cwd();
const real = new Map<string, string>();
for (const f of await listFiles(cwd)) real.set(f, readFileSync(f, 'utf8'));
const withEdit = (file: string, from: string, to: string) => {
  const text = real.get(file);
  expect(text, file).toBeDefined();
  expect(text!.includes(from), `${file} enthält ${from}`).toBe(true);
  return new Map(real).set(file, text!.replace(from, () => to));
};

describe('Präfix --hoops- (Stufe T)', () => {
  it('der Bestand hat keine unpräfixierten oder alten Custom-Properties', () => {
    expect(findTokenViolations(real)).toEqual([]);
  });
  it('der Bestand enthält Tokens in CSS, Svelte, React, JS und Doku (Prüfung ist nicht leer)', () => {
    const names = collectNames(real, new Map());
    expect(names.size).toBeGreaterThan(250);
    for (const probe of ['--hoops-n-0', '--hoops-fg', '--hoops-map-h', '--hoops-ring-w', '--_hoops-acc-chev']) expect(names.has(probe), probe).toBe(true);
    const dateien = [...real.keys()];
    for (const ext of ['.css', '.svelte', '.tsx', '.js', '.mdx']) expect(dateien.some((f) => f.endsWith(ext)), ext).toBe(true);
  });
  it('die Allowlist ist ein fester, geprüfter Satz (neue Einträge brauchen eine bewusste Änderung dieses Tests)', () => {
    expect(ALLOWLIST.map((a) => a.muster)).toEqual(['--evil', '--token', '--leaflet-', '--tw-', '--sb-', '--docblock-']);
    expect(findTokenViolations(new Map(real).set('css/x.css', ':root { --ink-9: 1; }'), [...ALLOWLIST, { muster: '--ink-', grund: 'eigene Skala, absichtlich nicht umbenannt und lange begründet' }])).toEqual([]);
  });
  it('Mutation: ein zusätzlicher Allowlist-Eintrag "--ink-" mit langer Begründung ist nicht stillschweigend möglich', () => {
    const erweitert = [...ALLOWLIST, { muster: '--ink-', grund: 'eigene Skala, absichtlich nicht umbenannt und lange begründet' }];
    expect(erweitert.map((a) => a.muster)).not.toEqual(['--evil', '--token', '--leaflet-', '--tw-', '--sb-', '--docblock-']);
  });
  it('jeder Allowlist-Eintrag ist begründet', () => {
    for (const a of ALLOWLIST) {
      expect(a.muster).toMatch(/^--[a-z][a-z-]*$/);
      expect(a.grund.length, a.muster).toBeGreaterThan(20);
    }
  });

  // Mutationstests: ein Verstoß an jeder Stelle, an der Namen stehen können, muss auffallen.
  it('Mutation: unpräfixierte Definition in CSS', () => {
    expect(findTokenViolations(withEdit('css/components.css', '--hoops-fg:', '--fg:')).join('\n')).toContain('unpräfixiert: --fg');
  });
  it('Mutation: unpräfixierte var()-Verwendung in einer Svelte-Datei', () => {
    const file = [...real.keys()].find((f) => f.startsWith('stories/') && f.endsWith('.svelte') && real.get(f)!.includes('var(--hoops-page-line)'))!;
    expect(findTokenViolations(withEdit(file, 'var(--hoops-page-line)', 'var(--page-line)')).join('\n')).toContain('unpräfixiert: --page-line');
  });
  it('Mutation: unpräfixiertes setProperty in JS', () => {
    expect(findTokenViolations(withEdit('js/backtop.js', "'--hoops-backtop-offset'", "'--backtop-offset'")).join('\n')).toContain('unpräfixiert: --backtop-offset');
  });
  it('Mutation: unpräfixierte Inline-Style-Angabe in einer Story', () => {
    expect(findTokenViolations(withEdit('stories/Foundation/Headings.svelte', '--hoops-d:', '--d:')).join('\n')).toContain('unpräfixiert: --d');
  });
  it('Mutation: unpräfixierte Schablone', () => {
    expect(findTokenViolations(withEdit('stories/Foundation/Typography.svelte', '`--hoops-fs-${s.id}`', '`--fs-${s.id}`')).join('\n')).toContain('unpräfixierte Schablone: --fs-');
  });
  it('Mutation: der alte Name --dss-… kehrt zurück', () => {
    expect(findTokenViolations(withEdit('css/components.css', '--hoops-fg:', '--dss-fg:')).join('\n')).toContain('alter Name: --dss-fg');
    // Migrationshinweise (README, ADR) dürfen die alten Namen nennen
    expect(findTokenViolations(withEdit('README.md', 'Farben laufen über die semantischen Variablen `--hoops-*`', 'Farben laufen über die semantischen Variablen `--dss-*`'))).toEqual([]);
    expect(findTokenViolations(withEdit('stories/Introduction.mdx', 'Rollen-Tokens und `--hoops-*`', 'Rollen-Tokens und `--dss-*`')).join('\n')).toContain('alter Name: --dss-');
  });
  it('Mutation: private Hilfsvariable ohne Präfix', () => {
    expect(findTokenViolations(withEdit('css/components.css', '--_hoops-acc-chev:', '--_acc-chev:')).join('\n')).toContain('unpräfixiert: --_acc-chev');
  });
  it('Mutation: ohne Allowlist fällt die fremde Testeingabe auf; Dritt-Variablen sind mit ihr erlaubt', () => {
    expect(findTokenViolations(real, []).join('\n')).toContain('--evil');
    const fremd = withEdit('css/components.css', '--hoops-fg:', '--leaflet-font:');
    expect(findTokenViolations(fremd)).toEqual([]);
    expect(findTokenViolations(fremd, []).join('\n')).toContain('--leaflet-font');
  });
  it('Mutation: Prüfung ist nicht abgeschaltet (Allowlist-Muster greift nur auf Präfix-Grenze)', () => {
    const fast = withEdit('css/components.css', '--hoops-fg:', '--twist:');
    expect(findTokenViolations(fast).join('\n')).toContain('--twist');
  });
});

describe('Verbotstest erkennt neue unpräfixierte Namen in allen Kontexten', () => {
  const mit = (file: string, text: string) => findTokenViolations(new Map(real).set(file, text)).join('\n');
  it.each([
    ['reine Definition in MDX', 'stories/Neu.mdx', '--neu-eins: 12px;\n'],
    ['Definition im Text einer .code.ts', 'stories/Neu.code.ts', 'export const c = `:root { --neu-eins: red; }`;'],
    ['Definition in Svelte-<style>', 'stories/Neu.svelte', '<style>.a { --neu-eins: 1px; }</style>'],
    ['Objektschlüssel in JS', 'js/neu.js', "export const s = { '--neu-eins': 1 };"],
    ['style={{…}} in TSX', 'react/Neu.tsx', "export const A = () => <div style={{ '--neu-eins': 1 }} />;"],
    ['Svelte-Direktive', 'svelte/Neu.svelte', '<div style:--neu-eins="1"></div>'],
    ['SVG', 'stories/neu.svg', '<svg style="fill: var(--neu-eins)"></svg>'],
    ['Textdatei', 'docs/neu.txt', '--neu-eins: 3px'],
    ['JSON', 'tokens/neu.json', '{"c": "var(--neu-eins)"}'],
    ['HTML', 'stories/neu.html', '<p style="--neu-eins: 1px">'],
    ['YAML', '.github/neu.yml', 'x: var(--neu-eins)'],
  ])('%s', (_n, file, text) => {
    expect(mit(file, text)).toContain('unpräfixiert: --neu-eins');
  });
  it('mit Präfix ist dieselbe Stelle in Ordnung', () => {
    expect(mit('stories/Neu.mdx', '--hoops-neu-eins: 12px;\n')).toBe('');
  });
});
