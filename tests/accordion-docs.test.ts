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
