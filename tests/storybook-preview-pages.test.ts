// @vitest-environment node
// Storybook aufräumen: Die Doku-Seiten betten keine festen Handy-Iframes (390 px) und keine festen Dunkel-Vorschauen mehr ein. Vorschauen in
// Gerätebreite laufen über Preview/StickyPreview (stories/docs/blocks/Preview.tsx), Marke, Theme und Breite kommen aus der Werkzeugleiste.
// Feste Themes gibt es nur auf Foundation/Dark Mode. Foundation/Typography zeigt beide Schriften fest; die Stapel stimmen mit tokens.css überein.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const walk = (dir: string): string[] =>
  readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const pages = walk('stories').filter((f) => f.endsWith('.mdx'));
const DARK_MODE = 'stories/Foundation/DarkMode.mdx';

/** Vorschauen einer Seite: Baustein, Story-Verweis, Titel, feste Globals. */
function previews(mdx: string) {
  return [...mdx.matchAll(/<(PreviewStep|Preview) of=\{(\w+)\.(\w+)\} title="([^"]+)"([^>]*)>/g)].map((m) => ({ block: m[1], ns: m[2], story: m[3], title: m[4], rest: m[5] }));
}

describe('Doku-Seiten: Vorschauen in Gerätebreite statt fester Handy- und Dunkel-Iframes', () => {
  it('keine Seite enthält feste Iframes, Handy-Rahmen oder feste Globals in Adressen', () => {
    for (const page of pages) {
      const mdx = read(page);
      expect(mdx, page).not.toMatch(/<iframe /);
      expect(mdx, page).not.toContain('hoops-phone');
      expect(mdx, page).not.toMatch(/globals=[\w:;]*theme:Dark/);
      expect(mdx, page).not.toMatch(/390 px Breite/);
    }
  });
  it('es gibt Vorschauen auf den 14 Seiten, die vorher Handy-Iframes hatten', () => {
    const withPreview = pages.filter((p) => previews(read(p)).length > 0).map((p) => relative('stories', p)).sort();
    expect(withPreview).toEqual([
      'Accordion.mdx', 'AppNav.mdx', 'CardLibrary.mdx', 'Foundation/DarkMode.mdx', 'Foundation/Vanilla.mdx', 'LeagueCard.mdx', 'Map.mdx', 'Modal.mdx',
      'PageNav.mdx', 'Spielplan.mdx', 'Stats.mdx', 'Tabs.mdx', 'TeamCard.mdx', 'VenueCard.mdx',
    ]);
  });
  it('jede Vorschau zeigt auf eine vorhandene Story einer importierten Stories-Datei, die Titel sind je Seite eindeutig (axe frame-title-unique)', () => {
    for (const page of pages) {
      const mdx = read(page);
      const list = previews(mdx);
      if (!list.length) continue;
      expect(mdx, page).toMatch(/import \{[^}]*\b(StickyPreview|Preview)\b[^}]*\} from '(\.\.?\/)+docs\/blocks\/Preview';/);
      const imports = Object.fromEntries([...mdx.matchAll(/import \* as (\w+) from '([^']+)';/g)].map((m) => [m[1], m[2]]));
      for (const p of list) {
        expect(imports[p.ns], `${page}: ${p.ns}`).toBeTruthy();
        const file = resolve(dirname(resolve(root, page)), `${imports[p.ns]}.ts`);
        expect(read(relative(root, file)), `${page}: ${p.ns}.${p.story}`).toMatch(new RegExp(`export const ${p.story}\\b`));
      }
      const titles = list.map((p) => p.title);
      expect(new Set(titles).size, `${page}: ${titles.join(', ')}`).toBe(titles.length);
    }
  });
  it('feste Globals (Theme) gibt es nur auf Foundation/Dark Mode, dort einmal hell und einmal dunkel nebeneinander', () => {
    for (const page of pages) {
      const fixed = previews(read(page)).filter((p) => /globals=\{\{/.test(p.rest));
      if (page === DARK_MODE) expect(fixed.map((p) => p.rest.match(/theme: '(\w+)'/)?.[1])).toEqual(['Light', 'Dark']);
      else expect(fixed, page).toEqual([]);
    }
    expect(read(DARK_MODE)).toContain('<div className="hoops-preview-pair">');
  });
  it('vor der ersten Vorschau einer Seite steht eine ##-Überschrift (heading-order)', () => {
    for (const page of pages) {
      const mdx = read(page);
      const first = mdx.search(/<(StickyPreview|Preview) /);
      if (first < 0) continue;
      expect(mdx.slice(0, first), page).toMatch(/\n## /);
    }
  });
});

describe('Marke und Schrift gekoppelt: kein Global type mehr', () => {
  it('weder Seiten noch Skripte noch Tests setzen das alte Global type', () => {
    for (const file of [...pages, ...walk('scripts'), ...walk('tests').filter((f) => !f.endsWith('storybook-preview.test.tsx') && !f.endsWith('storybook-preview-pages.test.ts'))]) {
      if (!/\.(mdx|mjs|ts|tsx|js)$/.test(file)) continue;
      expect(read(file), file).not.toMatch(/globals=[^"'`\s]*\btype:/);
    }
  });
  it('Foundation/Typography zeigt beide Schriften mit den Stapeln aus tokens.css', () => {
    const svelte = read('stories/Foundation/Typography.svelte');
    const tokens = read('tokens/tokens.css');
    const block = (sel: string) => tokens.slice(tokens.indexOf(sel), tokens.indexOf('}', tokens.indexOf(sel)));
    const base = block(':root {');
    const dbb = block(':root[data-type="dbb"] {');
    const stack = (css: string, name: string) => css.match(new RegExp(`--hoops-font-${name}:\\s*([^;]+);`))?.[1].trim();
    const families = [...svelte.matchAll(/families: \{ display: "([^"]+)", heading: "([^"]+)", body: "([^"]+)", mono: "([^"]+)" \}/g)].map((m) => m.slice(1));
    expect(families).toEqual([
      ['display', 'heading', 'body', 'mono'].map((n) => stack(base, n)),
      ['display', 'heading', 'body', 'mono'].map((n) => stack(dbb, n) ?? stack(base, n)),
    ]);
    expect(svelte).toMatch(/id: 'bbv'[^}]*tt: 'none'/);
    expect(svelte).toMatch(/id: 'dbb'[^}]*tt: 'uppercase'/);
    expect(stack(dbb, 'display')).toContain("'Sucrose'");
  });
});
