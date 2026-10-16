// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

const section = (from: string, to: string) => {
  const a = css.indexOf(from);
  const b = css.indexOf(to, a + from.length);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return css.slice(a, b);
};

const ring = 'outline:\\s*var\\(--hoops-ring-w\\)\\s+var\\(--hoops-ring-style\\)\\s+var\\(--hoops-ring-color\\)';

describe('Tabelle und PlayByPlay im Dunkelmodus', () => {
  const blocks = {
    Tabelle: section('/* ── Tabelle ─', '/* ── Listenzeile'),
    'Rahmenkopf bis Pille': section('/* ── Tabelle · Rahmenkopf', '/* ── TopBar'),
    PlayByPlay: section('/* ── PlayByPlay ─', '/* ── CourtLines'),
  };
  for (const [name, block] of Object.entries(blocks)) {
    it(`${name}: kein nacktes --ok/err/warn/info-text oder -soft (haben keinen Dunkelmodus)`, () => {
      expect(block).not.toMatch(/var\(--hoops-(ok|err|warn|info)-(text|soft)\)/);
    });
  }

  it('Positionsmarken und Status-Pillen nutzen die Chip-Tokens', () => {
    const b = blocks['Rahmenkopf bis Pille'];
    expect(b).toMatch(/\.dss-pos\.pf\s*\{\s*background:\s*var\(--hoops-chip-warn-bg\);\s*color:\s*var\(--hoops-chip-warn-fg\)/);
    expect(b).toMatch(/\.dss-pos\.c\s*\{\s*background:\s*var\(--hoops-chip-err-bg\);\s*color:\s*var\(--hoops-chip-err-fg\)/);
    expect(b).toMatch(/\.dss-pos\.sg\s*\{\s*background:\s*var\(--hoops-chip-info-bg\);\s*color:\s*var\(--hoops-chip-info-fg\)/);
    expect(b).toMatch(/\.dss-pill-s\.on\s*\{\s*background:\s*var\(--hoops-chip-ok-bg\);\s*color:\s*var\(--hoops-chip-ok-fg\)/);
    expect(b).toMatch(/\.dss-pill-s\.dnp\s*\{\s*background:\s*var\(--hoops-chip-err-bg\);\s*color:\s*var\(--hoops-chip-err-fg\)/);
  });

  it('--hoops-chip-info-* und -neutral-* sind im Hellmodus und in beiden Dunkelmodus-Blöcken definiert', () => {
    for (const t of ['info-bg', 'info-fg', 'neutral-bg', 'neutral-fg']) {
      expect(css.match(new RegExp(`--hoops-chip-${t}:`, 'g'))?.length).toBe(3);
    }
  });

  it('Plus/Minus in Zahlenspalten: Chip-Farbe, auf dunkler Fläche feste helle Töne', () => {
    expect(css).toMatch(/\.dss-tbl td\.num\.plus\s*\{\s*color:\s*var\(--hoops-chip-ok-fg\)/);
    expect(css).toMatch(/\.dss-tbl td\.num\.minus\s*\{\s*color:\s*var\(--hoops-chip-err-fg\)/);
    expect(css).toMatch(/\.dss-frame--dark \.dss-tbl td\.num\.plus\s*\{\s*color:\s*oklch\(/);
    expect(css).toMatch(/\.dss-frame--dark \.dss-tbl td\.num\.minus\s*\{\s*color:\s*oklch\(/);
  });

  it('Beispiele und Seiten koppeln kein nacktes --*-text', () => {
    for (const f of [
      '../stories/components/TablesDemo.svelte',
      '../stories/components/TableExamples.svelte',
      '../stories/components/PlayByPlayDemo.svelte',
      '../stories/components/PlayByPlayExamples.svelte',
      '../stories/Table.mdx',
      '../stories/PlayByPlay.mdx',
    ]) {
      expect(read(f), f).not.toMatch(/var\(--hoops-(ok|err|warn|info)-(text|soft)\)/);
    }
  });
});

describe('Tabelle: eigene Zeile auf Streifen', () => {
  it('is-own überdeckt den Streifen der geraden Zeilen, auch auf dunkler Fläche', () => {
    expect(css).toMatch(/\.dss-tbl--striped tbody tr\.is-own td\s*\{\s*background:\s*var\(--hoops-selected-bg\)/);
    expect(css).toMatch(/\.dss-frame--dark \.dss-tbl--striped tbody tr\.is-own td\s*\{\s*background:\s*var\(--hoops-selected-bg\)/);
  });
});

describe('Tabelle: Fokus', () => {
  it('Scrollbereich hat einen gestrichelten Fokus-Ring innen (der Rahmen schneidet außen ab)', () => {
    expect(css).toMatch(new RegExp('\\.dss-table-scroll:focus-visible\\s*\\{[^}]*' + ring + ';\\s*outline-offset:\\s*-3px'));
  });
  it('Link, Schalter und Eingaben in Zellen haben einen gestrichelten Fokus-Ring', () => {
    expect(css).toMatch(new RegExp(':where\\(\\.dss-tbl td, \\.dss-tbl th\\) :is\\(a, button, input, select, textarea, \\[tabindex="0"\\]\\):focus-visible\\s*\\{[^}]*' + ring));
  });
  it('fokussierbare Zeile hat den Ring innen', () => {
    expect(css).toMatch(new RegExp(':where\\(\\.dss-tbl tbody\\) tr:focus-visible\\s*\\{[^}]*' + ring + ';\\s*outline-offset:\\s*-3px'));
  });
  it('eigene Zeile: Ring im Dunkelmodus in Chip-Textfarbe (Kontrast auf der Auswahlfläche)', () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \.dss-tbl tr\.is-own :focus-visible\s*\{\s*outline-color:\s*var\(--hoops-chip-amber-fg\)/);
    expect(css).toMatch(/:root:not\(\[data-theme="light"\]\) \.dss-tbl tr\.is-own :focus-visible\s*\{\s*outline-color:\s*var\(--hoops-chip-amber-fg\)/);
  });
  it('Scrollbereich ist in Svelte und React eine benannte, fokussierbare Region', () => {
    const svelte = read('../svelte/Table.svelte');
    const react = read('../react/Table.tsx');
    expect(svelte).toMatch(/class="dss-table-scroll" role="region" tabindex="0" aria-label=/);
    expect(react).toMatch(/className="dss-table-scroll" role="region" tabIndex=\{0\} aria-label=/);
  });
  it('Svelte-Table hat caption und titleAs wie React', () => {
    const svelte = read('../svelte/Table.svelte');
    expect(svelte).toMatch(/caption = ''/);
    expect(svelte).toMatch(/useHeadingTag\(\(\) => titleAs\)/);
    expect(svelte).toMatch(/<caption class="dss-sr-only">/);
  });
});

describe('PlayByPlay: Verhalten, das die Seite beschreibt', () => {
  it('Feed ist ein log, per Tastatur erreichbar, mit Ring innen', () => {
    expect(read('../svelte/PlayByPlay.svelte')).toMatch(/role="log"[^>]*tabindex="0"/);
    expect(read('../react/PlayByPlay.tsx')).toMatch(/role="log"[^>]*tabIndex=\{0\}/);
    expect(css).toMatch(new RegExp('\\.dss-pbp-feed:focus-visible\\s*\\{[^}]*' + ring + ';\\s*outline-offset:\\s*-3px'));
  });
  it('Animationen (Einblenden, Live-Puls) stoppen bei prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.dss-pbp-event\s*\{\s*animation:\s*none/);
    // Live-Punkte (PlayByPlay, Breadcrumb) laufen über die gemeinsame Live-Animation, siehe tests/live.test.ts
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*[^{}]*\.dss-pbp-dot[^{}]*\.dss-crumb-dot[^{}]*\{\s*animation:\s*none/);
  });
  it('kein Auto-Scroll im Baustein', () => {
    expect(read('../svelte/PlayByPlay.svelte')).not.toMatch(/scrollTo|scrollTop|scrollIntoView/);
    expect(read('../react/PlayByPlay.tsx')).not.toMatch(/scrollTo|scrollTop|scrollIntoView/);
  });
});

describe('Welle 6: alte Seite entfernt', () => {
  it('Docs/Tables & Live-Scoring existiert nicht mehr, die Gruppe Docs auch nicht', () => {
    expect(existsSync(new URL('../stories/docs/TablesDoc.svelte', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../stories/docs/Tables.spec.stories.ts', import.meta.url))).toBe(false);
    const preview = read('../.storybook/preview.ts');
    expect(preview).not.toContain('Tables & Live-Scoring');
    expect(preview).not.toMatch(/'Docs'/);
  });
  it('Seiten Table und PlayByPlay sind MDX und die Stories-Dateien tragen kein autodocs', () => {
    for (const n of ['Table', 'PlayByPlay']) {
      expect(existsSync(new URL(`../stories/${n}.mdx`, import.meta.url))).toBe(true);
      expect(read(`../stories/${n}.stories.ts`)).not.toContain("'autodocs'");
    }
  });
});
