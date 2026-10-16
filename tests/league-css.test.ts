// @vitest-environment node
// Ligencard: CSS-Regeln (Handy-Ausblendung, Zonen, Live), Quelltext der Komponenten, Kontraste in Hell/Dunkel und beiden Marken.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, ratio } from './helpers/color';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const start = css.indexOf('/* ── LeagueCard');
// nur bis zum nächsten Abschnittskopf (`/* ── `), nicht bis Dateiende
const nextSection = css.indexOf('\n/* ── ', start + 10);
const league = css.slice(start, nextSection < 0 ? undefined : nextSection);

/** Alle Regeln des LeagueCard-Abschnitts als [Selektor, Rumpf] inklusive der Regeln in @media. */
const RULES: [string, string][] = [...league.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
const body = (selector: string) => RULES.filter(([s]) => s === selector).map(([, b]) => b).join(';');

describe('LeagueCard: CSS-Abschnitt', () => {
  it('der Abschnitt existiert und enthält alle Klassen des Manifests', () => {
    expect(start).toBeGreaterThan(0);
    const manifest = JSON.parse(read('parity.manifest.json')) as Record<string, { css: string[] }>;
    for (const cls of manifest.LeagueCard.css) expect(league, cls).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
  });

  it('Handy (bis 640 px): die optionalen Spalten (Kopf und Zellen) entfallen, Standardspalten bleiben', () => {
    const media = league.slice(league.indexOf('@media (max-width: 640px)'));
    expect(media).toMatch(/\.dss-league-opt \{ display: none; \}/);
    // Standardspalten tragen die Klasse nicht
    for (const path of ['svelte/LeagueCard.svelte', 'react/LeagueCard.tsx']) {
      const source = read(path);
      const lines = source.split('\n');
      for (const needle of ['Mannschaft</th>', 'dss-league-rank', 'dss-league-pts']) {
        for (const line of lines.filter((l) => l.includes(needle))) expect(line, `${path}: ${needle}`).not.toContain('dss-league-opt');
      }
    }
  });

  it('Zonen: Streifen links in der ersten Zelle, eigene Zeile mit Balken; beide zusammen nebeneinander', () => {
    expect(body('.dss-league-tbl tr.is-own td:first-child')).toMatch(/inset 4px 0 0 var\(--hoops-accent-text\)/);
    expect(body('.dss-league-tbl tr.dss-league-zone td:first-child')).toMatch(/inset 4px 0 0 var\(--hoops-league-zone\)/);
    expect(body('.dss-league-tbl tr.is-own.dss-league-zone td:first-child')).toMatch(/inset 4px 0 0 var\(--hoops-league-zone\), inset 8px 0 0 var\(--hoops-accent-text\)/);
    expect(body('.dss-league-zone--up')).toMatch(/--hoops-chip-ok-fg/);
    expect(body('.dss-league-zone--playoff')).toMatch(/--hoops-chip-info-fg/);
    expect(body('.dss-league-zone--down')).toMatch(/--hoops-chip-err-fg/);
  });

  it('Live-Tag: Chip-Token, Puls nur am Punkt (.dss-live-dot, dort aus bei reduzierter Bewegung)', () => {
    expect(body('.dss-league-live')).toMatch(/background:\s*var\(--hoops-chip-ok-bg\)/);
    expect(league).not.toMatch(/animation:/);
    expect(css).toMatch(/\.dss-live-dot,[\s\S]*?animation:\s*none/);
    expect(css).toMatch(/:root\[data-motion="reduce"\] \.dss-live-dot/);
  });

  it('keine nackten --ok/err/warn/info-text oder -soft (haben keinen Dunkelmodus), kein festes Hex, keine Elementselektoren für Überschriften', () => {
    expect(league).not.toMatch(/var\(--hoops-(ok|err|warn|info)-(text|soft|fill)\)/);
    expect(league).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(RULES.filter(([s]) => /(^|[\s>+~,])h[1-6](?![-\w])/.test(s))).toEqual([]);
  });

  it('Titel: Größe aus den Überschriften-Tokens mit Rückfall (standard fs-h3, compact fs-body-lg)', () => {
    expect(body('.dss-league-title')).toMatch(/font-size:\s*var\(--hoops-card-title-size, var\(--hoops-title-size, var\(--hoops-fs-h3\)\)\)/);
    expect(body('.dss-league--compact .dss-league-title')).toMatch(/font-size:\s*var\(--hoops-card-title-size, var\(--hoops-title-size, var\(--hoops-fs-body-lg\)\)\)/);
  });

  it('Karte wie die anderen Karten: Rand, Radius 16 px, Fläche --hoops-surface', () => {
    const card = body('.dss-league');
    expect(card).toMatch(/border:\s*1px solid var\(--hoops-line\)/);
    expect(card).toMatch(/border-radius:\s*16px/);
    expect(card).toMatch(/background:\s*var\(--hoops-surface\)/);
  });

  it('Links: die Namenslinks erben die Textfarbe, der Fuß-Link nutzt .dss-link (gestrichelter Fokus-Ring)', () => {
    expect(body('.dss-tbl .dss-league-link')).toMatch(/color:\s*inherit/);
    expect(body('.dss-tbl .dss-league-link')).toMatch(/min-height:\s*24px/);
    expect(body('.dss-league-more')).toMatch(/min-height:\s*48px/);
    expect(css).toMatch(/\.dss-link:focus-visible[^{]*\{\s*outline:\s*var\(--hoops-ring-w\) var\(--hoops-ring-style\) var\(--hoops-ring-color\)/);
    for (const path of ['svelte/LeagueCard.svelte', 'react/LeagueCard.tsx']) expect(read(path)).toMatch(/dss-link dss-league-more/);
  });

  it('Form: die Spalte nutzt den gemeinsamen Baustein `dss-form` (FormChips), keine eigenen Punkte-Klassen mehr', () => {
    expect(css).not.toMatch(/\.dss-league-dot/);
    for (const path of ['svelte/LeagueCard.svelte', 'react/LeagueCard.tsx']) {
      expect(read(path)).toMatch(/FormChips/);
      expect(read(path)).not.toMatch(/dss-league-dot/);
    }
  });
});

describe('LeagueCard: Quelltext', () => {
  const sources = ['svelte/LeagueCard.svelte', 'react/LeagueCard.tsx'];
  it('Svelte-Datei hat kein <style>', () => {
    expect(read('svelte/LeagueCard.svelte')).not.toContain('<style');
  });
  it.each(sources)('%s: gemeinsame Funktionen aus js/league.js, Standardwerte, kein fester Elementname', (path) => {
    const source = read(path);
    expect(source).toContain("from '../js/league.js'");
    for (const fn of ['leagueWindow(', 'leagueSummary(', 'diffText(', 'windowLabel(', 'zoneLegend(', 'liveInfo(']) expect(source, fn).toContain(fn);
    expect(source).toContain("linkLabel = 'Komplette Tabelle und Spielplan'");
    expect(source).toMatch(/limit = 3/);
    expect(source).toMatch(/size = 'standard'/);
    expect(source).not.toMatch(/<h[1-6][\s>]|<\/h[1-6]>/);
    expect(source).toContain('dss-league-title');
  });
  it.each(sources)('%s: Titelebene über useHeadingTag, versteckte Texte für eigene Zeile, Zone und Form', (path) => {
    const source = read(path);
    expect(source).toMatch(/useHeadingTag\(/);
    expect(source).toContain(', eigene Mannschaft');
    expect(source).toContain('zone.row');
    expect(source).toContain('<FormChips form={t.form ?? []}');
    // der versteckte Text kommt aus formLabel (eine Quelle in FormChips)
    expect(read(path.includes('svelte') ? 'svelte/FormChips.svelte' : 'react/FormChips.tsx')).toContain('formLabel(form)');
    expect(source).toContain('role="region"');
  });
  it('package.json exportiert ./league.js (mit Typen) und ./svelte/LeagueCard', () => {
    const pkg = JSON.parse(read('package.json')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./league.js']).toEqual({ types: './js/league.d.ts', import: './js/league.js' });
    expect(pkg.exports['./svelte/LeagueCard']).toBe('./svelte/LeagueCard.svelte');
    expect(read('react/index.ts')).toMatch(/LeagueCard[^;]*type LeagueTeam[^;]*from '\.\/LeagueCard'/);
  });
});

// ── Kontraste: Text ≥ 7:1 (AAA), Streifen, Punkte und Rahmen ≥ 3:1; Hell, Dunkel (Media-Query und data-theme), BBV und DBB ──
const blocks = {
  Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
  'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --hoops-fg'),
  'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg'),
};
const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
const FLAECHEN = ['--hoops-surface', '--hoops-surface-2', '--hoops-hover-bg', '--hoops-selected-bg'];

describe('LeagueCard: Kontraste', () => {
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${block}\n${brand === 'DBB' ? dbb : ''}\n${tokens}`;
      const c = (token: string) => color(`var(${token})`, scope);
      describe(`${name}, ${brand}`, () => {
        it('Text: --hoops-fg und --hoops-fg-soft ≥ 7:1 auf allen Flächen der Tabelle', () => {
          for (const surface of FLAECHEN) {
            expect(ratio(c('--hoops-fg'), c(surface)), `fg auf ${surface}`).toBeGreaterThanOrEqual(7);
            expect(ratio(c('--hoops-fg-soft'), c(surface)), `fg-soft auf ${surface}`).toBeGreaterThanOrEqual(7);
          }
        });
        it('Untertitel und Kopfzeile (--hoops-mute auf Karte und --hoops-surface-2) ≥ 7:1, Ring der Form-Ringe auf der eigenen Zeile', () => {
          for (const surface of ['--hoops-surface', '--hoops-surface-2', '--hoops-hover-bg']) expect(ratio(c('--hoops-mute'), c(surface)), surface).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-mute-on-selected'), c('--hoops-selected-bg'))).toBeGreaterThanOrEqual(7);
        });
        it('Fußlink --hoops-link ≥ 7:1 auf Karte', () => {
          expect(ratio(c('--hoops-link'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-link'), c('--hoops-hover-bg'))).toBeGreaterThanOrEqual(7);
        });
        it('Diff-Zahlen (Plus grün, Minus rot) ≥ 7:1 auf allen Flächen', () => {
          for (const surface of FLAECHEN) {
            expect(ratio(c('--hoops-chip-ok-fg'), c(surface)), `plus auf ${surface}`).toBeGreaterThanOrEqual(7);
            expect(ratio(c('--hoops-chip-err-fg'), c(surface)), `minus auf ${surface}`).toBeGreaterThanOrEqual(7);
          }
        });
        it('Live-Tag: Text und Punkt (--hoops-chip-ok-fg) auf --hoops-chip-ok-bg ≥ 7:1', () => {
          expect(ratio(c('--hoops-chip-ok-fg'), c('--hoops-chip-ok-bg'))).toBeGreaterThanOrEqual(7);
        });
        it('Zonenstreifen, Legende, Form-Punkte und Balken der eigenen Zeile ≥ 3:1 auf den Flächen', () => {
          for (const surface of FLAECHEN) {
            for (const token of ['--hoops-chip-ok-fg', '--hoops-chip-info-fg', '--hoops-chip-err-fg', '--hoops-accent-text']) {
              expect(ratio(c(token), c(surface)), `${token} auf ${surface}`).toBeGreaterThanOrEqual(3);
            }
          }
          expect(ratio(c('--hoops-mute'), c('--hoops-surface'))).toBeGreaterThanOrEqual(3);
        });
        it('Legendentext --hoops-fg-soft ≥ 7:1 auf der Karte', () => {
          expect(ratio(c('--hoops-fg-soft'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
        });
      });
    }
  }
});
