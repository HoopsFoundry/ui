// @vitest-environment node
// Stilparitätsprüfung (scripts/check-style-parity.mjs): reine Vergleichsfunktionen, Aufruf von `compare` und Mutationstests.
import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { PROPS, PSEUDO_PROPS, classify, compareRows, stylesDiffer, pageList } from '../scripts/check-style-parity.mjs';
import { loadMutated, mutateScripts } from './helpers/script-mutation';

const made: string[] = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), `hoops-par-${process.pid}-`)); made.push(d); return d; };
afterAll(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

const style = (over: Record<string, string> = {}) => PROPS.map((p: string) => over[p] ?? (p === 'width' ? '100px' : p === 'color' ? 'rgb(0, 0, 0)' : 'x')).join('|');
const row = (over: Record<string, string> = {}, rect = [0, 0, 100, 20], sig = 'div.a', pseudo = '') => [sig, rect, style(over), pseudo];

describe('stylesDiffer', () => {
  it('gleiche Stile: keine Unterschiede', () => expect(stylesDiffer(style(), style(), PROPS, 0.6)).toEqual([]));
  it('Farbe verschieden: gemeldet, nicht nur Layout', () => {
    const d = stylesDiffer(style(), style({ color: 'rgb(1, 0, 0)' }), PROPS, 0.6);
    expect(d).toHaveLength(1);
    expect(d[0]).toContain('color');
    expect(d.layoutOnly).toBe(false);
  });
  it('Breite innerhalb ±0,6 px ist gleich, darüber ein reiner Layout-Unterschied', () => {
    expect(stylesDiffer(style(), style({ width: '100.5px' }), PROPS, 0.6)).toEqual([]);
    const d = stylesDiffer(style(), style({ width: '101px' }), PROPS, 0.6);
    expect(d).toHaveLength(1);
    expect(d.layoutOnly).toBe(true);
  });
  it('andere Zahlen (Schriftgröße) vertragen keine Toleranz', () => {
    expect(stylesDiffer(style({ 'font-size': '16px' }), style({ 'font-size': '16.4px' }), PROPS, 0.6)).toHaveLength(1);
  });
  it('andere Gestalt des Werts (Einheit) ist ein Unterschied', () => {
    expect(stylesDiffer(style({ width: '100px' }), style({ width: '100%' }), PROPS, 0.6)).toHaveLength(1);
  });
});

describe('compareRows und classify', () => {
  it('Struktur: andere Elementanzahl und andere Gestalt werden gezählt', () => {
    expect(compareRows([row()], [row(), row()]).structure).toBe(1);
    expect(compareRows([row()], [row({}, [0, 0, 100, 20], 'span.b')]).structure).toBe(1);
  });
  it('Emotion-Hashes in Klassen zählen nicht als andere Gestalt', () => {
    expect(compareRows([row({}, [0, 0, 100, 20], 'div.css-1abc')], [row({}, [0, 0, 100, 20], 'div.css-9xyz')]).structure).toBe(0);
  });
  it('Rechteck: Toleranz ±0,6 px', () => {
    expect(compareRows([row()], [row({}, [0.5, 0, 100, 20])]).rect).toBe(0);
    expect(compareRows([row()], [row({}, [0, 0, 100, 20.7])]).rect).toBe(1);
  });
  it('Stil und Layout-Stil werden getrennt gezählt; Pseudo-Elemente zählen als Stil', () => {
    expect(compareRows([row()], [row({ color: 'rgb(2, 2, 2)' })])).toMatchObject({ style: 1, layout: 0 });
    expect(compareRows([row()], [row({ width: '120px' })])).toMatchObject({ style: 0, layout: 1 });
    const ps = (v: string) => PSEUDO_PROPS.map((p: string) => (p === 'content' ? '"x"' : v)).join('|');
    expect(compareRows([row({}, [0, 0, 100, 20], 'div.a', ps('red'))], [row({}, [0, 0, 100, 20], 'div.a', ps('blue'))]).style).toBe(1);
  });
  it('Story: Rechteck und Größen zählen als Abweichung; Docs und ausdrücklich erlaubte Stories nur als Hinweis; Stil immer', () => {
    const layout = compareRows([row()], [row({ width: '150px' }, [0, 0, 150, 20])]);
    expect(classify(layout, { kind: 'story' })).toBe('abweichung');
    expect(classify(layout, { kind: 'docs' })).toBe('nur-layout');
    expect(classify(layout, { kind: 'story', erlaubtLayout: true })).toBe('nur-layout');
    const farbe = compareRows([row()], [row({ color: 'rgb(9, 9, 9)' })]);
    expect(classify(farbe, { kind: 'docs' })).toBe('abweichung');
    expect(classify(farbe, { kind: 'story', erlaubtLayout: true })).toBe('abweichung');
    expect(classify(compareRows([row()], [row()]), { kind: 'story' })).toBe('gleich');
  });
  it('Button 44 → 70 px Höhe in einer Story wird erkannt', () => {
    const r = compareRows([row({ height: '44px' }, [0, 0, 100, 44])], [row({ height: '70px' }, [0, 0, 100, 70])]);
    expect(classify(r, { kind: 'story' })).toBe('abweichung');
  });
});

describe('Seitenliste', () => {
  it('Stories und alle Docs-Seiten, filterbar', () => {
    const index = { entries: { a: { type: 'story', id: 'x--a', title: 'X' }, b: { type: 'docs', id: 'x--docs', title: 'Components/X' }, c: { type: 'docs', id: 'foundation-y--docs', title: 'Foundation/Y' } } };
    expect(pageList(index).map((p: { id: string }) => p.id)).toEqual(['x--a', 'x--docs', 'foundation-y--docs']);
    expect(pageList(index, '--docs').map((p: { id: string }) => p.id)).toEqual(['x--docs', 'foundation-y--docs']);
  });
});

describe('Aufruf compare', () => {
  const script = resolve(process.cwd(), 'scripts/check-style-parity.mjs');
  const write = (dir: string, name: string, pages: { key: string; kind: string; error?: boolean; rows: unknown[] }[]) => {
    const f = join(dir, name);
    writeFileSync(f, gzipSync(Buffer.from(pages.map((p) => JSON.stringify(p)).join('\n') + '\n')));
    return f;
  };
  const run = (...args: string[]) => spawnSync(process.execPath, [script, 'compare', ...args], { encoding: 'utf8' });
  it('fehlende Datei: deutsche Meldung, Exit 2, kein Stack', () => {
    const r = run('/gibt/es/nicht.gz', '/auch/nicht.gz');
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('Datei nicht gefunden');
    expect(r.stderr).not.toMatch(/\bat \w+.*\(/);
  });
  it('keine Aufnahme: Exit 2', () => {
    const d = tmp();
    writeFileSync(join(d, 'k.gz'), 'kein gzip');
    const r = run(join(d, 'k.gz'), join(d, 'k.gz'));
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('nicht lesbar');
  });
  it('gleich: Exit 0; Stil anders: Exit 1; Fehleranzeige nur nachher: Exit 1; erlaubte Story mit Layout: Exit 0', () => {
    const d = tmp();
    const base = [{ key: 'story:x--a|bbv|Light|1280', kind: 'story', rows: [row()] }];
    const same = write(d, 'a.gz', base);
    expect(run(same, write(d, 'b.gz', base)).status).toBe(0);
    expect(run(same, write(d, 'c.gz', [{ ...base[0], rows: [row({ color: 'rgb(7, 7, 7)' })] }])).status).toBe(1);
    expect(run(same, write(d, 'e.gz', [{ ...base[0], error: true }])).status).toBe(1);
    const breiter = write(d, 'w.gz', [{ ...base[0], rows: [row({ width: '150px' }, [0, 0, 150, 20])] }]);
    expect(run(same, breiter).status).toBe(1);
    expect(run(same, breiter, '--erlaubt-layout=x--a').status).toBe(0);
    const docs = [{ key: 'docs:x--docs|bbv|Light|1280', kind: 'docs', rows: [row()] }];
    expect(run(write(d, 'd1.gz', docs), write(d, 'd2.gz', [{ ...docs[0], rows: [row({ width: '150px' }, [0, 0, 150, 20])] }])).status).toBe(0);
  });
  it('fehlende Seite im Nachher-Lauf: Exit 1', () => {
    const d = tmp();
    const a = write(d, 'a.gz', [{ key: 'story:x--a|bbv|Light|1280', kind: 'story', rows: [row()] }]);
    expect(run(a, write(d, 'b.gz', [])).status).toBe(1);
  });
});

describe('Mutationstests der Stilparitätsprüfung', () => {
  const F = 'check-style-parity.mjs';
  it('Toleranz entfernt → 0,5 px Unterschied würde gemeldet', async () => {
    const m = await loadMutated(F, F, 'const t = LAYOUT_PROPS.has(props[i]) ? tol : 0.001;', 'const t = 0.001;');
    expect(m.stylesDiffer(style(), style({ width: '100.5px' }), m.PROPS, 0.6)).toHaveLength(1);
  });
  it('Layout-Eigenschaften nicht mehr als Layout markiert → Layout-Zähler bleibt leer', async () => {
    const m = await loadMutated(F, F, 'diffs.layoutOnly = (diffs.layoutOnly ?? true) && LAYOUT_PROPS.has(props[i]);', 'diffs.layoutOnly = false;');
    expect(m.compareRows([row()], [row({ width: '150px' }, [0, 0, 100, 20])]).layout).toBe(0);
  });
  it('Story-Strenge entfernt → Größenänderung wäre nur ein Hinweis', async () => {
    const m = await loadMutated(F, F, "return kind === 'story' && !erlaubtLayout ? 'abweichung' : 'nur-layout';", "return 'nur-layout';");
    const r = m.compareRows([row()], [row({ height: '70px' }, [0, 0, 100, 70])]);
    expect(m.classify(r, { kind: 'story' })).toBe('nur-layout');
  });
  it('Strukturzählung entfernt → andere Elementanzahl bleibt unbemerkt', async () => {
    const m = await loadMutated(F, F, 'if (ra.length !== rb.length) { out.structure++;', 'if (false) { out.structure++;');
    expect(m.compareRows([row()], [row(), row()]).structure).toBe(0);
  });
  it('Rechteckprüfung entfernt → Verschiebung bleibt unbemerkt', async () => {
    const m = await loadMutated(F, F, 'if (rectA.some((v, k) => Math.abs(v - rectB[k]) > tol))', 'if (false)');
    expect(m.compareRows([row()], [row({}, [30, 0, 100, 20])]).rect).toBe(0);
  });
  it('Fehleranzeige nicht verglichen → Exit 0 trotz neuer Fehleranzeige', () => {
    const dir = mutateScripts(F, 'if (Boolean(pa.error) !== Boolean(pb.error))', 'if (false)');
    const d = tmp();
    const mk = (n: string, error: boolean) => { const f = join(d, n); writeFileSync(f, gzipSync(Buffer.from(JSON.stringify({ key: 'story:x--a|bbv|Light|1280', kind: 'story', error, rows: [row()] }) + '\n'))); return f; };
    const r = spawnSync(process.execPath, [join(dir, F), 'compare', mk('a.gz', false), mk('b.gz', true)], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  });
  it('Meldung bei fehlender Datei entfernt → Aufruf endet nicht mit Exit 2', () => {
    const dir = mutateScripts(F, 'if (!existsSync(f)) { console.error(`Datei nicht gefunden: ${f}`); process.exit(2); }', '');
    const r = spawnSync(process.execPath, [join(dir, F), 'compare', '/gibt/es/nicht.gz', '/auch/nicht.gz'], { encoding: 'utf8' });
    expect(r.status).not.toBe(2);
  });
});
