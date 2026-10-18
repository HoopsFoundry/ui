// @vitest-environment node
// Feste Texte im Quelltext (Syntaxbaum). Erzwungen für alle Quellordner (js/, js/render/ seit I2; svelte/, svelte/internal/, react/, react/internal/ seit I3):
// dort steht kein fester deutscher Text mehr (außer den Entwickler-Warnungen, die ausdrücklich deutsch bleiben und gezählt sind).
import { cpSync, mkdtempSync, mkdirSync, readFileSync as readText, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error JavaScript-Modul ohne Typen
import { scanTree, cleanText, isTextLike, SOURCE_DIRS } from '../scripts/i18n-scan.mjs';

const root = process.cwd();
const inventory = readText(resolve(root, 'docs/superpowers/specs/2026-10-17-i18n-inventar.md'), 'utf8');

/** Tabellenzeilen des Abschnitts "Einträge": Schlüssel, deutsche Formen, Quelltext-Formen. */
function rows() {
  const start = inventory.indexOf('\n## Einträge');
  const end = inventory.indexOf('\n## ', start + 5);
  const out: { key: string; de: string[]; src: string[] }[] = [];
  for (const line of inventory.slice(start, end).split('\n')) {
    const cells = line.split(/ \| /).map((c) => c.replace(/^\| /, '').replace(/ \|$/, ''));
    const key = cells[0]?.match(/^`([a-z0-9.-]+)`$/)?.[1];
    if (!key || cells.length < 8) continue;
    const ticks = (cell: string) => [...cell.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
    out.push({ key, de: cells[1].split(' ‖ ').flatMap(ticks), src: ticks(cells[4]) });
  }
  return out;
}
describe('feste Texte im Quelltext (erzwungen)', () => {
  const { texts, warnings } = scanTree(root);
  const show = (list: { file: string; line: number; text: string }[]) => list.map((t) => `${t.file}:${t.line} ${t.text}`);

  it('das Inventar enthält die Schlüssel beider Kataloge', async () => {
    const en = (await import('../js/i18n/en.js')).default as Record<string, unknown>;
    expect(rows().map((r) => r.key).sort()).toEqual(Object.keys(en).sort());
  });
  it('alle Quellordner werden gemessen', () => {
    expect(SOURCE_DIRS).toEqual(['svelte', 'svelte/internal', 'react', 'react/internal', 'js', 'js/render']);
  });
  it('kein fester Text mehr in svelte/, svelte/internal/, react/, react/internal/, js/ und js/render/ (über t() aus dem Katalog lesen)', () => {
    expect(show(texts), 'feste Texte im Quelltext').toEqual([]);
  });
  it('das Inventar nennt die gemessene Zahl: 0 feste Textstücke', () => {
    expect(inventory).toContain(`**${texts.length} feste Textstücke**`);
    expect(texts.length).toBe(0);
  });
  it('Mutation: ein neuer fester Text in js/stats.js, svelte/Banner.svelte oder react/Banner.tsx lässt die Erzwingung kippen', () => {
    for (const [file, add] of [
      ['js/stats.js', "\nexport const neu = 'Keine Angabe möglich';\n"],
      ['svelte/Banner.svelte', '\n<p>Neuer fester Text</p>\n'],
      ['react/Banner.tsx', "\nexport const neu = 'Neuer fester Text';\n"],
    ]) {
      const dir = mkdtempSync(resolve(tmpdir(), 'hoops-scan-'));
      for (const sub of SOURCE_DIRS) mkdirSync(resolve(dir, sub), { recursive: true });
      for (const top of ['svelte', 'react', 'js']) cpSync(resolve(root, top), resolve(dir, top), { recursive: true });
      expect(scanTree(dir).texts, `Ausgangslage ${file}`).toEqual([]);
      const path = resolve(dir, file);
      writeFileSync(path, `${readText(path, 'utf8')}${add}`);
      expect(scanTree(dir).texts.map((t: { file: string }) => t.file), file).toContain(file);
    }
  });
  it('Entwickler-Warnungen sind gezählt und bleiben deutsch (ausgenommen)', () => {
    expect(warnings.length).toBe(19);
    expect(inventory).toContain(`${warnings.length} Entwickler-Warnungen sind bewusst ausgenommen`);
  });
  it('Erkennung: Beispiele', () => {
    expect(isTextLike(cleanText('<span class="x">Nach oben</span>'))).toBe(true);
    expect(isTextLike(cleanText('hoops-btn hoops-btn--md'))).toBe(false);
    expect(isTextLike('ArrowDown')).toBe(false);
    expect(isTextLike('frei')).toBe(true);
    expect(isTextLike('currentColor')).toBe(false);
  });
  it('ein neuer fester Text würde auffallen (Mutation der Messung)', () => {
    expect(isTextLike(cleanText('Neuer fester Text'))).toBe(true);
  });
});
