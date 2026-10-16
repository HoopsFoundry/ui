// @vitest-environment node
// Hallenkarte: CSS-Abschnitt (Klassen, Breakpoint 640, Zielgrößen), Quelltext der Komponenten, Pakete, Kontraste in Hell/Dunkel und beiden Marken.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, ratio } from './helpers/color';
import { cssRules, sourceRules } from './helpers/venue-rules';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const start = css.indexOf('/* ── VenueCard');
const nextSection = css.indexOf('\n/* ── ', start + 10);
const venue = css.slice(start, nextSection < 0 ? undefined : nextSection);

describe('VenueCard: CSS-Abschnitt', () => {
  it('der Abschnitt existiert, steht nach der LeagueCard und hat ausgeglichene Klammern (Datei und Abschnitt)', () => {
    expect(start).toBeGreaterThan(css.indexOf('/* ── LeagueCard'));
    const depth = (text: string) => {
      let d = 0;
      for (const c of text.replace(/\/\*[\s\S]*?\*\//g, '')) d += c === '{' ? 1 : c === '}' ? -1 : 0;
      return d;
    };
    expect(depth(venue)).toBe(0);
    expect(depth(css)).toBe(0);
  });

  it('enthält alle Klassen des Manifests (und das Manifest verweist auf beide Fassungen)', () => {
    const manifest = JSON.parse(read('parity.manifest.json')) as Record<string, { svelte: string; react: string; css: string[] }>;
    expect(manifest.VenueCard.svelte).toBe('svelte/VenueCard.svelte');
    expect(manifest.VenueCard.react).toBe('react/VenueCard.tsx');
    for (const cls of manifest.VenueCard.css) expect(venue, cls).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
  });

  it('jede Klasse im Markup beider Fassungen steht im CSS-Abschnitt (oder in Karte, Namen/Logos, Chip, Link)', () => {
    const known = new Set([...css.matchAll(/\.(dss-[\w-]+)/g)].map((m) => m[1]));
    for (const path of ['svelte/VenueCard.svelte', 'react/VenueCard.tsx']) {
      const source = read(path);
      const used = new Set([...source.matchAll(/class(?:Name)?="([^"]*dss-[^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => c.startsWith('dss-') && !c.includes('$')));
      for (const cls of used) expect(known.has(cls), `${path}: ${cls}`).toBe(true);
    }
  });

  it.each(Object.entries(cssRules(css)))('%s', (_name, ok) => {
    expect(ok).toBe(true);
  });

  it('Breakpoint 640: genau eine Container-Abfrage mit 640 px, keine Medienabfrage mit anderer Breite', () => {
    expect(venue.match(/@container dss-venue \(max-width: (\d+)px\)/g)).toEqual(['@container dss-venue (max-width: 640px)']);
    expect(venue).not.toMatch(/@media \(max-width/);
  });

  it('schmal: Karte oben vor den Daten (Reihenfolge im Markup: Karte, dann Daten)', () => {
    for (const path of ['svelte/VenueCard.svelte', 'react/VenueCard.tsx']) {
      const source = read(path);
      expect(source.indexOf('dss-venue-map'), path).toBeGreaterThan(-1);
      expect(source.indexOf('dss-venue-map'), path).toBeLessThan(source.indexOf('dss-venue-body'));
    }
  });
});

describe('VenueCard: Quelltext', () => {
  it.each(Object.entries(sourceRules(read('svelte/VenueCard.svelte'), read('react/VenueCard.tsx'))))('%s', (_name, ok) => {
    expect(ok).toBe(true);
  });
  it.each(['svelte/VenueCard.svelte', 'react/VenueCard.tsx'])('%s: gemeinsame Funktionen aus js/venue.js, Karte aus der Map, kein festes Markup für Logik', (path) => {
    const source = read(path);
    expect(source).toContain("from '../js/venue.js'");
    for (const fn of ['addressLines(', 'contactInfo(', 'venueGames(', 'venueMapLinks(', 'venueHref(', 'gameWhen(', 'gameMeta(', 'gameState(']) expect(source, fn).toContain(fn);
    expect(source).toMatch(/from '\.\/Map(\.svelte)?'/);
    expect(source).not.toMatch(/innerHTML|\.exec\(|child_process|execSync/);
    expect(source).not.toMatch(/\{@html/);
  });
  it('Svelte-Datei hat kein <style>', () => {
    expect(read('svelte/VenueCard.svelte')).not.toContain('<style');
  });
  it('package.json exportiert ./venue.js (mit Typen) und ./svelte/VenueCard, React exportiert die Karte und die Typen', () => {
    const pkg = JSON.parse(read('package.json')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./venue.js']).toEqual({ types: './js/venue.d.ts', import: './js/venue.js' });
    expect(pkg.exports['./svelte/VenueCard']).toBe('./svelte/VenueCard.svelte');
    expect(read('react/index.ts')).toMatch(/VenueCard[^;]*type VenueCardProps[^;]*type VenueAddress[^;]*type VenueContact[^;]*from '\.\/VenueCard'/);
  });
});

// ── Kontraste: Text ≥ 7:1 (AAA), Punkte und Rahmen ≥ 3:1; Hell, Dunkel (Media-Query und data-theme), BBV und DBB ──
const blocks = {
  Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
  'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --hoops-fg'),
  'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg'),
};
const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
const FLAECHEN = ['--hoops-surface', '--hoops-surface-2'];

describe('VenueCard: Kontraste', () => {
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${block}\n${brand === 'DBB' ? dbb : ''}\n${tokens}`;
      const c = (token: string) => color(`var(${token})`, scope);
      describe(`${name}, ${brand}`, () => {
        it('Name, Adresse, Info, Kontakt und Mannschaften (--hoops-fg, --hoops-fg-soft) ≥ 7:1 auf Karte und Spielkarte', () => {
          for (const surface of FLAECHEN) {
            expect(ratio(c('--hoops-fg'), c(surface)), `fg auf ${surface}`).toBeGreaterThanOrEqual(7);
            expect(ratio(c('--hoops-fg-soft'), c(surface)), `fg-soft auf ${surface}`).toBeGreaterThanOrEqual(7);
          }
        });
        it('Beschriftungen (--hoops-mute): Kontakt, Block „Nächste Spiele“, Liga und Feld ≥ 7:1', () => {
          for (const surface of FLAECHEN) expect(ratio(c('--hoops-mute'), c(surface)), surface).toBeGreaterThanOrEqual(7);
        });
        it('Links (--hoops-link) ≥ 7:1 auf der Karte', () => {
          expect(ratio(c('--hoops-link'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
        });
        it('Trikotpunkt: Rand (--hoops-mute) ≥ 3:1 auf der Spielkarte', () => {
          expect(ratio(c('--hoops-mute'), c('--hoops-surface-2'))).toBeGreaterThanOrEqual(3);
        });
        it('Chips Live, Abgesagt, Verschoben: Text auf der Chip-Fläche ≥ 7:1', () => {
          for (const tone of ['ok', 'err', 'warn']) expect(ratio(c(`--hoops-chip-${tone}-fg`), c(`--hoops-chip-${tone}-bg`)), tone).toBeGreaterThanOrEqual(7);
        });
      });
    }
  }
});
