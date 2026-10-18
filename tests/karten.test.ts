// @vitest-environment node
// Karten (Paket 4): PlayerCard mit Foto, Spielabschnitte, TeamCard. CSS-Regeln, Markup-Quelltext, Standardwerte.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, hex, over, ratio } from './helpers/color';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const rule = (selector: string) => {
  const found = css.indexOf(`\n${selector} {`);
  return found < 0 ? '' : css.slice(found + 1, css.indexOf('}', found + 1));
};
const px = (text: string, prop: string) => Number(text.match(new RegExp(`${prop}:\\s*(\\d+)px`))![1]);

describe('PlayerCard mit Foto: CSS', () => {
  it('Avatar 32 px (compact) = Trikotmarke 32 px: die Zeilenhöhe wächst nicht; standard 64 px', () => {
    expect(px(rule('.hoops-pc-av'), 'width')).toBe(px(rule('.hoops-tn.small'), 'width'));
    expect(px(rule('.hoops-pc-av'), 'height')).toBe(px(rule('.hoops-tn.small'), 'height'));
    expect(px(rule('.hoops-pc-av--lg'), 'width')).toBe(px(rule('.hoops-tn.large'), 'width'));
    expect(px(rule('.hoops-pc-av--lg'), 'height')).toBe(64);
  });

  it('Foto: cover, oben ausgerichtet (Gesicht), compact rund, standard abgerundet wie die Trikotmarke', () => {
    expect(rule('.hoops-pc-img')).toMatch(/object-fit:\s*cover/);
    expect(rule('.hoops-pc-img')).toMatch(/object-position:\s*center top/);
    expect(rule('.hoops-pc-av .hoops-pc-img')).toMatch(/border-radius:\s*50%/);
    expect(rule('.hoops-pc-av--lg .hoops-pc-img')).toMatch(/border-radius:\s*14px/);
  });

  it('die Trikotnummer ist ein Badge an der Ecke und behält die Teamfarbe (weiß auf Teamfarbe, ≥ 7:1)', () => {
    const badge = rule('.hoops-tn.hoops-tn--badge');
    expect(badge).toMatch(/position:\s*absolute/);
    expect(badge).toMatch(/bottom:\s*-\d+px/);
    expect(rule('.hoops-tn.heim')).toMatch(/color:\s*white/);
    expect(rule('.hoops-tn.gast')).toMatch(/color:\s*white/);
  });

  it('hero mit Foto: Porträtfläche mit Verlauf nach --hoops-base-1000; unter 560 px Banner oben', () => {
    expect(rule('.hoops-pc-hero--photo')).toMatch(/padding:\s*0/);
    expect(rule('.hoops-pc-hero--photo .hoops-pc-hero-left::after')).toMatch(/linear-gradient\(90deg, transparent \d+%, var\(--hoops-base-1000\)/);
    expect(rule('.hoops-pc-hero--photo .hoops-pc-img')).toMatch(/position:\s*absolute/);
    const mobile = css.slice(css.indexOf('@media (max-width: 560px)', css.indexOf('.hoops-pc-hero--photo')));
    expect(mobile).toMatch(/\.hoops-pc-hero--photo \.hoops-pc-hero-left::after \{ background: linear-gradient\(180deg/);
    expect(mobile).toMatch(/\.hoops-pc-hero--photo \.hoops-pc-hero-right \{ margin-top: -48px/);
  });

  it('weißer Name über dem Bild: auch bei einem weißen Foto unter dem Verlauf (92 % Deckkraft) ≥ 7:1, beide Marken', () => {
    const white = hex('#ffffff');
    const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
    for (const scope of [tokens, `${dbb}\n${tokens}`]) {
      const base = color('var(--hoops-base-1000)', scope);
      expect(ratio(white, over(white, base, 0.08))).toBeGreaterThanOrEqual(7);
    }
    expect(css).toMatch(/color-mix\(in srgb, var\(--hoops-base-1000\) 92%, transparent\)/);
  });
});

describe('PlayerCard mit Foto: Quelltext', () => {
  const sources = ['svelte/PlayerCard.svelte', 'react/PlayerCard.tsx'];

  it.each(sources)('%s: Standard photo und photoAlt leer', (path) => {
    expect(read(path)).toMatch(/photo = '',\s*photoAlt = '',/);
  });

  it.each(sources)('%s: Bild dekorativ per photoAlt, lazy, async, mit Maßen', (path) => {
    const source = read(path);
    expect(source).toMatch(/alt=\{photoAlt\}/);
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
    expect(source).toMatch(/width=\{imgSize\}\s+height=\{imgSize\}/);
  });

  it.each(sources)('%s: Ladefehler-Rückfall (onerror) und Prüfung auf leeres photo', (path) => {
    const source = read(path);
    expect(source).toMatch(/Boolean\(photo\) && photo !== failedUrl/);
    expect(source).toMatch(/onerror=\{\(\) => \(failedUrl = photo\)\}|onError=\{\(\) => setFailedUrl\(photo\)\}/);
  });

  it('Svelte-Datei hat kein <style>', () => {
    expect(read('svelte/PlayerCard.svelte')).not.toContain('<style');
  });
});

describe('Demo-Fotos', () => {
  const dir = new URL('stories/assets/players/', root);
  const files = readdirSync(dir).filter((name) => name.endsWith('.jpg'));

  it('6 bis 10 Fotos, je unter 60 KB, mit Credits', () => {
    expect(files.length).toBeGreaterThanOrEqual(6);
    expect(files.length).toBeLessThanOrEqual(10);
    for (const name of files) expect(statSync(new URL(name, dir)).size, name).toBeLessThan(60 * 1024);
    const credits = read('stories/assets/players/CREDITS.md');
    expect(credits).toContain('https://unsplash.com/license');
    for (const name of files) expect(credits, name).toContain(name);
  });

  it('quadratisch, höchstens 480 px (JPEG-Kopf)', () => {
    for (const name of files) {
      const data = readFileSync(new URL(name, dir));
      let offset = 2;
      let size: [number, number] | undefined;
      while (offset < data.length) {
        const marker = data[offset + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          size = [data.readUInt16BE(offset + 7), data.readUInt16BE(offset + 5)];
          break;
        }
        offset += 2 + data.readUInt16BE(offset + 2);
      }
      expect(size?.[0], name).toBe(size?.[1]);
      expect(size![0], name).toBeLessThanOrEqual(480);
    }
  });

  it('das lokale Ordner images/ wird nirgends referenziert und das Paket veröffentlicht stories/ nicht', () => {
    const pkg = JSON.parse(read('package.json')) as { files: string[] };
    expect(pkg.files.some((entry) => entry.startsWith('stories'))).toBe(false);
    for (const path of ['stories/components/CardLibraryExamples.svelte', 'stories/components/CardLibraryPlayground.svelte', 'stories/CardLibrary.code.ts']) {
      expect(read(path)).not.toMatch(/\.\.\/images\/|['"]images\//);
    }
  });
});

describe('Spielabschnitte: Paket, Quelltext, Demo-Daten', () => {
  it('package.json exportiert ./periods.js mit Typen wie ./schedule.js', () => {
    const pkg = JSON.parse(read('package.json')) as { exports: Record<string, unknown>; files: string[] };
    expect(pkg.exports['./periods.js']).toEqual({ types: './js/periods.d.ts', import: './js/periods.js' });
    expect(pkg.files).toContain('js/');
    expect(read('js/periods.d.ts')).toContain('export function resolvePeriod');
  });

  it.each(['svelte/MatchCard.svelte', 'react/MatchCard.tsx', 'svelte/PlayByPlay.svelte', 'react/PlayByPlay.tsx'])('%s nutzt die gemeinsame Funktion und kennt periods (Standard 4)', (path) => {
    const source = read(path);
    expect(source).toContain("from '../js/periods.js'");
    expect(source).toContain('resolvePeriod(');
    expect(source).toMatch(/periods = 4/);
    expect(source).toContain('@deprecated');
  });

  it('der Alias quarter bleibt in beiden MatchCard-Fassungen', () => {
    expect(read('svelte/MatchCard.svelte')).toMatch(/quarter = '',/);
    expect(read('react/MatchCard.tsx')).toMatch(/quarter = '',/);
  });

  it('Demo-Daten, Beispiele und Code-Beispiele nutzen period statt quarter (außer der Beschreibung des Alias)', () => {
    const files = [
      'stories/components/CardLibraryExamples.svelte', 'stories/components/CardLibraryDemo.svelte', 'stories/components/pbpData.ts',
      'stories/components/PlayByPlayExamples.svelte', 'stories/PlayByPlay.code.ts', 'stories/CardLibrary.code.ts', 'stories/Foundation/Live.svelte',
    ];
    for (const path of files) expect(read(path), path).not.toMatch(/quarter(=|:\s*['"])/);
  });

  it('Doku nennt quarter als veraltet', () => {
    expect(read('stories/CardLibrary.mdx')).toMatch(/`quarter` ist veraltet/);
    expect(read('stories/PlayByPlay.mdx')).toMatch(/Veraltet, Alias/);
    expect(read('stories/CardLibrary.stories.ts')).toMatch(/Veraltet, nur bei `live`/);
  });
});

describe('TeamCard: CSS', () => {
  it('Karte ist positioniert; klickbar: Hover wie die Spielkarte (Rand, Schatten, 1 px hoch)', () => {
    expect(rule('.hoops-team')).toMatch(/position:\s*relative/);
    expect(rule('.hoops-team--link:hover')).toMatch(/border-color:\s*var\(--hoops-line-strong\)/);
    expect(rule('.hoops-team--link:hover')).toMatch(/box-shadow:\s*var\(--hoops-shadow-md\)/);
    expect(rule('.hoops-team--link:hover')).toMatch(/translateY\(-1px\)/);
  });

  it('der Link deckt die ganze Karte ab (::after) und trägt den gestrichelten Ring um die Karte', () => {
    expect(rule('.hoops-team-link::after')).toMatch(/position:\s*absolute;\s*inset:\s*0/);
    const ring = rule('.hoops-team-link:focus-visible::after');
    expect(ring).toMatch(/outline:\s*var\(--hoops-ring-w\) var\(--hoops-ring-style\) var\(--hoops-ring-color\)/);
    expect(ring).toMatch(/outline-offset:\s*2px/);
    expect(rule('.hoops-team-link:focus-visible')).toMatch(/outline:\s*none/);
  });

  it('Bewegung: Übergang aus bei prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.hoops-team \{ transition: none; \} \}/);
  });

  it('Logo 48 px im Kopf, 32 px in compact, 20 px beim Gegner; Initialen als Kreis (Baustein aus Paket 3)', () => {
    expect(px(rule('.hoops-team-logo--lg'), 'width')).toBe(48);
    expect(px(rule('.hoops-team-logo--sm'), 'width')).toBe(20);
    expect(px(rule('.hoops-team--compact .hoops-team-logo'), 'width')).toBe(32);
    expect(px(rule('.hoops-team-head'), 'gap')).toBe(14);
    expect(rule('.hoops-team-head')).toMatch(/grid-template-columns:\s*48px/);
    expect(rule('.hoops-team-logo--initials')).toMatch(/border-radius:\s*50%/);
  });

  it('compact: Listenzeile mit Logo 32, Name und rechter Spalte (Bilanz über Platz)', () => {
    expect(rule('.hoops-team--compact')).toMatch(/grid-template-columns:\s*32px minmax\(0, 1fr\) auto\b(?! auto)/);
  });

  it('Kennzahlen und Werte mit tabular-nums', () => {
    expect(rule('.hoops-pc-v')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(rule('.hoops-team-rec')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(rule('.hoops-team-game-end')).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  it('Spielzeilen brechen um statt die Seite zu verbreitern', () => {
    expect(rule('.hoops-team-game-row')).toMatch(/flex-wrap:\s*wrap/);
    expect(rule('.hoops-team-game-opp')).toMatch(/min-width:\s*0/);
    expect(rule('.hoops-team-who')).toMatch(/min-width:\s*0/);
  });

  it('keine nackten --*-text/--*-soft-Farben und keine festen Farbwerte im TeamCard-Block', () => {
    const start = css.indexOf('/* ── TeamCard');
    const block = css.slice(start, css.indexOf('/* ── Fokus-Ring auf immer dunklen Flächen'));
    expect(block).not.toMatch(/var\(--hoops-(ok|err|warn|info)-(text|soft)\)/);
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,6}\b|rgba?\(|oklch\(/);
  });

  it('Texte der Karte (fg, fg-soft, mute) haben ≥ 7:1 auf der Kartenfläche, hell und dunkel, beide Marken', () => {
    const lightBlock = blockOf(css, ':root {');
    const darkBlock = blockOf(css, ':root[data-theme="dark"] {\n');
    const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
    for (const brand of ['', dbb]) {
      for (const dark of [false, true]) {
        const defs = dark ? darkBlock : lightBlock;
        const scope = `${dark ? darkBlock : ''}\n${lightBlock}\n${brand}\n${tokens}`;
        const pick = (name: string) => defs.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1] ?? lightBlock.match(new RegExp(`${name}:\\s*([^;]+);`))![1];
        const surface = color(pick('--hoops-surface'), scope);
        for (const token of ['--hoops-fg', '--hoops-fg-soft', '--hoops-mute']) {
          expect(ratio(color(pick(token), scope), surface), `${token} ${dark ? 'dunkel' : 'hell'}`).toBeGreaterThanOrEqual(7);
        }
      }
    }
  });
});

describe('TeamCard: Quelltext', () => {
  const sources = ['svelte/TeamCard.svelte', 'react/TeamCard.tsx'];

  it.each(sources)('%s: Standardwerte (size standard, names full, logos aus, Ebene h3 über useHeadingTag)', (path) => {
    const source = read(path);
    expect(source).toMatch(/size = 'standard'/);
    expect(source).toMatch(/names = 'full'/);
    expect(source).toMatch(/logos = false/);
    expect(source).toMatch(/useHeadingTag\(/); // Standard h3 liegt in js/heading.js (resolveHeading)
  });

  it.each(sources)('%s: der Statistik-Block erscheint nur mit Daten (kein leerer Rahmen)', (path) => {
    const source = read(path);
    expect(source).toMatch(/statList\.length(\s*>\s*0)?/);
    expect(source).not.toContain("'–'");
    expect(source).not.toContain('"–"');
  });

  it.each(sources)('%s: nutzt ScheduleTeam-Felder über js/team (kein zweites Datenmodell) und resolveOutcome/ariaForResult aus js/schedule.js', (path) => {
    expect(read(path)).toContain("from '../js/team.js'");
    expect(read('js/team.js')).toContain("import { ariaForResult, resolveOutcome } from './schedule.js'");
    expect(read('js/team.d.ts')).toMatch(/Pick<ScheduleTeam, 'name' \| 'short' \| 'logo'>/);
  });

  it('Svelte-Datei hat kein <style>; Export in package.json und react/index.ts', () => {
    expect(read('svelte/TeamCard.svelte')).not.toContain('<style');
    const pkg = JSON.parse(read('package.json')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./svelte/TeamCard']).toBe('./svelte/TeamCard.svelte');
    expect(pkg.exports['./team.js']).toEqual({ types: './js/team.d.ts', import: './js/team.js' });
    expect(read('react/index.ts')).toMatch(/TeamCard[^;]*from '\.\/TeamCard'/);
  });

  it.each(sources)('%s: Logo dekorativ (leeres alt, aria-hidden, lazy)', (path) => {
    expect(read(path)).toMatch(/alt=(""|\{""\})\s+loading="lazy"/);
    expect(read(path)).toContain('aria-hidden="true"');
  });
});

describe('nachgebessert: Spielkarten-Kopf, Link mit onclick, Badge, Statistik-Raster', () => {
  it('der Kopf der Spielkarte bleibt einzeilig (kein flex-wrap); nur die Live-Karte darf umbrechen', () => {
    expect(rule('.hoops-match-head')).not.toMatch(/flex-wrap/);
    expect(rule('.hoops-match-head')).not.toMatch(/gap/);
    expect(css).not.toMatch(/\n\.hoops-match-head > :last-child/);
    expect(rule('.hoops-match--live .hoops-match-head')).toMatch(/flex-wrap:\s*wrap/);
    expect(rule('.hoops-match--live .hoops-match-head > :last-child')).toMatch(/margin-left:\s*auto/);
  });

  it('die tote Regel für .hoops-team-squad (border-bottom) ist entfernt', () => {
    expect(css).not.toMatch(/\.hoops-team-squad:last-child/);
    expect(css).not.toMatch(/\.hoops-team-stats \+ \.hoops-team-squad/);
  });

  it('compact-Badge: kleiner (16 px) und weiter außen, damit das Gesicht im 32-px-Avatar frei bleibt', () => {
    const badge = css.slice(css.indexOf('.hoops-pc-av:not(.hoops-pc-av--lg) .hoops-tn--badge'), css.indexOf('}', css.indexOf('.hoops-pc-av:not(.hoops-pc-av--lg) .hoops-tn--badge')));
    expect(badge).toMatch(/height:\s*16px/);
    expect(badge).toMatch(/right:\s*-8px/);
    expect(badge).toMatch(/bottom:\s*-8px/);
    const area = (16 - 8) * (16 - 8) / (32 * 32); // sichtbarer Anteil des Badges im Avatar
    expect(area).toBeLessThan(0.1);
  });

  it('Statistik unter 560 px 2 × 2 (statt 3 + 1)', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 560px) {\n  .hoops-team-head'));
    expect(mobile).toMatch(/\.hoops-team-stats \.hoops-team-vitals \{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  });

  it('Svelte-TeamCard gibt onclick auch an den Link weiter (wie React onClick)', () => {
    expect(read('svelte/TeamCard.svelte')).toMatch(/<a class="hoops-team-link" \{href\} \{onclick\}>/);
    expect(read('react/TeamCard.tsx')).toMatch(/<a className="hoops-team-link" href=\{href\} onClick=\{onClick\}>/);
    expect(read('svelte/MatchCard.svelte')).toContain("onclick={tag === 'div' ? undefined : onclick}");
    expect(read('react/MatchCard.tsx')).toMatch(/<a className=\{cls\} href=\{href\} lang=\{i18n\.lang\} onClick=\{onClick\}>/);
  });

  it('TeamCard: last.outcome in Typ und Funktion', () => {
    expect(read('js/team.d.ts')).toMatch(/outcome\?: ScheduleOutcome/);
    expect(read('js/team.js')).toContain('resolveOutcome(game)');
  });

  it('Foundation/Live: TopBar-Uhr „4. Viertel · 02:14“ passend zur Spielkarte', () => {
    expect(read('stories/Foundation/Live.svelte')).toContain('clock="4. Viertel · 02:14"');
  });

  it('jedes Demo-Foto gehört überall zum selben erfundenen Namen (zentrales Mapping)', () => {
    const players = read('stories/components/players.ts');
    for (const [file, name] of [['tanner', 'J. Tanner'], ['okafor', 'M. Okafor'], ['vogler', 'K. Vogler'], ['hollis', 'D. Hollis'], ['mertens', 'G. Mertens'], ['sorell', 'B. Sorell']]) {
      expect(players).toContain(`${file}: { photo: ${file}, name: '${name}'`);
    }
    const examples = read('stories/components/CardLibraryExamples.svelte');
    for (const match of examples.matchAll(/name="([^"]+)"[^>]*photo=\{PLAYERS\.(\w+)\.photo\}/g)) {
      expect(players, match[0]).toContain(`${match[2]}: { photo: ${match[2]}, name: '${match[1]}'`);
    }
    expect(examples).not.toMatch(/mertens[^\n]*K\. Vogler|K\. Vogler[^\n]*mertens/);
  });

  it('Lizenz-Hinweis (kein Model Release) in Doku, README und Credits', () => {
    for (const path of ['stories/CardLibrary.mdx', 'README.md', 'stories/assets/players/CREDITS.md']) {
      expect(read(path), path).toContain('kein Model Release');
    }
  });
});
