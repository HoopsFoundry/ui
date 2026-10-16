// @vitest-environment node
// Namensvarianten und Logos (Paket 3): CSS-Regeln, Markup-Quelltext und Standardwerte in Svelte und React.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, hex, ratio } from './helpers/color';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const rule = (selector: string) => {
  const found = css.indexOf(`\n${selector} {`);
  return found < 0 ? '' : css.slice(found + 1, css.indexOf('}', found + 1));
};
const SR_ONLY = /position:\s*absolute;\s*width:\s*1px;\s*height:\s*1px;[^}]*clip:\s*rect\(0,\s*0,\s*0,\s*0\)/;
const mediaBlock = (head: string, from: number) => {
  const start = css.indexOf(head, from);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
  }
  return '';
};

describe('Namen: Kurzname per CSS, ohne JavaScript', () => {
  it('Standard: Kurzname ist ausgeblendet, voller Name sichtbar', () => {
    expect(rule('.hoops-team-name .hoops-name-short')).toMatch(/display:\s*none/);
    expect(rule('.hoops-team-name .hoops-name-full')).toBe('');
  });

  it('bis 640 px: Kurzname sichtbar, voller Name nur noch für Hilfstechnik (sr-only-Muster, nicht display:none)', () => {
    const block = mediaBlock('@media (max-width: 640px) {\n  .hoops-team-name .hoops-name-short', 0);
    expect(block).toMatch(/\.hoops-team-name \.hoops-name-short\s*\{\s*display:\s*inline/);
    const full = block.slice(block.indexOf('.hoops-team-name .hoops-name-full'));
    expect(full).toMatch(SR_ONLY);
    expect(full).not.toMatch(/display:\s*none/);
  });

  it('names="short": Modifikator zeigt den Kurznamen und versteckt den vollen Namen für das Auge, nicht für Hilfstechnik', () => {
    expect(rule('.hoops-team-name--short .hoops-name-short')).toMatch(/display:\s*inline/);
    expect(rule('.hoops-team-name--short .hoops-name-full')).toMatch(SR_ONLY);
    expect(rule('.hoops-team-name--short .hoops-name-full')).not.toMatch(/display:\s*none/);
  });

  it('der Namens-Wrapper ist positioniert (der versteckte Text verbreitert die Seite nicht)', () => {
    expect(rule('.hoops-team-name')).toMatch(/position:\s*relative/);
  });

  it.each(['svelte/ScheduleTable.svelte', 'svelte/ScheduleGrid.svelte', 'svelte/MatchCard.svelte', 'react/ScheduleParts.tsx', 'react/MatchCard.tsx'])(
    '%s: Kurzname ist aria-hidden, der volle Name nicht',
    (path) => {
      const source = read(path);
      expect(source).toMatch(/hoops-name-short"\s+aria-hidden="true"/);
      expect(source).toContain('hoops-name-full');
      expect(source).not.toMatch(/hoops-name-full"\s+aria-hidden/);
    },
  );
});

describe('Logos: Größen und Darstellung', () => {
  it('28 px, in compact 20 px; Bild contain; dekorativ gedacht (Kachel --hoops-surface-2)', () => {
    const logo = rule('.hoops-team-logo');
    expect(logo).toMatch(/width:\s*28px/);
    expect(logo).toMatch(/height:\s*28px/);
    expect(logo).toMatch(/background:\s*var\(--hoops-surface-2\)/);
    expect(rule('.hoops-team-logo img')).toMatch(/object-fit:\s*contain/);
    const compact = rule('.hoops-tbl--compact .hoops-team-logo');
    expect(compact).toMatch(/width:\s*20px/);
    expect(compact).toMatch(/height:\s*20px/);
  });

  it('Initialen sind ein Kreis', () => {
    expect(rule('.hoops-team-logo--initials')).toMatch(/border-radius:\s*50%/);
  });

  it('MatchCard mit Logos: zusätzliche Spalte von 28 px', () => {
    expect(rule('.hoops-match--logos .hoops-match-team')).toMatch(/grid-template-columns:\s*16px 28px 1fr auto/);
  });

  it('Initialen (--hoops-fg auf --hoops-surface-2) haben ≥ 7:1, hell und dunkel, beide Marken', () => {
    const lightBlock = blockOf(css, ':root {');
    const darkBlock = blockOf(css, ':root[data-theme="dark"] {\n');
    const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
    for (const brand of ['', dbb]) {
      for (const block of [lightBlock, darkBlock]) {
        const scope = `${darkBlock === block ? darkBlock : ''}\n${lightBlock}\n${brand}\n${tokens}`;
        const dark = block === darkBlock;
        const defs = dark ? darkBlock : lightBlock;
        const pick = (name: string) => defs.match(new RegExp(`${name}:\\s*([^;]+);`))![1];
        const fg = color(pick('--hoops-fg'), scope);
        const bg = color(pick('--hoops-surface-2'), scope);
        expect(ratio(fg, bg)).toBeGreaterThanOrEqual(7);
      }
    }
    expect(ratio(hex('#000000'), hex('#ffffff'))).toBeCloseTo(21, 0);
  });
});

describe('Handy: Teams mit Logo untereinander', () => {
  it('bis 640 px je Team eine Zeile, der Gedankenstrich entfällt', () => {
    const start = css.indexOf('.hoops-sch-team--logo + .hoops-sch-sep');
    expect(start).toBeGreaterThan(0);
    const block = css.slice(css.lastIndexOf('@media', start), start + 400);
    expect(block).toMatch(/@media \(max-width: 640px\)/);
    expect(block).toMatch(/\.hoops-sch-match \.hoops-sch-team--logo, \.hoops-sg-teams \.hoops-sch-team--logo\s*\{\s*display:\s*flex/);
    expect(block).toMatch(/\.hoops-sch-team--logo \+ \.hoops-sch-sep\s*\{\s*display:\s*none/);
  });
});

describe('Zeilenhöhen der Dichten bleiben unverändert', () => {
  it('touch 60, default 48, compact 40 px; Logos sind kleiner als Zeile minus Innenabstand', () => {
    expect(rule('.hoops-tbl td')).toMatch(/height:\s*48px/);
    expect(rule('.hoops-tbl--compact td')).toMatch(/height:\s*40px/);
    expect(rule('.hoops-tbl--touch td')).toMatch(/height:\s*60px/);
    const px = (text: string, prop: string) => Number(text.match(new RegExp(`${prop}:\\s*(\\d+)px`))![1]);
    const padding = (selector: string) =>
      Number(css.match(new RegExp(`\\n${selector.replaceAll('.', '\\.')} \\{[^}]*padding-block:\\s*(\\d+)px`))![1]);
    const logo = px(rule('.hoops-team-logo'), 'height');
    const logoCompact = px(rule('.hoops-tbl--compact .hoops-team-logo'), 'height');
    // default: Zeilenhöhe minus Innenabstand oben und unten muss das Logo aufnehmen; compact ebenso
    expect(logo).toBeLessThanOrEqual(px(rule('.hoops-tbl td'), 'height') - 2 * padding('.hoops-tbl--schedule td'));
    expect(logoCompact).toBeLessThanOrEqual(px(rule('.hoops-tbl--compact td'), 'height') - 2 * padding('.hoops-tbl--schedule.hoops-tbl--compact td'));
    expect(logo).toBeLessThanOrEqual(px(rule('.hoops-tbl--touch td'), 'height') - 2 * padding('.hoops-tbl--schedule td'));
  });
});

describe('Standardwerte der Props', () => {
  it('Svelte: names full; logos false (Grid, MatchCard); Tabelle ohne Vorgabe (opponent bleibt an)', () => {
    expect(read('svelte/ScheduleTable.svelte')).toMatch(/names = 'full',\s*logos = undefined,/);
    expect(read('svelte/ScheduleTable.svelte')).toContain('logos !== false');
    expect(read('svelte/ScheduleTable.svelte')).not.toMatch(/logos = true/);
    expect(read('svelte/ScheduleGrid.svelte')).toMatch(/names = 'full',\s*logos = false,/);
    expect(read('svelte/MatchCard.svelte')).toMatch(/names = 'full',\s*logos = false,/);
  });

  it('React: names full; logos false (Grid, MatchCard); Tabelle ohne Vorgabe (opponent bleibt an)', () => {
    expect(read('react/ScheduleTable.tsx')).toMatch(/names = 'full',\s*logos,/);
    expect(read('react/ScheduleTable.tsx')).toContain('logos !== false');
    expect(read('react/ScheduleTable.tsx')).toContain('logo={logos === true}');
    expect(read('react/ScheduleGrid.tsx')).toMatch(/names = 'full',\s*logos = false,/);
    expect(read('react/MatchCard.tsx')).toMatch(/names = 'full',\s*logos = false,/);
  });

  it('Platzhalter bekommen in Svelte und React kein Logo', () => {
    expect(read('svelte/ScheduleTable.svelte')).toContain('!t.placeholder');
    expect(read('react/ScheduleParts.tsx')).toContain('!current.placeholder');
  });

  it('Logo-Bilder sind dekorativ: leerer Alternativtext, lazy', () => {
    for (const path of ['svelte/ScheduleTable.svelte', 'svelte/MatchCard.svelte', 'react/ScheduleParts.tsx']) {
      expect(read(path)).toMatch(/alt=(""|\{""\})\s+loading="lazy"/);
    }
  });
});

describe('Markieren, Tooltip, Freilos, Initialen', () => {
  it('der versteckte volle Name ist nicht markierbar (nur der sichtbare Name wird kopiert), in beiden Regeln', () => {
    expect(rule('.hoops-team-name--short .hoops-name-full')).toMatch(/user-select:\s*none/);
    const block = mediaBlock('@media (max-width: 640px) {\n  .hoops-team-name .hoops-name-short', 0);
    expect(block.slice(block.indexOf('.hoops-team-name .hoops-name-full'))).toMatch(/user-select:\s*none/);
    expect(rule('.hoops-team-name .hoops-name-short')).not.toMatch(/user-select/);
  });

  it.each([
    ['svelte/ScheduleTable.svelte', 'title={t.name}'],
    ['svelte/ScheduleGrid.svelte', 'title={t.name}'],
    ['svelte/MatchCard.svelte', 'title={t.name}'],
    ['react/ScheduleParts.tsx', 'title={team.name}'],
    ['react/MatchCard.tsx', 'title={team.name}'],
  ])('%s: sichtbarer Kurzname trägt den vollen Namen als Tooltip', (path, expected) => {
    expect(read(path)).toMatch(new RegExp(`hoops-name-short"\\s+aria-hidden="true"\\s+${expected.replace(/[{}.]/g, '\\$&')}`));
  });

  it.each(['svelte/ScheduleTable.svelte', 'svelte/ScheduleGrid.svelte'])('%s: Freilos nutzt den Team-Baustein', (path) => {
    expect(read(path)).toMatch(/\{@render team\((game|row\.game)\.heim, false, logos( === true)?\)\} hat Freilos/);
    expect(read(path)).not.toContain('heim.name} hat Freilos');
  });

  it.each(['react/ScheduleTable.tsx', 'react/ScheduleGrid.tsx'])('%s: Freilos nutzt TeamName', (path) => {
    expect(read(path)).toMatch(/<TeamName team=\{(game|row\.game)\.heim\}[^>]*\/> hat Freilos/);
    expect(read(path)).not.toContain('heim.name} hat Freilos');
  });

  it('Initialen im Kreis haben höchstens zwei Buchstaben (Svelte und React)', () => {
    expect(read('svelte/ScheduleTable.svelte')).toContain('initials(current.name, 2)');
    expect(read('svelte/MatchCard.svelte')).toContain('initials(t.name, 2)');
    expect(read('react/ScheduleParts.tsx')).toContain('initials(name, 2)');
  });
});
