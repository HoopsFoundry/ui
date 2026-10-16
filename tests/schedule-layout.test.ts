// @vitest-environment node
// Spielplan-Korrekturen (Paket 1): Regeln im CSS und Markup-Parität Svelte/React.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const css = read('css/components.css');
const rule = (selector: string) => {
  const found = css.indexOf(`\n${selector} {`);
  return found < 0 ? '' : css.slice(found + 1, css.indexOf('}', found + 1));
};

describe('Vorläufig steht unter der Ergebniszahl', () => {
  it('Ergebnis-Box ist ein Raster: Zahl in Zeile 1, Tag in Zeile 2, gleiche Spalte', () => {
    expect(rule('.dss-sch-resbox')).toMatch(/display:\s*inline-grid/);
    expect(rule('.dss-sch-resbox .dss-sch-score')).toMatch(/grid-row:\s*1/);
    expect(rule('.dss-sch-resbox .dss-sch-prov')).toMatch(/grid-row:\s*2/);
    expect(rule('.dss-sch-resbox .dss-sch-score')).toMatch(/grid-column:\s*2/);
    expect(rule('.dss-sch-resbox .dss-sch-prov')).toMatch(/grid-column:\s*2/);
  });

  it('das Tag ist klein (Beschriftungsschrift) und gedämpft, das alte "small" hinter der Zahl ist weg', () => {
    const tag = rule('.dss-sch-prov');
    expect(tag).toMatch(/font-size:\s*var\(--hoops-fs-caption\)/);
    expect(tag).toMatch(/color:\s*var\(--hoops-mute\)/);
    expect(css).not.toMatch(/\.dss-sch-res small/);
  });

  it('die Zahl behält ihre Ausrichtung: rechts, im Layout columns mittig', () => {
    expect(rule('.dss-sch-resbox')).toMatch(/justify-items:\s*end/);
    expect(rule('.dss-sch--columns .dss-sch-resbox')).toMatch(/justify-items:\s*center/);
  });

  it('die Dichte-Höhen gelten auch mit Tag (weniger Innenabstand in der Ergebniszelle)', () => {
    expect(rule('.dss-tbl--schedule.dss-tbl--default td.dss-sch-res')).toMatch(/padding-block:\s*6px/);
    expect(rule('.dss-tbl--schedule.dss-tbl--compact td.dss-sch-res')).toMatch(/padding-block:\s*2px/);
  });

  it.each(['svelte/ScheduleTable.svelte', 'svelte/ScheduleGrid.svelte', 'react/ScheduleParts.tsx'])(
    '%s: Tag in der Ergebnis-Box, nicht mehr als lose Zusatzangabe',
    (path) => {
      const source = read(path);
      expect(source).toContain('dss-sch-resbox');
      expect(source).toContain('dss-sch-prov');
    },
  );
});

describe('Zeitraster: Live steht neben Paarung oder Ergebnis', () => {
  it('Ergebnis und Live-Tag teilen sich eine Flex-Zeile, die erst bei Platzmangel umbricht', () => {
    const result = rule('.dss-sg-result');
    expect(result).toMatch(/display:\s*flex/);
    expect(result).toMatch(/flex-wrap:\s*wrap/);
    expect(result).toMatch(/align-items:\s*center/);
  });

  it('mit Stand steht das Tag in der Ergebnis-Zeile, ohne Stand hinter der Paarung (Svelte und React)', () => {
    const svelte = read('svelte/ScheduleGrid.svelte');
    const react = read('react/ScheduleGrid.tsx');
    // Das Live-Tag steht nicht mehr als eigener Block zwischen Paarung und Ergebnis
    expect(svelte).toMatch(/<div class="dss-sg-result">[\s\S]*?Live[\s\S]*?<\/div>/);
    expect(svelte).toMatch(/!hasScore\(game, 'versus'\)/);
    expect(react).toMatch(/!hasScore\(game, 'versus'\) \? <LiveTag \/>/);
    expect(react).toMatch(/<\/ResultText>|<ResultText[\s\S]*?\/>\s*\{game\.state === 'live' \? <LiveTag \/> : null\}/);
  });
});

describe('Chips: Text sitzt vertikal mittig', () => {
  it('Mono-Chips verschieben 1 px Innenabstand nach oben, Gesamthöhe bleibt 24 + 4 px', () => {
    expect(rule('.dss-chip--mono')).toMatch(/padding-block:\s*3px 1px/);
    expect(rule('.dss-chip')).toMatch(/min-height:\s*24px/);
  });

  it('der Feld-Chip behält inline-block (Auslassungspunkte), setzt aber line-height auf die Inhaltshöhe', () => {
    const field = rule('.dss-sch-field');
    expect(field).toMatch(/display:\s*inline-block/);
    expect(field).toMatch(/line-height:\s*24px/);
    expect(field).toMatch(/padding-block:\s*2px/);
  });

  it('der Link-Chip bleibt 44 px hoch (43 px + 1 px Innenabstand oben)', () => {
    const link = rule('.dss-chip--link');
    expect(link).toMatch(/min-height:\s*43px/);
    expect(link).toMatch(/padding:\s*1px 14px 0/);
  });
});

describe('Handy, Layout opponent: Uhrzeit oben, vs./@ vor dem Gegner', () => {
  const mobile = css.slice(css.indexOf('Handy: jede Zeile wird zur Karte'), css.indexOf('Spielplan · ScheduleGrid'));

  it('erste Kartenzeile gehört Datum und Uhrzeit über die ganze Breite, zweite Zeile vs./@, Gegner, Ergebnis', () => {
    expect(mobile).toMatch(/\.dss-sch--opponent tr\.dss-sch-row \{[^}]*grid-template-areas:\s*"when when when" "ha match res"/);
    expect(mobile).toMatch(/\.dss-sch--opponent tr\.dss-sch-row \{[^}]*grid-template-columns:\s*auto 1fr auto/);
  });

  it('Datum und Uhrzeit stehen in einer Zeile (mit Trennpunkt), auch in der Dichte touch', () => {
    expect(mobile).toMatch(/\.dss-tbl--schedule\.dss-sch--opponent \.dss-sch-date \{ display: inline; \}/);
    expect(mobile).toMatch(/\.dss-sch--opponent \.dss-sch-date \+ \.dss-sch-time::before \{ content: " · "/);
  });

  it('der vs./@-Chip steht links (nicht mehr rechts oben)', () => {
    expect(mobile).toMatch(/td\.dss-sch-ha \{ grid-area: ha; text-align: left;/);
    expect(mobile).not.toMatch(/td\.dss-sch-ha \{[^}]*text-align: right/);
  });

  it.each(['svelte/ScheduleTable.svelte', 'react/ScheduleTable.tsx'])(
    '%s: DOM-Reihenfolge Zeit, Heim/Auswärts, Gegner, Ergebnis bleibt (Screenreader)',
    (path) => {
      const source = read(path);
      const order = ["'when'", "'ha'", "'match'"].map((key) => source.indexOf(`col.key === ${key}`) >= 0 ? source.indexOf(`col.key === ${key}`) : source.indexOf(`case ${key}`));
      expect(order.every((i) => i >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(source).toContain('role="cell"');
    },
  );
});
