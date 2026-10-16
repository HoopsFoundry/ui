// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const css = read('../css/components.css');
const tabsSvelte = read('../svelte/Tabs.svelte');
const stepperSvelte = read('../svelte/Stepper.svelte');

function block(start: RegExp, end: RegExp): string {
  const from = css.search(start);
  expect(from, `Anfang ${start} nicht gefunden`).toBeGreaterThanOrEqual(0);
  const rest = css.slice(from);
  const to = rest.slice(1).search(end);
  return rest.slice(0, to + 1);
}

const RING = 'outline:\\s*var\\(--hoops-ring-w\\)\\s+var\\(--hoops-ring-style\\)\\s+var\\(--hoops-ring-color\\)';
const hasRing = (selector: string) => new RegExp(selector.replace(/[.[\]()]/g, '\\$&') + '[^{]*\\{[^}]*' + RING).test(css);

describe('Navigation: jede bedienbare Komponente hat einen gestrichelten Fokus-Ring', () => {
  it.each([
    ['Tabs', '.hoops-tab:focus-visible'],
    ['Stepper-Punkt', 'button.hoops-step-dot:focus-visible'],
    ['AppNav-Link', '.hoops-appnav-link:focus-visible'],
    ['AppNav-Gruppe', '.hoops-appnav-group-btn:focus-visible'],
    ['AppNav-Umschalter', '.hoops-appnav-toggle:focus-visible'],
    ['BottomNav-Eintrag', '.hoops-bnav-item:focus-visible'],
    ['BottomNav-FAB', '.hoops-bnav-fab:focus-visible'],
    ['Breadcrumb-Link', 'a.hoops-crumbs-item:focus-visible'],
    ['Breadcrumb-Chip', 'a.hoops-crumbs-chip:focus-visible'],
  ])('%s: %s', (_name, selector) => {
    expect(hasRing(selector)).toBe(true);
  });

  it('BottomNav-Eintrag und AppNav zeichnen den Ring innen (−3 px), sonst schneidet der Rand ihn ab', () => {
    expect(css).toMatch(/\.hoops-bnav-item:focus-visible\s*\{[^}]*outline-offset:\s*-3px/);
    expect(css).toMatch(/\.hoops-appnav-link:focus-visible[^{]*\{[^}]*outline-offset:\s*-3px/);
  });

  it('dunkle Flächen (AppNav dunkel, TopBar) nehmen den dezenten Ring-Ton', () => {
    expect(css).toMatch(/\.hoops-appnav--dark \.hoops-appnav-toggle:focus-visible\s*\{\s*outline-color:\s*var\(--hoops-ring-color-on-dark\)/);
    expect(css).toMatch(/\.hoops-topbar--dark :focus-visible\s*\{\s*outline-color:\s*var\(--hoops-ring-color-on-dark\)/);
  });
});

describe('Navigation: Farben mit Dunkelmodus', () => {
  const areas: Array<[string, string]> = [
    ['Tabs', block(/\/\* ── Tabs ─/, /\/\* ── Chip \/ Status/)],
    ['Tabs (Größen, vertical)', block(/\/\* ── Tabs · Größen/, /\/\* ── Icon ─/)],
    ['TopBar', block(/\/\* ── TopBar · dunkle App-Leiste/, /\/\* ── EmptyState · Tonalitäten/)],
    ['Stepper und AppNav', block(/\/\* ── Stepper \(horizontal/, /v0\.9 · BottomNav/)],
    ['BottomNav und Breadcrumbs', block(/\/\* ── BottomNav ─/, /\/\* ── Skeleton ─/)],
  ];
  it.each(areas)('%s nutzt nicht die nackten --*-text-Tokens (ohne Dunkelmodus)', (_name, area) => {
    expect(area.length).toBeGreaterThan(200);
    expect(area).not.toMatch(/var\(--hoops-(err|ok|warn|info)-text\)/);
  });

  it('Live-Marker der TopBar: grüne Live-Sprache (Text --hoops-live-fg-on-dark), kein Rot', () => {
    const live = css.match(/\.hoops-topbar-live\s*\{[^}]*\}/)?.[0] ?? '';
    expect(live).toMatch(/color:\s*var\(--hoops-live-fg-on-dark\)/);
    expect(live).not.toMatch(/--hoops-err-fill|oklch\(0\.80 0\.19 27\)/);
  });
});

describe('Svelte-Tabs: Mehrfachauswahl wie in der React-Fassung', () => {
  it('alle Schalter sind per Tab erreichbar (kein Roving-Tabindex bei multi)', () => {
    expect(tabsSvelte).toMatch(/tabindex=\{multi \? undefined : isActive\(item\.id\) \? 0 : -1\}/);
  });
  it('Pfeiltasten tun bei multi nichts', () => {
    expect(tabsSvelte).toMatch(/function onKey\([^)]*\)\s*\{\s*if \(multi\) return;/);
  });
  it('aria-orientation steht nicht an der Gruppe (role=group erlaubt es nicht)', () => {
    expect(tabsSvelte).toMatch(/aria-orientation=\{multi \? undefined/);
  });
});

describe('Stepper: Schaltfläche trägt die sichtbare Nummer im Namen (WCAG 2.5.3)', () => {
  it('Svelte', () => {
    expect(stepperSvelte).toMatch(/aria-label="\{i \+ 1\}\. \{s\.label\}"/);
  });
  it('React', () => {
    expect(read('../react/Stepper.tsx')).toContain('aria-label={`${index + 1}. ${step.label}`}');
  });
});

describe('Doku: MDX-Seiten statt automatischer Seiten', () => {
  it.each(['Tabs', 'Navigation', 'AppNav'])('%s.stories.ts hat kein autodocs und es gibt %s.mdx', (name) => {
    expect(read(`../stories/${name}.stories.ts`)).not.toMatch(/autodocs/);
    expect(existsSync(new URL(`../stories/${name}.mdx`, import.meta.url))).toBe(true);
  });

  it('die alte Seite Docs/Navigation ist weg', () => {
    expect(existsSync(new URL('../stories/docs/NavigationDoc.svelte', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../stories/docs/Navigation.spec.stories.ts', import.meta.url))).toBe(false);
    expect(read('../.storybook/preview.ts')).not.toMatch(/'Docs', \[[^\]]*'Navigation'/);
  });

  it('Beispiel-Stories sind in der Seitenleiste versteckt (Tag als Literal)', () => {
    for (const name of ['Tabs', 'Navigation', 'AppNav']) {
      const src = read(`../stories/${name}.stories.ts`);
      const examples = src.match(/export const \w+\s*=\s*\{ \.\.\.example\([^)]*\)[^;]*;/g) ?? [];
      expect(examples.length).toBeGreaterThan(5);
      for (const line of examples) expect(line).toContain("tags: ['!dev']");
    }
  });
});
