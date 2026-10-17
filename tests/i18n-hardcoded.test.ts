// @vitest-environment node
// Messung fester Texte (noch nicht erzwingend): Die Funde im Quelltext (Syntaxbaum) müssen vom Inventar gedeckt sein.
// Die Erzwingung ("keine festen Texte außer Ausnahmen") kommt, wenn I2 und I3 die Texte verdrahtet haben.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error JavaScript-Modul ohne Typen
import { scanTree, cleanText, isTextLike } from '../scripts/i18n-scan.mjs';

const root = process.cwd();
const inventory = readFileSync(resolve(root, 'docs/superpowers/specs/2026-10-17-i18n-inventar.md'), 'utf8');
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
    expect(texts.length).toBeGreaterThan(250);
    expect(inventory).toContain(`**${texts.length} feste Textstücke**`);
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
