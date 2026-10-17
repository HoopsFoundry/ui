// @vitest-environment node
// Feste Texte im Quelltext (Syntaxbaum). Erzwungen seit I2 für js/ und js/render/: dort steht kein fester deutscher Text mehr (außer den Entwickler-Warnungen,
// die ausdrücklich deutsch bleiben und gezählt sind); für svelte/ und react/ bleibt es bei der Messung gegen das Inventar (bis I3).
import { cpSync, mkdtempSync, mkdirSync, readFileSync as readText, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error JavaScript-Modul ohne Typen
import { scanTree, cleanText, isTextLike } from '../scripts/i18n-scan.mjs';

const root = process.cwd();
const inventory = readText(resolve(root, 'docs/superpowers/specs/2026-10-17-i18n-inventar.md'), 'utf8');
const norm = (s: string) => s.replace(/^[\s,:·–—-]+|[\s,:·–—-]+$/g, '').replace(/\s+/g, ' ');

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
const covered = new Set<string>();
for (const row of rows()) {
  for (const t of row.de) for (const p of t.split(/\{[^}]*\}/)) if (norm(p)) covered.add(norm(p));
  for (const s of row.src) covered.add(norm(s));
}

describe('feste Texte im Quelltext (Messung)', () => {
  const { texts, warnings } = scanTree(root);

  it('das Inventar enthält die Schlüssel beider Kataloge', async () => {
    const en = (await import('../js/i18n/en.js')).default as Record<string, unknown>;
    expect(rows().map((r) => r.key).sort()).toEqual(Object.keys(en).sort());
  });
  it('jeder Fund ist durch einen Inventareintrag gedeckt', () => {
    const open = texts.filter((t: { text: string }) => !covered.has(norm(t.text))).map((t: { file: string; line: number; text: string }) => `${t.file}:${t.line} ${t.text}`);
    expect(open, 'Texte ohne Inventareintrag').toEqual([]);
  });
  it('die Zahl der Funde ist plausibel und steht im Inventar', () => {
    expect(texts.length).toBeGreaterThan(100);
    expect(inventory).toContain(`**${texts.length} feste Textstücke**`);
  });
  it('js/ und js/render/: kein fester Text mehr (erzwungen)', () => {
    const open = texts.filter((t: { file: string }) => /^js\//.test(t.file)).map((t: { file: string; line: number; text: string }) => `${t.file}:${t.line} ${t.text}`);
    expect(open, 'feste Texte in js/ (über t() aus dem Katalog lesen)').toEqual([]);
  });
  it('Mutation: ein neuer fester Text in js/stats.js lässt die Erzwingung kippen', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'hoops-scan-'));
    for (const sub of ['svelte', 'svelte/internal', 'react', 'react/internal']) mkdirSync(resolve(dir, sub), { recursive: true });
    cpSync(resolve(root, 'js'), resolve(dir, 'js'), { recursive: true });
    expect(scanTree(dir).texts.filter((t: { file: string }) => /^js\//.test(t.file))).toEqual([]);
    const file = resolve(dir, 'js/stats.js');
    writeFileSync(file, `${readText(file, 'utf8')}\nexport const neu = 'Keine Angabe möglich';\n`);
    const found = scanTree(dir).texts.filter((t: { file: string }) => /^js\//.test(t.file));
    expect(found.map((t: { file: string }) => t.file)).toContain('js/stats.js');
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
    const extra = 'Neuer fester Text';
    expect(covered.has(norm(extra))).toBe(false);
    expect(isTextLike(cleanText(extra))).toBe(true);
  });
});
