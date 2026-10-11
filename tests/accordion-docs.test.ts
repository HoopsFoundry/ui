// @vitest-environment node
// Doku-Seite Accordion: Verweise, Stories, Beispiele, Einbindung in Einführung, Sortierung, README und CHANGELOG.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const mdx = read('stories/Accordion.mdx');
const stories = read('stories/Accordion.stories.ts');
const examples = read('stories/components/AccordionExamples.svelte');

describe('Accordion-Doku', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/AccordionStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('Beispiel-Stories sind versteckt, Standard und Spielwiese sichtbar, kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    for (const m of stories.matchAll(/export const (\w+) = \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]} = .*tags: \\['!dev'\\]`));
    expect(stories).toMatch(/export const Standard = \{ args/);
    expect(stories).toMatch(/export const Spielwiese = \{/);
  });
  it('argTypes haben Beschreibungen', () => {
    for (const k of ['exclusive', 'variant', 'expandAll', 'nav', 'sticky', 'syncHash', 'titleAs']) expect(stories).toMatch(new RegExp(`${k}: \\{[^}]*description:`));
  });
  it('vier Dos und Don\'ts', () => expect([...mdx.matchAll(/doText:/g)]).toHaveLength(4));
  it('nur das Deep-Link-Beispiel schreibt den Anker', () => {
    const withHash = [...examples.matchAll(/<Accordion(?=[ >])(?![^>]*syncHash=\{false\})[^>]*>/g)].map((m) => m[0]);
    expect(withHash.length).toBe(2); // Gruppe und verschachtelte Gruppe im Deep-Link-Beispiel
  });
  it('Beispiele nutzen keine einklappbaren Tabellenrahmen (Paket B)', () => expect(examples).not.toContain('collapsible'));
  it('Einführung, storySort, README und CHANGELOG nennen das Accordion', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-accordion--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'Tabs', 'Accordion'/);
    expect(read('README.md')).toContain('Accordion');
    expect(read('CHANGELOG.md')).toContain('Accordion (Paket A)');
  });
});

describe('Accordion-Doku: eindeutige Namen je Seite (axe landmark-unique)', () => {
  const titles = [...examples.matchAll(/<AccordionItem id="[^"]+" title="([^"]+)"/g)].map((m) => m[1]);
  const labels = [...examples.matchAll(/navLabel="([^"]+)"/g)].map((m) => m[1]);
  it('jeder Bereichstitel kommt in den Beispielen nur einmal vor', () => {
    expect(titles.length).toBeGreaterThan(40);
    const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dup).toEqual([]);
  });
  it('jede Sprungleiste hat einen eigenen navLabel (nicht der Standard „Bereiche“)', () => {
    const navs = [...examples.matchAll(/<Accordion [^>]*\bnav\b[^>]*>/g)].map((m) => m[0]);
    expect(navs.length).toBe(3);
    for (const n of navs) expect(n).toMatch(/navLabel="[^"]+"/);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).not.toContain('Bereiche');
  });
  it('die Barrierefreiheits-Regel steht in der Doku', () => {
    expect(mdx).toMatch(/gleichem Titel oder mehrere Sprungleisten auf einer Seite brauchen unterschiedliche Namen \(axe: `landmark-unique`\)/);
    expect(mdx).toMatch(/`navLabel` setzt den Namen der Sprungleiste/);
  });
  it('die Doku beschreibt exclusive beim Start einheitlich', () => {
    expect(mdx).toMatch(/bleibt nur der erste \(in Dokumentreihenfolge\) offen/);
    expect(mdx).not.toMatch(/schließt sie nicht von selbst/);
  });
});

describe('Accordion-Doku: ids der Beispiele', () => {
  const branches = examples.split(/\{:else if example === |\{#if example === /).slice(1);
  const idsOf = (text: string) => [...text.matchAll(/\bid="([^"{]+)"/g)].map((m) => m[1]);
  it('jedes Beispiel der Stories ist ein Zweig der Beispielkomponente', () => expect(branches.length).toBe([...stories.matchAll(/example\('([\w-]+)'\)/g)].length));
  it('jede id kommt je Beispiel und in der ganzen Datei genau einmal vor (alle Beispiele stehen auf einer Seite)', () => {
    for (const b of branches) {
      const ids = idsOf(b);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i), b.slice(0, 30)).toEqual([]);
    }
    const all = idsOf(examples);
    expect(all.filter((id, i) => all.indexOf(id) !== i)).toEqual([]);
  });
  it('jeder Anker-Link zeigt auf eine vorhandene id', () => {
    const all = new Set(idsOf(examples));
    for (const m of examples.matchAll(/href="#([^"]+)"/g)) expect(all.has(m[1]), m[1]).toBe(true);
  });
  it('die Zustands-Matrix vergibt je Zelle eine eigene id', () => {
    expect(examples).toMatch(/id=\{`zu-\$\{v\.id\}-\$\{c\}`\}/);
  });
});
