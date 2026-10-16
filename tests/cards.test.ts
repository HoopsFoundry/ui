// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

// Abschnitt zwischen zwei Überschriftenkommentaren der Datei
const section = (from: string, to: string) => {
  const a = css.indexOf(from);
  const b = css.indexOf(to, a + from.length);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return css.slice(a, b);
};

describe('Karten, Spielkarte, Spielerkarte, EmptyState, Skeleton im Dunkelmodus', () => {
  const blocks = {
    Karte: section('/* ── Karte ─', '/* ── Tabs ─'),
    EmptyState: section('/* ── EmptyState · Tonalitäten', '\n/* ── ', ),
    'Skeleton bis PlayByPlay': section('/* ── Skeleton ─', '/* ── PlayByPlay ─'),
  };

  for (const [name, block] of Object.entries(blocks)) {
    it(`${name}: kein nacktes --ok/err/warn/info-text oder -soft (haben keinen Dunkelmodus)`, () => {
      expect(block).not.toMatch(/var\(--hoops-(ok|err|warn|info)-(text|soft)\)/);
    });
  }

  it('Spielkarte: Zusatztext ohne opacity (3,0:1), Liga und Zusatz mit Textfarben', () => {
    expect(css).not.toMatch(/\.dss-match-muted\s*\{[^}]*opacity/);
    expect(css).toMatch(/\.dss-match-muted\s*\{\s*color:\s*var\(--hoops-mute\)/);
  });

  it('EmptyState: Fokus-Ring des Buttons auf action/error im Dunkelmodus in Chip-Textfarbe', () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \.dss-empty--action \.dss-btn:focus-visible\s*\{\s*outline-color:\s*var\(--hoops-chip-amber-fg\)/);
    expect(css).toMatch(/:root\[data-theme="dark"\] \.dss-empty--error \.dss-btn:focus-visible\s*\{\s*outline-color:\s*var\(--hoops-chip-err-fg\)/);
    expect(css).toMatch(/:root:not\(\[data-theme="light"\]\) \.dss-empty--error \.dss-btn:focus-visible\s*\{\s*outline-color:\s*var\(--hoops-chip-err-fg\)/);
  });

  it('Skeleton: Animation stoppt bei prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.dss-skel\s*\{\s*animation:\s*none/);
  });

  it('Skeleton-Spielkarte läuft auf schmalen Bildschirmen nicht über', () => {
    expect(css).toMatch(/\.dss-skel-match\s*\{[^}]*box-sizing: border-box;[^}]*min-width: min\(320px, 100%\)/);
  });

  it('Hero-Karte bricht auf schmalen Bildschirmen in eine Spalte', () => {
    expect(css).toMatch(/@media \(max-width: 560px\)\s*\{\s*\.dss-pc-hero\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  });
});

describe('Svelte-Card', () => {
  it('div mit onclick löst bei Enter und Leertaste aus (wie React)', () => {
    const card = read('../svelte/Card.svelte');
    expect(card).toMatch(/\{onkeydown\}/);
    expect(card).toMatch(/e\.key === 'Enter' \|\| e\.key === ' '/);
  });
});

describe('Welle 5: alte Seite entfernt', () => {
  it('Docs/Cards & Lists existiert nicht mehr', () => {
    expect(existsSync(new URL('../stories/docs/CardsDoc.svelte', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../stories/docs/Cards.spec.stories.ts', import.meta.url))).toBe(false);
    expect(read('../.storybook/preview.ts')).not.toContain('Cards & Lists');
  });
  it('Seiten Card, CardLibrary und EmptyState sind MDX und die Stories-Dateien tragen kein autodocs', () => {
    for (const n of ['Card', 'CardLibrary', 'EmptyState']) {
      expect(existsSync(new URL(`../stories/${n}.mdx`, import.meta.url))).toBe(true);
      expect(read(`../stories/${n}.stories.ts`)).not.toContain("'autodocs'");
    }
  });
});
